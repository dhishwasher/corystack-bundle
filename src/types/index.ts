import type { Browser, Page, BrowserContext } from 'playwright';

export interface StealthConfig {
  fingerprint: FingerprintConfig;
  behavior: BehaviorConfig;
  network: NetworkConfig;
  detection: DetectionConfig;
  logging: LoggingConfig;
}

export interface FingerprintConfig {
  randomizeCanvas: boolean;
  randomizeWebGL: boolean;
  randomizeAudioContext: boolean;
  randomizeFonts: boolean;
  randomizeTimezone: boolean;
  randomizeLocale: boolean;
  randomizeUserAgent: boolean;
  randomizeViewport: boolean;
  hideWebDriver: boolean;
  hideAutomation: boolean;
  preventWebRTC: boolean;
  spoofHardwareConcurrency: boolean;
  spoofDeviceMemory: boolean;
  spoofPlatform: boolean;
  spoofPlugins: boolean;
}

export interface BehaviorConfig {
  humanMouseMovements: boolean;
  randomScrolling: boolean;
  randomClicks: boolean;
  typingDelay: { min: number; max: number };
  pageLoadDelay: { min: number; max: number };
  scrollDelay: { min: number; max: number };
  mouseMovementSpeed: number;
  naturalErrors: boolean; // Simulate typing mistakes
  randomPageDwell: boolean;
}

export interface NetworkConfig {
  proxyEnabled: boolean;
  proxyList: Proxy[];
  proxyRotationInterval: number;
  maxRetries: number;
  timeout: number;
  customHeaders: Record<string, string>;
  headerOrder: string[];
  tlsFingerprint: TLSFingerprint | null;
  http2Enabled: boolean;
}

export interface Proxy {
  type: 'http' | 'https' | 'socks4' | 'socks5';
  host: string;
  port: number;
  username?: string;
  password?: string;
  country?: string;
  city?: string;
  isResidential?: boolean;
  lastUsed?: number;
  successRate?: number;
}

export interface TLSFingerprint {
  cipherSuites: string[];
  extensions: string[];
  curves: string[];
  signatureAlgorithms: string[];
}

export interface DetectionConfig {
  detectCaptcha: boolean;
  detectCloudflare: boolean;
  detectPerimeterX: boolean;
  detectDataDome: boolean;
  detectRecaptcha: boolean;
  detectHCaptcha: boolean;
  autoBypass: boolean;
  captchaServiceApiKey?: string;
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  toFile: boolean;
  toConsole: boolean;
  logDir: string;
  includeScreenshots: boolean;
  includeHAR: boolean;
}

export interface ScraperSession {
  id: string;
  browser: Browser;
  context: BrowserContext;
  pages: Page[];
  proxy: Proxy | null;
  fingerprint: GeneratedFingerprint;
  startTime: number;
  requestCount: number;
  successCount: number;
  failureCount: number;
  detections: Detection[];
}

export interface GeneratedFingerprint {
  userAgent: string;
  viewport: { width: number; height: number };
  platform: string;
  vendor: string;
  language: string;
  timezone: string;
  canvasFingerprint: string;
  webglFingerprint: string;
  audioFingerprint: string;
  fonts: string[];
  hardwareConcurrency: number;
  deviceMemory: number;
  plugins: string[];
}

export interface Detection {
  type: 'captcha' | 'challenge' | 'block' | 'fingerprint' | 'rate-limit' | 'unknown';
  timestamp: number;
  url: string;
  details: string;
  screenshot?: string;
  response?: {
    status: number;
    headers: Record<string, string>;
    body?: string;
  };
}

export interface VulnerabilityReport {
  sessionId: string;
  timestamp: number;
  targetUrl: string;
  vulnerabilities: Vulnerability[];
  bypassSuccess: boolean;
  detectionRate: number;
  recommendations: string[];
}

export interface Vulnerability {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  title: string;
  description: string;
  evidence: string[];
  recommendation: string;
  cwe?: string;
  cvss?: number;
}

export interface ScraperTask {
  id: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  actions?: PageAction[];
  extractors?: DataExtractor[];
  waitFor?: WaitCondition;
  priority: number;
  retries: number;
  maxRetries: number;
}

export interface PageAction {
  type: 'click' | 'type' | 'scroll' | 'wait' | 'hover' | 'select' | 'screenshot';
  selector?: string;
  value?: string | number;
  duration?: number;
  humanLike?: boolean;
}

export interface DataExtractor {
  name: string;
  selector: string;
  type: 'text' | 'html' | 'attribute' | 'multiple';
  attribute?: string;
  transform?: (value: any) => any;
}

export interface WaitCondition {
  type: 'selector' | 'navigation' | 'timeout' | 'function';
  value: string | number | (() => boolean);
}

export interface BrowserPool {
  browsers: Map<string, ScraperSession>;
  maxSize: number;
  minSize: number;
  idleTimeout: number;
}

export interface ScraperMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  captchaDetections: number;
  blockDetections: number;
  averageResponseTime: number;
  proxySuccessRate: Map<string, number>;
  detectionsByType: Map<string, number>;
  vulnerabilitiesFound: number;
}
