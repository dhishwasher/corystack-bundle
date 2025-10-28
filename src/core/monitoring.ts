/**
 * Real-time monitoring and metrics collection
 * Provides insights into scraping performance and detection rates
 */

import type { Detection } from '../types/index.js';

export interface MonitoringMetrics {
  timestamp: number;
  requests: {
    total: number;
    successful: number;
    failed: number;
    blocked: number;
    captcha: number;
  };
  performance: {
    avgResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    requestsPerSecond: number;
  };
  detections: {
    total: number;
    byType: Record<string, number>;
    recentDetections: Detection[];
  };
  proxies: {
    total: number;
    active: number;
    avgSuccessRate: number;
    byCountry: Record<string, number>;
  };
  sessions: {
    active: number;
    total: number;
    avgDuration: number;
  };
}

interface RequestLog {
  timestamp: number;
  duration: number;
  success: boolean;
  blocked: boolean;
  captcha: boolean;
  url: string;
}

export class MonitoringSystem {
  private requests: RequestLog[] = [];
  private detections: Detection[] = [];
  private startTime: number = Date.now();
  private maxHistorySize: number = 10000;

  /**
   * Log a request
   */
  logRequest(log: RequestLog): void {
    this.requests.push(log);

    // Trim history if too large
    if (this.requests.length > this.maxHistorySize) {
      this.requests = this.requests.slice(-this.maxHistorySize);
    }
  }

