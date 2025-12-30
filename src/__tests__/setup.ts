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
  // Clean database before each test
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `;

  for (const { tablename } of tables) {
    if (tablename !== '_prisma_migrations') {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
      } catch (error) {
        console.warn(`Could not truncate ${tablename}:`, error);
      }
    }
  }
});

export { prisma };
