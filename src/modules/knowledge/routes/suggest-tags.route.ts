import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupKnowledgeSuggestTagsRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  // AI-powered tag suggestions for content
  app.post(`${baseUrl}/nodes/suggest-tags`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const { title, content } = req.body;

      if (!title || !content) {
        return res.status(400).json({
          success: false,
          error: { message: 'Title and content are required' }
        });
      }

      // Get existing tags in the company for context
      const existingNodes = await prisma.knowledgeNode.findMany({
        where: { companyId: req.companyId!, deletedAt: null },
        select: { tags: true },
        take: 100,
      });

      const allTags = new Set<string>();
      existingNodes.forEach(node => {
        node.tags.forEach(tag => allTags.add(tag));
      });

      const { getAIService } = await import('../../../core/ai/ai.service');
      const aiService = getAIService(prisma);

      const context = `
        Title: ${title}
        Content: ${content.substring(0, 1000)}

        Existing tags in knowledge base: ${Array.from(allTags).join(', ')}

        Suggest 3-7 relevant tags for this knowledge node. Prefer existing tags when applicable, but suggest new ones if needed.
      `;

      const tagSuggestions = await aiService.generateSuggestions(
        context,
        'relevant tags (return as comma-separated list)'
      );

      // Parse tags from AI response
      const tags = tagSuggestions
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0 && t.length < 50)
        .slice(0, 7);

      res.json({ success: true, data: { tags } });
    } catch (error) {
      next(error);
    }
  });
}
