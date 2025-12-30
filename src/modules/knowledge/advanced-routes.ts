import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { logger } from '@core/logger';
import { truthLayerService } from './truth-layer.service';

const router = Router();
const prisma = new PrismaClient();

// ============================================
// SCHEMAS
// ============================================

const ReminderSchema = z.object({
  nodeId: z.string(),
  type: z.enum(['FOLLOW_UP', 'TASK_DUE', 'REVIEW_REQUIRED', 'COMMITMENT']),
  scheduledFor: z.string().datetime(),
  message: z.string()
});

// ============================================
// REMINDERS
// ============================================

/**
 * GET /api/v1/knowledge/reminders
 * Listar reminders do usuário
 */
router.get('/reminders', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { status, nodeId, limit = '50', offset = '0' } = req.query;

    const where: any = { userId };
    if (status) where.status = status;
    if (nodeId) where.nodeId = nodeId;

    const [reminders, total] = await Promise.all([
      prisma.reminder.findMany({
        where,
        include: {
          node: {
            select: { id: true, title: true, nodeType: true }
          }
        },
        orderBy: { scheduledFor: 'asc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string)
      }),
      prisma.reminder.count({ where })
    ]);

    res.json({
      data: reminders,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });
  } catch (error: any) {
    logger.error({ error }, 'Error fetching reminders');
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

/**
 * POST /api/v1/knowledge/reminders
 * Criar reminder manual
 */
router.post('/reminders', async (req: Request, res: Response) => {
  try {
    const { userId, companyId } = req.user!;
    const data = ReminderSchema.parse(req.body);

    // Verificar se node existe e pertence à empresa
    const node = await prisma.knowledgeNode.findFirst({
      where: { id: data.nodeId, companyId }
    });

    if (!node) {
      return res.status(404).json({ error: 'Node not found' });
    }

    const reminder = await prisma.reminder.create({
      data: {
        companyId,
        nodeId: data.nodeId,
        userId,
        type: data.type,
        scheduledFor: new Date(data.scheduledFor),
        message: data.message,
        status: 'PENDING'
      }
    });

    logger.info({ reminderId: reminder.id, userId }, 'Reminder created manually');
    res.status(201).json(reminder);

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    logger.error({ error }, 'Error creating reminder');
    res.status(500).json({ error: 'Failed to create reminder' });
  }
});

/**
 * PATCH /api/v1/knowledge/reminders/:id/snooze
 * Adiar reminder
 */
router.patch('/reminders/:id/snooze', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { snoozedUntil } = req.body;

    if (!snoozedUntil) {
      return res.status(400).json({ error: 'snoozedUntil is required' });
    }

    const reminder = await prisma.reminder.findFirst({
      where: { id, userId }
    });

    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    const updated = await prisma.reminder.update({
      where: { id },
      data: {
        status: 'SNOOZED',
        snoozedUntil: new Date(snoozedUntil),
        scheduledFor: new Date(snoozedUntil)
      }
    });

    res.json(updated);

  } catch (error: any) {
    logger.error({ error }, 'Error snoozing reminder');
    res.status(500).json({ error: 'Failed to snooze reminder' });
  }
});

/**
 * PATCH /api/v1/knowledge/reminders/:id/dismiss
 * Dispensar reminder
 */
router.patch('/reminders/:id/dismiss', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const reminder = await prisma.reminder.findFirst({
      where: { id, userId }
    });

    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    const updated = await prisma.reminder.update({
      where: { id },
      data: {
        status: 'DISMISSED',
        dismissedAt: new Date()
      }
    });

    res.json(updated);

  } catch (error: any) {
    logger.error({ error }, 'Error dismissing reminder');
    res.status(500).json({ error: 'Failed to dismiss reminder' });
  }
});

/**
 * PATCH /api/v1/knowledge/reminders/:id/complete
 * Completar reminder
 */
router.patch('/reminders/:id/complete', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const reminder = await prisma.reminder.findFirst({
      where: { id, userId }
    });

    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    const updated = await prisma.reminder.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    res.json(updated);

  } catch (error: any) {
    logger.error({ error }, 'Error completing reminder');
    res.status(500).json({ error: 'Failed to complete reminder' });
  }
});

// ============================================
// TRUTH LAYER
// ============================================

/**
 * GET /api/v1/knowledge/truth/conflicts
 * Listar conflitos
 */
