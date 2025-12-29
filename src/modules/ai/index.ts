// src/modules/ai/index.ts
import { ModuleDefinition } from '../../core/types';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, validateBody } from '../../core/middleware';
import { RAGService } from './rag.service';
import { z } from 'zod';

const ragQuerySchema = z.object({
  question: z.string().min(1),
});

const ingestSchema = z.object({
  nodeId: z.string(),
});

function setupRoutes(app: Express, prisma: PrismaClient) {
  const base = '/api/v1/ai';
  const ragService = new RAGService(prisma);

  // RAG Query
  app.post(`${base}/rag/query`, authenticate, tenantIsolation, validateBody(ragQuerySchema), async (req, res, next) => {
    try {
      const { question } = req.body;
      const result = await ragService.query(question, req.companyId!);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  });

  // Ingest knowledge node
  app.post(`${base}/rag/ingest`, authenticate, tenantIsolation, validateBody(ingestSchema), async (req, res, next) => {
    try {
      const { nodeId } = req.body;
      await ragService.ingestNode(nodeId, req.companyId!);
      res.json({ success: true, message: 'Node ingested successfully' });
    } catch (error) {
      next(error);
    }
  });

  // Search knowledge base
  app.get(`${base}/rag/search`, authenticate, tenantIsolation, async (req, res, next) => {
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

  // Simple AI chat (without RAG)
  app.post(`${base}/chat`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      res.json({ 
        success: true, 
        data: { 
          message: 'AI chat endpoint - integrate with OpenAI/Ollama as needed',
          userMessage: req.body.message,
        } 
      });
    } catch (error) {
      next(error);
    }
  });
}

export const aiModule: ModuleDefinition = {
  name: 'ai',
  version: '1.0.0',
  provides: ['ai', 'rag'],
  routes: (ctx) => setupRoutes(ctx.app, ctx.prisma),
};
