import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';
import { companyAdminOnly } from '../../rbac/middleware';

export function setupMcpServersCreateRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}/servers`, authenticate, tenantIsolation, companyAdminOnly, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, description, type, command, args, env, config, isPublic } = req.body;
      
      const server = await prisma.mCPServer.create({
        data: {
          companyId: req.companyId!,
          name,
          description,
          type: type || 'custom',
          command,
          args,
          env,
          config,
          isPublic: isPublic || false,
          createdBy: req.user!.id,
        },
      });
      res.json({ success: true, data: server });
    } catch (error) {
      next(error);
    }
  });
}
