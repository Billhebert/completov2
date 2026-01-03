import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission } from '../../../core/middleware';

export function setupKnowledgeDeleteRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  app.delete(`${baseUrl}/nodes/:id`, authenticate, tenantIsolation, requirePermission(Permission.KNOWLEDGE_READ), async (req, res, next) => {
    try {
      // Soft delete
      await prisma.knowledgeNode.update({
        where: { id: req.params.id },
        data: { deletedAt: new Date() },
      });
      res.json({ success: true, message: 'Node deleted' });
    } catch (error) {
      next(error);
    }
  });
}
