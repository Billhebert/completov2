import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupFilesListRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { entityType, entityId } = req.query;

      const files = await prisma.file.findMany({
        where: {
          companyId: req.companyId!,
          ...(entityType && { entityType: entityType as string }),
          ...(entityId && { entityId: entityId as string }),
        },
        include: {
          uploadedBy: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ success: true, data: files });
    } catch (error) {
      next(error);
    }
  });
}
