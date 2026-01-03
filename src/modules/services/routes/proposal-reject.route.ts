import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../core/middleware';
import { logger } from '../../../core/logger';

export function setupServicesProposalRejectRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.patch(`${baseUrl}/proposals/:id/reject`, authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const { reason } = req.body;

      if (!['DEV', 'admin', 'admin_empresa'].includes(user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const proposal = await prisma.serviceProposal.findUnique({
        where: { id },
        include: { service: true },
      });

      if (!proposal) {
        return res.status(404).json({ error: 'Proposal not found' });
      }

      if (proposal.service.companyId !== user.companyId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      if (proposal.status !== 'pending') {
        return res.status(400).json({ error: 'Proposal already processed' });
      }

      await prisma.serviceProposal.update({
        where: { id },
        data: {
          status: 'rejected',
          rejectionReason: reason,
        },
      });

      logger.info({ userId: user.id, proposalId: id }, 'Service proposal rejected');
      res.json({ message: 'Proposal rejected successfully' });
    } catch (error) {
      next(error);
    }
  });
}
