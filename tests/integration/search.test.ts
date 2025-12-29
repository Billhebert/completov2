// tests/integration/search.test.ts
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';

describe('Search Integration', () => {
  let app: any;
  let token: string;

  beforeAll(async () => {
    // Setup app, auth, and create test data
  });

  afterAll(async () => {
    // Cleanup
  });

  describe('GET /api/v1/search', () => {
    it('should search across all entities', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .query({ q: 'john' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('contacts');
      expect(response.body.data).toHaveProperty('deals');
      expect(response.body.data).toHaveProperty('messages');
    });

    it('should filter by entity type', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .query({ q: 'john', type: 'contacts' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('contacts');
      expect(response.body.data).not.toHaveProperty('deals');
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .query({ q: 'test', limit: 5 })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      if (response.body.data.contacts) {
        expect(response.body.data.contacts.length).toBeLessThanOrEqual(5);
      }
    });

    it('should cache results', async () => {
      const response1 = await request(app)
        .get('/api/v1/search')
        .query({ q: 'cached' })
        .set('Authorization', `Bearer ${token}`);

      const response2 = await request(app)
        .get('/api/v1/search')
        .query({ q: 'cached' })
        .set('Authorization', `Bearer ${token}`);

      expect(response1.body.data).toEqual(response2.body.data);
      expect(response2.body.cached).toBe(true);
    });
  });

  describe('GET /api/v1/search/suggest', () => {
    it('should return autocomplete suggestions', async () => {
      const response = await request(app)
        .get('/api/v1/search/suggest')
        .query({ q: 'joh' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should require minimum 2 characters', async () => {
      const response = await request(app)
        .get('/api/v1/search/suggest')
        .query({ q: 'j' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('POST /api/v1/search/save', () => {
    it('should save search query', async () => {
      const response = await request(app)
        .post('/api/v1/search/save')
        .send({ query: 'test search' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toContain('test search');
    });
  });

  describe('GET /api/v1/search/recent', () => {
    it('should return recent searches', async () => {
      const response = await request(app)
        .get('/api/v1/search/recent')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});
