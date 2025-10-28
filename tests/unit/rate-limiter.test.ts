import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RateLimiter } from '../../src/core/rate-limiter.js';

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter({
      maxRequestsPerSecond: 2,
      maxRequestsPerMinute: 10,
      maxRequestsPerHour: 100,
      maxConcurrent: 3,
      backoffMultiplier: 2,
      backoffMax: 10000,
    });
  });

  describe('waitForSlot()', () => {
    it('should allow requests within rate limits', async () => {
      const url = 'https://example.com';

      // Should complete quickly (no waiting)
      const start = Date.now();
      await limiter.waitForSlot(url);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100); // Should be nearly instant
      limiter.releaseSlot(url);
    });

    it('should enforce per-second rate limit', async () => {
      const url = 'https://example.com';

      // First 2 should be instant
      await limiter.waitForSlot(url);
      limiter.releaseSlot(url);
      await limiter.waitForSlot(url);
      limiter.releaseSlot(url);

      // Third should wait ~1 second
      const start = Date.now();
      await limiter.waitForSlot(url);
      const duration = Date.now() - start;

      expect(duration).toBeGreaterThanOrEqual(900); // Allow 100ms tolerance
      limiter.releaseSlot(url);
    }, 2000);

    it('should enforce concurrent request limit', async () => {
      const url = 'https://example.com';

      // Fill up concurrent slots
      await limiter.waitForSlot(url);
      await limiter.waitForSlot(url);
      await limiter.waitForSlot(url);

      // Fourth should wait
      const start = Date.now();
      const promise = limiter.waitForSlot(url);

      // Release one slot after a delay
      setTimeout(() => {
        limiter.releaseSlot(url);
      }, 150);

      await promise;
      const duration = Date.now() - start;

      expect(duration).toBeGreaterThanOrEqual(100);
      limiter.releaseSlot(url);
      limiter.releaseSlot(url);
      limiter.releaseSlot(url);
    }, 2000);
  });

  describe('triggerBackoff()', () => {
    it('should trigger exponential backoff', async () => {
      limiter.triggerBackoff();

      const start = Date.now();
      await limiter.waitForSlot('https://example.com');
      const duration = Date.now() - start;

      // Should wait at least 1 second (initial backoff)
      expect(duration).toBeGreaterThanOrEqual(900);
      limiter.releaseSlot('https://example.com');
    }, 2000);

    it('should increase backoff exponentially', () => {
      limiter.triggerBackoff();
      const stats1 = limiter.getStats();

      limiter.triggerBackoff();
      const stats2 = limiter.getStats();

      expect(stats2.backoffRemaining).toBeGreaterThan(stats1.backoffRemaining);
    });

    it('should respect max backoff', () => {
      // Trigger many times to exceed max
      for (let i = 0; i < 10; i++) {
        limiter.triggerBackoff();
      }

      const stats = limiter.getStats();
      expect(stats.backoffRemaining).toBeLessThanOrEqual(10000);
    });
  });

  describe('getStats()', () => {
    it('should return current statistics', async () => {
      await limiter.waitForSlot('https://example.com');

      const stats = limiter.getStats();

      expect(stats).toHaveProperty('requestsLastSecond');
      expect(stats).toHaveProperty('requestsLastMinute');
      expect(stats).toHaveProperty('requestsLastHour');
      expect(stats).toHaveProperty('concurrentRequests');
      expect(stats).toHaveProperty('isInBackoff');
      expect(stats).toHaveProperty('backoffRemaining');

      expect(stats.requestsLastSecond).toBe(1);
      expect(stats.concurrentRequests).toBe(1);
      expect(stats.isInBackoff).toBe(false);

      limiter.releaseSlot('https://example.com');
    });
  });

  describe('reset()', () => {
    it('should reset all counters', async () => {
      await limiter.waitForSlot('https://example.com');
      limiter.triggerBackoff();

      limiter.reset();

      const stats = limiter.getStats();
      expect(stats.requestsLastSecond).toBe(0);
      expect(stats.requestsLastMinute).toBe(0);
      expect(stats.requestsLastHour).toBe(0);
      expect(stats.concurrentRequests).toBe(0);
      expect(stats.isInBackoff).toBe(false);
    });
  });
});
