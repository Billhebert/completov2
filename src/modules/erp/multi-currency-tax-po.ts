// src/modules/erp/multi-currency-tax-po.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission, validateBody } from '../../core/middleware';
import { z } from 'zod';
import axios from 'axios';

const purchaseOrderSchema = z.object({
  supplierId: z.string(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number(),
    price: z.number(),
  })),
  deliveryDate: z.string().optional(),
  notes: z.string().optional(),
});

const taxRuleSchema = z.object({
  name: z.string(),
  rate: z.number(),
  jurisdiction: z.string(),
  taxType: z.enum(['sales', 'vat', 'gst']),
  applicableProductTypes: z.array(z.string()).optional(),
});

export function setupMultiCurrencyTaxPORoutes(router: Router, prisma: PrismaClient) {
  
  // ===== MULTI-CURRENCY =====

  // Get exchange rates
  router.get('/currency/rates',
    authenticate,
    async (req, res, next) => {
      try {
        const { base = 'USD', symbols } = req.query;

        // Use exchangerate-api.com or similar
        const response = await axios.get(
          `https://api.exchangerate-api.com/v4/latest/${base}`
        );

        const rates = response.data.rates;

        if (symbols) {
          const symbolArray = (symbols as string).split(',');
          const filtered = Object.keys(rates)
            .filter(key => symbolArray.includes(key))
            .reduce((obj, key) => {
              obj[key] = rates[key];
              return obj;
            }, {} as Record<string, number>);

          return res.json({ success: true, data: { base, rates: filtered } });
        }

        res.json({ success: true, data: { base, rates } });
      } catch (error) {
        next(error);
      }
    }
  );

  // Convert currency
  router.post('/currency/convert',
    authenticate,
    validateBody(z.object({
      amount: z.number(),
      from: z.string(),
      to: z.string(),
    })),
    async (req, res, next) => {
      try {
        const { amount, from, to } = req.body;

        const response = await axios.get(
          `https://api.exchangerate-api.com/v4/latest/${from}`
        );

        const rate = response.data.rates[to];
        const converted = amount * rate;

        res.json({
          success: true,
          data: {
            amount,
            from,
            to,
            rate,
            converted,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // Create invoice with currency
  router.post('/invoices/multi-currency',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.INVOICE_CREATE),
    validateBody(z.object({
      contactId: z.string(),
      currency: z.string().default('USD'),
      items: z.array(z.object({
        description: z.string(),
        quantity: z.number(),
        price: z.number(),
      })),
    })),
    async (req, res, next) => {
      try {
        const { contactId, currency, items } = req.body;

        // Calculate totals
        const subtotal = items.reduce((sum: number, item: any) => 
          sum + (item.quantity * item.price), 0
        );

        // Get tax rate for currency/jurisdiction
        const taxRule = await prisma.taxRule.findFirst({
          where: {
            companyId: req.companyId!,
            jurisdiction: currency,
          },
        });

        const taxRate = taxRule?.rate || 0;
        const taxAmount = subtotal * (taxRate / 100);
        const total = subtotal + taxAmount;

        // Generate invoice number
        const count = await prisma.invoice.count({
          where: { companyId: req.companyId! },
        });
        const number = `INV-${String(count + 1).padStart(6, '0')}`;

        const invoice = await prisma.invoice.create({
          data: {
            number,
            contactId,
            currency,
            subtotal,
            taxAmount,
            total,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: 'draft',
            companyId: req.companyId!,
            items: {
              create: items.map((item: any) => ({
                description: item.description,
                quantity: item.quantity,
                price: item.price,
                total: item.quantity * item.price,
              })),
            },
          },
          include: {
            items: true,
            contact: true,
          },
        });

        res.status(201).json({ success: true, data: invoice });
      } catch (error) {
        next(error);
      }
    }
  );

  // ===== TAX RULES =====

  // Create tax rule
  router.post('/tax/rules',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_UPDATE),
    validateBody(taxRuleSchema),
    async (req, res, next) => {
      try {
        const rule = await prisma.taxRule.create({
          data: {
            ...req.body,
            companyId: req.companyId!,
          },
        });

        res.status(201).json({ success: true, data: rule });
      } catch (error) {
        next(error);
      }
    }
  );

  // List tax rules
  router.get('/tax/rules',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    async (req, res, next) => {
      try {
        const rules = await prisma.taxRule.findMany({
          where: { companyId: req.companyId! },
          orderBy: { createdAt: 'desc' },
        });

        res.json({ success: true, data: rules });
      } catch (error) {
        next(error);
      }
    }
  );

  // Calculate tax
  router.post('/tax/calculate',
    authenticate,
    tenantIsolation,
    validateBody(z.object({
      amount: z.number(),
      jurisdiction: z.string(),
      productType: z.string().optional(),
    })),
    async (req, res, next) => {
      try {
        const { amount, jurisdiction, productType } = req.body;

        const rule = await prisma.taxRule.findFirst({
          where: {
            companyId: req.companyId!,
            jurisdiction,
            applicableProductTypes: productType 
              ? { has: productType }
              : undefined,
          },
        });

        const taxRate = rule?.rate || 0;
        const taxAmount = amount * (taxRate / 100);
        const total = amount + taxAmount;

        res.json({
          success: true,
          data: {
            amount,
            taxRate,
            taxAmount,
            total,
            rule: rule ? {
              name: rule.name,
              type: rule.taxType,
            } : null,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // ===== PURCHASE ORDERS =====

  // Create PO
  router.post('/purchase-orders',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.INVOICE_CREATE),
    validateBody(purchaseOrderSchema),
    async (req, res, next) => {
      try {
        const { supplierId, items, deliveryDate, notes } = req.body;

        // Calculate total
        const total = items.reduce((sum, item) => 
          sum + (item.quantity * item.price), 0
        );

        // Generate PO number
        const count = await prisma.purchaseOrder.count({
          where: { companyId: req.companyId! },
        });
        const number = `PO-${String(count + 1).padStart(6, '0')}`;

        const po = await prisma.purchaseOrder.create({
          data: {
            number,
            supplierId,
            total,
            deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
            notes,
            status: 'draft',
            companyId: req.companyId!,
            createdById: req.user!.id,
            items: {
              create: items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
                total: item.quantity * item.price,
              })),
            },
          },
          include: {
            items: {
              include: {
                product: true,
              },
            },
            supplier: true,
          },
        });

        res.status(201).json({ success: true, data: po });
      } catch (error) {
        next(error);
      }
    }
  );

  // List POs
  router.get('/purchase-orders',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.INVOICE_READ),
    async (req, res, next) => {
      try {
        const { status, supplierId, page = '1', limit = '20' } = req.query;

        const where: any = { companyId: req.companyId! };
        if (status) where.status = status;
        if (supplierId) where.supplierId = supplierId;

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        const [pos, total] = await Promise.all([
          prisma.purchaseOrder.findMany({
            where,
            skip,
            take: parseInt(limit as string),
            include: {
              supplier: { select: { id: true, name: true } },
              items: { include: { product: true } },
              createdBy: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
          }),
          prisma.purchaseOrder.count({ where }),
        ]);

        res.json({
          success: true,
          data: pos,
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

  // Approve PO
  router.post('/purchase-orders/:id/approve',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.INVOICE_UPDATE),
    async (req, res, next) => {
      try {
        const po = await prisma.purchaseOrder.update({
          where: { id: req.params.id },
          data: {
            status: 'approved',
            approvedById: req.user!.id,
            approvedAt: new Date(),
          },
        });

        res.json({ success: true, data: po });
      } catch (error) {
        next(error);
      }
    }
  );

  // Receive PO (update inventory)
  router.post('/purchase-orders/:id/receive',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.INVOICE_UPDATE),
    async (req, res, next) => {
      try {
        const po = await prisma.purchaseOrder.findFirst({
          where: {
            id: req.params.id,
            companyId: req.companyId!,
          },
          include: {
            items: true,
          },
        });

        if (!po) {
          return res.status(404).json({
            success: false,
            error: { message: 'PO not found' },
          });
        }

        // Update inventory
        for (const item of po.items) {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }

        // Update PO status
        await prisma.purchaseOrder.update({
          where: { id: po.id },
          data: {
            status: 'received',
            receivedAt: new Date(),
          },
        });

        res.json({ success: true, message: 'PO received and inventory updated' });
      } catch (error) {
        next(error);
      }
    }
  );

  // Convert PO to invoice
  router.post('/purchase-orders/:id/convert-to-invoice',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.INVOICE_CREATE),
    async (req, res, next) => {
      try {
        const po = await prisma.purchaseOrder.findFirst({
          where: {
            id: req.params.id,
            companyId: req.companyId!,
          },
          include: {
            items: true,
          },
        });

        if (!po) {
          return res.status(404).json({
            success: false,
            error: { message: 'PO not found' },
          });
        }

        // Generate invoice number
        const count = await prisma.invoice.count({
          where: { companyId: req.companyId! },
        });
        const number = `INV-${String(count + 1).padStart(6, '0')}`;

        const invoice = await prisma.invoice.create({
          data: {
            number,
            contactId: po.supplierId, // Supplier is the contact
            subtotal: po.total,
            total: po.total,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: 'draft',
            companyId: req.companyId!,
            metadata: JSON.stringify({ purchaseOrderId: po.id }),
            items: {
              create: po.items.map(item => ({
                description: `Product ${item.productId}`,
                quantity: item.quantity,
                price: item.price,
                total: item.total,
              })),
            },
          },
        });

        res.status(201).json({ success: true, data: invoice });
      } catch (error) {
        next(error);
      }
    }
  );
}
