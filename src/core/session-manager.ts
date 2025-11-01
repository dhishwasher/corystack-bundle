import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import type { ScraperSession, GeneratedFingerprint, Proxy, Detection, StealthConfig } from '../types/index.js';
import { FingerprintGenerator } from './fingerprint.js';
import { ProxyManager } from './proxy-manager.js';
import { TLSAndHTTP2Manager } from '../advanced/tls-http2-fingerprint.js';
import { v4 as uuidv4 } from 'uuid';

export class SessionManager {
  private sessions: Map<string, ScraperSession> = new Map();
  private fingerprintGenerator: FingerprintGenerator;
  private proxyManager: ProxyManager | null = null;
  private tlsManager: TLSAndHTTP2Manager;
  private config: StealthConfig;
  private maxSessions: number;

  constructor(config: StealthConfig, maxSessions: number = 10) {
    this.config = config;
    this.maxSessions = maxSessions;
    this.fingerprintGenerator = new FingerprintGenerator(config.fingerprint);
    this.tlsManager = new TLSAndHTTP2Manager('chrome-120-windows');

    if (config.network.proxyEnabled && config.network.proxyList.length > 0) {
      this.proxyManager = new ProxyManager(
        config.network.proxyList,
        config.network.proxyRotationInterval
      );
    }
  }

  /**
   * Create a new scraper session
   */
  async createSession(options: {
    useProxy?: boolean;
    specificProxy?: Proxy;
    persistCookies?: boolean;
  } = {}): Promise<ScraperSession> {
    // Check session limit
    if (this.sessions.size >= this.maxSessions) {
      await this.cleanupOldestSession();
    }

    const sessionId = uuidv4();
    const fingerprint = this.fingerprintGenerator.generate();

    // Determine proxy
    let proxy: Proxy | null = null;
    if (options.useProxy && this.proxyManager) {
      proxy = options.specificProxy || this.proxyManager.getBestProxy();
    }

    // Launch browser with proxy if available
    const launchOptions: any = {
      headless: true,
      args: this.tlsManager.getBrowserLaunchArgs(),
    };

    if (proxy) {
      launchOptions.proxy = this.proxyManager!.toPlaywrightProxy(proxy);
    }

    const browser = await chromium.launch(launchOptions);

    // Create context with fingerprint
    const contextOptions: any = {
      userAgent: fingerprint.userAgent,
      viewport: fingerprint.viewport,
      locale: fingerprint.language,
      timezoneId: fingerprint.timezone,
      permissions: [],
      ignoreHTTPSErrors: true,
      bypassCSP: true,
    };

    if (options.persistCookies) {
      contextOptions.storageState = `./sessions/${sessionId}-storage.json`;
    }

    const context = await browser.newContext(contextOptions);

    // Apply fingerprint evasions
    await this.fingerprintGenerator.applyToContext(context, fingerprint);

    // Apply TLS/HTTP2 settings
    await this.tlsManager.applyHeaderOrder(context);
    await this.tlsManager.injectHTTP2Settings(context);

    const session: ScraperSession = {
      id: sessionId,
      browser,
      context,
      pages: [],
      proxy,
      fingerprint,
      startTime: Date.now(),
      requestCount: 0,
      successCount: 0,
      failureCount: 0,
      detections: [],
    };

    this.sessions.set(sessionId, session);

    return session;
  }

  /**
   * Get a session by ID
   */
  getSession(sessionId: string): ScraperSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Create a new page in a session
   */
  async createPage(sessionId: string): Promise<Page> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const page = await session.context.newPage();

    // Apply page-level fingerprint
    await this.fingerprintGenerator.applyToPage(page, session.fingerprint);

    // Set up request/response monitoring
    page.on('request', request => {
      session.requestCount++;
    });

    page.on('response', response => {
      if (response.ok()) {
        session.successCount++;
      } else {
        session.failureCount++;
      }
    });

    session.pages.push(page);

    return page;
  }

  /**
   * Close a page in a session
   */
  async closePage(sessionId: string, page: Page): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    await page.close();

    session.pages = session.pages.filter(p => p !== page);
  }

  /**
   * Add detection to session
   */
  addDetection(sessionId: string, detection: Detection): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.detections.push(detection);

    // Update proxy stats if using proxy
    if (session.proxy && this.proxyManager) {
      const isBlocked = detection.type === 'block' || detection.type === 'captcha';
      this.proxyManager.updateProxyStats(session.proxy, !isBlocked);
    }
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId: string): {
    duration: number;
    requestCount: number;
    successRate: number;
    detectionCount: number;
    detectionTypes: Record<string, number>;
  } | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const detectionTypes: Record<string, number> = {};
    session.detections.forEach(d => {
      detectionTypes[d.type] = (detectionTypes[d.type] || 0) + 1;
    });

    return {
      duration: Date.now() - session.startTime,
      requestCount: session.requestCount,
      successRate: session.requestCount > 0
        ? session.successCount / session.requestCount
        : 0,
      detectionCount: session.detections.length,
      detectionTypes,
    };
  }

  /**
   * Rotate session (create new with different fingerprint/proxy)
   */
  async rotateSession(sessionId: string): Promise<ScraperSession> {
    await this.closeSession(sessionId);
    return await this.createSession({ useProxy: true });
  }

  /**
   * Close a session
   */
  async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Close all pages
    for (const page of session.pages) {
      await page.close();
    }

    // Close context and browser
    await session.context.close();
    await session.browser.close();

    this.sessions.delete(sessionId);
  }

  /**
   * Close all sessions
   */
  async closeAllSessions(): Promise<void> {
    const sessionIds = Array.from(this.sessions.keys());
    await Promise.all(sessionIds.map(id => this.closeSession(id)));
  }

  /**
   * Cleanup oldest session to free resources
   */
  private async cleanupOldestSession(): Promise<void> {
    let oldestSession: ScraperSession | null = null;
    let oldestTime = Date.now();

    for (const session of this.sessions.values()) {
      if (session.startTime < oldestTime) {
        oldestTime = session.startTime;
        oldestSession = session;
      }
    }

    if (oldestSession) {
      await this.closeSession(oldestSession.id);
    }
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): ScraperSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get session count
   */
  getSessionCount(): number {
    return this.sessions.size;
  }
}
