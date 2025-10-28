# Architecture Documentation

## System Overview

The CoryStack Stealth Scraper is a modular, production-grade web scraping framework designed for security testing. It employs a multi-layered architecture to evade bot detection while providing comprehensive vulnerability assessment.

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLI / API Layer                            │
│                    (User Interface & Commands)                       │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│                      Core Scraping Engine                           │
│                      (StealthScraper)                               │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │ Task Execution  │  │ Security     │  │ Stress Testing     │    │
│  │                 │  │ Testing      │  │                    │    │
│  └─────────────────┘  └──────────────┘  └────────────────────┘    │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│                    Session & Resource Management                     │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐   │
│  │ Session Mgr  │  │ Proxy Mgr    │  │ Rate Limiter           │   │
│  │              │  │              │  │                        │   │
│  └──────────────┘  └──────────────┘  └────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│                      Evasion Layer                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐   │
│  │ Fingerprint  │  │ Behavior     │  │ TLS Fingerprint        │   │
│  │ Generator    │  │ Simulator    │  │ Manager                │   │
│  └──────────────┘  └──────────────┘  └────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│                    Detection & Analysis Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐   │
│  │ Bot          │  │ Vulnerability│  │ Monitoring System      │   │
│  │ Detection    │  │ Reporter     │  │                        │   │
│  └──────────────┘  └──────────────┘  └────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│                  Browser Automation (Playwright)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐   │
│  │ Chromium     │  │ Browser      │  │ Page Context           │   │
│  │ Engine       │  │ Context      │  │                        │   │
│  └──────────────┘  └──────────────┘  └────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. StealthScraper (Core Engine)

**Location:** `src/core/stealth-scraper.ts`

**Responsibilities:**
- Orchestrate all scraping operations
- Coordinate between subsystems
- Execute tasks and security tests
- Aggregate metrics

**Key Methods:**
- `executeTask()` - Single task execution
- `testSecurity()` - Vulnerability assessment
- `stressTest()` - Load testing

**Data Flow:**
```
User Request → StealthScraper → SessionManager → Browser
                                ↓
                              ProxyManager
                                ↓
                              FingerprintGenerator
                                ↓
                              BehaviorSimulator
                                ↓
                              BotDetectionAnalyzer
                                ↓
                              VulnerabilityReporter
```

---

### 2. Session Management

**Location:** `src/core/session-manager.ts`

**Architecture:**
```
SessionManager
  │
  ├─ Session 1 (Browser Instance)
  │    ├─ Context (Fingerprint A, Proxy A)
  │    └─ Pages []
  │
  ├─ Session 2 (Browser Instance)
  │    ├─ Context (Fingerprint B, Proxy B)
  │    └─ Pages []
  │
  └─ Session N ...
```

**Features:**
- Session pooling (max configurable)
- Fingerprint isolation per session
- Automatic cleanup of old sessions
- Cookie persistence support

**Lifecycle:**
```
createSession() → applyFingerprint() → createPage() → execute() → closeSession()
```

---

### 3. Evasion Systems

#### 3.1 Fingerprint Generator

**Location:** `src/core/fingerprint.ts`

**Randomizes:**
- Canvas fingerprints (noise injection)
- WebGL renderer/vendor
- Audio context
- User agent
- Viewport size
- Timezone & locale
- Hardware specs (CPU, memory)
- Navigator properties
- Plugins list

**Injection Points:**
```
Browser Launch → Context Creation → Init Scripts → Page Navigation
                      ↓
                  applyToContext()
                      ↓
                  - Inject evasion scripts
                  - Set navigator props
                  - Configure viewport
                      ↓
                  applyToPage()
                      ↓
                  - Set headers
                  - Inject page scripts
```

#### 3.2 Behavior Simulator

**Location:** `src/core/behavior.ts`

**Simulates:**
- Mouse movements (Bezier curves)
- Typing patterns (variable speed + errors)
- Scrolling (with reading pauses)
- Clicks (with hover & delay)
- Idle time (micro-movements)

**Movement Algorithm:**
```
Current Position (x1, y1)
          ↓
Bezier Curve Calculation
  - Control points
  - 30-50 steps
  - Easing function
          ↓
Path with Random Noise
  - ±5px offset per step
  - Variable timing
          ↓
Target Position (x2, y2)
```

#### 3.3 TLS Fingerprinting

**Location:** `src/core/tls-fingerprint.ts`

**Profiles:**
- Chrome 120/119
- Firefox 120
- Safari 17

**Components:**
- Cipher suites
- TLS extensions
- Supported groups
- Signature algorithms
- ALPN protocols

---

### 4. Detection Systems

