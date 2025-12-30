import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export interface TestUser {
  id: string;
  email: string;
  name: string;
  role: 'company_admin' | 'supervisor' | 'agent' | 'viewer';
  companyId: string;
  token: string;
}

export interface TestCompany {
  id: string;
  name: string;
  domain: string;
}

/**
 * Create a test company
 */
export async function createTestCompany(data?: Partial<TestCompany>): Promise<TestCompany> {
  const company = await prisma.company.create({
    data: {
      name: data?.name || 'Test Company',
      domain: data?.domain || `test-${Date.now()}.com`,
      active: true,
    },
  });

  return company;
}

/**
 * Create a test user with authentication token
 */
export async function createTestUser(
  companyId: string,
  role: 'company_admin' | 'supervisor' | 'agent' | 'viewer' = 'agent',
  data?: Partial<TestUser>
): Promise<TestUser> {
  const passwordHash = await bcrypt.hash('password123', 10);

  const user = await prisma.user.create({
    data: {
      companyId,
      email: data?.email || `user-${Date.now()}@test.com`,
      name: data?.name || 'Test User',
      passwordHash,
      role,
      active: true,
    },
  });

  const token = jwt.sign(
    {
      userId: user.id,
      companyId: user.companyId,
      role: user.role,
    },
    process.env.JWT_SECRET || 'test-secret-key-min-32-characters-long',
    { expiresIn: '1h' }
  );

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: role,
    companyId: user.companyId,
    token,
  };
}

/**
 * Create complete test context (company + users)
 */
export async function createTestContext() {
  const company = await createTestCompany();

  const admin = await createTestUser(company.id, 'company_admin', {
    email: 'admin@test.com',
    name: 'Admin User',
  });

  const agent = await createTestUser(company.id, 'agent', {
    email: 'agent@test.com',
    name: 'Agent User',
  });

  const viewer = await createTestUser(company.id, 'viewer', {
    email: 'viewer@test.com',
    name: 'Viewer User',
  });

  return {
    company,
    admin,
    agent,
    viewer,
  };
}

/**
 * Create a test contact
 */
export async function createTestContact(companyId: string, data?: any) {
  return prisma.contact.create({
    data: {
      companyId,
      name: data?.name || `Contact ${Date.now()}`,
      email: data?.email || `contact-${Date.now()}@test.com`,
      phone: data?.phone || '+5511999999999',
      ...data,
    },
  });
}

/**
 * Create a test deal
 */
export async function createTestDeal(companyId: string, contactId: string, ownerId: string, data?: any) {
  return prisma.deal.create({
    data: {
      companyId,
      contactId,
      ownerId,
      title: data?.title || 'Test Deal',
      value: data?.value || 10000,
      stage: data?.stage || 'PROSPECTING',
      status: data?.status || 'OPEN',
      ...data,
    },
  });
}

/**
 * Create a test interaction
 */
export async function createTestInteraction(
  companyId: string,
  userId: string,
  contactId: string,
  data?: any
) {
  return prisma.interaction.create({
    data: {
      companyId,
      userId,
      contactId,
      type: data?.type || 'email',
      content: data?.content || 'Test interaction content',
      direction: data?.direction || 'outbound',
      ...data,
    },
  });
}

/**
 * Create a test knowledge node
 */
export async function createTestKnowledgeNode(
  companyId: string,
  createdById: string,
  data?: any
) {
  return prisma.knowledgeNode.create({
    data: {
      companyId,
      createdById,
      title: data?.title || 'Test Knowledge Node',
      content: data?.content || 'Test content',
      nodeType: data?.nodeType || 'ZETTEL',
      tags: data?.tags || ['test'],
      ...data,
    },
  });
}

/**
 * Create test company policy
 */
export async function createTestCompanyPolicy(companyId: string, data?: any) {
  return prisma.companyPolicy.create({
    data: {
      companyId,
      maxAutonomy: data?.maxAutonomy || {
        viewer: {
          create_zettel: 'SUGGEST',
          send_notification: 'BLOCK',
          send_external_message: 'BLOCK',
          create_reminder: 'SUGGEST',
        },
        agent: {
          create_zettel: 'EXECUTE',
          send_notification: 'SUGGEST',
          send_external_message: 'SUGGEST',
          create_reminder: 'EXECUTE',
        },
        supervisor: {
          create_zettel: 'EXECUTE',
          send_notification: 'EXECUTE',
          send_external_message: 'EXECUTE',
          create_reminder: 'EXECUTE',
        },
        company_admin: {
          create_zettel: 'EXECUTE',
          send_notification: 'EXECUTE',
          send_external_message: 'EXECUTE',
          create_reminder: 'EXECUTE',
        },
      },
      forbidden: data?.forbidden || [],
      auditRules: data?.auditRules || {
        retention_days: 365,
        immutable: true,
        export_allowed: false,
      },
      rateLimits: data?.rateLimits || {
        ai_calls_per_user_per_day: 100,
        ai_calls_per_company_per_day: 1000,
        automations_per_hour: 50,
      },
    },
  });
}

/**
 * Create test attention profile
 */
export async function createTestAttentionProfile(userId: string, data?: any) {
  return prisma.attentionProfile.create({
    data: {
      userId,
      level: data?.level || 'BALANCED',
      quietHours: data?.quietHours || [],
      channels: data?.channels || {
        email: true,
        push: true,
        inapp: true,
        whatsapp: false,
        sms: false,
      },
      vipList: data?.vipList || {
        contacts: [],
        projects: [],
        deals: [],
      },
      autonomy: data?.autonomy || {
        create_zettel: 'EXECUTE',
        create_reminder: 'EXECUTE',
        send_notification: 'EXECUTE',
        send_external_message: 'SUGGEST',
      },
    },
  });
}

/**
 * Wait for async operations
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mock OpenAI responses
 */
export function mockOpenAI() {
  return {
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  gaps: [],
                  strengths: ['Good communication'],
                  overall_quality: 8,
                }),
              },
            },
          ],
        }),
      },
    },
  };
}

export { prisma };
