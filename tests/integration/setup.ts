// Integration test setup
// Requires a running PostgreSQL instance at DATABASE_URL.
// Run: docker compose up -d postgres
// Then: npx vitest run --config vitest.integration.ts

import { PrismaClient } from '@prisma/client';
import { execSync } from 'node:child_process';

let prisma: PrismaClient | null = null;

export async function setupTestDB(): Promise<PrismaClient> {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não definida. Execute docker compose up -d postgres primeiro.');
  }

  // Push schema to test DB
  execSync('npx prisma db push --force-reset', {
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    stdio: 'pipe',
  });

  prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  });

  return prisma;
}

export async function teardownTestDB(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

export function getTestPrisma(): PrismaClient {
  if (!prisma) throw new Error('DB not initialized. Call setupTestDB() first.');
  return prisma;
}
