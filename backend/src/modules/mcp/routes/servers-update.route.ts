import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';
import { companyAdminOnly } from '../../rbac/middleware';

export function setupMcpServersUpdateRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.patch(`${baseUrl}/servers/:id`, authenticate, tenantIsolation, companyAdminOnly, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const server = await prisma.mCPServer.update({
        where: { id: req.params.id, companyId: req.companyId! },
        data: req.body,
      });
      res.json({ success: true, data: server });
    } catch (error) {
      next(error);
    }
  });
}
