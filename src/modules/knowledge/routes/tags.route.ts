import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupKnowledgeTagsRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  app.get(`${baseUrl}/tags`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const nodes = await prisma.knowledgeNode.findMany({
        where: { companyId: req.companyId!, deletedAt: null },
        select: { tags: true },
      });

      const tagCounts = new Map<string, number>();
      nodes.forEach(node => {
        node.tags.forEach(tag => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      });

      const tags = Array.from(tagCounts.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count);

      res.json({ success: true, data: tags });
    } catch (error) {
      next(error);
    }
  });
}
