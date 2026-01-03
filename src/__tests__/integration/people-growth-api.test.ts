import request from 'supertest';
import { Express } from 'express';
import { createApp } from '../../app';
import { createTestCompany, createTestUser } from '../helpers/test-helpers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

let app: Express;
let company: any;
let admin: any;
let supervisor: any;
let agent: any;

beforeAll(async () => {
  const context = await createApp();
  app = context.app;
});

beforeEach(async () => {
  company = await createTestCompany();
  admin = await createTestUser(company.id, 'company_admin');
  supervisor = await createTestUser(company.id, 'supervisor');
  agent = await createTestUser(company.id, 'agent');
});

describe('People Growth API Integration Tests', () => {
  describe('GET /api/v1/people-growth/gaps', () => {
    it('should return user own gaps', async () => {
      // Create gaps for agent
      await prisma.employeeGap.createMany({
        data: [
          {
            companyId: company.id,
            employeeId: agent.id,
            domain: 'COMMERCIAL',
            gap: 'Weak objection handling',
            severity: 'HIGH',
            evidence: [],
          },
          {
            companyId: company.id,
            employeeId: agent.id,
            domain: 'SOFT_SKILLS',
            gap: 'Poor time management',
            severity: 'MEDIUM',
            evidence: [],
          },
        ],
      });

      const response = await request(app)
        .get('/api/v1/people-growth/gaps')
        .set('Authorization', `Bearer ${agent.token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
    });

    it('should allow supervisor to see team gaps', async () => {
      await prisma.employeeGap.create({
        data: {
          companyId: company.id,
          employeeId: agent.id,
          domain: 'COMMERCIAL',
          gap: 'Test gap',
          severity: 'MEDIUM',
          evidence: [],
        },
      });

      const response = await request(app)
        .get(`/api/v1/people-growth/gaps?employeeId=${agent.id}`)
        .set('Authorization', `Bearer ${supervisor.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter gaps by domain', async () => {
      await prisma.employeeGap.createMany({
        data: [
          {
            companyId: company.id,
            employeeId: agent.id,
            domain: 'COMMERCIAL',
            gap: 'Gap 1',
            severity: 'HIGH',
            evidence: [],
          },
          {
            companyId: company.id,
            employeeId: agent.id,
            domain: 'TECHNICAL',
            gap: 'Gap 2',
            severity: 'MEDIUM',
            evidence: [],
          },
        ],
      });

      const response = await request(app)
        .get('/api/v1/people-growth/gaps?domain=COMMERCIAL')
        .set('Authorization', `Bearer ${agent.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].domain).toBe('COMMERCIAL');
    });
  });

  describe('GET /api/v1/people-growth/gaps/:id', () => {
    it('should return gap details', async () => {
      const gap = await prisma.employeeGap.create({
        data: {
          companyId: company.id,
          employeeId: agent.id,
          domain: 'COMMERCIAL',
          gap: 'Test gap',
          severity: 'HIGH',
          evidence: [
            {
              type: 'interaction',
              interactionId: 'int-123',
              timestamp: new Date(),
            },
          ],
        },
      });

      const response = await request(app)
        .get(`/api/v1/people-growth/gaps/${gap.id}`)
        .set('Authorization', `Bearer ${agent.token}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(gap.id);
      expect(response.body.gap).toBe('Test gap');
      expect(response.body.evidence.length).toBe(1);
    });

    it('should return 403 if gap does not belong to user', async () => {
      const otherUser = await createTestUser(company.id, 'agent');

      const gap = await prisma.employeeGap.create({
        data: {
          companyId: company.id,
          employeeId: otherUser.id,
          domain: 'COMMERCIAL',
          gap: 'Test gap',
          severity: 'MEDIUM',
          evidence: [],
        },
      });

      const response = await request(app)
        .get(`/api/v1/people-growth/gaps/${gap.id}`)
        .set('Authorization', `Bearer ${agent.token}`);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/v1/people-growth/gaps/:id/close', () => {
    it('should close gap', async () => {
      const gap = await prisma.employeeGap.create({
        data: {
          companyId: company.id,
          employeeId: agent.id,
          domain: 'COMMERCIAL',
          gap: 'Test gap',
          severity: 'MEDIUM',
          evidence: [],
          status: 'OPEN',
        },
      });

      const response = await request(app)
        .post(`/api/v1/people-growth/gaps/${gap.id}/close`)
        .set('Authorization', `Bearer ${agent.token}`);

      expect(response.status).toBe(200);

      // Verify gap was closed
      const updated = await prisma.employeeGap.findUnique({
        where: { id: gap.id },
      });

      expect(updated!.status).toBe('CLOSED');
      expect(updated!.closedAt).toBeDefined();
    });
  });

  describe('GET /api/v1/people-growth/gaps/:id/learning-paths', () => {
    it('should suggest learning paths for gap', async () => {
      const gap = await prisma.employeeGap.create({
        data: {
          companyId: company.id,
          employeeId: agent.id,
          domain: 'COMMERCIAL',
          gap: 'Weak objection handling',
          severity: 'HIGH',
          evidence: [],
        },
      });

      // Create learning path
      await prisma.learningPath.create({
        data: {
          companyId: company.id,
          title: 'Objection Handling Mastery',
          description: 'Learn to handle objections',
          category: 'COMMERCIAL',
          difficulty: 'intermediate',
          estimatedHours: 10,
          targetSkills: [],
          createdBy: admin.id,
        },
      });

      const response = await request(app)
        .get(`/api/v1/people-growth/gaps/${gap.id}/learning-paths`)
        .set('Authorization', `Bearer ${agent.token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/people-growth/team/report', () => {
    it('should generate team gaps report for supervisor', async () => {
      await prisma.employeeGap.createMany({
        data: [
          {
            companyId: company.id,
            employeeId: agent.id,
            domain: 'COMMERCIAL',
            gap: 'Gap 1',
            severity: 'HIGH',
            evidence: [],
            status: 'OPEN',
          },
          {
            companyId: company.id,
            employeeId: agent.id,
            domain: 'TECHNICAL',
            gap: 'Gap 2',
            severity: 'MEDIUM',
            evidence: [],
            status: 'OPEN',
          },
        ],
      });

      const response = await request(app)
        .get('/api/v1/people-growth/team/report')
        .set('Authorization', `Bearer ${supervisor.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('byDomain');
      expect(response.body).toHaveProperty('bySeverity');
      expect(response.body.total).toBe(2);
    });

    it('should return 403 for non-supervisor', async () => {
      const response = await request(app)
        .get('/api/v1/people-growth/team/report')
        .set('Authorization', `Bearer ${agent.token}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/v1/people-growth/team/heatmap', () => {
    it('should generate gaps heatmap', async () => {
      await prisma.employeeGap.createMany({
        data: [
          {
            companyId: company.id,
            employeeId: agent.id,
            domain: 'COMMERCIAL',
            gap: 'Gap 1',
            severity: 'HIGH',
            evidence: [],
            status: 'OPEN',
          },
          {
            companyId: company.id,
            employeeId: agent.id,
            domain: 'COMMERCIAL',
            gap: 'Gap 2',
            severity: 'MEDIUM',
            evidence: [],
            status: 'OPEN',
          },
        ],
      });

      const response = await request(app)
        .get('/api/v1/people-growth/team/heatmap')
        .set('Authorization', `Bearer ${supervisor.token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('employee');
      expect(response.body.data[0]).toHaveProperty('domains');
    });

    it('should return 403 for non-supervisor', async () => {
      const response = await request(app)
        .get('/api/v1/people-growth/team/heatmap')
        .set('Authorization', `Bearer ${agent.token}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/v1/people-growth/my-profile', () => {
    it('should return user development profile', async () => {
      // Create gaps
      await prisma.employeeGap.createMany({
        data: [
          {
            companyId: company.id,
            employeeId: agent.id,
            domain: 'COMMERCIAL',
            gap: 'Gap 1',
            severity: 'HIGH',
            evidence: [],
            status: 'OPEN',
          },
          {
            companyId: company.id,
            employeeId: agent.id,
            domain: 'TECHNICAL',
            gap: 'Gap 2',
            severity: 'MEDIUM',
            evidence: [],
            status: 'CLOSED',
          },
        ],
      });

      const response = await request(app)
        .get('/api/v1/people-growth/my-profile')
        .set('Authorization', `Bearer ${agent.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('gaps');
      expect(response.body.gaps).toHaveProperty('total');
      expect(response.body.gaps).toHaveProperty('open');
      expect(response.body.gaps).toHaveProperty('closed');
      expect(response.body.gaps).toHaveProperty('byDomain');
      expect(response.body.gaps.total).toBe(2);
      expect(response.body.gaps.open).toBe(1);
      expect(response.body.gaps.closed).toBe(1);
    });
  });
});
