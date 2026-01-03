import { Express, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

const prisma = new PrismaClient();

export function setupPeopleGrowthTeamHeatmapRoute(app: Express, _prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/team/heatmap`, authenticate, tenantIsolation, async (req: Request, res: Response) => {
    try {
      const { role, companyId } = (req as any).user;

      if (role !== 'company_admin' && role !== 'supervisor') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const gaps = await prisma.employeeGap.findMany({
        where: {
          companyId,
          status: { in: ['OPEN', 'IN_PROGRESS'] }
        },
        include: {
          employee: {
            select: { id: true, name: true }
          }
        }
      });

      const heatmap: any = {};

      gaps.forEach(gap => {
        const empId = gap.employeeId;
        if (!heatmap[empId]) {
          heatmap[empId] = {
            employee: gap.employee,
            domains: {}
          };
        }

        if (!heatmap[empId].domains[gap.domain]) {
          heatmap[empId].domains[gap.domain] = 0;
        }

        heatmap[empId].domains[gap.domain]++;
      });

      res.json({ data: Object.values(heatmap) });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to generate heatmap' });
    }
  });
}
