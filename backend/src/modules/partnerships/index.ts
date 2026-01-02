// src/modules/partnerships/index.ts
import { Express, Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../core/logger';
import { authenticate } from '../../core/middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Alias for consistency
const authenticateToken = authenticate;

// ============================================
// PARTNERSHIPS
// ============================================

// GET /api/v1/partnerships - List company partnerships
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { status, page = 1, pageSize = 20 } = req.query;

    const skip = (Number(page) - 1) * Number(pageSize);
    const take = Number(pageSize);

    const where: any = {
      OR: [
        { companyAId: user.companyId },
        { companyBId: user.companyId },
      ],
    };

    if (status) where.status = status;

    const [partnerships, total] = await Promise.all([
      prisma.partnership.findMany({
        where,
        skip,
        take,
        include: {
          companyA: { select: { id: true, name: true, domain: true } },
          companyB: { select: { id: true, name: true, domain: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.partnership.count({ where }),
    ]);

    logger.info({ userId: user.id, count: partnerships.length }, 'Partnerships listed');

    res.json({
      data: partnerships,
      total,
      page: Number(page),
      pageSize: take,
      totalPages: Math.ceil(total / take),
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error listing partnerships');
    res.status(500).json({ error: 'Failed to list partnerships' });
  }
});

// GET /api/v1/partnerships/:id - Get specific partnership
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const partnership = await prisma.partnership.findFirst({
      where: {
        id,
        OR: [
          { companyAId: user.companyId },
          { companyBId: user.companyId },
        ],
      },
      include: {
        companyA: { select: { id: true, name: true, domain: true } },
        companyB: { select: { id: true, name: true, domain: true } },
      },
    });

    if (!partnership) {
      return res.status(404).json({ error: 'Partnership not found' });
    }

    logger.info({ userId: user.id, partnershipId: id }, 'Partnership retrieved');
    res.json(partnership);
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error getting partnership');
    res.status(500).json({ error: 'Failed to get partnership' });
  }
});

// POST /api/v1/partnerships - Create partnership (via accepted invite)
// This is usually called after accepting an invite, but can also be direct
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    // Only admin_empresa can create partnerships
    if (!['DEV', 'admin', 'admin_empresa'].includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const {
      partnerCompanyId,
      name,
      description,
      type,
      shareJobs,
      shareServices,
      shareResources,
      terms,
    } = req.body;

    // Check if partnership already exists
    const existing = await prisma.partnership.findFirst({
      where: {
        OR: [
          { companyAId: user.companyId, companyBId: partnerCompanyId },
          { companyAId: partnerCompanyId, companyBId: user.companyId },
        ],
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Partnership already exists' });
    }

    const partnership = await prisma.partnership.create({
      data: {
        companyAId: user.companyId,
        companyBId: partnerCompanyId,
        name,
        description,
        type: type || 'general',
        shareJobs: shareJobs !== undefined ? shareJobs : true,
        shareServices: shareServices !== undefined ? shareServices : true,
        shareResources: shareResources !== undefined ? shareResources : false,
        terms,
        status: 'active',
        createdBy: user.id,
        approvedBy: user.id,
        approvedAt: new Date(),
      },
      include: {
        companyA: { select: { id: true, name: true, domain: true } },
        companyB: { select: { id: true, name: true, domain: true } },
      },
    });

    logger.info({ userId: user.id, partnershipId: partnership.id }, 'Partnership created');
    res.status(201).json(partnership);
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error creating partnership');
    res.status(500).json({ error: 'Failed to create partnership' });
  }
});

// PATCH /api/v1/partnerships/:id - Update partnership
router.patch('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    if (!['DEV', 'admin', 'admin_empresa'].includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const existing = await prisma.partnership.findFirst({
      where: {
        id,
        OR: [
          { companyAId: user.companyId },
          { companyBId: user.companyId },
        ],
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Partnership not found' });
    }

    const { name, description, shareJobs, shareServices, shareResources, status, endDate } = req.body;

    const partnership = await prisma.partnership.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(shareJobs !== undefined && { shareJobs }),
        ...(shareServices !== undefined && { shareServices }),
        ...(shareResources !== undefined && { shareResources }),
        ...(status !== undefined && { status }),
        ...(endDate !== undefined && { endDate }),
      },
      include: {
        companyA: { select: { id: true, name: true, domain: true } },
        companyB: { select: { id: true, name: true, domain: true } },
      },
    });

    logger.info({ userId: user.id, partnershipId: id }, 'Partnership updated');
    res.json(partnership);
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error updating partnership');
    res.status(500).json({ error: 'Failed to update partnership' });
  }
});

