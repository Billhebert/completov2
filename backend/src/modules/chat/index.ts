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

  // ============================================
  // INTELLIGENT CHAT (AI-Powered)
  // ============================================

  // AI-powered message sentiment analysis
  app.get(`${base}/messages/:id/sentiment`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const message = await prisma.message.findFirst({
        where: { id: req.params.id, companyId: req.companyId! },
        include: { author: { select: { name: true } } },
      });

      if (!message) {
        return res.status(404).json({ success: false, error: { message: 'Message not found' } });
      }

      const { getAIService } = await import('../../core/ai/ai.service');
      const aiService = getAIService(prisma);

      const sentiment = await aiService.analyzeSentiment(message.content);

      res.json({
        success: true,
        data: {
          sentiment: sentiment.sentiment,
          score: sentiment.score,
          message: message.content,
          author: message.author.name,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  // AI-powered conversation sentiment analysis (entire channel)
  app.get(`${base}/channels/:channelId/sentiment`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const messages = await prisma.message.findMany({
        where: {
          channelId: req.params.channelId,
          companyId: req.companyId!,
          deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { author: { select: { id: true, name: true } } },
      });

      if (messages.length === 0) {
        return res.json({
          success: true,
          data: {
            overallSentiment: 'neutral',
            averageScore: 0.5,
            messageCount: 0,
          },
        });
      }

      const { getAIService } = await import('../../core/ai/ai.service');
      const aiService = getAIService(prisma);

      // Analyze sentiment for recent messages
      const recentMessages = messages.slice(0, 10);
      const sentiments = await Promise.all(
        recentMessages.map(m => aiService.analyzeSentiment(m.content).catch(() => ({ sentiment: 'neutral', score: 0.5 })))
      );

      const avgScore = sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length;
      const positiveCount = sentiments.filter(s => s.sentiment === 'positive').length;
      const negativeCount = sentiments.filter(s => s.sentiment === 'negative').length;

      const overallSentiment =
        positiveCount > negativeCount * 2 ? 'positive' :
        negativeCount > positiveCount * 2 ? 'negative' : 'neutral';

      res.json({
        success: true,
        data: {
          overallSentiment,
          averageScore: avgScore,
          messageCount: messages.length,
          distribution: {
            positive: positiveCount,
            neutral: sentiments.length - positiveCount - negativeCount,
            negative: negativeCount,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  });

  // AI-powered smart reply suggestions
  app.post(`${base}/messages/:id/suggest-reply`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      // Get the message and recent conversation history
      const message = await prisma.message.findFirst({
        where: { id: req.params.id, companyId: req.companyId! },
        include: { author: { select: { name: true } } },
      });

      if (!message) {
        return res.status(404).json({ success: false, error: { message: 'Message not found' } });
      }

      // Get recent messages for context
      const recentMessages = await prisma.message.findMany({
        where: {
          channelId: message.channelId!,
          companyId: req.companyId!,
          deletedAt: null,
          createdAt: { lte: message.createdAt },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { author: { select: { name: true } } },
      });

      const { getAIService } = await import('../../core/ai/ai.service');
      const aiService = getAIService(prisma);

      // Build context from conversation history
      const conversationContext = recentMessages
        .reverse()
        .map(m => `${m.author.name}: ${m.content}`)
        .join('\n');

      const context = `
        Conversation history:
        ${conversationContext}

        Generate 3 different suggested replies to the last message in Portuguese (pt-BR).
        Make them professional, helpful, and contextually appropriate.

        Format: Return each suggestion on a new line, numbered 1-3.
      `;

      const suggestions = await aiService.generateSuggestions(
        context,
        'reply suggestions in Portuguese'
      );

      const replySuggestions = suggestions
        .split(/\n/)
        .filter(s => s.trim().length > 0)
        .map(s => s.replace(/^\d+[\.\)]\s*/, '').trim())
        .filter(s => s.length > 0)
        .slice(0, 3);

      res.json({
        success: true,
        data: {
          originalMessage: message.content,
          suggestions: replySuggestions,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  // AI-powered conversation summary
  app.get(`${base}/channels/:channelId/summary`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;

      const messages = await prisma.message.findMany({
        where: {
          channelId: req.params.channelId,
          companyId: req.companyId!,
          deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { author: { select: { name: true } } },
      });

      if (messages.length === 0) {
        return res.json({
          success: true,
          data: { summary: 'Nenhuma mensagem neste canal' },
        });
      }

      const { getAIService } = await import('../../core/ai/ai.service');
      const aiService = getAIService(prisma);

      // Build conversation text
      const conversationText = messages
        .reverse()
        .map(m => `${m.author.name}: ${m.content}`)
        .join('\n');

      const context = `
        Conversation (${messages.length} messages):
        ${conversationText.substring(0, 3000)}

        Create a concise summary of this conversation in Portuguese (pt-BR).
        Include:
        - Main topics discussed
        - Key decisions or action items
        - Overall tone/sentiment
      `;

      const summary = await aiService.summarize(context, 300);

      res.json({
        success: true,
        data: {
          summary,
          messageCount: messages.length,
          participants: Array.from(new Set(messages.map(m => m.author.name))),
        },
      });
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
