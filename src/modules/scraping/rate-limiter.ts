export class RateLimiter {
  private requestTimestamps: number[] = [];
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 1000, maxRequests: number = 1) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    this.requestTimestamps = this.requestTimestamps.filter((t) => now - t < this.windowMs);

    if (this.requestTimestamps.length >= this.maxRequests) {
      const oldest = this.requestTimestamps[0];
      const waitTime = this.windowMs - (now - oldest) + 1;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      this.requestTimestamps = [];
    }

    this.requestTimestamps.push(Date.now());
  }

  reset(): void {
    this.requestTimestamps = [];
  }
}