// DELETE /api/v1/partnerships/:id - Terminate partnership
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    if (!['DEV', 'admin', 'admin_empresa'].includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const existing = await prisma.partnership.findFirst({
      where: {
        id,
        OR: [
          { companyAId: user.companyId },
          { companyBId: user.companyId },
        ],
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Partnership not found' });
    }

    // Soft delete by updating status to terminated
    await prisma.partnership.update({
      where: { id },
      data: {
        status: 'terminated',
        endDate: new Date(),
      },
    });

    logger.info({ userId: user.id, partnershipId: id }, 'Partnership terminated');
    res.status(204).send();
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error terminating partnership');
    res.status(500).json({ error: 'Failed to terminate partnership' });
  }
});

// ============================================
// PARTNERSHIP INVITES
// ============================================

// GET /api/v1/partnerships/invites - List invites (sent and received)
router.get('/invites', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { type, status, page = 1, pageSize = 20 } = req.query;

    const skip = (Number(page) - 1) * Number(pageSize);
    const take = Number(pageSize);

    let where: any = {};

    if (type === 'sent') {
      where.fromCompanyId = user.companyId;
    } else if (type === 'received') {
      where.toCompanyId = user.companyId;
    } else {
      where.OR = [
        { fromCompanyId: user.companyId },
        { toCompanyId: user.companyId },
      ];
    }

    if (status) where.status = status;

    const [invites, total] = await Promise.all([
      prisma.partnershipInvite.findMany({
        where,
        skip,
        take,
        include: {
          fromCompany: { select: { id: true, name: true, domain: true } },
          toCompany: { select: { id: true, name: true, domain: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.partnershipInvite.count({ where }),
    ]);

    logger.info({ userId: user.id, count: invites.length }, 'Partnership invites listed');

    res.json({
      data: invites,
      total,
      page: Number(page),
      pageSize: take,
      totalPages: Math.ceil(total / take),
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error listing partnership invites');
    res.status(500).json({ error: 'Failed to list invites' });
  }
});

// POST /api/v1/partnerships/invites - Send partnership invite
router.post('/invites', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!['DEV', 'admin', 'admin_empresa'].includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const {
      toCompanyId,
      message,
      shareJobs,
      shareServices,
      shareResources,
      proposedTerms,
      expiresAt,
    } = req.body;

    if (!toCompanyId) {
      return res.status(400).json({ error: 'toCompanyId is required' });
    }

    // Check if invite already exists
    const existing = await prisma.partnershipInvite.findFirst({
      where: {
        fromCompanyId: user.companyId,
        toCompanyId,
        status: 'pending',
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Pending invite already exists' });
    }

    // Check if partnership already exists
    const existingPartnership = await prisma.partnership.findFirst({
      where: {
        OR: [
          { companyAId: user.companyId, companyBId: toCompanyId },
          { companyAId: toCompanyId, companyBId: user.companyId },
        ],
        status: 'active',
      },
    });

    if (existingPartnership) {
      return res.status(400).json({ error: 'Partnership already exists' });
    }

    const invite = await prisma.partnershipInvite.create({
      data: {
        fromCompanyId: user.companyId,
        toCompanyId,
        message,
        shareJobs: shareJobs !== undefined ? shareJobs : true,
        shareServices: shareServices !== undefined ? shareServices : true,
        shareResources: shareResources !== undefined ? shareResources : false,
        proposedTerms,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        status: 'pending',
        createdBy: user.id,
      },
      include: {
        fromCompany: { select: { id: true, name: true, domain: true } },
        toCompany: { select: { id: true, name: true, domain: true } },
      },
    });

    logger.info({ userId: user.id, inviteId: invite.id }, 'Partnership invite sent');
    res.status(201).json(invite);
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error sending partnership invite');
    res.status(500).json({ error: 'Failed to send invite' });
  }
});

// PATCH /api/v1/partnerships/invites/:id/accept - Accept partnership invite
router.patch('/invites/:id/accept', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    if (!['DEV', 'admin', 'admin_empresa'].includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const invite = await prisma.partnershipInvite.findFirst({
      where: {
        id,
        toCompanyId: user.companyId,
        status: 'pending',
      },
    });

    if (!invite) {
      return res.status(404).json({ error: 'Invite not found or already processed' });
    }

    // Check if expired
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      await prisma.partnershipInvite.update({
        where: { id },
        data: { status: 'expired' },
      });
      return res.status(400).json({ error: 'Invite has expired' });
    }

    // Create partnership and update invite in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update invite
      await tx.partnershipInvite.update({
        where: { id },
        data: {
          status: 'accepted',
          respondedBy: user.id,
          respondedAt: new Date(),
        },
      });

      // Create partnership
      const partnership = await tx.partnership.create({
        data: {
          companyAId: invite.fromCompanyId,
          companyBId: invite.toCompanyId,
          shareJobs: invite.shareJobs,
          shareServices: invite.shareServices,
          shareResources: invite.shareResources,
          terms: invite.proposedTerms as any,
          status: 'active',
          createdBy: invite.createdBy,
          approvedBy: user.id,
          approvedAt: new Date(),
        },
        include: {
          companyA: { select: { id: true, name: true, domain: true } },
          companyB: { select: { id: true, name: true, domain: true } },
        },
      });

      return partnership;
    });

    logger.info({ userId: user.id, inviteId: id }, 'Partnership invite accepted');
    res.json(result);
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error accepting partnership invite');
    res.status(500).json({ error: 'Failed to accept invite' });
  }
});

// PATCH /api/v1/partnerships/invites/:id/reject - Reject partnership invite
router.patch('/invites/:id/reject', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const { reason } = req.body;

    if (!['DEV', 'admin', 'admin_empresa'].includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const invite = await prisma.partnershipInvite.findFirst({
      where: {
        id,
        toCompanyId: user.companyId,
        status: 'pending',
      },
    });

    if (!invite) {
      return res.status(404).json({ error: 'Invite not found or already processed' });
    }

    await prisma.partnershipInvite.update({
      where: { id },
      data: {
        status: 'rejected',
        respondedBy: user.id,
        respondedAt: new Date(),
        rejectionReason: reason,
      },
    });

    logger.info({ userId: user.id, inviteId: id }, 'Partnership invite rejected');
    res.json({ message: 'Invite rejected successfully' });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error rejecting partnership invite');
    res.status(500).json({ error: 'Failed to reject invite' });
  }
});

// Helper function to get partner companies for access control
export async function getPartnerCompanyIds(companyId: string): Promise<string[]> {
  const partnerships = await prisma.partnership.findMany({
    where: {
      OR: [
        { companyAId: companyId, status: 'active' },
        { companyBId: companyId, status: 'active' },
      ],
    },
    select: {
      companyAId: true,
      companyBId: true,
    },
  });

  const partnerIds = partnerships.map((p) =>
    p.companyAId === companyId ? p.companyBId : p.companyAId
  );

  return partnerIds;
}

export default router;

// Module export
import { ModuleDefinition } from '../../core/types';
import { EventBus } from '../../core/event-bus';

function setupRoutes(app: Express, prisma: PrismaClient, eventBus: EventBus) {
  app.use('/api/v1/partnerships', router);
}

export const partnershipsModule: ModuleDefinition = {
  name: 'partnerships',
  version: '1.0.0',
  provides: ['partnerships', 'collaborations', 'invites'],
  routes: (ctx) => setupRoutes(ctx.app, ctx.prisma, ctx.eventBus),
};
