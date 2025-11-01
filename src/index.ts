// Core scraping functionality
export { StealthScraper } from './core/stealth-scraper.js';
export { SessionManager } from './core/session-manager.js';
export { HumanBehaviorSimulator } from './core/behavior.js';
export { BotDetectionAnalyzer } from './core/detection.js';
export { FingerprintGenerator } from './core/fingerprint.js';
export { ProxyManager } from './core/proxy-manager.js';
export { VulnerabilityReporter } from './core/vulnerability-reporter.js';

// Advanced features
export { DistributedQueue } from './core/distributed-queue.js';
export { RateLimiter, rateLimit } from './core/rate-limiter.js';
export { TLSFingerprintManager, TLS_PROFILES, createCustomTLSProfile } from './core/tls-fingerprint.js';
export { MonitoringSystem, AlertingSystem } from './core/monitoring.js';
export { CaptchaSolver } from './advanced/captcha-solver.js';
export type { CaptchaSolverConfig, CaptchaTask, CaptchaResult } from './advanced/captcha-solver.js';
export { ResidentialProxyManager } from './advanced/residential-proxy-manager.js';
export type { ResidentialProxyProvider, ResidentialProxyConfig } from './advanced/residential-proxy-manager.js';

// Security features
export { AuthenticationManager } from './security/auth.js';
export { AuditLogger } from './security/audit-logger.js';
export { InputValidator } from './security/input-validator.js';
export { ComplianceChecker } from './security/compliance.js';

// Types and configuration
export * from './types/index.js';
export { defaultConfig } from './config/default.js';
