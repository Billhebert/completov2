import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';
import { getCacheService } from '../../../core/cache';

export function setupSearchSaveRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  const cache = getCacheService();

  app.post(`${baseUrl}/save`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { query } = req.body;

      if (!query) {
        return res.status(400).json({
          success: false,
          error: { message: 'Query required' },
        });
      }

      const cacheKey = `recent-searches:${req.user!.id}`;
      const recent = (await cache.get<string[]>(cacheKey)) || [];

      // Add to front, remove duplicates, keep last 10
      const updated = [query, ...recent.filter((q) => q !== query)].slice(0, 10);

      await cache.set(cacheKey, updated, 86400 * 30); // 30 days

      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  });
}
