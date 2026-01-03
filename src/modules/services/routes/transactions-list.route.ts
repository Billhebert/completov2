import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../core/middleware';
import { logger } from '../../../core/logger';

export function setupServicesTransactionsListRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/transactions`, authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { page = 1, pageSize = 20, paymentStatus } = req.query;

      if (!['DEV', 'admin', 'admin_empresa'].includes(user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const skip = (Number(page) - 1) * Number(pageSize);
      const take = Number(pageSize);

      const where: any = {
        clientId: user.companyId,
      };

      if (paymentStatus) where.paymentStatus = paymentStatus;

      const [transactions, total] = await Promise.all([
        prisma.serviceTransaction.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: {
            service: {
              select: {
                id: true,
                title: true,
                category: true,
              },
            },
            provider: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }),
        prisma.serviceTransaction.count({ where }),
      ]);

      logger.info({ userId: user.id, count: transactions.length }, 'Service transactions listed');

      res.json({
        data: transactions,
        total,
        page: Number(page),
        pageSize: take,
        totalPages: Math.ceil(total / take),
      });
    } catch (error) {
      next(error);
    }
  });
}
