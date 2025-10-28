import type { Page } from 'playwright';
import type { StealthConfig, ScraperTask, VulnerabilityReport, ScraperMetrics } from '../types/index.js';
import { SessionManager } from './session-manager.js';
import { HumanBehaviorSimulator } from './behavior.js';
import { BotDetectionAnalyzer } from './detection.js';
import { VulnerabilityReporter } from './vulnerability-reporter.js';
import { defaultConfig } from '../config/default.js';

export class StealthScraper {
  private config: StealthConfig;
  private sessionManager: SessionManager;
  private behaviorSimulator: HumanBehaviorSimulator;
  private detectionAnalyzer: BotDetectionAnalyzer;
  private vulnerabilityReporter: VulnerabilityReporter;
  private metrics: ScraperMetrics;

  constructor(config: Partial<StealthConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.sessionManager = new SessionManager(this.config);
    this.behaviorSimulator = new HumanBehaviorSimulator(this.config.behavior);
    this.detectionAnalyzer = new BotDetectionAnalyzer(this.config.detection);
    this.vulnerabilityReporter = new VulnerabilityReporter(this.config.logging.logDir);
    this.metrics = this.initializeMetrics();
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): ScraperMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      captchaDetections: 0,
      blockDetections: 0,
      averageResponseTime: 0,
      proxySuccessRate: new Map(),
      detectionsByType: new Map(),
      vulnerabilitiesFound: 0,
    };
  }

  /**
   * Execute a single scraping task
   */
  async executeTask(task: ScraperTask): Promise<{
    success: boolean;
    data?: any;
    detections: any[];
    screenshot?: string;
  }> {
    const session = await this.sessionManager.createSession({ useProxy: true });
    const page = await this.sessionManager.createPage(session.id);

    try {
      // Navigate to URL
      const response = await page.goto(task.url, {
        waitUntil: 'domcontentloaded',
        timeout: this.config.network.timeout,
      });

      this.metrics.totalRequests++;

      if (!response) {
        throw new Error('Navigation failed');
      }

      // Wait for page load with human-like delay
      await this.behaviorSimulator.waitForPageLoad(page);

      // Detect bot protection
      const detections = await this.detectionAnalyzer.analyzePage(page, task.url);

      if (detections.length > 0) {
        detections.forEach(d => {
          this.sessionManager.addDetection(session.id, d);
          this.metrics.detectionsByType.set(
            d.type,
            (this.metrics.detectionsByType.get(d.type) || 0) + 1
          );

          if (d.type === 'captcha') this.metrics.captchaDetections++;
          if (d.type === 'block') this.metrics.blockDetections++;
        });
      }

      // Execute page actions if no blocks
      const hasBlocks = detections.some(d => d.type === 'block');

      if (!hasBlocks && task.actions) {
        for (const action of task.actions) {
          await this.executeAction(page, action);
        }
      }

      // Extract data
      let extractedData: any = {};
      if (task.extractors && !hasBlocks) {
        for (const extractor of task.extractors) {
          extractedData[extractor.name] = await this.extractData(page, extractor);
        }
      }

      // Take screenshot if configured
      let screenshot: string | undefined;
      if (this.config.logging.includeScreenshots) {
        const buffer = await page.screenshot({ type: 'png', fullPage: true });
        screenshot = buffer.toString('base64');
      }

      this.metrics.successfulRequests++;

      return {
        success: !hasBlocks,
        data: extractedData,
        detections,
        screenshot,
      };
    } catch (error) {
      this.metrics.failedRequests++;
      throw error;
    } finally {
      await this.sessionManager.closeSession(session.id);
    }
  }

  /**
   * Test a URL for security vulnerabilities
   */
  async testSecurity(targetUrl: string, options: {
    attempts?: number;
    useProxies?: boolean;
    simulateHumanBehavior?: boolean;
  } = {}): Promise<VulnerabilityReport> {
    const attempts = options.attempts || 5;
    const session = await this.sessionManager.createSession({
      useProxy: options.useProxies,
    });

    let bypassSuccess = false;

    for (let i = 0; i < attempts; i++) {
      const page = await this.sessionManager.createPage(session.id);

      try {
        console.log(`Attempt ${i + 1}/${attempts}: Testing ${targetUrl}`);

        // Navigate
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

        // Wait with human-like delay
        await this.behaviorSimulator.waitForPageLoad(page);

        // Simulate human behavior if enabled
        if (options.simulateHumanBehavior) {
          await this.behaviorSimulator.simulateReading(page);
          await this.behaviorSimulator.simulateIdle(page);
        }

        // Analyze for detections
        const detections = await this.detectionAnalyzer.analyzePage(page, targetUrl);

        detections.forEach(d => {
          this.sessionManager.addDetection(session.id, d);
        });

        // If no blocks/captchas, we bypassed
        const hasBlocks = detections.some(
          d => d.type === 'block' || d.type === 'captcha'
        );

        if (!hasBlocks) {
          bypassSuccess = true;
          console.log(`✅ Bypass successful on attempt ${i + 1}`);
        } else {
          console.log(`❌ Detected on attempt ${i + 1}: ${detections.map(d => d.type).join(', ')}`);
        }

        await page.close();

        // Wait between attempts
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error on attempt ${i + 1}:`, error);
        await page.close();
      }
    }

    // Generate vulnerability report
    const report = await this.vulnerabilityReporter.generateReport(
      session,
      targetUrl,
      bypassSuccess
    );

    this.metrics.vulnerabilitiesFound += report.vulnerabilities.length;

    await this.sessionManager.closeSession(session.id);

    return report;
  }

  /**
   * Stress test a target with multiple concurrent sessions
   */
  async stressTest(targetUrl: string, options: {
    concurrentSessions?: number;
    requestsPerSession?: number;
    useProxies?: boolean;
  } = {}): Promise<{
    totalRequests: number;
    successfulRequests: number;
    detectionRate: number;
    averageResponseTime: number;
  }> {
    const concurrentSessions = options.concurrentSessions || 5;
    const requestsPerSession = options.requestsPerSession || 10;

    const startTime = Date.now();
    let totalRequests = 0;
    let successfulRequests = 0;
    let totalDetections = 0;

    const sessionPromises = [];

    for (let i = 0; i < concurrentSessions; i++) {
      const promise = (async () => {
        const session = await this.sessionManager.createSession({
          useProxy: options.useProxies,
        });

        for (let j = 0; j < requestsPerSession; j++) {
          const page = await this.sessionManager.createPage(session.id);

          try {
            await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
            totalRequests++;

            const detections = await this.detectionAnalyzer.analyzePage(page, targetUrl);

            if (detections.length === 0) {
              successfulRequests++;
            } else {
              totalDetections += detections.length;
            }

            await page.close();

            // Random delay between requests
            await new Promise(resolve =>
              setTimeout(resolve, Math.random() * 2000 + 1000)
            );
          } catch (error) {
            totalRequests++;
            await page.close();
          }
        }

        await this.sessionManager.closeSession(session.id);
      })();

      sessionPromises.push(promise);
    }

    await Promise.all(sessionPromises);

    const endTime = Date.now();
    const averageResponseTime = (endTime - startTime) / totalRequests;

    return {
      totalRequests,
      successfulRequests,
      detectionRate: totalDetections / totalRequests,
      averageResponseTime,
    };
  }

  /**
   * Execute a page action
   */
  private async executeAction(page: Page, action: any): Promise<void> {
    const humanLike = action.humanLike !== false;

    switch (action.type) {
      case 'click':
        if (humanLike) {
          await this.behaviorSimulator.clickHumanLike(page, action.selector);
        } else {
          await page.click(action.selector);
        }
        break;

      case 'type':
        if (humanLike) {
          await this.behaviorSimulator.typeHumanLike(
            page,
            action.selector,
            action.value
          );
        } else {
          await page.fill(action.selector, action.value);
        }
        break;

      case 'scroll':
        if (humanLike) {
          await this.behaviorSimulator.scrollHumanLike(page);
        } else {
          await page.evaluate(() => window.scrollBy(0, 500));
        }
        break;

      case 'hover':
        if (humanLike) {
          await this.behaviorSimulator.hoverHumanLike(page, action.selector);
        } else {
          await page.hover(action.selector);
        }
        break;

      case 'wait':
        await new Promise(resolve => setTimeout(resolve, action.duration || 1000));
        break;

      case 'screenshot':
        await page.screenshot({ path: action.value });
        break;
    }
  }

  /**
   * Extract data from page
   */
  private async extractData(page: Page, extractor: any): Promise<any> {
    const result = await page.evaluate(
      ({ selector, type, attribute }) => {
        const element = document.querySelector(selector);
        if (!element) return null;

        switch (type) {
          case 'text':
            return element.textContent?.trim();
          case 'html':
            return element.innerHTML;
          case 'attribute':
            return element.getAttribute(attribute);
          case 'multiple':
            return Array.from(document.querySelectorAll(selector)).map(
              el => el.textContent?.trim()
            );
          default:
            return element.textContent?.trim();
        }
      },
      {
        selector: extractor.selector,
        type: extractor.type,
        attribute: extractor.attribute,
      }
    );

    if (extractor.transform) {
      return extractor.transform(result);
    }

    return result;
  }

  /**
   * Get current metrics
   */
  getMetrics(): ScraperMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = this.initializeMetrics();
  }

  /**
   * Cleanup and close all sessions
   */
  async cleanup(): Promise<void> {
    await this.sessionManager.closeAllSessions();
  }
}
