import type { Page } from 'playwright';
import type { Detection, DetectionConfig } from '../types/index.js';

export class BotDetectionAnalyzer {
  private config: DetectionConfig;

  constructor(config: DetectionConfig) {
    this.config = config;
  }

  /**
   * Analyze page for all bot detection mechanisms
   */
  async analyzePage(page: Page, url: string): Promise<Detection[]> {
    const detections: Detection[] = [];

    // Check for various protection systems
    if (this.config.detectCloudflare) {
      const cloudflare = await this.detectCloudflare(page);
      if (cloudflare) detections.push(cloudflare);
    }

    if (this.config.detectPerimeterX) {
      const perimeterx = await this.detectPerimeterX(page);
      if (perimeterx) detections.push(perimeterx);
    }

    if (this.config.detectDataDome) {
      const datadome = await this.detectDataDome(page);
      if (datadome) detections.push(datadome);
    }

    if (this.config.detectRecaptcha) {
      const recaptcha = await this.detectRecaptcha(page);
      if (recaptcha) detections.push(recaptcha);
    }

    if (this.config.detectHCaptcha) {
      const hcaptcha = await this.detectHCaptcha(page);
      if (hcaptcha) detections.push(hcaptcha);
    }

    // Generic detection checks
    const generic = await this.detectGenericChallenges(page);
    detections.push(...generic);

    // Enrich all detections with URL and timestamp
    return detections.map(d => ({
      ...d,
      url,
      timestamp: Date.now(),
    }));
  }

  /**
   * Detect Cloudflare protection
   */
  private async detectCloudflare(page: Page): Promise<Detection | null> {
    const indicators = await page.evaluate(() => {
      return {
        hasChallenge: document.title.includes('Just a moment'),
        hasCfRay: !!document.querySelector('[data-ray]'),
        hasCfChl: !!document.getElementById('cf-challenge-running'),
        hasCfWrapper: !!document.getElementById('cf-wrapper'),
        hasCloudflareScript: Array.from(document.scripts).some(
          s => s.src.includes('cloudflare') || s.innerHTML.includes('cloudflare')
        ),
        bodyText: document.body?.innerText || '',
      };
    });

    const isCloudflare =
      indicators.hasChallenge ||
      indicators.hasCfRay ||
      indicators.hasCfChl ||
      indicators.hasCfWrapper ||
      indicators.hasCloudflareScript ||
      indicators.bodyText.includes('Cloudflare') ||
      indicators.bodyText.includes('DDoS protection');

    if (isCloudflare) {
      const screenshot = await this.takeScreenshot(page);

      return {
        type: 'challenge',
        timestamp: Date.now(),
        url: page.url(),
        details: 'Cloudflare protection detected',
        screenshot,
        response: {
          status: page.url().includes('cdn-cgi') ? 403 : 200,
          headers: {},
        },
      };
    }

    return null;
  }

  /**
   * Detect PerimeterX protection
   */
  private async detectPerimeterX(page: Page): Promise<Detection | null> {
    const indicators = await page.evaluate(() => {
      return {
        hasPxCaptcha: !!document.querySelector('[id^="px-captcha"]'),
        hasPxBlock: !!document.querySelector('[class*="px-block"]'),
        hasPxScript: Array.from(document.scripts).some(
          s => s.src.includes('perimeterx.net') || s.src.includes('/px/')
        ),
        hasPxCookie: document.cookie.includes('_px'),
        bodyText: document.body?.innerText || '',
      };
    });

    const isPerimeterX =
      indicators.hasPxCaptcha ||
      indicators.hasPxBlock ||
      indicators.hasPxScript ||
      indicators.hasPxCookie ||
      indicators.bodyText.includes('PerimeterX');

    if (isPerimeterX) {
      const screenshot = await this.takeScreenshot(page);

      return {
        type: 'challenge',
        timestamp: Date.now(),
        url: page.url(),
        details: 'PerimeterX protection detected',
        screenshot,
      };
    }

    return null;
  }

  /**
   * Detect DataDome protection
   */
  private async detectDataDome(page: Page): Promise<Detection | null> {
    const indicators = await page.evaluate(() => {
      return {
        hasDataDomeCaptcha: !!document.querySelector('[id*="datadome"]'),
        hasDataDomeScript: Array.from(document.scripts).some(
          s => s.src.includes('datadome') || s.src.includes('dd.js')
        ),
        hasDataDomeCookie: document.cookie.includes('datadome'),
        bodyText: document.body?.innerText || '',
      };
    });

    const isDataDome =
      indicators.hasDataDomeCaptcha ||
      indicators.hasDataDomeScript ||
      indicators.hasDataDomeCookie ||
      indicators.bodyText.includes('DataDome');

    if (isDataDome) {
      const screenshot = await this.takeScreenshot(page);

      return {
        type: 'challenge',
        timestamp: Date.now(),
        url: page.url(),
        details: 'DataDome protection detected',
        screenshot,
      };
    }

    return null;
  }

  /**
   * Detect Google reCAPTCHA
   */
  private async detectRecaptcha(page: Page): Promise<Detection | null> {
    const indicators = await page.evaluate(() => {
      return {
        hasRecaptchaDiv: !!document.querySelector('.g-recaptcha'),
        hasRecaptchaBadge: !!document.querySelector('.grecaptcha-badge'),
        hasRecaptchaScript: Array.from(document.scripts).some(
          s => s.src.includes('recaptcha') || s.src.includes('gstatic.com/recaptcha')
        ),
        hasRecaptchaIframe: !!document.querySelector('iframe[src*="recaptcha"]'),
      };
    });

    const isRecaptcha =
      indicators.hasRecaptchaDiv ||
      indicators.hasRecaptchaBadge ||
      indicators.hasRecaptchaScript ||
      indicators.hasRecaptchaIframe;

    if (isRecaptcha) {
      const screenshot = await this.takeScreenshot(page);

      return {
        type: 'captcha',
        timestamp: Date.now(),
        url: page.url(),
        details: 'Google reCAPTCHA detected',
        screenshot,
      };
    }

    return null;
  }

