/**
 * CRM - Contacts Churn Prediction Route
 * GET /api/v1/crm/contacts/:id/churn
 * Predict contact churn risk with AI
 */

import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission } from '../../../../core/middleware';

export function setupContactsChurnRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(
    `${baseUrl}/contacts/:id/churn`,
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
        const dealsCount = contact.deals?.length || 0;
        const interactionsCount = contact.interactions?.length || 0;
        const leadScore = contact.leadScore || 0;

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

        // Calculate risk factors
        const noRecentActivity = recentInteractions < 2;
        const dealsStagnant = dealsCount > 0 && leadScore < 30;
        const emailEngagementDrop = interactionsCount === 0;
        const longTimeSinceContact = lastInteraction !== null && lastInteraction > 60;

        const riskFactorsCount = [
          noRecentActivity,
          dealsStagnant,
          emailEngagementDrop,
          longTimeSinceContact,
        ].filter(Boolean).length;

        const churnProbability = Math.min(
          100,
          riskFactorsCount * 25 + (100 - leadScore)
        );

        let churnRisk: 'low' | 'medium' | 'high' | 'critical';
        if (churnProbability >= 75) churnRisk = 'critical';
        else if (churnProbability >= 50) churnRisk = 'high';
        else if (churnProbability >= 25) churnRisk = 'medium';
        else churnRisk = 'low';

        const context = `
Contact Churn Risk Analysis:
- Total Interactions: ${interactionsCount}
- Recent Interactions (30 days): ${recentInteractions}
- Days Since Last Contact: ${lastInteraction || 'Never'}
- Open Deals: ${openDeals}
- Total Deals: ${dealsCount}
- Lead Score: ${leadScore}
- Churn Risk: ${churnRisk} (${churnProbability}%)

Generate 3-5 specific prevention actions in Portuguese.
`;

        const preventionActions = await aiService.generateSuggestions(
          context,
          'churn prevention actions (in Portuguese)'
        );

        const actionsList = preventionActions
          .split(/\n/)
          .filter((s) => s.trim().length > 0)
          .slice(0, 5);

        res.json({
          success: true,
          data: {
            contactId: req.params.id,
            companyId: contact.companyId,
            churnRisk,
            churnProbability,
            predictedChurnDate:
              churnProbability > 50
                ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                : undefined,
            factors: {
              noRecentActivity,
              dealsStagnant,
              emailEngagementDrop,
              competitorMentions: false,
              contractExpiringSoon: false,
            },
            preventionActions: actionsList,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );
}
