// src/core/queues/index.ts
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { env } from '../config/env';

const connection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

// Email Queue
export const emailQueue = new Queue('email-queue', { connection });

export async function sendEmail(data: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  return emailQueue.add('send-email', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });
}

// Sync Queue
export const syncQueue = new Queue('sync-queue', { connection });

export async function enqueueSyncJob(data: {
  companyId: string;
  provider: string;
  entityType: string;
  direction: 'pull' | 'push';
  entityId?: string;
}) {
  return syncQueue.add('sync-job', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  });
}

// Notification Queue
export const notificationQueue = new Queue('notification-queue', { connection });

export async function enqueueNotification(data: {
  companyId: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: any;
}) {
  return notificationQueue.add('send-notification', data, {
    attempts: 2,
  });
}
