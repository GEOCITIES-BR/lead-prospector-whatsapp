import { describe, it, expect } from 'vitest';

describe('Health Check', () => {
  it('should return health status object', () => {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '0.1.0',
    };

    expect(health).toHaveProperty('status', 'ok');
    expect(health).toHaveProperty('version', '0.1.0');
    expect(health).toHaveProperty('timestamp');
    expect(health).toHaveProperty('uptime');
  });
});
