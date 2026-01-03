import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupKnowledgeSuggestLinksRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  // AI-powered link suggestions
  app.get(`${baseUrl}/nodes/:id/suggest-links`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const node = await prisma.knowledgeNode.findUnique({
        where: { id: req.params.id },
        include: {
          outgoingLinks: true,
        },
      });

      if (!node) {
        return res.status(404).json({ success: false, error: { message: 'Node not found' } });
      }

      // Get existing link targets to exclude
      const existingLinkTargets = node.outgoingLinks.map(l => l.targetId);

      // Get candidate nodes
      const candidateNodes = await prisma.knowledgeNode.findMany({
        where: {
          companyId: req.companyId!,
          deletedAt: null,
          id: { not: req.params.id, notIn: existingLinkTargets },
        },
        select: { id: true, title: true, content: true, nodeType: true, tags: true },
        take: 30,
      });

      const { getAIService } = await import('../../../core/ai/ai.service');
      const aiService = getAIService(prisma);

      const context = `
        Source Node:
        Title: ${node.title}
        Type: ${node.nodeType}
        Content: ${node.content.substring(0, 500)}

        Potential target nodes:
        ${candidateNodes.map((n, i) => `${i + 1}. [${n.nodeType}] ${n.title}`).join('\n')}

        Suggest which nodes should be linked and what type of relationship:
        - related: general relationship
        - derives: target derives from source
        - supports: target supports source's claims
        - contradicts: target contradicts source
      `;

      const linkSuggestions = await aiService.generateSuggestions(
        context,
        'node links with relationship types (format: "number:linkType")'
      );

      // Parse AI response
      const suggestions = linkSuggestions
        .split(/[,\n]/)
        .map(s => {
          const match = s.trim().match(/(\d+)\s*:\s*(related|derives|supports|contradicts)/);
          if (match) {
            const idx = parseInt(match[1]) - 1;
            const linkType = match[2] as 'related' | 'derives' | 'supports' | 'contradicts';
            if (idx >= 0 && idx < candidateNodes.length) {
              return {
                target: candidateNodes[idx],
                linkType,
                strength: 0.8,
              };
            }
          }
          return null;
        })
        .filter(Boolean)
        .slice(0, 5);

      res.json({ success: true, data: suggestions });
    } catch (error) {
      next(error);
    }
  });
}
