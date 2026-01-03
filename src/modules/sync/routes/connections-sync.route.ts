import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';
import { RDStationConnector } from '../connectors/rdstation.connector';
import { ChatwootConnector } from '../connectors/chatwoot';
import { logger } from '../../../core/logger';

export function setupConnectionsSyncRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  app.post(
    `${baseUrl}/connections/:connectionId/sync`,
    authenticate,
    tenantIsolation,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const connection = await prisma.integrationConnection.findFirst({
          where: {
            id: req.params.connectionId,
            companyId: req.companyId!,
          },
        });

        if (!connection) {
          return res.status(404).json({ success: false, error: { message: 'Connection not found' } });
        }

        let results: any;

        if (connection.provider === 'rdstation') {
          const connector = new RDStationConnector(
            prisma,
            req.companyId!,
            connection.authData as any
          );
          results = await connector.pullEntities('contacts');
        } else if (connection.provider === 'chatwoot') {
          const connector = new ChatwootConnector(
            prisma,
            req.companyId!,
            connection.authData as any
          );
          results = await connector.pullEntities('contacts');
        } else {
          return res.status(400).json({
            success: false,
            error: { message: `Provider ${connection.provider} not implemented` },
          });
        }

        await prisma.integrationConnection.update({
          where: { id: connection.id },
          data: { lastSyncAt: new Date() },
        });

        res.json({
          success: true,
          data: {
            synced: results.created + results.updated + results.skipped,
            created: results.created,
            updated: results.updated,
            skipped: results.skipped,
            errors: results.errors,
          },
        });
      } catch (error) {
        logger.error({ error }, 'Failed to sync connection');
        next(error);
      }
    }
  );
}
