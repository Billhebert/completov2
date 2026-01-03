import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../core/middleware';
import { logger } from '../../../core/logger';

export function setupServicesProposeRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}/:id/propose`, authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: serviceId } = req.params;
      const user = (req as any).user;
      const { proposerType, message, portfolio } = req.body;

      // Check if service exists and is open
      const service = await prisma.service.findFirst({
        where: {
          id: serviceId,
          status: 'open',
          isActive: true,
        },
      });

      if (!service) {
        return res.status(404).json({ error: 'Service not found or not open for proposals' });
      }

      // Validate proposer type is allowed
      if (proposerType === 'company' && !service.allowCompanies) {
        return res.status(403).json({ error: 'Service does not accept company proposals' });
      }
      if (proposerType === 'individual' && !service.allowIndividuals) {
        return res.status(403).json({ error: 'Service does not accept individual proposals' });
      }

      // Check if already proposed
      const existing = await prisma.serviceProposal.findFirst({
        where: {
          serviceId,
          proposerId: user.id,
        },
      });

      if (existing) {
        return res.status(400).json({ error: 'Already submitted a proposal for this service' });
      }

      const proposal = await prisma.serviceProposal.create({
        data: {
          serviceId,
          proposerId: user.id,
          proposerType,
          message,
          portfolio,
          status: 'pending',
        },
      });

      logger.info({ userId: user.id, serviceId, proposalId: proposal.id }, 'Service proposal created');
      res.status(201).json(proposal);
    } catch (error) {
      next(error);
    }
  });
}
