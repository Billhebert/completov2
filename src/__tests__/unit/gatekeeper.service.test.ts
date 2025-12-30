import { GatekeeperService } from '../../modules/gatekeeper/gatekeeper.service';
import { PrismaClient } from '@prisma/client';
import {
  createTestCompany,
  createTestUser,
  createTestCompanyPolicy,
  createTestAttentionProfile,
  createTestContact,
} from '../helpers/test-helpers';

const prisma = new PrismaClient();
const gatekeeperService = new GatekeeperService();

describe('GatekeeperService', () => {
  let company: any;
  let admin: any;
  let agent: any;
  let viewer: any;
  let policy: any;

  beforeEach(async () => {
    company = await createTestCompany();
    admin = await createTestUser(company.id, 'company_admin');
    agent = await createTestUser(company.id, 'agent');
    viewer = await createTestUser(company.id, 'viewer');

    policy = await createTestCompanyPolicy(company.id);
  });

  describe('shouldExecute', () => {
    it('should EXECUTE for company_admin on any action', async () => {
      const result = await gatekeeperService.shouldExecute({
        userId: admin.id,
        companyId: company.id,
        action: 'create_zettel',
        context: { title: 'Test' },
      });

      expect(result.decision).toBe('EXECUTE');
      expect(result.reason).toContain('All checks passed');
    });

    it('should EXECUTE for agent on allowed action', async () => {
      await createTestAttentionProfile(agent.id, {
        autonomy: {
          create_zettel: 'EXECUTE',
          create_reminder: 'EXECUTE',
          send_notification: 'EXECUTE',
          send_external_message: 'SUGGEST',
        },
      });

      const result = await gatekeeperService.shouldExecute({
        userId: agent.id,
        companyId: company.id,
        action: 'create_zettel',
        context: { title: 'Test' },
      });

      expect(result.decision).toBe('EXECUTE');
    });

    it('should SUGGEST for agent on restricted action', async () => {
      await createTestAttentionProfile(agent.id, {
        autonomy: {
          create_zettel: 'EXECUTE',
          create_reminder: 'EXECUTE',
          send_notification: 'SUGGEST',
          send_external_message: 'SUGGEST',
        },
      });

      const result = await gatekeeperService.shouldExecute({
        userId: agent.id,
        companyId: company.id,
        action: 'send_external_message',
        context: { to: 'client@example.com' },
      });

      expect(result.decision).toBe('SUGGEST');
      expect(result.reason).toContain('User autonomy level is SUGGEST');
    });

    it('should BLOCK for viewer on restricted action', async () => {
      await createTestAttentionProfile(viewer.id, {
        autonomy: {
          create_zettel: 'SUGGEST',
          create_reminder: 'SUGGEST',
          send_notification: 'BLOCK',
          send_external_message: 'BLOCK',
        },
      });

      const result = await gatekeeperService.shouldExecute({
        userId: viewer.id,
        companyId: company.id,
        action: 'send_notification',
        context: { message: 'Test' },
      });

      expect(result.decision).toBe('BLOCK');
      expect(result.reason).toContain('User autonomy level is BLOCK');
    });

    it('should BLOCK forbidden actions', async () => {
      await prisma.companyPolicy.update({
        where: { id: policy.id },
        data: {
          forbidden: ['delete_contact_auto', 'send_external_message'],
        },
      });

      const result = await gatekeeperService.shouldExecute({
        userId: admin.id,
        companyId: company.id,
        action: 'send_external_message',
        context: {},
      });

      expect(result.decision).toBe('BLOCK');
      expect(result.reason).toContain('forbidden by company policy');
    });

    it('should respect quiet hours', async () => {
      const now = new Date();
      const quietStart = new Date(now);
      quietStart.setHours(now.getHours() - 1);

      const quietEnd = new Date(now);
      quietEnd.setHours(now.getHours() + 1);

      await createTestAttentionProfile(agent.id, {
        quietHours: [
          {
            start: quietStart.toISOString().split('T')[1].substring(0, 5),
            end: quietEnd.toISOString().split('T')[1].substring(0, 5),
            days: [now.getDay()],
            timezone: 'America/Sao_Paulo',
          },
        ],
      });

      const result = await gatekeeperService.shouldExecute({
        userId: agent.id,
        companyId: company.id,
        action: 'send_notification',
        context: { message: 'Test' },
      });

      expect(result.decision).toBe('SUGGEST');
      expect(result.reason).toContain('quiet hours');
    });

    it('should EXECUTE for VIP contacts', async () => {
      const contact = await createTestContact(company.id);

      await createTestAttentionProfile(agent.id, {
        vipList: {
          contacts: [contact.id],
          projects: [],
          deals: [],
        },
        autonomy: {
          create_zettel: 'EXECUTE',
          create_reminder: 'EXECUTE',
          send_notification: 'SUGGEST',
          send_external_message: 'SUGGEST',
        },
      });

      const result = await gatekeeperService.shouldExecute({
        userId: agent.id,
        companyId: company.id,
        action: 'send_notification',
        context: {
          message: 'Test',
          contactId: contact.id,
        },
      });

      expect(result.decision).toBe('EXECUTE');
      expect(result.reason).toContain('VIP');
    });

    it('should calculate attention score and limit spam', async () => {
      await createTestAttentionProfile(agent.id);

      // Simulate multiple notifications in short time
      for (let i = 0; i < 10; i++) {
        await gatekeeperService.shouldExecute({
          userId: agent.id,
          companyId: company.id,
          action: 'send_notification',
          context: { message: `Test ${i}` },
        });
      }

      const result = await gatekeeperService.shouldExecute({
        userId: agent.id,
        companyId: company.id,
        action: 'send_notification',
        context: { message: 'Spam test' },
      });

      // Should downgrade decision due to high attention score
      expect(['SUGGEST', 'LOG_ONLY']).toContain(result.decision);
    });

    it('should create gatekeeper log', async () => {
      await gatekeeperService.shouldExecute({
        userId: agent.id,
        companyId: company.id,
        action: 'create_zettel',
        context: { title: 'Test' },
      });

      const logs = await prisma.gatekeeperLog.findMany({
        where: { userId: agent.id },
      });

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].action).toBe('create_zettel');
    });
  });

  describe('Decision Logs', () => {
    it('should store decision logs in database', async () => {
      await gatekeeperService.shouldExecute({
        userId: agent.id,
        companyId: company.id,
        action: 'create_zettel',
        context: { title: 'Test 1' },
      });

      await gatekeeperService.shouldExecute({
        userId: agent.id,
        companyId: company.id,
        action: 'send_notification',
        context: { message: 'Test 2' },
      });

      const logs = await prisma.gatekeeperLog.findMany({
        where: { userId: agent.id, companyId: company.id },
        orderBy: { timestamp: 'desc' },
      });

      expect(logs.length).toBeGreaterThanOrEqual(2);
      expect(logs[0].action).toBeDefined();
      expect(logs[0].decision).toBeDefined();
    });

    it('should filter logs by action in database', async () => {
      await gatekeeperService.shouldExecute({
        userId: agent.id,
        companyId: company.id,
        action: 'create_zettel',
        context: { title: 'Test 1' },
      });

      await gatekeeperService.shouldExecute({
        userId: agent.id,
        companyId: company.id,
        action: 'send_notification',
        context: { message: 'Test 2' },
      });

      const logs = await prisma.gatekeeperLog.findMany({
        where: {
          userId: agent.id,
          companyId: company.id,
          action: 'create_zettel'
        },
      });

      expect(logs.length).toBeGreaterThanOrEqual(1);
      expect(logs[0].action).toBe('create_zettel');
    });
  });

  describe('Pending Actions', () => {
    it('should store SUGGEST decisions in logs', async () => {
      await createTestAttentionProfile(agent.id, {
        autonomy: {
          create_zettel: 'EXECUTE',
          create_reminder: 'EXECUTE',
          send_notification: 'SUGGEST',
          send_external_message: 'SUGGEST',
        },
      });

      await gatekeeperService.shouldExecute({
        userId: agent.id,
        companyId: company.id,
        action: 'send_notification',
        context: { message: 'Test' },
      });

      const suggestedLogs = await prisma.gatekeeperLog.findMany({
        where: {
          userId: agent.id,
          companyId: company.id,
          decision: 'SUGGEST'
        },
      });

      expect(suggestedLogs.length).toBeGreaterThanOrEqual(1);
      expect(suggestedLogs[0].decision).toBe('SUGGEST');
      expect(suggestedLogs[0].action).toBe('send_notification');
    });
  });
});
