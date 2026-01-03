import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupKnowledgeConvertRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  // Convert any entity to zettel
  app.post(`${baseUrl}/convert`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const { entityType, entityId, title, content, tags, isPersonal } = req.body;

      if (!entityType || !content) {
        return res.status(400).json({
          success: false,
          error: { message: 'entityType and content are required' }
        });
      }

      // Create zettel from entity
      const node = await prisma.knowledgeNode.create({
        data: {
          title: title || `${entityType}: ${entityId || 'Auto-generated'}`,
          content,
          nodeType: entityType as any,
          tags: tags || [entityType],
          companyId: req.companyId!,
          createdById: req.user!.id,
          isCompanyWide: !isPersonal,
          ownerId: isPersonal ? req.user!.id : null,
          importanceScore: 0.5,
          metadata: {
            sourceEntityType: entityType,
            sourceEntityId: entityId,
            autoConverted: true,
          } as any,
        },
      });

      // Auto-index in RAG
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
            model: 'text-embedding-ada-002',
            embedding,
          },
        });
      } catch (embeddingError) {
        console.error('Failed to create embedding:', embeddingError);
      }

      res.status(201).json({ success: true, data: node });
    } catch (error) {
      next(error);
    }
  });
}
