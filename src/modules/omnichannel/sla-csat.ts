// src/modules/omnichannel/sla-csat.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission, validateBody } from '../../core/middleware';
import { EventBus, Events } from '../../core/event-bus';
import { z } from 'zod';

const slaRuleSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  firstResponseTime: z.number(), // in minutes
  resolutionTime: z.number(), // in minutes
  channels: z.array(z.string()).optional(),
  businessHoursOnly: z.boolean().default(true),
  active: z.boolean().default(true),
});

const csatSurveySchema = z.object({
  conversationId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export function setupSLACSATRoutes(router: Router, prisma: PrismaClient, eventBus: EventBus) {
  
  // ===== SLA MANAGEMENT =====

  // Create SLA rule
  router.post('/sla/rules',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_UPDATE),
    validateBody(slaRuleSchema),
    async (req, res, next) => {
      try {
        const rule = await prisma.slaRule.create({
          data: {
            ...req.body,
            companyId: req.companyId!,
          },
        });

        res.status(201).json({ success: true, data: rule });
      } catch (error) {
        next(error);
      }
    }
  );

  // List SLA rules
  router.get('/sla/rules',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    async (req, res, next) => {
      try {
        const { active } = req.query;

        const where: any = { companyId: req.companyId! };
        if (active !== undefined) where.active = active === 'true';

        const rules = await prisma.slaRule.findMany({
          where,
          orderBy: { priority: 'desc' },
        });

        res.json({ success: true, data: rules });
      } catch (error) {
        next(error);
      }
    }
  );

  // Update SLA rule
  router.patch('/sla/rules/:id',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_UPDATE),
    async (req, res, next) => {
      try {
        const rule = await prisma.slaRule.update({
          where: { id: req.params.id },
          data: req.body,
        });

        res.json({ success: true, data: rule });
      } catch (error) {
        next(error);
      }
    }
  );

  // Check SLA status for conversation
  router.get('/conversations/:id/sla',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    async (req, res, next) => {
      try {
        const conversation = await prisma.conversation.findFirst({
          where: {
            id: req.params.id,
            companyId: req.companyId!,
          },
          include: {
            messages: {
              orderBy: { timestamp: 'asc' },
              take: 1,
            },
          },
        });

        if (!conversation) {
          return res.status(404).json({
            success: false,
            error: { message: 'Conversation not found' },
          });
        }

        // Get applicable SLA rule
        const rule = await prisma.slaRule.findFirst({
          where: {
            companyId: req.companyId!,
            isActive: true,
            priority: conversation.priority,
            channels: conversation.channel ? { has: conversation.channel } : undefined,
          },
        });

        if (!rule) {
          return res.json({
            success: true,
            data: { hasSLA: false },
          });
        }

        const firstMessage = conversation.messages[0];
        const firstResponseDeadline = new Date(firstMessage.timestamp.getTime() + (rule.firstResponseTime || rule.responseTime) * 60000);
        const resolutionDeadline = new Date(firstMessage.timestamp.getTime() + rule.resolutionTime * 60000);

        // Check first response
        const firstResponse = await prisma.message.findFirst({
          where: {
            conversationId: conversation.id,
            direction: 'outbound',
            timestamp: { gt: firstMessage.timestamp },
          },
          orderBy: { timestamp: 'asc' },
        });

        const firstResponseMet = firstResponse && firstResponse.timestamp <= firstResponseDeadline;
        const firstResponseTimeMinutes = firstResponse 
          ? Math.round((firstResponse.timestamp.getTime() - firstMessage.timestamp.getTime()) / 60000)
          : null;

        // Check resolution
        const resolved = conversation.status === 'resolved' || conversation.closedAt !== null;
        const resolutionMet = resolved && conversation.closedAt && conversation.closedAt <= resolutionDeadline;
        const resolutionTimeMinutes = resolved && conversation.closedAt
          ? Math.round((conversation.closedAt.getTime() - firstMessage.timestamp.getTime()) / 60000)
          : null;

        res.json({
          success: true,
          data: {
            hasSLA: true,
            rule: {
              id: rule.id,
              name: rule.name,
              firstResponseTime: rule.firstResponseTime,
              resolutionTime: rule.resolutionTime,
            },
            firstResponse: {
              met: firstResponseMet,
              deadline: firstResponseDeadline,
              actualTime: firstResponseTimeMinutes,
              breached: firstResponse && !firstResponseMet,
            },
            resolution: {
              met: resolutionMet,
              deadline: resolutionDeadline,
              actualTime: resolutionTimeMinutes,
              breached: resolved && !resolutionMet,
              resolved,
            },
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // Get SLA compliance report
  router.get('/sla/report',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    async (req, res, next) => {
      try {
        const { startDate, endDate } = req.query;

        const where: any = { companyId: req.companyId! };
        
        if (startDate || endDate) {
          where.createdAt = {};
          if (startDate) where.createdAt.gte = new Date(startDate as string);
          if (endDate) where.createdAt.lte = new Date(endDate as string);
        }

        const conversations = await prisma.conversation.findMany({
          where,
          include: {
            messages: {
              orderBy: { timestamp: 'asc' },
            },
          },
        });

        let totalWithSLA = 0;
        let firstResponseMet = 0;
        let resolutionMet = 0;

        for (const conversation of conversations) {
          const rule = await prisma.slaRule.findFirst({
            where: {
              companyId: req.companyId!,
              isActive: true,
              priority: conversation.priority,
            },
          });

          if (!rule) continue;

          totalWithSLA++;

          const firstMessage = conversation.messages[0];
          const firstResponse = conversation.messages.find((m: any) => m.direction === 'outbound');

          if (firstResponse) {
            const responseTime = (firstResponse.timestamp.getTime() - firstMessage.timestamp.getTime()) / 60000;
            if (responseTime <= (rule.firstResponseTime || rule.responseTime)) firstResponseMet++;
          }

          if (conversation.closedAt) {
            const resolutionTime = (conversation.closedAt.getTime() - firstMessage.timestamp.getTime()) / 60000;
            if (resolutionTime <= rule.resolutionTime) resolutionMet++;
          }
        }

        res.json({
          success: true,
          data: {
            totalConversations: conversations.length,
            totalWithSLA,
            firstResponseCompliance: totalWithSLA > 0 ? (firstResponseMet / totalWithSLA) * 100 : 0,
            resolutionCompliance: totalWithSLA > 0 ? (resolutionMet / totalWithSLA) * 100 : 0,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // ===== CSAT (Customer Satisfaction) =====

  // Submit CSAT survey
  router.post('/csat/surveys',
    validateBody(csatSurveySchema),
    async (req, res, next) => {
      try {
        const { conversationId, rating, comment, tags } = req.body;

        // Verify conversation exists
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
        });

        if (!conversation) {
          return res.status(404).json({
            success: false,
            error: { message: 'Conversation not found' },
          });
        }

        const survey = await prisma.cSATSurvey.create({
          data: {
            conversationId,
            rating,
            comment,
            tags,
            companyId: conversation.companyId,
          },
        });

        // Update conversation
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { csatRating: rating },
        });

        await eventBus.publish(Events.CSAT_SUBMITTED, {
          type: Events.CSAT_SUBMITTED,
          version: 'v1',
          timestamp: new Date(),
          companyId: conversation.companyId,
          data: { surveyId: survey.id, rating, conversationId },
        });

        res.status(201).json({ success: true, data: survey });
      } catch (error) {
        next(error);
      }
    }
  );

  // Get CSAT surveys
  router.get('/csat/surveys',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    async (req, res, next) => {
      try {
        const { startDate, endDate, minRating, maxRating, page = '1', limit = '20' } = req.query;

        const where: any = { companyId: req.companyId! };
        
        if (startDate || endDate) {
          where.createdAt = {};
          if (startDate) where.createdAt.gte = new Date(startDate as string);
          if (endDate) where.createdAt.lte = new Date(endDate as string);
        }

        if (minRating) where.rating = { gte: parseInt(minRating as string) };
        if (maxRating) where.rating = { ...where.rating, lte: parseInt(maxRating as string) };

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        const [surveys, total] = await Promise.all([
          prisma.cSATSurvey.findMany({
            where,
            skip,
            take: parseInt(limit as string),
            include: {
              conversation: {
                select: {
                  id: true,
                  contactId: true,
                  assignedToId: true,
                  channel: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          }),
          prisma.cSATSurvey.count({ where }),
        ]);

        res.json({
          success: true,
          data: surveys,
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
    }
  );

  // Get CSAT statistics
  router.get('/csat/stats',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    async (req, res, next) => {
      try {
        const { startDate, endDate } = req.query;

        const where: any = { companyId: req.companyId! };
        
        if (startDate || endDate) {
          where.createdAt = {};
          if (startDate) where.createdAt.gte = new Date(startDate as string);
          if (endDate) where.createdAt.lte = new Date(endDate as string);
        }

        const [
          totalSurveys,
          avgRating,
          ratingDistribution,
          npsScores,
        ] = await Promise.all([
          prisma.cSATSurvey.count({ where }),
          prisma.cSATSurvey.aggregate({
            where,
            _avg: { rating: true },
          }),
          prisma.cSATSurvey.groupBy({
            by: ['rating'],
            where,
            _count: true,
          }),
          // NPS calculation (promoters - detractors)
          prisma.cSATSurvey.findMany({
            where,
            select: { rating: true },
          }),
        ]);

        // Calculate NPS
        const promoters = npsScores.filter((s: any) => s.rating >= 4).length;
        const detractors = npsScores.filter((s: any) => s.rating <= 2).length;
        const nps = totalSurveys > 0 
          ? ((promoters - detractors) / totalSurveys) * 100 
          : 0;

        res.json({
          success: true,
          data: {
            totalSurveys,
            averageRating: avgRating._avg.rating || 0,
            nps,
            distribution: ratingDistribution.map((r: any) => ({
              rating: r.rating,
              count: r._count,
              percentage: (r._count / totalSurveys) * 100,
            })),
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // Get CSAT by agent
  router.get('/csat/by-agent',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    async (req, res, next) => {
      try {
        const { startDate, endDate } = req.query;

        const where: any = { companyId: req.companyId! };
        
        if (startDate || endDate) {
          where.createdAt = {};
          if (startDate) where.createdAt.gte = new Date(startDate as string);
          if (endDate) where.createdAt.lte = new Date(endDate as string);
        }

        const surveys = await prisma.cSATSurvey.findMany({
          where,
          include: {
            conversation: {
              include: {
                assignedTo: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        });

        // Group by agent
        const byAgent: Record<string, any> = {};

        for (const survey of surveys) {
          if (!survey.conversation.assignedTo) continue;

          const agentId = survey.conversation.assignedTo.id;
          if (!byAgent[agentId]) {
            byAgent[agentId] = {
              agent: survey.conversation.assignedTo,
              totalSurveys: 0,
              totalRating: 0,
              ratings: [],
            };
          }

          byAgent[agentId].totalSurveys++;
          byAgent[agentId].totalRating += survey.rating;
          byAgent[agentId].ratings.push(survey.rating);
        }

        const result = Object.values(byAgent).map((data: any) => ({
          agent: data.agent,
          totalSurveys: data.totalSurveys,
          averageRating: data.totalRating / data.totalSurveys,
          ratings: data.ratings,
        }));

        res.json({ success: true, data: result });
      } catch (error) {
        next(error);
      }
    }
  );
}
