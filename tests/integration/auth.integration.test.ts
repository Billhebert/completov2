// tests/integration/auth.integration.test.ts
import request from 'supertest';
import { Express } from 'express';
import { createApp } from '../../src/app';

describe('Auth Integration Tests', () => {
  let app: Express;
  let server: any;

  beforeAll(async () => {
    const appContext = await createApp();
    app = appContext.app;
    server = appContext.httpServer;
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test User',
          email: `test${Date.now()}@testcompany.com`,
          password: 'password123',
          companyName: 'Test Company',
          companyDomain: `testco${Date.now()}`,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });
});
