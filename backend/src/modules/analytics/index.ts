// src/modules/analytics/index.ts
import { ModuleDefinition } from '../../core/types';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../core/middleware';
import { AnalyticsService } from './service';

function setupRoutes(app: Express, prisma: PrismaClient) {
  const base = '/api/v1/analytics';
  const analyticsService = new AnalyticsService(prisma);

  // Dashboard metrics
  app.get(`${base}/dashboard`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const metrics = await analyticsService.getDashboard(req.companyId!);
      res.json({ success: true, data: metrics });
    } catch (error) {
      next(error);
    }
  });

  // Time series data
  app.get(`${base}/timeseries`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const { metric, startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      const data = await analyticsService.getTimeSeriesData(
        req.companyId!,
        metric as string,
        start,
        end
      );
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  });

  // Top contacts
  app.get(`${base}/top-contacts`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const contacts = await analyticsService.getTopContacts(req.companyId!, limit);
      res.json({ success: true, data: contacts });
    } catch (error) {
      next(error);
    }
  });

  // Pipeline metrics
  app.get(`${base}/pipeline`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const metrics = await analyticsService.getPipelineMetrics(req.companyId!);
      res.json({ success: true, data: metrics });
    } catch (error) {
      next(error);
    }
  });

  // User activity
  app.get(`${base}/activity`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const activity = await analyticsService.getUserActivity(req.companyId!, days);
      res.json({ success: true, data: activity });
    } catch (error) {
      next(error);
    }
  });

  // Export data (CSV)
  app.get(`${base}/export/:type`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const { type } = req.params;
      
      let data: any[] = [];
      let filename = '';

      switch (type) {
        case 'contacts':
          data = await prisma.contact.findMany({
            where: { companyId: req.companyId! },
          });
          filename = 'contacts.csv';
          break;
        case 'deals':
          data = await prisma.deal.findMany({
            where: { companyId: req.companyId! },
          });
          filename = 'deals.csv';
          break;
        default:
          return res.status(400).json({
            success: false,
            error: { message: 'Invalid export type' },
          });
      }

      // Simple CSV conversion
      if (data.length === 0) {
        return res.json({ success: true, data: [] });
      }

      const headers = Object.keys(data[0]);
      const csv = [
        headers.join(','),
        ...data.map((row) =>
          headers.map((header) => JSON.stringify(row[header])).join(',')
        ),
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  });
}

export const analyticsModule: ModuleDefinition = {
  name: 'analytics',
  version: '1.0.0',
  provides: ['analytics', 'reporting'],
  routes: (ctx) => setupRoutes(ctx.app, ctx.prisma),
};
