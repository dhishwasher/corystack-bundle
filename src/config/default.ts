import type { StealthConfig } from '../types/index.js';

export const defaultConfig: StealthConfig = {
  fingerprint: {
    randomizeCanvas: true,
    randomizeWebGL: true,
    randomizeAudioContext: true,
    randomizeFonts: true,
    randomizeTimezone: true,
    randomizeLocale: true,
    randomizeUserAgent: true,
    randomizeViewport: true,
    hideWebDriver: true,
    hideAutomation: true,
    preventWebRTC: true,
    spoofHardwareConcurrency: true,
    spoofDeviceMemory: true,
    spoofPlatform: true,
    spoofPlugins: true,
  },
  behavior: {
    humanMouseMovements: true,
    randomScrolling: true,
    randomClicks: false,
    typingDelay: { min: 50, max: 200 },
    pageLoadDelay: { min: 1000, max: 3000 },
    scrollDelay: { min: 500, max: 2000 },
    mouseMovementSpeed: 1.0,
    naturalErrors: true,
    randomPageDwell: true,
  },
  network: {
    proxyEnabled: false,
    proxyList: [],
    proxyRotationInterval: 60000,
    maxRetries: 3,
    timeout: 30000,
    customHeaders: {},
    headerOrder: [],
    tlsFingerprint: null,
    http2Enabled: true,
  },
  detection: {
    detectCaptcha: true,
    detectCloudflare: true,
    detectPerimeterX: true,
    detectDataDome: true,
    detectRecaptcha: true,
    detectHCaptcha: true,
    autoBypass: false,
    captchaServiceApiKey: undefined,
  },
  logging: {
    level: 'info',
    toFile: true,
    toConsole: true,
    logDir: './logs',
    includeScreenshots: true,
    includeHAR: false,
  },
};

export const chromeUserAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
];

export const viewportSizes = [
  { width: 1920, height: 1080 },
  { width: 1366, height: 768 },
  { width: 1536, height: 864 },
  { width: 1440, height: 900 },
  { width: 2560, height: 1440 },
  { width: 1280, height: 720 },
];

export const timezones = [
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'America/Denver',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
];

export const locales = [
  'en-US',
  'en-GB',
  'en-CA',
  'en-AU',
  'de-DE',
  'fr-FR',
  'es-ES',
  'ja-JP',
  'zh-CN',
];

export const platforms = [
  'Win32',
  'MacIntel',
  'Linux x86_64',
];

export const vendors = [
  'Google Inc.',
  'Apple Computer, Inc.',
  '',
];
