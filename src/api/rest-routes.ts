// src/api/rest-routes.ts
// Additional REST routes to complement the modular system
import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../core/middleware';

// Import route modules
import jobsRouter from '../modules/jobs';
import servicesRouter from '../modules/services';
import settingsRouter from '../modules/settings';
import partnershipsRouter from '../modules/partnerships';

export function setupAdditionalRoutes(app: Express, prisma: PrismaClient) {
  const baseUrl = '/api/v1';

  // ============================================
  // JOBS & SERVICES MODULE
  // ============================================

  app.use(`${baseUrl}/jobs`, jobsRouter);
  app.use(`${baseUrl}/services`, servicesRouter);
  app.use(`${baseUrl}/settings`, settingsRouter);
  app.use(`${baseUrl}/partnerships`, partnershipsRouter);

  // ============================================
  // DASHBOARD STATS
  // ============================================

  app.get(`${baseUrl}/dashboard/stats`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyId!;

      // Helper function to safely count with fallback
      const safeCount = async (fn: () => Promise<number>): Promise<number> => {
        try {
          return await fn();
        } catch (error) {
          console.warn('Dashboard stats count failed:', error);
          return 0;
        }
      };

      const [
        totalContacts,
        activeConversations,
        openDeals,
        dealsValue,
        zettelsCreated,
        gapsIdentified,
      ] = await Promise.all([
        safeCount(() => prisma.contact.count({ where: { companyId } })),
        safeCount(() => prisma.conversation.count({ where: { companyId, status: { not: 'closed' } } })),
        safeCount(() => prisma.deal.count({ where: { companyId, stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] } } })),
        (async () => {
          try {
            const result = await prisma.deal.aggregate({
              where: { companyId, stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] } },
              _sum: { value: true },
            });
            return result;
          } catch (error) {
            console.warn('Dashboard stats aggregate failed:', error);
            return { _sum: { value: 0 } };
          }
        })(),
        safeCount(() => prisma.knowledgeNode.count({ where: { companyId } })),
        safeCount(() => (prisma as any).employeeGap?.count({ where: { companyId, status: { not: 'CLOSED' } } }) || Promise.resolve(0)),
      ]);

      res.json({
        success: true,
        data: {
          totalContacts,
          activeConversations,
          openDeals,
          dealsValue: dealsValue._sum.value || 0,
          zettelsCreated,
          gapsIdentified,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  // ============================================
  // ZETTELS (Knowledge Base)
  // ============================================

  app.get(`${baseUrl}/zettels`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type, search, tags, page = '1', pageSize = '20' } = req.query;
      const companyId = req.companyId!;

      const where: any = { companyId };

      if (type) where.type = type;
      if (search) {
        where.OR = [
          { title: { contains: search as string, mode: 'insensitive' } },
          { content: { contains: search as string, mode: 'insensitive' } },
        ];
      }
      if (tags) {
        const tagArray = Array.isArray(tags) ? tags : [tags];
        where.tags = { hasSome: tagArray };
      }

      const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);
      const take = parseInt(pageSize as string);

      const [data, total] = await Promise.all([
        prisma.knowledgeNode.findMany({
          where,
          skip,
          take,
          include: {
            outgoingLinks: {
              include: { target: { select: { id: true, title: true, nodeType: true } } },
            },
            incomingLinks: {
              include: { source: { select: { id: true, title: true, nodeType: true } } },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.knowledgeNode.count({ where }),
      ]);

      res.json({
        success: true,
        data,
        total,
        page: parseInt(page as string),
        pageSize: take,
        totalPages: Math.ceil(total / take),
      });
    } catch (error) {
      next(error);
    }
  });

  app.get(`${baseUrl}/zettels/:id`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const companyId = req.companyId!;

      const zettel = await prisma.knowledgeNode.findFirst({
        where: { id, companyId },
        include: {
          outgoingLinks: {
            include: { target: true },
          },
          incomingLinks: {
            include: { source: true },
          },
          createdBy: { select: { id: true, name: true, email: true } },
        },
      });

      if (!zettel) {
        return res.status(404).json({ success: false, error: 'Zettel not found' });
      }

      res.json({ success: true, data: zettel });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${baseUrl}/zettels`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type, title, content, tags, metadata } = req.body;
      const companyId = req.companyId!;
      const userId = req.user!.id;

      const zettel = await prisma.knowledgeNode.create({
        data: {
          nodeType: type,
          title,
          content,
          tags: tags || [],
          metadata: metadata || {},
          companyId,
          createdById: userId,
        },
      });

      res.status(201).json({ success: true, data: zettel });
    } catch (error) {
      next(error);
    }
  });

  app.patch(`${baseUrl}/zettels/:id`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { type, title, content, tags, metadata } = req.body;
      const companyId = req.companyId!;

      const zettel = await prisma.knowledgeNode.updateMany({
        where: { id, companyId },
        data: {
          ...(type && { type }),
          ...(title && { title }),
          ...(content && { content }),
          ...(tags && { tags }),
          ...(metadata && { metadata }),
        },
      });

      if (zettel.count === 0) {
        return res.status(404).json({ success: false, error: 'Zettel not found' });
      }

      const updated = await prisma.knowledgeNode.findUnique({ where: { id } });
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  });

  app.delete(`${baseUrl}/zettels/:id`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const companyId = req.companyId!;

      const result = await prisma.knowledgeNode.deleteMany({
        where: { id, companyId },
      });

      if (result.count === 0) {
        return res.status(404).json({ success: false, error: 'Zettel not found' });
      }

      res.json({ success: true, message: 'Zettel deleted successfully' });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${baseUrl}/zettels/:fromId/links`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fromId } = req.params;
      const { targetId, relationshipType } = req.body;
      const companyId = req.companyId!;

      // Verify both zettels exist and belong to the company
      const [source, target] = await Promise.all([
        prisma.knowledgeNode.findFirst({ where: { id: fromId, companyId } }),
        prisma.knowledgeNode.findFirst({ where: { id: targetId, companyId } }),
      ]);

      if (!source || !target) {
        return res.status(404).json({ success: false, error: 'Zettel not found' });
      }

      const link = await prisma.knowledgeLink.create({
        data: {
          companyId: req.companyId!,
          sourceId: fromId,
          targetId,
          linkType: relationshipType,
        },
      });

      res.status(201).json({ success: true, data: link });
    } catch (error) {
      next(error);
    }
  });

  // ============================================
  // WORKFLOWS
  // ============================================

  app.get(`${baseUrl}/workflows`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyId!;

      const workflows = await prisma.workflow.findMany({
        where: { companyId },
        include: {
          _count: { select: { executions: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ success: true, data: workflows });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${baseUrl}/workflows`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, description, definition } = req.body;
      const companyId = req.companyId!;
      const userId = req.user!.id;

      const workflow = await prisma.workflow.create({
        data: {
          name,
          description,
          definition: definition || {},
          status: 'DRAFT',
          companyId,
          createdBy: userId,
        },
      });

      res.status(201).json({ success: true, data: workflow });
    } catch (error) {
      next(error);
    }
  });

  app.patch(`${baseUrl}/workflows/:id`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { name, description, definition, status } = req.body;
      const companyId = req.companyId!;

      const workflow = await prisma.workflow.updateMany({
        where: { id, companyId },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(definition !== undefined && { definition }),
          ...(status !== undefined && { status }),
        },
      });

      if (workflow.count === 0) {
        return res.status(404).json({ success: false, error: 'Workflow not found' });
      }

      const updated = await prisma.workflow.findUnique({
        where: { id },
      });

      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  });

  app.delete(`${baseUrl}/workflows/:id`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const companyId = req.companyId!;

      const result = await prisma.workflow.deleteMany({
        where: { id, companyId },
      });

      if (result.count === 0) {
        return res.status(404).json({ success: false, error: 'Workflow not found' });
      }

      res.json({ success: true, message: 'Workflow deleted successfully' });
    } catch (error) {
      next(error);
    }
  });

  // ============================================
  // GAPS & LEARNING PATHS
  // ============================================

  app.get(`${baseUrl}/gaps`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, page = '1', pageSize = '20' } = req.query;
      const userId = req.user!.id;

      const where: any = { userId };
      if (status) where.status = status;

      const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);
      const take = parseInt(pageSize as string);

      const [data, total] = await Promise.all([
        prisma.employeeGap.findMany({
          where,
          skip,
          take,
          orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
        }),
        prisma.employeeGap.count({ where }),
      ]);

      res.json({
        success: true,
        data,
        total,
        page: parseInt(page as string),
        pageSize: take,
        totalPages: Math.ceil(total / take),
      });
    } catch (error) {
      next(error);
    }
  });

  app.patch(`${baseUrl}/gaps/:id`, authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user!.id;

      const gap = await prisma.employeeGap.updateMany({
        where: { id, employeeId: userId },
        data: { status },
      });

      if (gap.count === 0) {
        return res.status(404).json({ success: false, error: 'Gap not found' });
      }

      const updated = await prisma.employeeGap.findUnique({ where: { id } });
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  });

  app.get(`${baseUrl}/learning-paths`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { category, page = '1', pageSize = '20' } = req.query;
      const companyId = req.companyId!;

      const where: any = { companyId };
      if (category) where.category = category;

      const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);
      const take = parseInt(pageSize as string);

      const [data, total] = await Promise.all([
        prisma.learningPath.findMany({
          where,
          skip,
          take,
          include: {
            items: { orderBy: { order: 'asc' } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.learningPath.count({ where }),
      ]);

      res.json({
        success: true,
        data,
        total,
        page: parseInt(page as string),
        pageSize: take,
        totalPages: Math.ceil(total / take),
      });
    } catch (error) {
      next(error);
    }
  });
}
