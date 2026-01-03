// src/modules/automations/index.ts
import { ModuleDefinition } from '../../core/types';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { EventBus } from '../../core/event-bus';
import { logger } from '@core/logger';
import { eventBus } from '@core/event-bus';
import { workflowExecutor } from './engine/executor';
import * as routes from './routes';

function setupRoutes(app: Express, prisma: PrismaClient, eventBus: EventBus) {
  const base = '/api/v1/automations';

  // Workflow management routes
  routes.setupAutomationsWorkflowsListRoute(app, prisma, base);
  routes.setupAutomationsWorkflowsGetRoute(app, prisma, base);
  routes.setupAutomationsWorkflowsCreateRoute(app, prisma, base);
  routes.setupAutomationsWorkflowsUpdateRoute(app, prisma, base);
  routes.setupAutomationsWorkflowsDeleteRoute(app, prisma, base);
  routes.setupAutomationsWorkflowsActivateRoute(app, prisma, base);
  routes.setupAutomationsWorkflowsPauseRoute(app, prisma, base);
  routes.setupAutomationsWorkflowsTestRoute(app, prisma, base);

  // Execution routes
  routes.setupAutomationsExecutionsListRoute(app, prisma, base);
  routes.setupAutomationsExecutionLogsRoute(app, prisma, base);

  // AI-powered routes
  routes.setupAutomationsSuggestionsRoute(app, prisma, base);
  routes.setupAutomationsWorkflowAnalyzeRoute(app, prisma, base);
}

/**
 * Registrar event listeners para workflows ativos
 */
export async function registerWorkflowEventListeners() {
  const prisma = new PrismaClient();
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

export const automationsModule: ModuleDefinition = {
  name: 'automations',
  version: '1.0.0',
  provides: ['workflows', 'automation-engine', 'ai-suggestions'],
  routes: (ctx) => setupRoutes(ctx.app, ctx.prisma, ctx.eventBus),
};
