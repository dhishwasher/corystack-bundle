import type { BrowserContext } from 'playwright';
import pino from 'pino';

const logger = pino({ name: 'tls-http2-fingerprint' });

export interface TLSProfile {
  name: string;
  ja3: string;
  cipherSuites: string[];
  extensions: number[];
  curves: string[];
  signatureAlgorithms: string[];
  http2Settings: {
    HEADER_TABLE_SIZE: number;
    ENABLE_PUSH: number;
    MAX_CONCURRENT_STREAMS: number;
    INITIAL_WINDOW_SIZE: number;
    MAX_FRAME_SIZE: number;
    MAX_HEADER_LIST_SIZE: number;
  };
  http2WindowUpdate: number;
  http2Priority: {
    weight: number;
    dependency: number;
    exclusive: boolean;
  };
  headerOrder: string[];
  pseudoHeaderOrder: string[];
}

/**
 * Comprehensive TLS and HTTP/2 fingerprint profiles
 * Based on real browser TLS/HTTP2 signatures
 */
export const TLS_HTTP2_PROFILES: Record<string, TLSProfile> = {
  'chrome-120-windows': {
    name: 'Chrome 120 on Windows',
    ja3: '771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-17513-21,29-23-24,0',
    cipherSuites: [
      'TLS_AES_128_GCM_SHA256',
      'TLS_AES_256_GCM_SHA384',
      'TLS_CHACHA20_POLY1305_SHA256',
      'TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256',
      'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256',
      'TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384',
      'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384',
      'TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256',
      'TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256',
      'TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA',
      'TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA',
      'TLS_RSA_WITH_AES_128_GCM_SHA256',
      'TLS_RSA_WITH_AES_256_GCM_SHA384',
      'TLS_RSA_WITH_AES_128_CBC_SHA',
      'TLS_RSA_WITH_AES_256_CBC_SHA',
    ],
    extensions: [0, 23, 65281, 10, 11, 35, 16, 5, 13, 18, 51, 45, 43, 27, 17513, 21],
    curves: ['X25519', 'P-256', 'P-384'],
    signatureAlgorithms: [
      'ecdsa_secp256r1_sha256',
      'rsa_pss_rsae_sha256',
      'rsa_pkcs1_sha256',
      'ecdsa_secp384r1_sha384',
      'rsa_pss_rsae_sha384',
      'rsa_pkcs1_sha384',
      'rsa_pss_rsae_sha512',
      'rsa_pkcs1_sha512',
    ],
    http2Settings: {
      HEADER_TABLE_SIZE: 65536,
      ENABLE_PUSH: 0,
      MAX_CONCURRENT_STREAMS: 1000,
      INITIAL_WINDOW_SIZE: 6291456,
      MAX_FRAME_SIZE: 16384,
      MAX_HEADER_LIST_SIZE: 262144,
    },
    http2WindowUpdate: 15663105,
    http2Priority: {
      weight: 256,
      dependency: 0,
      exclusive: true,
    },
    headerOrder: [
      'accept',
      'accept-encoding',
      'accept-language',
      'cache-control',
      'cookie',
      'referer',
      'sec-ch-ua',
      'sec-ch-ua-mobile',
      'sec-ch-ua-platform',
      'sec-fetch-dest',
      'sec-fetch-mode',
      'sec-fetch-site',
      'sec-fetch-user',
      'upgrade-insecure-requests',
      'user-agent',
    ],
    pseudoHeaderOrder: [':method', ':authority', ':scheme', ':path'],
  },

  'chrome-120-macos': {
    name: 'Chrome 120 on macOS',
    ja3: '771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-17513-21,29-23-24,0',
    cipherSuites: [
      'TLS_AES_128_GCM_SHA256',
      'TLS_AES_256_GCM_SHA384',
      'TLS_CHACHA20_POLY1305_SHA256',
      'TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256',
      'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256',
      'TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384',
      'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384',
      'TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256',
      'TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256',
      'TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA',
      'TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA',
      'TLS_RSA_WITH_AES_128_GCM_SHA256',
      'TLS_RSA_WITH_AES_256_GCM_SHA384',
      'TLS_RSA_WITH_AES_128_CBC_SHA',
      'TLS_RSA_WITH_AES_256_CBC_SHA',
    ],
    extensions: [0, 23, 65281, 10, 11, 35, 16, 5, 13, 18, 51, 45, 43, 27, 17513, 21],
    curves: ['X25519', 'P-256', 'P-384'],
    signatureAlgorithms: [
      'ecdsa_secp256r1_sha256',
      'rsa_pss_rsae_sha256',
      'rsa_pkcs1_sha256',
      'ecdsa_secp384r1_sha384',
      'rsa_pss_rsae_sha384',
      'rsa_pkcs1_sha384',
      'rsa_pss_rsae_sha512',
      'rsa_pkcs1_sha512',
    ],
    http2Settings: {
      HEADER_TABLE_SIZE: 65536,
      ENABLE_PUSH: 0,
      MAX_CONCURRENT_STREAMS: 1000,
      INITIAL_WINDOW_SIZE: 6291456,
      MAX_FRAME_SIZE: 16384,
      MAX_HEADER_LIST_SIZE: 262144,
    },
    http2WindowUpdate: 15663105,
    http2Priority: {
      weight: 256,
      dependency: 0,
      exclusive: true,
    },
    headerOrder: [
      'accept',
      'accept-encoding',
      'accept-language',
      'cache-control',
      'cookie',
      'referer',
      'sec-ch-ua',
      'sec-ch-ua-mobile',
      'sec-ch-ua-platform',
      'sec-fetch-dest',
      'sec-fetch-mode',
      'sec-fetch-site',
      'sec-fetch-user',
      'upgrade-insecure-requests',
      'user-agent',
    ],
    pseudoHeaderOrder: [':method', ':authority', ':scheme', ':path'],
  },

  'chrome-119-windows': {
    name: 'Chrome 119 on Windows',
    ja3: '771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-17513,29-23-24,0',
    cipherSuites: [
      'TLS_AES_128_GCM_SHA256',
      'TLS_AES_256_GCM_SHA384',
      'TLS_CHACHA20_POLY1305_SHA256',
      'TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256',
      'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256',
      'TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384',
      'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384',
      'TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256',
      'TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256',
      'TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA',
      'TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA',
      'TLS_RSA_WITH_AES_128_GCM_SHA256',
      'TLS_RSA_WITH_AES_256_GCM_SHA384',
      'TLS_RSA_WITH_AES_128_CBC_SHA',
      'TLS_RSA_WITH_AES_256_CBC_SHA',
    ],
    extensions: [0, 23, 65281, 10, 11, 35, 16, 5, 13, 18, 51, 45, 43, 27, 17513],
    curves: ['X25519', 'P-256', 'P-384'],
    signatureAlgorithms: [
      'ecdsa_secp256r1_sha256',
      'rsa_pss_rsae_sha256',
      'rsa_pkcs1_sha256',
      'ecdsa_secp384r1_sha384',
      'rsa_pss_rsae_sha384',
      'rsa_pkcs1_sha384',
      'rsa_pss_rsae_sha512',
      'rsa_pkcs1_sha512',
    ],
    http2Settings: {
      HEADER_TABLE_SIZE: 65536,
      ENABLE_PUSH: 0,
      MAX_CONCURRENT_STREAMS: 1000,
      INITIAL_WINDOW_SIZE: 6291456,
      MAX_FRAME_SIZE: 16384,
      MAX_HEADER_LIST_SIZE: 262144,
    },
    http2WindowUpdate: 15663105,
    http2Priority: {
      weight: 256,
      dependency: 0,
      exclusive: true,
    },
    headerOrder: [
      'accept',
      'accept-encoding',
      'accept-language',
      'cache-control',
      'cookie',
      'referer',
      'sec-ch-ua',
      'sec-ch-ua-mobile',
      'sec-ch-ua-platform',
      'sec-fetch-dest',
      'sec-fetch-mode',
      'sec-fetch-site',
      'upgrade-insecure-requests',
      'user-agent',
    ],
    pseudoHeaderOrder: [':method', ':authority', ':scheme', ':path'],
  },
};

