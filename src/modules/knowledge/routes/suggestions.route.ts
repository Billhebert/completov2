import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupKnowledgeSuggestionsRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  // AI-powered node suggestions (with access to both company and personal zettels)
  app.get(`${baseUrl}/nodes/:id/suggestions`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const node = await prisma.knowledgeNode.findUnique({
        where: { id: req.params.id },
      });

      if (!node) {
        return res.status(404).json({ success: false, error: { message: 'Node not found' } });
      }

      const userRole = (req.user as any)?.role;
      const isDev = userRole === 'dev';
      const isAdminGeral = userRole === 'admin_geral';

      // Get all candidate nodes (AI can access both company and user zettels)
      const candidateNodes = await prisma.knowledgeNode.findMany({
        where: {
          ...(isDev || isAdminGeral ? {} : { companyId: req.companyId! }),
          deletedAt: null,
          id: { not: req.params.id },
          // AI can see company zettels + user's personal zettels for better context
          ...(isDev || isAdminGeral ? {} : {
            OR: [
              { isCompanyWide: true },
              { ownerId: req.user!.id },
            ],
          }),
        },
        select: { id: true, title: true, content: true, tags: true, nodeType: true, isCompanyWide: true },
        take: 50,
      });

      // Use AI to find semantically related nodes
      const { getAIService } = await import('../../../core/ai/ai.service');
      const aiService = getAIService(prisma);

      const context = `
        Current Node:
        Title: ${node.title}
        Type: ${node.nodeType}
        Content: ${node.content.substring(0, 500)}
        Tags: ${node.tags.join(', ')}

        Find the most relevant nodes from this list:
        ${candidateNodes.map((n, i) => `${i + 1}. [${n.nodeType}] ${n.title} - Tags: ${n.tags.join(', ')}`).join('\n')}
      `;

      const aiResult = await aiService.generateSuggestions(
        context,
        'related knowledge nodes (return only node numbers, comma-separated)'
      );

      // Parse AI response to get suggested node indices
      const suggestedIndices = aiResult
        .match(/\d+/g)
        ?.map(n => parseInt(n) - 1)
        .filter(i => i >= 0 && i < candidateNodes.length)
        .slice(0, 10) || [];

      const aiSuggestions = suggestedIndices.map(i => candidateNodes[i]);

      // Fallback to tag-based if AI returns nothing
      const suggestions = aiSuggestions.length > 0 ? aiSuggestions : await prisma.knowledgeNode.findMany({
        where: {
          companyId: req.companyId!,
          deletedAt: null,
          id: { not: req.params.id },
          tags: { hasSome: node.tags },
        },
        take: 10,
        orderBy: { importanceScore: 'desc' },
      });

      res.json({ success: true, data: suggestions, aiPowered: aiSuggestions.length > 0 });
    } catch (error) {
      next(error);
    }
  });
}
