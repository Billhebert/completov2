import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';
import { companyAdminOnly } from '../../rbac/middleware';

export function setupMcpServersDeleteRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.delete(`${baseUrl}/servers/:id`, authenticate, tenantIsolation, companyAdminOnly, async (req: Request, res: Response, next: NextFunction) => {
    try {
      await prisma.mCPServer.delete({
        where: { id: req.params.id, companyId: req.companyId! },
      });
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });
}
