import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '@core/logger';
import { peopleGrowthService } from './service';
import { ModuleDefinition } from '@core/types';

const router = Router();
const prisma = new PrismaClient();

// ============================================
// GAPS
// ============================================

/**
 * GET /api/v1/people-growth/gaps
 * Listar gaps (próprios ou do time se for supervisor)
 */
router.get('/gaps', async (req: Request, res: Response) => {
  try {
    const { userId, role, companyId } = req.user!;
    const { employeeId, domain, severity, status } = req.query;

    const where: any = { companyId };

    // Se não é admin/supervisor, só vê os próprios gaps
    if (role !== 'company_admin' && role !== 'supervisor') {
      where.employeeId = userId;
    } else if (employeeId) {
      where.employeeId = employeeId;
    }

    if (domain) where.domain = domain;
    if (severity) where.severity = severity;
    if (status) where.status = status;

    const gaps = await prisma.employeeGap.findMany({
      where,
      include: {
        employee: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    res.json({ data: gaps });

  } catch (error: any) {
    logger.error('Error fetching gaps', { error });
    res.status(500).json({ error: 'Failed to fetch gaps' });
  }
});

/**
 * GET /api/v1/people-growth/gaps/:id
 * Detalhes de um gap
 */
router.get('/gaps/:id', async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.user!;
    const { id } = req.params;

    const gap = await prisma.employeeGap.findUnique({
      where: { id },
      include: {
        employee: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!gap) {
      return res.status(404).json({ error: 'Gap not found' });
    }

    // Verificar permissão
    if (role !== 'company_admin' && role !== 'supervisor' && gap.employeeId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(gap);

  } catch (error: any) {
    logger.error('Error fetching gap', { error });
    res.status(500).json({ error: 'Failed to fetch gap' });
  }
});

/**
 * POST /api/v1/people-growth/gaps/:id/close
 * Fechar gap
 */
router.post('/gaps/:id/close', async (req: Request, res: Response) => {
  try {
    const { userId } = req.user!;
    const { id } = req.params;

    await peopleGrowthService.closeGap(id, userId);

    res.json({ message: 'Gap closed successfully' });

  } catch (error: any) {
    logger.error('Error closing gap', { error });
    res.status(500).json({ error: error.message || 'Failed to close gap' });
  }
});

/**
 * GET /api/v1/people-growth/gaps/:id/learning-paths
 * Sugerir learning paths para um gap
 */
router.get('/gaps/:id/learning-paths', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const paths = await peopleGrowthService.suggestLearningPath(id);

    res.json({ data: paths });

  } catch (error: any) {
    logger.error('Error suggesting learning paths', { error });
    res.status(500).json({ error: 'Failed to suggest learning paths' });
  }
});

// ============================================
// TEAM REPORTS
// ============================================

/**
 * GET /api/v1/people-growth/team/report
 * Relatório de gaps do time (supervisor/admin only)
 */
router.get('/team/report', async (req: Request, res: Response) => {
  try {
    const { role, companyId } = req.user!;

    if (role !== 'company_admin' && role !== 'supervisor') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const report = await peopleGrowthService.getTeamGapsReport(companyId);

    res.json(report);

  } catch (error: any) {
    logger.error('Error generating team report', { error });
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

/**
 * GET /api/v1/people-growth/team/heatmap
 * Heatmap de gaps por domínio e pessoa
 */
router.get('/team/heatmap', async (req: Request, res: Response) => {
  try {
    const { role, companyId } = req.user!;

    if (role !== 'company_admin' && role !== 'supervisor') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const gaps = await prisma.employeeGap.findMany({
      where: {
        companyId,
        status: { in: ['OPEN', 'IN_PROGRESS'] }
      },
      include: {
        employee: {
          select: { id: true, name: true }
        }
      }
    });

    // Agrupar por pessoa e domínio
    const heatmap: any = {};

    gaps.forEach(gap => {
      const empId = gap.employeeId;
      if (!heatmap[empId]) {
        heatmap[empId] = {
          employee: gap.employee,
          domains: {}
        };
      }

      if (!heatmap[empId].domains[gap.domain]) {
        heatmap[empId].domains[gap.domain] = 0;
      }

      heatmap[empId].domains[gap.domain]++;
    });

    res.json({ data: Object.values(heatmap) });

  } catch (error: any) {
    logger.error('Error generating heatmap', { error });
    res.status(500).json({ error: 'Failed to generate heatmap' });
  }
});

// ============================================
// MY PROFILE
// ============================================

/**
 * GET /api/v1/people-growth/my-profile
 * Perfil de desenvolvimento do usuário
 */
router.get('/my-profile', async (req: Request, res: Response) => {
  try {
    const { userId, companyId } = req.user!;

    // Buscar gaps
    const gaps = await prisma.employeeGap.findMany({
      where: { employeeId: userId },
      orderBy: { createdAt: 'desc' }
    });

    // Buscar skills
    const skills = await prisma.employeeSkill.findMany({
      where: { userId },
      include: {
        skill: true
      }
    });

    // Buscar learning paths ativos
    const enrollments = await prisma.learningEnrollment.findMany({
      where: { userId, status: 'enrolled' },
      include: {
        path: {
          include: {
            items: true
          }
        }
      }
    });

    // Buscar planos de desenvolvimento
    const plans = await prisma.skillDevelopmentPlan.findMany({
      where: { userId }
    });

    res.json({
      gaps: {
        total: gaps.length,
        open: gaps.filter(g => g.status === 'OPEN').length,
        closed: gaps.filter(g => g.status === 'CLOSED').length,
        byDomain: gaps.reduce((acc: any, g) => {
          acc[g.domain] = (acc[g.domain] || 0) + 1;
          return acc;
        }, {})
      },
      skills: skills.map(s => ({
        skill: s.skill.name,
        proficiency: s.proficiency,
        lastAssessed: s.lastAssessed
      })),
      activeLearningPaths: enrollments.length,
      developmentPlans: plans.length
    });

  } catch (error: any) {
    logger.error('Error fetching my profile', { error });
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// ============================================
// MODULE DEFINITION
// ============================================

export const peopleGrowthModule: ModuleDefinition = {
  name: 'people-growth',
  version: '1.0.0',
  provides: ['people-growth', 'gaps', 'development'],

  routes: async (ctx) => {
    ctx.app.use('/api/v1/people-growth', router);
    ctx.logger.info('People Growth routes registered');
  },
};

export default router;
