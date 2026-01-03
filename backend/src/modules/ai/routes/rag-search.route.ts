import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';
import { RAGService } from '../rag.service';

export function setupAiRagSearchRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  const ragService = new RAGService(prisma);
  app.get(`${baseUrl}/rag/search`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 5;
      if (!query) {
        return res.status(400).json({ success: false, error: { message: 'Query parameter required' } });
      }
      const results = await ragService.search(query, req.companyId!, limit);
      res.json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  });
}
