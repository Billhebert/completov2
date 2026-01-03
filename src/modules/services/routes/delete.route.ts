import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../core/middleware';
import { logger } from '../../../core/logger';

export function setupServicesDeleteRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.delete(`${baseUrl}/:id`, authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      // Only admin_empresa can delete services
      if (!['DEV', 'admin', 'admin_empresa'].includes(user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const existing = await prisma.service.findFirst({
        where: { id, companyId: user.companyId },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Service not found' });
      }

      // Cannot delete if service is already in progress or completed
      if (existing.status === 'in_progress' || existing.status === 'completed') {
        return res.status(400).json({
          error: 'Cannot delete service in progress or completed'
        });
      }

      await prisma.service.delete({ where: { id } });

      logger.info({ userId: user.id, serviceId: id }, 'Service deleted');
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
}
