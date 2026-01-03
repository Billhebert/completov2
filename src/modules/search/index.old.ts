// src/modules/search/index.ts
import { ModuleDefinition } from '../../core/types';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../core/middleware';
import { getCacheService } from '../../core/cache';

function setupRoutes(app: Express, prisma: PrismaClient) {
  const base = '/api/v1/search';
  const cache = getCacheService();

  // Global search
  app.get(`${base}`, authenticate, tenantIsolation, async (req, res, next) => {
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

  // Search suggestions (autocomplete)
  app.get(`${base}/suggest`, authenticate, tenantIsolation, async (req, res, next) => {
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

  // Recent searches
  app.get(`${base}/recent`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const cacheKey = `recent-searches:${req.user!.id}`;
      const recent = (await cache.get<string[]>(cacheKey)) || [];

      res.json({ success: true, data: recent });
    } catch (error) {
      next(error);
    }
  });

  // Save search
  app.post(`${base}/save`, authenticate, tenantIsolation, async (req, res, next) => {
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

export const searchModule: ModuleDefinition = {
  name: 'search',
  version: '1.0.0',
  provides: ['search', 'autocomplete'],
  routes: (ctx) => setupRoutes(ctx.app, ctx.prisma),
};
