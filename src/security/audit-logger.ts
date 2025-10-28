/**
 * Audit Logging System
 * Comprehensive logging of all security-relevant events
 */

import { writeFile, appendFile, mkdir } from 'fs/promises';
import { join } from 'path';

export interface AuditEvent {
  timestamp: number;
  eventType: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  actor?: string; // API key, user, IP
  action: string;
  target?: string; // URL, resource
  result: 'success' | 'failure';
  details?: Record<string, any>;
  metadata?: {
    ip?: string;
    userAgent?: string;
    sessionId?: string;
  };
}

export class AuditLogger {
  private logDir: string;
  private events: AuditEvent[] = [];
  private maxEventsInMemory: number = 10000;

  constructor(logDir: string = './audit-logs') {
    this.logDir = logDir;
    this.initializeLogDir();
  }

  /**
   * Initialize log directory
   */
  private async initializeLogDir(): Promise<void> {
    try {
      await mkdir(this.logDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create audit log directory:', error);
    }
  }

  /**
   * Log an audit event
   */
  async log(event: Omit<AuditEvent, 'timestamp'>): Promise<void> {
    const auditEvent: AuditEvent = {
      ...event,
      timestamp: Date.now(),
    };

    // Store in memory
    this.events.push(auditEvent);

    // Trim if too many
    if (this.events.length > this.maxEventsInMemory) {
      this.events = this.events.slice(-this.maxEventsInMemory);
    }

    // Write to file
    await this.writeToFile(auditEvent);

    // Alert on critical events
    if (auditEvent.severity === 'critical') {
      console.error('[CRITICAL AUDIT EVENT]', JSON.stringify(auditEvent));
    }
  }

  /**
   * Log authentication attempt
   */
  async logAuthAttempt(options: {
    apiKey: string;
    success: boolean;
    reason?: string;
    ip?: string;
  }): Promise<void> {
    await this.log({
      eventType: 'authentication',
      severity: options.success ? 'info' : 'warning',
      actor: options.apiKey.substring(0, 8) + '...',
      action: 'authenticate',
      result: options.success ? 'success' : 'failure',
      details: { reason: options.reason },
      metadata: { ip: options.ip },
    });
  }

  /**
   * Log scraping activity
   */
  async logScrapeActivity(options: {
    apiKey: string;
    targetUrl: string;
    success: boolean;
    detections?: number;
    sessionId?: string;
  }): Promise<void> {
    await this.log({
      eventType: 'scraping',
      severity: options.detections && options.detections > 0 ? 'warning' : 'info',
      actor: options.apiKey.substring(0, 8) + '...',
      action: 'scrape',
      target: options.targetUrl,
      result: options.success ? 'success' : 'failure',
      details: { detections: options.detections },
      metadata: { sessionId: options.sessionId },
    });
  }

  /**
   * Log security test
   */
  async logSecurityTest(options: {
    apiKey: string;
    targetUrl: string;
    bypassSuccess: boolean;
    vulnerabilities: number;
  }): Promise<void> {
    await this.log({
      eventType: 'security_test',
      severity: options.bypassSuccess ? 'critical' : 'info',
      actor: options.apiKey.substring(0, 8) + '...',
      action: 'security_test',
      target: options.targetUrl,
      result: 'success',
      details: {
        bypassSuccess: options.bypassSuccess,
        vulnerabilities: options.vulnerabilities,
      },
    });
  }

  /**
   * Log rate limit exceeded
   */
  async logRateLimitExceeded(options: {
    apiKey: string;
    limit: string;
    ip?: string;
  }): Promise<void> {
    await this.log({
      eventType: 'rate_limit',
      severity: 'warning',
      actor: options.apiKey.substring(0, 8) + '...',
      action: 'rate_limit_exceeded',
      result: 'failure',
      details: { limit: options.limit },
      metadata: { ip: options.ip },
    });
  }

  /**
   * Log unauthorized access attempt
   */
  async logUnauthorizedAccess(options: {
    apiKey?: string;
    permission: string;
    ip?: string;
  }): Promise<void> {
    await this.log({
      eventType: 'authorization',
      severity: 'error',
      actor: options.apiKey?.substring(0, 8) + '...' || 'unknown',
      action: 'unauthorized_access',
      result: 'failure',
      details: { permission: options.permission },
      metadata: { ip: options.ip },
    });
  }

  /**
   * Write event to file
   */
  private async writeToFile(event: AuditEvent): Promise<void> {
    try {
      const date = new Date(event.timestamp);
      const filename = `audit-${date.toISOString().split('T')[0]}.jsonl`;
      const filepath = join(this.logDir, filename);

      const line = JSON.stringify(event) + '\n';
      await appendFile(filepath, line);
    } catch (error) {
      console.error('Failed to write audit log:', error);
    }
  }

  /**
   * Query audit logs
   */
  query(filter: {
    eventType?: string;
    severity?: string;
    actor?: string;
    startTime?: number;
    endTime?: number;
    limit?: number;
  }): AuditEvent[] {
    let results = [...this.events];

    if (filter.eventType) {
      results = results.filter(e => e.eventType === filter.eventType);
    }

    if (filter.severity) {
      results = results.filter(e => e.severity === filter.severity);
    }

    if (filter.actor) {
      results = results.filter(e => e.actor?.includes(filter.actor!));
    }

    if (filter.startTime) {
      results = results.filter(e => e.timestamp >= filter.startTime!);
    }

    if (filter.endTime) {
      results = results.filter(e => e.timestamp <= filter.endTime!);
    }

    if (filter.limit) {
      results = results.slice(-filter.limit);
    }

    return results;
  }

  /**
   * Get statistics
   */
  getStatistics(timeWindow: number = 24 * 60 * 60 * 1000): {
    total: number;
    bySeverity: Record<string, number>;
    byEventType: Record<string, number>;
    failureRate: number;
  } {
    const now = Date.now();
    const recent = this.events.filter(e => now - e.timestamp <= timeWindow);

    const bySeverity: Record<string, number> = {};
    const byEventType: Record<string, number> = {};
    let failures = 0;

    recent.forEach(event => {
      bySeverity[event.severity] = (bySeverity[event.severity] || 0) + 1;
      byEventType[event.eventType] = (byEventType[event.eventType] || 0) + 1;
      if (event.result === 'failure') failures++;
    });

    return {
      total: recent.length,
      bySeverity,
      byEventType,
      failureRate: recent.length > 0 ? failures / recent.length : 0,
    };
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    startTime: number,
    endTime: number
  ): Promise<string> {
    const events = this.query({ startTime, endTime });

    let report = '# Audit Log Compliance Report\n\n';
    report += `**Period:** ${new Date(startTime).toISOString()} to ${new Date(endTime).toISOString()}\n`;
    report += `**Total Events:** ${events.length}\n\n`;

    report += '## Security Events\n\n';

    const securityEvents = events.filter(
      e => e.eventType === 'authentication' || e.eventType === 'authorization'
    );

    report += `- Authentication attempts: ${securityEvents.filter(e => e.eventType === 'authentication').length}\n`;
    report += `- Authorization failures: ${securityEvents.filter(e => e.eventType === 'authorization').length}\n`;
    report += `- Rate limit exceeded: ${events.filter(e => e.eventType === 'rate_limit').length}\n\n`;

    report += '## Activity Summary\n\n';

    const scrapes = events.filter(e => e.eventType === 'scraping');
    const tests = events.filter(e => e.eventType === 'security_test');

    report += `- Scraping operations: ${scrapes.length}\n`;
    report += `- Security tests: ${tests.length}\n\n`;

    report += '## Critical Events\n\n';

    const critical = events.filter(e => e.severity === 'critical');
    critical.forEach(event => {
      report += `- ${new Date(event.timestamp).toISOString()}: ${event.action} - ${event.details}\n`;
    });

    return report;
  }
}
