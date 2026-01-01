// src/modules/analytics/service.ts
import { PrismaClient } from '@prisma/client';

export class AnalyticsService {
  constructor(private prisma: PrismaClient) {}

  async getDashboard(companyId: string) {
    const [
      totalUsers,
      activeUsers,
      totalContacts,
      totalDeals,
      wonDeals,
      lostDeals,
      totalRevenue,
      totalMessages,
      knowledgeNodes,
    ] = await Promise.all([
      this.prisma.user.count({ where: { companyId } }),
      this.prisma.user.count({
        where: {
          companyId,
          active: true,
          lastLogin: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      this.prisma.contact.count({ where: { companyId } }),
      this.prisma.deal.count({ where: { companyId } }),
      this.prisma.deal.count({ where: { companyId, stage: 'won' } }),
      this.prisma.deal.count({ where: { companyId, stage: 'lost' } }),
      this.prisma.deal.aggregate({
        where: { companyId, stage: 'won' },
        _sum: { value: true },
      }),
      this.prisma.message.count({ where: { companyId } }),
      this.prisma.knowledgeNode.count({ where: { companyId } }),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
      },
      crm: {
        contacts: totalContacts,
        deals: {
          total: totalDeals,
          won: wonDeals,
          lost: lostDeals,
          winRate: totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0,
        },
        revenue: totalRevenue._sum.value || 0,
      },
      communication: {
        messages: totalMessages,
      },
      knowledge: {
        nodes: knowledgeNodes,
      },
    };
  }

  async getTimeSeriesData(
    companyId: string,
    metric: string,
    startDate: Date,
    endDate: Date
  ) {
    const eventLogs = await this.prisma.eventLog.findMany({
      where: {
        companyId,
        name: `daily.snapshot`,
        createdAt: { gte: startDate, lte: endDate },
      },
      orderBy: { createdAt: 'asc' },
    });

    return eventLogs.map((log) => ({
      date: log.createdAt,
      data: log.data,
    }));
  }

  async getTopContacts(companyId: string, limit = 10) {
    const contacts = await this.prisma.contact.findMany({
      where: { companyId },
      include: {
        _count: {
          select: { interactions: true, deals: true },
        },
        deals: {
          where: { stage: 'won' },
          select: { value: true },
        },
      },
      take: limit,
    });

    return contacts
      .map((contact) => ({
        id: contact.id,
        name: contact.name,
        email: contact.email,
        interactionCount: contact._count.interactions,
        dealCount: contact._count.deals,
        totalRevenue: contact.deals.reduce((sum, deal) => sum + deal.value, 0),
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  async getPipelineMetrics(companyId: string) {
    const deals = await this.prisma.deal.groupBy({
      by: ['stage'],
      where: { companyId },
      _count: { id: true },
      _sum: { value: true },
    });

    return deals.map((stage) => ({
      stage: stage.stage,
      count: stage._count.id,
      value: stage._sum.value || 0,
    }));
  }

  async getUserActivity(companyId: string, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const activities = await this.prisma.eventLog.findMany({
      where: {
        companyId,
        createdAt: { gte: since },
      },
      include: {
        actor: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return activities;
  }
}
