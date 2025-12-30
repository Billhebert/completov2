// src/modules/crm/lead-scoring.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission, validateBody } from '../../core/middleware';
import { z } from 'zod';

interface ScoringRule {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in';
  value: any;
  score: number;
}

const scoringProfileSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  rules: z.array(z.object({
    field: z.string(),
    operator: z.enum(['equals', 'contains', 'greater_than', 'less_than', 'in']),
    value: z.any(),
    score: z.number(),
  })),
  active: z.boolean().default(true),
});

export function setupLeadScoringRoutes(router: Router, prisma: PrismaClient) {
  
  // Create scoring profile
  router.post('/lead-scoring/profiles',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_CREATE),
    validateBody(scoringProfileSchema),
    async (req, res, next) => {
      try {
        const profile = await prisma.leadScoringProfile.create({
          data: {
            ...req.body,
            rules: JSON.stringify(req.body.rules),
            companyId: req.companyId!,
          },
        });

        res.status(201).json({ success: true, data: profile });
      } catch (error) {
        next(error);
      }
    }
  );

  // Calculate score for a contact
  router.post('/contacts/:id/calculate-score',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_READ),
    async (req, res, next) => {
      try {
        const contact = await prisma.contact.findFirst({
          where: {
            id: req.params.id,
            companyId: req.companyId!,
          },
          include: {
            deals: true,
            interactions: true,
          },
        });

        if (!contact) {
          return res.status(404).json({
            success: false,
            error: { message: 'Contact not found' },
          });
        }

        // Get active scoring profiles
        const profiles = await prisma.leadScoringProfile.findMany({
          where: {
            companyId: req.companyId!,
            isActive: true,
          },
        });

        let totalScore = 0;
        const scoreBreakdown: any[] = [];

        for (const profile of profiles) {
          const rules: ScoringRule[] = JSON.parse(profile.rules as string);
          let profileScore = 0;

          for (const rule of rules) {
            let ruleMatched = false;

            switch (rule.field) {
              case 'email':
                ruleMatched = evaluateRule(contact.email, rule);
                break;
              case 'phone':
                ruleMatched = evaluateRule(contact.phone, rule);
                break;
              case 'companyName':
                ruleMatched = evaluateRule(contact.companyName, rule);
                break;
              case 'leadStatus':
                ruleMatched = evaluateRule(contact.leadStatus, rule);
                break;
              case 'dealCount':
                ruleMatched = evaluateRule(contact.deals.length, rule);
                break;
              case 'interactionCount':
                ruleMatched = evaluateRule(contact.interactions.length, rule);
                break;
              case 'totalDealValue':
                const totalValue = contact.deals.reduce((sum, deal) => sum + deal.value, 0);
                ruleMatched = evaluateRule(totalValue, rule);
                break;
            }

            if (ruleMatched) {
              profileScore += rule.score;
              scoreBreakdown.push({
                profile: profile.name,
                rule: rule.field,
                score: rule.score,
              });
            }
          }

          totalScore += profileScore;
        }

        // Update contact score
        await prisma.contact.update({
          where: { id: contact.id },
          data: { leadScore: totalScore },
        });

        res.json({
          success: true,
          data: {
            contactId: contact.id,
            score: totalScore,
            breakdown: scoreBreakdown,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // Batch calculate scores
  router.post('/lead-scoring/calculate-all',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_UPDATE),
    async (req, res, next) => {
      try {
        const contacts = await prisma.contact.findMany({
          where: { companyId: req.companyId! },
          include: {
            deals: true,
            interactions: true,
          },
        });

        const profiles = await prisma.leadScoringProfile.findMany({
          where: {
            companyId: req.companyId!,
            isActive: true,
          },
        });

        let updated = 0;

        for (const contact of contacts) {
          let totalScore = 0;

          for (const profile of profiles) {
            const rules: ScoringRule[] = JSON.parse(profile.rules as string);

            for (const rule of rules) {
              let ruleMatched = false;

              switch (rule.field) {
                case 'dealCount':
                  ruleMatched = evaluateRule(contact.deals.length, rule);
                  break;
                case 'interactionCount':
                  ruleMatched = evaluateRule(contact.interactions.length, rule);
                  break;
                case 'totalDealValue':
                  const totalValue = contact.deals.reduce((sum, deal) => sum + deal.value, 0);
                  ruleMatched = evaluateRule(totalValue, rule);
                  break;
                default:
                  ruleMatched = evaluateRule((contact as any)[rule.field], rule);
              }

              if (ruleMatched) {
                totalScore += rule.score;
              }
            }
          }

          await prisma.contact.update({
            where: { id: contact.id },
            data: { leadScore: totalScore },
          });

          updated++;
        }

        res.json({
          success: true,
          data: {
            updated,
            total: contacts.length,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // Get high-score leads
  router.get('/leads/hot',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_READ),
    async (req, res, next) => {
      try {
        const { threshold = '50', limit = '20' } = req.query;

        const contacts = await prisma.contact.findMany({
          where: {
            companyId: req.companyId!,
            leadScore: { gte: parseInt(threshold as string) },
          },
          take: parseInt(limit as string),
          include: {
            owner: { select: { id: true, name: true } },
            _count: { select: { deals: true, interactions: true } },
          },
          orderBy: { leadScore: 'desc' },
        });

        res.json({ success: true, data: contacts });
      } catch (error) {
        next(error);
      }
    }
  );

  // Contact segments
  router.post('/contacts/segments',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_CREATE),
    validateBody(z.object({
      name: z.string(),
      description: z.string().optional(),
      filters: z.object({
        leadStatus: z.string().optional(),
        leadScoreMin: z.number().optional(),
        leadScoreMax: z.number().optional(),
        tags: z.array(z.string()).optional(),
        ownerId: z.string().optional(),
        createdAfter: z.string().optional(),
        createdBefore: z.string().optional(),
      }),
    })),
    async (req, res, next) => {
      try {
        const segment = await prisma.contactSegment.create({
          data: {
            name: req.body.name,
            description: req.body.description,
            filters: JSON.stringify(req.body.filters),
            companyId: req.companyId!,
          },
        });

        res.status(201).json({ success: true, data: segment });
      } catch (error) {
        next(error);
      }
    }
  );

  // Get contacts in segment
  router.get('/contacts/segments/:id/contacts',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_READ),
    async (req, res, next) => {
      try {
        const segment = await prisma.contactSegment.findFirst({
          where: {
            id: req.params.id,
            companyId: req.companyId!,
          },
        });

        if (!segment) {
          return res.status(404).json({
            success: false,
            error: { message: 'Segment not found' },
          });
        }

        const filters = JSON.parse(segment.filters as string);
        const where: any = { companyId: req.companyId! };

        if (filters.leadStatus) where.leadStatus = filters.leadStatus;
        if (filters.leadScoreMin) {
          where.leadScore = { ...where.leadScore, gte: filters.leadScoreMin };
        }
        if (filters.leadScoreMax) {
          where.leadScore = { ...where.leadScore, lte: filters.leadScoreMax };
        }
        if (filters.tags && filters.tags.length > 0) {
          where.tags = { hasSome: filters.tags };
        }
        if (filters.ownerId) where.ownerId = filters.ownerId;
        if (filters.createdAfter || filters.createdBefore) {
          where.createdAt = {};
          if (filters.createdAfter) where.createdAt.gte = new Date(filters.createdAfter);
          if (filters.createdBefore) where.createdAt.lte = new Date(filters.createdBefore);
        }

        const contacts = await prisma.contact.findMany({
          where,
          include: {
            owner: { select: { id: true, name: true } },
            _count: { select: { deals: true, interactions: true } },
          },
          orderBy: { leadScore: 'desc' },
        });

        res.json({ success: true, data: contacts, count: contacts.length });
      } catch (error) {
        next(error);
      }
    }
  );
}

// Helper function to evaluate scoring rules
function evaluateRule(value: any, rule: ScoringRule): boolean {
  switch (rule.operator) {
    case 'equals':
      return value === rule.value;
    case 'contains':
      return typeof value === 'string' && value.includes(rule.value);
    case 'greater_than':
      return value > rule.value;
    case 'less_than':
      return value < rule.value;
    case 'in':
      return Array.isArray(rule.value) && rule.value.includes(value);
    default:
      return false;
  }
}
