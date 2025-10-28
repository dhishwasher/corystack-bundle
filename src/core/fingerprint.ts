import type { BrowserContext, Page } from 'playwright';
import type { GeneratedFingerprint, FingerprintConfig } from '../types/index.js';
import { chromeUserAgents, viewportSizes, timezones, locales, platforms, vendors } from '../config/default.js';

export class FingerprintGenerator {
  private config: FingerprintConfig;

  constructor(config: FingerprintConfig) {
    this.config = config;
  }

  /**
   * Generate a complete fingerprint profile
   */
  generate(): GeneratedFingerprint {
    const userAgent = this.config.randomizeUserAgent
      ? this.randomElement(chromeUserAgents)
      : chromeUserAgents[0];

    const viewport = this.config.randomizeViewport
      ? this.randomElement(viewportSizes)
      : viewportSizes[0];

    const platform = this.config.randomizePlatform
      ? this.randomElement(platforms)
      : platforms[0];

    const vendor = this.config.randomizePlatform
      ? this.randomElement(vendors)
      : vendors[0];

    const language = this.config.randomizeLocale
      ? this.randomElement(locales)
      : locales[0];

    const timezone = this.config.randomizeTimezone
      ? this.randomElement(timezones)
      : timezones[0];

    const hardwareConcurrency = this.config.spoofHardwareConcurrency
      ? this.randomInt(4, 16)
      : 8;

    const deviceMemory = this.config.spoofDeviceMemory
      ? this.randomElement([4, 8, 16, 32])
      : 8;

    return {
      userAgent,
      viewport,
      platform,
      vendor,
      language,
      timezone,
      canvasFingerprint: this.generateCanvasFingerprint(),
      webglFingerprint: this.generateWebGLFingerprint(),
      audioFingerprint: this.generateAudioFingerprint(),
      fonts: this.generateFontList(),
      hardwareConcurrency,
      deviceMemory,
      plugins: this.generatePluginList(),
    };
  }

