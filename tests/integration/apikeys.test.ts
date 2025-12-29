// tests/integration/apikeys.test.ts
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';

describe('API Keys Integration', () => {
  let app: any;
  let token: string;
  let apiKeyId: string;
  let apiKey: string;

  beforeAll(async () => {
    // Setup app and get auth token
  });

  afterAll(async () => {
    // Cleanup
  });

  describe('POST /api/v1/apikeys', () => {
    it('should create API key', async () => {
      const response = await request(app)
        .post('/api/v1/apikeys')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test API Key',
          scopes: ['contact.read', 'deal.read'],
          expiresAt: '2025-12-31T23:59:59Z',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('key');
      expect(response.body.data.key).toMatch(/^omni_/);
      expect(response.body.data.scopes).toEqual(['contact.read', 'deal.read']);

      apiKeyId = response.body.data.id;
      apiKey = response.body.data.key;
    });

    it('should reject invalid scopes', async () => {
      const response = await request(app)
        .post('/api/v1/apikeys')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Invalid API Key',
          scopes: [],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Authentication with API Key', () => {
    it('should authenticate with valid API key', async () => {
      const response = await request(app)
        .get('/api/v1/crm/contacts')
        .set('X-API-Key', apiKey);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject invalid API key', async () => {
      const response = await request(app)
        .get('/api/v1/crm/contacts')
        .set('X-API-Key', 'invalid_key');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject missing API key', async () => {
      const response = await request(app)
        .get('/api/v1/crm/contacts');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/apikeys/:id/usage', () => {
    it('should get API key usage stats', async () => {
      const response = await request(app)
        .get(`/api/v1/apikeys/${apiKeyId}/usage`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalRequests');
      expect(response.body.data).toHaveProperty('recentLogs');
    });
  });

  describe('POST /api/v1/apikeys/:id/revoke', () => {
    it('should revoke API key', async () => {
      const response = await request(app)
        .post(`/api/v1/apikeys/${apiKeyId}/revoke`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject revoked API key', async () => {
      const response = await request(app)
        .get('/api/v1/crm/contacts')
        .set('X-API-Key', apiKey);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
