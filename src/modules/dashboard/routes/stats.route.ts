import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupDashboardStatsRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/stats`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyId!;

      // Helper function to safely count with fallback
      const safeCount = async (fn: () => Promise<number>): Promise<number> => {
        try {
          return await fn();
        } catch (error) {
          console.warn('Dashboard stats count failed:', error);
          return 0;
        }
      };

      const [
        totalContacts,
        activeConversations,
        openDeals,
        dealsValue,
        zettelsCreated,
        gapsIdentified,
      ] = await Promise.all([
        safeCount(() => prisma.contact.count({ where: { companyId } })),
        safeCount(() => prisma.conversation.count({ where: { companyId, status: { not: 'closed' } } })),
        safeCount(() => prisma.deal.count({ where: { companyId, stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] } } })),
        (async () => {
          try {
            const result = await prisma.deal.aggregate({
              where: { companyId, stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] } },
              _sum: { value: true },
            });
            return result;
          } catch (error) {
            console.warn('Dashboard stats aggregate failed:', error);
            return { _sum: { value: 0 } };
          }
        })(),
        safeCount(() => prisma.knowledgeNode.count({ where: { companyId } })),
        safeCount(() => (prisma as any).employeeGap?.count({ where: { companyId, status: { not: 'CLOSED' } } }) || Promise.resolve(0)),
      ]);

      res.json({
        success: true,
        data: {
          totalContacts,
          activeConversations,
          openDeals,
          dealsValue: dealsValue._sum.value || 0,
          zettelsCreated,
          gapsIdentified,
        },
      });
    } catch (error) {
      next(error);
    }
  });
}
