import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { workflowExecutor } from './engine/executor';
import { logger } from '@core/logger';
import { eventBus } from '@core/event-bus';

const router = Router();
const prisma = new PrismaClient();

// ============================================
// SCHEMAS
// ============================================

const WorkflowSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  definition: z.object({
    nodes: z.array(z.any()),
    edges: z.array(z.any())
  })
});

// ============================================
// ROUTES
// ============================================

/**
 * GET /api/v1/automations/workflows
 * Listar workflows da empresa
 */
router.get('/workflows', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user!;
    const { status } = req.query;

    const where: any = { companyId };
    if (status) where.status = status;

    const workflows = await prisma.workflow.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        version: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { executions: true } }
      }
    });

    res.json({ data: workflows });
  } catch (error: any) {
    logger.error({ error }, 'Error listing workflows');
    res.status(500).json({ error: 'Failed to list workflows' });
  }
});

/**
 * GET /api/v1/automations/workflows/:id
 * Buscar workflow por ID
 */
router.get('/workflows/:id', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user!;
    const { id } = req.params;

    const workflow = await prisma.workflow.findFirst({
      where: { id, companyId },
      include: {
        executions: {
          take: 10,
          orderBy: { startedAt: 'desc' }
        }
      }
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    res.json(workflow);
  } catch (error: any) {
    logger.error({ error }, 'Error fetching workflow');
    res.status(500).json({ error: 'Failed to fetch workflow' });
  }
});

/**
 * POST /api/v1/automations/workflows
 * Criar novo workflow
 */
router.post('/workflows', async (req: Request, res: Response) => {
  try {
    const { companyId, id: userId, role } = req.user!;

    // Apenas admin/supervisor podem criar workflows
    if (role !== 'company_admin' && role !== 'supervisor') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const data = WorkflowSchema.parse(req.body);

    const workflow = await prisma.workflow.create({
      data: {
        companyId,
        name: data.name,
        description: data.description,
        definition: data.definition as any,
        createdBy: userId,
        status: 'DRAFT',
        version: 1
      }
    });

    logger.info({ workflowId: workflow.id, userId }, 'Workflow created');
    res.status(201).json(workflow);

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    logger.error({ error }, 'Error creating workflow');
    res.status(500).json({ error: 'Failed to create workflow' });
  }
});

/**
 * PATCH /api/v1/automations/workflows/:id
 * Atualizar workflow
 */
