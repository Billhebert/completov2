import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, validateBody } from '../../../core/middleware';
import { logger } from '../../../core/logger';
import { generateNarrative } from '../services/narrative.service';
import { z } from 'zod';

const generateNarrativeSchema = z.object({
  type: z.string().min(1),
  entityId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  format: z.enum(['summary', 'timeline', 'lessons', 'risks'])
});

export function setupNarrativeGenerateRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  app.post(
    `${baseUrl}/generate`,
    authenticate,
    tenantIsolation,
    validateBody(generateNarrativeSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { companyId } = req.user!;
        const { type, entityId, startDate, endDate, format } = req.body;

        // 1. Coletar evidências (zettels)
        const where: any = { companyId, deletedAt: null };

        if (entityId) {
          where.entities = { path: ['contactId'], equals: entityId };
        }

        if (startDate || endDate) {
          where.createdAt = {};
          if (startDate) where.createdAt.gte = new Date(startDate);
          if (endDate) where.createdAt.lte = new Date(endDate);
        }

        const evidences = await prisma.knowledgeNode.findMany({
          where,
          orderBy: { createdAt: 'asc' },
          take: 100
        });

        if (evidences.length === 0) {
          return res.status(404).json({ error: 'No evidence found for narrative' });
        }

        // 2. Gerar narrativa com LLM
        const narrative = await generateNarrative(evidences, format, type);

        // 3. Adicionar referências
        const sources = evidences.map(e => ({
          nodeId: e.id,
          title: e.title,
          type: e.nodeType
        }));

        res.json({
          title: `Narrativa: ${type}`,
          content: narrative,
          sources,
          generatedAt: new Date()
        });
      } catch (error: any) {
        logger.error({ error }, 'Error generating narrative');
        next(error);
      }
    }
  );
}
