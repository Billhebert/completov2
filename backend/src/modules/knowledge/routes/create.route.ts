import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, validateBody, requirePermission, Permission } from '../../../core/middleware';
import { nodeSchema } from '../helpers/schemas';

export function setupKnowledgeCreateRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  app.post(`${baseUrl}/nodes`, authenticate, tenantIsolation, requirePermission(Permission.KNOWLEDGE_READ), validateBody(nodeSchema), async (req, res, next) => {
    try {
      // Determine if it's a company-wide or personal zettel
      const isCompanyWide = req.body.isCompanyWide !== false; // Default to company-wide
      const ownerId = isCompanyWide ? null : (req.body.ownerId || req.user!.id);

      const node = await prisma.knowledgeNode.create({
        data: {
          ...req.body,
          companyId: req.companyId!,
          createdById: req.user!.id,
          ownerId,
          isCompanyWide,
          tags: req.body.tags || [],
          importanceScore: req.body.importanceScore || 0.5,
        },
      });

      // Auto-index in RAG (vector database)
      try {
        const { getAIService } = await import('../../../core/ai/ai.service');
        const aiService = getAIService(prisma);

        const embedding = await aiService.generateEmbedding(
          `${node.title}\n\n${node.content}\n\nTags: ${node.tags.join(', ')}`
        );

        await prisma.embedding.create({
          data: {
            companyId: req.companyId!,
            nodeId: node.id,
            model: 'text-embedding-ada-002', // or ollama embedding model
            embedding,
          },
        });
      } catch (embeddingError) {
        console.error('Failed to create embedding:', embeddingError);
        // Don't fail the node creation if embedding fails
      }

      res.status(201).json({ success: true, data: node });
    } catch (error) {
      next(error);
    }
  });
}
