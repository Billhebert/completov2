/**
 * CRM - Deals Create Route
 * POST /api/v1/crm/deals
 * Create a new deal
 */

import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission, validateBody } from '../../../../core/middleware';
import { EventBus, Events } from '../../../../core/event-bus';
import { z } from 'zod';

// Deal validation schema
const dealSchema = z.object({
  title: z.string().min(1),
  contactId: z.string().uuid(),
  value: z.number().nonnegative(),
  currency: z.string().default('BRL'),
  stage: z.string().optional(),
  expectedCloseDate: z.string().optional(),
  ownerId: z.string().optional(),
  pipelineId: z.string().uuid().optional(),
  stageId: z.string().uuid().optional(),
  products: z
    .array(
      z.object({
        productId: z.string(),
        productName: z.string(),
        quantity: z.number().positive(),
        unitPrice: z.number(),
      })
    )
    .optional(),
});

export function setupDealsCreateRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string,
  eventBus: EventBus
) {
  app.post(
    `${baseUrl}/deals`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_CREATE),
    validateBody(dealSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const tenantCompanyId = req.companyId!;

        // Verify tenant company exists
        const tenant = await prisma.company.findUnique({
          where: { id: tenantCompanyId },
          select: { id: true, name: true },
        });

        if (!tenant) {
          return res.status(400).json({
            success: false,
            code: 'TENANT_COMPANY_NOT_FOUND',
            message:
              'Seu tenant (companies) não existe no banco. Crie/seed uma Company com esse companyId antes de criar Deals.',
            details: {
              companyId: tenantCompanyId,
              hint: 'Rode: SELECT id,name,domain FROM companies WHERE id = \'<companyId>\';',
            },
          });
        }

        const { products, pipelineId, stageId, ...dealData } = req.body as any;

        // Resolve stage if stageId is provided
        let resolvedPipelineId: string | undefined = pipelineId;
        let resolvedStageId: string | undefined = stageId;
        let resolvedStageString: string =
          typeof dealData.stage === 'string' && dealData.stage.trim().length
            ? dealData.stage
            : 'open';
        let closedDate: Date | null = null;

        if (stageId) {
          const stage = await prisma.crmStage.findFirst({
            where: { id: stageId },
            include: { pipeline: true },
          });

          if (!stage || stage.pipeline.companyId !== tenantCompanyId) {
            return res
              .status(404)
              .json({ success: false, message: 'Stage inválido' });
          }

          resolvedPipelineId = stage.pipelineId;
          resolvedStageId = stage.id;
          resolvedStageString = stage.isWon
            ? 'won'
            : stage.isLost
            ? 'lost'
            : 'open';
          closedDate = stage.isWon || stage.isLost ? new Date() : null;
        }

        // Create deal
        const created = await prisma.deal.create({
          data: {
            ...dealData,
            companyId: tenantCompanyId,
            ownerId: dealData.ownerId || req.user!.id,
            pipelineId: resolvedPipelineId,
            stageId: resolvedStageId,
            stage: resolvedStageString,
            closedDate,
            products: products
              ? {
                  create: products.map((p: any) => ({
                    ...p,
                    total: p.quantity * p.unitPrice,
                  })),
                }
              : undefined,
          },
          include: {
            products: true,
            pipeline: true,
            stageRef: true,
          },
        });

        // Publish event
        await eventBus.publish(Events.DEAL_CREATED, {
          type: Events.DEAL_CREATED,
          version: 'v1',
          timestamp: new Date(),
          companyId: tenantCompanyId,
          userId: req.user!.id,
          data: {
            dealId: created.id,
            title: created.title,
            value: created.value,
          },
        });

        return res.status(201).json({ success: true, data: created });
      } catch (error) {
        next(error);
      }
    }
  );
}
