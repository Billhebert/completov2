import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';
import { companyAdminOnly } from '../../rbac/middleware';

export function setupMcpResourcesCreateRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}/servers/:id/resources`, authenticate, tenantIsolation, companyAdminOnly, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { uri, name, description, mimeType } = req.body;
      
      const resource = await prisma.mCPResource.create({
        data: {
          serverId: req.params.id,
          uri,
          name,
          description,
          mimeType,
        },
      });
      res.json({ success: true, data: resource });
    } catch (error) {
      next(error);
    }
  });
}
