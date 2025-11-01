import type { Proxy } from '../types/index.js';
import pino from 'pino';

const logger = pino({ name: 'residential-proxy' });

export interface ResidentialProxyProvider {
  name: 'brightdata' | 'smartproxy' | 'oxylabs' | 'geosurf' | 'netnut' | 'custom';
  host: string;
  port: number;
  username: string;
  password: string;
  sessionDuration?: number; // Minutes before rotating
}

export interface ResidentialProxyConfig {
  provider: ResidentialProxyProvider;
  countries?: string[]; // ISO country codes (e.g., ['US', 'GB', 'CA'])
  cities?: string[]; // City names
  sessionPersistence?: boolean; // Keep same IP for session
  rotateOnFailure?: boolean;
  maxFailuresPerProxy?: number;
  geoTargeting?: {
    country?: string;
    state?: string;
    city?: string;
    asn?: string; // Autonomous System Number
  };
}

/**
 * Residential Proxy Manager for premium proxy services
 */
export class ResidentialProxyManager {
  private config: ResidentialProxyConfig;
  private currentSession: string | null = null;
  private sessionStartTime: number = 0;
  private failureCount: Map<string, number> = new Map();
  private proxyStats: Map<string, { requests: number; success: number; avgLatency: number }> = new Map();

  constructor(config: ResidentialProxyConfig) {
    this.config = {
      sessionPersistence: true,
      rotateOnFailure: true,
      maxFailuresPerProxy: 3,
      ...config,
    };
  }

  /**
   * Get proxy configuration for Playwright
   */
  async getProxy(): Promise<Proxy> {
    const shouldRotate = this.shouldRotateSession();

    if (shouldRotate || !this.currentSession) {
      this.currentSession = this.generateSessionId();
      this.sessionStartTime = Date.now();
      logger.info({ session: this.currentSession }, 'Starting new proxy session');
    }

    const proxy = this.buildProxyConfig(this.currentSession);
    logger.debug({ proxy: this.maskPassword(proxy) }, 'Using proxy');

    return proxy;
  }

  /**
   * Build proxy configuration based on provider
   */
  private buildProxyConfig(sessionId: string): Proxy {
    const { provider, geoTargeting } = this.config;
    let username = provider.username;

    // Build username with targeting parameters
    switch (provider.name) {
      case 'brightdata':
        username = this.buildBrightDataUsername(provider.username, sessionId, geoTargeting);
        break;
      case 'smartproxy':
        username = this.buildSmartProxyUsername(provider.username, sessionId, geoTargeting);
        break;
      case 'oxylabs':
        username = this.buildOxylabsUsername(provider.username, sessionId, geoTargeting);
        break;
      case 'geosurf':
        username = this.buildGeoSurfUsername(provider.username, sessionId, geoTargeting);
        break;
      case 'netnut':
        username = this.buildNetNutUsername(provider.username, sessionId, geoTargeting);
        break;
      case 'custom':
        // For custom providers, use username as-is
        break;
    }

    return {
      type: 'http',
      host: provider.host,
      port: provider.port,
      username,
      password: provider.password,
      isResidential: true,
      country: geoTargeting?.country,
      city: geoTargeting?.city,
    };
  }

  /**
   * Build BrightData (Luminati) username with targeting
   * Format: lum-customer-{customer}-zone-{zone}[-country-{country}][-state-{state}][-city-{city}][-session-{session}]
   */
  private buildBrightDataUsername(
    baseUsername: string,
    sessionId: string,
    geoTargeting?: ResidentialProxyConfig['geoTargeting']
  ): string {
    let username = baseUsername;

    if (geoTargeting?.country) {
      username += `-country-${geoTargeting.country.toLowerCase()}`;
    }

    if (geoTargeting?.state) {
      username += `-state-${geoTargeting.state.toLowerCase()}`;
    }

    if (geoTargeting?.city) {
      username += `-city-${geoTargeting.city.toLowerCase().replace(/\s+/g, '_')}`;
    }

    if (geoTargeting?.asn) {
      username += `-asn-${geoTargeting.asn}`;
    }

    if (this.config.sessionPersistence) {
      username += `-session-${sessionId}`;
    }

    return username;
  }