/**
 * TLS and HTTP/2 Fingerprint Manager
 *
 * Note: Playwright uses Chromium's network stack which has its own TLS signature.
 * This module provides browser launch args and request interception to better match
 * real Chrome TLS/HTTP2 behavior. For complete TLS fingerprint control, consider
 * using external libraries like curl-impersonate or tls-client for API requests.
 */
export class TLSAndHTTP2Manager {
  private profile: TLSProfile;

  constructor(profileName: keyof typeof TLS_HTTP2_PROFILES = 'chrome-120-windows') {
    this.profile = TLS_HTTP2_PROFILES[profileName];
    logger.info({ profile: this.profile.name }, 'TLS/HTTP2 profile loaded');
  }

  /**
   * Get browser launch arguments to optimize TLS behavior
   */
  getBrowserLaunchArgs(): string[] {
    return [
      // Enable HTTP/2
      '--enable-features=NetworkService,NetworkServiceInProcess',

      // TLS settings
      '--disable-features=RendererCodeIntegrity',
      '--disable-features=IsolateOrigins,site-per-process',

      // HTTP/2 settings
      '--enable-quic',
      '--enable-http2',

      // Disable automation flags that affect TLS
      '--disable-blink-features=AutomationControlled',

      // Additional stealth args
      '--disable-dev-shm-usage',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
    ];
  }

