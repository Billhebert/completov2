import { PrismaClient } from '@prisma/client';
import { logger } from '@core/logger';
import { gatekeeperService } from '../../gatekeeper/gatekeeper.service';
import { eventBus } from '@core/event-bus';

const prisma = new PrismaClient();

export interface WorkflowNode {
  id: string;
  type: string; // 'trigger' | 'condition' | 'action' | 'delay'
  config: any;
  next?: string[]; // IDs dos próximos nodes
}

export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: Array<{ source: string; target: string }>;
}

export interface ExecutionContext {
  workflowId: string;
  companyId: string;
  trigger: {
    event: string;
    data: any;
  };
  variables: Record<string, any>;
  userId?: string;
}

/**
 * WorkflowExecutor - Executa workflows node por node
 */
export class WorkflowExecutor {
  /**
   * Executa um workflow completo
   */
  async execute(workflow: any, context: ExecutionContext): Promise<void> {
    const executionId = await this.createExecution(workflow.id, context);

    try {
      logger.info('[Workflow] Starting execution', {
        workflowId: workflow.id,
        executionId,
        event: context.trigger.event
      });

      const definition: WorkflowDefinition = workflow.definition;
      const logs: any[] = [];

      // 1. Encontrar o node de trigger
      const triggerNode = definition.nodes.find(n => n.type === 'trigger');
      if (!triggerNode) {
        throw new Error('Workflow has no trigger node');
      }

      // 2. Executar a partir do trigger
      await this.executeNode(triggerNode, definition, context, logs);

      // 3. Marcar como completo
      await this.finishExecution(executionId, 'COMPLETED', logs);

      logger.info('[Workflow] Execution completed', { executionId });

    } catch (error: any) {
      logger.error('[Workflow] Execution failed', { executionId, error });
      await this.finishExecution(executionId, 'FAILED', [], error.message);
      throw error;
    }
  }

  /**
   * Executa um node e seus sucessores
   */
  private async executeNode(
    node: WorkflowNode,
    definition: WorkflowDefinition,
    context: ExecutionContext,
    logs: any[]
  ): Promise<void> {
    logger.info('[Workflow] Executing node', { nodeId: node.id, type: node.type });

    const startTime = Date.now();
    let result: any = null;
    let error: any = null;

    try {
      // Executar node baseado no tipo
      switch (node.type) {
        case 'trigger':
          result = { triggered: true, data: context.trigger.data };
          break;

        case 'condition':
          result = await this.executeCondition(node, context);
          break;

        case 'action':
          result = await this.executeAction(node, context);
          break;

        case 'delay':
          result = await this.executeDelay(node, context);
          break;

        default:
          throw new Error(`Unknown node type: ${node.type}`);
      }

    } catch (err: any) {
      error = err;
      logger.error('[Workflow] Node execution failed', { nodeId: node.id, error: err });
    }

    // Log da execução do node
    logs.push({
      nodeId: node.id,
      type: node.type,
      startTime,
      endTime: Date.now(),
      duration: Date.now() - startTime,
      result,
      error: error?.message || null,
      success: !error
    });

    if (error) {
      throw error;
    }

    // Executar próximos nodes
    const nextNodes = this.getNextNodes(node, definition, result);

    for (const nextNode of nextNodes) {
      await this.executeNode(nextNode, definition, context, logs);
    }
  }

  /**
   * Executa um node de condição (if/switch)
   */
  private async executeCondition(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    const { condition, operator, value } = node.config;

    // Avaliar expressão
    const contextValue = this.resolveVariable(condition, context);

    let result = false;
    switch (operator) {
      case 'equals':
        result = contextValue === value;
        break;
      case 'not_equals':
        result = contextValue !== value;
        break;
      case 'contains':
        result = String(contextValue).includes(value);
        break;
      case 'greater_than':
        result = Number(contextValue) > Number(value);
        break;
      case 'less_than':
        result = Number(contextValue) < Number(value);
        break;
      default:
        throw new Error(`Unknown operator: ${operator}`);
    }

    return { condition: result };
  }

  /**
   * Executa um node de ação
   */
  private async executeAction(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    const { action, params } = node.config;

    // Passar pelo Gatekeeper antes de executar ações sensíveis
    if (this.isExternalAction(action)) {
      const decision = await gatekeeperService.shouldExecute({
        userId: context.userId || '',
        companyId: context.companyId,
        action: `workflow_${action}`,
        context: { workflowId: context.workflowId, params }
      });

      if (decision.decision === 'BLOCK') {
        throw new Error(`Action blocked by Gatekeeper: ${decision.reason}`);
      }

      if (decision.decision === 'LOG_ONLY') {
        logger.info('[Workflow] Action skipped (Gatekeeper)', { action, reason: decision.reason });
        return { skipped: true, reason: decision.reason };
      }

      if (decision.decision === 'SUGGEST') {
        // Criar pending action para aprovação
        logger.info('[Workflow] Action requires approval', { action });
        return { requiresApproval: true };
      }
    }

    // Executar ação
    return await this.runAction(action, params, context);
  }

  /**
   * Executa delay
   */
  private async executeDelay(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    const { duration } = node.config; // em segundos

    logger.info('[Workflow] Delaying execution', { duration });
    await this.sleep(duration * 1000);

    return { delayed: true, duration };
  }