  /**
   * Build SmartProxy username with targeting
   * Format: {username}-country-{country}-session-{session}
   */
  private buildSmartProxyUsername(
    baseUsername: string,
    sessionId: string,
    geoTargeting?: ResidentialProxyConfig['geoTargeting']
  ): string {
    let username = baseUsername;

    if (geoTargeting?.country) {
      username += `-country-${geoTargeting.country.toLowerCase()}`;
    }

    if (geoTargeting?.city) {
      username += `-city-${geoTargeting.city.toLowerCase().replace(/\s+/g, '_')}`;
    }

    if (this.config.sessionPersistence) {
      username += `-session-${sessionId}`;
    }

    return username;
  }

  /**
   * Build Oxylabs username with targeting
   * Format: customer-{username}-cc-{country}-sessid-{session}
   */
  private buildOxylabsUsername(
    baseUsername: string,
    sessionId: string,
    geoTargeting?: ResidentialProxyConfig['geoTargeting']
  ): string {
    let username = `customer-${baseUsername}`;

    if (geoTargeting?.country) {
      username += `-cc-${geoTargeting.country.toLowerCase()}`;
    }

    if (geoTargeting?.state) {
      username += `-st-${geoTargeting.state.toLowerCase()}`;
    }

    if (geoTargeting?.city) {
      username += `-city-${geoTargeting.city.toLowerCase().replace(/\s+/g, '_')}`;
    }

    if (this.config.sessionPersistence) {
      username += `-sessid-${sessionId}`;
    }

    return username;
  }

  /**
   * Build GeoSurf username with targeting
   * Format: {username}-country-{country}-session-{session}
   */
  private buildGeoSurfUsername(
    baseUsername: string,
    sessionId: string,
    geoTargeting?: ResidentialProxyConfig['geoTargeting']
  ): string {
    let username = baseUsername;

    if (geoTargeting?.country) {
      username += `-country-${geoTargeting.country.toLowerCase()}`;
    }

    if (geoTargeting?.city) {
      username += `-city-${geoTargeting.city.toLowerCase().replace(/\s+/g, '_')}`;
    }

    if (this.config.sessionPersistence) {
      username += `-session-${sessionId}`;
    }

    return username;
  }

