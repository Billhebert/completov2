import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../core/middleware';
import { logger } from '../../../core/logger';

export function setupServicesGetRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/:id`, authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      const service = await prisma.service.findFirst({
        where: {
          id,
          companyId: user.companyId,
        },
        include: {
          _count: {
            select: {
              proposals: true,
            },
          },
        },
      });

      if (!service) {
        return res.status(404).json({ error: 'Service not found' });
      }

      logger.info({ userId: user.id, serviceId: id }, 'Service retrieved');
      res.json(service);
    } catch (error) {
      next(error);
    }
  });
}
