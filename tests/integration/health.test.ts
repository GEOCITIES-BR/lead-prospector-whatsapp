import { describe, it, expect } from 'vitest';
import { buildApp } from '../../src/api/app.js';
import { validateEnv } from '../../config/validate-env.js';
import type { Env } from '../../config/env.schema.js';

describe('Health Check (integration)', () => {
  it('should return health status', async () => {
    const env: Env = validateEnv();
    const app = await buildApp(env);

    const response = await app.inject({
      method: 'GET',
      url: '/api/health',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe('ok');
    expect(body).toHaveProperty('uptime');
    expect(body).toHaveProperty('timestamp');

    await app.close();
  });
});
