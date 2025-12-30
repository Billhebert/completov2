import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { join } from 'path';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/omni_test',
    },
  },
});

beforeAll(async () => {
  // Run migrations for test database
  const prismaBinary = join(__dirname, '..', '..', 'node_modules', '.bin', 'prisma');

  try {
    execSync(`${prismaBinary} migrate deploy`, {
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/omni_test',
      },
    });
  } catch (error) {
    console.warn('Migration already applied or database not available:', error);
  }

  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean database before each test using DELETE instead of TRUNCATE
  // to avoid foreign key issues
  try {
    // Delete in correct order to respect foreign key constraints
    await prisma.gatekeeperLog.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.workflowExecution.deleteMany({});
    await prisma.knowledgeLink.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.attentionProfile.deleteMany({});
    await prisma.employeeGap.deleteMany({});
    await prisma.learningProgress.deleteMany({});
    await prisma.learningPath.deleteMany({});
    await prisma.simulationSession.deleteMany({});
    await prisma.simulationScenario.deleteMany({});
    await prisma.interaction.deleteMany({});
    await prisma.deal.deleteMany({});
    await prisma.contact.deleteMany({});
    await prisma.knowledgeNode.deleteMany({});
    await prisma.workflow.deleteMany({});
    await prisma.companyPolicy.deleteMany({});
    await prisma.message.deleteMany({});
    await prisma.conversation.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.company.deleteMany({});
  } catch (error) {
    console.warn('Could not clean database:', error);
  }
}, 30000); // 30 second timeout

export { prisma };
