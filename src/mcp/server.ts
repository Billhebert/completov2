// src/mcp/server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { PrismaClient } from '@prisma/client';
import { logger } from '../core/logger';

// Initialize Prisma
const prisma = new PrismaClient();

// Initialize MCP Server
const server = new Server(
  {
    name: 'omni-platform-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

// ===========================================
// TOOLS (Actions the LLM can perform)
// ===========================================

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // CRM Tools
      {
        name: 'crm_create_contact',
        description: 'Create a new contact in the CRM',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Contact name' },
            email: { type: 'string', description: 'Contact email' },
            phone: { type: 'string', description: 'Phone number' },
            companyName: { type: 'string', description: 'Company name' },
            companyId: { type: 'string', description: 'Company ID for multi-tenant' },
          },
          required: ['name', 'companyId'],
        },
      },
      {
        name: 'crm_list_contacts',
        description: 'List contacts from the CRM',
        inputSchema: {
          type: 'object',
          properties: {
            companyId: { type: 'string', description: 'Company ID' },
            search: { type: 'string', description: 'Search query' },
            limit: { type: 'number', description: 'Number of results', default: 20 },
          },
          required: ['companyId'],
        },
      },
      {
        name: 'crm_create_deal',
        description: 'Create a new deal in the CRM',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Deal title' },
            contactId: { type: 'string', description: 'Contact ID' },
            value: { type: 'number', description: 'Deal value' },
            currency: { type: 'string', description: 'Currency code', default: 'USD' },
            stage: { type: 'string', description: 'Deal stage', default: 'lead' },
            companyId: { type: 'string', description: 'Company ID' },
            ownerId: { type: 'string', description: 'Owner user ID' },
          },
          required: ['title', 'contactId', 'value', 'companyId', 'ownerId'],
        },
      },
      {
        name: 'crm_list_deals',
        description: 'List deals from the CRM',
        inputSchema: {
          type: 'object',
          properties: {
            companyId: { type: 'string', description: 'Company ID' },
            stage: { type: 'string', description: 'Filter by stage' },
            limit: { type: 'number', description: 'Number of results', default: 20 },
          },
          required: ['companyId'],
        },
      },
      
      // Knowledge Base Tools
      {
        name: 'knowledge_search',
        description: 'Search the knowledge base using semantic search',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            companyId: { type: 'string', description: 'Company ID' },
            limit: { type: 'number', description: 'Number of results', default: 5 },
          },
          required: ['query', 'companyId'],
        },
      },
      {
        name: 'knowledge_create_node',
        description: 'Create a new knowledge node',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Node title' },
            content: { type: 'string', description: 'Node content' },
            nodeType: { 
              type: 'string', 
              enum: ['zettel', 'documentation', 'procedure', 'reference', 'insight'],
              description: 'Type of knowledge node' 
            },
            companyId: { type: 'string', description: 'Company ID' },
            createdById: { type: 'string', description: 'Creator user ID' },
          },
          required: ['title', 'content', 'nodeType', 'companyId', 'createdById'],
        },
      },
      
      // Search Tools
      {
        name: 'global_search',
        description: 'Search across all entities (contacts, deals, messages, knowledge, etc)',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            companyId: { type: 'string', description: 'Company ID' },
            type: { 
              type: 'string',
              enum: ['contacts', 'deals', 'messages', 'knowledge', 'users', 'products', 'all'],
              description: 'Entity type to search',
              default: 'all'
            },
            limit: { type: 'number', description: 'Number of results per type', default: 5 },
          },
          required: ['query', 'companyId'],
        },
      },
      
      // Analytics Tools
      {
        name: 'analytics_get_dashboard',
        description: 'Get dashboard analytics and metrics',
        inputSchema: {
          type: 'object',
          properties: {
            companyId: { type: 'string', description: 'Company ID' },
            startDate: { type: 'string', description: 'Start date (ISO format)' },
            endDate: { type: 'string', description: 'End date (ISO format)' },
          },
          required: ['companyId'],
        },
      },
      {
        name: 'analytics_get_pipeline',
        description: 'Get sales pipeline analytics',
        inputSchema: {
          type: 'object',
          properties: {
            companyId: { type: 'string', description: 'Company ID' },
          },
          required: ['companyId'],
        },
      },
      
      // File Tools
      {
        name: 'files_list',
        description: 'List files uploaded to the platform',
        inputSchema: {
          type: 'object',
          properties: {
            companyId: { type: 'string', description: 'Company ID' },
            entityType: { type: 'string', description: 'Filter by entity type' },
            entityId: { type: 'string', description: 'Filter by entity ID' },
            limit: { type: 'number', description: 'Number of results', default: 20 },
          },
          required: ['companyId'],
        },
      },
    ],
  };
});

