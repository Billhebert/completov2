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
        trigger: {
          event: 'test.event',
          data: { test: 'value' },
        },
        user: {
          id: user.id,
          companyId: company.id,
        },
      };

      const result = await executor.execute(workflow, context);

      expect(result.status).toBe('COMPLETED');
      expect(result.logs.length).toBeGreaterThan(0);

      // Check if zettel was created
      const zettels = await prisma.knowledgeNode.findMany({
        where: { companyId: company.id },
      });

      expect(zettels.length).toBe(1);
      expect(zettels[0].title).toBe('Test Zettel');
    });

    it('should handle conditional nodes', async () => {
      const workflow = await prisma.workflow.create({
        data: {
          companyId: company.id,
          name: 'Conditional Workflow',
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
                id: 'condition1',
                type: 'condition',
                config: {
                  operator: 'equals',
                  field: '{{trigger.data.value}}',
                  value: 'yes',
                },
              },
              {
                id: 'action1',
                type: 'action',
                config: {
                  action: 'send_notification',
                  params: {
                    title: 'Condition Met',
                    body: 'The condition was true',
                  },
                },
              },
              {
                id: 'action2',
                type: 'action',
                config: {
                  action: 'send_notification',
                  params: {
                    title: 'Condition Not Met',
                    body: 'The condition was false',
                  },
                },
              },
            ],
            edges: [
              { source: 'trigger1', target: 'condition1' },
              { source: 'condition1', target: 'action1', condition: 'true' },
              { source: 'condition1', target: 'action2', condition: 'false' },
            ],
          },
        },
      });

      const context = {
        trigger: {
          event: 'test.event',
          data: { value: 'yes' },
        },
        user: {
          id: user.id,
          companyId: company.id,
        },
      };

      const result = await executor.execute(workflow, context);

      expect(result.status).toBe('COMPLETED');

      // Should execute action1 (condition was true)
      const execution = await prisma.workflowExecution.findFirst({
        where: { workflowId: workflow.id },
      });

      expect(execution).toBeDefined();
      expect(execution!.status).toBe('COMPLETED');
    });

    it('should handle template variables in params', async () => {
      const workflow = await prisma.workflow.create({
        data: {
          companyId: company.id,
          name: 'Template Workflow',
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
                    title: 'Zettel for {{trigger.data.contactName}}',
                    content: 'Created on {{trigger.data.date}}',
                    nodeType: 'CLIENT',
                  },
                },
              },
            ],
            edges: [{ source: 'trigger1', target: 'action1' }],
          },
        },
      });

      const context = {
        trigger: {
          event: 'test.event',
          data: {
            contactName: 'John Doe',
            date: '2025-12-30',
          },
        },
        user: {
          id: user.id,
          companyId: company.id,
        },
      };

      await executor.execute(workflow, context);

      const zettels = await prisma.knowledgeNode.findMany({
        where: { companyId: company.id },
      });

      expect(zettels.length).toBe(1);
      expect(zettels[0].title).toBe('Zettel for John Doe');
      expect(zettels[0].content).toContain('2025-12-30');
    });

    it('should handle delay nodes', async () => {
      const workflow = await prisma.workflow.create({
        data: {
          companyId: company.id,
          name: 'Delay Workflow',
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
                id: 'delay1',
                type: 'delay',
                config: { duration: 1 }, // 1 second
              },
              {
                id: 'action1',
                type: 'action',
                config: {
                  action: 'create_zettel',
                  params: {
                    title: 'Delayed Zettel',
                    content: 'Created after delay',
                    nodeType: 'ZETTEL',
                  },
                },
              },
            ],
            edges: [
              { source: 'trigger1', target: 'delay1' },
              { source: 'delay1', target: 'action1' },
            ],
          },
        },
      });

      const context = {
        trigger: {
          event: 'test.event',
          data: {},
        },
        user: {
          id: user.id,
          companyId: company.id,
        },
      };

      const startTime = Date.now();
      await executor.execute(workflow, context);
      const endTime = Date.now();

      // Should take at least 1 second due to delay
      expect(endTime - startTime).toBeGreaterThanOrEqual(1000);

      const zettels = await prisma.knowledgeNode.findMany({
        where: { companyId: company.id },
      });

      expect(zettels.length).toBe(1);
    });

    it('should handle workflow execution errors', async () => {
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
        trigger: {
          event: 'test.event',
          data: {},
        },
        user: {
          id: user.id,
          companyId: company.id,
        },
      };

      const result = await executor.execute(workflow, context);

      expect(result.status).toBe('FAILED');
      expect(result.error).toBeDefined();

      // Check execution was logged as failed
      const execution = await prisma.workflowExecution.findFirst({
        where: { workflowId: workflow.id },
      });

      expect(execution!.status).toBe('FAILED');
    });

    it('should integrate with Gatekeeper for sensitive actions', async () => {
      // Create company policy that blocks send_external_message
      await prisma.companyPolicy.create({
        data: {
          companyId: company.id,
          maxAutonomy: {
            agent: {
              send_external_message: 'BLOCK',
            },
          },
          forbidden: ['send_external_message'],
          auditRules: {},
          rateLimits: {},
        },
      });

      const workflow = await prisma.workflow.create({
        data: {
          companyId: company.id,
          name: 'Blocked Workflow',
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
                  action: 'send_external_message',
                  params: {
                    to: 'client@example.com',
                    message: 'Test',
                  },
                },
              },
            ],
            edges: [{ source: 'trigger1', target: 'action1' }],
          },
        },
      });

      const context = {
        trigger: {
          event: 'test.event',
          data: {},
        },
        user: {
          id: user.id,
          companyId: company.id,
        },
      };

      const result = await executor.execute(workflow, context);

      // Should complete but action should be blocked by gatekeeper
      expect(result.status).toBe('COMPLETED');
      expect(result.logs.some((l: any) => l.message?.includes('blocked'))).toBe(true);
    });

    it('should log execution details', async () => {
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
        trigger: {
          event: 'test.event',
          data: {},
        },
        user: {
          id: user.id,
          companyId: company.id,
        },
      };

      await executor.execute(workflow, context);

      const execution = await prisma.workflowExecution.findFirst({
        where: { workflowId: workflow.id },
      });

      expect(execution).toBeDefined();
      expect(execution!.logs).toBeDefined();
      expect(execution!.logs.length).toBeGreaterThan(0);
      expect(execution!.startedAt).toBeDefined();
      expect(execution!.finishedAt).toBeDefined();
    });
  });
});