  /**
   * Executa ação específica
   */
  private async runAction(action: string, params: any, context: ExecutionContext): Promise<any> {
    switch (action) {
      case 'create_zettel':
        return await this.actionCreateZettel(params, context);

      case 'send_notification':
        return await this.actionSendNotification(params, context);

      case 'update_contact':
        return await this.actionUpdateContact(params, context);

      case 'create_task':
        return await this.actionCreateTask(params, context);

      case 'send_webhook':
        return await this.actionSendWebhook(params, context);

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  // ============================================
  // AÇÕES ESPECÍFICAS
  // ============================================

  private async actionCreateZettel(params: any, context: ExecutionContext) {
    const zettel = await prisma.knowledgeNode.create({
      data: {
        companyId: context.companyId,
        title: this.resolveString(params.title, context),
        content: this.resolveString(params.content, context),
        nodeType: params.nodeType || 'ZETTEL',
        createdById: context.userId || await this.getSystemUserId(context.companyId),
        visibility: params.visibility || 'COMPANY',
        tags: params.tags || ['workflow-created']
      }
    });

    logger.info('[Workflow] Zettel created', { zettelId: zettel.id });
    return { zettelId: zettel.id };
  }

  private async actionSendNotification(params: any, context: ExecutionContext) {
    if (!params.userId) {
      throw new Error('userId is required for send_notification');
    }

    await prisma.notification.create({
      data: {
        companyId: context.companyId,
        userId: params.userId,
        type: params.type || 'workflow',
        title: this.resolveString(params.title, context),
        body: this.resolveString(params.body, context),
        data: params.data || {}
      }
    });

    await eventBus.emit('notification.sent', {
      userId: params.userId,
      companyId: context.companyId,
      title: params.title
    });

    logger.info('[Workflow] Notification sent', { userId: params.userId });
    return { sent: true };
  }

  private async actionUpdateContact(params: any, context: ExecutionContext) {
    const contactId = params.contactId || context.variables.contactId;
    if (!contactId) {
      throw new Error('contactId is required');
    }

    const updated = await prisma.contact.update({
      where: { id: contactId },
      data: params.data
    });

    logger.info('[Workflow] Contact updated', { contactId });
    return { contactId, updated: true };
  }

  private async actionCreateTask(params: any, context: ExecutionContext) {
    const task = await prisma.knowledgeNode.create({
      data: {
        companyId: context.companyId,
        title: this.resolveString(params.title, context),
        content: this.resolveString(params.description || '', context),
        nodeType: 'TASK',
        assigneeId: params.assigneeId,
        dueDate: params.dueDate ? new Date(params.dueDate) : null,
        priority: params.priority || 'MEDIUM',
        createdById: context.userId || await this.getSystemUserId(context.companyId),
        tags: ['workflow-task']
      }
    });

    logger.info('[Workflow] Task created', { taskId: task.id });
    return { taskId: task.id };
  }

  private async actionSendWebhook(params: any, context: ExecutionContext) {
    const axios = require('axios');

    const response = await axios.post(params.url, {
      event: context.trigger.event,
      data: context.trigger.data,
      workflowId: context.workflowId,
      custom: params.payload || {}
    });

    logger.info('[Workflow] Webhook sent', { url: params.url, status: response.status });
    return { sent: true, status: response.status };
  }

  // ============================================
  // HELPERS
  // ============================================

  private getNextNodes(currentNode: WorkflowNode, definition: WorkflowDefinition, result: any): WorkflowNode[] {
    const edges = definition.edges.filter(e => e.source === currentNode.id);

    // Se for condição, escolher branch baseado no resultado
    if (currentNode.type === 'condition' && result?.condition !== undefined) {
      const targetBranch = result.condition ? 'true' : 'false';
      const edge = edges.find((e: any) => e.label === targetBranch);
      if (edge) {
        const node = definition.nodes.find(n => n.id === edge.target);
        return node ? [node] : [];
      }
      return [];
    }

    // Para outros tipos, retornar todos os próximos
    return edges
      .map(e => definition.nodes.find(n => n.id === e.target))
      .filter((n): n is WorkflowNode => n !== undefined);
  }

  private resolveVariable(path: string, context: ExecutionContext): any {
    // Resolve variáveis como: {{trigger.data.contactId}}
    const match = path.match(/\{\{(.+?)\}\}/);
    if (!match) return path;

    const varPath = match[1].trim();
    const parts = varPath.split('.');

    let value: any = context;
    for (const part of parts) {
      value = value?.[part];
    }

    return value;
  }

  private resolveString(template: string, context: ExecutionContext): string {
    return template.replace(/\{\{(.+?)\}\}/g, (_, varPath) => {
      const parts = varPath.trim().split('.');
      let value: any = context;
      for (const part of parts) {
        value = value?.[part];
      }
      return String(value || '');
    });
  }

  private isExternalAction(action: string): boolean {
    const externalActions = ['send_notification', 'send_webhook', 'send_message', 'update_contact'];
    return externalActions.includes(action);
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async createExecution(workflowId: string, context: ExecutionContext): Promise<string> {
    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId,
        status: 'RUNNING',
        context: context as any,
        logs: []
      }
    });

    return execution.id;
  }

  private async finishExecution(executionId: string, status: string, logs: any[], error?: string): Promise<void> {
    await prisma.workflowExecution.update({
      where: { id: executionId },
      data: {
        status,
        finishedAt: new Date(),
        logs: logs as any,
        error
      }
    });
  }

  private async getSystemUserId(companyId: string): Promise<string> {
    const admin = await prisma.user.findFirst({
      where: { companyId, role: 'company_admin' }
    });
    return admin?.id || 'system';
  }
}

export const workflowExecutor = new WorkflowExecutor();
