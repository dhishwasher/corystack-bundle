import { describe, it, expect, beforeEach } from 'vitest';
import { MonitoringSystem, AlertingSystem } from '../../src/core/monitoring.js';

describe('MonitoringSystem', () => {
  let monitoring: MonitoringSystem;

  beforeEach(() => {
    monitoring = new MonitoringSystem();
  });

  describe('logRequest()', () => {
    it('should log request', () => {
      monitoring.logRequest({
        timestamp: Date.now(),
        duration: 250,
        success: true,
        blocked: false,
        captcha: false,
        url: 'https://example.com',
      });

      const metrics = monitoring.getMetrics();
      expect(metrics.requests.total).toBe(1);
      expect(metrics.requests.successful).toBe(1);
    });

    it('should log failed requests', () => {
      monitoring.logRequest({
        timestamp: Date.now(),
        duration: 500,
        success: false,
        blocked: true,
        captcha: false,
        url: 'https://example.com',
      });

      const metrics = monitoring.getMetrics();
      expect(metrics.requests.failed).toBe(1);
      expect(metrics.requests.blocked).toBe(1);
    });
  });

  describe('getMetrics()', () => {
    it('should calculate correct metrics', () => {
      // Log some requests
      monitoring.logRequest({
        timestamp: Date.now(),
        duration: 250,
        success: true,
        blocked: false,
        captcha: false,
        url: 'https://example.com',
      });

      monitoring.logRequest({
        timestamp: Date.now(),
        duration: 300,
        success: true,
        blocked: false,
        captcha: false,
        url: 'https://example.com',
      });

      monitoring.logRequest({
        timestamp: Date.now(),
        duration: 500,
        success: false,
        blocked: true,
        captcha: true,
        url: 'https://example.com',
      });

      const metrics = monitoring.getMetrics();

      expect(metrics.requests.total).toBe(3);
      expect(metrics.requests.successful).toBe(2);
      expect(metrics.requests.failed).toBe(1);
      expect(metrics.requests.blocked).toBe(1);
      expect(metrics.requests.captcha).toBe(1);
      expect(metrics.performance.avgResponseTime).toBeCloseTo(350, 0);
    });

    it('should handle time windows', () => {
      const now = Date.now();

      // Request from 10 minutes ago
      monitoring.logRequest({
        timestamp: now - 600000,
        duration: 100,
        success: true,
        blocked: false,
        captcha: false,
        url: 'https://example.com',
      });

      // Recent request
      monitoring.logRequest({
        timestamp: now,
        duration: 200,
        success: true,
        blocked: false,
        captcha: false,
        url: 'https://example.com',
      });

      // Get metrics for last 5 minutes
      const metrics = monitoring.getMetrics(300000);

      // Should only include recent request
      expect(metrics.requests.total).toBe(1);
    });
  });

  describe('getSuccessRateTrend()', () => {
    it('should calculate success rate trend', () => {
      const now = Date.now();

      // Add requests over time
      for (let i = 0; i < 10; i++) {
        monitoring.logRequest({
          timestamp: now - (9 - i) * 60000, // Spread over 10 minutes
          duration: 200,
          success: i < 7, // 70% success rate
          blocked: i >= 7,
          captcha: false,
          url: 'https://example.com',
        });
      }

      const trend = monitoring.getSuccessRateTrend(10, 60000);

      expect(trend.length).toBe(10);
      trend.forEach(rate => {
        expect(rate).toBeGreaterThanOrEqual(0);
        expect(rate).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('isHealthy()', () => {
    it('should detect healthy system', () => {
      // Add successful requests
      for (let i = 0; i < 10; i++) {
        monitoring.logRequest({
          timestamp: Date.now(),
          duration: 200,
          success: true,
          blocked: false,
          captcha: false,
          url: 'https://example.com',
        });
      }

      const health = monitoring.isHealthy();
      expect(health.healthy).toBe(true);
      expect(health.issues.length).toBe(0);
    });

    it('should detect low success rate', () => {
      // Add mostly failed requests
      for (let i = 0; i < 10; i++) {
        monitoring.logRequest({
          timestamp: Date.now(),
          duration: 200,
          success: i < 3, // 30% success rate
          blocked: i >= 3,
          captcha: false,
          url: 'https://example.com',
        });
      }

      const health = monitoring.isHealthy({
        minSuccessRate: 70,
      });

      expect(health.healthy).toBe(false);
      expect(health.issues.length).toBeGreaterThan(0);
    });
  });

  describe('generateReport()', () => {
    it('should generate text report', () => {
      monitoring.logRequest({
        timestamp: Date.now(),
        duration: 250,
        success: true,
        blocked: false,
        captcha: false,
        url: 'https://example.com',
      });

      const report = monitoring.generateReport();

      expect(report).toContain('MONITORING REPORT');
      expect(report).toContain('Requests');
      expect(report).toContain('Performance');
    });
  });

  describe('reset()', () => {
    it('should reset all metrics', () => {
      monitoring.logRequest({
        timestamp: Date.now(),
        duration: 250,
        success: true,
        blocked: false,
        captcha: false,
        url: 'https://example.com',
      });

      monitoring.reset();

      const metrics = monitoring.getMetrics();
      expect(metrics.requests.total).toBe(0);
    });
  });
});

describe('AlertingSystem', () => {
  let alerting: AlertingSystem;

  beforeEach(() => {
    alerting = new AlertingSystem();
  });

  describe('alert()', () => {
    it('should trigger alert', () => {
      const alerts: any[] = [];

      alerting.onAlert('test', (alert) => {
        alerts.push(alert);
      });

      alerting.alert('high', 'Test alert');

      expect(alerts.length).toBe(1);
      expect(alerts[0].severity).toBe('high');
      expect(alerts[0].message).toBe('Test alert');
    });

    it('should store alerts', () => {
      alerting.alert('critical', 'Test 1');
      alerting.alert('medium', 'Test 2');

      const recent = alerting.getRecentAlerts();
      expect(recent.length).toBe(2);
    });
  });

  describe('getRecentAlerts()', () => {
    it('should limit returned alerts', () => {
      for (let i = 0; i < 150; i++) {
        alerting.alert('low', `Alert ${i}`);
      }

      const recent = alerting.getRecentAlerts(50);
      expect(recent.length).toBe(50);
    });
  });

  describe('clear()', () => {
    it('should clear all alerts', () => {
      alerting.alert('high', 'Test');
      alerting.clear();

      const recent = alerting.getRecentAlerts();
      expect(recent.length).toBe(0);
    });
  });
});
