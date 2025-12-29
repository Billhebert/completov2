// tests/integration/webhooks.test.ts
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';

describe('Webhooks Integration', () => {
  let app: any;
  let token: string;
  let subscriptionId: string;

  beforeAll(async () => {
    // Setup app and get auth token
    // app = await createTestApp();
    // const res = await request(app).post('/api/v1/auth/login').send({...});
    // token = res.body.data.accessToken;
  });

  afterAll(async () => {
    // Cleanup
  });

  describe('POST /api/v1/webhooks/subscriptions', () => {
    it('should create webhook subscription', async () => {
      const response = await request(app)
        .post('/api/v1/webhooks/subscriptions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          url: 'https://webhook.site/test',
          events: ['deal.won', 'contact.created'],
          description: 'Test webhook',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('secret');
      expect(response.body.data.events).toEqual(['deal.won', 'contact.created']);

      subscriptionId = response.body.data.id;
    });

    it('should reject invalid URL', async () => {
      const response = await request(app)
        .post('/api/v1/webhooks/subscriptions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          url: 'not-a-valid-url',
          events: ['deal.won'],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require at least one event', async () => {
      const response = await request(app)
        .post('/api/v1/webhooks/subscriptions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          url: 'https://webhook.site/test',
          events: [],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/webhooks/subscriptions', () => {
    it('should list webhook subscriptions', async () => {
      const response = await request(app)
        .get('/api/v1/webhooks/subscriptions')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/v1/webhooks/test/:id', () => {
    it('should send test webhook', async () => {
      const response = await request(app)
        .post(`/api/v1/webhooks/test/${subscriptionId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/webhooks/subscriptions/:id/rotate-secret', () => {
    it('should rotate webhook secret', async () => {
      const response = await request(app)
        .post(`/api/v1/webhooks/subscriptions/${subscriptionId}/rotate-secret`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('secret');
    });
  });

  describe('DELETE /api/v1/webhooks/subscriptions/:id', () => {
    it('should delete webhook subscription', async () => {
      const response = await request(app)
        .delete(`/api/v1/webhooks/subscriptions/${subscriptionId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
