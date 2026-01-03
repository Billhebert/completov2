import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';
import { getCacheService } from '../../../core/cache';

export function setupSearchGlobalRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  const cache = getCacheService();

  app.get(`${baseUrl}`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { q, type, limit = 20 } = req.query;

      if (!q || typeof q !== 'string') {
        return res.status(400).json({
          success: false,
          error: { message: 'Query parameter required' },
        });
      }

      const searchTerm = q.toLowerCase();
      const maxResults = Math.min(parseInt(limit as string), 100);

      // Try cache first
      const cacheKey = `search:${req.companyId}:${searchTerm}:${type}:${maxResults}`;
      const cached = await cache.get(cacheKey);
      if (cached) {
        return res.json({ success: true, data: cached, cached: true });
      }

      const results: any = {};

      // Search contacts
      if (!type || type === 'contacts') {
        results.contacts = await prisma.contact.findMany({
          where: {
            companyId: req.companyId!,
            OR: [
              { name: { contains: searchTerm, mode: 'insensitive' } },
              { email: { contains: searchTerm, mode: 'insensitive' } },
              { phone: { contains: searchTerm, mode: 'insensitive' } },
              { companyName: { contains: searchTerm, mode: 'insensitive' } },
            ],
          },
          take: maxResults,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            companyName: true,
          },
        });
      }

      // Search deals
      if (!type || type === 'deals') {
        results.deals = await prisma.deal.findMany({
          where: {
            companyId: req.companyId!,
            title: { contains: searchTerm, mode: 'insensitive' },
          },
          take: maxResults,
          select: {
            id: true,
            title: true,
            value: true,
            stage: true,
            contact: {
              select: { name: true },
            },
          },
        });
      }

      // Search messages
      if (!type || type === 'messages') {
        results.messages = await prisma.message.findMany({
          where: {
            companyId: req.companyId!,
            content: { contains: searchTerm, mode: 'insensitive' },
            deletedAt: null,
          },
          take: maxResults,
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: {
              select: { name: true },
            },
            channel: {
              select: { name: true },
            },
          },
        });
      }

      // Search knowledge nodes
      if (!type || type === 'knowledge') {
        results.knowledge = await prisma.knowledgeNode.findMany({
          where: {
            companyId: req.companyId!,
            OR: [
              { title: { contains: searchTerm, mode: 'insensitive' } },
              { content: { contains: searchTerm, mode: 'insensitive' } },
            ],
            deletedAt: null,
          },
          take: maxResults,
          select: {
            id: true,
            title: true,
            content: true,
            nodeType: true,
            tags: true,
          },
        });
      }

      // Search users
      if (!type || type === 'users') {
        results.users = await prisma.user.findMany({
          where: {
            companyId: req.companyId!,
            OR: [
              { name: { contains: searchTerm, mode: 'insensitive' } },
              { email: { contains: searchTerm, mode: 'insensitive' } },
            ],
          },
          take: maxResults,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        });
      }

      // Search products
      if (!type || type === 'products') {
        results.products = await prisma.product.findMany({
          where: {
            companyId: req.companyId!,
            OR: [
              { name: { contains: searchTerm, mode: 'insensitive' } },
              { sku: { contains: searchTerm, mode: 'insensitive' } },
              { description: { contains: searchTerm, mode: 'insensitive' } },
            ],
          },
          take: maxResults,
          select: {
            id: true,
            sku: true,
            name: true,
            unitPrice: true,
            stock: true,
          },
        });
      }

      // Cache results for 5 minutes
      await cache.set(cacheKey, results, 300);

      res.json({ success: true, data: results, cached: false });
    } catch (error) {
      next(error);
    }
  });
}
