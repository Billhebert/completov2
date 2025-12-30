// src/api/rest-routes.ts
// Additional REST routes to complement the modular system
import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../core/middleware';

export function setupAdditionalRoutes(app: Express, prisma: PrismaClient) {
  const baseUrl = '/api/v1';

  // ============================================
  // DASHBOARD STATS
  // ============================================

  app.get(`${baseUrl}/dashboard/stats`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyId!;

      const [
        totalContacts,
        activeConversations,
        openDeals,
        dealsValue,
        zettelsCreated,
        gapsIdentified,
      ] = await Promise.all([
        prisma.contact.count({ where: { companyId } }),
        prisma.conversation.count({ where: { companyId, status: { not: 'closed' } } }),
        prisma.deal.count({ where: { companyId, stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] } } }),
        prisma.deal.aggregate({
          where: { companyId, stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] } },
          _sum: { value: true },
        }),
        prisma.zettel.count({ where: { companyId } }),
        prisma.gap.count({ where: { user: { companyId }, status: { not: 'CLOSED' } } }),
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
        prisma.zettel.findMany({
          where,
          skip,
          take,
          include: {
            linksFrom: {
              include: { toZettel: { select: { id: true, title: true, type: true } } },
            },
            linksTo: {
              include: { fromZettel: { select: { id: true, title: true, type: true } } },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.zettel.count({ where }),
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

      const zettel = await prisma.zettel.findFirst({
        where: { id, companyId },
        include: {
          linksFrom: {
            include: { toZettel: true },
          },
          linksTo: {
            include: { fromZettel: true },
          },
          user: { select: { id: true, name: true, email: true } },
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
      const userId = req.userId;

      const zettel = await prisma.zettel.create({
        data: {
          type,
          title,
          content,
          tags: tags || [],
          metadata: metadata || {},
          companyId,
          userId,
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

      const zettel = await prisma.zettel.updateMany({
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

      const updated = await prisma.zettel.findUnique({ where: { id } });
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  });

  app.delete(`${baseUrl}/zettels/:id`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const companyId = req.companyId!;

      const result = await prisma.zettel.deleteMany({
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
      const { toZettelId, relationshipType } = req.body;
      const companyId = req.companyId!;

      // Verify both zettels exist and belong to the company
      const [fromZettel, toZettel] = await Promise.all([
        prisma.zettel.findFirst({ where: { id: fromId, companyId } }),
        prisma.zettel.findFirst({ where: { id: toZettelId, companyId } }),
      ]);

      if (!fromZettel || !toZettel) {
        return res.status(404).json({ success: false, error: 'Zettel not found' });
      }

      const link = await prisma.zettelLink.create({
        data: {
          fromZettelId: fromId,
          toZettelId,
          relationshipType,
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
          actions: {
            orderBy: { order: 'asc' },
          },
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
      const { name, description, triggerType, triggerConfig, actions } = req.body;
      const companyId = req.companyId!;

      const workflow = await prisma.workflow.create({
        data: {
          name,
          description,
          triggerType,
          triggerConfig: triggerConfig || {},
          enabled: false,
          companyId,
          actions: {
            create: actions?.map((action: any, index: number) => ({
              type: action.type,
              config: action.config || {},
              order: index,
            })) || [],
          },
        },
        include: {
          actions: { orderBy: { order: 'asc' } },
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
      const { name, description, triggerType, triggerConfig, enabled } = req.body;
      const companyId = req.companyId!;

      const workflow = await prisma.workflow.updateMany({
        where: { id, companyId },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(triggerType !== undefined && { triggerType }),
          ...(triggerConfig !== undefined && { triggerConfig }),
          ...(enabled !== undefined && { enabled }),
        },
      });

      if (workflow.count === 0) {
        return res.status(404).json({ success: false, error: 'Workflow not found' });
      }

      const updated = await prisma.workflow.findUnique({
        where: { id },
        include: { actions: { orderBy: { order: 'asc' } } },
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
      const userId = req.userId;

      const where: any = { userId };
      if (status) where.status = status;

      const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);
      const take = parseInt(pageSize as string);

      const [data, total] = await Promise.all([
        prisma.gap.findMany({
          where,
          skip,
          take,
          orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        }),
        prisma.gap.count({ where }),
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
      const userId = req.userId;

      const gap = await prisma.gap.updateMany({
        where: { id, userId },
        data: { status },
      });

      if (gap.count === 0) {
        return res.status(404).json({ success: false, error: 'Gap not found' });
      }

      const updated = await prisma.gap.findUnique({ where: { id } });
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
            resources: { orderBy: { order: 'asc' } },
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
