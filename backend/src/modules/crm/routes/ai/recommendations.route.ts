/**
 * CRM - AI Recommendations Route
 * GET /api/v1/crm/:entityType/:id/recommendations
 * Get AI-powered recommendations for contacts or deals
 */

import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission } from '../../../../core/middleware';

export function setupAIRecommendationsRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(
    `${baseUrl}/:entityType/:id/recommendations`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_READ),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { entityType, id } = req.params;

        if (!['contacts', 'deals'].includes(entityType)) {
          return res.status(400).json({
            success: false,
            error: { message: 'Invalid entity type. Use \'contacts\' or \'deals\'' },
          });
        }

        const { getAIService } = await import('../../../../core/ai/ai.service');
        const aiService = getAIService(prisma);

        let entity: any;
        let recommendations: any[] = [];

        if (entityType === 'contacts') {
          entity = await prisma.contact.findFirst({
            where: { id, companyId: req.companyId! },
            include: {
              deals: true,
              interactions: { orderBy: { timestamp: 'desc' }, take: 10 },
            },
          });

          if (!entity) {
            return res.status(404).json({
              success: false,
              error: { message: 'Contact not found' },
            });
          }

          const dealsCount = entity.deals?.length || 0;
          const interactionsCount = entity.interactions?.length || 0;

          if (interactionsCount === 0) {
            recommendations.push({
              id: `rec-${Date.now()}-1`,
              type: 'next_action',
              priority: 'high',
              title: 'Iniciar primeiro contato',
              description: 'Este contato ainda não tem interações registradas',
              reasoning: 'Contatos sem interações tendem a esfriar rapidamente',
              suggestedActions: [
                'Enviar email de apresentação personalizado',
                'Conectar no LinkedIn',
                'Agendar discovery call',
              ],
              relatedEntityType: 'contact',
              relatedEntityId: id,
              createdAt: new Date().toISOString(),
              status: 'pending',
            });
          }

          if (dealsCount === 0 && interactionsCount > 2) {
            recommendations.push({
              id: `rec-${Date.now()}-2`,
              type: 'deal_strategy',
              priority: 'medium',
              title: 'Criar deal para este contato',
              description: 'Contato engajado sem deal associado',
              reasoning:
                'Múltiplas interações indicam interesse, mas falta deal formal',
              suggestedActions: [
                'Qualificar necessidades em próxima reunião',
                'Criar deal exploratory',
                'Enviar proposta inicial',
              ],
              relatedEntityType: 'contact',
              relatedEntityId: id,
              createdAt: new Date().toISOString(),
              status: 'pending',
            });
          }
        } else if (entityType === 'deals') {
          entity = await prisma.deal.findFirst({
            where: { id, companyId: req.companyId! },
            include: {
              contact: true,
              interactions: { orderBy: { timestamp: 'desc' }, take: 10 },
            },
          });

          if (!entity) {
            return res.status(404).json({
              success: false,
              error: { message: 'Deal not found' },
            });
          }

          if (entity.probability && entity.probability < 30) {
            recommendations.push({
              id: `rec-${Date.now()}-3`,
              type: 'risk_mitigation',
              priority: 'critical',
              title: 'Deal com baixa probabilidade',
              description: `Probabilidade atual: ${entity.probability}%`,
              reasoning:
                'Deals abaixo de 30% raramente convertem sem ação imediata',
              suggestedActions: [
                'Identificar objeções principais',
                'Agendar reunião com decisor',
                'Revisar proposta de valor',
                'Considerar ajuste de preço/escopo',
              ],
              relatedEntityType: 'deal',
              relatedEntityId: id,
              createdAt: new Date().toISOString(),
              status: 'pending',
            });
          }

          if (entity.createdAt) {
            const daysSinceCreation = Math.floor(
              (Date.now() - new Date(entity.createdAt).getTime()) /
                (1000 * 60 * 60 * 24)
            );

            if (
              daysSinceCreation > 60 &&
              entity.stage !== 'won' &&
              entity.stage !== 'lost'
            ) {
              recommendations.push({
                id: `rec-${Date.now()}-4`,
                type: 'deal_strategy',
                priority: 'high',
                title: 'Deal parado há muito tempo',
                description: `${daysSinceCreation} dias sem progresso significativo`,
                reasoning:
                  'Deals que permanecem no mesmo estágio por mais de 60 dias raramente fecham',
                suggestedActions: [
                  'Reagendar reunião de revisão',
                  'Requalificar necessidade e urgência',
                  'Considerar re-engajamento do champion',
                  'Avaliar se vale manter ativo',
                ],
                relatedEntityType: 'deal',
                relatedEntityId: id,
                createdAt: new Date().toISOString(),
                status: 'pending',
              });
            }
          }
        }

        res.json({ success: true, data: recommendations });
      } catch (error) {
        next(error);
      }
    }
  );
}
