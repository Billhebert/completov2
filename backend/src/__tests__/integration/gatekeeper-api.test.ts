import request from 'supertest';
import { Express } from 'express';
import { createApp } from '../../app';
import {
  createTestCompany,
  createTestUser,
  createTestCompanyPolicy,
  createTestAttentionProfile,
} from '../helpers/test-helpers';

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

  await createTestCompanyPolicy(company.id);
  await createTestAttentionProfile(agent.id);
});

describe('Gatekeeper API Integration Tests', () => {
  describe('GET /api/v1/gatekeeper/profile', () => {
    it('should return user attention profile', async () => {
      const response = await request(app)
        .get('/api/v1/gatekeeper/profile')
        .set('Authorization', `Bearer ${agent.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('level');
      expect(response.body).toHaveProperty('channels');
      expect(response.body).toHaveProperty('autonomy');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/v1/gatekeeper/profile');

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/v1/gatekeeper/profile', () => {
    it('should update user attention profile', async () => {
      const response = await request(app)
        .patch('/api/v1/gatekeeper/profile')
        .set('Authorization', `Bearer ${agent.token}`)
        .send({
          level: 'FOCUSED',
          channels: {
            email: true,
            push: false,
            inapp: true,
            whatsapp: false,
            sms: false,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.level).toBe('FOCUSED');
      expect(response.body.channels.push).toBe(false);
    });

    it('should validate profile data', async () => {
      const response = await request(app)
        .patch('/api/v1/gatekeeper/profile')
        .set('Authorization', `Bearer ${agent.token}`)
        .send({
          level: 'INVALID_LEVEL',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/gatekeeper/policy', () => {
    it('should return company policy for admin', async () => {
      const response = await request(app)
        .get('/api/v1/gatekeeper/policy')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('maxAutonomy');
      expect(response.body).toHaveProperty('forbidden');
      expect(response.body).toHaveProperty('rateLimits');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get('/api/v1/gatekeeper/policy')
        .set('Authorization', `Bearer ${agent.token}`);

      expect(response.status).toBe(403);
    });
  });

  describe('PATCH /api/v1/gatekeeper/policy', () => {
    it('should update company policy', async () => {
      const response = await request(app)
        .patch('/api/v1/gatekeeper/policy')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          forbidden: ['delete_contact_auto', 'modify_invoice_auto'],
          rateLimits: {
            ai_calls_per_user_per_day: 150,
            ai_calls_per_company_per_day: 2000,
            automations_per_hour: 100,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.forbidden).toContain('delete_contact_auto');
      expect(response.body.rateLimits.ai_calls_per_user_per_day).toBe(150);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .patch('/api/v1/gatekeeper/policy')
        .set('Authorization', `Bearer ${agent.token}`)
        .send({
          forbidden: [],
        });

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/v1/gatekeeper/logs', () => {
    it('should return decision logs', async () => {
      // Create a test decision by calling shouldExecute
      const response = await request(app)
        .post('/api/v1/gatekeeper/test')
        .set('Authorization', `Bearer ${agent.token}`)
        .send({
          action: 'create_zettel',
          params: { title: 'Test' },
        });

      expect(response.status).toBe(200);

      const logsResponse = await request(app)
        .get('/api/v1/gatekeeper/logs')
        .set('Authorization', `Bearer ${agent.token}`);

      expect(logsResponse.status).toBe(200);
      expect(Array.isArray(logsResponse.body.data)).toBe(true);
      expect(logsResponse.body.data.length).toBeGreaterThan(0);
    });

    it('should filter logs by action', async () => {
      const response = await request(app)
        .get('/api/v1/gatekeeper/logs?action=create_zettel')
        .set('Authorization', `Bearer ${agent.token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/gatekeeper/pending-actions', () => {
    it('should return pending actions that need approval', async () => {
      const response = await request(app)
        .get('/api/v1/gatekeeper/pending-actions')
        .set('Authorization', `Bearer ${agent.token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/v1/gatekeeper/test', () => {
    it('should test gatekeeper decision for action', async () => {
      const response = await request(app)
        .post('/api/v1/gatekeeper/test')
        .set('Authorization', `Bearer ${agent.token}`)
        .send({
          action: 'send_notification',
          params: {
            title: 'Test Notification',
            body: 'Test',
          },
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('decision');
      expect(response.body).toHaveProperty('reason');
      expect(['EXECUTE', 'SUGGEST', 'LOG_ONLY', 'BLOCK']).toContain(
        response.body.decision
      );
    });

    it('should validate request body', async () => {
      const response = await request(app)
        .post('/api/v1/gatekeeper/test')
        .set('Authorization', `Bearer ${agent.token}`)
        .send({
          // Missing required action field
          params: {},
        });

      expect(response.status).toBe(400);
    });
  });
});
