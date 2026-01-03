import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupAnalyticsExportRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/export/:type`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.params;
      
      let data: any[] = [];
      let filename = '';

      switch (type) {
        case 'contacts':
          data = await prisma.contact.findMany({ where: { companyId: req.companyId! } });
          filename = 'contacts.csv';
          break;
        case 'deals':
          data = await prisma.deal.findMany({ where: { companyId: req.companyId! } });
          filename = 'deals.csv';
          break;
        default:
          return res.status(400).json({ success: false, error: { message: 'Invalid export type' } });
      }

      if (data.length === 0) {
        return res.json({ success: true, data: [] });
      }

      const headers = Object.keys(data[0]);
      const csv = [
        headers.join(','),
        ...data.map((row) => headers.map((header) => JSON.stringify(row[header])).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  });
}
