import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../src/api/app.js';
import { validateEnv } from '../../config/validate-env.js';
import { setupTestDB, teardownTestDB, getTestPrisma } from './setup.js';
import type { FastifyInstance } from 'fastify';

describe('LGPD (integration)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    await setupTestDB();
    const env = validateEnv();
    app = await buildApp(env);
  });

  afterAll(async () => {
    await app.close();
    await teardownTestDB();
  });

  it('should process opt-out for existing lead', async () => {
    const prisma = getTestPrisma();

    const lead = await prisma.lead.create({
      data: { nome: 'Test', telefone: '5511999999999' },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/lgpd/opt-out',
      payload: { telefone: '5511999999999' },
    });

    expect(response.statusCode).toBe(200);

    const updated = await prisma.lead.findUnique({ where: { id: lead.id } });
    expect(updated?.status).toBe('opt_out');
  });
});
