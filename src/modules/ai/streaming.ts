// src/modules/ai/streaming.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission, validateBody } from '../../core/middleware';
import { z } from 'zod';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const chatCompletionSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant', 'function']),
    content: z.string(),
    name: z.string().optional(),
  })),
  model: z.string().default('gpt-4-turbo-preview'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().positive().optional(),
  stream: z.boolean().default(false),
  tools: z.array(z.any()).optional(),
  toolChoice: z.string().optional(),
});

export function setupAIStreamingRoutes(router: Router, prisma: PrismaClient) {
  
  // Chat completion with streaming
  router.post('/ai/chat/completions',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    validateBody(chatCompletionSchema),
    async (req, res, next) => {
      try {
        const { messages, model, temperature, maxTokens, stream, tools, toolChoice } = req.body;

        if (stream) {
          // Set headers for SSE
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');

          const streamResponse = await openai.chat.completions.create({
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
            stream: true,
            tools: tools as any,
            tool_choice: toolChoice as any,
          });

          // Save conversation start
          const conversation = await prisma.aiConversation.create({
            data: {
              companyId: req.companyId!,
              userId: req.user!.id,
              model,
              messages: JSON.stringify(messages),
              status: 'streaming',
            },
          });

          let fullResponse = '';

          for await (const chunk of streamResponse) {
            const content = chunk.choices[0]?.delta?.content || '';
            const toolCalls = chunk.choices[0]?.delta?.tool_calls;
            
            fullResponse += content;

            // Send SSE event
            if (content) {
              res.write(`data: ${JSON.stringify({ 
                type: 'content',
                content,
                conversationId: conversation.id,
              })}\n\n`);
            }

            if (toolCalls) {
              res.write(`data: ${JSON.stringify({ 
                type: 'tool_calls',
                toolCalls,
                conversationId: conversation.id,
              })}\n\n`);
            }

            // Handle finish reason
            if (chunk.choices[0]?.finish_reason) {
              res.write(`data: ${JSON.stringify({ 
                type: 'done',
                finishReason: chunk.choices[0].finish_reason,
                conversationId: conversation.id,
              })}\n\n`);
            }
          }

          // Update conversation with final response
          await prisma.aiConversation.update({
            where: { id: conversation.id },
            data: {
              response: fullResponse,
              status: 'completed',
              completedAt: new Date(),
            },
          });

          res.write(`data: [DONE]\n\n`);
          res.end();

        } else {
          // Non-streaming response
          const completion = await openai.chat.completions.create({
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
            tools: tools as any,
            tool_choice: toolChoice as any,
          });

          // Save conversation
          await prisma.aiConversation.create({
            data: {
              companyId: req.companyId!,
              userId: req.user!.id,
              model,
              messages: JSON.stringify(messages),
              response: completion.choices[0].message.content || '',
              status: 'completed',
              completedAt: new Date(),
              tokensUsed: completion.usage?.total_tokens,
            },
          });

          res.json({ 
            success: true, 
            data: completion.choices[0].message,
            usage: completion.usage,
          });
        }
      } catch (error) {
        next(error);
      }
    }
  );

  // AI content generation
  router.post('/ai/generate/email',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    validateBody(z.object({
      context: z.string(),
      tone: z.enum(['formal', 'casual', 'friendly', 'professional']).default('professional'),
      length: z.enum(['short', 'medium', 'long']).default('medium'),
    })),
    async (req, res, next) => {
      try {
        const { context, tone, length } = req.body;

        const lengthGuide = {
          short: '2-3 paragraphs',
          medium: '4-5 paragraphs',
          long: '6-8 paragraphs',
        };

        const completion = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: `You are an expert email writer. Write a ${tone} email with ${lengthGuide[length]}.`,
            },
            {
              role: 'user',
              content: `Write an email based on this context: ${context}`,
            },
          ],
          temperature: 0.7,
        });

        res.json({ 
          success: true, 
          data: {
            email: completion.choices[0].message.content,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // AI summarization
  router.post('/ai/summarize',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    validateBody(z.object({
      text: z.string(),
      length: z.enum(['brief', 'detailed']).default('brief'),
    })),
    async (req, res, next) => {
      try {
        const { text, length } = req.body;

        const lengthInstruction = length === 'brief' 
          ? 'in 2-3 sentences' 
          : 'in 1-2 paragraphs with key points';

        const completion = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: `You are an expert at summarization. Provide clear, concise summaries.`,
            },
            {
              role: 'user',
              content: `Summarize this text ${lengthInstruction}:\n\n${text}`,
            },
          ],
          temperature: 0.3,
        });

        res.json({ 
          success: true, 
          data: {
            summary: completion.choices[0].message.content,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // AI sentiment analysis
  router.post('/ai/sentiment',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    validateBody(z.object({
      text: z.string(),
    })),
    async (req, res, next) => {
      try {
        const { text } = req.body;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: `You are a sentiment analysis expert. Analyze the sentiment and return ONLY a JSON object with: 
              - sentiment: "positive", "negative", or "neutral"
              - confidence: 0-1
              - reasoning: brief explanation`,
            },
            {
              role: 'user',
              content: text,
            },
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' },
        });

        const analysis = JSON.parse(completion.choices[0].message.content || '{}');

        res.json({ 
          success: true, 
          data: analysis,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // AI entity extraction
  router.post('/ai/extract',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    validateBody(z.object({
      text: z.string(),
      entities: z.array(z.string()).default(['person', 'organization', 'location', 'date']),
    })),
    async (req, res, next) => {
      try {
        const { text, entities } = req.body;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: `Extract these entities from text: ${entities.join(', ')}. 
              Return ONLY a JSON object with entity types as keys and arrays of found entities as values.`,
            },
            {
              role: 'user',
              content: text,
            },
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' },
        });

        const extracted = JSON.parse(completion.choices[0].message.content || '{}');

        res.json({ 
          success: true, 
          data: extracted,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // AI classification
  router.post('/ai/classify',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    validateBody(z.object({
      text: z.string(),
      categories: z.array(z.string()),
    })),
    async (req, res, next) => {
      try {
        const { text, categories } = req.body;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: `Classify the text into ONE of these categories: ${categories.join(', ')}.
              Return ONLY a JSON object with: 
              - category: the chosen category
              - confidence: 0-1
              - reasoning: brief explanation`,
            },
            {
              role: 'user',
              content: text,
            },
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' },
        });

        const classification = JSON.parse(completion.choices[0].message.content || '{}');

        res.json({ 
          success: true, 
          data: classification,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // AI function calling (autonomous agents)
  router.post('/ai/agent/execute',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    validateBody(z.object({
      task: z.string(),
      availableFunctions: z.array(z.string()),
    })),
    async (req, res, next) => {
      try {
        const { task, availableFunctions } = req.body;

        // Define available tools
        const tools = [
          {
            type: 'function',
            function: {
              name: 'get_contacts',
              description: 'Get list of contacts from CRM',
              parameters: {
                type: 'object',
                properties: {
                  search: { type: 'string', description: 'Search query' },
                  limit: { type: 'number', description: 'Number of results' },
                },
              },
            },
          },
          {
            type: 'function',
            function: {
              name: 'create_deal',
              description: 'Create a new deal in CRM',
              parameters: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  contactId: { type: 'string' },
                  value: { type: 'number' },
                },
                required: ['title', 'contactId', 'value'],
              },
            },
          },
          {
            type: 'function',
            function: {
              name: 'send_email',
              description: 'Send an email',
              parameters: {
                type: 'object',
                properties: {
                  to: { type: 'string' },
                  subject: { type: 'string' },
                  body: { type: 'string' },
                },
                required: ['to', 'subject', 'body'],
              },
            },
          },
        ].filter(t => availableFunctions.includes(t.function.name));

        const completion = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: 'You are an autonomous agent that can execute tasks using available functions.',
            },
            {
              role: 'user',
              content: task,
            },
          ],
          tools: tools as any,
          tool_choice: 'auto',
        });

        const message = completion.choices[0].message;

        res.json({ 
          success: true, 
          data: {
            response: message.content,
            toolCalls: message.tool_calls,
            needsExecution: !!message.tool_calls,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // Get AI conversation history
  router.get('/ai/conversations',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    async (req, res, next) => {
      try {
        const { page = '1', limit = '20' } = req.query;
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        const [conversations, total] = await Promise.all([
          prisma.aiConversation.findMany({
            where: {
              companyId: req.companyId!,
              userId: req.user!.id,
            },
            skip,
            take: parseInt(limit as string),
            orderBy: { createdAt: 'desc' },
          }),
          prisma.aiConversation.count({
            where: {
              companyId: req.companyId!,
              userId: req.user!.id,
            },
          }),
        ]);

        res.json({
          success: true,
          data: conversations,
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

  // AI cost tracking
  router.get('/ai/usage/stats',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    async (req, res, next) => {
      try {
        const { startDate, endDate } = req.query;

        const where: any = {
          companyId: req.companyId!,
        };

        if (startDate || endDate) {
          where.createdAt = {};
          if (startDate) where.createdAt.gte = new Date(startDate as string);
          if (endDate) where.createdAt.lte = new Date(endDate as string);
        }

        const [totalConversations, totalTokens, byModel] = await Promise.all([
          prisma.aiConversation.count({ where }),
          prisma.aiConversation.aggregate({
            where,
            _sum: { tokensUsed: true },
          }),
          prisma.aiConversation.groupBy({
            by: ['model'],
            where,
            _count: true,
            _sum: { tokensUsed: true },
          }),
        ]);

        // Estimate cost (rough pricing)
        const estimatedCost = (totalTokens._sum.tokensUsed || 0) * 0.00002; // $0.02 per 1K tokens

        res.json({
          success: true,
          data: {
            totalConversations,
            totalTokens: totalTokens._sum.tokensUsed || 0,
            estimatedCost,
            byModel,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );
}
