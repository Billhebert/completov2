import { Express, Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../core/logger';
import { authenticate, tenantIsolation } from '../../core/middleware';
import { ModuleDefinition } from '../../core/types';
import { EventBus } from '../../core/event-bus';

const router = Router();
const prisma = new PrismaClient();

// GET /api/v1/feedback - List feedback
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { companyId, id: userId } = req.user!;
    const { status, type } = req.query;

    const where: any = { companyId };
    if (status) where.status = status;
    if (type) where.type = type;

    const feedback = await prisma.feedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.json({ success: true, data: feedback });
  } catch (error: any) {
    logger.error({ error }, 'Error listing feedback');
    res.status(500).json({ success: false, error: 'Failed to list feedback' });
  }
});

// POST /api/v1/feedback - Submit feedback
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { companyId, id: userId } = req.user!;
    const { type, subject, message, priority, metadata } = req.body;

    const feedback = await prisma.feedback.create({
      data: {
        companyId,
        userId,
        type: type || 'general',
        subject,
        message,
        priority: priority || 'medium',
        status: 'open',
        metadata: metadata || {},
      },
    });

    res.json({ success: true, data: feedback });
  } catch (error: any) {
    logger.error({ error }, 'Error creating feedback');
    res.status(500).json({ success: false, error: 'Failed to create feedback' });
  }
});

// PATCH /api/v1/feedback/:id - Update feedback status
router.patch('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user!;
    const { id } = req.params;
    const { status, response } = req.body;

    const feedback = await prisma.feedback.update({
      where: { id, companyId },
      data: {
        status,
        response,
        respondedAt: status === 'resolved' ? new Date() : undefined,
      },
    });

    res.json({ success: true, data: feedback });
  } catch (error: any) {
    logger.error({ error }, 'Error updating feedback');
    res.status(500).json({ success: false, error: 'Failed to update feedback' });
  }
});

export default router;

function setupRoutes(app: Express, prisma: PrismaClient, eventBus: EventBus) {
  app.use('/api/v1/feedback', authenticate, tenantIsolation, router);
}

export const feedbackModule: ModuleDefinition = {
  name: 'feedback',
  version: '1.0.0',
  provides: ['feedback', 'support', 'suggestions'],
  routes: (ctx) => setupRoutes(ctx.app, ctx.prisma, ctx.eventBus),
};
