# API Documentation

## Table of Contents

- [Core Classes](#core-classes)
  - [StealthScraper](#stealthscraper)
  - [SessionManager](#sessionmanager)
  - [ProxyManager](#proxymanager)
- [Advanced Features](#advanced-features)
  - [DistributedQueue](#distributedqueue)
  - [RateLimiter](#ratelimiter)
  - [TLSFingerprintManager](#tlsfingerprintmanager)
  - [MonitoringSystem](#monitoringsystem)
- [Configuration](#configuration)
- [Types](#types)

---

## Core Classes

### StealthScraper

Main entry point for all scraping operations.

#### Constructor

```typescript
new StealthScraper(config?: Partial<StealthConfig>)
```

**Parameters:**
- `config` (optional): Partial configuration object to override defaults

**Example:**
```typescript
const scraper = new StealthScraper({
  fingerprint: {
    randomizeCanvas: true,
    randomizeWebGL: true,
  },
  behavior: {
    humanMouseMovements: true,
  },
});
```

#### Methods

##### `executeTask(task: ScraperTask): Promise<TaskResult>`

Execute a single scraping task.

**Parameters:**
- `task`: ScraperTask object defining the scraping operation

**Returns:**
- Promise resolving to object with:
  - `success`: boolean indicating task success
  - `data`: extracted data (if extractors defined)
  - `detections`: array of Detection objects
  - `screenshot`: base64 screenshot (if enabled)

**Example:**
```typescript
const result = await scraper.executeTask({
  id: 'task-1',
  url: 'https://example.com',
  method: 'GET',
  extractors: [{
    name: 'title',
    selector: 'h1',
    type: 'text',
  }],
  priority: 1,
  retries: 0,
  maxRetries: 3,
});
```

##### `testSecurity(url: string, options?: TestOptions): Promise<VulnerabilityReport>`

Test a website's bot detection security.

**Parameters:**
- `url`: Target URL to test
- `options` (optional):
  - `attempts`: number of test attempts (default: 5)
  - `useProxies`: enable proxy rotation (default: false)
  - `simulateHumanBehavior`: simulate human behavior (default: true)

**Returns:**
- Promise resolving to VulnerabilityReport

**Example:**
```typescript
const report = await scraper.testSecurity('https://your-site.com', {
  attempts: 10,
  useProxies: true,
  simulateHumanBehavior: true,
});

console.log(`Vulnerabilities: ${report.vulnerabilities.length}`);
console.log(`Bypass Success: ${report.bypassSuccess}`);
```

##### `stressTest(url: string, options?: StressTestOptions): Promise<StressTestResult>`

Stress test a target with concurrent sessions.

**Parameters:**
- `url`: Target URL
- `options` (optional):
  - `concurrentSessions`: number of concurrent sessions (default: 5)
  - `requestsPerSession`: requests per session (default: 10)
  - `useProxies`: enable proxy rotation (default: false)

**Returns:**
- Promise resolving to stress test results

**Example:**
```typescript
const result = await scraper.stressTest('https://your-site.com', {
  concurrentSessions: 10,
  requestsPerSession: 20,
  useProxies: true,
});
```

##### `getMetrics(): ScraperMetrics`

Get current scraper metrics.

**Returns:**
- ScraperMetrics object with request/detection statistics

**Example:**
```typescript
const metrics = scraper.getMetrics();
console.log(`Success Rate: ${metrics.successfulRequests / metrics.totalRequests * 100}%`);
```

##### `cleanup(): Promise<void>`

Clean up all resources (close browsers, sessions, etc.).

**Example:**
```typescript
await scraper.cleanup();
```

---

### SessionManager

Manages browser sessions with fingerprint isolation.

#### Constructor

```typescript
new SessionManager(config: StealthConfig, maxSessions?: number)
```

**Parameters:**
- `config`: Stealth configuration
- `maxSessions`: Maximum concurrent sessions (default: 10)

#### Methods

##### `createSession(options?: SessionOptions): Promise<ScraperSession>`

Create a new isolated browser session.

**Parameters:**
- `options` (optional):
  - `useProxy`: enable proxy for this session
  - `specificProxy`: use a specific proxy
  - `persistCookies`: persist cookies to disk

**Returns:**
- Promise resolving to ScraperSession

**Example:**
```typescript
const session = await sessionManager.createSession({
  useProxy: true,
  persistCookies: true,
});
```

##### `createPage(sessionId: string): Promise<Page>`

Create a new page in an existing session.

**Parameters:**
- `sessionId`: ID of the session

**Returns:**
- Promise resolving to Playwright Page

**Example:**
```typescript
const page = await sessionManager.createPage(session.id);
```

##### `closeSession(sessionId: string): Promise<void>`

Close a session and free resources.

---

### ProxyManager

Manages proxy rotation and success tracking.

#### Constructor

```typescript
new ProxyManager(proxies: Proxy[], rotationInterval?: number)
```

**Parameters:**
- `proxies`: Array of proxy configurations
- `rotationInterval`: Rotation interval in ms (default: 60000)

#### Methods

##### `getNextProxy(): Proxy | null`

Get next proxy from rotation pool.

**Example:**
```typescript
const proxy = proxyManager.getNextProxy();
```

##### `getRandomProxy(): Proxy | null`

Get a random proxy (for parallel requests).

##### `getBestProxy(): Proxy | null`

Get proxy with best success rate.

##### `getProxyByCountry(country: string): Proxy | null`

Get proxy from specific country.

**Example:**
```typescript
const usProxy = proxyManager.getProxyByCountry('US');
```

##### `getResidentialProxy(): Proxy | null`

Get a residential proxy (if available).

##### `updateProxyStats(proxy: Proxy, success: boolean): void`

Update proxy success rate. Automatically removes failing proxies.

##### `getStats(): ProxyStats`

Get proxy pool statistics.

**Returns:**
```typescript
{
  total: number;
  residential: number;
  datacenter: number;
  byCountry: Record<string, number>;
  averageSuccessRate: number;
}
```

##### `static loadFromFile(filePath: string): Promise<Proxy[]>`

Load proxies from file.

**Example:**
```typescript
const proxies = await ProxyManager.loadFromFile('./proxies.txt');
```

---

## Advanced Features

### DistributedQueue

Distributed task queue using BullMQ and Redis.

#### Constructor

```typescript
new DistributedQueue(scraperConfig: StealthConfig, queueConfig: QueueConfig)
```

**Parameters:**
- `scraperConfig`: Scraper configuration
- `queueConfig`: Queue configuration with Redis connection

**Example:**
```typescript
const queue = new DistributedQueue(scraperConfig, {
  redis: {
    host: 'localhost',
    port: 6379,
  },
  concurrency: 5,
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
});
```

#### Methods

##### `addTask(task: ScraperTask, options?: JobOptions): Promise<Job>`

Add scraping task to queue.

**Example:**
```typescript
const job = await queue.addTask({
  id: 'task-1',
  url: 'https://example.com',
  method: 'GET',
  priority: 1,
  retries: 0,
  maxRetries: 3,
});
```

##### `addBulkTasks(tasks: ScraperTask[]): Promise<Job[]>`

Add multiple tasks in bulk.

##### `addSecurityTest(url: string, options?: TestOptions): Promise<Job>`

Add security testing task.

**Example:**
```typescript
const job = await queue.addSecurityTest('https://your-site.com', {
  attempts: 5,
  useProxies: true,
});
```

##### `startWorker(): void`

Start worker to process tasks.

**Example:**
```typescript
queue.startWorker();
```

##### `stopWorker(): Promise<void>`

Stop worker gracefully.

##### `getStats(): Promise<QueueStats>`

Get queue statistics.

**Returns:**
```typescript
{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}
```

##### `pause(): Promise<void>` / `resume(): Promise<void>`

Pause/resume queue processing.

##### `close(): Promise<void>`

Close all connections.

---

### RateLimiter

Advanced rate limiting to prevent detection.

#### Constructor

```typescript
new RateLimiter(config?: Partial<RateLimitConfig>)
```

**Parameters:**
- `config` (optional): Rate limit configuration

**Example:**
```typescript
const limiter = new RateLimiter({
  maxRequestsPerSecond: 2,
  maxRequestsPerMinute: 60,
  maxRequestsPerHour: 1000,
  maxConcurrent: 5,
});
```

#### Methods

##### `waitForSlot(url: string): Promise<void>`

Wait until request can be made.

**Example:**
```typescript
await limiter.waitForSlot('https://example.com');
// Make request
limiter.releaseSlot('https://example.com');
```

##### `releaseSlot(url: string): void`

Mark request as completed.

##### `triggerBackoff(): void`

Trigger exponential backoff (call when rate limited).

##### `getStats(): RateLimitStats`

Get current rate limiting statistics.

---

### TLSFingerprintManager

TLS fingerprinting evasion.

#### Constructor

```typescript
new TLSFingerprintManager(profileName?: string)
```

**Parameters:**
- `profileName` (optional): Name of TLS profile (default: 'chrome-120')

**Available Profiles:**
- `chrome-120`
- `chrome-119`
- `firefox-120`
- `safari-17`

**Example:**
```typescript
const tlsManager = new TLSFingerprintManager('firefox-120');
```

#### Methods

##### `getRandomProfile(): TLSProfile`

Get a random TLS profile.

##### `setProfile(profileName: string): void`

Set specific TLS profile.

##### `getCurrentProfile(): TLSProfile`

Get current TLS profile.

##### `getTLSOptions(): TLSOptions`

Get TLS options for HTTP clients.

##### `getJA3Hash(): string`

Get JA3 fingerprint hash.

##### `getHTTP2Settings(): Record<string, number>`

Get HTTP/2 settings matching browser.

##### `randomizeProfile(): TLSProfile`

Randomize profile elements for uniqueness.

##### `static listProfiles(): string[]`

List all available profiles.

---

### MonitoringSystem

Real-time monitoring and metrics.

#### Constructor

```typescript
new MonitoringSystem()
```

#### Methods

##### `logRequest(log: RequestLog): void`

Log a request.

**Example:**
```typescript
monitoring.logRequest({
  timestamp: Date.now(),
  duration: 250,
  success: true,
  blocked: false,
  captcha: false,
  url: 'https://example.com',
});
```

##### `logDetection(detection: Detection): void`

Log a bot detection event.

##### `getMetrics(timeWindow?: number): MonitoringMetrics`

Get metrics for time window (default: 5 minutes).

**Returns:** Comprehensive metrics object

##### `getSuccessRateTrend(intervals: number, intervalDuration: number): number[]`

Get success rate trend over time.

##### `getDetectionRateTrend(intervals: number, intervalDuration: number): number[]`

Get detection rate trend.

##### `generateReport(): string`

Generate text-based monitoring report.

##### `generateJSONReport(): object`

Generate JSON report for external tools.

##### `isHealthy(thresholds?: HealthThresholds): HealthCheck`

Check system health against thresholds.

**Example:**
```typescript
const health = monitoring.isHealthy({
  minSuccessRate: 70,
  maxDetectionRate: 30,
  maxAvgResponseTime: 5000,
});

if (!health.healthy) {
  console.error('Health issues:', health.issues);
}
```

---

## Configuration

### StealthConfig

Complete configuration object:

```typescript
interface StealthConfig {
  fingerprint: FingerprintConfig;
  behavior: BehaviorConfig;
  network: NetworkConfig;
  detection: DetectionConfig;
  logging: LoggingConfig;
}
```

See `src/types/index.ts` for complete type definitions.

### Default Configuration

```typescript
import { defaultConfig } from 'corystack-stealth-scraper';

const scraper = new StealthScraper(defaultConfig);
```

---

## Types

### ScraperTask

```typescript
interface ScraperTask {
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
```

### VulnerabilityReport

```typescript
interface VulnerabilityReport {
  sessionId: string;
  timestamp: number;
  targetUrl: string;
  vulnerabilities: Vulnerability[];
  bypassSuccess: boolean;
  detectionRate: number;
  recommendations: string[];
}
```

### Proxy

```typescript
interface Proxy {
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
```

---

## Error Handling

All async methods may throw errors. Use try-catch:

```typescript
try {
  const result = await scraper.executeTask(task);
} catch (error) {
  console.error('Task failed:', error.message);

  // Check if rate limited
  if (error.response?.status === 429) {
    // Handle rate limiting
  }
}
```

---

## Best Practices

1. **Always cleanup:** Call `cleanup()` when done
2. **Use rate limiting:** Prevent detection through throttling
3. **Monitor health:** Use MonitoringSystem for production
4. **Rotate sessions:** Create new sessions periodically
5. **Handle detections:** Check detection reports and adjust strategy
6. **Test incrementally:** Start with basic config, add evasion as needed

---

## Examples

See `examples/` directory for complete examples:
- `basic-test.ts` - Simple security testing
- `advanced-scraping.ts` - Complex scraping tasks
- `with-proxies.ts` - Proxy rotation examples

---

**Need help?** Check the [README](../README.md) or open an issue on GitHub.
