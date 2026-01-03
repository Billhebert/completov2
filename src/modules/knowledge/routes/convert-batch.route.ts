import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupKnowledgeConvertBatchRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  // Batch convert entities to zettels
  app.post(`${baseUrl}/convert/batch`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const { entities } = req.body;

      if (!Array.isArray(entities) || entities.length === 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'entities array is required' }
        });
      }

      const createdNodes = [];

      for (const entity of entities) {
        try {
          const node = await prisma.knowledgeNode.create({
            data: {
              title: entity.title || `${entity.entityType}: ${entity.entityId}`,
              content: entity.content,
              nodeType: entity.entityType as any,
              tags: entity.tags || [entity.entityType],
              companyId: req.companyId!,
              createdById: req.user!.id,
              isCompanyWide: !entity.isPersonal,
              ownerId: entity.isPersonal ? req.user!.id : null,
              importanceScore: entity.importanceScore || 0.5,
              metadata: {
                sourceEntityType: entity.entityType,
                sourceEntityId: entity.entityId,
                autoConverted: true,
              } as any,
            },
          });

          // Auto-index in RAG (background - don't wait)
          const { getAIService } = await import('../../../core/ai/ai.service');
          const aiService = getAIService(prisma);
          aiService.generateEmbedding(
            `${node.title}\n\n${node.content}\n\nTags: ${node.tags.join(', ')}`
          ).then(embedding => {
            return prisma.embedding.create({
              data: {
                companyId: req.companyId!,
                nodeId: node.id,
                model: 'text-embedding-ada-002',
                embedding,
              },
            });
          }).catch(err => console.error('Embedding error:', err));

          createdNodes.push(node);
        } catch (err) {
          console.error('Failed to convert entity:', err);
        }
      }

      res.status(201).json({
        success: true,
        data: {
          created: createdNodes.length,
          total: entities.length,
          nodes: createdNodes,
        },
      });
    } catch (error) {
      next(error);
    }
  });
}
