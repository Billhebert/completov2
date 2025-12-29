// src/modules/chat/index.ts
import { ModuleDefinition } from '../../core/types';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { Server as SocketIOServer } from 'socket.io';
import { EventBus } from '../../core/event-bus';
import { authenticate, tenantIsolation, validateBody } from '../../core/middleware';
import { setupChatSockets } from './sockets';
import { z } from 'zod';

const sendMessageSchema = z.object({
  channelId: z.string().optional(),
  recipientId: z.string().optional(),
  content: z.string().min(1),
});

function setupRoutes(app: Express, prisma: PrismaClient) {
  const base = '/api/v1/chat';

  app.get(`${base}/channels`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const channels = await prisma.channel.findMany({
        where: { companyId: req.companyId! },
        include: { _count: { select: { members: true } } },
      });
      res.json({ success: true, data: channels });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${base}/channels`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const channel = await prisma.channel.create({
        data: {
          companyId: req.companyId!,
          name: req.body.name,
          description: req.body.description,
          type: req.body.type || 'public',
          createdBy: req.user!.id,
        },
      });
      res.status(201).json({ success: true, data: channel });
    } catch (error) {
      next(error);
    }
  });

  app.get(`${base}/channels/:channelId/messages`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const messages = await prisma.message.findMany({
        where: { 
          channelId: req.params.channelId, 
          companyId: req.companyId!,
          deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(req.query.limit as string) || 100,
        include: { 
          author: { select: { id: true, name: true, email: true } },
          reactions: {
            include: { user: { select: { id: true, name: true } } },
          },
        },
      });
      res.json({ success: true, data: messages });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${base}/messages`, authenticate, tenantIsolation, validateBody(sendMessageSchema), async (req, res, next) => {
    try {
      const message = await prisma.message.create({
        data: {
          companyId: req.companyId!,
          channelId: req.body.channelId,
          authorId: req.user!.id,
          content: req.body.content,
          status: 'sent',
        },
        include: { author: { select: { id: true, name: true, email: true } } },
      });
      res.status(201).json({ success: true, data: message });
    } catch (error) {
      next(error);
    }
  });
}

export const chatModule: ModuleDefinition = {
  name: 'chat',
  version: '1.0.0',
  provides: ['chat', 'realtime'],
  routes: (ctx) => setupRoutes(ctx.app, ctx.prisma),
  sockets: (ctx) => {
    if (ctx.io) {
      setupChatSockets(ctx.io, ctx.prisma, ctx.eventBus);
    }
  },
};
