// src/modules/jobs/index.ts
import { Express, Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../core/logger';
import { authenticate } from '../../core/middleware/auth';
import { getPartnerCompanyIds } from '../partnerships';

const router = Router();
const prisma = new PrismaClient();

// Alias for consistency
const authenticateToken = authenticate;

// Optional authentication middleware
const optionalAuth = (req: any, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    return authenticate(req, res, next);
  }
  next();
};

// ============================================
// VAGAS (JOBS)
// ============================================

// GET /api/v1/jobs - Listar vagas (com controle de acesso baseado em tipos)
router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      status,
      type,
      isSpecialized,
      search,
    } = req.query;

    const user = (req as any).user;
    const skip = (Number(page) - 1) * Number(pageSize);
    const take = Number(pageSize);

    // Build base filter
    const where: any = {
      isActive: true,
    };

    // Access control based on user authentication and job types
    if (user) {
      // Authenticated user - can see:
      // 1. Public jobs (types contains "public")
      // 2. Internal jobs from their company (types contains "internal" AND companyId matches)
      // 3. Partner jobs from partner companies (types contains "partners" AND company is partner)

      const partnerCompanyIds = await getPartnerCompanyIds(user.companyId);
      const accessibleCompanyIds = [user.companyId, ...partnerCompanyIds];

      where.OR = [
        // Public jobs from any company
        { types: { has: 'public' } },
        // Internal jobs from user's company
        { types: { has: 'internal' }, companyId: user.companyId },
        // Partner jobs from partner companies
        { types: { has: 'partners' }, companyId: { in: partnerCompanyIds } },
      ];
    } else {
      // Unauthenticated - can only see public jobs
      where.types = { has: 'public' };
    }

    if (status) where.status = status;
    if (type) {
      // User is filtering by specific type
      if (where.OR) {
        // If we have OR conditions, we need to add type filter to each
        where.OR = where.OR.map((cond: any) => ({ ...cond, types: { has: type } }));
      } else {
        where.types = { has: type };
      }
    }
    if (isSpecialized !== undefined) where.isSpecialized = isSpecialized === 'true';
    if (search) {
      const searchCondition = {
        OR: [
          { title: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } },
        ],
      };
      // Combine with existing conditions
      if (where.OR || where.AND) {
        where.AND = [...(where.AND || []), searchCondition];
      } else {
        Object.assign(where, searchCondition);
      }
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
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
              applications: true,
              interests: true,
            },
          },
        },
      }),
      prisma.job.count({ where }),
    ]);

    logger.info(
      { userId: user?.id, authenticated: !!user, count: jobs.length },
      'Jobs listed with access control'
    );

    res.json({
      data: jobs,
      total,
      page: Number(page),
      pageSize: take,
      totalPages: Math.ceil(total / take),
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error listing jobs');
    res.status(500).json({ error: 'Failed to list jobs' });
  }
});

// GET /api/v1/jobs/:id - Get specific job
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const job = await prisma.job.findFirst({
      where: {
        id,
        companyId: user.companyId,
      },
      include: {
        _count: {
          select: {
            applications: true,
            interests: true,
          },
        },
      },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    logger.info({ userId: user.id, jobId: id }, 'Job retrieved');
    res.json(job);
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error getting job');
    res.status(500).json({ error: 'Failed to get job' });
  }
});

