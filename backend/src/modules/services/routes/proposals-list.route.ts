import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../core/middleware';
import { logger } from '../../../core/logger';

export function setupServicesProposalsListRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/:id/proposals`, authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: serviceId } = req.params;
      const user = (req as any).user;

      if (!['DEV', 'admin', 'admin_empresa'].includes(user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const service = await prisma.service.findFirst({
        where: { id: serviceId, companyId: user.companyId },
      });

      if (!service) {
        return res.status(404).json({ error: 'Service not found' });
      }

      const proposals = await prisma.serviceProposal.findMany({
        where: { serviceId },
        include: {
          proposer: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      logger.info({ userId: user.id, serviceId, count: proposals.length }, 'Service proposals listed');
      res.json(proposals);
    } catch (error) {
      next(error);
    }
  });
}
