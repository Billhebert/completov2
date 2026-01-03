import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupKnowledgeGetRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  app.get(`${baseUrl}/nodes/:id`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const node = await prisma.knowledgeNode.findFirst({
        where: {
          id: req.params.id,
          companyId: req.companyId!,
          deletedAt: null,
        },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          outgoingLinks: {
            include: {
              target: {
                select: { id: true, title: true, nodeType: true, tags: true },
              },
            },
          },
          incomingLinks: {
            include: {
              source: {
                select: { id: true, title: true, nodeType: true, tags: true },
              },
            },
          },
          embeddings: true,
        },
      });

      if (!node) {
        return res.status(404).json({ success: false, error: { message: 'Node not found' } });
      }

      // Increment access count
      await prisma.knowledgeNode.update({
        where: { id: req.params.id },
        data: { accessCount: { increment: 1 } },
      });

      res.json({ success: true, data: node });
    } catch (error) {
      next(error);
    }
  });
}
