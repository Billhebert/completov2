import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/omni_test',
    },
  },
});

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean database using TRUNCATE with CASCADE in a single statement
  // This is faster and handles foreign key constraints automatically
  await prisma.$executeRawUnsafe(`
    DO $$
    DECLARE
      statements CURSOR FOR
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public' AND tablename != '_prisma_migrations';
    BEGIN
      FOR stmt IN statements LOOP
        EXECUTE 'TRUNCATE TABLE ' || quote_ident(stmt.tablename) || ' RESTART IDENTITY CASCADE';
      END LOOP;
    END $$;
  `);
});

export { prisma };
