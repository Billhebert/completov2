// src/modules/cmms/index.ts - CMMS + EAM API
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../core/middleware/auth';
import { tenantIsolation } from '../../core/middleware/tenant';
import { requirePermission } from '../rbac/middleware';

const prisma = new PrismaClient();

export default function registerCMMSRoutes(app: Express) {
  const base = '/api/v1/cmms';

  // ===== Assets =====
  
  app.get(`${base}/assets`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const { category, status } = req.query;
      const where: any = { companyId: req.companyId! };
      if (category) where.category = category;
      if (status) where.status = status;

      const assets = await prisma.asset.findMany({
        where,
        include: {
          _count: {
            select: {
              maintenancePlans: true,
              maintenanceHistory: true,
              childAssets: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });
      res.json({ success: true, data: assets });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${base}/assets`, authenticate, tenantIsolation, requirePermission('asset', 'create'), async (req, res, next) => {
    try {
      const { name, assetTag, category, type, manufacturer, model, serialNumber, purchaseDate, purchaseCost, location, specifications, parentAssetId } = req.body;
      
      const asset = await prisma.asset.create({
        data: {
          companyId: req.companyId!,
          name,
          assetTag,
          category,
          type,
          manufacturer,
          model,
          serialNumber,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
          purchaseCost,
          location,
          specifications,
          parentAssetId,
          createdBy: req.user!.id,
        },
      });
      res.json({ success: true, data: asset });
    } catch (error) {
      next(error);
    }
  });

  app.get(`${base}/assets/:id`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const asset = await prisma.asset.findFirst({
        where: { id: req.params.id, companyId: req.companyId! },
        include: {
          parentAsset: true,
          childAssets: true,
          maintenancePlans: { where: { isActive: true } },
          maintenanceHistory: { orderBy: { startTime: 'desc' }, take: 10 },
          meters: true,
        },
      });
      res.json({ success: true, data: asset });
    } catch (error) {
      next(error);
    }
  });

  app.patch(`${base}/assets/:id`, authenticate, tenantIsolation, requirePermission('asset', 'update'), async (req, res, next) => {
    try {
      const asset = await prisma.asset.update({
        where: { id: req.params.id, companyId: req.companyId! },
        data: req.body,
      });
      res.json({ success: true, data: asset });
    } catch (error) {
      next(error);
    }
  });

  // ===== Maintenance Plans =====
  
  app.get(`${base}/maintenance-plans`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const plans = await prisma.assetMaintenancePlan.findMany({
        where: { companyId: req.companyId!, isActive: true },
        include: { asset: { select: { id: true, name: true, assetTag: true } } },
        orderBy: { nextDue: 'asc' },
      });
      res.json({ success: true, data: plans });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${base}/maintenance-plans`, authenticate, tenantIsolation, requirePermission('maintenance', 'create'), async (req, res, next) => {
    try {
      const { assetId, name, description, type, frequency, tasks, estimatedDuration, assignedToId, priority } = req.body;
      
      const plan = await prisma.assetMaintenancePlan.create({
        data: {
          companyId: req.companyId!,
          assetId,
          name,
          description,
          type,
          frequency,
          tasks,
          estimatedDuration,
          assignedToId,
          priority: priority || 'medium',
          createdBy: req.user!.id,
        },
      });
      res.json({ success: true, data: plan });
    } catch (error) {
      next(error);
    }
  });

  // ===== Maintenance Records =====
  
  app.get(`${base}/maintenance-records`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const { assetId, type } = req.query;
      const where: any = { companyId: req.companyId! };
      if (assetId) where.assetId = assetId;
      if (type) where.type = type;

      const records = await prisma.maintenanceRecord.findMany({
        where,
        include: { asset: { select: { id: true, name: true, assetTag: true } } },
        orderBy: { startTime: 'desc' },
        take: 100,
      });
      res.json({ success: true, data: records });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${base}/maintenance-records`, authenticate, tenantIsolation, requirePermission('maintenance', 'create'), async (req, res, next) => {
    try {
      const { assetId, planId, type, title, description, performedBy, startTime, endTime, partsUsed, laborCost, partsCost, outcome, notes } = req.body;
      
      const duration = endTime ? Math.floor((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000) : null;
      const totalCost = (laborCost || 0) + (partsCost || 0);
      
      const record = await prisma.maintenanceRecord.create({
        data: {
          companyId: req.companyId!,
          assetId,
          planId,
          type,
          title,
          description,
          performedBy,
          startTime: new Date(startTime),
          endTime: endTime ? new Date(endTime) : null,
          duration,
          partsUsed,
          laborCost,
          partsCost,
          totalCost,
          outcome,
          notes,
          createdBy: req.user!.id,
        },
      });
      
      // Update plan last performed
      if (planId) {
        await prisma.assetMaintenancePlan.update({
          where: { id: planId },
          data: { lastPerformed: new Date(startTime) },
        });
      }
      
      res.json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  });

  // ===== Asset Downtime =====
  
  app.post(`${base}/downtime`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const { assetId, reason, description, impact, cost } = req.body;
      
      const downtime = await prisma.assetDowntime.create({
        data: {
          companyId: req.companyId!,
          assetId,
          reason,
          description,
          startTime: new Date(),
          impact,
          cost,
        },
      });
      
      // Update asset status
      await prisma.asset.update({
        where: { id: assetId },
        data: { status: 'down' },
      });
      
      res.json({ success: true, data: downtime });
    } catch (error) {
      next(error);
    }
  });

  app.patch(`${base}/downtime/:id/resolve`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const downtime = await prisma.assetDowntime.findUnique({ where: { id: req.params.id } });
      if (!downtime) return res.status(404).json({ success: false });
      
      const duration = Math.floor((Date.now() - downtime.startTime.getTime()) / 60000);
      
      const updated = await prisma.assetDowntime.update({
        where: { id: req.params.id },
        data: {
          endTime: new Date(),
          duration,
          resolvedBy: req.user!.id,
        },
      });
      
      // Update asset status
      await prisma.asset.update({
        where: { id: downtime.assetId },
        data: { status: 'operational' },
      });
      
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  });

  // ===== Spare Parts =====
  
  app.get(`${base}/spare-parts`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const parts = await prisma.sparePart.findMany({
        where: { companyId: req.companyId! },
        orderBy: { name: 'asc' },
      });
      res.json({ success: true, data: parts });
    } catch (error) {
      next(error);
    }
  });

  app.get(`${base}/spare-parts/low-stock`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const parts = await prisma.sparePart.findMany({
        where: {
          companyId: req.companyId!,
          quantityOnHand: {
            lte: prisma.sparePart.fields.minQuantity,
          },
        },
        orderBy: { quantityOnHand: 'asc' },
      });
      res.json({ success: true, data: parts });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${base}/spare-parts`, authenticate, tenantIsolation, requirePermission('inventory', 'create'), async (req, res, next) => {
    try {
      const { partNumber, name, description, category, manufacturer, supplier, unitCost, quantityOnHand, minQuantity, maxQuantity, location } = req.body;
      
      const part = await prisma.sparePart.create({
        data: {
          companyId: req.companyId!,
          partNumber,
          name,
          description,
          category,
          manufacturer,
          supplier,
          unitCost,
          quantityOnHand: quantityOnHand || 0,
          minQuantity: minQuantity || 0,
          maxQuantity,
          location,
        },
      });
      res.json({ success: true, data: part });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${base}/spare-parts/:id/movement`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const { type, quantity, reason, reference, notes } = req.body;
      
      const movement = await prisma.sparePartMovement.create({
        data: {
          companyId: req.companyId!,
          partId: req.params.id,
          type,
          quantity,
          reason,
          reference,
          performedBy: req.user!.id,
          notes,
        },
      });
      
      // Update quantity
      const part = await prisma.sparePart.findUnique({ where: { id: req.params.id } });
      if (part) {
        const delta = type === 'in' ? quantity : -quantity;
        await prisma.sparePart.update({
          where: { id: req.params.id },
          data: { quantityOnHand: part.quantityOnHand + delta },
        });
      }
      
      res.json({ success: true, data: movement });
    } catch (error) {
      next(error);
    }
  });
}
