// src/modules/omnichannel/chatbot.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission, validateBody } from '../../core/middleware';
import { EventBus, Events } from '../../core/event-bus';
import { z } from 'zod';

const flowNodeSchema = z.object({
  id: z.string(),
  type: z.enum(['message', 'question', 'condition', 'action', 'api_call']),
  data: z.object({
    message: z.string().optional(),
    options: z.array(z.string()).optional(),
    variable: z.string().optional(),
    condition: z.string().optional(),
    actionType: z.string().optional(),
    apiUrl: z.string().optional(),
  }),
  nextNodes: z.array(z.string()),
  position: z.object({ x: z.number(), y: z.number() }),
});

const chatbotSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  trigger: z.object({
    type: z.enum(['keyword', 'intent', 'always', 'schedule']),
    value: z.string().optional(),
    schedule: z.string().optional(),
  }),
  flow: z.array(flowNodeSchema),
  active: z.boolean().default(true),
  channels: z.array(z.string()).default(['whatsapp', 'webchat']),
});

const cannedResponseSchema = z.object({
  title: z.string(),
  content: z.string(),
  shortcut: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export function setupChatbotRoutes(router: Router, prisma: PrismaClient, eventBus: EventBus) {
  
  // Create chatbot
  router.post('/chatbots',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_UPDATE),
    validateBody(chatbotSchema),
    async (req, res, next) => {
      try {
        const chatbot = await prisma.chatbot.create({
          data: {
            ...req.body,
            flow: JSON.stringify(req.body.flow),
            trigger: JSON.stringify(req.body.trigger),
            channels: req.body.channels,
            companyId: req.companyId!,
            createdById: req.user!.id,
          },
        });

        res.status(201).json({ success: true, data: chatbot });
      } catch (error) {
        next(error);
      }
    }
  );

  // List chatbots
  router.get('/chatbots',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    async (req, res, next) => {
      try {
        const { active, channel } = req.query;

        const where: any = { companyId: req.companyId! };
        if (active !== undefined) where.active = active === 'true';
        if (channel) where.channels = { has: channel };

        const chatbots = await prisma.chatbot.findMany({
          where,
          include: {
            createdBy: { select: { id: true, name: true } },
            _count: { select: { interactions: true } },
          },
          orderBy: { createdAt: 'desc' },
        });

        res.json({ success: true, data: chatbots });
      } catch (error) {
        next(error);
      }
    }
  );

  // Get chatbot by ID
  router.get('/chatbots/:id',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    async (req, res, next) => {
      try {
        const chatbot = await prisma.chatbot.findFirst({
          where: {
            id: req.params.id,
            companyId: req.companyId!,
          },
          include: {
            createdBy: { select: { id: true, name: true } },
            _count: { select: { interactions: true } },
          },
        });

        if (!chatbot) {
          return res.status(404).json({
            success: false,
            error: { message: 'Chatbot not found' },
          });
        }

        // Parse JSON fields
        const parsed = {
          ...chatbot,
          flow: JSON.parse(chatbot.flow as string),
          trigger: JSON.parse(chatbot.trigger as string),
        };

        res.json({ success: true, data: parsed });
      } catch (error) {
        next(error);
      }
    }
  );

  // Update chatbot
  router.patch('/chatbots/:id',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_UPDATE),
    async (req, res, next) => {
      try {
        const data: any = { ...req.body };
        if (data.flow) data.flow = JSON.stringify(data.flow);
        if (data.trigger) data.trigger = JSON.stringify(data.trigger);

        const chatbot = await prisma.chatbot.update({
          where: { id: req.params.id },
          data,
        });

        res.json({ success: true, data: chatbot });
      } catch (error) {
        next(error);
      }
    }
  );

  // Delete chatbot
  router.delete('/chatbots/:id',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_DELETE),
    async (req, res, next) => {
      try {
        await prisma.chatbot.delete({
          where: { id: req.params.id },
        });

        res.json({ success: true, message: 'Chatbot deleted' });
      } catch (error) {
        next(error);
      }
    }
  );

  // Execute chatbot (process user message)
  router.post('/chatbots/:id/execute',
    authenticate,
    tenantIsolation,
    validateBody(z.object({
      conversationId: z.string(),
      message: z.string(),
      context: z.record(z.any()).optional(),
    })),
    async (req, res, next) => {
      try {
        const { conversationId, message, context = {} } = req.body;

        const chatbot = await prisma.chatbot.findFirst({
          where: {
            id: req.params.id,
            companyId: req.companyId!,
            isActive: true,
          },
        });

        if (!chatbot) {
          return res.status(404).json({
            success: false,
            error: { message: 'Chatbot not found or inactive' },
          });
        }

        const flow = JSON.parse(chatbot.flow as string);
        
        // Get conversation state
        let state = await prisma.chatbotState.findFirst({
          where: {
            chatbotId: chatbot.id,
            conversationId,
          },
        });

        if (!state) {
          state = await prisma.chatbotState.create({
            data: {
              chatbotId: chatbot.id,
              conversationId,
              currentNodeId: flow[0].id,
              variables: JSON.stringify({}),
            },
          });
        }

        // Get current node
        const currentNode = flow.find((n: any) => n.id === state!.currentNodeId);
        const variables = JSON.parse(state.variables as string);

        // Process node
        let response: any = {};
        let nextNodeId: string | null = null;

        switch (currentNode.type) {
          case 'message':
            response = {
              type: 'message',
              content: interpolateVariables(currentNode.data.message, { ...variables, ...context }),
            };
            nextNodeId = currentNode.nextNodes[0];
            break;

          case 'question':
            // Save user response
            if (message) {
              variables[currentNode.data.variable!] = message;
            }
            
            response = {
              type: 'question',
              content: currentNode.data.message,
              options: currentNode.data.options,
            };
            
            if (message && currentNode.data.options) {
              const optionIndex = currentNode.data.options.findIndex((o: string) => 
                o.toLowerCase() === message.toLowerCase()
              );
              nextNodeId = currentNode.nextNodes[optionIndex] || currentNode.nextNodes[0];
            }
            break;

          case 'condition':
            // Evaluate condition
            const conditionMet = evaluateCondition(currentNode.data.condition!, variables);
            nextNodeId = currentNode.nextNodes[conditionMet ? 0 : 1];
            
            // Recurse to next node immediately
            return res.json({ success: true, data: { continue: true } });

          case 'action':
            // Execute action (e.g., create ticket, notify agent)
            if (currentNode.data.actionType === 'notify_agent') {
              await eventBus.publish(Events.CONVERSATION_ASSIGNED, {
                type: Events.CONVERSATION_ASSIGNED,
                version: 'v1',
                timestamp: new Date(),
                companyId: req.companyId!,
                data: { conversationId },
              });
            }
            nextNodeId = currentNode.nextNodes[0];
            break;

          case 'api_call':
            // Make API call (simplified)
            try {
              const apiResponse = await fetch(currentNode.data.apiUrl!, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(variables),
              });
              const apiData = await apiResponse.json();
              Object.assign(variables, apiData);
            } catch (error) {
              console.error('API call failed:', error);
            }
            nextNodeId = currentNode.nextNodes[0];
            break;
        }

        // Update state
        await prisma.chatbotState.update({
          where: { id: state.id },
          data: {
            currentNodeId: nextNodeId || state.currentNodeId,
            variables: JSON.stringify(variables),
          },
        });

        // Save interaction
        await prisma.chatbotInteraction.create({
          data: {
            chatbotId: chatbot.id,
            conversationId,
            nodeId: currentNode.id,
            userMessage: message,
            botResponse: JSON.stringify(response),
            variables: JSON.stringify(variables),
          },
        });

        res.json({ 
          success: true, 
          data: {
            ...response,
            finished: !nextNodeId,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // Reset chatbot state
  router.post('/chatbots/:id/reset',
    authenticate,
    tenantIsolation,
    validateBody(z.object({
      conversationId: z.string(),
    })),
    async (req, res, next) => {
      try {
        await prisma.chatbotState.deleteMany({
          where: {
            chatbotId: req.params.id,
            conversationId: req.body.conversationId,
          },
        });

        res.json({ success: true, message: 'Chatbot state reset' });
      } catch (error) {
        next(error);
      }
    }
  );

  // Chatbot analytics
  router.get('/chatbots/:id/analytics',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    async (req, res, next) => {
      try {
        const [totalInteractions, uniqueConversations, completionRate] = await Promise.all([
          prisma.chatbotInteraction.count({
            where: { chatbotId: req.params.id },
          }),
          prisma.chatbotInteraction.groupBy({
            by: ['conversationId'],
            where: { chatbotId: req.params.id },
          }),
          // Calculate completion rate (simplified)
          prisma.chatbotState.count({
            where: {
              chatbotId: req.params.id,
              currentNodeId: { not: null },
            },
          }),
        ]);

        res.json({
          success: true,
          data: {
            totalInteractions,
            uniqueConversations: uniqueConversations.length,
            completionRate: completionRate > 0 ? (totalInteractions / completionRate) * 100 : 0,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // ===== CANNED RESPONSES =====

  // Create canned response
  router.post('/canned-responses',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_UPDATE),
    validateBody(cannedResponseSchema),
    async (req, res, next) => {
      try {
        const response = await prisma.cannedResponse.create({
          data: {
            ...req.body,
            companyId: req.companyId!,
            createdById: req.user!.id,
          },
        });

        res.status(201).json({ success: true, data: response });
      } catch (error) {
        next(error);
      }
    }
  );

  // List canned responses
  router.get('/canned-responses',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    async (req, res, next) => {
      try {
        const { category, search } = req.query;

        const where: any = { companyId: req.companyId! };
        
        if (category) where.category = category;
        if (search) {
          where.OR = [
            { title: { contains: search as string, mode: 'insensitive' } },
            { content: { contains: search as string, mode: 'insensitive' } },
          ];
        }

        const responses = await prisma.cannedResponse.findMany({
          where,
          include: {
            createdBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        });

        res.json({ success: true, data: responses });
      } catch (error) {
        next(error);
      }
    }
  );

  // Get canned response by shortcut
  router.get('/canned-responses/shortcut/:shortcut',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    async (req, res, next) => {
      try {
        const response = await prisma.cannedResponse.findFirst({
          where: {
            shortcut: req.params.shortcut,
            companyId: req.companyId!,
          },
        });

        if (!response) {
          return res.status(404).json({
            success: false,
            error: { message: 'Canned response not found' },
          });
        }

        res.json({ success: true, data: response });
      } catch (error) {
        next(error);
      }
    }
  );

  // Update canned response
  router.patch('/canned-responses/:id',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_UPDATE),
    async (req, res, next) => {
      try {
        const response = await prisma.cannedResponse.update({
          where: { id: req.params.id },
          data: req.body,
        });

        res.json({ success: true, data: response });
      } catch (error) {
        next(error);
      }
    }
  );

  // Delete canned response
  router.delete('/canned-responses/:id',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_DELETE),
    async (req, res, next) => {
      try {
        await prisma.cannedResponse.delete({
          where: { id: req.params.id },
        });

        res.json({ success: true, message: 'Canned response deleted' });
      } catch (error) {
        next(error);
      }
    }
  );
}

// Helper functions
function interpolateVariables(text: string, variables: Record<string, any>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? variables[key] : match;
  });
}

function evaluateCondition(condition: string, variables: Record<string, any>): boolean {
  try {
    // Simple condition evaluation (e.g., "age > 18", "country === 'US'")
    // In production, use a safe expression evaluator
    const func = new Function(...Object.keys(variables), `return ${condition}`);
    return func(...Object.values(variables));
  } catch {
    return false;
  }
}
