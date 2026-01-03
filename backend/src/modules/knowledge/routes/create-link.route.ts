import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, validateBody, requirePermission, Permission } from '../../../core/middleware';
import { linkSchema } from '../helpers/schemas';

export function setupKnowledgeCreateLinkRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  app.post(`${baseUrl}/nodes/:id/links`, authenticate, tenantIsolation, requirePermission(Permission.KNOWLEDGE_READ), validateBody(linkSchema), async (req, res, next) => {
    try {
      const { targetId, linkType, strength } = req.body;

      const link = await prisma.knowledgeLink.create({
        data: {
          companyId: req.companyId!,
          sourceId: req.params.id,
          targetId,
          linkType,
          strength: strength || 1.0,
        },
        include: {
          source: { select: { id: true, title: true } },
          target: { select: { id: true, title: true } },
        },
      });

      res.status(201).json({ success: true, data: link });
    } catch (error) {
      next(error);
    }
  });
}
