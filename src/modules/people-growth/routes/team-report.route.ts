import { Express, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';
import { peopleGrowthService } from '../service';

export function setupPeopleGrowthTeamReportRoute(app: Express, _prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/team/report`, authenticate, tenantIsolation, async (req: Request, res: Response) => {
    try {
      const { role, companyId } = (req as any).user;

      if (role !== 'company_admin' && role !== 'supervisor') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const report = await peopleGrowthService.getTeamGapsReport(companyId);

      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to generate report' });
    }
  });
}
