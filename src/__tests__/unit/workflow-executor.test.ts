import { WorkflowExecutor } from '../../modules/automations/engine/executor';
import { PrismaClient } from '@prisma/client';
import {
  createTestCompany,
  createTestUser,
  createTestContact,
  mockOpenAI,
} from '../helpers/test-helpers';
import { eventBusMock } from '../mocks/event-bus.mock';

const prisma = new PrismaClient();

// Mock dependencies
jest.mock('../../core/event-bus', () => ({
  eventBus: eventBusMock,
}));

jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => mockOpenAI()),
  };
});

describe('WorkflowExecutor', () => {
  let executor: WorkflowExecutor;
  let company: any;
  let user: any;
  let contact: any;

  beforeEach(async () => {
    executor = new WorkflowExecutor();
    company = await createTestCompany();
    user = await createTestUser(company.id, 'agent');
    contact = await createTestContact(company.id);
    eventBusMock.clear();
  });

  describe('execute', () => {
    it('should execute simple workflow with trigger and action', async () => {
      const workflow = await prisma.workflow.create({
        data: {
          companyId: company.id,
          name: 'Test Workflow',
          status: 'ACTIVE',
          createdBy: user.id,
          definition: {
            nodes: [
              {
                id: 'trigger1',
                type: 'trigger',
                config: { event: 'test.event' },
              },
              {
                id: 'action1',
                type: 'action',
                config: {
                  action: 'create_zettel',
                  params: {
                    title: 'Test Zettel',
                    content: 'Auto-created zettel',
                    nodeType: 'ZETTEL',
                  },
                },
              },
            ],
            edges: [{ source: 'trigger1', target: 'action1' }],
          },
        },
      });

      const context = {
        workflowId: workflow.id,
        companyId: company.id,
        trigger: {
          event: 'test.event',
          data: { test: 'value' },
        },
        variables: {},
        userId: user.id,
      };

      await executor.execute(workflow, context);

      // Check execution was created and completed
      const execution = await prisma.workflowExecution.findFirst({
        where: { workflowId: workflow.id },
        orderBy: { startedAt: 'desc' },
      });

      expect(execution).toBeDefined();
      expect(execution!.status).toBe('COMPLETED');
    });

    it('should log workflow execution', async () => {
      const workflow = await prisma.workflow.create({
        data: {
          companyId: company.id,
          name: 'Logging Workflow',
          status: 'ACTIVE',
          createdBy: user.id,
          definition: {
            nodes: [
              {
                id: 'trigger1',
                type: 'trigger',
                config: { event: 'test.event' },
              },
              {
                id: 'action1',
                type: 'action',
                config: {
                  action: 'create_zettel',
                  params: {
                    title: 'Test',
                    content: 'Test',
                    nodeType: 'ZETTEL',
                  },
                },
              },
            ],
            edges: [{ source: 'trigger1', target: 'action1' }],
          },
        },
      });

      const context = {
        workflowId: workflow.id,
        companyId: company.id,
        trigger: {
          event: 'test.event',
          data: {},
        },
        variables: {},
        userId: user.id,
      };

      await executor.execute(workflow, context);

      const execution = await prisma.workflowExecution.findFirst({
        where: { workflowId: workflow.id },
      });

      expect(execution).toBeDefined();
      expect(Array.isArray(execution!.logs)).toBe(true);
      expect(execution!.startedAt).toBeDefined();
      expect(execution!.finishedAt).toBeDefined();
    });

    it('should handle workflow execution errors gracefully', async () => {
      const workflow = await prisma.workflow.create({
        data: {
          companyId: company.id,
          name: 'Error Workflow',
          status: 'ACTIVE',
          createdBy: user.id,
          definition: {
            nodes: [
              {
                id: 'trigger1',
                type: 'trigger',
                config: { event: 'test.event' },
              },
              {
                id: 'action1',
                type: 'action',
                config: {
                  action: 'invalid_action',
                  params: {},
                },
              },
            ],
            edges: [{ source: 'trigger1', target: 'action1' }],
          },
        },
      });

      const context = {
        workflowId: workflow.id,
        companyId: company.id,
        trigger: {
          event: 'test.event',
          data: {},
        },
        variables: {},
        userId: user.id,
      };

      await executor.execute(workflow, context);

      // Check execution was logged as failed
      const execution = await prisma.workflowExecution.findFirst({
        where: { workflowId: workflow.id },
      });

      expect(execution).toBeDefined();
      expect(execution!.status).toBe('FAILED');
      expect(execution!.error).toBeDefined();
    });

    it('should create workflow execution record', async () => {
      const workflow = await prisma.workflow.create({
        data: {
          companyId: company.id,
          name: 'Test Workflow',
          status: 'ACTIVE',
          createdBy: user.id,
          definition: {
            nodes: [
              {
                id: 'trigger1',
                type: 'trigger',
                config: { event: 'test.event' },
              },
            ],
            edges: [],
          },
        },
      });

      const context = {
        workflowId: workflow.id,
        companyId: company.id,
        trigger: {
          event: 'test.event',
          data: { test: 'value' },
        },
        variables: {},
        userId: user.id,
      };

      await executor.execute(workflow, context);

      const executions = await prisma.workflowExecution.findMany({
        where: { workflowId: workflow.id },
      });

      expect(executions.length).toBeGreaterThan(0);
      expect(executions[0].workflowId).toBe(workflow.id);
    });
  });
});
