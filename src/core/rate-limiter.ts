/**
 * Advanced rate limiter with multiple strategies
 * Prevents detection through request throttling
 */

export interface RateLimitConfig {
  maxRequestsPerSecond: number;
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  maxConcurrent: number;
  backoffMultiplier: number;
  backoffMax: number;
}

interface RequestTimestamp {
  timestamp: number;
  url: string;
}

export class RateLimiter {
  private config: RateLimitConfig;
  private requests: RequestTimestamp[] = [];
  private concurrentRequests: Set<string> = new Set();
  private backoffTime: number = 0;
  private lastBackoff: number = 0;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      maxRequestsPerSecond: config.maxRequestsPerSecond || 2,
      maxRequestsPerMinute: config.maxRequestsPerMinute || 60,
      maxRequestsPerHour: config.maxRequestsPerHour || 1000,
      maxConcurrent: config.maxConcurrent || 5,
      backoffMultiplier: config.backoffMultiplier || 2,
      backoffMax: config.backoffMax || 60000, // 1 minute max
    };
  }

  /**
   * Wait until request can be made (respects rate limits)
   */
  async waitForSlot(url: string): Promise<void> {
    const requestId = `${url}-${Date.now()}`;

    while (true) {
      // Clean old requests
      this.cleanOldRequests();

      // Check backoff
      if (this.isInBackoff()) {
        const backoffRemaining = this.getBackoffRemaining();
        await this.sleep(backoffRemaining);
        continue;
      }

      // Check concurrent limit
      if (this.concurrentRequests.size >= this.config.maxConcurrent) {
        await this.sleep(100);
        continue;
      }

      // Check rate limits
      const limits = this.checkLimits();

      if (limits.canProceed) {
        // Add request
        this.requests.push({ timestamp: Date.now(), url });
        this.concurrentRequests.add(requestId);

        return;
      }

      // Wait for next available slot
      await this.sleep(limits.waitTime || 1000);
    }
  }

  /**
   * Mark request as completed
   */
  releaseSlot(url: string): void {
    const requestId = Array.from(this.concurrentRequests).find(id =>
      id.startsWith(url)
    );

    if (requestId) {
      this.concurrentRequests.delete(requestId);
    }
  }

  /**
   * Trigger backoff (when rate limited by server)
   */
  triggerBackoff(): void {
    if (this.backoffTime === 0) {
      this.backoffTime = 1000; // Start with 1 second
    } else {
      this.backoffTime = Math.min(
        this.backoffTime * this.config.backoffMultiplier,
        this.config.backoffMax
      );
    }

    this.lastBackoff = Date.now();
    console.log(`Rate limit detected, backing off for ${this.backoffTime}ms`);
  }

  /**
   * Reset backoff
   */
  resetBackoff(): void {
    this.backoffTime = 0;
    this.lastBackoff = 0;
  }

  /**
   * Check if currently in backoff period
   */
  private isInBackoff(): boolean {
    if (this.backoffTime === 0) return false;

    const elapsed = Date.now() - this.lastBackoff;
    return elapsed < this.backoffTime;
  }

  /**
   * Get remaining backoff time
   */
  private getBackoffRemaining(): number {
    if (!this.isInBackoff()) return 0;

    const elapsed = Date.now() - this.lastBackoff;
    return Math.max(0, this.backoffTime - elapsed);
  }

  /**
   * Check all rate limits
   */
  private checkLimits(): { canProceed: boolean; waitTime?: number } {
    const now = Date.now();

    // Count requests in different time windows
    const lastSecond = this.requests.filter(r => now - r.timestamp < 1000).length;
    const lastMinute = this.requests.filter(r => now - r.timestamp < 60000).length;
    const lastHour = this.requests.filter(r => now - r.timestamp < 3600000).length;

    // Check limits
    if (lastSecond >= this.config.maxRequestsPerSecond) {
      return { canProceed: false, waitTime: 1000 };
    }

    if (lastMinute >= this.config.maxRequestsPerMinute) {
      return { canProceed: false, waitTime: 5000 };
    }

    if (lastHour >= this.config.maxRequestsPerHour) {
      return { canProceed: false, waitTime: 60000 };
    }

    return { canProceed: true };
  }

  /**
   * Clean requests older than 1 hour
   */
  private cleanOldRequests(): void {
    const now = Date.now();
    const oneHourAgo = now - 3600000;

    this.requests = this.requests.filter(r => r.timestamp > oneHourAgo);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current statistics
   */
  getStats(): {
    requestsLastSecond: number;
    requestsLastMinute: number;
    requestsLastHour: number;
    concurrentRequests: number;
    isInBackoff: boolean;
    backoffRemaining: number;
  } {
    const now = Date.now();

    return {
      requestsLastSecond: this.requests.filter(r => now - r.timestamp < 1000).length,
      requestsLastMinute: this.requests.filter(r => now - r.timestamp < 60000).length,
      requestsLastHour: this.requests.filter(r => now - r.timestamp < 3600000).length,
      concurrentRequests: this.concurrentRequests.size,
      isInBackoff: this.isInBackoff(),
      backoffRemaining: this.getBackoffRemaining(),
    };
  }

  /**
   * Reset all counters
   */
  reset(): void {
    this.requests = [];
    this.concurrentRequests.clear();
    this.resetBackoff();
  }
}

/**
 * Decorator to automatically apply rate limiting to async methods
 */
export function rateLimit(limiter: RateLimiter) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const url = args[0] || 'unknown';

      await limiter.waitForSlot(url);

      try {
        const result = await originalMethod.apply(this, args);
        limiter.releaseSlot(url);
        return result;
      } catch (error: any) {
        limiter.releaseSlot(url);

        // Trigger backoff if rate limited
        if (error.response?.status === 429 || error.message?.includes('rate limit')) {
          limiter.triggerBackoff();
        }

        throw error;
      }
    };

    return descriptor;
  };
}