router.patch('/workflows/:id', async (req: Request, res: Response) => {
  try {
    const { companyId, role } = req.user!;
    const { id } = req.params;

    if (role !== 'company_admin' && role !== 'supervisor') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const workflow = await prisma.workflow.findFirst({
      where: { id, companyId }
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const { name, description, definition } = req.body;

    const updated = await prisma.workflow.update({
      where: { id },
      data: {
        name: name || workflow.name,
        description: description !== undefined ? description : workflow.description,
        definition: definition || workflow.definition,
        version: workflow.version + 1
      }
    });

    res.json(updated);

  } catch (error: any) {
    logger.error({ error }, 'Error updating workflow');
    res.status(500).json({ error: 'Failed to update workflow' });
  }
});

/**
 * DELETE /api/v1/automations/workflows/:id
 * Deletar workflow
 */
router.delete('/workflows/:id', async (req: Request, res: Response) => {
  try {
    const { companyId, role } = req.user!;
    const { id } = req.params;

    if (role !== 'company_admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const workflow = await prisma.workflow.findFirst({
      where: { id, companyId }
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    await prisma.workflow.delete({ where: { id } });

    logger.info({ workflowId: id }, 'Workflow deleted');
    res.json({ message: 'Workflow deleted' });

  } catch (error: any) {
    logger.error({ error }, 'Error deleting workflow');
    res.status(500).json({ error: 'Failed to delete workflow' });
  }
});

/**
 * POST /api/v1/automations/workflows/:id/activate
 * Ativar workflow
 */
router.post('/workflows/:id/activate', async (req: Request, res: Response) => {
  try {
    const { companyId, role } = req.user!;
    const { id } = req.params;

    if (role !== 'company_admin' && role !== 'supervisor') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const workflow = await prisma.workflow.update({
      where: { id, companyId },
      data: { status: 'ACTIVE' }
    });

    logger.info({ workflowId: id }, 'Workflow activated');
    res.json(workflow);

  } catch (error: any) {
    logger.error({ error }, 'Error activating workflow');
    res.status(500).json({ error: 'Failed to activate workflow' });
  }
});

/**
 * POST /api/v1/automations/workflows/:id/pause
 * Pausar workflow
 */
router.post('/workflows/:id/pause', async (req: Request, res: Response) => {
  try {
    const { companyId, role } = req.user!;
    const { id } = req.params;

    if (role !== 'company_admin' && role !== 'supervisor') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const workflow = await prisma.workflow.update({
      where: { id, companyId },
      data: { status: 'PAUSED' }
    });

    logger.info({ workflowId: id }, 'Workflow paused');
    res.json(workflow);

  } catch (error: any) {
    logger.error({ error }, 'Error pausing workflow');
    res.status(500).json({ error: 'Failed to pause workflow' });
  }
});

/**
 * POST /api/v1/automations/workflows/:id/test
 * Testar workflow manualmente
 */
router.post('/workflows/:id/test', async (req: Request, res: Response) => {
  try {
    const { companyId, id: userId } = req.user!;
    const { id } = req.params;
    const { testData } = req.body;

    const workflow = await prisma.workflow.findFirst({
      where: { id, companyId }
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    // Executar em background
    workflowExecutor.execute(workflow, {
      workflowId: workflow.id,
      companyId,
      userId,
      trigger: {
        event: 'test',
        data: testData || {}
      },
      variables: {}
    }).catch(err => {
      logger.error({ error: err }, 'Test execution failed');
    });

    res.json({ message: 'Test execution started' });

  } catch (error: any) {
    logger.error({ error }, 'Error testing workflow');
    res.status(500).json({ error: 'Failed to test workflow' });
  }
});

/**
 * GET /api/v1/automations/executions
 * Listar execuções
 */
router.get('/executions', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user!;
    const { workflowId, status, limit = '50', offset = '0' } = req.query;

    const where: any = { workflow: { companyId } };
    if (workflowId) where.workflowId = workflowId;
    if (status) where.status = status;

    const executions = await prisma.workflowExecution.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      include: {
        workflow: { select: { name: true } }
      }
    });

    const total = await prisma.workflowExecution.count({ where });

    res.json({
      data: executions,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });

  } catch (error: any) {
    logger.error({ error }, 'Error listing executions');
    res.status(500).json({ error: 'Failed to list executions' });
  }
});

/**
 * GET /api/v1/automations/executions/:id/logs
 * Buscar logs de execução
 */
router.get('/executions/:id/logs', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user!;
    const { id } = req.params;

    const execution = await prisma.workflowExecution.findFirst({
      where: {
        id,
        workflow: { companyId }
      },
      include: {
        workflow: { select: { name: true } }
      }
    });

    if (!execution) {
      return res.status(404).json({ error: 'Execution not found' });
    }

    res.json(execution);

  } catch (error: any) {
    logger.error({ error }, 'Error fetching execution logs');
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// ============================================
// INTELLIGENT AUTOMATIONS (AI-Powered)
// ============================================

/**
 * GET /api/v1/automations/suggestions
 * AI-powered workflow suggestions based on company activity
 */
router.get('/suggestions', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user!;

    // Get company activity data
    const [dealCount, contactCount, messageCount, interactionCount] = await Promise.all([
      prisma.deal.count({ where: { companyId } }),
      prisma.contact.count({ where: { companyId } }),
      prisma.message.count({ where: { companyId } }),
      prisma.interaction.count({ where: { companyId } })
    ]);

    // Get existing workflows to avoid duplicates
    const existingWorkflows = await prisma.workflow.findMany({
      where: { companyId },
      select: { name: true, description: true }
    });

    const { getAIService } = await import('../../core/ai/ai.service');
    const aiService = getAIService(prisma);

    const context = `
      Company Activity:
      - Deals: ${dealCount}
      - Contacts: ${contactCount}
      - Messages: ${messageCount}
      - Interactions: ${interactionCount}

      Existing Workflows:
      ${existingWorkflows.map(w => `- ${w.name}: ${w.description || 'No description'}`).join('\n')}

      Suggest 3-5 workflow automations that would benefit this company in Portuguese (pt-BR).
      For each suggestion, include:
      - Nome do workflow
      - Descrição (1-2 linhas)
      - Benefício esperado
    `;

    const suggestions = await aiService.generateSuggestions(
      context,
      'workflow automation ideas'
    );

    const workflowSuggestions = suggestions
      .split(/\n\n/)
      .filter(s => s.trim().length > 0)
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        suggestions: workflowSuggestions,
        basedOn: {
          dealCount,
          contactCount,
          messageCount,
          interactionCount,
        },
      },
    });
  } catch (error: any) {
    logger.error({ error }, 'Error generating workflow suggestions');
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

/**
 * GET /api/v1/automations/workflows/:id/analyze
 * AI-powered workflow efficiency analysis
 */
router.get('/workflows/:id/analyze', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user!;
    const { id } = req.params;

    const workflow = await prisma.workflow.findFirst({
      where: { id, companyId },
      include: {
        executions: {
          take: 50,
          orderBy: { startedAt: 'desc' },
        },
      },
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    // Calculate metrics
    const totalExecutions = workflow.executions.length;
    const successfulExecutions = workflow.executions.filter(e => e.status === 'COMPLETED').length;
    const failedExecutions = workflow.executions.filter(e => e.status === 'FAILED').length;
    const avgDuration = workflow.executions.reduce((sum, e) => {
      if (e.completedAt && e.startedAt) {
        return sum + (new Date(e.completedAt).getTime() - new Date(e.startedAt).getTime());
      }
      return sum;
    }, 0) / (workflow.executions.length || 1);

    const { getAIService } = await import('../../core/ai/ai.service');
    const aiService = getAIService(prisma);

    const context = `
      Workflow Analysis:
      - Name: ${workflow.name}
      - Description: ${workflow.description || 'No description'}
      - Status: ${workflow.status}
      - Total Executions: ${totalExecutions}
      - Successful: ${successfulExecutions}
      - Failed: ${failedExecutions}
      - Success Rate: ${totalExecutions > 0 ? Math.round((successfulExecutions / totalExecutions) * 100) : 0}%
      - Average Duration: ${Math.round(avgDuration / 1000)}s
      - Nodes: ${(workflow.definition as any)?.nodes?.length || 0}

      Analyze this workflow's efficiency and suggest improvements in Portuguese (pt-BR).
      Consider: success rate, execution time, complexity, and potential bottlenecks.
    `;

    const analysis = await aiService.complete({
      prompt: context,
      systemMessage: 'You are a workflow optimization expert. Provide a detailed analysis with specific recommendations.',
      temperature: 0.7,
    });

    res.json({
      success: true,
      data: {
        metrics: {
          totalExecutions,
          successfulExecutions,
          failedExecutions,
          successRate: totalExecutions > 0 ? Math.round((successfulExecutions / totalExecutions) * 100) : 0,
          avgDurationSeconds: Math.round(avgDuration / 1000),
          nodeCount: (workflow.definition as any)?.nodes?.length || 0,
        },
        aiAnalysis: analysis.content,
        efficiency: successfulExecutions / totalExecutions >= 0.9 ? 'excellent' :
                    successfulExecutions / totalExecutions >= 0.7 ? 'good' :
                    successfulExecutions / totalExecutions >= 0.5 ? 'fair' : 'poor',
      },
    });
  } catch (error: any) {
    logger.error({ error }, 'Error analyzing workflow');
    res.status(500).json({ error: 'Failed to analyze workflow' });
  }
});

// ============================================
// EVENT HANDLERS (registrar workflows)
// ============================================

/**
 * Registrar event listeners para workflows ativos
 */
export async function registerWorkflowEventListeners() {
  logger.info('[Automations] Registering event listeners...');

  // Listener universal para todos os eventos
  (eventBus.on as any)('*', async (eventName: string, data: any) => {
    try {
      // Buscar workflows ativos com trigger para este evento
      const workflows = await prisma.workflow.findMany({
        where: {
          status: 'ACTIVE',
          definition: {
            path: ['nodes'],
            array_contains: [{ type: 'trigger', config: { event: eventName } }]
          } as any
        }
      });

      for (const workflow of workflows) {
        // Executar em background
        workflowExecutor.execute(workflow, {
          workflowId: workflow.id,
          companyId: workflow.companyId,
          trigger: { event: eventName, data },
          variables: {}
        }).catch(err => {
          logger.error({
            workflowId: workflow.id,
            error: err
          }, 'Workflow execution failed');
        });
      }

    } catch (error) {
      logger.error({ event: eventName, error }, '[Automations] Event listener error');
    }
  });

  logger.info('[Automations] Event listeners registered');
}

export default router;
