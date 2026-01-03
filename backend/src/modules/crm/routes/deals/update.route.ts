/**
 * CRM - Deals Update Route
 * PUT /api/v1/crm/deals/:id
 * Update an existing deal
 */

import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission } from '../../../../core/middleware';

export function setupDealsUpdateRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.put(
    `${baseUrl}/deals/:id`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_CREATE),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const deal = await prisma.deal.findFirst({
          where: { id: req.params.id, companyId: req.companyId! },
        });

        if (!deal) {
          return res
            .status(404)
            .json({ success: false, message: 'Deal não encontrado' });
        }

        const { products, pipelineId, stageId, ...updateData } = req.body;

        // Resolve stage if stageId is provided
        let resolvedPipelineId = pipelineId;
        let resolvedStageId = stageId;
        let resolvedStageString = updateData.stage || deal.stage;
        let closedDate = deal.closedDate;

        if (stageId) {
          const stage = await prisma.crmStage.findFirst({
            where: { id: stageId },
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

        const updated = await prisma.deal.update({
          where: { id: req.params.id },
          data: {
            ...updateData,
            pipelineId: resolvedPipelineId,
            stageId: resolvedStageId,
            stage: resolvedStageString,
            closedDate,
          },
          include: {
            products: true,
            pipeline: true,
            stageRef: true,
            contact: true,
            owner: true,
          },
        });

        res.json({ success: true, data: updated });
      } catch (error) {
        next(error);
      }
    }
  );
}
