import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupSearchSuggestRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/suggest`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { q, type = 'all', limit = 10 } = req.query;

      if (!q || typeof q !== 'string' || q.length < 2) {
        return res.json({ success: true, data: [] });
      }

      const searchTerm = q.toLowerCase();
      const maxResults = Math.min(parseInt(limit as string), 20);

      const suggestions: any[] = [];

      // Contact suggestions
      if (type === 'all' || type === 'contacts') {
        const contacts = await prisma.contact.findMany({
          where: {
            companyId: req.companyId!,
            name: { contains: searchTerm, mode: 'insensitive' },
          },
          take: maxResults,
          select: { id: true, name: true, email: true },
        });

        suggestions.push(
          ...contacts.map((c) => ({
            type: 'contact',
            id: c.id,
            label: c.name,
            sublabel: c.email,
          }))
        );
      }

      // Deal suggestions
      if (type === 'all' || type === 'deals') {
        const deals = await prisma.deal.findMany({
          where: {
            companyId: req.companyId!,
            title: { contains: searchTerm, mode: 'insensitive' },
          },
          take: maxResults,
          select: { id: true, title: true, value: true },
        });

        suggestions.push(
          ...deals.map((d) => ({
            type: 'deal',
            id: d.id,
            label: d.title,
            sublabel: `$${d.value}`,
          }))
        );
      }

      res.json({ success: true, data: suggestions.slice(0, maxResults) });
    } catch (error) {
      next(error);
    }
  });
}
