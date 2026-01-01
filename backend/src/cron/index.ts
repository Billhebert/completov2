// src/cron/index.ts
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { logger } from '../core/logger';
import { enqueueSyncJob } from '../core/queues';

export function startCronJobs(prisma: PrismaClient) {
  logger.info('⏰ Starting cron jobs...');

  // Clean up old notifications (every day at 3 AM)
  cron.schedule('0 3 * * *', async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await prisma.notification.deleteMany({
        where: {
          readAt: {
            lt: thirtyDaysAgo,
          },
        },
      });

      logger.info({ deleted: result.count }, 'Cleaned up old notifications');
    } catch (error) {
      logger.error({ error }, 'Failed to clean up notifications');
    }
  });

  // Clean up old event logs (every day at 4 AM)
  cron.schedule('0 4 * * *', async () => {
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const result = await prisma.eventLog.deleteMany({
        where: {
          createdAt: {
            lt: ninetyDaysAgo,
          },
        },
      });

      logger.info({ deleted: result.count }, 'Cleaned up old event logs');
    } catch (error) {
      logger.error({ error }, 'Failed to clean up event logs');
    }
  });

  // Auto-sync integrations (every 6 hours)
  cron.schedule('0 */6 * * *', async () => {
    try {
      const connections = await prisma.integrationConnection.findMany({
        where: { status: 'connected' },
      });

      for (const connection of connections) {
        await enqueueSyncJob({
          companyId: connection.companyId,
          provider: connection.provider,
          entityType: 'contact',
          direction: 'pull',
        });

        logger.info(
          { connectionId: connection.id, provider: connection.provider },
          'Enqueued auto-sync job'
        );
      }
    } catch (error) {
      logger.error({ error }, 'Failed to schedule auto-sync');
    }
  });

  // Update knowledge importance scores (every day at 2 AM)
  cron.schedule('0 2 * * *', async () => {
    try {
      const nodes = await prisma.knowledgeNode.findMany({
        select: { id: true, accessCount: true },
      });

      for (const node of nodes) {
        // Simple importance algorithm based on access count
        const importance = Math.min(node.accessCount / 100, 1.0);

        await prisma.knowledgeNode.update({
          where: { id: node.id },
          data: { importanceScore: importance },
        });
      }

      logger.info({ updated: nodes.length }, 'Updated knowledge importance scores');
    } catch (error) {
      logger.error({ error }, 'Failed to update importance scores');
    }
  });

  // Clean up expired sessions (every hour)
  cron.schedule('0 * * * *', async () => {
    try {
      const result = await prisma.whatsAppSession.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      if (result.count > 0) {
        logger.info({ deleted: result.count }, 'Cleaned up expired sessions');
      }
    } catch (error) {
      logger.error({ error }, 'Failed to clean up sessions');
    }
  });

  // Generate daily analytics snapshots (every day at 1 AM)
  cron.schedule('0 1 * * *', async () => {
    try {
      const companies = await prisma.company.findMany({ where: { active: true } });

      for (const company of companies) {
        const stats = {
          users: await prisma.user.count({ where: { companyId: company.id, active: true } }),
          contacts: await prisma.contact.count({ where: { companyId: company.id } }),
          deals: await prisma.deal.count({ where: { companyId: company.id } }),
          messages: await prisma.message.count({ where: { companyId: company.id } }),
        };

        await prisma.eventLog.create({
          data: {
            companyId: company.id,
            name: 'daily.snapshot',
            data: stats,
          },
        });
      }

      logger.info({ companies: companies.length }, 'Generated daily analytics snapshots');
    } catch (error) {
      logger.error({ error }, 'Failed to generate analytics snapshots');
    }
  });

  logger.info('✅ Cron jobs started (6 scheduled tasks)');
}