  /**
   * Detect hCaptcha
   */
  private async detectHCaptcha(page: Page): Promise<Detection | null> {
    const indicators = await page.evaluate(() => {
      return {
        hasHCaptchaDiv: !!document.querySelector('.h-captcha'),
        hasHCaptchaScript: Array.from(document.scripts).some(
          s => s.src.includes('hcaptcha.com')
        ),
        hasHCaptchaIframe: !!document.querySelector('iframe[src*="hcaptcha"]'),
      };
    });

    const isHCaptcha =
      indicators.hasHCaptchaDiv ||
      indicators.hasHCaptchaScript ||
      indicators.hasHCaptchaIframe;

    if (isHCaptcha) {
      const screenshot = await this.takeScreenshot(page);

      return {
        type: 'captcha',
        timestamp: Date.now(),
        url: page.url(),
        details: 'hCaptcha detected',
        screenshot,
      };
    }

    return null;
  }

  /**
   * Detect generic bot challenges
   */
  private async detectGenericChallenges(page: Page): Promise<Detection[]> {
    const detections: Detection[] = [];

    const indicators = await page.evaluate(() => {
      const bodyText = document.body?.innerText.toLowerCase() || '';
      const titleText = document.title.toLowerCase();

      return {
        bodyText,
        titleText,
        statusCode: 0, // Will be set from response
        hasAccessDenied: bodyText.includes('access denied') || titleText.includes('access denied'),
        hasBlocked: bodyText.includes('blocked') || bodyText.includes('banned'),
        hasSuspicious: bodyText.includes('suspicious activity') || bodyText.includes('unusual traffic'),
        hasRateLimited: bodyText.includes('rate limit') || bodyText.includes('too many requests'),
        has403Message: bodyText.includes('forbidden') || bodyText.includes('403'),
        hasVerifyHuman: bodyText.includes('verify you are human') || bodyText.includes('are you a robot'),
      };
    });

    // Access denied detection
    if (indicators.hasAccessDenied) {
      detections.push({
        type: 'block',
        timestamp: Date.now(),
        url: page.url(),
        details: 'Access denied message detected',
        screenshot: await this.takeScreenshot(page),
      });
    }

    // Rate limiting detection
    if (indicators.hasRateLimited) {
      detections.push({
        type: 'rate-limit',
        timestamp: Date.now(),
        url: page.url(),
        details: 'Rate limiting detected',
      });
    }

    // Generic block detection
    if (indicators.hasBlocked) {
      detections.push({
        type: 'block',
        timestamp: Date.now(),
        url: page.url(),
        details: 'Generic block message detected',
        screenshot: await this.takeScreenshot(page),
      });
    }

    // Suspicious activity detection
    if (indicators.hasSuspicious) {
      detections.push({
        type: 'challenge',
        timestamp: Date.now(),
        url: page.url(),
        details: 'Suspicious activity challenge detected',
        screenshot: await this.takeScreenshot(page),
      });
    }

    // Human verification detection
    if (indicators.hasVerifyHuman) {
      detections.push({
        type: 'captcha',
        timestamp: Date.now(),
        url: page.url(),
        details: 'Human verification challenge detected',
        screenshot: await this.takeScreenshot(page),
      });
    }

    return detections;
  }

  /**
   * Analyze fingerprint detection attempts
   */
  async detectFingerprintingAttempts(page: Page): Promise<string[]> {
    return await page.evaluate(() => {
      const techniques: string[] = [];

      // Monitor for canvas fingerprinting
      const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
      let canvasCalled = false;
      HTMLCanvasElement.prototype.toDataURL = function (...args) {
        canvasCalled = true;
        return originalToDataURL.apply(this, args);
      };
      if (canvasCalled) techniques.push('Canvas Fingerprinting');

      // Monitor for WebGL fingerprinting
      const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
      let webglCalled = false;
      WebGLRenderingContext.prototype.getParameter = function (...args) {
        webglCalled = true;
        return originalGetParameter.apply(this, args);
      };
      if (webglCalled) techniques.push('WebGL Fingerprinting');

      // Check for font enumeration
      if ((window as any).FontFaceSet) {
        techniques.push('Font Enumeration');
      }

      // Check for audio context fingerprinting
      if ((window as any).AudioContext || (window as any).webkitAudioContext) {
        techniques.push('Audio Context Fingerprinting');
      }

      return techniques;
    });
  }

  /**
   * Take screenshot if enabled
   */
  private async takeScreenshot(page: Page): Promise<string | undefined> {
    try {
      const screenshot = await page.screenshot({ type: 'png' });
      return screenshot.toString('base64');
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Check if page has any detections
   */
  hasDetections(detections: Detection[]): boolean {
    return detections.length > 0;
  }

  /**
   * Get detection summary
   */
  getDetectionSummary(detections: Detection[]): {
    total: number;
    byType: Record<string, number>;
    critical: Detection[];
  } {
    const byType: Record<string, number> = {};

    detections.forEach(d => {
      byType[d.type] = (byType[d.type] || 0) + 1;
    });

    const critical = detections.filter(
      d => d.type === 'block' || d.type === 'captcha'
    );

    return {
      total: detections.length,
      byType,
      critical,
    };
  }
}
