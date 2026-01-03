import { Express, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

const prisma = new PrismaClient();

export function setupPeopleGrowthGapsListRoute(app: Express, _prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/gaps`, authenticate, tenantIsolation, async (req: Request, res: Response) => {
    try {
      const { id: userId, role, companyId } = (req as any).user;
      const { employeeId, domain, severity, status } = req.query;

      const where: any = { companyId };

      if (role !== 'company_admin' && role !== 'supervisor') {
        where.employeeId = userId;
      } else if (employeeId) {
        where.employeeId = employeeId;
      }

      if (domain) where.domain = domain;
      if (severity) where.severity = severity;
      if (status) where.status = status;

      const gaps = await prisma.employeeGap.findMany({
        where,
        include: {
          employee: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: [
          { severity: 'desc' },
          { createdAt: 'desc' }
        ]
      });

      res.json({ data: gaps });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch gaps' });
    }
  });
}
