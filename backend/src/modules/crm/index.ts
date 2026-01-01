// src/modules/crm/index.ts
import { ModuleDefinition } from '../../core/types';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { EventBus, Events } from '../../core/event-bus';
import { authenticate, tenantIsolation, validateBody, requirePermission, Permission } from '../../core/middleware';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  position: z.string().optional(),
  website: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  ownerId: z.string().optional(),
});

const dealSchema = z.object({
  title: z.string(),
  contactId: z.string(),
  value: z.number().positive(),
  currency: z.string().default('USD'),
  stage: z.string().default('lead'),
  expectedCloseDate: z.string().optional(),
  ownerId: z.string().optional(),
  products: z.array(z.object({
    productId: z.string(),
    productName: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number(),
  })).optional(),
});

const interactionSchema = z.object({
  type: z.enum(['call', 'email', 'meeting', 'note']),
  contactId: z.string().optional(),
  dealId: z.string().optional(),
  subject: z.string().optional(),
  content: z.string(),
  direction: z.enum(['inbound', 'outbound']).optional(),
  scheduledFor: z.string().optional(),
});

function setupRoutes(app: Express, prisma: PrismaClient, eventBus: EventBus) {
  const base = '/api/v1/crm';

  // ============================================
  // CONTACTS
  // ============================================

  app.get(`${base}/contacts`, authenticate, tenantIsolation, requirePermission(Permission.CONTACT_READ), async (req, res, next) => {
    try {
      const { search, tag, leadStatus, ownerId, page = '1', limit = '20' } = req.query;
      
      const where: any = { companyId: req.companyId! };
      
      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
          { companyName: { contains: search as string, mode: 'insensitive' } },
        ];
      }
      
      if (tag) where.tags = { has: tag as string };
      if (leadStatus) where.leadStatus = leadStatus;
      if (ownerId) where.ownerId = ownerId;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const [contacts, total] = await Promise.all([
        prisma.contact.findMany({
          where,
          skip,
          take: parseInt(limit as string),
          include: {
            owner: { select: { id: true, name: true, email: true } },
            _count: { select: { deals: true, interactions: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.contact.count({ where }),
      ]);

      res.json({
        success: true,
        data: contacts,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${base}/contacts`, authenticate, tenantIsolation, requirePermission(Permission.CONTACT_CREATE), validateBody(contactSchema), async (req, res, next) => {
    try {
      const contact = await prisma.contact.create({
        data: {
          ...req.body,
          companyId: req.companyId!,
          ownerId: req.body.ownerId || req.user!.id,
        },
      });

      await eventBus.publish(Events.CONTACT_CREATED, {
        type: Events.CONTACT_CREATED,
        version: 'v1',
        timestamp: new Date(),
        companyId: req.companyId!,
        userId: req.user!.id,
        data: { contactId: contact.id, name: contact.name },
      });

      res.status(201).json({ success: true, data: contact });
    } catch (error) {
      next(error);
    }
  });

  app.get(`${base}/contacts/:id`, authenticate, tenantIsolation, requirePermission(Permission.CONTACT_READ), async (req, res, next) => {
    try {
      const contact = await prisma.contact.findFirst({
        where: { id: req.params.id, companyId: req.companyId! },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          deals: {
            include: { owner: { select: { id: true, name: true } } },
            orderBy: { createdAt: 'desc' },
          },
          interactions: {
            include: { user: { select: { id: true, name: true } } },
            orderBy: { timestamp: 'desc' },
            take: 10,
          },
        },
      });

      if (!contact) {
        return res.status(404).json({ success: false, error: { message: 'Contact not found' } });
      }

      res.json({ success: true, data: contact });
    } catch (error) {
      next(error);
    }
  });

  app.patch(`${base}/contacts/:id`, authenticate, tenantIsolation, requirePermission(Permission.CONTACT_CREATE), async (req, res, next) => {
    try {
      const contact = await prisma.contact.update({
        where: { id: req.params.id },
        data: req.body,
      });
      res.json({ success: true, data: contact });
    } catch (error) {
      next(error);
    }
  });

  app.delete(`${base}/contacts/:id`, authenticate, tenantIsolation, requirePermission(Permission.CONTACT_CREATE), async (req, res, next) => {
    try {
      await prisma.contact.delete({
        where: { id: req.params.id },
      });
      res.json({ success: true, message: 'Contact deleted' });
    } catch (error) {
      next(error);
    }
  });

  // ============================================
  // DEALS
  // ============================================

  app.get(`${base}/deals`, authenticate, tenantIsolation, requirePermission(Permission.CONTACT_READ), async (req, res, next) => {
    try {
      const { stage, ownerId, page = '1', limit = '20' } = req.query;
      
      const where: any = { companyId: req.companyId! };
      if (stage) where.stage = stage;
      if (ownerId) where.ownerId = ownerId;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const [deals, total] = await Promise.all([
        prisma.deal.findMany({
          where,
          skip,
          take: parseInt(limit as string),
          include: {
            contact: { select: { id: true, name: true, email: true } },
            owner: { select: { id: true, name: true, email: true } },
            products: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.deal.count({ where }),
      ]);

      res.json({
        success: true,
        data: deals,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${base}/deals`, authenticate, tenantIsolation, requirePermission(Permission.CONTACT_CREATE), validateBody(dealSchema), async (req, res, next) => {
    try {
      const { products, ...dealData } = req.body;

      const deal = await prisma.deal.create({
        data: {
          ...dealData,
          companyId: req.companyId!,
          ownerId: dealData.ownerId || req.user!.id,
          products: products ? {
            create: products.map((p: any) => ({
              ...p,
              total: p.quantity * p.unitPrice,
            })),
          } : undefined,
        },
        include: { products: true },
      });

      await eventBus.publish(Events.DEAL_CREATED, {
        type: Events.DEAL_CREATED,
        version: 'v1',
        timestamp: new Date(),
        companyId: req.companyId!,
        userId: req.user!.id,
        data: { dealId: deal.id, title: deal.title, value: deal.value },
      });

      res.status(201).json({ success: true, data: deal });
    } catch (error) {
      next(error);
    }
  });

  app.patch(`${base}/deals/:id/stage`, authenticate, tenantIsolation, requirePermission(Permission.CONTACT_CREATE), async (req, res, next) => {
    try {
      const { stage } = req.body;

      const deal = await prisma.deal.update({
        where: { id: req.params.id },
        data: {
          stage,
          closedDate: ['won', 'lost'].includes(stage) ? new Date() : null,
        },
      });

      if (stage === 'won') {
        await eventBus.publish(Events.DEAL_WON, {
          type: Events.DEAL_WON,
          version: 'v1',
          timestamp: new Date(),
          companyId: req.companyId!,
          userId: req.user!.id,
          data: { dealId: deal.id, value: deal.value },
        });
      }

      res.json({ success: true, data: deal });
    } catch (error) {
      next(error);
    }
  });

  // ============================================
  // INTERACTIONS
  // ============================================

  app.post(`${base}/interactions`, authenticate, tenantIsolation, requirePermission(Permission.CONTACT_CREATE), validateBody(interactionSchema), async (req, res, next) => {
    try {
      const interaction = await prisma.interaction.create({
        data: {
          ...req.body,
          companyId: req.companyId!,
          userId: req.user!.id,
        },
      });
      res.status(201).json({ success: true, data: interaction });
    } catch (error) {
      next(error);
    }
  });

  app.get(`${base}/interactions`, authenticate, tenantIsolation, requirePermission(Permission.CONTACT_READ), async (req, res, next) => {
    try {
      const { contactId, dealId, type, limit = '50' } = req.query;
      
      const where: any = { companyId: req.companyId! };
      if (contactId) where.contactId = contactId;
      if (dealId) where.dealId = dealId;
      if (type) where.type = type;

      const interactions = await prisma.interaction.findMany({
        where,
        take: parseInt(limit as string),
        include: {
          user: { select: { id: true, name: true, email: true } },
          contact: { select: { id: true, name: true } },
          deal: { select: { id: true, title: true } },
        },
        orderBy: { timestamp: 'desc' },
      });

      res.json({ success: true, data: interactions });
    } catch (error) {
      next(error);
    }
  });

  // ============================================
  // INTELLIGENT CRM (AI-Powered)
  // ============================================

  // AI-powered deal probability analysis
  app.get(`${base}/deals/:id/probability`, authenticate, tenantIsolation, requirePermission(Permission.CONTACT_READ), async (req, res, next) => {
    try {
      const deal = await prisma.deal.findFirst({
        where: { id: req.params.id, companyId: req.companyId! },
        include: {
          contact: true,
          products: true,
          interactions: {
            where: { dealId: req.params.id },
            orderBy: { timestamp: 'desc' },
            take: 10,
          },
        },
      });

      if (!deal) {
        return res.status(404).json({ success: false, error: { message: 'Deal not found' } });
      }

      const { getAIService } = await import('../../core/ai/ai.service');
      const aiService = getAIService(prisma);

      // Analyze deal probability
      const context = `
        Deal Analysis:
        - Stage: ${deal.stage}
        - Value: ${deal.value} ${deal.currency}
        - Age: ${Math.floor((Date.now() - deal.createdAt.getTime()) / (1000 * 60 * 60 * 24))} days
        - Expected Close Date: ${deal.expectedCloseDate || 'Not set'}
        - Number of Interactions: ${deal.interactions?.length || 0}
        - Last Interaction: ${deal.interactions?.[0]?.timestamp ? Math.floor((Date.now() - new Date(deal.interactions[0].timestamp).getTime()) / (1000 * 60 * 60 * 24)) + ' days ago' : 'No interactions'}
        - Contact Engagement: ${deal.contact?.leadStatus || 'unknown'}
        - Products: ${deal.products?.length || 0} items

        Based on this information, estimate the probability (0-100%) that this deal will close successfully.
        Consider: deal stage, engagement frequency, time since last contact, and deal age.
      `;

      const result = await aiService.complete({
        prompt: context,
        systemMessage: 'You are a sales analytics expert. Return only a number between 0 and 100 representing the probability percentage.',
        temperature: 0.3,
      });

      const probability = Math.max(0, Math.min(100, parseFloat(result.content.match(/\d+/)?.[0] || '50')));

      // Get AI suggestions for improving probability
      const suggestionsContext = `
        Deal at ${probability}% probability.
        Stage: ${deal.stage}
        Last contact: ${deal.interactions?.[0]?.timestamp ? Math.floor((Date.now() - new Date(deal.interactions[0].timestamp).getTime()) / (1000 * 60 * 60 * 24)) + ' days ago' : 'Never'}

        Suggest 3 specific actions to increase the probability of closing this deal.
      `;

      const suggestions = await aiService.generateSuggestions(
        suggestionsContext,
        'actions to increase deal probability (in Portuguese)'
      );

      const actionsList = suggestions
        .split(/\n/)
        .filter(s => s.trim().length > 0)
        .slice(0, 3);

      res.json({
        success: true,
        data: {
          probability,
          confidence: result.provider === 'openai' ? 'high' : 'medium',
          riskLevel: probability < 30 ? 'high' : probability < 60 ? 'medium' : 'low',
          suggestedActions: actionsList,
          analysis: {
            dealAge: Math.floor((Date.now() - deal.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
            interactionCount: deal.interactions?.length || 0,
            daysSinceLastContact: deal.interactions?.[0]?.timestamp
              ? Math.floor((Date.now() - new Date(deal.interactions[0].timestamp).getTime()) / (1000 * 60 * 60 * 24))
              : null,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  });

  // AI-powered contact enrichment suggestions
  app.get(`${base}/contacts/:id/enrich`, authenticate, tenantIsolation, requirePermission(Permission.CONTACT_READ), async (req, res, next) => {
    try {
      const contact = await prisma.contact.findFirst({
        where: { id: req.params.id, companyId: req.companyId! },
        include: {
          deals: true,
          interactions: { take: 5, orderBy: { timestamp: 'desc' } },
        },
      });

      if (!contact) {
        return res.status(404).json({ success: false, error: { message: 'Contact not found' } });
      }

      const { getAIService } = await import('../../core/ai/ai.service');
      const aiService = getAIService(prisma);

      // Identify missing fields
      const missingFields = [];
      if (!contact.email) missingFields.push('email');
      if (!contact.phone) missingFields.push('phone');
      if (!contact.companyName) missingFields.push('companyName');
      if (!contact.position) missingFields.push('position');
      if (!contact.website) missingFields.push('website');

      if (missingFields.length === 0) {
        return res.json({
          success: true,
          data: {
            complete: true,
            message: 'Contato já possui todas as informações principais',
            suggestions: [],
          },
        });
      }

      // Generate enrichment suggestions
      const context = `
        Contact Information:
        - Name: ${contact.name}
        - Email: ${contact.email || 'missing'}
        - Phone: ${contact.phone || 'missing'}
        - Company: ${contact.companyName || 'missing'}
        - Position: ${contact.position || 'missing'}
        - Website: ${contact.website || 'missing'}
        - Tags: ${contact.tags?.join(', ') || 'none'}
        - Lead Status: ${contact.leadStatus}

        Missing fields: ${missingFields.join(', ')}

        Suggest where and how to find this missing information. Provide specific, actionable suggestions in Portuguese.
      `;

      const suggestions = await aiService.generateSuggestions(
        context,
        'ways to enrich contact data (in Portuguese)'
      );

      const enrichmentSuggestions = suggestions
        .split(/\n/)
        .filter(s => s.trim().length > 0)
        .slice(0, 5);

      res.json({
        success: true,
        data: {
          complete: false,
          completionPercentage: Math.round(((6 - missingFields.length) / 6) * 100),
          missingFields,
          suggestions: enrichmentSuggestions,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  // AI-powered contact engagement score
  app.get(`${base}/contacts/:id/engagement`, authenticate, tenantIsolation, requirePermission(Permission.CONTACT_READ), async (req, res, next) => {
    try {
      const contact = await prisma.contact.findFirst({
        where: { id: req.params.id, companyId: req.companyId! },
        include: {
          deals: true,
          interactions: {
            orderBy: { timestamp: 'desc' },
            take: 20,
          },
        },
      });

      if (!contact) {
        return res.status(404).json({ success: false, error: { message: 'Contact not found' } });
      }

      const { getAIService } = await import('../../core/ai/ai.service');
      const aiService = getAIService(prisma);

      // Calculate engagement metrics
      const now = Date.now();
      const recentInteractions = contact.interactions?.filter(
        i => (now - new Date(i.timestamp).getTime()) < 30 * 24 * 60 * 60 * 1000 // Last 30 days
      ).length || 0;

      const lastInteraction = contact.interactions?.[0]?.timestamp
        ? Math.floor((now - new Date(contact.interactions[0].timestamp).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      const openDeals = contact.deals?.filter(d => !['won', 'lost'].includes(d.stage)).length || 0;
      const totalDeals = contact.deals?.length || 0;

      // Get AI analysis
      const context = `
        Contact Engagement Analysis:
        - Total Interactions: ${contact.interactions?.length || 0}
        - Recent Interactions (30 days): ${recentInteractions}
        - Days Since Last Contact: ${lastInteraction || 'Never contacted'}
        - Open Deals: ${openDeals}
        - Total Deals: ${totalDeals}
        - Lead Status: ${contact.leadStatus}
        - Tags: ${contact.tags?.join(', ') || 'none'}

        On a scale of 0-100, rate the engagement level of this contact.
        Consider interaction frequency, recency, and deal activity.
      `;

      const result = await aiService.complete({
        prompt: context,
        systemMessage: 'You are an engagement analysis expert. Return only a number between 0 and 100.',
        temperature: 0.3,
      });

      const engagementScore = Math.max(0, Math.min(100, parseFloat(result.content.match(/\d+/)?.[0] || '50')));

      // Get next action suggestions
      const nextActionsContext = `
        Contact with ${engagementScore}% engagement.
        Last contact: ${lastInteraction ? lastInteraction + ' days ago' : 'Never'}
        Open deals: ${openDeals}

        Suggest the best next action to maintain or improve engagement (in Portuguese).
      `;

      const nextAction = await aiService.summarize(nextActionsContext, 150);

      res.json({
        success: true,
        data: {
          engagementScore,
          level: engagementScore >= 70 ? 'high' : engagementScore >= 40 ? 'medium' : 'low',
          metrics: {
            totalInteractions: contact.interactions?.length || 0,
            recentInteractions,
            daysSinceLastContact: lastInteraction,
            openDeals,
            totalDeals,
          },
          nextAction,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  // ============================================
  // ANALYTICS/REPORTS
  // ============================================

  app.get(`${base}/analytics/pipeline`, authenticate, tenantIsolation, requirePermission(Permission.CONTACT_READ), async (req, res, next) => {
    try {
      const pipeline = await prisma.deal.groupBy({
        by: ['stage'],
        where: { companyId: req.companyId! },
        _count: true,
        _sum: { value: true },
      });

      res.json({ success: true, data: pipeline });
    } catch (error) {
      next(error);
    }
  });
}

export const crmModule: ModuleDefinition = {
  name: 'crm',
  version: '1.0.0',
  provides: ['crm'],
  routes: (ctx) => setupRoutes(ctx.app, ctx.prisma, ctx.eventBus),
};
