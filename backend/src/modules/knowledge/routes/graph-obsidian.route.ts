import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupKnowledgeGraphObsidianRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  // Obsidian-style full graph visualization
  app.get(`${baseUrl}/graph/obsidian`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const { companyId: requestCompanyId, scope = 'accessible', limit = '500' } = req.query;

      const userRole = (req.user as any)?.role;
      const isDev = userRole === 'dev';
      const isAdminGeral = userRole === 'admin_geral';

      let nodeWhere: any = { deletedAt: null };
      let linkWhere: any = {};

      // Special permissions for DEV and ADMIN_GERAL
      if (isDev || isAdminGeral) {
        // Can see ALL zettels from ALL companies
        if (requestCompanyId) {
          nodeWhere.companyId = requestCompanyId as string;
          linkWhere.companyId = requestCompanyId as string;
        }
        // If no companyId specified, show ALL
      } else {
        // Normal users: company zettels + personal zettels
        nodeWhere.companyId = req.companyId!;
        linkWhere.companyId = req.companyId!;

        if (scope === 'accessible') {
          nodeWhere.OR = [
            { isCompanyWide: true },
            { ownerId: req.user!.id },
          ];
        } else if (scope === 'company') {
          nodeWhere.isCompanyWide = true;
        } else if (scope === 'personal') {
          nodeWhere.ownerId = req.user!.id;
        }
      }

      // Get all accessible nodes
      const nodes = await prisma.knowledgeNode.findMany({
        where: nodeWhere,
        take: parseInt(limit as string),
        select: {
          id: true,
          title: true,
          nodeType: true,
          tags: true,
          importanceScore: true,
          isCompanyWide: true,
          ownerId: true,
          createdById: true,
          companyId: true,
          createdBy: { select: { name: true } },
        },
        orderBy: [
          { importanceScore: 'desc' },
          { accessCount: 'desc' },
        ],
      });

      const nodeIds = nodes.map(n => n.id);

      // Get all links between these nodes
      const links = await prisma.knowledgeLink.findMany({
        where: {
          ...linkWhere,
          sourceId: { in: nodeIds },
          targetId: { in: nodeIds },
        },
        select: {
          id: true,
          sourceId: true,
          targetId: true,
          linkType: true,
          strength: true,
        },
      });

      // Format for Obsidian/D3.js/vis.js
      const graphData = {
        nodes: nodes.map(n => ({
          id: n.id,
          label: n.title,
          type: n.nodeType,
          tags: n.tags,
          importance: n.importanceScore,
          isCompanyWide: n.isCompanyWide,
          owner: n.ownerId,
          createdBy: n.createdBy.name,
          companyId: n.companyId,
          // Color coding for visualization
          color: n.isCompanyWide ? '#3b82f6' : '#8b5cf6', // blue = company, purple = personal
          size: 10 + (n.importanceScore * 20), // Size based on importance
        })),
        edges: links.map(l => ({
          id: l.id,
          from: l.sourceId,
          to: l.targetId,
          label: l.linkType,
          value: l.strength,
          // Arrow and color based on link type
          arrows: 'to',
          color: {
            related: '#64748b',
            derives: '#10b981',
            supports: '#3b82f6',
            contradicts: '#ef4444',
          }[l.linkType] || '#64748b',
        })),
        metadata: {
          totalNodes: nodes.length,
          totalLinks: links.length,
          viewMode: isDev || isAdminGeral ? 'global' : scope,
          userRole,
        },
      };

      res.json({ success: true, data: graphData });
    } catch (error) {
      next(error);
    }
  });
}