  /**
   * Log a detection
   */
  logDetection(detection: Detection): void {
    this.detections.push(detection);

    // Keep only recent detections
    if (this.detections.length > 1000) {
      this.detections = this.detections.slice(-1000);
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(timeWindow: number = 300000): MonitoringMetrics {
    const now = Date.now();
    const windowStart = now - timeWindow;

    // Filter requests in time window
    const recentRequests = this.requests.filter(r => r.timestamp > windowStart);
    const recentDetections = this.detections.filter(d => d.timestamp > windowStart);

    // Calculate request metrics
    const totalRequests = recentRequests.length;
    const successfulRequests = recentRequests.filter(r => r.success).length;
    const failedRequests = totalRequests - successfulRequests;
    const blockedRequests = recentRequests.filter(r => r.blocked).length;
    const captchaRequests = recentRequests.filter(r => r.captcha).length;

    // Calculate performance metrics
    const durations = recentRequests.map(r => r.duration).filter(d => d > 0);
    const avgResponseTime =
      durations.length > 0
        ? durations.reduce((sum, d) => sum + d, 0) / durations.length
        : 0;
    const minResponseTime = durations.length > 0 ? Math.min(...durations) : 0;
    const maxResponseTime = durations.length > 0 ? Math.max(...durations) : 0;

    const timeWindowSeconds = timeWindow / 1000;
    const requestsPerSecond = totalRequests / timeWindowSeconds;

    // Calculate detection metrics
    const detectionsByType: Record<string, number> = {};
    recentDetections.forEach(d => {
      detectionsByType[d.type] = (detectionsByType[d.type] || 0) + 1;
    });

    return {
      timestamp: now,
      requests: {
        total: totalRequests,
        successful: successfulRequests,
        failed: failedRequests,
        blocked: blockedRequests,
        captcha: captchaRequests,
      },
      performance: {
        avgResponseTime,
        minResponseTime,
        maxResponseTime,
        requestsPerSecond,
      },
      detections: {
        total: recentDetections.length,
        byType: detectionsByType,
        recentDetections: recentDetections.slice(-10),
      },
      proxies: {
        total: 0, // To be filled by proxy manager
        active: 0,
        avgSuccessRate: 0,
        byCountry: {},
      },
      sessions: {
        active: 0, // To be filled by session manager
        total: 0,
        avgDuration: 0,
      },
    };
  }

  /**
   * Get success rate trend over time
   */
  getSuccessRateTrend(intervals: number = 10, intervalDuration: number = 60000): number[] {
    const now = Date.now();
    const trend: number[] = [];

    for (let i = intervals - 1; i >= 0; i--) {
      const intervalEnd = now - i * intervalDuration;
      const intervalStart = intervalEnd - intervalDuration;

      const intervalRequests = this.requests.filter(
        r => r.timestamp >= intervalStart && r.timestamp < intervalEnd
      );

      if (intervalRequests.length === 0) {
        trend.push(0);
      } else {
        const successCount = intervalRequests.filter(r => r.success).length;
        const successRate = (successCount / intervalRequests.length) * 100;
        trend.push(successRate);
      }
    }

    return trend;
  }

  /**
   * Get detection rate trend
   */
  getDetectionRateTrend(intervals: number = 10, intervalDuration: number = 60000): number[] {
    const now = Date.now();
    const trend: number[] = [];

    for (let i = intervals - 1; i >= 0; i--) {
      const intervalEnd = now - i * intervalDuration;
      const intervalStart = intervalEnd - intervalDuration;

      const intervalRequests = this.requests.filter(
        r => r.timestamp >= intervalStart && r.timestamp < intervalEnd
      );

      const intervalDetections = this.detections.filter(
        d => d.timestamp >= intervalStart && d.timestamp < intervalEnd
      );

      if (intervalRequests.length === 0) {
        trend.push(0);
      } else {
        const detectionRate = (intervalDetections.length / intervalRequests.length) * 100;
        trend.push(detectionRate);
      }
    }

    return trend;
  }

  /**
   * Generate summary report
   */
  generateReport(): string {
    const metrics = this.getMetrics();
    const uptime = Date.now() - this.startTime;
    const uptimeMinutes = Math.floor(uptime / 60000);

    let report = '='.repeat(60) + '\n';
    report += '  MONITORING REPORT\n';
    report += '='.repeat(60) + '\n\n';

    report += `Uptime: ${uptimeMinutes} minutes\n\n`;

    report += 'Requests (Last 5 minutes):\n';
    report += `  Total: ${metrics.requests.total}\n`;
    report += `  Successful: ${metrics.requests.successful} (${((metrics.requests.successful / metrics.requests.total) * 100).toFixed(1)}%)\n`;
    report += `  Failed: ${metrics.requests.failed}\n`;
    report += `  Blocked: ${metrics.requests.blocked}\n`;
    report += `  CAPTCHA: ${metrics.requests.captcha}\n\n`;

    report += 'Performance:\n';
    report += `  Avg Response Time: ${metrics.performance.avgResponseTime.toFixed(0)}ms\n`;
    report += `  Min Response Time: ${metrics.performance.minResponseTime}ms\n`;
    report += `  Max Response Time: ${metrics.performance.maxResponseTime}ms\n`;
    report += `  Requests/Second: ${metrics.performance.requestsPerSecond.toFixed(2)}\n\n`;

    report += 'Detections:\n';
    report += `  Total: ${metrics.detections.total}\n`;
    Object.entries(metrics.detections.byType).forEach(([type, count]) => {
      report += `  ${type}: ${count}\n`;
    });

    report += '\n' + '='.repeat(60) + '\n';

    return report;
  }

  /**
   * Generate JSON report for external tools
   */
  generateJSONReport(): object {
    const metrics = this.getMetrics();
    const uptime = Date.now() - this.startTime;

    return {
      uptime,
      timestamp: Date.now(),
      metrics,
      trends: {
        successRate: this.getSuccessRateTrend(),
        detectionRate: this.getDetectionRateTrend(),
      },
    };
  }

  /**
   * Check if system is healthy
   */
  isHealthy(thresholds: {
    minSuccessRate?: number;
    maxDetectionRate?: number;
    maxAvgResponseTime?: number;
  } = {}): { healthy: boolean; issues: string[] } {
    const metrics = this.getMetrics();
    const issues: string[] = [];

    const minSuccessRate = thresholds.minSuccessRate || 70;
    const maxDetectionRate = thresholds.maxDetectionRate || 30;
    const maxAvgResponseTime = thresholds.maxAvgResponseTime || 5000;

    const successRate =
      metrics.requests.total > 0
        ? (metrics.requests.successful / metrics.requests.total) * 100
        : 100;

    const detectionRate =
      metrics.requests.total > 0
        ? (metrics.detections.total / metrics.requests.total) * 100
        : 0;

    if (successRate < minSuccessRate) {
      issues.push(`Success rate too low: ${successRate.toFixed(1)}% < ${minSuccessRate}%`);
    }

    if (detectionRate > maxDetectionRate) {
      issues.push(
        `Detection rate too high: ${detectionRate.toFixed(1)}% > ${maxDetectionRate}%`
      );
    }

    if (metrics.performance.avgResponseTime > maxAvgResponseTime) {
      issues.push(
        `Avg response time too high: ${metrics.performance.avgResponseTime.toFixed(0)}ms > ${maxAvgResponseTime}ms`
      );
    }

    return {
      healthy: issues.length === 0,
      issues,
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.requests = [];
    this.detections = [];
    this.startTime = Date.now();
  }

  /**
   * Export data for analysis
   */
  exportData(): {
    requests: RequestLog[];
    detections: Detection[];
    startTime: number;
  } {
    return {
      requests: [...this.requests],
      detections: [...this.detections],
      startTime: this.startTime,
    };
  }
}

/**
 * Simple alerting system
 */
export class AlertingSystem {
  private alerts: Array<{
    timestamp: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
  }> = [];

  private handlers: Map<string, (alert: any) => void> = new Map();

  /**
   * Trigger an alert
   */
  alert(severity: 'low' | 'medium' | 'high' | 'critical', message: string): void {
    const alert = {
      timestamp: Date.now(),
      severity,
      message,
    };

    this.alerts.push(alert);

    // Trigger handlers
    this.handlers.forEach(handler => handler(alert));

    // Log to console based on severity
    const logFn = severity === 'critical' || severity === 'high' ? console.error : console.warn;
    logFn(`[${severity.toUpperCase()}] ${message}`);
  }

  /**
   * Register alert handler
   */
  onAlert(name: string, handler: (alert: any) => void): void {
    this.handlers.set(name, handler);
  }

  /**
   * Remove alert handler
   */
  removeHandler(name: string): void {
    this.handlers.delete(name);
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit: number = 100): typeof this.alerts {
    return this.alerts.slice(-limit);
  }

  /**
   * Clear alerts
   */
  clear(): void {
    this.alerts = [];
  }
}
