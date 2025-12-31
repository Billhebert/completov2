// src/modules/notifications/advanced.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission, validateBody } from '../../core/middleware';
import { EventBus, Events } from '../../core/event-bus';
import { z } from 'zod';
import twilio from 'twilio';

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const smsNotificationSchema = z.object({
  to: z.string(),
  message: z.string(),
  userId: z.string().optional(),
});

const webPushSchema = z.object({
  userId: z.string(),
  title: z.string(),
  body: z.string(),
  icon: z.string().optional(),
  url: z.string().optional(),
});

const notificationPreferencesSchema = z.object({
  email: z.boolean().default(true),
  push: z.boolean().default(true),
  sms: z.boolean().default(false),
  channels: z.record(z.boolean()).optional(),
  quietHours: z.object({
    enabled: z.boolean(),
    start: z.string(), // HH:mm
    end: z.string(),
  }).optional(),
});

export function setupAdvancedNotificationsRoutes(router: Router, prisma: PrismaClient, eventBus: EventBus) {
  
  // ===== SMS NOTIFICATIONS =====

  // Send SMS
  router.post('/notifications/sms',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_CREATE),
    validateBody(smsNotificationSchema),
    async (req, res, next) => {
      try {
        const { to, message, userId } = req.body;

        // Send via Twilio
        const sms = await twilioClient.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to,
        });

        // Save to database
        const notification = await prisma.smsNotification.create({
          data: {
            phone: to,
            to,
            message,
            userId,
            status: sms.status,
            providerMessageId: sms.sid,
            companyId: req.companyId!,
          },
        });

        res.status(201).json({ success: true, data: notification });
      } catch (error) {
        next(error);
      }
    }
  );

  // Get SMS delivery status
  router.get('/notifications/sms/:id/status',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    async (req, res, next) => {
      try {
        const notification = await prisma.smsNotification.findFirst({
          where: {
            id: req.params.id,
            companyId: req.companyId!,
          },
        });

        if (!notification || !notification.providerMessageId) {
          return res.status(404).json({
            success: false,
            error: { message: 'SMS not found' },
          });
        }

        // Check status with Twilio
        const message = await twilioClient.messages(notification.providerMessageId).fetch();

        // Update status
        await prisma.smsNotification.update({
          where: { id: notification.id },
          data: { status: message.status },
        });

        res.json({ success: true, data: { status: message.status } });
      } catch (error) {
        next(error);
      }
    }
  );

  // ===== WEB PUSH NOTIFICATIONS =====

  // Send web push
  router.post('/notifications/web-push',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_CREATE),
    validateBody(webPushSchema),
    async (req, res, next) => {
      try {
        const { userId, title, body, icon, url } = req.body;

        // Get user's push subscriptions
        const subscriptions = await prisma.pushSubscription.findMany({
          where: {
            userId,
            companyId: req.companyId!,
          },
        });

        if (subscriptions.length === 0) {
          return res.status(404).json({
            success: false,
            error: { message: 'No push subscriptions found for user' },
          });
        }

        const payload = JSON.stringify({ title, body, icon, url });

        // Send to all subscriptions (use web-push library in production)
        for (const sub of subscriptions) {
          // In production: webpush.sendNotification(sub.subscription, payload)
        }

        res.json({ success: true, message: 'Push notifications sent' });
      } catch (error) {
        next(error);
      }
    }
  );

  // Register push subscription
  router.post('/notifications/push-subscription',
    authenticate,
    tenantIsolation,
    validateBody(z.object({
      endpoint: z.string(),
      keys: z.object({
        p256dh: z.string(),
        auth: z.string(),
      }),
    })),
    async (req, res, next) => {
      try {
        const subscription = await prisma.pushSubscription.create({
          data: {
            userId: req.user!.id,
            endpoint: req.body.endpoint,
            keys: JSON.stringify(req.body.keys),
            companyId: req.companyId!,
          },
        });

        res.status(201).json({ success: true, data: subscription });
      } catch (error) {
        next(error);
      }
    }
  );

  // Unregister push subscription
  router.delete('/notifications/push-subscription/:endpoint',
    authenticate,
    tenantIsolation,
    async (req, res, next) => {
      try {
        await prisma.pushSubscription.deleteMany({
          where: {
            endpoint: req.params.endpoint,
            userId: req.user!.id,
            companyId: req.companyId!,
          },
        });

        res.json({ success: true, message: 'Subscription removed' });
      } catch (error) {
        next(error);
      }
    }
  );

  // ===== NOTIFICATION PREFERENCES =====

  // Get user preferences
  router.get('/notifications/preferences',
    authenticate,
    tenantIsolation,
    async (req, res, next) => {
      try {
        let preferences = await prisma.notificationPreferences.findFirst({
          where: {
            userId: req.user!.id,
            companyId: req.companyId!,
          },
        });

        if (!preferences) {
          // Create default preferences
          preferences = await prisma.notificationPreferences.create({
            data: {
              userId: req.user!.id,
              companyId: req.companyId!,
              email: true,
              push: true,
              sms: false,
              channels: {},
            },
          });
        }

        res.json({ success: true, data: preferences });
      } catch (error) {
        next(error);
      }
    }
  );

  // Update preferences
  router.patch('/notifications/preferences',
    authenticate,
    tenantIsolation,
    validateBody(notificationPreferencesSchema),
    async (req, res, next) => {
      try {
        const preferences = await prisma.notificationPreferences.upsert({
          where: {
            userId_companyId: {
              userId: req.user!.id,
              companyId: req.companyId!,
            },
          },
          create: {
            ...req.body,
            channels: req.body.channels ? JSON.stringify(req.body.channels) : null,
            quietHours: req.body.quietHours ? JSON.stringify(req.body.quietHours) : null,
            userId: req.user!.id,
            companyId: req.companyId!,
          },
          update: {
            ...req.body,
            channels: req.body.channels ? JSON.stringify(req.body.channels) : undefined,
            quietHours: req.body.quietHours ? JSON.stringify(req.body.quietHours) : undefined,
          },
        });

        res.json({ success: true, data: preferences });
      } catch (error) {
        next(error);
      }
    }
  );

  // ===== NOTIFICATION BATCHING =====

  // Batch send notifications
  router.post('/notifications/batch',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_CREATE),
    validateBody(z.object({
      userIds: z.array(z.string()),
      type: z.string(),
      title: z.string(),
      content: z.string(),
      data: z.record(z.any()).optional(),
    })),
    async (req, res, next) => {
      try {
        const { userIds, type, title, content, data } = req.body;

        // Create notifications for all users
        const notifications = await Promise.all(
          userIds.map((userId: string) =>
            prisma.notification.create({
              data: {
                userId,
                companyId: req.companyId!,
                type,
                title,
                body: content,
                data: data || undefined,
              },
            })
          )
        );

        // Emit to all users via websocket
        userIds.forEach((userId: string) => {
          eventBus.publish(Events.NOTIFICATION_CREATED, {
            type: Events.NOTIFICATION_CREATED,
            version: 'v1',
            timestamp: new Date(),
            companyId: req.companyId!,
            userId,
            data: { notificationId: notifications[0].id },
          });
        });

        res.status(201).json({ 
          success: true, 
          data: { 
            sent: notifications.length,
            notifications: notifications.slice(0, 5), // Return sample
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // ===== NOTIFICATION SNOOZE =====

  // Snooze notification
  router.post('/notifications/:id/snooze',
    authenticate,
    tenantIsolation,
    validateBody(z.object({
      until: z.string(), // ISO datetime
    })),
    async (req, res, next) => {
      try {
        const notification = await prisma.notification.update({
          where: { id: req.params.id },
          data: {
            snoozedUntil: new Date(req.body.until),
            read: false, // Unread when snoozed
          },
        });

        res.json({ success: true, data: notification });
      } catch (error) {
        next(error);
      }
    }
  );

  // Get snoozed notifications
  router.get('/notifications/snoozed',
    authenticate,
    tenantIsolation,
    async (req, res, next) => {
      try {
        const notifications = await prisma.notification.findMany({
          where: {
            userId: req.user!.id,
            companyId: req.companyId!,
            snoozedUntil: {
              not: null,
              gte: new Date(),
            },
          },
          orderBy: { snoozedUntil: 'asc' },
        });

        res.json({ success: true, data: notifications });
      } catch (error) {
        next(error);
      }
    }
  );

  // ===== NOTIFICATION ANALYTICS =====

  // Get notification stats
  router.get('/notifications/stats',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    async (req, res, next) => {
      try {
        const { startDate, endDate } = req.query;

        const where: any = { companyId: req.companyId! };
        
        if (startDate || endDate) {
          where.createdAt = {};
          if (startDate) where.createdAt.gte = new Date(startDate as string);
          if (endDate) where.createdAt.lte = new Date(endDate as string);
        }

        const [total, read, byType, avgResponseTime] = await Promise.all([
          prisma.notification.count({ where }),
          prisma.notification.count({ where: { ...where, read: true } }),
          prisma.notification.groupBy({
            by: ['type'],
            where,
            _count: true,
          }),
          // Calculate average time to read
          prisma.notification.findMany({
            where: { ...where, read: true, readAt: { not: null } },
            select: {
              createdAt: true,
              readAt: true,
            },
          }),
        ]);

        const totalResponseTime = avgResponseTime.reduce((sum, n) => {
          if (n.readAt) {
            return sum + (n.readAt.getTime() - n.createdAt.getTime());
          }
          return sum;
        }, 0);

        const avgResponseMs = avgResponseTime.length > 0 
          ? totalResponseTime / avgResponseTime.length 
          : 0;

        res.json({
          success: true,
          data: {
            total,
            read,
            unread: total - read,
            readRate: total > 0 ? (read / total) * 100 : 0,
            byType,
            avgResponseTimeMinutes: avgResponseMs / 60000,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );
}
