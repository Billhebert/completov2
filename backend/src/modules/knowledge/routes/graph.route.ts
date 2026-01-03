import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupKnowledgeGraphRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  // Original graph endpoint for backward compatibility
  app.get(`${baseUrl}/graph`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const { nodeId, depth = '2' } = req.query;

      const userRole = (req.user as any)?.role;
      const isDev = userRole === 'dev';
      const isAdminGeral = userRole === 'admin_geral';

      let nodes: any[];
      let links: any[];

      if (nodeId) {
        // Get subgraph around a specific node
        const centerNode = await prisma.knowledgeNode.findFirst({
          where: {
            id: nodeId as string,
            ...(isDev || isAdminGeral ? {} : { companyId: req.companyId! }),
            deletedAt: null
          },
        });

        if (!centerNode) {
          return res.status(404).json({ success: false, error: { message: 'Node not found' } });
        }

        // Get all directly connected nodes
        const allLinks = await prisma.knowledgeLink.findMany({
          where: {
            ...(isDev || isAdminGeral ? {} : { companyId: req.companyId! }),
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
}
