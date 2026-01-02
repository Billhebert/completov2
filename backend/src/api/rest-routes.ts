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
  // DASHBOARD
  // ============================================

  app.get(`${baseUrl}/dashboard`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyId!;

      // Helper function to safely count with fallback
      const safeCount = async (fn: () => Promise<number>): Promise<number> => {
        try {
          return await fn();
        } catch (error) {
          console.warn('Dashboard count failed:', error);
          return 0;
        }
      };

      const safeAggregate = async (fn: () => Promise<any>): Promise<any> => {
        try {
          return await fn();
        } catch (error) {
          console.warn('Dashboard aggregate failed:', error);
          return { _sum: { value: 0 } };
        }
      };

      // Get stats
      const [totalContacts, activeDeals, dealsValueResult, openTickets, pendingTickets] = await Promise.all([
        safeCount(() => prisma.contact.count({ where: { companyId } })),
        safeCount(() => prisma.deal.count({ where: { companyId, stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] } } })),
        safeAggregate(() => prisma.deal.aggregate({
          where: { companyId, stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] } },
          _sum: { value: true },
        })),
        safeCount(() => (prisma as any).ticket?.count({ where: { companyId, status: 'OPEN' } }) || Promise.resolve(0)),
        safeCount(() => (prisma as any).ticket?.count({ where: { companyId, status: 'PENDING' } }) || Promise.resolve(0)),
      ]);

      const dealsValue = dealsValueResult._sum.value || 0;

      // Get recent activities (combining contacts, deals, tickets)
      const recentActivities: any[] = [];

      try {
        const recentContacts = await prisma.contact.findMany({
          where: { companyId },
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, name: true, createdAt: true, createdBy: { select: { name: true } } },
        });
        recentContacts.forEach(contact => {
          recentActivities.push({
            id: contact.id,
            type: 'contact',
            title: 'Novo contato criado',
            description: contact.name,
            user: { name: contact.createdBy?.name || 'Sistema' },
            createdAt: contact.createdAt,
          });
        });
      } catch (error) {
        console.warn('Failed to fetch recent contacts:', error);
      }

      try {
        const recentDeals = await prisma.deal.findMany({
          where: { companyId },
          take: 5,
          orderBy: { updatedAt: 'desc' },
          select: { id: true, title: true, updatedAt: true, contact: { select: { name: true } } },
        });
        recentDeals.forEach(deal => {
          recentActivities.push({
            id: deal.id,
            type: 'deal',
            title: 'Deal atualizado',
            description: deal.title,
            user: { name: deal.contact?.name || 'Sistema' },
            createdAt: deal.updatedAt,
          });
        });
      } catch (error) {
        console.warn('Failed to fetch recent deals:', error);
      }

      // Sort activities by date and take top 10
      recentActivities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const sortedActivities = recentActivities.slice(0, 10);

      // Get pending tasks
      const pendingTasks: any[] = [];
      try {
        if ((prisma as any).task) {
          const tasks = await (prisma as any).task.findMany({
            where: { companyId, completed: false },
            take: 10,
            orderBy: { dueDate: 'asc' },
            select: { id: true, title: true, description: true, priority: true, dueDate: true, completed: true, assignedTo: true },
          });
          pendingTasks.push(...tasks);
        }
      } catch (error) {
        console.warn('Failed to fetch pending tasks:', error);
      }

      // Get chart data for deals (last 6 months)
      const dealsChart: any[] = [];
      try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyDeals = await prisma.$queryRaw`
          SELECT
            TO_CHAR(created_at, 'Mon') as name,
            COUNT(*)::int as value
          FROM "Deal"
          WHERE company_id = ${companyId}
            AND created_at >= ${sixMonthsAgo}
          GROUP BY TO_CHAR(created_at, 'Mon'), EXTRACT(MONTH FROM created_at)
          ORDER BY EXTRACT(MONTH FROM created_at)
          LIMIT 6
        `;
        dealsChart.push(...(monthlyDeals as any[]));
      } catch (error) {
        console.warn('Failed to fetch deals chart data:', error);
      }

      // Get chart data for revenue (last 6 months)
      const revenueChart: any[] = [];
      try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyRevenue = await prisma.$queryRaw`
          SELECT
            TO_CHAR(created_at, 'Mon') as name,
            COALESCE(SUM(value), 0)::int as value
          FROM "Deal"
          WHERE company_id = ${companyId}
            AND created_at >= ${sixMonthsAgo}
            AND stage IN ('CLOSED_WON')
          GROUP BY TO_CHAR(created_at, 'Mon'), EXTRACT(MONTH FROM created_at)
          ORDER BY EXTRACT(MONTH FROM created_at)
          LIMIT 6
        `;
        revenueChart.push(...(monthlyRevenue as any[]));
      } catch (error) {
        console.warn('Failed to fetch revenue chart data:', error);
      }

      // Calculate change percentages (comparing with previous period)
      const contactsChange = 0; // TODO: Calculate actual change
      const dealsChange = 0; // TODO: Calculate actual change
      const ticketsChange = 0; // TODO: Calculate actual change
      const revenueChange = 0; // TODO: Calculate actual change

      res.json({
        success: true,
        data: {
          stats: {
            contacts: {
              total: totalContacts,
              change: contactsChange,
            },
            deals: {
              active: activeDeals,
              value: dealsValue,
              change: dealsChange,
            },
            tickets: {
              open: openTickets,
              pending: pendingTickets,
              change: ticketsChange,
            },
            revenue: {
              monthly: dealsValue, // Using total deals value as monthly revenue
              change: revenueChange,
            },
          },
          recentActivities: sortedActivities,
          pendingTasks,
          dealsChart,
          revenueChart,
        },
      });
    } catch (error) {
      next(error);
    }
  });

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

      // Check if workflow model exists in Prisma
      if (!(prisma as any).workflow) {
        console.warn('[Workflows] Model not available in Prisma schema');
        return res.json({ success: true, data: [] });
      }

      const workflows = await (prisma as any).workflow.findMany({
        where: { companyId },
        include: {
          _count: { select: { executions: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ success: true, data: workflows });
    } catch (error) {
      console.error('[Workflows] Error fetching workflows:', error);
      res.json({ success: true, data: [] });
    }
  });

  app.post(`${baseUrl}/workflows`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, description, definition } = req.body;
      const companyId = req.companyId!;
      const userId = req.user!.id;

      // Check if workflow model exists in Prisma
      if (!(prisma as any).workflow) {
        console.warn('[Workflows] Model not available in Prisma schema');
        return res.status(501).json({ error: 'Workflows module not implemented' });
      }

      const workflow = await (prisma as any).workflow.create({
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