router.get('/truth/conflicts', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user!;

    const conflictingNodes = await prisma.knowledgeNode.findMany({
      where: {
        companyId,
        truthStatus: 'CONFLICTING',
        deletedAt: null
      },
      include: {
        createdBy: { select: { id: true, name: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({ data: conflictingNodes });

  } catch (error: any) {
    logger.error({ error }, 'Error fetching conflicts');
    res.status(500).json({ error: 'Failed to fetch conflicts' });
  }
});

/**
 * POST /api/v1/knowledge/truth/resolve
 * Resolver conflito entre dois nodes
 */
router.post('/truth/resolve', async (req: Request, res: Response) => {
  try {
    const { role } = req.user!;
    const { winnerNodeId, loserNodeId, rationale } = req.body;

    // Apenas admin/supervisor podem resolver conflitos
    if (role !== 'company_admin' && role !== 'supervisor') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!winnerNodeId || !loserNodeId || !rationale) {
      return res.status(400).json({ error: 'winnerNodeId, loserNodeId and rationale are required' });
    }

    await truthLayerService.resolveConflict(winnerNodeId, loserNodeId, rationale);

    res.json({ message: 'Conflict resolved successfully' });

  } catch (error: any) {
    logger.error({ error }, 'Error resolving conflict');
    res.status(500).json({ error: 'Failed to resolve conflict' });
  }
});

/**
 * GET /api/v1/knowledge/truth/stale
 * Listar conhecimento desatualizado
 */
router.get('/truth/stale', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user!;

    const staleNodes = await prisma.knowledgeNode.findMany({
      where: {
        companyId,
        deletedAt: null,
        freshnessScore: { lt: 0.3 },
        truthStatus: { in: ['ACTIVE', 'SOURCE_OF_TRUTH'] }
      },
      include: {
        createdBy: { select: { id: true, name: true } }
      },
      orderBy: { freshnessScore: 'asc' },
      take: 50
    });

    res.json({ data: staleNodes });

  } catch (error: any) {
    logger.error({ error }, 'Error fetching stale knowledge');
    res.status(500).json({ error: 'Failed to fetch stale knowledge' });
  }
});

/**
 * POST /api/v1/knowledge/nodes/:id/set-truth
 * Marcar node como fonte da verdade
 */
router.post('/nodes/:id/set-truth', async (req: Request, res: Response) => {
  try {
    const { companyId, role } = req.user!;
    const { id } = req.params;

    // Apenas admin/supervisor podem marcar como fonte da verdade
    if (role !== 'company_admin' && role !== 'supervisor') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const node = await prisma.knowledgeNode.findFirst({
      where: { id, companyId }
    });

    if (!node) {
      return res.status(404).json({ error: 'Node not found' });
    }

    const updated = await prisma.knowledgeNode.update({
      where: { id },
      data: {
        truthStatus: 'SOURCE_OF_TRUTH',
        reviewedAt: new Date(),
        freshnessScore: 1.0
      }
    });

    logger.info({ nodeId: id }, 'Node marked as source of truth');
    res.json(updated);

  } catch (error: any) {
    logger.error({ error }, 'Error setting truth status');
    res.status(500).json({ error: 'Failed to set truth status' });
  }
});

/**
 * POST /api/v1/knowledge/nodes/:id/detect-conflicts
 * Detectar conflitos manualmente
 */
router.post('/nodes/:id/detect-conflicts', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user!;
    const { id } = req.params;

    const node = await prisma.knowledgeNode.findFirst({
      where: { id, companyId }
    });

    if (!node) {
      return res.status(404).json({ error: 'Node not found' });
    }

    // Executar detecção em background
    truthLayerService.detectConflicts(id).catch(err => {
      logger.error({ error: err }, 'Background conflict detection failed');
    });

    res.json({ message: 'Conflict detection started' });

  } catch (error: any) {
    logger.error({ error }, 'Error starting conflict detection');
    res.status(500).json({ error: 'Failed to start conflict detection' });
  }
});

/**
 * GET /api/v1/knowledge/auto-suggestions
 * Sugestões automáticas de links
 */
router.get('/auto-suggestions', async (req: Request, res: Response) => {
  try {
    const { companyId, userId } = req.user!;
    const { nodeId } = req.query;

    const where: any = { companyId };
    if (nodeId) where.nodeId = nodeId;

    const suggestions = await prisma.knowledgeSuggestion.findMany({
      where,
      include: {
        node: { select: { id: true, title: true } }
      },
      orderBy: { score: 'desc' },
      take: 20
    });

    res.json({ data: suggestions });

  } catch (error: any) {
    logger.error({ error }, 'Error fetching suggestions');
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

export default router;
