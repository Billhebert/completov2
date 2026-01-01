// src/modules/crm/activities.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission, validateBody } from '../../core/middleware';
import { EventBus, Events } from '../../core/event-bus';
import { z } from 'zod';

const activitySchema = z.object({
  type: z.enum(['task', 'call', 'meeting', 'email']),
  subject: z.string(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  duration: z.number().optional(), // in minutes
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z.enum(['todo', 'in_progress', 'done', 'cancelled']).default('todo'),
  contactId: z.string().optional(),
  dealId: z.string().optional(),
  assignedToId: z.string(),
  location: z.string().optional(),
  reminder: z.number().optional(), // minutes before
  recurring: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly']),
    interval: z.number(),
    endDate: z.string().optional(),
  }).optional(),
});

export function setupActivityRoutes(router: Router, prisma: PrismaClient, eventBus: EventBus) {
  
  // Create activity
  router.post('/activities', 
    authenticate, 
    tenantIsolation, 
    requirePermission(Permission.CONTACT_CREATE),
    validateBody(activitySchema),
    async (req, res, next) => {
      try {
        const activity = await prisma.activity.create({
          data: {
            ...req.body,
            companyId: req.companyId!,
            createdById: req.user!.id,
          },
          include: {
            assignedTo: { select: { id: true, name: true, email: true } },
            contact: { select: { id: true, name: true } },
            deal: { select: { id: true, title: true } },
          },
        });

        // Create reminder if specified
        if (req.body.reminder && req.body.dueDate) {
          const reminderDate = new Date(req.body.dueDate);
          reminderDate.setMinutes(reminderDate.getMinutes() - req.body.reminder);
          
          await prisma.activityReminder.create({
            data: {
              activityId: activity.id,
              reminderDate,
              sent: false,
            },
          });
        }

        await eventBus.publish(Events.ACTIVITY_CREATED, {
          type: Events.ACTIVITY_CREATED,
          version: 'v1',
          timestamp: new Date(),
          companyId: req.companyId!,
          userId: req.user!.id,
          data: { activityId: activity.id, type: activity.type },
        });

        res.status(201).json({ success: true, data: activity });
      } catch (error) {
        next(error);
      }
    }
  );

  // List activities
  router.get('/activities',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_READ),
    async (req, res, next) => {
      try {
        const { 
          type, 
          status, 
          priority,
          assignedToId, 
          contactId, 
          dealId,
          startDate,
          endDate,
          page = '1', 
          limit = '20' 
        } = req.query;

        const where: any = { companyId: req.companyId! };
        
        if (type) where.type = type;
        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (assignedToId) where.assignedToId = assignedToId;
        if (contactId) where.contactId = contactId;
        if (dealId) where.dealId = dealId;
        
        if (startDate || endDate) {
          where.dueDate = {};
          if (startDate) where.dueDate.gte = new Date(startDate as string);
          if (endDate) where.dueDate.lte = new Date(endDate as string);
        }

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        const [activities, total] = await Promise.all([
          prisma.activity.findMany({
            where,
            skip,
            take: parseInt(limit as string),
            include: {
              assignedTo: { select: { id: true, name: true, email: true } },
              contact: { select: { id: true, name: true } },
              deal: { select: { id: true, title: true } },
              createdBy: { select: { id: true, name: true } },
            },
            orderBy: [
              { priority: 'desc' },
              { dueDate: 'asc' },
            ],
          }),
          prisma.activity.count({ where }),
        ]);

        res.json({
          success: true,
          data: activities,
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

  // Get activity by ID
  router.get('/activities/:id',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_READ),
    async (req, res, next) => {
      try {
        const activity = await prisma.activity.findFirst({
          where: {
            id: req.params.id,
            companyId: req.companyId!,
          },
          include: {
            assignedTo: { select: { id: true, name: true, email: true } },
            contact: { select: { id: true, name: true, email: true } },
            deal: { select: { id: true, title: true } },
            createdBy: { select: { id: true, name: true } },
            reminders: true,
            notes: {
              include: {
                createdBy: { select: { id: true, name: true } },
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        });

        if (!activity) {
          return res.status(404).json({ 
            success: false, 
            error: { message: 'Activity not found' } 
          });
        }

        res.json({ success: true, data: activity });
      } catch (error) {
        next(error);
      }
    }
  );

  // Update activity
  router.patch('/activities/:id',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_UPDATE),
    async (req, res, next) => {
      try {
        const activity = await prisma.activity.update({
          where: { id: req.params.id },
          data: req.body,
          include: {
            assignedTo: { select: { id: true, name: true } },
            contact: { select: { id: true, name: true } },
            deal: { select: { id: true, title: true } },
          },
        });

        if (req.body.status === 'done') {
          await eventBus.publish(Events.ACTIVITY_COMPLETED, {
            type: Events.ACTIVITY_COMPLETED,
            version: 'v1',
            timestamp: new Date(),
            companyId: req.companyId!,
            userId: req.user!.id,
            data: { activityId: activity.id },
          });
        }

        res.json({ success: true, data: activity });
      } catch (error) {
        next(error);
      }
    }
  );

  // Delete activity
  router.delete('/activities/:id',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_DELETE),
    async (req, res, next) => {
      try {
        await prisma.activity.delete({
          where: { id: req.params.id },
        });

        res.json({ success: true, message: 'Activity deleted' });
      } catch (error) {
        next(error);
      }
    }
  );

  // Add note to activity
  router.post('/activities/:id/notes',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_CREATE),
    validateBody(z.object({
      content: z.string(),
    })),
    async (req, res, next) => {
      try {
        const note = await prisma.activityNote.create({
          data: {
            activityId: req.params.id,
            content: req.body.content,
            createdById: req.user!.id,
          },
          include: {
            createdBy: { select: { id: true, name: true } },
          },
        });

        res.status(201).json({ success: true, data: note });
      } catch (error) {
        next(error);
      }
    }
  );

  // Get upcoming activities (calendar view)
  router.get('/activities/calendar/:year/:month',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_READ),
    async (req, res, next) => {
      try {
        const { year, month } = req.params;
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

        const activities = await prisma.activity.findMany({
          where: {
            companyId: req.companyId!,
            dueDate: {
              gte: startDate,
              lte: endDate,
            },
            status: { not: 'cancelled' },
          },
          include: {
            assignedTo: { select: { id: true, name: true } },
            contact: { select: { id: true, name: true } },
            deal: { select: { id: true, title: true } },
          },
          orderBy: { dueDate: 'asc' },
        });

        // Group by date
        const calendar: Record<string, any[]> = {};
        activities.forEach(activity => {
          if (activity.dueDate) {
            const date = activity.dueDate.toISOString().split('T')[0];
            if (!calendar[date]) calendar[date] = [];
            calendar[date].push(activity);
          }
        });

        res.json({ success: true, data: calendar });
      } catch (error) {
        next(error);
      }
    }
  );

  // Get overdue activities
  router.get('/activities/overdue',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_READ),
    async (req, res, next) => {
      try {
        const activities = await prisma.activity.findMany({
          where: {
            companyId: req.companyId!,
            dueDate: { lt: new Date() },
            status: { notIn: ['done', 'cancelled'] },
          },
          include: {
            assignedTo: { select: { id: true, name: true } },
            contact: { select: { id: true, name: true } },
            deal: { select: { id: true, title: true } },
          },
          orderBy: { dueDate: 'asc' },
        });

        res.json({ success: true, data: activities });
      } catch (error) {
        next(error);
      }
    }
  );

  // Activity statistics
  router.get('/activities/stats',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_READ),
    async (req, res, next) => {
      try {
        const [
          total,
          todo,
          inProgress,
          done,
          overdue,
          byType,
        ] = await Promise.all([
          prisma.activity.count({
            where: { companyId: req.companyId! },
          }),
          prisma.activity.count({
            where: { companyId: req.companyId!, status: 'todo' },
          }),
          prisma.activity.count({
            where: { companyId: req.companyId!, status: 'in_progress' },
          }),
          prisma.activity.count({
            where: { companyId: req.companyId!, status: 'done' },
          }),
          prisma.activity.count({
            where: {
              companyId: req.companyId!,
              dueDate: { lt: new Date() },
              status: { notIn: ['done', 'cancelled'] },
            },
          }),
          prisma.activity.groupBy({
            by: ['type'],
            where: { companyId: req.companyId! },
            _count: true,
          }),
        ]);

        res.json({
          success: true,
          data: {
            total,
            byStatus: { todo, inProgress, done },
            overdue,
            byType,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );
}