// POST /api/v1/jobs - Create job
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    // Only admin_empresa can create jobs
    if (!['DEV', 'admin', 'admin_empresa'].includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const data = req.body;

    const job = await prisma.job.create({
      data: {
        ...data,
        companyId: user.companyId,
        createdBy: user.id,
        publishedAt: data.status === 'open' ? new Date() : null,
      },
      include: {
        _count: {
          select: {
            applications: true,
            interests: true,
          },
        },
      },
    });

    logger.info({ userId: user.id, jobId: job.id }, 'Job created');
    res.status(201).json(job);
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error creating job');
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// PUT /api/v1/jobs/:id - Update job
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    // Only admin_empresa can update jobs
    if (!['DEV', 'admin', 'admin_empresa'].includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const existing = await prisma.job.findFirst({
      where: { id, companyId: user.companyId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const data = req.body;
    const job = await prisma.job.update({
      where: { id },
      data: {
        ...data,
        publishedAt: data.status === 'open' && !existing.publishedAt ? new Date() : existing.publishedAt,
        closedAt: data.status === 'closed' ? new Date() : existing.closedAt,
      },
      include: {
        _count: {
          select: {
            applications: true,
            interests: true,
          },
        },
      },
    });

    logger.info({ userId: user.id, jobId: id }, 'Job updated');
    res.json(job);
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error updating job');
    res.status(500).json({ error: 'Failed to update job' });
  }
});

// DELETE /api/v1/jobs/:id - Delete job
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    // Only admin_empresa can delete jobs
    if (!['DEV', 'admin', 'admin_empresa'].includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const existing = await prisma.job.findFirst({
      where: { id, companyId: user.companyId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Job not found' });
    }

    await prisma.job.delete({ where: { id } });

    logger.info({ userId: user.id, jobId: id }, 'Job deleted');
    res.status(204).send();
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error deleting job');
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

// ============================================
// JOB APPLICATIONS
// ============================================

// POST /api/v1/jobs/:id/apply - Apply to job
router.post('/:id/apply', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id: jobId } = req.params;
    const user = (req as any).user;
    const { coverLetter, resume, documents } = req.body;

    // Check if job exists and is open
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        companyId: user.companyId,
        status: 'open',
        isActive: true,
      },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found or not open for applications' });
    }

    // Check if already applied
    const existing = await prisma.jobApplication.findUnique({
      where: {
        jobId_userId: {
          jobId,
          userId: user.id,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Already applied to this job' });
    }

    const application = await prisma.jobApplication.create({
      data: {
        jobId,
        userId: user.id,
        coverLetter,
        resume,
        documents,
        status: 'pending',
      },
    });

    logger.info({ userId: user.id, jobId, applicationId: application.id }, 'Job application created');
    res.status(201).json(application);
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error creating job application');
    res.status(500).json({ error: 'Failed to apply to job' });
  }
});

// POST /api/v1/jobs/:id/interest - Mark interest in job
router.post('/:id/interest', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id: jobId } = req.params;
    const user = (req as any).user;
    const { reason, notifyOnChanges = true } = req.body;

    const job = await prisma.job.findFirst({
      where: { id: jobId, companyId: user.companyId, isActive: true },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const interest = await prisma.jobInterest.upsert({
      where: {
        jobId_userId: {
          jobId,
          userId: user.id,
        },
      },
      create: {
        jobId,
        userId: user.id,
        reason,
        notifyOnChanges,
      },
      update: {
        reason,
        notifyOnChanges,
      },
    });

    logger.info({ userId: user.id, jobId, interestId: interest.id }, 'Job interest marked');
    res.status(201).json(interest);
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error marking job interest');
    res.status(500).json({ error: 'Failed to mark interest' });
  }
});

// GET /api/v1/jobs/:id/suggestions - Get Zettel suggestions for job
router.get('/:id/suggestions', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id: jobId } = req.params;
    const user = (req as any).user;

    const job = await prisma.job.findFirst({
      where: { id: jobId, companyId: user.companyId },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Get or create suggestions
    let suggestions = await prisma.jobZettelSuggestion.findUnique({
      where: {
        jobId_userId: {
          jobId,
          userId: user.id,
        },
      },
    });

    if (!suggestions) {
      // Generate suggestions based on required skills
      const requiredSkills = job.requiredSkills as any[] || [];
      const desiredSkills = job.desiredSkills as any[] || [];

      // TODO: Implement AI-based suggestion generation
      // For now, create a placeholder
      suggestions = await prisma.jobZettelSuggestion.create({
        data: {
          jobId,
          userId: user.id,
          suggestedZettels: [],
          skillGaps: [...requiredSkills, ...desiredSkills],
          estimatedTime: 0,
          priority: 'medium',
          status: 'active',
          completionRate: 0,
        },
      });
    }

    logger.info({ userId: user.id, jobId }, 'Job suggestions retrieved');
    res.json(suggestions);
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error getting job suggestions');
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

// GET /api/v1/jobs/:id/applications - List applications for a job (admin only)
router.get('/:id/applications', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id: jobId } = req.params;
    const user = (req as any).user;

    if (!['DEV', 'admin', 'admin_empresa'].includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const job = await prisma.job.findFirst({
      where: { id: jobId, companyId: user.companyId },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const applications = await prisma.jobApplication.findMany({
      where: { jobId },
      include: {
        user: {
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

    logger.info({ userId: user.id, jobId, count: applications.length }, 'Job applications listed');
    res.json(applications);
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error listing job applications');
    res.status(500).json({ error: 'Failed to list applications' });
  }
});

// PATCH /api/v1/jobs/applications/:id - Update application status (admin only)
router.patch('/applications/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const { status, internalNotes, feedback, rating } = req.body;

    if (!['DEV', 'admin', 'admin_empresa'].includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const application = await prisma.jobApplication.update({
      where: { id },
      data: {
        status,
        internalNotes,
        feedback,
        rating,
        reviewedAt: new Date(),
      },
    });

    logger.info({ userId: user.id, applicationId: id }, 'Job application updated');
    res.json(application);
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error updating job application');
    res.status(500).json({ error: 'Failed to update application' });
  }
});

export default router;

// Module export
import { ModuleDefinition } from '../../core/types';
import { EventBus } from '../../core/event-bus';

function setupRoutes(app: Express, prisma: PrismaClient, eventBus: EventBus) {
  app.use('/api/v1/jobs', router);
}

export const jobsModule: ModuleDefinition = {
  name: 'jobs',
  version: '1.0.0',
  provides: ['jobs', 'recruitment', 'applications'],
  routes: (ctx) => setupRoutes(ctx.app, ctx.prisma, ctx.eventBus),
};