  /**
   * Apply HTTP header ordering to match browser profile
   */
  async applyHeaderOrder(context: BrowserContext): Promise<void> {
    await context.route('**/*', async (route) => {
      const request = route.request();
      const headers = request.headers();

      // Reorder headers to match profile
      const orderedHeaders: Record<string, string> = {};

      // Add headers in profile order
      for (const headerName of this.profile.headerOrder) {
        const value = headers[headerName];
        if (value) {
          orderedHeaders[headerName] = value;
        }
      }

      // Add any remaining headers
      for (const [key, value] of Object.entries(headers)) {
        if (!orderedHeaders[key]) {
          orderedHeaders[key] = value;
        }
      }

      await route.continue({ headers: orderedHeaders });
    });

    logger.debug('Applied HTTP header ordering');
  }

  /**
   * Inject HTTP/2 settings into page context
   *
   * Note: This is informational only. Actual HTTP/2 settings are controlled by
   * Chromium's network stack. For real HTTP/2 fingerprint control, use external
   * HTTP clients with custom settings.
   */
  async injectHTTP2Settings(context: BrowserContext): Promise<void> {
    await context.addInitScript((settings) => {
      // Store HTTP/2 settings for reference
      (window as any).__http2Settings = settings;
    }, this.profile.http2Settings);

    logger.debug({ settings: this.profile.http2Settings }, 'Injected HTTP/2 settings reference');
  }

  /**
   * Get current profile information
   */
  getProfile(): TLSProfile {
    return this.profile;
  }

  /**
   * Get JA3 fingerprint
   */
  getJA3(): string {
    return this.profile.ja3;
  }

  /**
   * Get recommended headers for fetch requests
   */
  getRecommendedHeaders(url: string, referer?: string): Record<string, string> {
    const urlObj = new URL(url);

    return {
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'accept-encoding': 'gzip, deflate, br',
      'accept-language': 'en-US,en;q=0.9',
      'cache-control': 'max-age=0',
      'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': referer && new URL(referer).hostname === urlObj.hostname ? 'same-origin' : 'none',
      'sec-fetch-user': '?1',
      'upgrade-insecure-requests': '1',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ...(referer && { 'referer': referer }),
    };
  }

  /**
   * Create a fetch wrapper that uses correct header order
   */
  createOrderedFetch(): (url: string, options?: RequestInit) => Promise<Response> {
    return async (url: string, options: RequestInit = {}) => {
      const headers = new Headers(options.headers || {});

      // Ensure headers are in correct order
      const orderedHeaders = new Headers();
      for (const headerName of this.profile.headerOrder) {
        const value = headers.get(headerName);
        if (value) {
          orderedHeaders.set(headerName, value);
        }
      }

      // Add any remaining headers
      headers.forEach((value, key) => {
        if (!orderedHeaders.has(key)) {
          orderedHeaders.set(key, value);
        }
      });

      return fetch(url, {
        ...options,
        headers: orderedHeaders,
      });
    };
  }

  /**
   * Get information about TLS/HTTP2 fingerprinting limitations
   */
  static getFingerprintingInfo(): string {
    return `
TLS/HTTP2 Fingerprinting Limitations in Playwright:

1. TLS Fingerprint (JA3):
   - Playwright uses Chromium's network stack
   - TLS cipher suites and extensions are controlled by Chromium
   - Cannot fully customize TLS handshake without external libraries

2. HTTP/2 Fingerprint:
   - HTTP/2 settings frames are sent by Chromium
   - Frame order and priority are controlled by Chromium
   - Window updates follow Chromium's algorithm

3. Recommended Workarounds:
   - For API requests: Use curl-impersonate or tls-client libraries
   - For browser automation: Use this module + browser launch args
   - For maximum stealth: Combine Playwright for DOM + external HTTP client for requests

4. What This Module Does:
   - Provides correct browser launch arguments
   - Orders HTTP headers to match real Chrome
   - Injects HTTP/2 settings for reference
   - Provides fetch wrapper with correct header order
   - Documents expected TLS/HTTP2 signatures

5. Detection Risk:
   - Low: Most sites don't check TLS fingerprints
   - Medium: Advanced sites (Akamai, Imperva) may check
   - High: Financial/government sites with strict TLS validation
   - Mitigation: Use residential proxies + correct headers
    `.trim();
  }
}
