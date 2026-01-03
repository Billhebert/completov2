import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../core/middleware';
import { logger } from '../../../core/logger';

export function setupAutomationsSuggestionsRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/suggestions`, authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyId } = (req as any).user!;

      // Get company activity data
      const [dealCount, contactCount, messageCount, interactionCount] = await Promise.all([
        prisma.deal.count({ where: { companyId } }),
        prisma.contact.count({ where: { companyId } }),
        prisma.message.count({ where: { companyId } }),
        prisma.interaction.count({ where: { companyId } })
      ]);

      // Get existing workflows to avoid duplicates
      const existingWorkflows = await prisma.workflow.findMany({
        where: { companyId },
        select: { name: true, description: true }
      });

      const { getAIService } = await import('../../../core/ai/ai.service');
      const aiService = getAIService(prisma);

      const context = `
      Company Activity:
      - Deals: ${dealCount}
      - Contacts: ${contactCount}
      - Messages: ${messageCount}
      - Interactions: ${interactionCount}

      Existing Workflows:
      ${existingWorkflows.map(w => `- ${w.name}: ${w.description || 'No description'}`).join('\n')}

      Suggest 3-5 workflow automations that would benefit this company in Portuguese (pt-BR).
      For each suggestion, include:
      - Nome do workflow
      - Descrição (1-2 linhas)
      - Benefício esperado
    `;

      const suggestions = await aiService.generateSuggestions(
        context,
        'workflow automation ideas'
      );

      const workflowSuggestions = suggestions
        .split(/\n\n/)
        .filter(s => s.trim().length > 0)
        .slice(0, 5);

      res.json({
        success: true,
        data: {
          suggestions: workflowSuggestions,
          basedOn: {
            dealCount,
            contactCount,
            messageCount,
            interactionCount,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  });
}
