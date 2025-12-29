// src/workers/sync.worker.ts
import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { logger } from '../core/logger';
import { env } from '../core/config/env';
import Redis from 'ioredis';

interface SyncJob {
  companyId: string;
  provider: string;
  entityType: string;
  direction: 'pull' | 'push';
  entityId?: string;
}

export function createSyncWorker(prisma: PrismaClient) {
  const connection = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });

  const worker = new Worker(
    'sync-queue',
    async (job: Job<SyncJob>) => {
      const { companyId, provider, entityType, direction, entityId } = job.data;

      logger.info(
        { jobId: job.id, companyId, provider, entityType, direction },
        'Processing sync job'
      );

      try {
        // Create sync run
        const run = await prisma.syncRun.create({
          data: {
            companyId,
            provider,
            direction,
            entityTypes: [entityType],
            status: 'running',
          },
        });

        // TODO: Implement actual sync logic based on provider
        // For now, just simulate
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Update run as completed
        await prisma.syncRun.update({
          where: { id: run.id },
          data: {
            status: 'completed',
            finishedAt: new Date(),
            stats: {
              processed: 1,
              created: 0,
              updated: 1,
              skipped: 0,
              errors: 0,
            },
          },
        });

        logger.info({ jobId: job.id, runId: run.id }, 'Sync job completed');

        return { success: true, runId: run.id };
      } catch (error: any) {
        logger.error({ jobId: job.id, error }, 'Sync job failed');
        throw error;
      }
    },
    {
      connection,
      concurrency: 3,
    }
  );

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Sync job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err }, 'Sync job failed');
  });

  return worker;
}
