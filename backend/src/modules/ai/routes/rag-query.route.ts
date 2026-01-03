import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, validateBody } from '../../../core/middleware';
import { RAGService } from '../rag.service';
import { z } from 'zod';

const ragQuerySchema = z.object({ question: z.string().min(1) });

export function setupAiRagQueryRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  const ragService = new RAGService(prisma);
  app.post(`${baseUrl}/rag/query`, authenticate, tenantIsolation, validateBody(ragQuerySchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { question } = req.body;
      const result = await ragService.query(question, req.companyId!);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  });
}
