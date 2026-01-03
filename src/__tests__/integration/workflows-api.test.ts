import request from 'supertest';
import { Express } from 'express';
import { createApp } from '../../app';
import { createTestCompany, createTestUser } from '../helpers/test-helpers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

let app: Express;
let company: any;
let admin: any;
let agent: any;

beforeAll(async () => {
  const context = await createApp();
  app = context.app;
});

beforeEach(async () => {
  company = await createTestCompany();
  admin = await createTestUser(company.id, 'company_admin');
  agent = await createTestUser(company.id, 'agent');
});

describe('Workflows API Integration Tests', () => {
  describe('POST /api/v1/automations/workflows', () => {
    it('should create a new workflow', async () => {
      const workflowData = {
        name: 'Test Workflow',
        description: 'A test workflow',
        definition: {
          nodes: [
            {
              id: 'trigger1',
              type: 'trigger',
              config: { event: 'conversation.created' },
            },
            {
              id: 'action1',
              type: 'action',
              config: {
                action: 'create_zettel',
                params: {
                  title: 'New Conversation',
                  content: 'A conversation was created',
                  nodeType: 'NEGOTIATION',
                },
              },
            },
          ],
          edges: [{ source: 'trigger1', target: 'action1' }],
        },
      };

      const response = await request(app)
        .post('/api/v1/automations/workflows')
        .set('Authorization', `Bearer ${admin.token}`)
        .send(workflowData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Workflow');
      expect(response.body.status).toBe('DRAFT');
    });

    it('should validate workflow definition', async () => {
      const response = await request(app)
        .post('/api/v1/automations/workflows')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          name: 'Invalid Workflow',
          // Missing required definition field
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/automations/workflows', () => {
    it('should list all workflows for company', async () => {
      // Create test workflows
      await prisma.workflow.createMany({
        data: [
          {
            companyId: company.id,
            name: 'Workflow 1',
            status: 'ACTIVE',
            createdBy: admin.id,
            definition: { nodes: [], edges: [] },
          },
          {
            companyId: company.id,
            name: 'Workflow 2',
            status: 'DRAFT',
            createdBy: admin.id,
            definition: { nodes: [], edges: [] },
          },
        ],
      });

      const response = await request(app)
        .get('/api/v1/automations/workflows')
        .set('Authorization', `Bearer ${agent.token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
    });

    it('should filter workflows by status', async () => {
      await prisma.workflow.createMany({
        data: [
          {
            companyId: company.id,
            name: 'Active Workflow',
            status: 'ACTIVE',
            createdBy: admin.id,
            definition: { nodes: [], edges: [] },
          },
          {
            companyId: company.id,
            name: 'Draft Workflow',
            status: 'DRAFT',
            createdBy: admin.id,
            definition: { nodes: [], edges: [] },
          },
        ],
      });

      const response = await request(app)
        .get('/api/v1/automations/workflows?status=ACTIVE')
        .set('Authorization', `Bearer ${agent.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].status).toBe('ACTIVE');
    });
  });

  describe('GET /api/v1/automations/workflows/:id', () => {
    it('should return workflow details', async () => {
      const workflow = await prisma.workflow.create({
        data: {
          companyId: company.id,
          name: 'Test Workflow',
          status: 'ACTIVE',
          createdBy: admin.id,
          definition: {
            nodes: [{ id: 'node1', type: 'trigger', config: {} }],
            edges: [],
          },
        },
      });

      const response = await request(app)
        .get(`/api/v1/automations/workflows/${workflow.id}`)
        .set('Authorization', `Bearer ${agent.token}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(workflow.id);
      expect(response.body.name).toBe('Test Workflow');
      expect(response.body.definition).toBeDefined();
    });

    it('should return 404 for non-existent workflow', async () => {
      const response = await request(app)
        .get('/api/v1/automations/workflows/non-existent-id')
        .set('Authorization', `Bearer ${agent.token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/automations/workflows/:id', () => {
    it('should update workflow', async () => {
      const workflow = await prisma.workflow.create({
        data: {
          companyId: company.id,
          name: 'Old Name',
          status: 'DRAFT',
          createdBy: admin.id,
          definition: { nodes: [], edges: [] },
        },
      });

      const response = await request(app)
        .patch(`/api/v1/automations/workflows/${workflow.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          name: 'New Name',
          description: 'Updated description',
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('New Name');
      expect(response.body.description).toBe('Updated description');
    });
  });

  describe('DELETE /api/v1/automations/workflows/:id', () => {
    it('should delete workflow', async () => {
      const workflow = await prisma.workflow.create({
        data: {
          companyId: company.id,
          name: 'To Delete',
          status: 'DRAFT',
          createdBy: admin.id,
          definition: { nodes: [], edges: [] },
        },
      });

      const response = await request(app)
        .delete(`/api/v1/automations/workflows/${workflow.id}`)
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(200);

      // Verify deletion
      const deleted = await prisma.workflow.findUnique({
        where: { id: workflow.id },
      });

      expect(deleted).toBeNull();
    });
  });

  describe('POST /api/v1/automations/workflows/:id/activate', () => {
    it('should activate workflow', async () => {
      const workflow = await prisma.workflow.create({
        data: {
          companyId: company.id,
          name: 'Test Workflow',
          status: 'DRAFT',
          createdBy: admin.id,
          definition: { nodes: [], edges: [] },
        },
      });

      const response = await request(app)
        .post(`/api/v1/automations/workflows/${workflow.id}/activate`)
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ACTIVE');
    });
  });

  describe('POST /api/v1/automations/workflows/:id/pause', () => {
    it('should pause workflow', async () => {
      const workflow = await prisma.workflow.create({
        data: {
          companyId: company.id,
          name: 'Test Workflow',
          status: 'ACTIVE',
          createdBy: admin.id,
          definition: { nodes: [], edges: [] },
        },
      });

      const response = await request(app)
        .post(`/api/v1/automations/workflows/${workflow.id}/pause`)
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('PAUSED');
    });
  });

  describe('POST /api/v1/automations/workflows/:id/test', () => {
    it('should test workflow execution', async () => {
      const workflow = await prisma.workflow.create({
        data: {
          companyId: company.id,
          name: 'Test Workflow',
          status: 'DRAFT',
          createdBy: admin.id,
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

      const response = await request(app)
        .post(`/api/v1/automations/workflows/${workflow.id}/test`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          context: {
            trigger: {
              event: 'test.event',
              data: { test: 'value' },
            },
          },
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('logs');
    });
  });

  describe('GET /api/v1/automations/executions', () => {
    it('should list workflow executions', async () => {
      const workflow = await prisma.workflow.create({
        data: {
          companyId: company.id,
          name: 'Test Workflow',
          status: 'ACTIVE',
          createdBy: admin.id,
          definition: { nodes: [], edges: [] },
        },
      });

      await prisma.workflowExecution.create({
        data: {
          workflowId: workflow.id,
          status: 'COMPLETED',
          startedAt: new Date(),
          finishedAt: new Date(),
          context: {},
          logs: [],
        },
      });

      const response = await request(app)
        .get('/api/v1/automations/executions')
        .set('Authorization', `Bearer ${agent.token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter executions by workflow', async () => {
      const workflow = await prisma.workflow.create({
        data: {
          companyId: company.id,
          name: 'Test Workflow',
          status: 'ACTIVE',
          createdBy: admin.id,
          definition: { nodes: [], edges: [] },
        },
      });

      await prisma.workflowExecution.create({
        data: {
          workflowId: workflow.id,
          status: 'COMPLETED',
          startedAt: new Date(),
          finishedAt: new Date(),
          context: {},
          logs: [],
        },
      });

      const response = await request(app)
        .get(`/api/v1/automations/executions?workflowId=${workflow.id}`)
        .set('Authorization', `Bearer ${agent.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].workflowId).toBe(workflow.id);
    });
  });

  describe('GET /api/v1/automations/executions/:id/logs', () => {
    it('should return detailed execution logs', async () => {
      const workflow = await prisma.workflow.create({
        data: {
          companyId: company.id,
          name: 'Test Workflow',
          status: 'ACTIVE',
          createdBy: admin.id,
          definition: { nodes: [], edges: [] },
        },
      });

      const execution = await prisma.workflowExecution.create({
        data: {
          workflowId: workflow.id,
          status: 'COMPLETED',
          startedAt: new Date(),
          finishedAt: new Date(),
          context: { test: 'data' },
          logs: [
            { timestamp: new Date(), level: 'info', message: 'Started' },
            { timestamp: new Date(), level: 'info', message: 'Completed' },
          ],
        },
      });

      const response = await request(app)
        .get(`/api/v1/automations/executions/${execution.id}/logs`)
        .set('Authorization', `Bearer ${agent.token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.logs)).toBe(true);
      expect(response.body.logs.length).toBe(2);
    });
  });
});
