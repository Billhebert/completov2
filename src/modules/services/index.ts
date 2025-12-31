// src/modules/services/index.ts
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../core/logger';
import { authenticate } from '../../core/middleware/auth';
import { getPartnerCompanyIds } from '../partnerships';

const router = Router();
const prisma = new PrismaClient();

// Alias for consistency
const authenticateToken = authenticate;

// ============================================
// SERVIÇOS (SERVICES)
// ============================================

// GET /api/v1/services - Listar serviços (com controle de acesso baseado em parcerias)
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      status,
      category,
      minBudget,
      maxBudget,
      search,
    } = req.query;

    const user = (req as any).user;
    const skip = (Number(page) - 1) * Number(pageSize);
    const take = Number(pageSize);

    // Get partner companies that share services
    const partnerCompanyIds = await getPartnerCompanyIds(user.companyId);

    // Filter partners that have shareServices = true
    const partnersWithServiceSharing = await prisma.partnership.findMany({
      where: {
        OR: [
          { companyAId: user.companyId, companyBId: { in: partnerCompanyIds }, shareServices: true },
          { companyBId: user.companyId, companyAId: { in: partnerCompanyIds }, shareServices: true },
        ],
        status: 'active',
      },
      select: {
        companyAId: true,
        companyBId: true,
      },
    });

    const partnerIdsWithAccess = partnersWithServiceSharing.map(p =>
      p.companyAId === user.companyId ? p.companyBId : p.companyAId
    );

    // Build where clause: own company + partners with shareServices
    const accessibleCompanyIds = [user.companyId, ...partnerIdsWithAccess];

    const where: any = {
      companyId: { in: accessibleCompanyIds },
      isActive: true,
    };

    if (status) where.status = status;
    if (category) where.category = category;
    if (minBudget) where.budget = { ...where.budget, gte: Number(minBudget) };
    if (maxBudget) where.budget = { ...where.budget, lte: Number(maxBudget) };
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          company: {
            select: { id: true, name: true, domain: true },
          },
          _count: {
            select: {
              proposals: true,
            },
          },
        },
      }),
      prisma.service.count({ where }),
    ]);

    logger.info(
      { userId: user.id, ownCompany: user.companyId, partnersCount: partnerIdsWithAccess.length, servicesCount: services.length },
      'Services listed with partnership access'
    );

    res.json({
      data: services,
      total,
      page: Number(page),
      pageSize: take,
      totalPages: Math.ceil(total / take),
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error listing services');
    res.status(500).json({ error: 'Failed to list services' });
  }
});

// GET /api/v1/services/:id - Get specific service
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
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
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error getting service');
    res.status(500).json({ error: 'Failed to get service' });
  }
});

// POST /api/v1/services - Create service
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    // Only admin_empresa can create services
    if (!['DEV', 'admin', 'admin_empresa'].includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const data = req.body;

    const service = await prisma.service.create({
      data: {
        ...data,
        companyId: user.companyId,
        createdBy: user.id,
      },
      include: {
        _count: {
          select: {
            proposals: true,
          },
        },
      },
    });

    logger.info({ userId: user.id, serviceId: service.id }, 'Service created');
    res.status(201).json(service);
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error creating service');
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// PUT /api/v1/services/:id - Update service
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    // Only admin_empresa can update services
    if (!['DEV', 'admin', 'admin_empresa'].includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const existing = await prisma.service.findFirst({
      where: { id, companyId: user.companyId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Cannot update if service is already in progress or completed
    if (existing.status === 'in_progress' || existing.status === 'completed') {
      return res.status(400).json({
        error: 'Cannot update service in progress or completed'
      });
    }

    const data = req.body;
    const service = await prisma.service.update({
      where: { id },
      data,
      include: {
        _count: {
          select: {
            proposals: true,
          },
        },
      },
    });

    logger.info({ userId: user.id, serviceId: id }, 'Service updated');
    res.json(service);
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error updating service');
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// DELETE /api/v1/services/:id - Delete service
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
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
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error deleting service');
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// ============================================
// SERVICE PROPOSALS
// ============================================

// POST /api/v1/services/:id/propose - Submit proposal
router.post('/:id/propose', authenticateToken, async (req: Request, res: Response) => {
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
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error creating service proposal');
    res.status(500).json({ error: 'Failed to submit proposal' });
  }
});

// GET /api/v1/services/:id/proposals - List proposals for a service (admin only)
router.get('/:id/proposals', authenticateToken, async (req: Request, res: Response) => {
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
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error listing service proposals');
    res.status(500).json({ error: 'Failed to list proposals' });
  }
});

// PATCH /api/v1/services/proposals/:id/accept - Accept proposal (admin only)
router.patch('/proposals/:id/accept', authenticateToken, async (req: Request, res: Response) => {
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
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error accepting proposal');
    res.status(500).json({ error: 'Failed to accept proposal' });
  }
});

// PATCH /api/v1/services/proposals/:id/reject - Reject proposal (admin only)
router.patch('/proposals/:id/reject', authenticateToken, async (req: Request, res: Response) => {
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
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error rejecting proposal');
    res.status(500).json({ error: 'Failed to reject proposal' });
  }
});

// ============================================
// SERVICE COMPLETION
// ============================================

// PATCH /api/v1/services/:id/complete - Mark service as completed
router.patch('/:id/complete', authenticateToken, async (req: Request, res: Response) => {
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
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error completing service');
    res.status(500).json({ error: 'Failed to complete service' });
  }
});

// PATCH /api/v1/services/:id/rate - Rate completed service (admin only)
router.patch('/:id/rate', authenticateToken, async (req: Request, res: Response) => {
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
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error rating service');
    res.status(500).json({ error: 'Failed to rate service' });
  }
});

// ============================================
// SERVICE TRANSACTIONS
// ============================================

// GET /api/v1/services/transactions - List transactions (admin only)
router.get('/transactions', authenticateToken, async (req: Request, res: Response) => {
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
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error listing transactions');
    res.status(500).json({ error: 'Failed to list transactions' });
  }
});

// PATCH /api/v1/services/transactions/:id/payment - Update payment status (admin only)
router.patch('/transactions/:id/payment', authenticateToken, async (req: Request, res: Response) => {
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
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error updating payment');
    res.status(500).json({ error: 'Failed to update payment status' });
  }
});

export default router;

// Module export
import { ModuleDefinition } from '../../core/types';
import { EventBus } from '../../core/event-bus';

function setupRoutes(app: Express, prisma: PrismaClient, eventBus: EventBus) {
  app.use('/api/v1/services', router);
}

export const servicesModule: ModuleDefinition = {
  name: 'services',
  version: '1.0.0',
  provides: ['services', 'marketplace', 'proposals'],
  routes: (ctx) => setupRoutes(ctx.app, ctx.prisma, ctx.eventBus),
};
