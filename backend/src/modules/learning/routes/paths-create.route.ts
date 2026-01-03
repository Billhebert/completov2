import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, validateBody, requirePermission, Permission } from '../../../core/middleware';
import { learningPathSchema } from '../schemas';

export function setupPathsCreateRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}/paths`, authenticate, tenantIsolation, requirePermission(Permission.USER_READ), validateBody(learningPathSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const path = await prisma.learningPath.create({
        data: { ...req.body, companyId: req.companyId!, createdBy: req.user!.id },
      });
      res.status(201).json({ success: true, data: path });
    } catch (error) { next(error); }
  });
}
