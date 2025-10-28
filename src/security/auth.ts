/**
 * Authentication and Authorization System
 * Protects scraper from unauthorized use
 */

import crypto from 'crypto';

export interface APIKey {
  key: string;
  name: string;
  permissions: string[];
  rateLimit: {
    requestsPerHour: number;
    requestsPerDay: number;
  };
  createdAt: number;
  expiresAt?: number;
  lastUsed?: number;
  usageCount: number;
}

export class AuthenticationManager {
  private apiKeys: Map<string, APIKey> = new Map();
  private usageTracking: Map<string, number[]> = new Map();

  /**
   * Generate new API key
   */
  generateAPIKey(options: {
    name: string;
    permissions?: string[];
    rateLimit?: {
      requestsPerHour?: number;
      requestsPerDay?: number;
    };
    expiresInDays?: number;
  }): APIKey {
    const key = this.generateSecureKey();

    const apiKey: APIKey = {
      key,
      name: options.name,
      permissions: options.permissions || ['scrape', 'test'],
      rateLimit: {
        requestsPerHour: options.rateLimit?.requestsPerHour || 100,
        requestsPerDay: options.rateLimit?.requestsPerDay || 1000,
      },
      createdAt: Date.now(),
      expiresAt: options.expiresInDays
        ? Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000
        : undefined,
      usageCount: 0,
    };

    this.apiKeys.set(key, apiKey);
    return apiKey;
  }

  /**
   * Validate API key
   */
  validateAPIKey(key: string): {
    valid: boolean;
    reason?: string;
    apiKey?: APIKey;
  } {
    const apiKey = this.apiKeys.get(key);

    if (!apiKey) {
      return { valid: false, reason: 'Invalid API key' };
    }

    // Check expiration
    if (apiKey.expiresAt && Date.now() > apiKey.expiresAt) {
      return { valid: false, reason: 'API key expired' };
    }

    // Check rate limits
    const rateLimitCheck = this.checkRateLimit(key);
    if (!rateLimitCheck.allowed) {
      return { valid: false, reason: rateLimitCheck.reason };
    }

    // Update last used
    apiKey.lastUsed = Date.now();
    apiKey.usageCount++;

    return { valid: true, apiKey };
  }

  /**
   * Check permission
   */
  hasPermission(key: string, permission: string): boolean {
    const apiKey = this.apiKeys.get(key);
    if (!apiKey) return false;

    return apiKey.permissions.includes(permission) || apiKey.permissions.includes('*');
  }

  /**
   * Check rate limit
   */
  private checkRateLimit(key: string): {
    allowed: boolean;
    reason?: string;
  } {
    const apiKey = this.apiKeys.get(key);
    if (!apiKey) return { allowed: false };

    const usage = this.usageTracking.get(key) || [];
    const now = Date.now();

    // Clean old entries
    const validUsage = usage.filter(timestamp => now - timestamp < 24 * 60 * 60 * 1000);

    // Check hourly limit
    const lastHour = validUsage.filter(timestamp => now - timestamp < 60 * 60 * 1000);
    if (lastHour.length >= apiKey.rateLimit.requestsPerHour) {
      return {
        allowed: false,
        reason: `Hourly rate limit exceeded (${apiKey.rateLimit.requestsPerHour}/hour)`,
      };
    }

    // Check daily limit
    if (validUsage.length >= apiKey.rateLimit.requestsPerDay) {
      return {
        allowed: false,
        reason: `Daily rate limit exceeded (${apiKey.rateLimit.requestsPerDay}/day)`,
      };
    }

    // Record usage
    validUsage.push(now);
    this.usageTracking.set(key, validUsage);

    return { allowed: true };
  }

  /**
   * Revoke API key
   */
  revokeAPIKey(key: string): boolean {
    return this.apiKeys.delete(key);
  }

  /**
   * List API keys (without actual keys for security)
   */
  listAPIKeys(): Array<Omit<APIKey, 'key'>> {
    return Array.from(this.apiKeys.values()).map(({ key, ...rest }) => rest);
  }

  /**
   * Get usage statistics
   */
  getUsageStats(key: string): {
    totalUsage: number;
    lastHourUsage: number;
    lastDayUsage: number;
    lastUsed?: number;
  } | null {
    const apiKey = this.apiKeys.get(key);
    if (!apiKey) return null;

    const usage = this.usageTracking.get(key) || [];
    const now = Date.now();

    return {
      totalUsage: apiKey.usageCount,
      lastHourUsage: usage.filter(t => now - t < 60 * 60 * 1000).length,
      lastDayUsage: usage.filter(t => now - t < 24 * 60 * 60 * 1000).length,
      lastUsed: apiKey.lastUsed,
    };
  }

  /**
   * Generate secure random key
   */
  private generateSecureKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Export API keys (for backup)
   */
  exportKeys(): string {
    const keys = Array.from(this.apiKeys.values());
    return JSON.stringify(keys, null, 2);
  }

  /**
   * Import API keys (from backup)
   */
  importKeys(data: string): void {
    try {
      const keys: APIKey[] = JSON.parse(data);
      keys.forEach(key => {
        this.apiKeys.set(key.key, key);
      });
    } catch (error) {
      throw new Error('Failed to import API keys');
    }
  }
}
