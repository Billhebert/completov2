import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupChatSuggestReplyRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}/messages/:id/suggest-reply`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const message = await prisma.message.findFirst({
        where: { id: req.params.id, companyId: req.companyId! },
        include: { author: { select: { name: true } } },
      });

      if (!message) {
        return res.status(404).json({ success: false, error: { message: 'Message not found' } });
      }

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

      const { getAIService } = await import('../../../core/ai/ai.service');
      const aiService = getAIService(prisma);

      const conversationContext = recentMessages
        .reverse()
        .map(m => `${m.author.name}: ${m.content}`)
        .join('\n');

      const context = `Conversation history:\n${conversationContext}\n\nGenerate 3 different suggested replies to the last message in Portuguese (pt-BR).\nMake them professional, helpful, and contextually appropriate.\n\nFormat: Return each suggestion on a new line, numbered 1-3.`;

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
}
