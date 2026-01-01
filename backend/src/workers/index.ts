// src/workers/index.ts
import { PrismaClient } from '@prisma/client';
import { createEmailWorker } from './email.worker';
import { createSyncWorker } from './sync.worker';
import { createNotificationWorker } from './notification.worker';
import { logger } from '../core/logger';

export function startWorkers(prisma: PrismaClient): {
  emailWorker: any;
  syncWorker: any;
  notificationWorker: any;
} {
  logger.info('🔄 Starting workers...');

  const emailWorker = createEmailWorker(prisma);
  const syncWorker = createSyncWorker(prisma);
  const notificationWorker = createNotificationWorker(prisma);

  logger.info('✅ All workers started');

  return {
    emailWorker,
    syncWorker,
    notificationWorker,
  };
}
