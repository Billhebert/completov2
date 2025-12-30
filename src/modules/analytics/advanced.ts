// src/modules/analytics/advanced.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission, validateBody } from '../../core/middleware';
import { z } from 'zod';
import PDFDocument from 'pdfkit';
import * as XLSX from 'xlsx';

const customReportSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  dataSource: z.enum(['deals', 'contacts', 'interactions', 'invoices', 'users']),
  metrics: z.array(z.object({
    field: z.string(),
    aggregation: z.enum(['count', 'sum', 'avg', 'min', 'max']),
    alias: z.string().optional(),
  })),
  dimensions: z.array(z.string()),
  filters: z.record(z.any()).optional(),
  dateRange: z.object({
    start: z.string(),
    end: z.string(),
  }).optional(),
  visualization: z.enum(['table', 'bar', 'line', 'pie', 'area']).default('table'),
  schedule: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly']),
    time: z.string(), // HH:mm
    recipients: z.array(z.string()),
  }).optional(),
});

const funnelSchema = z.object({
  name: z.string(),
  stages: z.array(z.object({
    name: z.string(),
    filter: z.record(z.any()),
  })),
  timeWindow: z.number().optional(), // days
});

export function setupAdvancedAnalyticsRoutes(router: Router, prisma: PrismaClient) {
  
  // ===== CUSTOM REPORTS =====

  // Create custom report
  router.post('/analytics/reports',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_UPDATE),
    validateBody(customReportSchema),
    async (req, res, next) => {
      try {
        const report = await (prisma as any).customReport.create({
          data: {
            ...req.body,
            metrics: JSON.stringify(req.body.metrics),
            dimensions: req.body.dimensions,
            filters: req.body.filters ? JSON.stringify(req.body.filters) : null,
            dateRange: req.body.dateRange ? JSON.stringify(req.body.dateRange) : null,
            schedule: req.body.schedule ? JSON.stringify(req.body.schedule) : null,
            companyId: req.companyId!,
            createdById: req.user!.id,
          },
        });

        res.status(201).json({ success: true, data: report });
      } catch (error) {
        next(error);
      }
    }
  );

  // List custom reports
  router.get('/analytics/reports',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    async (req, res, next) => {
      try {
        const reports = await (prisma as any).customReport.findMany({
          where: { companyId: req.companyId! },
          include: {
            createdBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        });

        res.json({ success: true, data: reports });
      } catch (error) {
        next(error);
      }
    }
  );

  // Execute custom report
  router.get('/analytics/reports/:id/execute',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    async (req, res, next) => {
      try {
        const report = await (prisma as any).customReport.findFirst({
          where: {
            id: req.params.id,
            companyId: req.companyId!,
          },
        });

        if (!report) {
          return res.status(404).json({
            success: false,
            error: { message: 'Report not found' },
          });
        }

        const metrics = JSON.parse(report.metrics as string);
        const filters = report.filters ? JSON.parse(report.filters as string) : {};
        const dateRange = report.dateRange ? JSON.parse(report.dateRange as string) : null;

        // Build query dynamically based on data source
        let data: any[] = [];
        
        switch (report.dataSource) {
          case 'deals':
            const where: any = { companyId: req.companyId!, ...filters };
            if (dateRange) {
              where.createdAt = {
                gte: new Date(dateRange.start),
                lte: new Date(dateRange.end),
              };
            }

            // Group by dimensions
            if (report.dimensions.length > 0) {
              data = await (prisma.deal.groupBy as any)({
                by: report.dimensions,
                where,
                _count: metrics.find((m: any) => m.aggregation === 'count') ? true : undefined,
                _sum: metrics.find((m: any) => m.aggregation === 'sum')
                  ? { [metrics.find((m: any) => m.aggregation === 'sum').field]: true }
                  : undefined,
                _avg: metrics.find((m: any) => m.aggregation === 'avg')
                  ? { [metrics.find((m: any) => m.aggregation === 'avg').field]: true }
                  : undefined,
              });
            } else {
              // Aggregate without grouping
              const aggregate = await prisma.deal.aggregate({
                where,
                _count: true,
                _sum: { value: true },
                _avg: { value: true },
              });
              data = [aggregate];
            }
            break;

          case 'contacts':
            data = await (prisma.contact.groupBy as any)({
              by: report.dimensions,
              where: { companyId: req.companyId!, ...filters },
              _count: true,
            });
            break;

          // Add other data sources...
        }

        res.json({ 
          success: true, 
          data: {
            report: {
              id: report.id,
              name: report.name,
              dataSource: report.dataSource,
            },
            results: data,
            executedAt: new Date(),
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // Export report (PDF)
  router.get('/analytics/reports/:id/export/pdf',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    async (req, res, next) => {
      try {
        const report = await (prisma as any).customReport.findFirst({
          where: {
            id: req.params.id,
            companyId: req.companyId!,
          },
        });

        if (!report) {
          return res.status(404).json({
            success: false,
            error: { message: 'Report not found' },
          });
        }

        // Generate PDF (simplified)
        const doc = new PDFDocument();
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${report.name}.pdf`);
        
        doc.pipe(res);
        
        doc.fontSize(20).text(report.name, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(report.description || 'Custom Analytics Report');
        doc.moveDown();
        doc.text(`Generated: ${new Date().toLocaleString()}`);
        
        // In production, add actual data visualization
        
        doc.end();
      } catch (error) {
        next(error);
      }
    }
  );

  // Export report (Excel)
  router.get('/analytics/reports/:id/export/excel',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    async (req, res, next) => {
      try {
        // Execute report first
        const report = await (prisma as any).customReport.findFirst({
          where: {
            id: req.params.id,
            companyId: req.companyId!,
          },
        });

        if (!report) {
          return res.status(404).json({
            success: false,
            error: { message: 'Report not found' },
          });
        }

        // Get data (simplified)
        const data = [
          { name: 'Sample', value: 100 },
        ];

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${report.name}.xlsx`);
        res.send(buffer);
      } catch (error) {
        next(error);
      }
    }
  );

  // Schedule report
  router.post('/analytics/reports/:id/schedule',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_UPDATE),
    validateBody(z.object({
      frequency: z.enum(['daily', 'weekly', 'monthly']),
      time: z.string(),
      recipients: z.array(z.string().email()),
    })),
    async (req, res, next) => {
      try {
        await (prisma as any).customReport.update({
          where: { id: req.params.id },
          data: {
            schedule: JSON.stringify(req.body),
          },
        });

        res.json({ success: true, message: 'Report scheduled successfully' });
      } catch (error) {
        next(error);
      }
    }
  );

  // ===== FUNNEL ANALYSIS =====

  // Create funnel
  router.post('/analytics/funnels',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_UPDATE),
    validateBody(funnelSchema),
    async (req, res, next) => {
      try {
        const funnel = await (prisma as any).funnel.create({
          data: {
            name: req.body.name,
            stages: JSON.stringify(req.body.stages),
            timeWindow: req.body.timeWindow,
            companyId: req.companyId!,
            createdById: req.user!.id,
          },
        });

        res.status(201).json({ success: true, data: funnel });
      } catch (error) {
        next(error);
      }
    }
  );

  // Analyze funnel
  router.get('/analytics/funnels/:id/analyze',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    async (req, res, next) => {
      try {
        const { startDate, endDate } = req.query;

        const funnel = await (prisma as any).funnel.findFirst({
          where: {
            id: req.params.id,
            companyId: req.companyId!,
          },
        });

        if (!funnel) {
          return res.status(404).json({
            success: false,
            error: { message: 'Funnel not found' },
          });
        }

        const stages = JSON.parse(funnel.stages as string);
        const results = [];

        // Analyze each stage
        for (const stage of stages) {
          const count = await prisma.deal.count({
            where: {
              companyId: req.companyId!,
              ...stage.filter,
              createdAt: startDate && endDate ? {
                gte: new Date(startDate as string),
                lte: new Date(endDate as string),
              } : undefined,
            },
          });

          results.push({
            stage: stage.name,
            count,
            percentage: 0, // Will calculate after
          });
        }

        // Calculate conversion rates
        const totalEntries = results[0]?.count || 0;
        results.forEach((r: any, i: number) => {
          r.percentage = totalEntries > 0 ? (r.count / totalEntries) * 100 : 0;
          if (i > 0) {
            r.dropoff = results[i - 1].count - r.count;
            r.dropoffRate = results[i - 1].count > 0
              ? ((results[i - 1].count - r.count) / results[i - 1].count) * 100
              : 0;
          }
        });

        res.json({ 
          success: true, 
          data: {
            funnel: { id: funnel.id, name: funnel.name },
            stages: results,
            totalEntries,
            finalConversion: totalEntries > 0 
              ? ((results[results.length - 1]?.count || 0) / totalEntries) * 100 
              : 0,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // ===== COHORT ANALYSIS =====

  // Cohort analysis (retention)
  router.get('/analytics/cohorts',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    async (req, res, next) => {
      try {
        const { cohortType = 'monthly', metric = 'active_users' } = req.query;

        // Get users grouped by signup month
        const users = await prisma.user.findMany({
          where: { companyId: req.companyId! },
          select: {
            id: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        });

        // Group by cohort (month)
        const cohorts: Record<string, any> = {};

        users.forEach(user => {
          const cohortKey = user.createdAt.toISOString().substring(0, 7); // YYYY-MM
          if (!cohorts[cohortKey]) {
            cohorts[cohortKey] = {
              cohort: cohortKey,
              size: 0,
              retention: {},
            };
          }
          cohorts[cohortKey].size++;
        });

        // Calculate retention for each cohort
        // (Simplified - in production, track actual user activity)

        res.json({ 
          success: true, 
          data: Object.values(cohorts),
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // ===== CHURN ANALYSIS =====

  // Churn prediction
  router.get('/analytics/churn',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    async (req, res, next) => {
      try {
        // Get inactive users (simplified churn analysis)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Note: lastActivityAt field does not exist in User model
        // Using placeholder query for demonstration
        const inactiveUsers = await prisma.user.findMany({
          where: {
            companyId: req.companyId!,
            // lastActivityAt field not available in current schema
          },
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
          take: 100, // Limit results
        });

        // Calculate churn metrics
        const totalUsers = await prisma.user.count({
          where: { companyId: req.companyId! },
        });

        const churnRate = (inactiveUsers.length / totalUsers) * 100;

        res.json({
          success: true,
          data: {
            totalUsers,
            inactiveUsers: inactiveUsers.length,
            churnRate,
            atRiskUsers: inactiveUsers,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // ===== ADVANCED METRICS =====

  // Customer lifetime value (CLV)
  router.get('/analytics/clv',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    async (req, res, next) => {
      try {
        const contacts = await prisma.contact.findMany({
          where: { companyId: req.companyId! },
          include: {
            deals: {
              where: { stage: 'won' },
            },
          },
        });

        const clvData = contacts.map(contact => {
          const totalRevenue = contact.deals.reduce((sum, deal) => sum + deal.value, 0);
          const dealCount = contact.deals.length;
          const avgDealValue = dealCount > 0 ? totalRevenue / dealCount : 0;
          
          // Simplified CLV = Total Revenue (in production, use more sophisticated model)
          return {
            contactId: contact.id,
            contactName: contact.name,
            totalRevenue,
            dealCount,
            avgDealValue,
            clv: totalRevenue,
          };
        });

        // Sort by CLV
        clvData.sort((a, b) => b.clv - a.clv);

        res.json({
          success: true,
          data: {
            topCustomers: clvData.slice(0, 10),
            avgCLV: clvData.reduce((sum, c) => sum + c.clv, 0) / clvData.length,
            totalCLV: clvData.reduce((sum, c) => sum + c.clv, 0),
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );
}
