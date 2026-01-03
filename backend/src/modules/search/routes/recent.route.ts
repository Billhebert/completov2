import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';
import { getCacheService } from '../../../core/cache';

export function setupSearchRecentRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  const cache = getCacheService();

  app.get(`${baseUrl}/recent`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cacheKey = `recent-searches:${req.user!.id}`;
      const recent = (await cache.get<string[]>(cacheKey)) || [];

      res.json({ success: true, data: recent });
    } catch (error) {
      next(error);
    }
  });
}
