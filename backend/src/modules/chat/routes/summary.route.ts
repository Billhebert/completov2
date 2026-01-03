import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupChatSummaryRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/channels/:channelId/summary`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
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

      const { getAIService } = await import('../../../core/ai/ai.service');
      const aiService = getAIService(prisma);

      const conversationText = messages
        .reverse()
        .map(m => `${m.author.name}: ${m.content}`)
        .join('\n');

      const truncatedText = conversationText.substring(0, 3000);
      const context = `Conversation (${messages.length} messages):\n${truncatedText}\n\nCreate a concise summary of this conversation in Portuguese (pt-BR).\nInclude:\n- Main topics discussed\n- Key decisions or action items\n- Overall tone/sentiment`;

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
