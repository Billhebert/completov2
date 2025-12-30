// src/modules/chat/advanced.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission, validateBody } from '../../core/middleware';
import { EventBus, Events } from '../../core/event-bus';
import { Server as SocketServer } from 'socket.io';
import { z } from 'zod';

const messageEditSchema = z.object({
  content: z.string(),
});

const scheduledMessageSchema = z.object({
  channelId: z.string(),
  content: z.string(),
  scheduledFor: z.string(), // ISO date
  recurring: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly']),
    interval: z.number(),
    endDate: z.string().optional(),
  }).optional(),
});

const slashCommandSchema = z.object({
  command: z.string(),
  description: z.string(),
  handler: z.string(), // Function name or webhook URL
  permissions: z.array(z.string()).default([]),
});

export function setupChatAdvancedRoutes(
  router: Router, 
  prisma: PrismaClient, 
  eventBus: EventBus,
  io: SocketServer
) {
  
  // ===== MESSAGE EDITING =====

  // Edit message
  router.patch('/messages/:id',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_UPDATE),
    validateBody(messageEditSchema),
    async (req, res, next) => {
      try {
        const message = await prisma.message.findFirst({
          where: {
            id: req.params.id,
            senderId: req.user!.id, // Only sender can edit
          },
        });

        if (!message) {
          return res.status(404).json({
            success: false,
            error: { message: 'Message not found or unauthorized' },
          });
        }

        // Save edit history
        await prisma.messageEdit.create({
          data: {
            messageId: message.id,
            oldContent: message.content,
            newContent: req.body.content,
            editedById: req.user!.id,
          },
        });

        const updated = await prisma.message.update({
          where: { id: message.id },
          data: {
            content: req.body.content,
            edited: true,
            editedAt: new Date(),
          },
        });

        // Emit socket event
        io.to(`channel:${message.channelId}`).emit('message:edited', updated);

        res.json({ success: true, data: updated });
      } catch (error) {
        next(error);
      }
    }
  );

  // Get message edit history
  router.get('/messages/:id/history',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    async (req, res, next) => {
      try {
        const history = await prisma.messageEdit.findMany({
          where: { messageId: req.params.id },
          include: {
            editedBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        });

        res.json({ success: true, data: history });
      } catch (error) {
        next(error);
      }
    }
  );

  // Soft delete message
  router.delete('/messages/:id',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_DELETE),
    async (req, res, next) => {
      try {
        const message = await prisma.message.findFirst({
          where: {
            id: req.params.id,
            senderId: req.user!.id,
          },
        });

        if (!message) {
          return res.status(404).json({
            success: false,
            error: { message: 'Message not found or unauthorized' },
          });
        }

        const deleted = await prisma.message.update({
          where: { id: message.id },
          data: {
            deletedAt: new Date(),
            content: '[Message deleted]',
          },
        });

        io.to(`channel:${message.channelId}`).emit('message:deleted', { id: message.id });

        res.json({ success: true, data: deleted });
      } catch (error) {
        next(error);
      }
    }
  );

  // ===== FILE SHARING =====

  // Share file in channel
  router.post('/channels/:id/files',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_CREATE),
    async (req, res, next) => {
      try {
        const { fileId, caption } = req.body;

        // Verify file exists
        const file = await prisma.file.findFirst({
          where: {
            id: fileId,
            companyId: req.companyId!,
          },
        });

        if (!file) {
          return res.status(404).json({
            success: false,
            error: { message: 'File not found' },
          });
        }

        // Create message with file
        const message = await prisma.message.create({
          data: {
            companyId: req.companyId!,
            channelId: req.params.id,
            authorId: req.user!.id,
            senderId: req.user!.id,
            content: caption || `Shared file: ${file.filename}`,
            messageType: 'file',
            metadata: JSON.stringify({
              fileId: file.id,
              filename: file.filename,
              size: file.size,
              mimeType: file.mimeType,
            }),
          },
          include: {
            sender: { select: { id: true, name: true, avatar: true } },
          },
        });

        io.to(`channel:${req.params.id}`).emit('message:new', message);

        res.status(201).json({ success: true, data: message });
      } catch (error) {
        next(error);
      }
    }
  );

  // ===== MESSAGE SEARCH =====

  // Search messages
  router.get('/messages/search',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    async (req, res, next) => {
      try {
        const { query, channelId, senderId, before, after, limit = '20' } = req.query;

        const where: any = {
          channel: { companyId: req.companyId! },
          deleted: false,
        };

        if (query) {
          where.content = { contains: query as string, mode: 'insensitive' };
        }
        if (channelId) where.channelId = channelId;
        if (senderId) where.senderId = senderId;
        if (before || after) {
          where.timestamp = {};
          if (before) where.timestamp.lt = new Date(before as string);
          if (after) where.timestamp.gt = new Date(after as string);
        }

        const messages = await prisma.message.findMany({
          where,
          take: parseInt(limit as string),
          include: {
            sender: { select: { id: true, name: true, avatar: true } },
            channel: { select: { id: true, name: true } },
          },
          orderBy: { timestamp: 'desc' },
        });

        res.json({ success: true, data: messages });
      } catch (error) {
        next(error);
      }
    }
  );

  // ===== LINK PREVIEW =====

  // Get link preview
  router.post('/messages/link-preview',
    authenticate,
    validateBody(z.object({
      url: z.string().url(),
    })),
    async (req, res, next) => {
      try {
        const { url } = req.body;

        // Check cache first
        const cached = await prisma.linkPreview.findFirst({
          where: { url },
          orderBy: { createdAt: 'desc' },
        });

        if (cached && Date.now() - cached.createdAt.getTime() < 24 * 60 * 60 * 1000) {
          return res.json({ success: true, data: cached });
        }

        // Fetch URL metadata (simplified - in production use a library like metascraper)
        const response = await fetch(url);
        const html = await response.text();

        // Extract basic metadata
        const titleMatch = html.match(/<title>(.*?)<\/title>/i);
        const descMatch = html.match(/<meta name="description" content="(.*?)"/i);
        const imageMatch = html.match(/<meta property="og:image" content="(.*?)"/i);

        const preview = await prisma.linkPreview.create({
          data: {
            messageId: req.params.id,
            url,
            title: titleMatch ? titleMatch[1] : url,
            description: descMatch ? descMatch[1] : null,
            image: imageMatch ? imageMatch[1] : null,
          },
        });

        res.json({ success: true, data: preview });
      } catch (error) {
        next(error);
      }
    }
  );

  // ===== VOICE MESSAGES =====

  // Upload voice message
  router.post('/channels/:id/voice',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_CREATE),
    async (req, res, next) => {
      try {
        const { audioData, duration } = req.body; // base64 audio

        // In production, upload to file storage (MinIO, S3)
        // For now, store metadata only

        const message = await prisma.message.create({
          data: {
            companyId: req.companyId!,
            channelId: req.params.id,
            authorId: req.user!.id,
            senderId: req.user!.id,
            content: '[Voice message]',
            messageType: 'voice',
            metadata: JSON.stringify({
              duration,
              audioUrl: 'temp-url', // Would be MinIO URL
            }),
          },
          include: {
            sender: { select: { id: true, name: true, avatar: true } },
          },
        });

        io.to(`channel:${req.params.id}`).emit('message:new', message);

        res.status(201).json({ success: true, data: message });
      } catch (error) {
        next(error);
      }
    }
  );

  // ===== SCHEDULED MESSAGES =====

  // Schedule message
  router.post('/messages/scheduled',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_CREATE),
    validateBody(scheduledMessageSchema),
    async (req, res, next) => {
      try {
        const scheduled = await prisma.scheduledMessage.create({
          data: {
            ...req.body,
            recurring: req.body.recurring ? JSON.stringify(req.body.recurring) : null,
            companyId: req.companyId!,
            createdById: req.user!.id,
            status: 'pending',
          },
        });

        res.status(201).json({ success: true, data: scheduled });
      } catch (error) {
        next(error);
      }
    }
  );

  // List scheduled messages
  router.get('/messages/scheduled',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    async (req, res, next) => {
      try {
        const { status, channelId } = req.query;

        const where: any = { companyId: req.companyId! };
        if (status) where.status = status;
        if (channelId) where.channelId = channelId;

        const messages = await prisma.scheduledMessage.findMany({
          where,
          orderBy: { scheduledFor: 'asc' },
        });

        res.json({ success: true, data: messages });
      } catch (error) {
        next(error);
      }
    }
  );

  // Cancel scheduled message
  router.delete('/messages/scheduled/:id',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_DELETE),
    async (req, res, next) => {
      try {
        await prisma.scheduledMessage.update({
          where: { id: req.params.id },
          data: { status: 'cancelled' },
        });

        res.json({ success: true, message: 'Scheduled message cancelled' });
      } catch (error) {
        next(error);
      }
    }
  );

  // ===== SLASH COMMANDS & BOTS =====

  // Register slash command
  router.post('/slash-commands',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_UPDATE),
    validateBody(slashCommandSchema),
    async (req, res, next) => {
      try {
        const command = await prisma.slashCommand.create({
          data: {
            ...req.body,
            companyId: req.companyId!,
            createdById: req.user!.id,
          },
        });

        res.status(201).json({ success: true, data: command });
      } catch (error) {
        next(error);
      }
    }
  );

  // List slash commands
  router.get('/slash-commands',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    async (req, res, next) => {
      try {
        const commands = await prisma.slashCommand.findMany({
          where: { companyId: req.companyId! },
          orderBy: { command: 'asc' },
        });

        res.json({ success: true, data: commands });
      } catch (error) {
        next(error);
      }
    }
  );

  // Execute slash command
  router.post('/slash-commands/:command/execute',
    authenticate,
    tenantIsolation,
    async (req, res, next) => {
      try {
        const { channelId, args } = req.body;

        const command = await prisma.slashCommand.findFirst({
          where: {
            command: req.params.command,
            companyId: req.companyId!,
          },
        });

        if (!command) {
          return res.status(404).json({
            success: false,
            error: { message: 'Command not found' },
          });
        }

        // Execute command (simplified - in production use a proper execution engine)
        let response = '';

        switch (command.handler) {
          case 'giphy':
            response = `[GIF: ${args.join(' ')}]`;
            break;
          case 'remind':
            response = `Reminder set for: ${args.join(' ')}`;
            break;
          case 'poll':
            response = `Poll created: ${args.join(' ')}`;
            break;
          default:
            // Webhook handler
            if (command.handler.startsWith('http')) {
              const webhookRes = await fetch(command.handler, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: command.command, args, userId: req.user!.id }),
              });
              const data = await webhookRes.json();
              response = data.response || 'Command executed';
            }
        }

        // Send response message
        const message = await prisma.message.create({
          data: {
            companyId: req.companyId!,
            channelId,
            authorId: req.user!.id,
            senderId: req.user!.id,
            content: response,
            messageType: 'bot',
            metadata: JSON.stringify({
              command: command.command,
              args,
            }),
          },
        });

        io.to(`channel:${channelId}`).emit('message:new', message);

        res.json({ success: true, data: message });
      } catch (error) {
        next(error);
      }
    }
  );

  // Message analytics
  router.get('/channels/:id/analytics',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    async (req, res, next) => {
      try {
        const { startDate, endDate } = req.query;

        const where: any = {
          channelId: req.params.id,
          deleted: false,
        };

        if (startDate || endDate) {
          where.timestamp = {};
          if (startDate) where.timestamp.gte = new Date(startDate as string);
          if (endDate) where.timestamp.lte = new Date(endDate as string);
        }

        const [totalMessages, bySender, byType, avgResponseTime] = await Promise.all([
          prisma.message.count({ where }),
          prisma.message.groupBy({
            by: ['senderId'],
            where,
            _count: true,
          }),
          prisma.message.groupBy({
            by: ['messageType'],
            where,
            _count: true,
          }),
          // Calculate average response time (simplified)
          prisma.message.findMany({
            where,
            orderBy: { timestamp: 'asc' },
            take: 100,
          }),
        ]);

        res.json({
          success: true,
          data: {
            totalMessages,
            bySender,
            byType,
            // avgResponseTime would require more complex calculation
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );
}
