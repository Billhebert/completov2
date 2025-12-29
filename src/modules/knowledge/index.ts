// src/modules/knowledge/index.ts
import { ModuleDefinition } from '../../core/types';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, validateBody, requirePermission, Permission } from '../../core/middleware';
import { z } from 'zod';

const nodeSchema = z.object({
  title: z.string(),
  content: z.string(),
  nodeType: z.enum(['zettel', 'documentation', 'procedure', 'reference', 'insight']),
  tags: z.array(z.string()).optional(),
  importanceScore: z.number().min(0).max(1).optional(),
});

const linkSchema = z.object({
  targetId: z.string(),
  linkType: z.enum(['related', 'derives', 'supports', 'contradicts']),
  strength: z.number().min(0).max(1).optional(),
});

function setupRoutes(app: Express, prisma: PrismaClient) {
  const base = '/api/v1/knowledge';

  // ============================================
  // NODES
  // ============================================

  app.get(`${base}/nodes`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const { search, nodeType, tag, minImportance } = req.query;
      
      const where: any = { 
        companyId: req.companyId!,
        deletedAt: null,
      };
      
      if (search) {
        where.OR = [
          { title: { contains: search as string, mode: 'insensitive' } },
          { content: { contains: search as string, mode: 'insensitive' } },
        ];
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

  app.post(`${base}/nodes`, authenticate, tenantIsolation, requirePermission(Permission.KNOWLEDGE_READ), validateBody(nodeSchema), async (req, res, next) => {
    try {
      const node = await prisma.knowledgeNode.create({
        data: {
          ...req.body,
          companyId: req.companyId!,
          createdById: req.user!.id,
          tags: req.body.tags || [],
          importanceScore: req.body.importanceScore || 0.5,
        },
      });

      res.status(201).json({ success: true, data: node });
    } catch (error) {
      next(error);
    }
  });

  app.get(`${base}/nodes/:id`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const node = await prisma.knowledgeNode.findFirst({
        where: { 
          id: req.params.id, 
          companyId: req.companyId!,
          deletedAt: null,
        },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          outgoingLinks: {
            include: {
              target: {
                select: { id: true, title: true, nodeType: true, tags: true },
              },
            },
          },
          incomingLinks: {
            include: {
              source: {
                select: { id: true, title: true, nodeType: true, tags: true },
              },
            },
          },
          embeddings: true,
        },
      });

      if (!node) {
        return res.status(404).json({ success: false, error: { message: 'Node not found' } });
      }

      // Increment access count
      await prisma.knowledgeNode.update({
        where: { id: req.params.id },
        data: { accessCount: { increment: 1 } },
      });

      res.json({ success: true, data: node });
    } catch (error) {
      next(error);
    }
  });

  app.patch(`${base}/nodes/:id`, authenticate, tenantIsolation, requirePermission(Permission.KNOWLEDGE_READ), async (req, res, next) => {
    try {
      const node = await prisma.knowledgeNode.update({
        where: { id: req.params.id },
        data: req.body,
      });
      res.json({ success: true, data: node });
    } catch (error) {
      next(error);
    }
  });

  app.delete(`${base}/nodes/:id`, authenticate, tenantIsolation, requirePermission(Permission.KNOWLEDGE_READ), async (req, res, next) => {
    try {
      // Soft delete
      await prisma.knowledgeNode.update({
        where: { id: req.params.id },
        data: { deletedAt: new Date() },
      });
      res.json({ success: true, message: 'Node deleted' });
    } catch (error) {
      next(error);
    }
  });

  // ============================================
  // LINKS
  // ============================================

  app.post(`${base}/nodes/:id/links`, authenticate, tenantIsolation, requirePermission(Permission.KNOWLEDGE_READ), validateBody(linkSchema), async (req, res, next) => {
    try {
      const { targetId, linkType, strength } = req.body;

      const link = await prisma.knowledgeLink.create({
        data: {
          companyId: req.companyId!,
          sourceId: req.params.id,
          targetId,
          linkType,
          strength: strength || 1.0,
        },
        include: {
          source: { select: { id: true, title: true } },
          target: { select: { id: true, title: true } },
        },
      });

      res.status(201).json({ success: true, data: link });
    } catch (error) {
      next(error);
    }
  });

  app.delete(`${base}/links/:id`, authenticate, tenantIsolation, requirePermission(Permission.KNOWLEDGE_READ), async (req, res, next) => {
    try {
      await prisma.knowledgeLink.delete({
        where: { id: req.params.id },
      });
      res.json({ success: true, message: 'Link deleted' });
    } catch (error) {
      next(error);
    }
  });

  // ============================================
  // GRAPH VISUALIZATION
  // ============================================

  app.get(`${base}/graph`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const { nodeId, depth = '2' } = req.query;

      let nodes: any[];
      let links: any[];

      if (nodeId) {
        // Get subgraph around a specific node
        const centerNode = await prisma.knowledgeNode.findFirst({
          where: { id: nodeId as string, companyId: req.companyId!, deletedAt: null },
        });

        if (!centerNode) {
          return res.status(404).json({ success: false, error: { message: 'Node not found' } });
        }

        // For simplicity, get all directly connected nodes
        const allLinks = await prisma.knowledgeLink.findMany({
          where: {
            companyId: req.companyId!,
            OR: [
              { sourceId: nodeId as string },
              { targetId: nodeId as string },
            ],
          },
          include: {
            source: true,
            target: true,
          },
        });

        const nodeMap = new Map();
        nodeMap.set(centerNode.id, centerNode);

        allLinks.forEach(link => {
          nodeMap.set(link.source.id, link.source);
          nodeMap.set(link.target.id, link.target);
        });

        nodes = Array.from(nodeMap.values());
        links = allLinks.map(l => ({
          id: l.id,
          source: l.sourceId,
          target: l.targetId,
          type: l.linkType,
          strength: l.strength,
        }));
      } else {
        // Get entire graph (limited)
        nodes = await prisma.knowledgeNode.findMany({
          where: { companyId: req.companyId!, deletedAt: null },
          take: 100,
        });

        const nodeIds = nodes.map(n => n.id);

        const allLinks = await prisma.knowledgeLink.findMany({
          where: {
            companyId: req.companyId!,
            sourceId: { in: nodeIds },
            targetId: { in: nodeIds },
          },
        });

        links = allLinks.map(l => ({
          id: l.id,
          source: l.sourceId,
          target: l.targetId,
          type: l.linkType,
          strength: l.strength,
        }));
      }

      res.json({
        success: true,
        data: {
          nodes: nodes.map(n => ({
            id: n.id,
            title: n.title,
            type: n.nodeType,
            tags: n.tags,
            importance: n.importanceScore,
          })),
          links,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  // ============================================
  // SUGGESTIONS
  // ============================================

  app.get(`${base}/nodes/:id/suggestions`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      // Simple suggestion: nodes with similar tags
      const node = await prisma.knowledgeNode.findUnique({
        where: { id: req.params.id },
      });

      if (!node) {
        return res.status(404).json({ success: false, error: { message: 'Node not found' } });
      }

      const suggestions = await prisma.knowledgeNode.findMany({
        where: {
          companyId: req.companyId!,
          deletedAt: null,
          id: { not: req.params.id },
          tags: { hasSome: node.tags },
        },
        take: 10,
        orderBy: { importanceScore: 'desc' },
      });

      res.json({ success: true, data: suggestions });
    } catch (error) {
      next(error);
    }
  });

  // ============================================
  // TAGS
  // ============================================

  app.get(`${base}/tags`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const nodes = await prisma.knowledgeNode.findMany({
        where: { companyId: req.companyId!, deletedAt: null },
        select: { tags: true },
      });

      const tagCounts = new Map<string, number>();
      nodes.forEach(node => {
        node.tags.forEach(tag => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      });

      const tags = Array.from(tagCounts.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count);

      res.json({ success: true, data: tags });
    } catch (error) {
      next(error);
    }
  });
}

export const knowledgeModule: ModuleDefinition = {
  name: 'knowledge',
  version: '1.0.0',
  provides: ['knowledge', 'graph'],
  routes: (ctx) => setupRoutes(ctx.app, ctx.prisma),
};
