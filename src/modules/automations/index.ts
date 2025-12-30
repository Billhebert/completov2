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
    logger.error('Error listing workflows', { error });
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
    logger.error('Error fetching workflow', { error });
    res.status(500).json({ error: 'Failed to fetch workflow' });
  }
});

/**
 * POST /api/v1/automations/workflows
 * Criar novo workflow
 */
router.post('/workflows', async (req: Request, res: Response) => {
  try {
    const { companyId, userId, role } = req.user!;

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

    logger.info('Workflow created', { workflowId: workflow.id, userId });
    res.status(201).json(workflow);

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    logger.error('Error creating workflow', { error });
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
    logger.error('Error updating workflow', { error });
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

    logger.info('Workflow deleted', { workflowId: id });
    res.json({ message: 'Workflow deleted' });

  } catch (error: any) {
    logger.error('Error deleting workflow', { error });
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

    logger.info('Workflow activated', { workflowId: id });
    res.json(workflow);

  } catch (error: any) {
    logger.error('Error activating workflow', { error });
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

    logger.info('Workflow paused', { workflowId: id });
    res.json(workflow);

  } catch (error: any) {
    logger.error('Error pausing workflow', { error });
    res.status(500).json({ error: 'Failed to pause workflow' });
  }
});

/**
 * POST /api/v1/automations/workflows/:id/test
 * Testar workflow manualmente
 */
router.post('/workflows/:id/test', async (req: Request, res: Response) => {
  try {
    const { companyId, userId } = req.user!;
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
      logger.error('Test execution failed', { error: err });
    });

    res.json({ message: 'Test execution started' });

  } catch (error: any) {
    logger.error('Error testing workflow', { error });
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
    logger.error('Error listing executions', { error });
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
    logger.error('Error fetching execution logs', { error });
    res.status(500).json({ error: 'Failed to fetch logs' });
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
  eventBus.on('*', async (event: string, data: any) => {
    try {
      // Buscar workflows ativos com trigger para este evento
      const workflows = await prisma.workflow.findMany({
        where: {
          status: 'ACTIVE',
          definition: {
            path: ['nodes'],
            array_contains: [{ type: 'trigger', config: { event } }]
          } as any
        }
      });

      for (const workflow of workflows) {
        // Executar em background
        workflowExecutor.execute(workflow, {
          workflowId: workflow.id,
          companyId: workflow.companyId,
          trigger: { event, data },
          variables: {}
        }).catch(err => {
          logger.error('Workflow execution failed', {
            workflowId: workflow.id,
            error: err
          });
        });
      }

    } catch (error) {
      logger.error('[Automations] Event listener error', { event, error });
    }
  });

  logger.info('[Automations] Event listeners registered');
}

export default router;
