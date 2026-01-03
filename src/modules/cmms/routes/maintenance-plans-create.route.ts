import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';
import { requirePermission } from '../../rbac/middleware';

export function setupMaintenancePlansCreateRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  app.post(
    `${baseUrl}/maintenance-plans`,
    authenticate,
    tenantIsolation,
    requirePermission('maintenance', 'create'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { assetId, name, description, type, frequency, tasks, estimatedDuration, assignedToId, priority } = req.body;
        
        const plan = await prisma.assetMaintenancePlan.create({
          data: {
            companyId: req.companyId!,
            assetId,
            name,
            description,
            type,
            frequency,
            tasks,
            estimatedDuration,
            assignedToId,
            priority: priority || 'medium',
            createdBy: req.user!.id,
          },
        });
        res.json({ success: true, data: plan });
      } catch (error) {
        next(error);
      }
    }
  );
}
