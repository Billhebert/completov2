import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../core/middleware';
import { logger } from '../../../core/logger';

export function setupServicesCompleteRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.patch(`${baseUrl}/:id/complete`, authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const { deliverables, notes } = req.body;

      const service = await prisma.service.findFirst({
        where: { id },
      });

      if (!service) {
        return res.status(404).json({ error: 'Service not found' });
      }

      // Only the accepted provider can mark as completed
      if (service.acceptedById !== user.id) {
        return res.status(403).json({ error: 'Only the service provider can mark as completed' });
      }

      if (service.status !== 'in_progress') {
        return res.status(400).json({ error: 'Service is not in progress' });
      }

      await prisma.service.update({
        where: { id },
        data: {
          status: 'completed',
          completionDate: new Date(),
        },
      });

      logger.info({ userId: user.id, serviceId: id }, 'Service marked as completed');
      res.json({ message: 'Service marked as completed' });
    } catch (error) {
      next(error);
    }
  });
}
