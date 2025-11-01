import type { BrowserContext, Page } from 'playwright';
import type { GeneratedFingerprint, FingerprintConfig } from '../types/index.js';
import { viewportSizes, timezones, locales } from '../config/default.js';

/**
 * Platform-specific profile for correlated fingerprinting
 */
interface PlatformProfile {
  platform: string;
  userAgents: string[];
  vendor: string;
  fonts: string[];
  plugins: string[];
  webglRenderers: Array<{ vendor: string; renderer: string }>;
  hardwareConcurrency: { min: number; max: number };
  deviceMemory: number[];
  screenResolutions: Array<{ width: number; height: number }>;
}

/**
 * Comprehensive platform profiles with correlated fingerprint elements
 */
const platformProfiles: PlatformProfile[] = [
  // Windows Platform Profile
  {
    platform: 'Win32',
    userAgents: [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 11.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ],
    vendor: 'Google Inc.',
    fonts: [
      'Arial', 'Arial Black', 'Calibri', 'Cambria', 'Cambria Math', 'Comic Sans MS',
      'Consolas', 'Courier', 'Courier New', 'Georgia', 'Helvetica', 'Impact',
      'Lucida Console', 'Lucida Sans Unicode', 'Microsoft Sans Serif', 'Palatino Linotype',
      'Segoe UI', 'Tahoma', 'Times New Roman', 'Trebuchet MS', 'Verdana',
    ],
    plugins: [
      'PDF Viewer',
      'Chrome PDF Viewer',
      'Chromium PDF Viewer',
      'Microsoft Edge PDF Viewer',
      'WebKit built-in PDF',
    ],
    webglRenderers: [
      { vendor: 'Google Inc. (NVIDIA)', renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)' },
      { vendor: 'Google Inc. (NVIDIA)', renderer: 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)' },
      { vendor: 'Google Inc. (NVIDIA)', renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 2060 Direct3D11 vs_5_0 ps_5_0, D3D11)' },
      { vendor: 'Google Inc. (Intel)', renderer: 'ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0, D3D11)' },
      { vendor: 'Google Inc. (Intel)', renderer: 'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)' },
      { vendor: 'Google Inc. (AMD)', renderer: 'ANGLE (AMD, AMD Radeon RX 6600 Direct3D11 vs_5_0 ps_5_0, D3D11)' },
      { vendor: 'Google Inc. (AMD)', renderer: 'ANGLE (AMD, AMD Radeon RX 5700 XT Direct3D11 vs_5_0 ps_5_0, D3D11)' },
    ],
    hardwareConcurrency: { min: 4, max: 16 },
    deviceMemory: [4, 8, 16, 32],
    screenResolutions: [
      { width: 1920, height: 1080 },
      { width: 1366, height: 768 },
      { width: 1536, height: 864 },
      { width: 1440, height: 900 },
      { width: 2560, height: 1440 },
    ],
  },
  // macOS Platform Profile
  {
    platform: 'MacIntel',
    userAgents: [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    ],
    vendor: 'Google Inc.',
    fonts: [
      'American Typewriter', 'Andale Mono', 'Arial', 'Arial Black', 'Arial Narrow', 'Arial Rounded MT Bold',
      'Arial Unicode MS', 'Avenir', 'Avenir Next', 'Baskerville', 'Big Caslon', 'Bodoni 72',
      'Bradley Hand', 'Brush Script MT', 'Chalkboard', 'Chalkboard SE', 'Comic Sans MS', 'Copperplate',
      'Courier', 'Courier New', 'Didot', 'Futura', 'Geneva', 'Georgia', 'Gill Sans', 'Helvetica',
      'Helvetica Neue', 'Herculanum', 'Impact', 'Lucida Grande', 'Luminari', 'Marker Felt',
      'Monaco', 'Optima', 'Palatino', 'Papyrus', 'Phosphate', 'Rockwell', 'SF Pro Display',
      'SF Pro Text', 'SignPainter', 'Skia', 'Snell Roundhand', 'Tahoma', 'Times', 'Times New Roman',
      'Trattatello', 'Trebuchet MS', 'Verdana', 'Zapfino',
    ],
    plugins: [
      'PDF Viewer',
      'Chrome PDF Viewer',
      'Chromium PDF Viewer',
      'Microsoft Edge PDF Viewer',
      'WebKit built-in PDF',
    ],
    webglRenderers: [
      { vendor: 'Intel Inc.', renderer: 'Intel(R) Iris(TM) Plus Graphics 640' },
      { vendor: 'Intel Inc.', renderer: 'Intel(R) Iris(TM) Plus Graphics 655' },
      { vendor: 'Intel Inc.', renderer: 'Intel(R) UHD Graphics 630' },
      { vendor: 'Apple Inc.', renderer: 'Apple M1' },
      { vendor: 'Apple Inc.', renderer: 'Apple M2' },
      { vendor: 'Apple Inc.', renderer: 'Apple M1 Pro' },
      { vendor: 'AMD', renderer: 'AMD Radeon Pro 5500M' },
      { vendor: 'AMD', renderer: 'AMD Radeon Pro 5300M' },
    ],
    hardwareConcurrency: { min: 4, max: 12 },
    deviceMemory: [8, 16, 32],
    screenResolutions: [
      { width: 1440, height: 900 },
      { width: 1680, height: 1050 },
      { width: 1920, height: 1080 },
      { width: 2560, height: 1440 },
      { width: 2560, height: 1600 },
      { width: 2880, height: 1800 },
    ],
  },
  // Linux Platform Profile
  {
    platform: 'Linux x86_64',
    userAgents: [
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Ubuntu; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ],
    vendor: 'Google Inc.',
    fonts: [
      'Arial', 'Arial Black', 'Comic Sans MS', 'Courier New', 'DejaVu Sans', 'DejaVu Sans Mono',
      'DejaVu Serif', 'Droid Sans', 'Droid Serif', 'FreeMono', 'FreeSans', 'FreeSerif',
      'Georgia', 'Liberation Mono', 'Liberation Sans', 'Liberation Serif', 'Noto Sans',
      'Noto Serif', 'Times New Roman', 'Ubuntu', 'Ubuntu Mono', 'Verdana',
    ],
    plugins: [
      'PDF Viewer',
      'Chrome PDF Viewer',
      'Chromium PDF Viewer',
      'Microsoft Edge PDF Viewer',
      'WebKit built-in PDF',
    ],
    webglRenderers: [
      { vendor: 'Intel', renderer: 'Mesa Intel(R) UHD Graphics 630 (CML GT2)' },
      { vendor: 'Intel', renderer: 'Mesa Intel(R) HD Graphics 620 (KBL GT2)' },
      { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce GTX 1660 Ti/PCIe/SSE2' },
      { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce RTX 3060/PCIe/SSE2' },
      { vendor: 'AMD', renderer: 'AMD Radeon RX 6600 (NAVI23, DRM 3.49.0, 6.2.0-26-generic, LLVM 15.0.7)' },
      { vendor: 'AMD', renderer: 'AMD Radeon RX 5700 XT (NAVI10, DRM 3.49.0, 6.2.0-26-generic, LLVM 15.0.7)' },
    ],
    hardwareConcurrency: { min: 4, max: 32 },
    deviceMemory: [4, 8, 16, 32, 64],
    screenResolutions: [
      { width: 1920, height: 1080 },
      { width: 1366, height: 768 },
      { width: 2560, height: 1440 },
      { width: 1440, height: 900 },
      { width: 3840, height: 2160 },
    ],
  },
];

export class FingerprintGenerator {
  private config: FingerprintConfig;

  constructor(config: FingerprintConfig) {
    this.config = config;
  }

  /**
   * Generate a complete fingerprint profile with platform correlation
   */
  generate(): GeneratedFingerprint {
    // Select platform profile first - this is the key to correlation
    const platformProfile = this.config.spoofPlatform
      ? this.randomElement(platformProfiles)
      : platformProfiles[0]; // Default to Windows

    // All subsequent values are correlated to the selected platform
    const userAgent = this.config.randomizeUserAgent
      ? this.randomElement(platformProfile.userAgents)
      : platformProfile.userAgents[0];

    const viewport = this.config.randomizeViewport
      ? this.randomElement(platformProfile.screenResolutions)
      : platformProfile.screenResolutions[0];

    const language = this.config.randomizeLocale
      ? this.randomElement(locales)
      : locales[0];

    const timezone = this.config.randomizeTimezone
      ? this.randomElement(timezones)
      : timezones[0];

    const hardwareConcurrency = this.config.spoofHardwareConcurrency
      ? this.randomInt(platformProfile.hardwareConcurrency.min, platformProfile.hardwareConcurrency.max)
      : platformProfile.hardwareConcurrency.min;

    const deviceMemory = this.config.spoofDeviceMemory
      ? this.randomElement(platformProfile.deviceMemory)
      : platformProfile.deviceMemory[0];

    // Select WebGL renderer from platform-specific pool
    const webglRenderer = this.randomElement(platformProfile.webglRenderers);

    // Generate realistic fonts for this platform
    const fonts = this.config.randomizeFonts
      ? this.generateFontList(platformProfile.fonts)
      : platformProfile.fonts;

    // Generate realistic plugins for this platform
    const plugins = this.config.spoofPlugins
      ? this.generatePluginList(platformProfile.plugins)
      : platformProfile.plugins;

    return {
      userAgent,
      viewport,
      platform: platformProfile.platform,
      vendor: platformProfile.vendor,
      language,
      timezone,
      canvasFingerprint: this.generateCanvasFingerprint(),
      webglFingerprint: this.generateWebGLFingerprint(),
      audioFingerprint: this.generateAudioFingerprint(),
      fonts,
      hardwareConcurrency,
      deviceMemory,
      plugins,
      webglRenderer, // Add WebGL renderer to fingerprint
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

    // Viewport is set via context options, not needed here

    // Inject advanced evasions
    await this.injectCanvasEvasion(context, fingerprint.canvasFingerprint);
    await this.injectWebGLEvasion(context, fingerprint.webglRenderer);
    await this.injectAudioEvasion(context);
    await this.injectWebRTCEvasion(context);
    await this.injectNavigatorEvasion(context, fingerprint);
  }

  /**
   * Apply fingerprint to a specific page
   */
  async applyToPage(page: Page, fingerprint: GeneratedFingerprint): Promise<void> {
    // Timezone and locale are set via context options
    // Set locale headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': `${fingerprint.language},en;q=0.9`,
    });

    // Additional page-level evasions
    await this.injectPageEvasions(page, fingerprint);
  }

  /**
   * Inject canvas fingerprint evasion with content-based seeding
   */
  private async injectCanvasEvasion(context: BrowserContext, canvasSeed: string): Promise<void> {
    if (!this.config.randomizeCanvas) return;

    await context.addInitScript((seed: string) => {
      const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
      const originalToBlob = HTMLCanvasElement.prototype.toBlob;
      const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;

      // Simple hash function for consistent seeding
      const hashString = (str: string): number => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
      };

      // Seeded random number generator
      const seededRandom = (seed: number): () => number => {
        let state = seed;
        return () => {
          state = (state * 1664525 + 1013904223) % 4294967296;
          return state / 4294967296;
        };
      };

      // Add noise to canvas using content-based seeding
      const addNoise = (canvas: HTMLCanvasElement) => {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          // Generate seed from canvas content + global seed
          let contentHash = 0;
          for (let i = 0; i < Math.min(imageData.data.length, 1000); i += 4) {
            contentHash += imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2];
          }
          const combinedSeed = hashString(seed + contentHash.toString());
          const rng = seededRandom(combinedSeed);

          // Apply consistent noise based on content
          for (let i = 0; i < imageData.data.length; i += 4) {
            const noise = Math.floor(rng() * 3);
            imageData.data[i] = imageData.data[i] ^ noise;
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

        // Generate seed from content
        let contentHash = 0;
        for (let i = 0; i < Math.min(imageData.data.length, 1000); i += 4) {
          contentHash += imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2];
        }
        const combinedSeed = hashString(seed + contentHash.toString());
        const rng = seededRandom(combinedSeed);

        for (let i = 0; i < imageData.data.length; i += 4) {
          const noise = Math.floor(rng() * 3);
          imageData.data[i] = imageData.data[i] ^ noise;
        }
        return imageData;
      };
    }, canvasSeed);
  }

  /**
   * Inject WebGL fingerprint evasion with platform-correlated renderer
   */
  private async injectWebGLEvasion(context: BrowserContext, webglRenderer: { vendor: string; renderer: string }): Promise<void> {
    if (!this.config.randomizeWebGL) return;

    await context.addInitScript((renderer) => {
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      const getParameter2 = WebGL2RenderingContext.prototype.getParameter;

      // Override WebGL 1.0
      WebGLRenderingContext.prototype.getParameter = function (parameter) {
        if (parameter === 37445) { // UNMASKED_VENDOR_WEBGL
          return renderer.vendor;
        }
        if (parameter === 37446) { // UNMASKED_RENDERER_WEBGL
          return renderer.renderer;
        }
        return getParameter.apply(this, [parameter]);
      };

      // Override WebGL 2.0
      WebGL2RenderingContext.prototype.getParameter = function (parameter) {
        if (parameter === 37445) { // UNMASKED_VENDOR_WEBGL
          return renderer.vendor;
        }
        if (parameter === 37446) { // UNMASKED_RENDERER_WEBGL
          return renderer.renderer;
        }
        return getParameter2.apply(this, [parameter]);
      };
    }, webglRenderer);
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
   * Inject improved WebRTC leak prevention
   */
  private async injectWebRTCEvasion(context: BrowserContext): Promise<void> {
    if (!this.config.preventWebRTC) return;

    await context.addInitScript(() => {
      // Instead of setting to undefined (detectable), mock the APIs properly

      // Mock MediaDevices with realistic implementation
      const mockMediaDevices = {
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true,
        ondevicechange: null,
        enumerateDevices: async () => Promise.resolve([]),
        getSupportedConstraints: () => ({
          aspectRatio: true,
          autoGainControl: true,
          brightness: true,
          channelCount: true,
          colorTemperature: true,
          contrast: true,
          deviceId: true,
          echoCancellation: true,
          exposureCompensation: true,
          exposureMode: true,
          facingMode: true,
          focusDistance: true,
          focusMode: true,
          frameRate: true,
          groupId: true,
          height: true,
          iso: true,
          latency: true,
          noiseSuppression: true,
          pan: true,
          pointsOfInterest: true,
          sampleRate: true,
          sampleSize: true,
          saturation: true,
          sharpness: true,
          tilt: true,
          torch: true,
          videoKind: true,
          volume: true,
          whiteBalanceMode: true,
          width: true,
          zoom: true,
        }),
        getUserMedia: () => Promise.reject(new DOMException('Permission denied', 'NotAllowedError')),
        getDisplayMedia: () => Promise.reject(new DOMException('Permission denied', 'NotAllowedError')),
      };

      Object.defineProperty(navigator, 'mediaDevices', {
        get: () => mockMediaDevices,
        configurable: true,
      });

      // Mock RTCPeerConnection to prevent IP leaks
      const MockRTCPeerConnection = function(this: any, config?: any) {
        this.localDescription = null;
        this.remoteDescription = null;
        this.signalingState = 'stable';
        this.iceGatheringState = 'new';
        this.iceConnectionState = 'new';
        this.connectionState = 'new';
        this.canTrickleIceCandidates = null;
        this.onicecandidate = null;
        this.ontrack = null;
        this.ondatachannel = null;
        this.onnegotiationneeded = null;
        this.onsignalingstatechange = null;
        this.oniceconnectionstatechange = null;
        this.onicegatheringstatechange = null;
        this.onconnectionstatechange = null;

        // Mock methods
        this.createOffer = () => Promise.reject(new DOMException('Operation failed', 'OperationError'));
        this.createAnswer = () => Promise.reject(new DOMException('Operation failed', 'OperationError'));
        this.setLocalDescription = () => Promise.reject(new DOMException('Operation failed', 'OperationError'));
        this.setRemoteDescription = () => Promise.reject(new DOMException('Operation failed', 'OperationError'));
        this.addIceCandidate = () => Promise.reject(new DOMException('Operation failed', 'OperationError'));
        this.getStats = () => Promise.resolve(new Map());
        this.getTransceivers = () => [];
        this.getSenders = () => [];
        this.getReceivers = () => [];
        this.addTrack = () => { throw new DOMException('Operation failed', 'OperationError'); };
        this.removeTrack = () => {};
        this.addTransceiver = () => { throw new DOMException('Operation failed', 'OperationError'); };
        this.createDataChannel = () => { throw new DOMException('Operation failed', 'OperationError'); };
        this.close = () => {};
      };

      // Replace RTCPeerConnection with mock
      (window as any).RTCPeerConnection = MockRTCPeerConnection;
      (window as any).webkitRTCPeerConnection = MockRTCPeerConnection;
      (window as any).mozRTCPeerConnection = MockRTCPeerConnection;

      // Mock RTCSessionDescription
      const MockRTCSessionDescription = function(this: any, descriptionInitDict?: any) {
        this.type = descriptionInitDict?.type || '';
        this.sdp = descriptionInitDict?.sdp || '';
        this.toJSON = () => ({ type: this.type, sdp: this.sdp });
      };
      (window as any).RTCSessionDescription = MockRTCSessionDescription;

      // Mock RTCIceCandidate
      const MockRTCIceCandidate = function(this: any, candidateInitDict?: any) {
        this.candidate = candidateInitDict?.candidate || '';
        this.sdpMid = candidateInitDict?.sdpMid || null;
        this.sdpMLineIndex = candidateInitDict?.sdpMLineIndex || null;
        this.foundation = null;
        this.component = null;
        this.priority = null;
        this.address = null;
        this.protocol = null;
        this.port = null;
        this.type = null;
        this.tcpType = null;
        this.relatedAddress = null;
        this.relatedPort = null;
        this.usernameFragment = null;
        this.toJSON = () => ({
          candidate: this.candidate,
          sdpMid: this.sdpMid,
          sdpMLineIndex: this.sdpMLineIndex,
        });
      };
      (window as any).RTCIceCandidate = MockRTCIceCandidate;

      // Mock RTCDataChannel
      const MockRTCDataChannel = function(this: any) {
        this.label = '';
        this.ordered = true;
        this.maxPacketLifeTime = null;
        this.maxRetransmits = null;
        this.protocol = '';
        this.negotiated = false;
        this.id = null;
        this.readyState = 'closed';
        this.bufferedAmount = 0;
        this.bufferedAmountLowThreshold = 0;
        this.binaryType = 'blob';
        this.onopen = null;
        this.onclose = null;
        this.onerror = null;
        this.onmessage = null;
        this.onbufferedamountlow = null;
        this.send = () => {};
        this.close = () => {};
      };
      (window as any).RTCDataChannel = MockRTCDataChannel;
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
    await page.addInitScript((fp: GeneratedFingerprint) => {
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
   * Generate realistic font list based on platform
   */
  private generateFontList(platformFonts: string[]): string[] {
    if (this.config.randomizeFonts) {
      // Randomly remove 10-30% of fonts to create variance
      const removePercentage = 0.1 + Math.random() * 0.2;
      return platformFonts.filter(() => Math.random() > removePercentage);
    }

    return platformFonts;
  }

  /**
   * Generate realistic plugin list based on platform
   */
  private generatePluginList(platformPlugins: string[]): string[] {
    if (this.config.spoofPlugins) {
      // Randomly remove 0-2 plugins to create variance
      const removeCount = Math.floor(Math.random() * 3);
      const shuffled = [...platformPlugins].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, platformPlugins.length - removeCount);
    }

    return platformPlugins;
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
