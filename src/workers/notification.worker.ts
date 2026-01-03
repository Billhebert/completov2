// src/workers/notification.worker.ts
import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { logger } from '../core/logger';
import { env } from '../core/config/env';
import Redis from 'ioredis';

interface NotificationJob {
  companyId: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: any;
}

export function createNotificationWorker(prisma: PrismaClient) {
  const connection = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });

  const worker = new Worker(
    'notification-queue',
    async (job: Job<NotificationJob>) => {
      const { companyId, userId, type, title, body, data } = job.data;

      logger.info(
        { jobId: job.id, companyId, userId, type },
        'Processing notification job'
      );

      try {
        // Create notification in database
        const notification = await prisma.notification.create({
          data: {
            companyId,
            userId,
            type,
            title,
            body,
            data,
          },
        });

        // TODO: Send push notification via Firebase/OneSignal/etc
        // For now, just log
        logger.info(
          { notificationId: notification.id },
          'Notification created and would be pushed'
        );

        return { success: true, notificationId: notification.id };
      } catch (error: any) {
        logger.error({ jobId: job.id, error }, 'Notification job failed');
        throw error;
      }
    },
    {
      connection,
      concurrency: 10,
    }
  );

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Notification job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err }, 'Notification job failed');
  });

  return worker;
}
