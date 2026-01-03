/**
 * CRM - Contacts Engagement Route
 * GET /api/v1/crm/contacts/:id/engagement
 * Calculate contact engagement score with AI
 */

import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission } from '../../../../core/middleware';

export function setupContactsEngagementRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(
    `${baseUrl}/contacts/:id/engagement`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_READ),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const contact = await prisma.contact.findFirst({
          where: { id: req.params.id, companyId: req.companyId! },
          include: {
            deals: true,
            interactions: { orderBy: { timestamp: 'desc' }, take: 20 },
          },
        });

        if (!contact) {
          return res
            .status(404)
            .json({ success: false, error: { message: 'Contact not found' } });
        }

        const { getAIService } = await import('../../../../core/ai/ai.service');
        const aiService = getAIService(prisma);

        const now = Date.now();
        const recentInteractions =
          contact.interactions?.filter(
            (i) =>
              now - new Date(i.timestamp).getTime() < 30 * 24 * 60 * 60 * 1000
          ).length || 0;

        const lastInteraction = contact.interactions?.[0]?.timestamp
          ? Math.floor(
              (now - new Date(contact.interactions[0].timestamp).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : null;

        const openDeals =
          contact.deals?.filter((d) => !['won', 'lost'].includes(d.stage))
            .length || 0;
        const totalDeals = contact.deals?.length || 0;

        const context = `
Contact Engagement Analysis:
- Total Interactions: ${contact.interactions?.length || 0}
- Recent Interactions (30 days): ${recentInteractions}
- Days Since Last Contact: ${lastInteraction || 'Never contacted'}
- Open Deals: ${openDeals}
- Total Deals: ${totalDeals}
- Lead Status: ${contact.leadStatus}
- Tags: ${contact.tags?.join(', ') || 'none'}

Return only a number between 0 and 100.
`;

        const result = await aiService.complete({
          prompt: context,
          systemMessage:
            'You are an engagement analysis expert. Return only a number between 0 and 100.',
          temperature: 0.3,
        });

        const engagementScore = Math.max(
          0,
          Math.min(100, parseFloat(result.content.match(/\d+/)?.[0] || '50'))
        );

        const nextActionsContext = `
Contact with ${engagementScore}% engagement.
Last contact: ${lastInteraction ? lastInteraction + ' days ago' : 'Never'}
Open deals: ${openDeals}

Suggest the best next action (Portuguese).
`;

        const nextAction = await aiService.summarize(nextActionsContext, 150);

        res.json({
          success: true,
          data: {
            engagementScore,
            level:
              engagementScore >= 70
                ? 'high'
                : engagementScore >= 40
                ? 'medium'
                : 'low',
            metrics: {
              totalInteractions: contact.interactions?.length || 0,
              recentInteractions,
              daysSinceLastContact: lastInteraction,
              openDeals,
              totalDeals,
            },
            nextAction,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );
}
