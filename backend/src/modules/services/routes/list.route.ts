import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../core/middleware';
import { logger } from '../../../core/logger';
import { getPartnerCompanyIds } from '../../partnerships';

export function setupServicesListRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}`, authenticate, async (req: Request, res: Response, next: NextFunction) => {
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
    } catch (error) {
      next(error);
    }
  });
}