#### 4.1 Bot Detection Analyzer

**Location:** `src/core/detection.ts`

**Detection Methods:**

```
Page Load
    ↓
Analyze DOM
    ├─ Search for Cloudflare elements
    ├─ Search for PerimeterX elements
    ├─ Search for DataDome elements
    ├─ Search for CAPTCHA elements
    └─ Search for generic blocks
    ↓
Check JavaScript
    ├─ Script sources
    └─ Script content
    ↓
Check Cookies
    ├─ Protection cookies
    └─ Tracking cookies
    ↓
Return Detection[]
```

**Detection Types:**
- `captcha` - CAPTCHA challenge
- `challenge` - JavaScript challenge
- `block` - Access denied
- `rate-limit` - Rate limiting
- `fingerprint` - Fingerprinting attempt

#### 4.2 Vulnerability Reporter

**Location:** `src/core/vulnerability-reporter.ts`

**Report Generation:**
```
Detection Data
    ↓
Analyze Patterns
    ├─ Group by type
    ├─ Calculate severity
    └─ Identify gaps
    ↓
Generate Vulnerabilities
    ├─ Title & description
    ├─ Evidence collection
    ├─ CVSS scoring
    └─ Recommendations
    ↓
Output Report
    ├─ JSON format
    └─ Markdown format
```

---

### 5. Advanced Features

#### 5.1 Distributed Queue

**Location:** `src/core/distributed-queue.ts`

**Architecture:**
```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  Client 1   │      │  Client 2   │      │  Client N   │
│ addTask()   │      │ addTask()   │      │ addTask()   │
└──────┬──────┘      └──────┬──────┘      └──────┬──────┘
       │                    │                    │
       └────────────────────┼────────────────────┘
                            ↓
                     ┌─────────────┐
                     │    Redis    │
                     │ (BullMQ)    │
                     └──────┬──────┘
                            │
       ┌────────────────────┼────────────────────┐
       ↓                    ↓                    ↓
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  Worker 1   │      │  Worker 2   │      │  Worker N   │
│ (Process)   │      │ (Process)   │      │ (Machine 2) │
└─────────────┘      └─────────────┘      └─────────────┘
```

**Features:**
- Horizontal scaling
- Job priorities
- Retry strategies
- Progress tracking
- Event monitoring

**Use Cases:**
- Large-scale testing (1000s of URLs)
- Distributed across multiple machines
- Background job processing

#### 5.2 Rate Limiter

**Location:** `src/core/rate-limiter.ts`

**Multi-Tier Limiting:**
```
Request
    ↓
Check Per-Second Limit (e.g., 2 req/s)
    ↓ Pass
Check Per-Minute Limit (e.g., 60 req/m)
    ↓ Pass
Check Per-Hour Limit (e.g., 1000 req/h)
    ↓ Pass
Check Concurrent Limit (e.g., 5 concurrent)
    ↓ Pass
Check Backoff Status
    ↓ Not in backoff
Allow Request
```

**Backoff Strategy:**
```
Detection
    ↓
Trigger Backoff
    ↓
Wait = 1s
    ↓
If detected again: Wait = 2s
    ↓
If detected again: Wait = 4s
    ↓
...up to max (60s)
```

#### 5.3 Monitoring System

**Location:** `src/core/monitoring.ts`

**Metrics Collection:**
```
Request → Log → Store in Memory (max 10k)
                        ↓
              Calculate Metrics
                ├─ Success rate
                ├─ Detection rate
                ├─ Response times
                └─ Trends
                        ↓
              Health Checks
                ├─ Compare to thresholds
                └─ Generate alerts
                        ↓
              Export
                ├─ JSON report
                └─ Text report
```

---

## Data Flow Examples

### Security Test Flow

```
1. User calls testSecurity()
        ↓
2. StealthScraper creates session
        ↓
3. SessionManager
        ├─ Launches browser
        ├─ Generates fingerprint
        ├─ Assigns proxy
        └─ Creates context
        ↓
4. For each attempt:
        ├─ Navigate to URL
        ├─ Apply behavior simulation
        ├─ Analyze for detections
        └─ Log results
        ↓
5. VulnerabilityReporter
        ├─ Analyze all detections
        ├─ Generate vulnerabilities
        ├─ Calculate severity
        └─ Create recommendations
        ↓
6. Return report
```

### Distributed Scraping Flow

```
1. Client adds tasks to queue
        ↓
2. Redis stores tasks
        ↓
3. Workers pull tasks
        ├─ Worker 1 processes Task A
        ├─ Worker 2 processes Task B
        └─ Worker N processes Task Z
        ↓
4. Each worker:
        ├─ Creates StealthScraper
        ├─ Executes task
        ├─ Reports progress
        └─ Returns result
        ↓
5. Results stored in Redis
        ↓
6. Client retrieves results
```

