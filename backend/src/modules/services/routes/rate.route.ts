import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../core/middleware';
import { logger } from '../../../core/logger';

export function setupServicesRateRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.patch(`${baseUrl}/:id/rate`, authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const { rating, feedback } = req.body;

      if (!['DEV', 'admin', 'admin_empresa'].includes(user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const service = await prisma.service.findFirst({
        where: { id, companyId: user.companyId },
      });

      if (!service) {
        return res.status(404).json({ error: 'Service not found' });
      }

      if (service.status !== 'completed') {
        return res.status(400).json({ error: 'Can only rate completed services' });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }

      await prisma.service.update({
        where: { id },
        data: {
          rating,
          feedback,
        },
      });

      logger.info({ userId: user.id, serviceId: id, rating }, 'Service rated');
      res.json({ message: 'Service rated successfully' });
    } catch (error) {
      next(error);
    }
  });
}
