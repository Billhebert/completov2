import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../core/middleware';
import { logger } from '../../../core/logger';

export function setupServicesCreateRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}`, authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;

      // Only admin_empresa can create services
      if (!['DEV', 'admin', 'admin_empresa'].includes(user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const data = req.body;

      const service = await prisma.service.create({
        data: {
          ...data,
          companyId: user.companyId,
          createdBy: user.id,
        },
        include: {
          _count: {
            select: {
              proposals: true,
            },
          },
        },
      });

      logger.info({ userId: user.id, serviceId: service.id }, 'Service created');
      res.status(201).json(service);
    } catch (error) {
      next(error);
    }
  });
}
