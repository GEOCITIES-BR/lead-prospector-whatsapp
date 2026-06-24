import { describe, it, expect } from 'vitest';
import { buildApp } from '../../src/api/app.js';
import { validateEnv } from '../../config/validate-env.js';

describe('API Auth (integration)', () => {
  it('should reject requests without auth', async () => {
    const env = validateEnv();
    const app = await buildApp(env);

    const response = await app.inject({
      method: 'GET',
      url: '/api/dashboard/overview',
    });

    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.error).toBe(true);

    await app.close();
  });

  it('should allow public routes without auth', async () => {
    const env = validateEnv();
    const app = await buildApp(env);

    const response = await app.inject({
      method: 'GET',
      url: '/api/health',
    });

    expect(response.statusCode).toBe(200);

    await app.close();
  });

  it('should reject invalid API key', async () => {
    const env = validateEnv();
    const app = await buildApp(env);

    const response = await app.inject({
      method: 'GET',
      url: '/api/dashboard/overview',
      headers: { 'x-api-key': 'invalid_key' },
    });

    expect(response.statusCode).toBe(401);

    await app.close();
  });
});
