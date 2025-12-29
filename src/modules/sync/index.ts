// src/modules/sync/index.ts
import { ModuleDefinition } from '../../core/types';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, validateBody } from '../../core/middleware';
import { RDStationConnector } from './connectors/rdstation';
import { enqueueSyncJob } from '../../core/queues';
import { z } from 'zod';

const createConnectionSchema = z.object({
  provider: z.enum(['rdstation', 'confirm8', 'pipefy']),
  apiKey: z.string(),
  config: z.record(z.any()).optional(),
});

const syncSchema = z.object({
  provider: z.string(),
  entityType: z.string(),
  direction: z.enum(['pull', 'push']),
});

function setupRoutes(app: Express, prisma: PrismaClient) {
  const base = '/api/v1/sync';

  // List connections
  app.get(`${base}/connections`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const connections = await prisma.integrationConnection.findMany({
        where: { companyId: req.companyId! },
        select: {
          id: true,
          provider: true,
          status: true,
          lastSyncAt: true,
          createdAt: true,
        },
      });
      res.json({ success: true, data: connections });
    } catch (error) {
      next(error);
    }
  });

  // Create connection
  app.post(`${base}/connections`, authenticate, tenantIsolation, validateBody(createConnectionSchema), async (req, res, next) => {
    try {
      const connection = await prisma.integrationConnection.create({
        data: {
          companyId: req.companyId!,
          provider: req.body.provider,
          status: 'connected',
          authData: { apiKey: req.body.apiKey },
          config: req.body.config || {},
        },
      });
      res.status(201).json({ success: true, data: connection });
    } catch (error) {
      next(error);
    }
  });

  // Trigger sync
  app.post(`${base}/run`, authenticate, tenantIsolation, validateBody(syncSchema), async (req, res, next) => {
    try {
      const { provider, entityType, direction } = req.body;

      // Enqueue job
      const job = await enqueueSyncJob({
        companyId: req.companyId!,
        provider,
        entityType,
        direction,
      });

      res.json({
        success: true,
        data: { jobId: job.id, message: 'Sync job enqueued' },
      });
    } catch (error) {
      next(error);
    }
  });

  // List sync runs
  app.get(`${base}/runs`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const runs = await prisma.syncRun.findMany({
        where: { companyId: req.companyId! },
        orderBy: { startedAt: 'desc' },
        take: 50,
      });
      res.json({ success: true, data: runs });
    } catch (error) {
      next(error);
    }
  });

  // Get sync run details
  app.get(`${base}/runs/:runId`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const run = await prisma.syncRun.findFirst({
        where: {
          id: req.params.runId,
          companyId: req.companyId!,
        },
        include: {
          logs: {
            orderBy: { createdAt: 'desc' },
            take: 100,
          },
        },
      });

      if (!run) {
        return res.status(404).json({ success: false, error: { message: 'Run not found' } });
      }

      res.json({ success: true, data: run });
    } catch (error) {
      next(error);
    }
  });

  // Manual sync (immediate, no queue)
  app.post(`${base}/connections/:connectionId/sync`, authenticate, tenantIsolation, async (req, res, next) => {
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

      // Create connector
      let connector;
      if (connection.provider === 'rdstation') {
        connector = new RDStationConnector(
          prisma,
          req.companyId!,
          connection.authData as any
        );
      } else {
        return res.status(400).json({
          success: false,
          error: { message: `Provider ${connection.provider} not implemented` },
        });
      }

      // Pull contacts
      const results = await connector.pull('contact');

      // Update last sync
      await prisma.integrationConnection.update({
        where: { id: connection.id },
        data: { lastSyncAt: new Date() },
      });

      res.json({
        success: true,
        data: {
          synced: results.length,
          created: results.filter(r => r.action === 'created').length,
          updated: results.filter(r => r.action === 'updated').length,
          skipped: results.filter(r => r.action === 'skipped').length,
          results,
        },
      });
    } catch (error) {
      next(error);
    }
  });
}

export const syncModule: ModuleDefinition = {
  name: 'sync',
  version: '1.0.0',
  provides: ['integrations', 'sync'],
  routes: (ctx) => setupRoutes(ctx.app, ctx.prisma),
};
