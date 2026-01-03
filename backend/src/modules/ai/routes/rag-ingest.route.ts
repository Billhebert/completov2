import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, validateBody } from '../../../core/middleware';
import { RAGService } from '../rag.service';
import { z } from 'zod';

const ingestSchema = z.object({ nodeId: z.string() });

export function setupAiRagIngestRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  const ragService = new RAGService(prisma);
  app.post(`${baseUrl}/rag/ingest`, authenticate, tenantIsolation, validateBody(ingestSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { nodeId } = req.body;
      await ragService.ingestNode(nodeId, req.companyId!);
      res.json({ success: true, message: 'Node ingested successfully' });
    } catch (error) {
      next(error);
    }
  });
}
