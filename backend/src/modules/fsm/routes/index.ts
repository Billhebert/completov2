import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupTechniciansListRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/technicians`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const techs = await prisma.fieldTechnician.findMany({
        where: { companyId: req.companyId!, isActive: true },
        select: { id: true, userId: true, skills: true, status: true, rating: true, location: true },
      });
      res.json({ success: true, data: techs });
    } catch (error) { next(error); }
  });
}

export function setupTechniciansCreateRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}/technicians`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, skills, certifications, availability } = req.body;
      const tech = await prisma.fieldTechnician.create({
        data: { companyId: req.companyId!, userId, skills: skills || [], certifications, availability: availability || {} },
      });
      res.json({ success: true, data: tech });
    } catch (error) { next(error); }
  });
}

export function setupTechniciansLocationRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.patch(`${baseUrl}/technicians/:id/location`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tech = await prisma.fieldTechnician.update({
        where: { id: req.params.id, companyId: req.companyId! },
        data: { location: req.body.location },
      });
      res.json({ success: true, data: tech });
    } catch (error) { next(error); }
  });
}

export function setupWorkordersListRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/workorders`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, technicianId, priority } = req.query;
      const where: any = { companyId: req.companyId! };
      if (status) where.status = status;
      if (technicianId) where.technicianId = technicianId;
      if (priority) where.priority = priority;

      const orders = await prisma.workOrder.findMany({
        where,
        include: { technician: { select: { userId: true, status: true } }, _count: { select: { tasks: true, checklistItems: true } } },
        orderBy: [{ priority: 'desc' }, { scheduledStart: 'asc' }],
      });
      res.json({ success: true, data: orders });
    } catch (error) { next(error); }
  });
}

export function setupWorkordersCreateRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}/workorders`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, description, type, priority, customerId, assetId, technicianId, scheduledStart, scheduledEnd, location, instructions, partsRequired } = req.body;
      const order = await prisma.workOrder.create({
        data: {
          companyId: req.companyId!, title, description, type, priority: priority || 'medium', customerId, assetId, technicianId,
          scheduledStart: scheduledStart ? new Date(scheduledStart) : null,
          scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : null,
          location: location || {}, instructions, partsRequired, createdBy: req.user!.id,
        },
      });
      res.json({ success: true, data: order });
    } catch (error) { next(error); }
  });
}

export function setupWorkordersUpdateRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.patch(`${baseUrl}/workorders/:id`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await prisma.workOrder.update({
        where: { id: req.params.id, companyId: req.companyId! },
        data: req.body,
      });
      res.json({ success: true, data: order });
    } catch (error) { next(error); }
  });
}

export function setupWorkordersStartRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}/workorders/:id/start`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await prisma.workOrder.update({
        where: { id: req.params.id, companyId: req.companyId! },
        data: { status: 'in_progress', actualStart: new Date() },
      });
      res.json({ success: true, data: order });
    } catch (error) { next(error); }
  });
}

export function setupWorkordersCompleteRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}/workorders/:id/complete`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { signature, feedback } = req.body;
      const order = await prisma.workOrder.update({
        where: { id: req.params.id, companyId: req.companyId! },
        data: { status: 'completed', actualEnd: new Date(), signature, feedback },
      });
      res.json({ success: true, data: order });
    } catch (error) { next(error); }
  });
}

export function setupWorkorderTasksRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}/workorders/:id/tasks`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await prisma.workOrderTask.create({
        data: { workOrderId: req.params.id, title: req.body.title, description: req.body.description, order: req.body.order || 0 },
      });
      res.json({ success: true, data: task });
    } catch (error) { next(error); }
  });
}

export function setupTasksCompleteRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.patch(`${baseUrl}/tasks/:id/complete`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await prisma.workOrderTask.update({
        where: { id: req.params.id },
        data: { isCompleted: true, completedAt: new Date(), completedBy: req.user!.id },
      });
      res.json({ success: true, data: task });
    } catch (error) { next(error); }
  });
}

export function setupChecklistRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}/workorders/:id/checklist`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await prisma.workOrderChecklist.create({
        data: { workOrderId: req.params.id, item: req.body.item, order: req.body.order || 0 },
      });
      res.json({ success: true, data: item });
    } catch (error) { next(error); }
  });
}

export function setupTimeTrackingStartRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}/workorders/:id/time`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const entry = await prisma.workOrderTimeEntry.create({
        data: { workOrderId: req.params.id, technicianId: req.user!.id, startTime: new Date(), description: req.body.description },
      });
      res.json({ success: true, data: entry });
    } catch (error) { next(error); }
  });
}

export function setupTimeTrackingStopRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.patch(`${baseUrl}/time/:id/stop`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const entry = await prisma.workOrderTimeEntry.findUnique({ where: { id: req.params.id } });
      if (!entry) return res.status(404).json({ success: false });
      const duration = Math.floor((Date.now() - entry.startTime.getTime()) / 60000);
      const updated = await prisma.workOrderTimeEntry.update({
        where: { id: req.params.id },
        data: { endTime: new Date(), duration },
      });
      res.json({ success: true, data: updated });
    } catch (error) { next(error); }
  });
}
