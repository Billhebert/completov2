// src/modules/erp/paypal-recurring.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission, validateBody } from '../../core/middleware';
import { EventBus, Events } from '../../core/event-bus';
import { z } from 'zod';
import axios from 'axios';

const PAYPAL_API = process.env.PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

const paypalOrderSchema = z.object({
  invoiceId: z.string(),
  returnUrl: z.string(),
  cancelUrl: z.string(),
});

const recurringInvoiceSchema = z.object({
  contactId: z.string(),
  productIds: z.array(z.string()),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
  startDate: z.string(),
  endDate: z.string().optional(),
  autoSend: z.boolean().default(true),
  emailReminder: z.boolean().default(true),
});

export function setupPayPalRecurringRoutes(router: Router, prisma: PrismaClient, eventBus: EventBus) {
  
  // Get PayPal access token
  async function getPayPalToken() {
    const auth = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
    ).toString('base64');

    const response = await axios.post(
      `${PAYPAL_API}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.data.access_token;
  }

  // ===== PAYPAL INTEGRATION =====

  // Create PayPal order
  router.post('/paypal/orders',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.INVOICE_CREATE),
    validateBody(paypalOrderSchema),
    async (req, res, next) => {
      try {
        const { invoiceId, returnUrl, cancelUrl } = req.body;

        // Get invoice
        const invoice = await prisma.invoice.findFirst({
          where: {
            id: invoiceId,
            companyId: req.companyId!,
          },
          include: {
            items: true,
          },
        });

        if (!invoice) {
          return res.status(404).json({
            success: false,
            error: { message: 'Invoice not found' },
          });
        }

        const token = await getPayPalToken();

        // Create PayPal order
        const orderData = {
          intent: 'CAPTURE',
          purchase_units: [
            {
              reference_id: invoice.id,
              amount: {
                currency_code: 'USD',
                value: invoice.total.toString(),
                breakdown: {
                  item_total: {
                    currency_code: 'USD',
                    value: invoice.subtotal.toString(),
                  },
                  tax_total: {
                    currency_code: 'USD',
                    value: (invoice.total - invoice.subtotal).toString(),
                  },
                },
              },
              items: invoice.items.map(item => ({
                name: item.description,
                quantity: item.quantity.toString(),
                unit_amount: {
                  currency_code: 'USD',
                  value: item.price.toString(),
                },
              })),
            },
          ],
          application_context: {
            return_url: returnUrl,
            cancel_url: cancelUrl,
          },
        };

        const response = await axios.post(
          `${PAYPAL_API}/v2/checkout/orders`,
          orderData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        // Save payment record
        await prisma.payment.create({
          data: {
            invoiceId: invoice.id,
            amount: invoice.total,
            currency: 'USD',
            status: 'pending',
            provider: 'paypal',
            providerPaymentId: response.data.id,
            providerData: JSON.stringify(response.data),
            companyId: req.companyId!,
          },
        });

        res.status(201).json({
          success: true,
          data: {
            orderId: response.data.id,
            approvalUrl: response.data.links.find((l: any) => l.rel === 'approve')?.href,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // Capture PayPal order
  router.post('/paypal/orders/:orderId/capture',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.INVOICE_UPDATE),
    async (req, res, next) => {
      try {
        const token = await getPayPalToken();

        const response = await axios.post(
          `${PAYPAL_API}/v2/checkout/orders/${req.params.orderId}/capture`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        // Update payment
        const payment = await prisma.payment.findFirst({
          where: { providerPaymentId: req.params.orderId },
        });

        if (payment) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'completed',
              providerData: JSON.stringify(response.data),
            },
          });

          // Update invoice
          if (payment.invoiceId) {
            await prisma.invoice.update({
              where: { id: payment.invoiceId },
              data: {
                status: 'paid',
                paidAt: new Date(),
              },
            });
          }

          await eventBus.publish(Events.PAYMENT_COMPLETED, {
            type: Events.PAYMENT_COMPLETED,
            version: 'v1',
            timestamp: new Date(),
            companyId: req.companyId!,
            userId: req.user!.id,
            data: { paymentId: payment.id },
          });
        }

        res.json({ success: true, data: response.data });
      } catch (error) {
        next(error);
      }
    }
  );

  // PayPal webhook
  router.post('/paypal/webhooks',
    async (req, res, next) => {
      try {
        const event = req.body;

        switch (event.event_type) {
          case 'PAYMENT.CAPTURE.COMPLETED': {
            const capture = event.resource;
            
            await prisma.payment.updateMany({
              where: { providerPaymentId: capture.id },
              data: {
                status: 'completed',
                providerData: JSON.stringify(capture),
              },
            });
            break;
          }

          case 'PAYMENT.CAPTURE.DENIED':
          case 'PAYMENT.CAPTURE.REFUNDED': {
            const capture = event.resource;
            
            await prisma.payment.updateMany({
              where: { providerPaymentId: capture.id },
              data: {
                status: event.event_type.includes('REFUNDED') ? 'refunded' : 'failed',
                providerData: JSON.stringify(capture),
              },
            });
            break;
          }
        }

        res.json({ success: true });
      } catch (error) {
        next(error);
      }
    }
  );

  // ===== RECURRING INVOICES =====

  // Create recurring invoice
  router.post('/invoices/recurring',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.INVOICE_CREATE),
    validateBody(recurringInvoiceSchema),
    async (req, res, next) => {
      try {
        const recurring = await prisma.recurringInvoice.create({
          data: {
            ...req.body,
            productIds: req.body.productIds,
            companyId: req.companyId!,
            createdById: req.user!.id,
            nextInvoiceDate: new Date(req.body.startDate),
            status: 'active',
          },
        });

        res.status(201).json({ success: true, data: recurring });
      } catch (error) {
        next(error);
      }
    }
  );

  // List recurring invoices
  router.get('/invoices/recurring',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.INVOICE_READ),
    async (req, res, next) => {
      try {
        const { status, contactId } = req.query;

        const where: any = { companyId: req.companyId! };
        if (status) where.status = status;
        if (contactId) where.contactId = contactId;

        const recurring = await prisma.recurringInvoice.findMany({
          where,
          include: {
            contact: { select: { id: true, name: true, email: true } },
            createdBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        });

        res.json({ success: true, data: recurring });
      } catch (error) {
        next(error);
      }
    }
  );

  // Update recurring invoice
  router.patch('/invoices/recurring/:id',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.INVOICE_UPDATE),
    async (req, res, next) => {
      try {
        const recurring = await prisma.recurringInvoice.update({
          where: { id: req.params.id },
          data: req.body,
        });

        res.json({ success: true, data: recurring });
      } catch (error) {
        next(error);
      }
    }
  );

  // Pause recurring invoice
  router.post('/invoices/recurring/:id/pause',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.INVOICE_UPDATE),
    async (req, res, next) => {
      try {
        await prisma.recurringInvoice.update({
          where: { id: req.params.id },
          data: { status: 'paused' },
        });

        res.json({ success: true, message: 'Recurring invoice paused' });
      } catch (error) {
        next(error);
      }
    }
  );

  // Resume recurring invoice
  router.post('/invoices/recurring/:id/resume',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.INVOICE_UPDATE),
    async (req, res, next) => {
      try {
        await prisma.recurringInvoice.update({
          where: { id: req.params.id },
          data: { status: 'active' },
        });

        res.json({ success: true, message: 'Recurring invoice resumed' });
      } catch (error) {
        next(error);
      }
    }
  );

  // Generate invoices (cron job endpoint)
  router.post('/invoices/recurring/generate',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.INVOICE_CREATE),
    async (req, res, next) => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get recurring invoices due today
        const dueRecurring = await prisma.recurringInvoice.findMany({
          where: {
            companyId: req.companyId!,
            status: 'active',
            nextInvoiceDate: {
              lte: today,
            },
          },
          include: {
            contact: true,
          },
        });

        const generated = [];

        for (const recurring of dueRecurring) {
          // Get products
          const products = await prisma.product.findMany({
            where: {
              id: { in: recurring.productIds },
              companyId: req.companyId!,
            },
          });

          // Generate invoice number
          const count = await prisma.invoice.count({
            where: { companyId: req.companyId! },
          });
          const invoiceNumber = `INV-${String(count + 1).padStart(6, '0')}`;

          // Calculate totals
          const subtotal = products.reduce((sum, p) => sum + p.price, 0);
          const total = subtotal; // Add tax calculation here

          // Create invoice
          const invoice = await prisma.invoice.create({
            data: {
              number: invoiceNumber,
              contactId: recurring.contactId,
              dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
              subtotal,
              total,
              status: 'draft',
              companyId: req.companyId!,
              items: {
                create: products.map(p => ({
                  description: p.name,
                  quantity: 1,
                  price: p.price,
                  total: p.price,
                })),
              },
            },
          });

          // Auto-send if enabled
          if (recurring.autoSend) {
            await prisma.invoice.update({
              where: { id: invoice.id },
              data: { status: 'sent', sentAt: new Date() },
            });

            // Send email (implement email sending)
          }

          // Update next invoice date
          const nextDate = calculateNextDate(recurring.nextInvoiceDate, recurring.frequency);
          await prisma.recurringInvoice.update({
            where: { id: recurring.id },
            data: {
              nextInvoiceDate: nextDate,
              lastInvoiceDate: new Date(),
            },
          });

          generated.push(invoice);
        }

        res.json({
          success: true,
          data: {
            generated: generated.length,
            invoices: generated,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );
}

// Helper function
function calculateNextDate(currentDate: Date, frequency: string): Date {
  const next = new Date(currentDate);
  
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  
  return next;
}
