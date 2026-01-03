import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission } from '../../../core/middleware';

export function setupKnowledgeUpdateRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  app.patch(`${baseUrl}/nodes/:id`, authenticate, tenantIsolation, requirePermission(Permission.KNOWLEDGE_READ), async (req, res, next) => {
    try {
      const node = await prisma.knowledgeNode.update({
        where: { id: req.params.id },
        data: req.body,
      });

      // Update embedding in RAG if content/title/tags changed
      if (req.body.title || req.body.content || req.body.tags) {
        try {
          const { getAIService } = await import('../../../core/ai/ai.service');
          const aiService = getAIService(prisma);

          const embedding = await aiService.generateEmbedding(
            `${node.title}\n\n${node.content}\n\nTags: ${node.tags.join(', ')}`
          );

          // Update or create embedding
          await prisma.embedding.upsert({
            where: { nodeId: node.id },
            update: { embedding, model: 'text-embedding-ada-002' },
            create: {
              companyId: node.companyId,
              nodeId: node.id,
              model: 'text-embedding-ada-002',
              embedding,
            },
          });
        } catch (embeddingError) {
          console.error('Failed to update embedding:', embeddingError);
        }
      }

      res.json({ success: true, data: node });
    } catch (error) {
      next(error);
    }
  });
}
