// src/modules/erp/payment-gateway.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission, validateBody } from '../../core/middleware';
import { EventBus, Events } from '../../core/event-bus';
import { z } from 'zod';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
});

const paymentIntentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default('usd'),
  invoiceId: z.string().optional(),
  customerId: z.string().optional(),
  paymentMethod: z.string().optional(),
  description: z.string().optional(),
  metadata: z.record(z.string()).optional(),
});

const setupIntentSchema = z.object({
  customerId: z.string(),
  paymentMethod: z.string().optional(),
});

export function setupPaymentRoutes(router: Router, prisma: PrismaClient, eventBus: EventBus) {
  
  // Create payment intent (Stripe)
  router.post('/payments/intent',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.INVOICE_CREATE),
    validateBody(paymentIntentSchema),
    async (req, res, next) => {
      try {
        const { amount, currency, invoiceId, customerId, description, metadata } = req.body;

        // Create Stripe payment intent
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency,
          description,
          metadata: {
            ...metadata,
            companyId: req.companyId!,
            invoiceId: invoiceId || '',
          },
          automatic_payment_methods: {
            enabled: true,
          },
        });

        // Save to database
        const payment = await prisma.payment.create({
          data: {
            companyId: req.companyId!,
            invoiceId,
            amount,
            currency,
            status: 'pending',
            provider: 'stripe',
            providerPaymentId: paymentIntent.id,
            providerData: JSON.stringify(paymentIntent),
          },
        });

        res.status(201).json({
          success: true,
          data: {
            paymentId: payment.id,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // Confirm payment
  router.post('/payments/:id/confirm',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.INVOICE_UPDATE),
    async (req, res, next) => {
      try {
        const payment = await prisma.payment.findFirst({
          where: {
            id: req.params.id,
            companyId: req.companyId!,
          },
        });

        if (!payment) {
          return res.status(404).json({
            success: false,
            error: { message: 'Payment not found' },
          });
        }

        // Confirm with Stripe
        const paymentIntent = await stripe.paymentIntents.confirm(
          payment.providerPaymentId!
        );

        // Update payment
        const updated = await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: paymentIntent.status === 'succeeded' ? 'completed' : 'pending',
            providerData: JSON.stringify(paymentIntent),
          },
        });

        // Update invoice if exists
        if (payment.invoiceId) {
          await prisma.invoice.update({
            where: { id: payment.invoiceId },
            data: {
              status: paymentIntent.status === 'succeeded' ? 'paid' : 'pending',
              paidDate: paymentIntent.status === 'succeeded' ? new Date() : null,
            },
          });
        }

        if (paymentIntent.status === 'succeeded') {
          await eventBus.publish(Events.PAYMENT_COMPLETED, {
            type: Events.PAYMENT_COMPLETED,
            version: 'v1',
            timestamp: new Date(),
            companyId: req.companyId!,
            userId: req.user!.id,
            data: { paymentId: payment.id, amount: payment.amount },
          });
        }

        res.json({ success: true, data: updated });
      } catch (error) {
        next(error);
      }
    }
  );

  // Create customer (Stripe)
  router.post('/payments/customers',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_CREATE),
    validateBody(z.object({
      contactId: z.string(),
      email: z.string().email(),
      name: z.string(),
      phone: z.string().optional(),
    })),
    async (req, res, next) => {
      try {
        const { contactId, email, name, phone } = req.body;

        // Create Stripe customer
        const customer = await stripe.customers.create({
          email,
          name,
          phone,
          metadata: {
            companyId: req.companyId!,
            contactId,
          },
        });

        // Update contact
        await prisma.contact.update({
          where: { id: contactId },
          data: {
            stripeCustomerId: customer.id,
          },
        });

        res.status(201).json({
          success: true,
          data: {
            customerId: customer.id,
            contact: contactId,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // Create subscription
  router.post('/payments/subscriptions',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.INVOICE_CREATE),
    validateBody(z.object({
      customerId: z.string(),
      priceId: z.string(),
      contactId: z.string(),
    })),
    async (req, res, next) => {
      try {
        const { customerId, priceId, contactId } = req.body;

        // Create subscription
        const subscription = await stripe.subscriptions.create({
          customer: customerId,
          items: [{ price: priceId }],
          metadata: {
            companyId: req.companyId!,
            contactId,
          },
        });

        // Save to database
        const currentPeriodStart = (subscription as any).current_period_start;
        const currentPeriodEnd = (subscription as any).current_period_end;

        const sub = await prisma.subscription.create({
          data: {
            companyId: req.companyId!,
            contactId,
            plan: 'standard', // Default plan
            provider: 'stripe',
            providerSubscriptionId: subscription.id,
            status: subscription.status,
            currentPeriodStart: currentPeriodStart
              ? new Date(currentPeriodStart * 1000)
              : undefined,
            currentPeriodEnd: currentPeriodEnd
              ? new Date(currentPeriodEnd * 1000)
              : undefined,
            providerData: JSON.stringify(subscription),
            features: {},
          },
        });

        res.status(201).json({ success: true, data: sub });
      } catch (error) {
        next(error);
      }
    }
  );

  // Webhook handler (Stripe)
  router.post('/payments/webhooks/stripe',
    async (req, res, next) => {
      try {
        const sig = req.headers['stripe-signature'] as string;
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

        let event: Stripe.Event;

        try {
          event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            webhookSecret
          );
        } catch (err: any) {
          return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        // Handle events
        switch (event.type) {
          case 'payment_intent.succeeded': {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            
            // Update payment
            await prisma.payment.updateMany({
              where: { providerPaymentId: paymentIntent.id },
              data: {
                status: 'completed',
                providerData: JSON.stringify(paymentIntent),
              },
            });

            // Update invoice if exists
            const payment = await prisma.payment.findFirst({
              where: { providerPaymentId: paymentIntent.id },
            });

            if (payment?.invoiceId) {
              await prisma.invoice.update({
                where: { id: payment.invoiceId },
                data: {
                  status: 'paid',
                  paidDate: new Date(),
                },
              });
            }

            break;
          }

          case 'payment_intent.payment_failed': {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            
            await prisma.payment.updateMany({
              where: { providerPaymentId: paymentIntent.id },
              data: {
                status: 'failed',
                providerData: JSON.stringify(paymentIntent),
              },
            });

            break;
          }

          case 'customer.subscription.deleted': {
            const subscription = event.data.object as Stripe.Subscription;
            
            await prisma.subscription.updateMany({
              where: { providerSubscriptionId: subscription.id },
              data: {
                status: 'cancelled',
                cancelledAt: new Date(),
              },
            });

            break;
          }

          case 'invoice.paid': {
            const invoice = event.data.object as Stripe.Invoice;

            // Handle subscription invoice paid
            const subscriptionId = (invoice as any).subscription;
            if (subscriptionId && typeof subscriptionId === 'string') {
              const periodStart = (invoice as any).period_start;
              const periodEnd = (invoice as any).period_end;

              await prisma.subscription.updateMany({
                where: { providerSubscriptionId: subscriptionId },
                data: {
                  status: 'active',
                  currentPeriodStart: periodStart
                    ? new Date(periodStart * 1000)
                    : undefined,
                  currentPeriodEnd: periodEnd
                    ? new Date(periodEnd * 1000)
                    : undefined,
                },
              });
            }

            break;
          }
        }

        res.json({ received: true });
      } catch (error) {
        next(error);
      }
    }
  );

  // Get payment methods
  router.get('/payments/methods/:customerId',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.INVOICE_READ),
    async (req, res, next) => {
      try {
        const paymentMethods = await stripe.paymentMethods.list({
          customer: req.params.customerId,
          type: 'card',
        });

        res.json({ success: true, data: paymentMethods.data });
      } catch (error) {
        next(error);
      }
    }
  );

  // Refund payment
  router.post('/payments/:id/refund',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.INVOICE_UPDATE),
    validateBody(z.object({
      amount: z.number().positive().optional(),
      reason: z.string().optional(),
    })),
    async (req, res, next) => {
      try {
        const payment = await prisma.payment.findFirst({
          where: {
            id: req.params.id,
            companyId: req.companyId!,
          },
        });

        if (!payment) {
          return res.status(404).json({
            success: false,
            error: { message: 'Payment not found' },
          });
        }

        const refund = await stripe.refunds.create({
          payment_intent: payment.providerPaymentId!,
          amount: req.body.amount ? Math.round(req.body.amount * 100) : undefined,
          reason: req.body.reason as any,
        });

        // Update payment
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'refunded',
            refundedAt: new Date(),
            refundAmount: refund.amount / 100,
          },
        });

        res.json({ success: true, data: refund });
      } catch (error) {
        next(error);
      }
    }
  );

  // Get payment history
  router.get('/payments/history',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.INVOICE_READ),
    async (req, res, next) => {
      try {
        const { status, startDate, endDate, page = '1', limit = '20' } = req.query;

        const where: any = { companyId: req.companyId! };
        
        if (status) where.status = status;
        if (startDate || endDate) {
          where.createdAt = {};
          if (startDate) where.createdAt.gte = new Date(startDate as string);
          if (endDate) where.createdAt.lte = new Date(endDate as string);
        }

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        const [payments, total] = await Promise.all([
          prisma.payment.findMany({
            where,
            skip,
            take: parseInt(limit as string),
            include: {
              invoice: { select: { id: true, number: true } },
            },
            orderBy: { createdAt: 'desc' },
          }),
          prisma.payment.count({ where }),
        ]);

        res.json({
          success: true,
          data: payments,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total,
            pages: Math.ceil(total / parseInt(limit as string)),
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );
}
