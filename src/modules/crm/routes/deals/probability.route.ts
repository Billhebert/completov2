/**
 * CRM - Deals Probability Route (AI)
 * GET /api/v1/crm/deals/:id/probability
 * Calculate deal closure probability using AI
 */

import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission } from '../../../../core/middleware';

export function setupDealsProbabilityRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(
    `${baseUrl}/deals/:id/probability`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_READ),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const deal = await prisma.deal.findFirst({
          where: { id: req.params.id, companyId: req.companyId! },
          include: {
            contact: true,
            products: true,
            interactions: {
              where: { dealId: req.params.id },
              orderBy: { timestamp: 'desc' },
              take: 10,
            },
          },
        });

        if (!deal) {
          return res
            .status(404)
            .json({ success: false, error: { message: 'Deal not found' } });
        }

        const { getAIService } = await import('../../../../core/ai/ai.service');
        const aiService = getAIService(prisma);

        const context = `
Deal Analysis:
- Stage: ${deal.stage}
- Value: ${deal.value} ${deal.currency}
- Age: ${Math.floor(
          (Date.now() - deal.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        )} days
- Expected Close Date: ${deal.expectedCloseDate || 'Not set'}
- Number of Interactions: ${deal.interactions?.length || 0}
- Last Interaction: ${
          deal.interactions?.[0]?.timestamp
            ? Math.floor(
                (Date.now() -
                  new Date(deal.interactions[0].timestamp).getTime()) /
                  (1000 * 60 * 60 * 24)
              ) + ' days ago'
            : 'No interactions'
        }
- Contact Engagement: ${deal.contact?.leadStatus || 'unknown'}
- Products: ${deal.products?.length || 0} items

Based on this information, estimate the probability (0-100%) that this deal will close successfully.
Return only a number between 0 and 100.
`;

        const result = await aiService.complete({
          prompt: context,
          systemMessage:
            'You are a sales analytics expert. Return only a number between 0 and 100 representing the probability percentage.',
          temperature: 0.3,
        });

        const probability = Math.max(
          0,
          Math.min(100, parseFloat(result.content.match(/\d+/)?.[0] || '50'))
        );

        const suggestionsContext = `
Deal at ${probability}% probability.
Stage: ${deal.stage}
Last contact: ${
          deal.interactions?.[0]?.timestamp
            ? Math.floor(
                (Date.now() -
                  new Date(deal.interactions[0].timestamp).getTime()) /
                  (1000 * 60 * 60 * 24)
              ) + ' days ago'
            : 'Never'
        }
Suggest 3 specific actions to increase probability. (Portuguese)
`;

        const suggestions = await aiService.generateSuggestions(
          suggestionsContext,
          'actions to increase deal probability (in Portuguese)'
        );

        const actionsList = suggestions
          .split(/\n/)
          .filter((s) => s.trim().length > 0)
          .slice(0, 3);

        res.json({
          success: true,
          data: {
            probability,
            confidence: result.provider === 'openai' ? 'high' : 'medium',
            riskLevel:
              probability < 30 ? 'high' : probability < 60 ? 'medium' : 'low',
            suggestedActions: actionsList,
            analysis: {
              dealAge: Math.floor(
                (Date.now() - deal.createdAt.getTime()) / (1000 * 60 * 60 * 24)
              ),
              interactionCount: deal.interactions?.length || 0,
              daysSinceLastContact: deal.interactions?.[0]?.timestamp
                ? Math.floor(
                    (Date.now() -
                      new Date(deal.interactions[0].timestamp).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                : null,
            },
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );
}
