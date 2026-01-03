import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupKnowledgeListRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  app.get(`${baseUrl}/nodes`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const { search, nodeType, tag, minImportance, scope = 'accessible' } = req.query;

      const userRole = (req.user as any)?.role;
      const isDev = userRole === 'dev';
      const isAdminGeral = userRole === 'admin_geral';

      let where: any = {
        deletedAt: null,
      };

      // DEV and ADMIN_GERAL can see ALL zettels from ALL companies
      if (isDev || isAdminGeral) {
        // No company restriction for DEV/ADMIN_GERAL
      } else {
        // Normal users: see company zettels + their own personal zettels
        where.companyId = req.companyId!;

        if (scope === 'accessible') {
          // Can see: company-wide zettels OR personal zettels they own
          where.OR = [
            { isCompanyWide: true },
            { ownerId: req.user!.id },
          ];
        } else if (scope === 'company') {
          where.isCompanyWide = true;
        } else if (scope === 'personal') {
          where.ownerId = req.user!.id;
        }
      }

      if (search) {
        const searchCondition = [
          { title: { contains: search as string, mode: 'insensitive' } },
          { content: { contains: search as string, mode: 'insensitive' } },
        ];

        if (where.OR) {
          // Combine existing OR with search OR
          where.AND = [
            { OR: where.OR },
            { OR: searchCondition },
          ];
          delete where.OR;
        } else {
          where.OR = searchCondition;
        }
      }

      if (nodeType) where.nodeType = nodeType;
      if (tag) where.tags = { has: tag as string };
      if (minImportance) where.importanceScore = { gte: parseFloat(minImportance as string) };

      const nodes = await prisma.knowledgeNode.findMany({
        where,
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          _count: {
            select: {
              outgoingLinks: true,
              incomingLinks: true,
            },
          },
        },
        orderBy: [
          { importanceScore: 'desc' },
          { accessCount: 'desc' },
          { createdAt: 'desc' },
        ],
        take: parseInt(req.query.limit as string) || 50,
      });

      res.json({ success: true, data: nodes });
    } catch (error) {
      next(error);
    }
  });
}
