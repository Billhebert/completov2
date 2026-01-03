import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';
import { companyAdminOnly } from '../../rbac/middleware';

export function setupMcpToolsCreateRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}/servers/:id/tools`, authenticate, tenantIsolation, companyAdminOnly, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, description, inputSchema } = req.body;
      
      const tool = await prisma.mCPTool.create({
        data: {
          serverId: req.params.id,
          name,
          description,
          inputSchema,
        },
      });
      res.json({ success: true, data: tool });
    } catch (error) {
      next(error);
    }
  });
}