// ===========================================
// TOOL EXECUTION
// ===========================================

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    throw new Error('Arguments are required');
  }

  try {
    switch (name) {
      // CRM Tools
      case 'crm_create_contact': {
        const contact = await prisma.contact.create({
          data: {
            name: args.name as string,
            email: args.email as string,
            phone: args.phone as string,
            companyName: args.companyName as string,
            companyId: args.companyId as string,
          },
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, data: contact }, null, 2),
            },
          ],
        };
      }

      case 'crm_list_contacts': {
        const where: any = { companyId: args.companyId as string };
        
        if (args.search) {
          where.OR = [
            { name: { contains: args.search as string, mode: 'insensitive' } },
            { email: { contains: args.search as string, mode: 'insensitive' } },
          ];
        }
        
        const contacts = await prisma.contact.findMany({
          where,
          take: (args.limit as number) || 20,
          include: {
            _count: { select: { deals: true, interactions: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, data: contacts, count: contacts.length }, null, 2),
            },
          ],
        };
      }

      case 'crm_create_deal': {
        const deal = await prisma.deal.create({
          data: {
            title: args.title as string,
            contactId: args.contactId as string,
            value: args.value as number,
            currency: (args.currency as string) || 'USD',
            stage: (args.stage as string) || 'lead',
            companyId: args.companyId as string,
            ownerId: args.ownerId as string,
          },
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, data: deal }, null, 2),
            },
          ],
        };
      }

      case 'crm_list_deals': {
        const where: any = { companyId: args.companyId as string };
        if (args.stage) where.stage = args.stage;
        
        const deals = await prisma.deal.findMany({
          where,
          take: (args.limit as number) || 20,
          include: {
            contact: { select: { id: true, name: true, email: true } },
            owner: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, data: deals, count: deals.length }, null, 2),
            },
          ],
        };
      }

      // Knowledge Base Tools
      case 'knowledge_search': {
        const nodes = await prisma.knowledgeNode.findMany({
          where: {
            companyId: args.companyId as string,
            OR: [
              { title: { contains: args.query as string, mode: 'insensitive' } },
              { content: { contains: args.query as string, mode: 'insensitive' } },
            ],
          },
          take: (args.limit as number) || 5,
          include: {
            createdBy: { select: { id: true, name: true } },
          },
          orderBy: { importanceScore: 'desc' },
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, data: nodes, count: nodes.length }, null, 2),
            },
          ],
        };
      }

      case 'knowledge_create_node': {
        const node = await prisma.knowledgeNode.create({
          data: {
            title: args.title as string,
            content: args.content as string,
            nodeType: args.nodeType as any,
            companyId: args.companyId as string,
            createdById: args.createdById as string,
          },
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, data: node }, null, 2),
            },
          ],
        };
      }

      // Search Tool
      case 'global_search': {
        const query = args.query as string;
        const companyId = args.companyId as string;
        const type = (args.type as string) || 'all';
        const limit = (args.limit as number) || 5;
        
        const results: any = {};
        
        if (type === 'all' || type === 'contacts') {
          results.contacts = await prisma.contact.findMany({
            where: {
              companyId,
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
              ],
            },
            take: limit,
          });
        }
        
        if (type === 'all' || type === 'deals') {
          results.deals = await prisma.deal.findMany({
            where: {
              companyId,
              title: { contains: query, mode: 'insensitive' },
            },
            take: limit,
          });
        }
        
        if (type === 'all' || type === 'knowledge') {
          results.knowledge = await prisma.knowledgeNode.findMany({
            where: {
              companyId,
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { content: { contains: query, mode: 'insensitive' } },
              ],
            },
            take: limit,
          });
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, data: results }, null, 2),
            },
          ],
        };
      }

      // Analytics Tools
      case 'analytics_get_dashboard': {
        const companyId = args.companyId as string;
        
        const [
          totalContacts,
          totalDeals,
          totalRevenue,
          dealsByStage,
        ] = await Promise.all([
          prisma.contact.count({ where: { companyId } }),
          prisma.deal.count({ where: { companyId } }),
          prisma.deal.aggregate({
            where: { companyId, stage: 'won' },
            _sum: { value: true },
          }),
          prisma.deal.groupBy({
            by: ['stage'],
            where: { companyId },
            _count: true,
            _sum: { value: true },
          }),
        ]);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                data: {
                  totalContacts,
                  totalDeals,
                  totalRevenue: totalRevenue._sum.value || 0,
                  dealsByStage,
                },
              }, null, 2),
            },
          ],
        };
      }

      case 'analytics_get_pipeline': {
        const pipeline = await prisma.deal.groupBy({
          by: ['stage'],
          where: { companyId: args.companyId as string },
          _count: true,
          _sum: { value: true },
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, data: pipeline }, null, 2),
            },
          ],
        };
      }

      // File Tools
      case 'files_list': {
        const where: any = { companyId: args.companyId as string };
        if (args.entityType) where.entityType = args.entityType;
        if (args.entityId) where.entityId = args.entityId;
        
        const files = await prisma.file.findMany({
          where,
          take: (args.limit as number) || 20,
          include: {
            uploadedBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, data: files, count: files.length }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    logger.error({ error, tool: name }, 'MCP tool execution error');
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ success: false, error: error.message }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// ===========================================
// RESOURCES (Data the LLM can read)
// ===========================================

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'omni://crm/contacts',
        name: 'CRM Contacts',
        description: 'List of all CRM contacts',
        mimeType: 'application/json',
      },
      {
        uri: 'omni://crm/deals',
        name: 'CRM Deals',
        description: 'List of all CRM deals',
        mimeType: 'application/json',
      },
      {
        uri: 'omni://knowledge/nodes',
        name: 'Knowledge Base',
        description: 'All knowledge base nodes',
        mimeType: 'application/json',
      },
      {
        uri: 'omni://analytics/dashboard',
        name: 'Analytics Dashboard',
        description: 'Company analytics and metrics',
        mimeType: 'application/json',
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  
  // Extract companyId from query params (uri format: omni://path?companyId=xxx)
  const url = new URL(uri);
  const companyId = url.searchParams.get('companyId');
  
  if (!companyId) {
    throw new Error('companyId is required in resource URI');
  }

  try {
    switch (url.pathname) {
      case '//crm/contacts': {
        const contacts = await prisma.contact.findMany({
          where: { companyId },
          take: 100,
          include: {
            _count: { select: { deals: true, interactions: true } },
          },
        });
        
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(contacts, null, 2),
            },
          ],
        };
      }

      case '//crm/deals': {
        const deals = await prisma.deal.findMany({
          where: { companyId },
          take: 100,
          include: {
            contact: true,
            owner: true,
          },
        });
        
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(deals, null, 2),
            },
          ],
        };
      }

      case '//knowledge/nodes': {
        const nodes = await prisma.knowledgeNode.findMany({
          where: { companyId },
          take: 100,
        });
        
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(nodes, null, 2),
            },
          ],
        };
      }

      case '//analytics/dashboard': {
        const [totalContacts, totalDeals, totalRevenue] = await Promise.all([
          prisma.contact.count({ where: { companyId } }),
          prisma.deal.count({ where: { companyId } }),
          prisma.deal.aggregate({
            where: { companyId, stage: 'won' },
            _sum: { value: true },
          }),
        ]);
        
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify({
                totalContacts,
                totalDeals,
                totalRevenue: totalRevenue._sum.value || 0,
              }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown resource: ${uri}`);
    }
  } catch (error: any) {
    logger.error({ error, uri }, 'MCP resource read error');
    throw error;
  }
});

// ===========================================
// PROMPTS (Reusable prompt templates)
// ===========================================

server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: 'analyze_sales_pipeline',
        description: 'Analyze the sales pipeline and provide insights',
        arguments: [
          {
            name: 'companyId',
            description: 'Company ID to analyze',
            required: true,
          },
        ],
      },
      {
        name: 'summarize_contact_interactions',
        description: 'Summarize all interactions with a contact',
        arguments: [
          {
            name: 'contactId',
            description: 'Contact ID to summarize',
            required: true,
          },
          {
            name: 'companyId',
            description: 'Company ID',
            required: true,
          },
        ],
      },
      {
        name: 'suggest_next_actions',
        description: 'Suggest next actions for deals in the pipeline',
        arguments: [
          {
            name: 'companyId',
            description: 'Company ID',
            required: true,
          },
        ],
      },
    ],
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'analyze_sales_pipeline': {
      const pipeline = await prisma.deal.groupBy({
        by: ['stage'],
        where: { companyId: args?.companyId as string },
        _count: true,
        _sum: { value: true },
      });
      
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Analyze this sales pipeline data and provide insights:\n\n${JSON.stringify(pipeline, null, 2)}\n\nProvide analysis on:\n1. Pipeline health\n2. Bottlenecks\n3. Revenue forecasting\n4. Recommendations`,
            },
          },
        ],
      };
    }

    case 'summarize_contact_interactions': {
      const interactions = await prisma.interaction.findMany({
        where: {
          contactId: args?.contactId as string,
          companyId: args?.companyId as string,
        },
        include: {
          user: { select: { name: true } },
        },
        orderBy: { timestamp: 'desc' },
        take: 50,
      });
      
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Summarize these interactions:\n\n${JSON.stringify(interactions, null, 2)}\n\nProvide:\n1. Key conversation points\n2. Follow-up actions needed\n3. Relationship status`,
            },
          },
        ],
      };
    }

    case 'suggest_next_actions': {
      const deals = await prisma.deal.findMany({
        where: {
          companyId: args?.companyId as string,
          stage: { notIn: ['won', 'lost'] },
        },
        include: {
          contact: true,
          owner: true,
        },
        orderBy: { expectedCloseDate: 'asc' },
        take: 20,
      });
      
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Based on these active deals, suggest next actions:\n\n${JSON.stringify(deals, null, 2)}\n\nFor each deal, suggest:\n1. Immediate next step\n2. Priority level\n3. Potential risks`,
            },
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
});

// ===========================================
// START SERVER
// ===========================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  logger.info('OMNI Platform MCP Server running on stdio');
}

main().catch((error) => {
  logger.error({ error }, 'Fatal MCP server error');
  process.exit(1);
});
