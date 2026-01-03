import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission } from '../../../core/middleware';

export function setupKnowledgeDeleteLinkRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  app.delete(`${baseUrl}/links/:id`, authenticate, tenantIsolation, requirePermission(Permission.KNOWLEDGE_READ), async (req, res, next) => {
    try {
      await prisma.knowledgeLink.delete({
        where: { id: req.params.id },
      });
      res.json({ success: true, message: 'Link deleted' });
    } catch (error) {
      next(error);
    }
  });
}
