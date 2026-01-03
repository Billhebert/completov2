import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';
import { requirePermission } from '../../rbac/middleware';

export function setupMaintenanceRecordsCreateRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  app.post(
    `${baseUrl}/maintenance-records`,
    authenticate,
    tenantIsolation,
    requirePermission('maintenance', 'create'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { assetId, planId, type, title, description, performedBy, startTime, endTime, partsUsed, laborCost, partsCost, outcome, notes } = req.body;
        
        const duration = endTime ? Math.floor((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000) : null;
        const totalCost = (laborCost || 0) + (partsCost || 0);
        
        const record = await prisma.maintenanceRecord.create({
          data: {
            companyId: req.companyId!,
            assetId,
            planId,
            type,
            title,
            description,
            performedBy,
            startTime: new Date(startTime),
            endTime: endTime ? new Date(endTime) : null,
            duration,
            partsUsed,
            laborCost,
            partsCost,
            totalCost,
            outcome,
            notes,
            createdBy: req.user!.id,
          },
        });
        
        if (planId) {
          await prisma.assetMaintenancePlan.update({
            where: { id: planId },
            data: { lastPerformed: new Date(startTime) },
          });
        }
        
        res.json({ success: true, data: record });
      } catch (error) {
        next(error);
      }
    }
  );
}
