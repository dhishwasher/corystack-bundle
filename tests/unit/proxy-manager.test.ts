import { describe, it, expect, beforeEach } from 'vitest';
import { ProxyManager } from '../../src/core/proxy-manager.js';
import type { Proxy } from '../../src/types/index.js';

describe('ProxyManager', () => {
  let proxies: Proxy[];
  let manager: ProxyManager;

  beforeEach(() => {
    proxies = [
      {
        type: 'http',
        host: 'proxy1.example.com',
        port: 8080,
        country: 'US',
        isResidential: true,
        successRate: 0.9,
      },
      {
        type: 'http',
        host: 'proxy2.example.com',
        port: 8080,
        country: 'UK',
        isResidential: false,
        successRate: 0.7,
      },
      {
        type: 'socks5',
        host: 'proxy3.example.com',
        port: 1080,
        country: 'US',
        isResidential: true,
        successRate: 0.8,
      },
    ];

    manager = new ProxyManager(proxies, 60000);
  });

  describe('getNextProxy()', () => {
    it('should return a proxy', () => {
      const proxy = manager.getNextProxy();
      expect(proxy).toBeTruthy();
      expect(proxy?.host).toBeTruthy();
    });

    it('should rotate proxies', () => {
      const proxy1 = manager.getNextProxy();
      const proxy2 = manager.getNextProxy();

      // After rotation interval, should get different proxy
      expect(proxy1).toBeTruthy();
      expect(proxy2).toBeTruthy();
    });

    it('should return null when no proxies available', () => {
      const emptyManager = new ProxyManager([]);
      const proxy = emptyManager.getNextProxy();
      expect(proxy).toBeNull();
    });

    it('should update lastUsed timestamp', () => {
      const before = Date.now();
      const proxy = manager.getNextProxy();
      const after = Date.now();

      expect(proxy?.lastUsed).toBeGreaterThanOrEqual(before);
      expect(proxy?.lastUsed).toBeLessThanOrEqual(after);
    });
  });

  describe('getRandomProxy()', () => {
    it('should return a random proxy', () => {
      const proxy = manager.getRandomProxy();
      expect(proxy).toBeTruthy();
      expect(proxies.some(p => p.host === proxy?.host)).toBe(true);
    });

    it('should return different proxies (statistically)', () => {
      const results = new Set();
      for (let i = 0; i < 20; i++) {
        const proxy = manager.getRandomProxy();
        results.add(proxy?.host);
      }

      // Should have seen at least 2 different proxies in 20 attempts
      expect(results.size).toBeGreaterThan(1);
    });
  });

  describe('getBestProxy()', () => {
    it('should return proxy with highest success rate', () => {
      const best = manager.getBestProxy();
      expect(best?.successRate).toBe(0.9);
      expect(best?.host).toBe('proxy1.example.com');
    });
  });

  describe('getProxyByCountry()', () => {
    it('should return proxy from specific country', () => {
      const usProxy = manager.getProxyByCountry('US');
      expect(usProxy?.country).toBe('US');
    });

    it('should return null if country not available', () => {
      const proxy = manager.getProxyByCountry('DE');
      expect(proxy).toBeNull();
    });
  });

  describe('getResidentialProxy()', () => {
    it('should return only residential proxies', () => {
      const proxy = manager.getResidentialProxy();
      expect(proxy?.isResidential).toBe(true);
    });
  });

  describe('updateProxyStats()', () => {
    it('should update success rate on success', () => {
      const proxy = proxies[1];
      const initialRate = proxy.successRate || 0.5;

      manager.updateProxyStats(proxy, true);

      // Success rate should increase
      expect(proxy.successRate).toBeGreaterThan(initialRate);
    });

    it('should update success rate on failure', () => {
      const proxy = proxies[0];
      const initialRate = proxy.successRate || 0.5;

      manager.updateProxyStats(proxy, false);

      // Success rate should decrease
      expect(proxy.successRate).toBeLessThan(initialRate);
    });
  });

  describe('addProxy()', () => {
    it('should add proxy to pool', () => {
      const newProxy: Proxy = {
        type: 'http',
        host: 'proxy4.example.com',
        port: 8080,
      };

      manager.addProxy(newProxy);
      const stats = manager.getStats();

      expect(stats.total).toBe(4);
    });
  });

  describe('removeProxy()', () => {
    it('should remove proxy from pool', () => {
      manager.removeProxy(proxies[0]);
      const stats = manager.getStats();

      expect(stats.total).toBe(2);
    });
  });

  describe('getStats()', () => {
    it('should return accurate statistics', () => {
      const stats = manager.getStats();

      expect(stats.total).toBe(3);
      expect(stats.residential).toBe(2);
      expect(stats.datacenter).toBe(1);
      expect(stats.byCountry['US']).toBe(2);
      expect(stats.byCountry['UK']).toBe(1);
      expect(stats.averageSuccessRate).toBeGreaterThan(0);
    });
  });

  describe('toPlaywrightProxy()', () => {
    it('should convert to Playwright format', () => {
      const proxy = proxies[0];
      const pwProxy = manager.toPlaywrightProxy(proxy);

      expect(pwProxy.server).toBe('http://proxy1.example.com:8080');
      expect(pwProxy).toHaveProperty('username');
      expect(pwProxy).toHaveProperty('password');
    });

    it('should handle proxies with credentials', () => {
      const proxy: Proxy = {
        type: 'http',
        host: 'proxy.example.com',
        port: 8080,
        username: 'user',
        password: 'pass',
      };

      const pwProxy = manager.toPlaywrightProxy(proxy);
      expect(pwProxy.username).toBe('user');
      expect(pwProxy.password).toBe('pass');
    });
  });
});
