import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../core/middleware';
import { logger } from '../../../core/logger';

export function setupServicesProposalAcceptRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.patch(`${baseUrl}/proposals/:id/accept`, authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;

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

      // Get system settings for fee calculation
      const settings = await prisma.systemSettings.findFirst({
        orderBy: { createdAt: 'desc' },
      });

      const serviceFeePercentage = settings?.serviceFeePercentage || 10.0;
      const minServiceFee = settings?.minServiceFee || 5.0;
      const maxServiceFee = settings?.maxServiceFee;

      // Calculate service fee
      let serviceFee = (proposal.service.budget * serviceFeePercentage) / 100;
      if (serviceFee < minServiceFee) serviceFee = minServiceFee;
      if (maxServiceFee && serviceFee > maxServiceFee) serviceFee = maxServiceFee;

      const totalAmount = proposal.service.budget + serviceFee;

      // Start transaction
      await prisma.$transaction(async (tx) => {
        // Update proposal
        await tx.serviceProposal.update({
          where: { id },
          data: {
            status: 'accepted',
            reviewedAt: new Date(),
          },
        });

        // Reject other proposals
        await tx.serviceProposal.updateMany({
          where: {
            serviceId: proposal.serviceId,
            id: { not: id },
            status: 'pending',
          },
          data: {
            status: 'rejected',
          },
        });

        // Update service
        await tx.service.update({
          where: { id: proposal.serviceId },
          data: {
            status: 'in_progress',
            acceptedById: proposal.proposerId,
            acceptedByType: proposal.proposerType,
          },
        });

        // Create transaction
        await tx.serviceTransaction.create({
          data: {
            serviceId: proposal.serviceId,
            providerId: proposal.proposerId,
            clientId: proposal.service.companyId,
            serviceAmount: proposal.service.budget,
            serviceFee,
            totalAmount,
            paymentStatus: 'pending',
            currency: proposal.service.currency,
          },
        });
      });

      logger.info({ userId: user.id, proposalId: id }, 'Service proposal accepted');
      res.json({ message: 'Proposal accepted successfully' });
    } catch (error) {
      next(error);
    }
  });
}
