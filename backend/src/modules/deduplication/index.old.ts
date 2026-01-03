// src/modules/deduplication/index.ts
import { ModuleDefinition } from '../../core/types';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, validateBody, adminOnly } from '../../core/middleware';
import { DeduplicationAgent } from './agent.service';
import { z } from 'zod';

const detectSchema = z.object({
  entityType: z.enum(['contact', 'deal', 'company']),
  minSimilarity: z.number().min(0).max(1).optional(),
});

const mergeSchema = z.object({
  primaryId: z.string(),
  duplicateIds: z.array(z.string()),
  entityType: z.enum(['contact', 'deal', 'company']),
});

const feedbackSchema = z.object({
  detectionId: z.string(),
  action: z.enum(['accept', 'reject', 'ignore']),
});

function setupRoutes(app: Express, prisma: PrismaClient) {
  const base = '/api/v1/deduplication';
  const agent = new DeduplicationAgent(prisma);

  // Detectar duplicatas com IA
  app.post(`${base}/detect`, authenticate, tenantIsolation, validateBody(detectSchema), async (req, res, next) => {
    try {
      const { entityType, minSimilarity } = req.body;

      const groups = await agent.detectDuplicates(
        entityType,
        req.companyId!,
        minSimilarity || 0.85
      );

      res.json({
        success: true,
        data: {
          totalGroups: groups.length,
          groups: groups.map(g => ({
            candidates: g.length,
            items: g,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  });

  // Listar detecções pendentes
  app.get(`${base}/pending`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const pending = await prisma.duplicateDetection.findMany({
        where: {
          companyId: req.companyId!,
          status: 'pending',
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ success: true, data: pending });
    } catch (error) {
      next(error);
    }
  });

  // Merge duplicatas (unificar)
  app.post(`${base}/merge`, authenticate, tenantIsolation, validateBody(mergeSchema), async (req, res, next) => {
    try {
      const { primaryId, duplicateIds, entityType } = req.body;

      const result = await agent.mergeDuplicates(
        req.companyId!,
        primaryId,
        duplicateIds,
        entityType as any
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  });

  // Feedback sobre detecção (para aprendizado)
  app.post(`${base}/feedback`, authenticate, tenantIsolation, validateBody(feedbackSchema), async (req, res, next) => {
    try {
      const { detectionId, action } = req.body;

      await prisma.duplicateDetection.update({
        where: { id: detectionId },
        data: {
          status: action === 'accept' ? 'merged' : action === 'reject' ? 'rejected' : 'ignored',
          reviewedAt: new Date(),
          reviewedBy: req.user!.id,
        },
      });

      res.json({ success: true, message: 'Feedback saved' });
    } catch (error) {
      next(error);
    }
  });

  // Ver histórico de merges
  app.get(`${base}/history`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const history = await prisma.mergeHistory.findMany({
        where: { companyId: req.companyId! },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      res.json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  });

  // Desfazer merge (rollback)
  app.post(`${base}/rollback/:mergeId`, authenticate, tenantIsolation, adminOnly, async (req, res, next) => {
    try {
      const merge = await prisma.mergeHistory.findFirst({
        where: {
          id: req.params.mergeId,
          companyId: req.companyId!,
        },
      });

      if (!merge) {
        return res.status(404).json({ success: false, error: { message: 'Merge not found' } });
      }

      // Restaurar entidade merged (recreate since we use hard delete)
      if (merge.entityType === 'contact') {
        const contactData = merge.mergedData as any;
        await prisma.contact.create({
          data: {
            id: merge.mergedId,
            companyId: req.companyId!,
            name: contactData.name || 'Unknown',
            email: contactData.email,
            phone: contactData.phone,
            companyName: contactData.companyName,
            position: contactData.position,
            tags: contactData.tags || [],
            customFields: contactData.customFields || {},
            leadScore: contactData.leadScore || 0,
            leadSource: contactData.leadSource,
          },
        });
      }

      res.json({ success: true, message: 'Merge rolled back' });
    } catch (error) {
      next(error);
    }
  });

  // Auto-merge (merge automático de duplicatas óbvias)
  app.post(`${base}/auto-merge`, authenticate, tenantIsolation, adminOnly, async (req, res, next) => {
    try {
      // Detectar duplicatas com alta confiança (>95%)
      const groups = await agent.detectDuplicates('contact', req.companyId!, 0.95);

      let mergedCount = 0;

      for (const group of groups) {
        if (group.length >= 2) {
          const primary = group[0].primary;
          const duplicates = group.slice(1).map(g => g.duplicate.id);

          await agent.mergeDuplicates(req.companyId!, primary.id, duplicates, 'contact');
          mergedCount += duplicates.length;
        }
      }

      res.json({
        success: true,
        data: {
          groups: groups.length,
          mergedCount,
        },
      });
    } catch (error) {
      next(error);
    }
  });
}

export const deduplicationModule: ModuleDefinition = {
  name: 'deduplication',
  version: '1.0.0',
  provides: ['deduplication', 'merge'],
  routes: (ctx) => setupRoutes(ctx.app, ctx.prisma),
};
