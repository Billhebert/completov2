/**
 * CRM - Deals Move Stage Route
 * PATCH /api/v1/crm/deals/:id/stage
 * Move deal to a different stage in the pipeline
 */

import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission, validateBody } from '../../../../core/middleware';
import { z } from 'zod';

// Move deal schema
const moveDealSchema = z.object({
  stageId: z.string().uuid(),
});

export function setupDealsMoveStageRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.patch(
    `${baseUrl}/deals/:id/stage`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_CREATE),
    validateBody(moveDealSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const companyId = req.companyId!;
        const dealId = req.params.id;
        const { stageId } = req.body;

        const deal = await prisma.deal.findFirst({
          where: { id: dealId, companyId },
        });

        if (!deal) {
          return res
            .status(404)
            .json({ success: false, message: 'Deal não encontrado' });
        }

        const stage = await prisma.crmStage.findFirst({
          where: { id: stageId },
          include: { pipeline: true },
        });

        if (!stage || stage.pipeline.companyId !== companyId) {
          return res
            .status(404)
            .json({ success: false, message: 'Stage inválido' });
        }

        const updated = await prisma.deal.update({
          where: { id: dealId },
          data: {
            pipelineId: stage.pipelineId,
            stageId: stage.id,
            stage: stage.isWon ? 'won' : stage.isLost ? 'lost' : 'open',
            closedDate: stage.isWon || stage.isLost ? new Date() : null,
          },
          include: { pipeline: true, stageRef: true },
        });

        res.json({ success: true, data: updated });
      } catch (error) {
        next(error);
      }
    }
  );
}
