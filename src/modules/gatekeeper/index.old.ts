import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { gatekeeperService } from './gatekeeper.service';
import { logger } from '@core/logger';

const router = Router();
const prisma = new PrismaClient();

// ============================================
// SCHEMAS DE VALIDAÇÃO
// ============================================

const AttentionProfileSchema = z.object({
  level: z.enum(['SILENT', 'BALANCED', 'ACTIVE']).optional(),
  quietHours: z.array(z.object({
    start: z.string(),
    end: z.string(),
    days: z.array(z.number()).optional(),
    timezone: z.string().optional()
  })).optional(),
  channels: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    inapp: z.boolean().optional(),
    whatsapp: z.boolean().optional(),
    sms: z.boolean().optional()
  }).optional(),
  vipList: z.object({
    contacts: z.array(z.string()).optional(),
    projects: z.array(z.string()).optional(),
    deals: z.array(z.string()).optional()
  }).optional(),
  autonomy: z.record(z.enum(['EXECUTE', 'SUGGEST', 'LOG_ONLY'])).optional()
});

const CompanyPolicySchema = z.object({
  maxAutonomy: z.record(z.record(z.enum(['EXECUTE', 'SUGGEST', 'BLOCK']))).optional(),
  forbidden: z.array(z.string()).optional(),
  auditRules: z.object({
    retention_days: z.number().optional(),
    immutable: z.boolean().optional(),
    export_allowed: z.boolean().optional()
  }).optional(),
  rateLimits: z.object({
    ai_calls_per_user_per_day: z.number().optional(),
    ai_calls_per_company_per_day: z.number().optional(),
    automations_per_hour: z.number().optional()
  }).optional()
});

// ============================================
// ROUTES
// ============================================

/**
 * GET /api/v1/gatekeeper/profile
 * Buscar perfil de atenção do usuário
 */
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    let profile = await prisma.attentionProfile.findUnique({
      where: { userId }
    });

    // Se não existe, cria um padrão
    if (!profile) {
      profile = await prisma.attentionProfile.create({
        data: {
          userId,
          level: 'BALANCED',
          quietHours: [],
          channels: { email: true, push: true, inapp: true, whatsapp: false, sms: false },
          vipList: { contacts: [], projects: [], deals: [] },
          autonomy: {
            create_zettel: 'EXECUTE',
            create_reminder: 'EXECUTE',
            send_notification: 'EXECUTE',
            send_external_message: 'SUGGEST'
          }
        }
      });
    }

    res.json(profile);
  } catch (error: any) {
    logger.error({ error }, 'Error fetching attention profile');
    res.status(500).json({ error: 'Failed to fetch attention profile' });
  }
});

/**
 * PATCH /api/v1/gatekeeper/profile
 * Atualizar perfil de atenção do usuário
 */
router.patch('/profile', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const data = AttentionProfileSchema.parse(req.body);

    const profile = await prisma.attentionProfile.upsert({
      where: { userId },
      update: {
        level: data.level,
        quietHours: data.quietHours as any,
        channels: data.channels as any,
        vipList: data.vipList as any,
        autonomy: data.autonomy as any
      },
      create: {
        userId,
        level: data.level || 'BALANCED',
        quietHours: (data.quietHours || []) as any,
        channels: (data.channels || { email: true, push: true, inapp: true }) as any,
        vipList: (data.vipList || { contacts: [], projects: [], deals: [] }) as any,
        autonomy: (data.autonomy || {}) as any
      }
    });

    logger.info({ userId }, 'Attention profile updated');
    res.json(profile);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    logger.error({ error }, 'Error updating attention profile');
    res.status(500).json({ error: 'Failed to update attention profile' });
  }
});

/**
 * GET /api/v1/gatekeeper/logs
 * Buscar logs de decisões do Gatekeeper (para o próprio usuário)
 */
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { limit = '50', offset = '0', action, decision } = req.query;

    const where: any = { userId };
    if (action) where.action = action as string;
    if (decision) where.decision = decision as string;

    const logs = await prisma.gatekeeperLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    const total = await prisma.gatekeeperLog.count({ where });

    res.json({
      data: logs,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });
  } catch (error: any) {
    logger.error({ error }, 'Error fetching gatekeeper logs');
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

/**
 * GET /api/v1/gatekeeper/policy
 * Buscar política da empresa (apenas admin)
 */
router.get('/policy', async (req: Request, res: Response) => {
  try {
    const { role, companyId } = req.user!;

    // Apenas admin pode ver política
    if (role !== 'company_admin' && role !== 'super_admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const policy = await prisma.companyPolicy.findUnique({
      where: { companyId }
    });

    res.json(policy || {});
  } catch (error: any) {
    logger.error({ error }, 'Error fetching company policy');
    res.status(500).json({ error: 'Failed to fetch policy' });
  }
});

/**
 * PATCH /api/v1/gatekeeper/policy
 * Atualizar política da empresa (apenas admin)
 */
router.patch('/policy', async (req: Request, res: Response) => {
  try {
    const { role, companyId } = req.user!;

    // Apenas admin pode atualizar política
    if (role !== 'company_admin' && role !== 'super_admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const data = CompanyPolicySchema.parse(req.body);

    const policy = await prisma.companyPolicy.upsert({
      where: { companyId },
      update: {
        maxAutonomy: data.maxAutonomy as any,
        forbidden: data.forbidden as any,
        auditRules: data.auditRules as any,
        rateLimits: data.rateLimits as any
      },
      create: {
        companyId,
        maxAutonomy: (data.maxAutonomy || {}) as any,
        forbidden: (data.forbidden || []) as any,
        auditRules: (data.auditRules || {}) as any,
        rateLimits: (data.rateLimits || {}) as any
      }
    });

    logger.info({ companyId }, 'Company policy updated');
    res.json(policy);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    logger.error({ error }, 'Error updating company policy');
    res.status(500).json({ error: 'Failed to update policy' });
  }
});

/**
 * GET /api/v1/gatekeeper/pending-actions
 * Listar ações pendentes de aprovação (SUGGEST)
 */
router.get('/pending-actions', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Buscar logs com decisão SUGGEST dos últimos 7 dias
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const pendingActions = await prisma.gatekeeperLog.findMany({
      where: {
        userId,
        decision: 'SUGGEST',
        timestamp: { gte: sevenDaysAgo }
      },
      orderBy: { timestamp: 'desc' },
      take: 50
    });

    res.json({ data: pendingActions });
  } catch (error: any) {
    logger.error({ error }, 'Error fetching pending actions');
    res.status(500).json({ error: 'Failed to fetch pending actions' });
  }
});

/**
 * POST /api/v1/gatekeeper/test
 * Testar decisão do Gatekeeper (útil para debug)
 */
router.post('/test', async (req: Request, res: Response) => {
  try {
    const { id: userId, companyId } = req.user!;
    const { action, context } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }

    const result = await gatekeeperService.shouldExecute({
      userId,
      companyId,
      action,
      context: context || {}
    });

    res.json(result);
  } catch (error: any) {
    logger.error({ error }, 'Error testing gatekeeper');
    res.status(500).json({ error: 'Failed to test gatekeeper' });
  }
});

export default router;