  /**
   * Build NetNut username with targeting
   * Format: {username}-country-{country}-session-{session}
   */
  private buildNetNutUsername(
    baseUsername: string,
    sessionId: string,
    geoTargeting?: ResidentialProxyConfig['geoTargeting']
  ): string {
    let username = baseUsername;

    if (geoTargeting?.country) {
      username += `-country-${geoTargeting.country.toLowerCase()}`;
    }

    if (geoTargeting?.state) {
      username += `-state-${geoTargeting.state.toLowerCase()}`;
    }

    if (this.config.sessionPersistence) {
      username += `-session-${sessionId}`;
    }

    return username;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Check if session should be rotated
   */
  private shouldRotateSession(): boolean {
    if (!this.config.sessionPersistence) {
      return true;
    }

    if (!this.currentSession) {
      return true;
    }

    // Check if session has exceeded duration
    if (this.config.provider.sessionDuration) {
      const sessionAge = (Date.now() - this.sessionStartTime) / 1000 / 60; // Minutes
      if (sessionAge >= this.config.provider.sessionDuration) {
        logger.info({ session: this.currentSession, age: sessionAge }, 'Rotating session due to age');
        return true;
      }
    }

    // Check if session has too many failures
    if (this.config.rotateOnFailure) {
      const failures = this.failureCount.get(this.currentSession) || 0;
      if (failures >= (this.config.maxFailuresPerProxy || 3)) {
        logger.info({ session: this.currentSession, failures }, 'Rotating session due to failures');
        return true;
      }
    }

    return false;
  }

  /**
   * Report request success
   */
  recordSuccess(latency?: number): void {
    if (!this.currentSession) return;

    const stats = this.proxyStats.get(this.currentSession) || {
      requests: 0,
      success: 0,
      avgLatency: 0,
    };

    stats.requests++;
    stats.success++;

    if (latency !== undefined) {
      stats.avgLatency = (stats.avgLatency * (stats.requests - 1) + latency) / stats.requests;
    }

    this.proxyStats.set(this.currentSession, stats);

    // Reset failure count on success
    this.failureCount.set(this.currentSession, 0);

    logger.debug({ session: this.currentSession, stats }, 'Request succeeded');
  }

  /**
   * Report request failure
   */
  recordFailure(error?: string): void {
    if (!this.currentSession) return;

    const stats = this.proxyStats.get(this.currentSession) || {
      requests: 0,
      success: 0,
      avgLatency: 0,
    };

    stats.requests++;
    this.proxyStats.set(this.currentSession, stats);

    const failures = this.failureCount.get(this.currentSession) || 0;
    this.failureCount.set(this.currentSession, failures + 1);

    logger.warn({ session: this.currentSession, failures: failures + 1, error }, 'Request failed');
  }

  /**
   * Force rotate to new session
   */
  rotate(): void {
    logger.info({ oldSession: this.currentSession }, 'Forcing proxy rotation');
    this.currentSession = null;
    this.sessionStartTime = 0;
  }

  /**
   * Get current session statistics
   */
  getStats(): { session: string | null; stats: any } {
    if (!this.currentSession) {
      return { session: null, stats: null };
    }

    return {
      session: this.currentSession,
      stats: this.proxyStats.get(this.currentSession) || {
        requests: 0,
        success: 0,
        avgLatency: 0,
      },
    };
  }

  /**
   * Get success rate for current session
   */
  getSuccessRate(): number {
    if (!this.currentSession) return 0;

    const stats = this.proxyStats.get(this.currentSession);
    if (!stats || stats.requests === 0) return 0;

    return stats.success / stats.requests;
  }

  /**
   * Mask password in proxy config for logging
   */
  private maskPassword(proxy: Proxy): Partial<Proxy> {
    return {
      ...proxy,
      password: '***',
    };
  }

  /**
   * Get recommended providers with characteristics
   */
  static getProviderInfo() {
    return {
      brightdata: {
        name: 'BrightData (Luminati)',
        features: ['Largest pool (72M+ IPs)', 'City targeting', 'ASN targeting', 'Premium quality'],
        pricing: '$$$',
        speedRating: 5,
        poolSize: 'Largest',
        host: 'zproxy.lum-superproxy.io',
        port: 22225,
      },
      smartproxy: {
        name: 'SmartProxy',
        features: ['40M+ IPs', 'City targeting', 'Good performance', 'Easy to use'],
        pricing: '$$',
        speedRating: 4,
        poolSize: 'Large',
        host: 'gate.smartproxy.com',
        port: 7000,
      },
      oxylabs: {
        name: 'Oxylabs',
        features: ['100M+ IPs', 'Advanced targeting', 'Enterprise grade', 'High success rate'],
        pricing: '$$$',
        speedRating: 5,
        poolSize: 'Largest',
        host: 'pr.oxylabs.io',
        port: 7777,
      },
      geosurf: {
        name: 'GeoSurf',
        features: ['2M+ IPs', 'Premium residential', 'Clean IPs', 'Good for SEO'],
        pricing: '$$$',
        speedRating: 4,
        poolSize: 'Medium',
        host: 'proxy.geosurf.io',
        port: 8080,
      },
      netnut: {
        name: 'NetNut',
        features: ['20M+ IPs', 'ISP proxies', 'Fast speeds', 'Unlimited bandwidth'],
        pricing: '$$',
        speedRating: 5,
        poolSize: 'Large',
        host: 'proxy.netnut.io',
        port: 5959,
      },
    };
  }
}