  /**
   * Apply fingerprint to browser context
   */
  async applyToContext(context: BrowserContext, fingerprint: GeneratedFingerprint): Promise<void> {
    await context.addInitScript(() => {
      // Remove webdriver property
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });

      // Remove automation flags
      delete (window as any).navigator.webdriver;
      delete (window as any).__playwright;
      delete (window as any).__pw_manual;
    });

    // Set viewport
    await context.setViewportSize(fingerprint.viewport);

    // Inject advanced evasions
    await this.injectCanvasEvasion(context);
    await this.injectWebGLEvasion(context);
    await this.injectAudioEvasion(context);
    await this.injectWebRTCEvasion(context);
    await this.injectNavigatorEvasion(context, fingerprint);
  }

  /**
   * Apply fingerprint to a specific page
   */
  async applyToPage(page: Page, fingerprint: GeneratedFingerprint): Promise<void> {
    // Set timezone
    await page.emulateTimezone(fingerprint.timezone);

    // Set locale
    await page.setExtraHTTPHeaders({
      'Accept-Language': `${fingerprint.language},en;q=0.9`,
    });

    // Additional page-level evasions
    await this.injectPageEvasions(page, fingerprint);
  }

  /**
   * Inject canvas fingerprint evasion
   */
  private async injectCanvasEvasion(context: BrowserContext): Promise<void> {
    if (!this.config.randomizeCanvas) return;

    await context.addInitScript(() => {
      const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
      const originalToBlob = HTMLCanvasElement.prototype.toBlob;
      const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;

      // Add noise to canvas
      const addNoise = (canvas: HTMLCanvasElement) => {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          for (let i = 0; i < imageData.data.length; i += 4) {
            imageData.data[i] = imageData.data[i] ^ Math.floor(Math.random() * 3);
          }
          ctx.putImageData(imageData, 0, 0);
        }
      };

      HTMLCanvasElement.prototype.toDataURL = function (...args) {
        addNoise(this);
        return originalToDataURL.apply(this, args);
      };

      HTMLCanvasElement.prototype.toBlob = function (...args) {
        addNoise(this);
        return originalToBlob.apply(this, args);
      };

      CanvasRenderingContext2D.prototype.getImageData = function (...args) {
        const imageData = originalGetImageData.apply(this, args);
        for (let i = 0; i < imageData.data.length; i += 4) {
          imageData.data[i] = imageData.data[i] ^ Math.floor(Math.random() * 3);
        }
        return imageData;
      };
    });
  }

  /**
   * Inject WebGL fingerprint evasion
   */
  private async injectWebGLEvasion(context: BrowserContext): Promise<void> {
    if (!this.config.randomizeWebGL) return;

    await context.addInitScript(() => {
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function (parameter) {
        if (parameter === 37445) { // UNMASKED_VENDOR_WEBGL
          return 'Intel Inc.';
        }
        if (parameter === 37446) { // UNMASKED_RENDERER_WEBGL
          return 'Intel Iris OpenGL Engine';
        }
        return getParameter.apply(this, [parameter]);
      };
    });
  }

  /**
   * Inject Audio Context evasion
   */
  private async injectAudioEvasion(context: BrowserContext): Promise<void> {
    if (!this.config.randomizeAudioContext) return;

    await context.addInitScript(() => {
      const originalCreateDynamicsCompressor = AudioContext.prototype.createDynamicsCompressor;
      AudioContext.prototype.createDynamicsCompressor = function () {
        const compressor = originalCreateDynamicsCompressor.call(this);
        const gain = this.createGain();
        gain.gain.value = 1 + Math.random() * 0.001;
        gain.connect(compressor);
        return compressor;
      };
    });
  }

  /**
   * Inject WebRTC leak prevention
   */
  private async injectWebRTCEvasion(context: BrowserContext): Promise<void> {
    if (!this.config.preventWebRTC) return;

    await context.addInitScript(() => {
      // Block WebRTC IP leaks
      Object.defineProperty(navigator, 'mediaDevices', {
        get: () => undefined,
      });

      (window as any).RTCPeerConnection = undefined;
      (window as any).RTCDataChannel = undefined;
      (window as any).RTCSessionDescription = undefined;
    });
  }

  /**
   * Inject navigator property spoofing
   */
  private async injectNavigatorEvasion(context: BrowserContext, fingerprint: GeneratedFingerprint): Promise<void> {
    await context.addInitScript((fp: GeneratedFingerprint) => {
      Object.defineProperty(navigator, 'platform', {
        get: () => fp.platform,
      });

      Object.defineProperty(navigator, 'vendor', {
        get: () => fp.vendor,
      });

      Object.defineProperty(navigator, 'hardwareConcurrency', {
        get: () => fp.hardwareConcurrency,
      });

      Object.defineProperty(navigator, 'deviceMemory', {
        get: () => fp.deviceMemory,
      });

      Object.defineProperty(navigator, 'languages', {
        get: () => [fp.language, 'en'],
      });
    }, fingerprint);
  }

  /**
   * Inject page-level evasions
   */
  private async injectPageEvasions(page: Page, fingerprint: GeneratedFingerprint): Promise<void> {
    await page.evaluateOnNewDocument((fp: GeneratedFingerprint) => {
      // Chrome runtime evasion
      (window as any).chrome = {
        runtime: {},
        loadTimes: () => {},
        csi: () => {},
        app: {},
      };

      // Permissions API evasion
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters: any) => {
        if (parameters.name === 'notifications') {
          return Promise.resolve({ state: 'denied' } as PermissionStatus);
        }
        return originalQuery(parameters);
      };

      // Plugin array evasion
      Object.defineProperty(navigator, 'plugins', {
        get: () => {
          const pluginArray: any[] = [];
          fp.plugins.forEach((name) => {
            pluginArray.push({
              name,
              description: name,
              filename: `${name}.plugin`,
              length: 1,
            });
          });
          return pluginArray;
        },
      });
    }, fingerprint);
  }

  /**
   * Generate canvas fingerprint
   */
  private generateCanvasFingerprint(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  /**
   * Generate WebGL fingerprint
   */
  private generateWebGLFingerprint(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  /**
   * Generate audio fingerprint
   */
  private generateAudioFingerprint(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  /**
   * Generate font list
   */
  private generateFontList(): string[] {
    const commonFonts = [
      'Arial', 'Verdana', 'Helvetica', 'Times New Roman',
      'Courier New', 'Georgia', 'Palatino', 'Garamond',
      'Comic Sans MS', 'Trebuchet MS', 'Impact',
    ];

    if (this.config.randomizeFonts) {
      return commonFonts.filter(() => Math.random() > 0.3);
    }

    return commonFonts;
  }

  /**
   * Generate plugin list
   */
  private generatePluginList(): string[] {
    const plugins = [
      'Chrome PDF Plugin',
      'Chrome PDF Viewer',
      'Native Client',
    ];

    if (this.config.spoofPlugins) {
      return plugins.filter(() => Math.random() > 0.2);
    }

    return plugins;
  }

  /**
   * Utility: Get random element from array
   */
  private randomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Utility: Get random integer between min and max
   */
  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