---

## Scalability

### Vertical Scaling

**Single Machine:**
- Increase `maxConcurrentBrowsers`
- Increase `maxConcurrentTabs`
- More RAM for browser instances
- Faster CPU for JavaScript execution

**Limits:**
- ~20-30 browser instances per 16GB RAM
- ~100 tabs across instances
- CPU becomes bottleneck for heavy JS sites

### Horizontal Scaling

**Multiple Machines:**
- Deploy workers on multiple servers
- All connect to central Redis
- Load automatically distributes
- No code changes required

**Architecture:**
```
┌──────────┐      ┌──────────┐      ┌──────────┐
│ Server 1 │      │ Server 2 │      │ Server N │
│ 5 workers│      │ 5 workers│      │ 5 workers│
└────┬─────┘      └────┬─────┘      └────┬─────┘
     │                 │                 │
     └─────────────────┼─────────────────┘
                       ↓
               ┌───────────────┐
               │ Redis Cluster │
               └───────────────┘
```

**Benefits:**
- Linear scaling
- Fault tolerance
- Geographic distribution

---

## Performance Considerations

### Memory Usage

**Per Browser Instance:**
- ~100-300MB base
- +50-100MB per tab
- +memory for rendered content

**Optimization:**
- Close unused tabs
- Limit concurrent browsers
- Enable session rotation

### CPU Usage

**Main Consumers:**
- JavaScript execution in pages
- Image/video rendering
- Fingerprint generation (minimal)
- Behavior simulation (minimal)

**Optimization:**
- Disable images when not needed
- Use headless mode
- Distribute across cores

### Network

**Bandwidth:**
- ~1-5MB per page load
- +images, videos, fonts
- Screenshots increase bandwidth

**Optimization:**
- Block unnecessary resources
- Use compression
- Minimize screenshot frequency

---

## Security Considerations

### Isolation

- Each session is isolated
- No data shared between sessions
- Clean fingerprint per session
- Separate cookie stores

### Resource Cleanup

- Automatic cleanup on timeout
- Manual cleanup via `cleanup()`
- Session pooling prevents leaks
- Redis connection management

### Secrets Management

- Never log sensitive data
- Proxy credentials in memory only
- No persistent storage of credentials
- Environment variables for config

---

## Extensibility

### Custom Evasion Techniques

```typescript
class CustomFingerprint extends FingerprintGenerator {
  async customEvasion(context: BrowserContext) {
    await context.addInitScript(() => {
      // Your custom evasion
    });
  }
}
```

### Custom Detection

```typescript
class CustomDetector extends BotDetectionAnalyzer {
  async detectCustomProtection(page: Page): Promise<Detection | null> {
    // Your detection logic
    return null;
  }
}
```

### Custom Behavior

```typescript
class CustomBehavior extends HumanBehaviorSimulator {
  async customAction(page: Page) {
    // Your behavior simulation
  }
}
```

---

## Monitoring & Observability

### Metrics

- Request success/failure rates
- Detection rates by type
- Response time percentiles
- Proxy success rates
- Session lifetimes

### Logs

- Structured logging (Pino)
- Log levels (debug, info, warn, error)
- Correlation IDs for tracing
- JSON output for parsing

### Alerts

- Health check failures
- High detection rates
- Slow response times
- Proxy failures

---

## Deployment Patterns

### Single Instance

```
User → StealthScraper → Browser
```

**Use:** Testing, development, small-scale

### Worker Pool

```
Tasks → Queue → Worker 1
              → Worker 2
              → Worker N
```

**Use:** Production, medium-scale (100s-1000s URLs)

### Distributed Cluster

```
Client → Redis → Worker Pool 1 (Server 1)
               → Worker Pool 2 (Server 2)
               → Worker Pool N (Server N)
```

**Use:** Large-scale (10,000s URLs), high availability

---

## Future Architecture

### Planned Enhancements

1. **Machine Learning Integration**
   - ML-based detection prediction
   - Adaptive evasion strategies
   - Pattern learning

2. **Real-Time Dashboard**
   - WebSocket metrics streaming
   - Live scraping visualization
   - Alert management UI

3. **Plugin System**
   - Custom evasion plugins
   - Custom detection plugins
   - Community marketplace

4. **Cloud Integration**
   - AWS/GCP/Azure deployment templates
   - Serverless function support
   - Managed Redis integration

---

**Questions?** See [API.md](API.md) or open an issue.
