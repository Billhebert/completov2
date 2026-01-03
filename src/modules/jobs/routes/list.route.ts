/**
 * Jobs - List Route
 * GET /api/v1/jobs
 * List jobs with access control and filters
 */

import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../../core/logger';
import { authenticate } from '../../../core/middleware/auth';
import { getPartnerCompanyIds } from '../../partnerships';

const optionalAuth = (req: any, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    return authenticate(req, res, next);
  }
  next();
};

export function setupJobsListRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}`, optionalAuth, async (req: Request, res: Response) => {
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

      const where: any = { isActive: true };

      // Access control
      if (user) {
        const partnerCompanyIds = await getPartnerCompanyIds(user.companyId);
        where.OR = [
          { types: { has: 'public' } },
          { types: { has: 'internal' }, companyId: user.companyId },
          { types: { has: 'partners' }, companyId: { in: partnerCompanyIds } },
        ];
      } else {
        where.types = { has: 'public' };
      }

      if (status) where.status = status;
      if (type) {
        if (where.OR) {
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
            company: { select: { id: true, name: true, domain: true } },
            _count: { select: { applications: true, interests: true } },
          },
        }),
        prisma.job.count({ where }),
      ]);

      logger.info({ userId: user?.id, authenticated: !!user, count: jobs.length }, 'Jobs listed');

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
}
