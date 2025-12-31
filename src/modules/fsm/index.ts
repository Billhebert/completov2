// src/modules/fsm/index.ts - Field Service Management API
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../core/middleware/auth';
import { tenantIsolation } from '../../core/middleware/tenant';
import { requirePermission } from '../rbac/middleware';

const prisma = new PrismaClient();

export default function registerFSMRoutes(app: Express) {
  const base = '/api/v1/fsm';

  // ===== Technicians =====
  
  app.get(`${base}/technicians`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const techs = await prisma.fieldTechnician.findMany({
        where: { companyId: req.companyId!, isActive: true },
        select: { id: true, userId: true, skills: true, status: true, rating: true, location: true },
      });
      res.json({ success: true, data: techs });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${base}/technicians`, authenticate, tenantIsolation, requirePermission('user', 'create'), async (req, res, next) => {
    try {
      const { userId, skills, certifications, availability } = req.body;
      const tech = await prisma.fieldTechnician.create({
        data: {
          companyId: req.companyId!,
          userId,
          skills: skills || [],
          certifications,
          availability: availability || {},
        },
      });
      res.json({ success: true, data: tech });
    } catch (error) {
      next(error);
    }
  });

  app.patch(`${base}/technicians/:id/location`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const tech = await prisma.fieldTechnician.update({
        where: { id: req.params.id, companyId: req.companyId! },
        data: { location: req.body.location },
      });
      res.json({ success: true, data: tech });
    } catch (error) {
      next(error);
    }
  });

  // ===== Work Orders =====
  
  app.get(`${base}/workorders`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const { status, technicianId, priority } = req.query;
      const where: any = { companyId: req.companyId! };
      if (status) where.status = status;
      if (technicianId) where.technicianId = technicianId;
      if (priority) where.priority = priority;

      const orders = await prisma.workOrder.findMany({
        where,
        include: {
          technician: { select: { userId: true, status: true } },
          _count: { select: { tasks: true, checklistItems: true } },
        },
        orderBy: [{ priority: 'desc' }, { scheduledStart: 'asc' }],
      });
      res.json({ success: true, data: orders });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${base}/workorders`, authenticate, tenantIsolation, requirePermission('workorder', 'create'), async (req, res, next) => {
    try {
      const { title, description, type, priority, customerId, assetId, technicianId, scheduledStart, scheduledEnd, location, instructions, partsRequired } = req.body;
      
      const order = await prisma.workOrder.create({
        data: {
          companyId: req.companyId!,
          title,
          description,
          type,
          priority: priority || 'medium',
          customerId,
          assetId,
          technicianId,
          scheduledStart: scheduledStart ? new Date(scheduledStart) : null,
          scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : null,
          location: location || {},
          instructions,
          partsRequired,
          createdBy: req.user!.id,
        },
      });
      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  });

  app.patch(`${base}/workorders/:id`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const order = await prisma.workOrder.update({
        where: { id: req.params.id, companyId: req.companyId! },
        data: req.body,
      });
      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${base}/workorders/:id/start`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const order = await prisma.workOrder.update({
        where: { id: req.params.id, companyId: req.companyId! },
        data: { status: 'in_progress', actualStart: new Date() },
      });
      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${base}/workorders/:id/complete`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const { signature, feedback } = req.body;
      const order = await prisma.workOrder.update({
        where: { id: req.params.id, companyId: req.companyId! },
        data: {
          status: 'completed',
          actualEnd: new Date(),
          signature,
          feedback,
        },
      });
      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  });

  // ===== Tasks & Checklists =====
  
  app.post(`${base}/workorders/:id/tasks`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const task = await prisma.workOrderTask.create({
        data: {
          workOrderId: req.params.id,
          title: req.body.title,
          description: req.body.description,
          order: req.body.order || 0,
        },
      });
      res.json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  });

  app.patch(`${base}/tasks/:id/complete`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const task = await prisma.workOrderTask.update({
        where: { id: req.params.id },
        data: { isCompleted: true, completedAt: new Date(), completedBy: req.user!.id },
      });
      res.json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${base}/workorders/:id/checklist`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const item = await prisma.workOrderChecklist.create({
        data: {
          workOrderId: req.params.id,
          item: req.body.item,
          order: req.body.order || 0,
        },
      });
      res.json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  });

  // ===== Time Tracking =====
  
  app.post(`${base}/workorders/:id/time`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const entry = await prisma.workOrderTimeEntry.create({
        data: {
          workOrderId: req.params.id,
          technicianId: req.user!.id,
          startTime: new Date(),
          description: req.body.description,
        },
      });
      res.json({ success: true, data: entry });
    } catch (error) {
      next(error);
    }
  });

  app.patch(`${base}/time/:id/stop`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const entry = await prisma.workOrderTimeEntry.findUnique({ where: { id: req.params.id } });
      if (!entry) return res.status(404).json({ success: false });
      
      const duration = Math.floor((Date.now() - entry.startTime.getTime()) / 60000);
      
      const updated = await prisma.workOrderTimeEntry.update({
        where: { id: req.params.id },
        data: { endTime: new Date(), duration },
      });
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  });
}
