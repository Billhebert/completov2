import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupDashboardMainRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[Dashboard] Request received from user:', req.user?.id);
      const companyId = req.companyId!;
      console.log('[Dashboard] Company ID:', companyId);

      // Helper function to safely count with fallback
      const safeCount = async (fn: () => Promise<number>): Promise<number> => {
        try {
          return await fn();
        } catch (error) {
          console.warn('Dashboard count failed:', error);
          return 0;
        }
      };

      const safeAggregate = async (fn: () => Promise<any>): Promise<any> => {
        try {
          return await fn();
        } catch (error) {
          console.warn('Dashboard aggregate failed:', error);
          return { _sum: { value: 0 } };
        }
      };

      // Get stats
      const [totalContacts, activeDeals, dealsValueResult, openTickets, pendingTickets] = await Promise.all([
        safeCount(() => prisma.contact.count({ where: { companyId } })),
        safeCount(() => prisma.deal.count({ where: { companyId, stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] } } })),
        safeAggregate(() => prisma.deal.aggregate({
          where: { companyId, stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] } },
          _sum: { value: true },
        })),
        safeCount(() => (prisma as any).ticket?.count({ where: { companyId, status: 'OPEN' } }) || Promise.resolve(0)),
        safeCount(() => (prisma as any).ticket?.count({ where: { companyId, status: 'PENDING' } }) || Promise.resolve(0)),
      ]);

      const dealsValue = dealsValueResult._sum.value || 0;

      // Get recent activities (combining contacts, deals, tickets)
      const recentActivities: any[] = [];

      try {
        const recentContacts = await prisma.contact.findMany({
          where: { companyId },
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, name: true, createdAt: true, createdBy: { select: { name: true } } },
        });
        recentContacts.forEach(contact => {
          recentActivities.push({
            id: contact.id,
            type: 'contact',
            title: 'Novo contato criado',
            description: contact.name,
            user: { name: contact.createdBy?.name || 'Sistema' },
            createdAt: contact.createdAt,
          });
        });
      } catch (error) {
        console.warn('Failed to fetch recent contacts:', error);
      }

      try {
        const recentDeals = await prisma.deal.findMany({
          where: { companyId },
          take: 5,
          orderBy: { updatedAt: 'desc' },
          select: { id: true, title: true, updatedAt: true, contact: { select: { name: true } } },
        });
        recentDeals.forEach(deal => {
          recentActivities.push({
            id: deal.id,
            type: 'deal',
            title: 'Deal atualizado',
            description: deal.title,
            user: { name: deal.contact?.name || 'Sistema' },
            createdAt: deal.updatedAt,
          });
        });
      } catch (error) {
        console.warn('Failed to fetch recent deals:', error);
      }

      // Sort activities by date and take top 10
      recentActivities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const sortedActivities = recentActivities.slice(0, 10);

      // Get pending tasks
      const pendingTasks: any[] = [];
      try {
        if ((prisma as any).task) {
          const tasks = await (prisma as any).task.findMany({
            where: { companyId, completed: false },
            take: 10,
            orderBy: { dueDate: 'asc' },
            select: { id: true, title: true, description: true, priority: true, dueDate: true, completed: true, assignedTo: true },
          });
          pendingTasks.push(...tasks);
        }
      } catch (error) {
        console.warn('Failed to fetch pending tasks:', error);
      }

      // Get chart data for deals (last 6 months)
      const dealsChart: any[] = [];
      try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyDeals = await prisma.$queryRaw`
          SELECT
            TO_CHAR(created_at, 'Mon') as name,
            COUNT(*)::int as value
          FROM "Deal"
          WHERE company_id = ${companyId}
            AND created_at >= ${sixMonthsAgo}
          GROUP BY TO_CHAR(created_at, 'Mon'), EXTRACT(MONTH FROM created_at)
          ORDER BY EXTRACT(MONTH FROM created_at)
          LIMIT 6
        `;
        dealsChart.push(...(monthlyDeals as any[]));
      } catch (error) {
        console.warn('Failed to fetch deals chart data:', error);
      }

      // Get chart data for revenue (last 6 months)
      const revenueChart: any[] = [];
      try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyRevenue = await prisma.$queryRaw`
          SELECT
            TO_CHAR(created_at, 'Mon') as name,
            COALESCE(SUM(value), 0)::int as value
          FROM "Deal"
          WHERE company_id = ${companyId}
            AND created_at >= ${sixMonthsAgo}
            AND stage IN ('CLOSED_WON')
          GROUP BY TO_CHAR(created_at, 'Mon'), EXTRACT(MONTH FROM created_at)
          ORDER BY EXTRACT(MONTH FROM created_at)
          LIMIT 6
        `;
        revenueChart.push(...(monthlyRevenue as any[]));
      } catch (error) {
        console.warn('Failed to fetch revenue chart data:', error);
      }

      // Calculate change percentages (comparing with previous period)
      const contactsChange = 0; // TODO: Calculate actual change
      const dealsChange = 0; // TODO: Calculate actual change
      const ticketsChange = 0; // TODO: Calculate actual change
      const revenueChange = 0; // TODO: Calculate actual change

      res.json({
        success: true,
        data: {
          stats: {
            contacts: {
              total: totalContacts,
              change: contactsChange,
            },
            deals: {
              active: activeDeals,
              value: dealsValue,
              change: dealsChange,
            },
            tickets: {
              open: openTickets,
              pending: pendingTickets,
              change: ticketsChange,
            },
            revenue: {
              monthly: dealsValue, // Using total deals value as monthly revenue
              change: revenueChange,
            },
          },
          recentActivities: sortedActivities,
          pendingTasks,
          dealsChart,
          revenueChart,
        },
      });
    } catch (error) {
      next(error);
    }
  });
}
