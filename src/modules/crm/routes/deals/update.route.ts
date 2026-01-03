/**
 * CRM - Deals Update Route
 * PUT /api/v1/crm/deals/:id
 * Update an existing deal
 */

import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission, validateBody } from '../../../../core/middleware';
import { updateDealSchema } from '../../schemas/deal.schema';
import { auditLogger } from '../../../../core/audit/audit-logger';
import { successResponse, notFoundResponse } from '../../../../core/utils/api-response';

export function setupDealsUpdateRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.put(
    `${baseUrl}/deals/:id`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_CREATE),
    validateBody(updateDealSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const validatedData = req.body; // Already validated by schema

        // 1. Verify ownership (tenant isolation)
        const deal = await prisma.deal.findFirst({
          where: { id: req.params.id, companyId: req.companyId! },
        });

        if (!deal) {
          return notFoundResponse(res, 'Deal não encontrado');
        }

        // Resolve stage if stageId is provided
        let resolvedPipelineId = validatedData.pipelineId;
        let resolvedStageId = validatedData.stageId;
        let resolvedStageString = validatedData.stage || deal.stage;
        let closedDate = deal.closedDate;

        if (validatedData.stageId) {
          const stage = await prisma.crmStage.findFirst({
            where: { id: validatedData.stageId },
            include: { pipeline: true },
          });

          if (!stage || stage.pipeline.companyId !== req.companyId!) {
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

        // 2. Update with validated data only
        const updated = await prisma.deal.update({
          where: { id: req.params.id },
          data: {
            title: validatedData.title,
            contactId: validatedData.contactId,
            value: validatedData.value,
            currency: validatedData.currency,
            expectedCloseDate: validatedData.expectedCloseDate,
            probability: validatedData.probability,
            notes: validatedData.notes,
            customFields: validatedData.customFields,
            pipelineId: resolvedPipelineId,
            stageId: resolvedStageId,
            stage: resolvedStageString,
            closedDate,
            updatedAt: new Date(),
          },
          include: {
            products: true,
            pipeline: true,
            stageRef: true,
            contact: true,
            owner: true,
          },
        });

        // Audit log the update
        await auditLogger.log({
          action: 'deal.update',
          userId: req.user!.id,
          companyId: req.companyId!,
          resourceType: 'deal',
          resourceId: updated.id,
          details: {
            dealTitle: updated.title,
            changes: validatedData,
          },
        });

        return successResponse(res, updated, {
          requestId: req.id,
        });
      } catch (error) {
        next(error);
      }
    }
  );
}
