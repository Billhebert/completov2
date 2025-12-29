// src/modules/knowledge/advanced.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission, validateBody } from '../../core/middleware';
import { EventBus, Events } from '../../core/event-bus';
import { Server as SocketServer } from 'socket.io';
import { z } from 'zod';
import PDFDocument from 'pdfkit';

const commentSchema = z.object({
  content: z.string(),
  mentions: z.array(z.string()).optional(),
});

const templateSchema = z.object({
  name: z.string(),
  content: z.string(),
  category: z.string().optional(),
  variables: z.array(z.string()).optional(),
});

export function setupAdvancedKnowledgeRoutes(
  router: Router,
  prisma: PrismaClient,
  eventBus: EventBus,
  io: SocketServer
) {
  
  // ===== FULL-TEXT SEARCH (PostgreSQL FTS) =====

  // Advanced search
  router.get('/knowledge/search/advanced',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    async (req, res, next) => {
      try {
        const { q, limit = '20' } = req.query;

        if (!q) {
          return res.status(400).json({
            success: false,
            error: { message: 'Search query required' },
          });
        }

        // PostgreSQL Full-Text Search
        const results = await prisma.$queryRaw`
          SELECT 
            id, 
            title, 
            content,
            ts_rank(
              to_tsvector('english', title || ' ' || content),
              plainto_tsquery('english', ${q})
            ) as rank,
            ts_headline(
              'english',
              content,
              plainto_tsquery('english', ${q}),
              'MaxWords=50, MinWords=25'
            ) as highlight
          FROM "KnowledgeNode"
          WHERE 
            "companyId" = ${req.companyId}
            AND to_tsvector('english', title || ' ' || content) @@ plainto_tsquery('english', ${q})
          ORDER BY rank DESC
          LIMIT ${parseInt(limit as string)}
        `;

        res.json({ success: true, data: results });
      } catch (error) {
        next(error);
      }
    }
  );

  // ===== VERSION HISTORY =====

  // Create version
  router.post('/knowledge/:id/versions',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_UPDATE),
    async (req, res, next) => {
      try {
        const node = await prisma.knowledgeNode.findFirst({
          where: {
            id: req.params.id,
            companyId: req.companyId!,
          },
        });

        if (!node) {
          return res.status(404).json({
            success: false,
            error: { message: 'Node not found' },
          });
        }

        // Get latest version
        const latestVersion = await prisma.knowledgeVersion.findFirst({
          where: { nodeId: node.id },
          orderBy: { version: 'desc' },
        });

        const newVersionNumber = (latestVersion?.version || 0) + 1;

        // Create version
        const version = await prisma.knowledgeVersion.create({
          data: {
            nodeId: node.id,
            version: newVersionNumber,
            title: node.title,
            content: node.content,
            changeNote: req.body.changeNote,
            createdById: req.user!.id,
          },
        });

        res.status(201).json({ success: true, data: version });
      } catch (error) {
        next(error);
      }
    }
  );

  // List versions
  router.get('/knowledge/:id/versions',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    async (req, res, next) => {
      try {
        const versions = await prisma.knowledgeVersion.findMany({
          where: { nodeId: req.params.id },
          include: {
            createdBy: { select: { id: true, name: true } },
          },
          orderBy: { version: 'desc' },
        });

        res.json({ success: true, data: versions });
      } catch (error) {
        next(error);
      }
    }
  );

  // Restore version
  router.post('/knowledge/:id/versions/:versionId/restore',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_UPDATE),
    async (req, res, next) => {
      try {
        const version = await prisma.knowledgeVersion.findFirst({
          where: {
            id: req.params.versionId,
            nodeId: req.params.id,
          },
        });

        if (!version) {
          return res.status(404).json({
            success: false,
            error: { message: 'Version not found' },
          });
        }

        // Restore
        await prisma.knowledgeNode.update({
          where: { id: req.params.id },
          data: {
            title: version.title,
            content: version.content,
          },
        });

        res.json({ success: true, message: 'Version restored' });
      } catch (error) {
        next(error);
      }
    }
  );

  // Compare versions
  router.get('/knowledge/versions/compare',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    async (req, res, next) => {
      try {
        const { versionA, versionB } = req.query;

        const [a, b] = await Promise.all([
          prisma.knowledgeVersion.findUnique({ where: { id: versionA as string } }),
          prisma.knowledgeVersion.findUnique({ where: { id: versionB as string } }),
        ]);

        if (!a || !b) {
          return res.status(404).json({
            success: false,
            error: { message: 'Version not found' },
          });
        }

        res.json({
          success: true,
          data: {
            versionA: a,
            versionB: b,
            // In production, add diff algorithm
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // ===== COLLABORATIVE EDITING =====

  // Lock node for editing
  router.post('/knowledge/:id/lock',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_UPDATE),
    async (req, res, next) => {
      try {
        const lock = await prisma.knowledgeLock.create({
          data: {
            nodeId: req.params.id,
            userId: req.user!.id,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
          },
        });

        // Emit lock event
        io.to(`knowledge:${req.params.id}`).emit('node:locked', {
          nodeId: req.params.id,
          userId: req.user!.id,
        });

        res.status(201).json({ success: true, data: lock });
      } catch (error) {
        next(error);
      }
    }
  );

  // Unlock node
  router.delete('/knowledge/:id/lock',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_UPDATE),
    async (req, res, next) => {
      try {
        await prisma.knowledgeLock.deleteMany({
          where: {
            nodeId: req.params.id,
            userId: req.user!.id,
          },
        });

        io.to(`knowledge:${req.params.id}`).emit('node:unlocked', {
          nodeId: req.params.id,
        });

        res.json({ success: true, message: 'Node unlocked' });
      } catch (error) {
        next(error);
      }
    }
  );

  // Get active editors
  router.get('/knowledge/:id/editors',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    async (req, res, next) => {
      try {
        const locks = await prisma.knowledgeLock.findMany({
          where: {
            nodeId: req.params.id,
            expiresAt: { gt: new Date() },
          },
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        });

        res.json({ success: true, data: locks });
      } catch (error) {
        next(error);
      }
    }
  );

  // ===== COMMENTS =====

  // Add comment
  router.post('/knowledge/:id/comments',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_CREATE),
    validateBody(commentSchema),
    async (req, res, next) => {
      try {
        const comment = await prisma.knowledgeComment.create({
          data: {
            nodeId: req.params.id,
            content: req.body.content,
            mentions: req.body.mentions || [],
            createdById: req.user!.id,
          },
          include: {
            createdBy: { select: { id: true, name: true, avatar: true } },
          },
        });

        // Notify mentions
        if (req.body.mentions) {
          for (const userId of req.body.mentions) {
            await eventBus.publish(Events.KNOWLEDGE_COMMENT_MENTION, {
              type: Events.KNOWLEDGE_COMMENT_MENTION,
              version: 'v1',
              timestamp: new Date(),
              companyId: req.companyId!,
              userId,
              data: { commentId: comment.id, nodeId: req.params.id },
            });
          }
        }

        res.status(201).json({ success: true, data: comment });
      } catch (error) {
        next(error);
      }
    }
  );

  // List comments
  router.get('/knowledge/:id/comments',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    async (req, res, next) => {
      try {
        const comments = await prisma.knowledgeComment.findMany({
          where: { nodeId: req.params.id },
          include: {
            createdBy: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
        });

        res.json({ success: true, data: comments });
      } catch (error) {
        next(error);
      }
    }
  );

  // ===== TEMPLATES =====

  // Create template
  router.post('/knowledge/templates',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_CREATE),
    validateBody(templateSchema),
    async (req, res, next) => {
      try {
        const template = await prisma.knowledgeTemplate.create({
          data: {
            ...req.body,
            variables: req.body.variables || [],
            companyId: req.companyId!,
            createdById: req.user!.id,
          },
        });

        res.status(201).json({ success: true, data: template });
      } catch (error) {
        next(error);
      }
    }
  );

  // List templates
  router.get('/knowledge/templates',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    async (req, res, next) => {
      try {
        const { category } = req.query;

        const where: any = { companyId: req.companyId! };
        if (category) where.category = category;

        const templates = await prisma.knowledgeTemplate.findMany({
          where,
          include: {
            createdBy: { select: { id: true, name: true } },
          },
          orderBy: { name: 'asc' },
        });

        res.json({ success: true, data: templates });
      } catch (error) {
        next(error);
      }
    }
  );

  // Use template
  router.post('/knowledge/templates/:id/use',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_CREATE),
    validateBody(z.object({
      variables: z.record(z.string()).optional(),
    })),
    async (req, res, next) => {
      try {
        const template = await prisma.knowledgeTemplate.findFirst({
          where: {
            id: req.params.id,
            companyId: req.companyId!,
          },
        });

        if (!template) {
          return res.status(404).json({
            success: false,
            error: { message: 'Template not found' },
          });
        }

        // Replace variables
        let content = template.content;
        if (req.body.variables) {
          for (const [key, value] of Object.entries(req.body.variables)) {
            content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
          }
        }

        // Create node from template
        const node = await prisma.knowledgeNode.create({
          data: {
            title: template.name,
            content,
            nodeType: 'document',
            companyId: req.companyId!,
          },
        });

        res.status(201).json({ success: true, data: node });
      } catch (error) {
        next(error);
      }
    }
  );

  // ===== EXPORT =====

  // Export to PDF
  router.get('/knowledge/:id/export/pdf',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    async (req, res, next) => {
      try {
        const node = await prisma.knowledgeNode.findFirst({
          where: {
            id: req.params.id,
            companyId: req.companyId!,
          },
        });

        if (!node) {
          return res.status(404).json({
            success: false,
            error: { message: 'Node not found' },
          });
        }

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${node.title}.pdf`);
        doc.pipe(res);

        doc.fontSize(20).text(node.title, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(node.content);

        doc.end();
      } catch (error) {
        next(error);
      }
    }
  );

  // Export to Markdown
  router.get('/knowledge/:id/export/markdown',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    async (req, res, next) => {
      try {
        const node = await prisma.knowledgeNode.findFirst({
          where: {
            id: req.params.id,
            companyId: req.companyId!,
          },
        });

        if (!node) {
          return res.status(404).json({
            success: false,
            error: { message: 'Node not found' },
          });
        }

        const markdown = `# ${node.title}\n\n${node.content}`;

        res.setHeader('Content-Type', 'text/markdown');
        res.setHeader('Content-Disposition', `attachment; filename=${node.title}.md`);
        res.send(markdown);
      } catch (error) {
        next(error);
      }
    }
  );

  // Bulk export
  router.post('/knowledge/export/bulk',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    validateBody(z.object({
      nodeIds: z.array(z.string()),
      format: z.enum(['pdf', 'markdown', 'json']),
    })),
    async (req, res, next) => {
      try {
        const nodes = await prisma.knowledgeNode.findMany({
          where: {
            id: { in: req.body.nodeIds },
            companyId: req.companyId!,
          },
        });

        if (req.body.format === 'json') {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Disposition', 'attachment; filename=knowledge-export.json');
          return res.json(nodes);
        }

        // For PDF/Markdown bulk, create a zip (simplified)
        res.json({
          success: true,
          message: 'Bulk export completed',
          data: nodes.length,
        });
      } catch (error) {
        next(error);
      }
    }
  );
}
