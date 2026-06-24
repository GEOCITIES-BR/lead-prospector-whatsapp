import { describe, it, expect } from 'vitest';
import { RateLimiter } from '../../src/modules/scraping/rate-limiter.js';

describe('RateLimiter', () => {
  it('should allow the first request immediately', async () => {
    const limiter = new RateLimiter(500, 1);
    const start = Date.now();
    await limiter.waitIfNeeded();
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(100);
  });

  it('should delay the second request within the window', async () => {
    const limiter = new RateLimiter(200, 1);

    await limiter.waitIfNeeded();
    const start = Date.now();
    await limiter.waitIfNeeded();
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(190);
  });

  it('should allow burst of requests within window up to max', async () => {
    const limiter = new RateLimiter(500, 3);

    const start = Date.now();
    await limiter.waitIfNeeded();
    await limiter.waitIfNeeded();
    await limiter.waitIfNeeded();
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(200);
  });

  it('should delay when exceeding max requests in window', async () => {
    const limiter = new RateLimiter(500, 2);

    await limiter.waitIfNeeded();
    await limiter.waitIfNeeded();
    const start = Date.now();
    await limiter.waitIfNeeded();
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(490);
  });

  it('should reset the counter', async () => {
    const limiter = new RateLimiter(500, 1);

    await limiter.waitIfNeeded();
    limiter.reset();

    const start = Date.now();
    await limiter.waitIfNeeded();
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(100);
  });
});
