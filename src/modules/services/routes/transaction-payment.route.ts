import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../core/middleware';
import { logger } from '../../../core/logger';

export function setupServicesTransactionPaymentRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.patch(`${baseUrl}/transactions/:id/payment`, authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const { paymentStatus, paymentMethod, transactionId } = req.body;

      if (!['DEV', 'admin', 'admin_empresa'].includes(user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const transaction = await prisma.serviceTransaction.findUnique({
        where: { id },
      });

      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      if (transaction.clientId !== user.companyId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      await prisma.serviceTransaction.update({
        where: { id },
        data: {
          paymentStatus,
          paymentMethod,
          providerTransactionId: transactionId,
          paidAt: paymentStatus === 'paid' ? new Date() : null,
        },
      });

      logger.info({ userId: user.id, transactionId: id, paymentStatus }, 'Transaction payment updated');
      res.json({ message: 'Payment status updated successfully' });
    } catch (error) {
      next(error);
    }
  });
}
