// src/modules/knowledge/index.ts
import { ModuleDefinition } from '../../core/types';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, validateBody, requirePermission, Permission } from '../../core/middleware';
import { z } from 'zod';
import advancedRoutes from './advanced-routes';
import { initializeAutoConvert } from './auto-convert';

const nodeSchema = z.object({
  title: z.string(),
  content: z.string(),
  nodeType: z.enum(['zettel', 'documentation', 'procedure', 'reference', 'insight', 'deal', 'message', 'conversation', 'meeting', 'task']),
  tags: z.array(z.string()).optional(),
  importanceScore: z.number().min(0).max(1).optional(),
  ownerId: z.string().optional(), // For personal zettels
  isCompanyWide: z.boolean().optional(), // true = company zettel, false = personal zettel
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

  app.post(`${base}/nodes`, authenticate, tenantIsolation, requirePermission(Permission.KNOWLEDGE_READ), validateBody(nodeSchema), async (req, res, next) => {
    try {
      // Determine if it's a company-wide or personal zettel
      const isCompanyWide = req.body.isCompanyWide !== false; // Default to company-wide
      const ownerId = isCompanyWide ? null : (req.body.ownerId || req.user!.id);

      const node = await prisma.knowledgeNode.create({
        data: {
          ...req.body,
          companyId: req.companyId!,
          createdById: req.user!.id,
          ownerId,
          isCompanyWide,
          tags: req.body.tags || [],
          importanceScore: req.body.importanceScore || 0.5,
        },
      });

      // Auto-index in RAG (vector database)
      try {
        const { getAIService } = await import('../../core/ai/ai.service');
        const aiService = getAIService(prisma);

        const embedding = await aiService.generateEmbedding(
          `${node.title}\n\n${node.content}\n\nTags: ${node.tags.join(', ')}`
        );

        await prisma.embedding.create({
          data: {
            companyId: req.companyId!,
            nodeId: node.id,
            model: 'text-embedding-ada-002', // or ollama embedding model
            embedding,
          },
        });
      } catch (embeddingError) {
        console.error('Failed to create embedding:', embeddingError);
        // Don't fail the node creation if embedding fails
      }

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

      // Update embedding in RAG if content/title/tags changed
      if (req.body.title || req.body.content || req.body.tags) {
        try {
          const { getAIService } = await import('../../core/ai/ai.service');
          const aiService = getAIService(prisma);

          const embedding = await aiService.generateEmbedding(
            `${node.title}\n\n${node.content}\n\nTags: ${node.tags.join(', ')}`
          );

          // Update or create embedding
          await prisma.embedding.upsert({
            where: { nodeId: node.id },
            update: { embedding, model: 'text-embedding-ada-002' },
            create: {
              companyId: node.companyId,
              nodeId: node.id,
              model: 'text-embedding-ada-002',
              embedding,
            },
          });
        } catch (embeddingError) {
          console.error('Failed to update embedding:', embeddingError);
        }
      }

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
  // GRAPH VISUALIZATION (Obsidian-style)
  // ============================================

  // Obsidian-style full graph visualization
  app.get(`${base}/graph/obsidian`, authenticate, tenantIsolation, async (req, res, next) => {
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

  // Original graph endpoint for backward compatibility
  app.get(`${base}/graph`, authenticate, tenantIsolation, async (req, res, next) => {
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

  // ============================================
  // ENTITY TO ZETTEL CONVERSION
  // ============================================

  // Convert any entity to zettel
  app.post(`${base}/convert`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const { entityType, entityId, title, content, tags, isPersonal } = req.body;

      if (!entityType || !content) {
        return res.status(400).json({
          success: false,
          error: { message: 'entityType and content are required' }
        });
      }

      // Create zettel from entity
      const node = await prisma.knowledgeNode.create({
        data: {
          title: title || `${entityType}: ${entityId || 'Auto-generated'}`,
          content,
          nodeType: entityType as any,
          tags: tags || [entityType],
          companyId: req.companyId!,
          createdById: req.user!.id,
          isCompanyWide: !isPersonal,
          ownerId: isPersonal ? req.user!.id : null,
          importanceScore: 0.5,
          metadata: {
            sourceEntityType: entityType,
            sourceEntityId: entityId,
            autoConverted: true,
          } as any,
        },
      });

      // Auto-index in RAG
      try {
        const { getAIService } = await import('../../core/ai/ai.service');
        const aiService = getAIService(prisma);

        const embedding = await aiService.generateEmbedding(
          `${node.title}\n\n${node.content}\n\nTags: ${node.tags.join(', ')}`
        );

        await prisma.embedding.create({
          data: {
            companyId: req.companyId!,
            nodeId: node.id,
            model: 'text-embedding-ada-002',
            embedding,
          },
        });
      } catch (embeddingError) {
        console.error('Failed to create embedding:', embeddingError);
      }

      res.status(201).json({ success: true, data: node });
    } catch (error) {
      next(error);
    }
  });

  // Batch convert entities to zettels
  app.post(`${base}/convert/batch`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const { entities } = req.body;

      if (!Array.isArray(entities) || entities.length === 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'entities array is required' }
        });
      }

      const createdNodes = [];

      for (const entity of entities) {
        try {
          const node = await prisma.knowledgeNode.create({
            data: {
              title: entity.title || `${entity.entityType}: ${entity.entityId}`,
              content: entity.content,
              nodeType: entity.entityType as any,
              tags: entity.tags || [entity.entityType],
              companyId: req.companyId!,
              createdById: req.user!.id,
              isCompanyWide: !entity.isPersonal,
              ownerId: entity.isPersonal ? req.user!.id : null,
              importanceScore: entity.importanceScore || 0.5,
              metadata: {
                sourceEntityType: entity.entityType,
                sourceEntityId: entity.entityId,
                autoConverted: true,
              } as any,
            },
          });

          // Auto-index in RAG (background - don't wait)
          const { getAIService } = await import('../../core/ai/ai.service');
          const aiService = getAIService(prisma);
          aiService.generateEmbedding(
            `${node.title}\n\n${node.content}\n\nTags: ${node.tags.join(', ')}`
          ).then(embedding => {
            return prisma.embedding.create({
              data: {
                companyId: req.companyId!,
                nodeId: node.id,
                model: 'text-embedding-ada-002',
                embedding,
              },
            });
          }).catch(err => console.error('Embedding error:', err));

          createdNodes.push(node);
        } catch (err) {
          console.error('Failed to convert entity:', err);
        }
      }

      res.status(201).json({
        success: true,
        data: {
          created: createdNodes.length,
          total: entities.length,
          nodes: createdNodes,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  // ============================================
  // INTELLIGENT SUGGESTIONS (AI-Powered)
  // ============================================

  // AI-powered node suggestions (with access to both company and personal zettels)
  app.get(`${base}/nodes/:id/suggestions`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const node = await prisma.knowledgeNode.findUnique({
        where: { id: req.params.id },
      });

      if (!node) {
        return res.status(404).json({ success: false, error: { message: 'Node not found' } });
      }

      const userRole = (req.user as any)?.role;
      const isDev = userRole === 'dev';
      const isAdminGeral = userRole === 'admin_geral';

      // Get all candidate nodes (AI can access both company and user zettels)
      const candidateNodes = await prisma.knowledgeNode.findMany({
        where: {
          ...(isDev || isAdminGeral ? {} : { companyId: req.companyId! }),
          deletedAt: null,
          id: { not: req.params.id },
          // AI can see company zettels + user's personal zettels for better context
          ...(isDev || isAdminGeral ? {} : {
            OR: [
              { isCompanyWide: true },
              { ownerId: req.user!.id },
            ],
          }),
        },
        select: { id: true, title: true, content: true, tags: true, nodeType: true, isCompanyWide: true },
        take: 50,
      });

      // Use AI to find semantically related nodes
      const { getAIService } = await import('../../core/ai/ai.service');
      const aiService = getAIService(prisma);

      const context = `
        Current Node:
        Title: ${node.title}
        Type: ${node.nodeType}
        Content: ${node.content.substring(0, 500)}
        Tags: ${node.tags.join(', ')}

        Find the most relevant nodes from this list:
        ${candidateNodes.map((n, i) => `${i + 1}. [${n.nodeType}] ${n.title} - Tags: ${n.tags.join(', ')}`).join('\n')}
      `;

      const aiResult = await aiService.generateSuggestions(
        context,
        'related knowledge nodes (return only node numbers, comma-separated)'
      );

      // Parse AI response to get suggested node indices
      const suggestedIndices = aiResult
        .match(/\d+/g)
        ?.map(n => parseInt(n) - 1)
        .filter(i => i >= 0 && i < candidateNodes.length)
        .slice(0, 10) || [];

      const aiSuggestions = suggestedIndices.map(i => candidateNodes[i]);

      // Fallback to tag-based if AI returns nothing
      const suggestions = aiSuggestions.length > 0 ? aiSuggestions : await prisma.knowledgeNode.findMany({
        where: {
          companyId: req.companyId!,
          deletedAt: null,
          id: { not: req.params.id },
          tags: { hasSome: node.tags },
        },
        take: 10,
        orderBy: { importanceScore: 'desc' },
      });

      res.json({ success: true, data: suggestions, aiPowered: aiSuggestions.length > 0 });
    } catch (error) {
      next(error);
    }
  });

  // AI-powered tag suggestions for content
  app.post(`${base}/nodes/suggest-tags`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const { title, content } = req.body;

      if (!title || !content) {
        return res.status(400).json({
          success: false,
          error: { message: 'Title and content are required' }
        });
      }

      // Get existing tags in the company for context
      const existingNodes = await prisma.knowledgeNode.findMany({
        where: { companyId: req.companyId!, deletedAt: null },
        select: { tags: true },
        take: 100,
      });

      const allTags = new Set<string>();
      existingNodes.forEach(node => {
        node.tags.forEach(tag => allTags.add(tag));
      });

      const { getAIService } = await import('../../core/ai/ai.service');
      const aiService = getAIService(prisma);

      const context = `
        Title: ${title}
        Content: ${content.substring(0, 1000)}

        Existing tags in knowledge base: ${Array.from(allTags).join(', ')}

        Suggest 3-7 relevant tags for this knowledge node. Prefer existing tags when applicable, but suggest new ones if needed.
      `;

      const tagSuggestions = await aiService.generateSuggestions(
        context,
        'relevant tags (return as comma-separated list)'
      );

      // Parse tags from AI response
      const tags = tagSuggestions
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0 && t.length < 50)
        .slice(0, 7);

      res.json({ success: true, data: { tags } });
    } catch (error) {
      next(error);
    }
  });

  // AI-powered link suggestions
  app.get(`${base}/nodes/:id/suggest-links`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const node = await prisma.knowledgeNode.findUnique({
        where: { id: req.params.id },
        include: {
          outgoingLinks: true,
        },
      });

      if (!node) {
        return res.status(404).json({ success: false, error: { message: 'Node not found' } });
      }

      // Get existing link targets to exclude
      const existingLinkTargets = node.outgoingLinks.map(l => l.targetId);

      // Get candidate nodes
      const candidateNodes = await prisma.knowledgeNode.findMany({
        where: {
          companyId: req.companyId!,
          deletedAt: null,
          id: { not: req.params.id, notIn: existingLinkTargets },
        },
        select: { id: true, title: true, content: true, nodeType: true, tags: true },
        take: 30,
      });

      const { getAIService } = await import('../../core/ai/ai.service');
      const aiService = getAIService(prisma);

      const context = `
        Source Node:
        Title: ${node.title}
        Type: ${node.nodeType}
        Content: ${node.content.substring(0, 500)}

        Potential target nodes:
        ${candidateNodes.map((n, i) => `${i + 1}. [${n.nodeType}] ${n.title}`).join('\n')}

        Suggest which nodes should be linked and what type of relationship:
        - related: general relationship
        - derives: target derives from source
        - supports: target supports source's claims
        - contradicts: target contradicts source
      `;

      const linkSuggestions = await aiService.generateSuggestions(
        context,
        'node links with relationship types (format: "number:linkType")'
      );

      // Parse AI response
      const suggestions = linkSuggestions
        .split(/[,\n]/)
        .map(s => {
          const match = s.trim().match(/(\d+)\s*:\s*(related|derives|supports|contradicts)/);
          if (match) {
            const idx = parseInt(match[1]) - 1;
            const linkType = match[2] as 'related' | 'derives' | 'supports' | 'contradicts';
            if (idx >= 0 && idx < candidateNodes.length) {
              return {
                target: candidateNodes[idx],
                linkType,
                strength: 0.8,
              };
            }
          }
          return null;
        })
        .filter(Boolean)
        .slice(0, 5);

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

  // ============================================
  // RAG SEMANTIC SEARCH
  // ============================================

  // Semantic search using RAG (vector similarity)
  app.post(`${base}/search/semantic`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const { query, limit = 10, minScore = 0.7 } = req.body;

      if (!query) {
        return res.status(400).json({
          success: false,
          error: { message: 'Query is required' }
        });
      }

      const userRole = (req.user as any)?.role;
      const isDev = userRole === 'dev';
      const isAdminGeral = userRole === 'admin_geral';

      // Generate embedding for query
      const { getAIService } = await import('../../core/ai/ai.service');
      const aiService = getAIService(prisma);

      const queryEmbedding = await aiService.generateEmbedding(query);

      // Get all embeddings with their nodes (respecting permissions)
      const embeddings = await prisma.embedding.findMany({
        where: isDev || isAdminGeral ? {} : {
          companyId: req.companyId!,
        },
        include: {
          node: {
            where: {
              deletedAt: null,
              ...(isDev || isAdminGeral ? {} : {
                OR: [
                  { isCompanyWide: true },
                  { ownerId: req.user!.id },
                ],
              }),
            },
          },
        },
        take: 500, // Limit for performance
      });

      // Calculate cosine similarity
      const results = embeddings
        .filter(e => e.node) // Only include embeddings with valid nodes
        .map(e => {
          const similarity = cosineSimilarity(queryEmbedding, e.embedding as number[]);
          return {
            node: e.node,
            similarity,
          };
        })
        .filter(r => r.similarity >= minScore)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      res.json({
        success: true,
        data: {
          query,
          results: results.map(r => ({
            ...r.node,
            relevanceScore: r.similarity,
          })),
          count: results.length,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  // Helper function for cosine similarity
  function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // AI-powered question answering using RAG
  app.post(`${base}/ask`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const { question, maxContext = 5 } = req.body;

      if (!question) {
        return res.status(400).json({
          success: false,
          error: { message: 'Question is required' }
        });
      }

      const userRole = (req.user as any)?.role;
      const isDev = userRole === 'dev';
      const isAdminGeral = userRole === 'admin_geral';

      // Get relevant context using semantic search
      const { getAIService } = await import('../../core/ai/ai.service');
      const aiService = getAIService(prisma);

      const queryEmbedding = await aiService.generateEmbedding(question);

      // Get embeddings
      const embeddings = await prisma.embedding.findMany({
        where: isDev || isAdminGeral ? {} : {
          companyId: req.companyId!,
        },
        include: {
          node: {
            where: {
              deletedAt: null,
              ...(isDev || isAdminGeral ? {} : {
                OR: [
                  { isCompanyWide: true },
                  { ownerId: req.user!.id },
                ],
              }),
            },
          },
        },
        take: 500,
      });

      // Find most relevant nodes
      const relevantNodes = embeddings
        .filter(e => e.node)
        .map(e => ({
          node: e.node!,
          similarity: cosineSimilarity(queryEmbedding, e.embedding as number[]),
        }))
        .filter(r => r.similarity >= 0.6)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, maxContext);

      if (relevantNodes.length === 0) {
        return res.json({
          success: true,
          data: {
            answer: 'Não encontrei informações relevantes na base de conhecimento para responder essa pergunta.',
            sources: [],
            confidence: 'low',
          },
        });
      }

      // Build context from relevant nodes
      const context = relevantNodes
        .map((r, i) => `[${i + 1}] ${r.node.title}\n${r.node.content.substring(0, 500)}...\n`)
        .join('\n\n');

      // Ask AI with context
      const prompt = `
Baseado nas seguintes informações da base de conhecimento:

${context}

Pergunta: ${question}

Forneça uma resposta detalhada e precisa em português (pt-BR), citando as fontes relevantes quando apropriado.
      `;

      const aiResponse = await aiService.complete({
        prompt,
        systemMessage: 'Você é um assistente que responde perguntas baseado em uma base de conhecimento. Seja preciso e cite as fontes.',
        temperature: 0.7,
      });

      res.json({
        success: true,
        data: {
          answer: aiResponse.content,
          sources: relevantNodes.map(r => ({
            id: r.node.id,
            title: r.node.title,
            type: r.node.nodeType,
            relevance: r.similarity,
          })),
          confidence: relevantNodes[0].similarity > 0.8 ? 'high' :
                     relevantNodes[0].similarity > 0.6 ? 'medium' : 'low',
          model: aiResponse.model,
          provider: aiResponse.provider,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  // ============================================
  // ADVANCED ROUTES (Reminders, Truth Layer)
  // ============================================
  app.use(`${base}`, authenticate, tenantIsolation, advancedRoutes);
}

export const knowledgeModule: ModuleDefinition = {
  name: 'knowledge',
  version: '1.0.0',
  provides: ['knowledge', 'graph', 'rag'],
  routes: (ctx) => {
    setupRoutes(ctx.app, ctx.prisma);

    // Initialize auto-convert service (converts everything to zettels)
    if (ctx.eventBus) {
      initializeAutoConvert(ctx.prisma, ctx.eventBus);
      console.log('✅ Auto-convert service initialized - Everything will become a zettel!');
    }
  },
};
