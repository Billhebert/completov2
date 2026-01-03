/**
 * CRM - Deals Create Route
 * POST /api/v1/crm/deals
 * Create a new deal
 */

import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission, validateBody } from '../../../../core/middleware';
import { EventBus, Events } from '../../../../core/event-bus';
import { createDealSchema } from '../../schemas/deal.schema';
import { auditLogger } from '../../../../core/audit/audit-logger';
import { successResponse } from '../../../../core/utils/api-response';

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
    validateBody(createDealSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const tenantCompanyId = req.companyId!;
        const validatedData = req.body; // Already validated by schema

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

        // Resolve stage if stageId is provided
        let resolvedPipelineId: string | undefined = validatedData.pipelineId;
        let resolvedStageId: string | undefined = validatedData.stageId;
        let resolvedStageString: string = validatedData.stage || 'lead';
        let closedDate: Date | null = null;

        if (validatedData.stageId) {
          const stage = await prisma.crmStage.findFirst({
            where: { id: validatedData.stageId },
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

        // Create deal with only validated fields
        const created = await prisma.deal.create({
          data: {
            title: validatedData.title,
            contactId: validatedData.contactId,
            value: validatedData.value,
            currency: validatedData.currency || 'BRL',
            expectedCloseDate: validatedData.expectedCloseDate,
            probability: validatedData.probability,
            notes: validatedData.notes,
            customFields: validatedData.customFields,
            companyId: tenantCompanyId,
            ownerId: req.user!.id,
            pipelineId: resolvedPipelineId,
            stageId: resolvedStageId,
            stage: resolvedStageString,
            closedDate,
            products: validatedData.products
              ? {
                  create: validatedData.products.map((p) => ({
                    productId: p.productId,
                    productName: p.productName,
                    quantity: p.quantity,
                    unitPrice: p.unitPrice,
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

        // Audit log the creation
        await auditLogger.log({
          action: 'deal.create',
          userId: req.user!.id,
          companyId: tenantCompanyId,
          resourceType: 'deal',
          resourceId: created.id,
          details: {
            dealTitle: created.title,
            dealValue: created.value,
            dealStage: created.stage,
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

        return successResponse(res, created, {
          statusCode: 201,
          requestId: req.id,
        });
      } catch (error) {
        next(error);
      }
    }
  );
}
