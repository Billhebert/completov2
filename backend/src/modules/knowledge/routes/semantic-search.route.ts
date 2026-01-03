import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';
import { cosineSimilarity } from '../helpers/cosine-similarity';

export function setupKnowledgeSemanticSearchRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  // Semantic search using RAG (vector similarity)
  app.post(`${baseUrl}/search/semantic`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const { query, limit = 10, minScore = 0.7 } = req.body;

      if (!query) {
        return res.status(400).json({
          success: false,
          error: { message: 'Query is required' }
        });
      }

      const userRole = (req.user as any)?.role;
      const isDev = userRole === 'dev';
      const isAdminGeral = userRole === 'admin_geral';

      // Generate embedding for query
      const { getAIService } = await import('../../../core/ai/ai.service');
      const aiService = getAIService(prisma);

      const queryEmbedding = await aiService.generateEmbedding(query);

      // Get all embeddings with their nodes (respecting permissions)
      const embeddings = await prisma.embedding.findMany({
        where: isDev || isAdminGeral ? {} : {
          companyId: req.companyId!,
        },
        include: {
          node: {
            where: {
              deletedAt: null,
              ...(isDev || isAdminGeral ? {} : {
                OR: [
                  { isCompanyWide: true },
                  { ownerId: req.user!.id },
                ],
              }),
            },
          },
        },
        take: 500, // Limit for performance
      });

      // Calculate cosine similarity
      const results = embeddings
        .filter(e => e.node) // Only include embeddings with valid nodes
        .map(e => {
          const similarity = cosineSimilarity(queryEmbedding, e.embedding as number[]);
          return {
            node: e.node,
            similarity,
          };
        })
        .filter(r => r.similarity >= minScore)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      res.json({
        success: true,
        data: {
          query,
          results: results.map(r => ({
            ...r.node,
            relevanceScore: r.similarity,
          })),
          count: results.length,
        },
      });
    } catch (error) {
      next(error);
    }
  });
}
