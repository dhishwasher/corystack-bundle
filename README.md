# CoryStack Stealth Scraper

> **⚠️ SECURITY TESTING TOOL - FOR TESTING YOUR OWN INFRASTRUCTURE ONLY**

An advanced stealth web scraper designed for **security testing and vulnerability assessment** of your own websites and applications. This tool helps identify weaknesses in your anti-bot defenses by simulating sophisticated scraping attacks.

## 🎯 Purpose

This tool is designed to:
- **Test your own websites** for bot detection vulnerabilities
- **Identify weak spots** in your anti-bot security measures
- **Generate detailed vulnerability reports** with actionable recommendations
- **Stress test** your infrastructure's ability to handle automated traffic
- **Improve your security posture** through offensive security testing

## ⚖️ Legal Notice

**IMPORTANT:** This tool is intended ONLY for:
- Testing websites and applications you own
- Security assessments with explicit written permission
- Educational purposes in controlled environments
- Penetration testing engagements with proper authorization

Unauthorized use of this tool against websites you do not own or have permission to test is **illegal** and **unethical**. The authors assume no liability for misuse.

## 🚀 Features

### Advanced Evasion Techniques

- **Browser Fingerprint Randomization**
  - Canvas fingerprinting evasion with noise injection
  - WebGL renderer and vendor spoofing
  - Audio context fingerprint randomization
  - Font enumeration protection
  - Hardware specs spoofing (CPU cores, memory)

- **Automation Detection Bypass**
  - WebDriver property removal
  - Chrome DevTools Protocol hiding
  - Navigator properties spoofing
  - Plugin and permission spoofing

- **Human Behavior Simulation**
  - Bezier curve mouse movements
  - Natural typing patterns with mistakes
  - Realistic scroll behavior
  - Random page dwell time
  - Mouse jiggle and hover patterns

- **Network-Level Evasion**
  - Proxy rotation (HTTP/SOCKS5/Residential)
  - IP geolocation selection
  - TLS fingerprinting considerations
  - Custom header ordering

### Detection Capabilities

The scraper can detect:
- ✅ Cloudflare protection
- ✅ PerimeterX challenges
- ✅ DataDome protection
- ✅ Google reCAPTCHA
- ✅ hCaptcha
- ✅ Rate limiting
- ✅ IP blocks
- ✅ Generic bot challenges

### Security Assessment

- **Vulnerability Reports** - Detailed JSON and Markdown reports
- **CVSS Scoring** - Industry-standard vulnerability scoring
- **Actionable Recommendations** - Specific steps to improve security
- **Detection Rate Analysis** - Measure effectiveness of your defenses

## 📦 Installation

### Prerequisites

- Node.js >= 18.0.0
- TypeScript
- Playwright (installed automatically)

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd corystack-bundle

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium

# Build the project
npm run build

# Copy environment configuration
cp .env.example .env
```

### Configuration

Edit `.env` file:

```env
# Proxy Configuration
PROXY_ENABLED=false
PROXY_LIST_FILE=./proxies.txt

# Scraper Configuration
MAX_CONCURRENT_BROWSERS=5
DEFAULT_TIMEOUT=30000

# Stealth Features
FINGERPRINT_RANDOMIZATION=true
HUMAN_MOUSE_MOVEMENTS=true
CANVAS_NOISE=true

# Logging
LOG_LEVEL=info
LOG_DIR=./logs
VULNERABILITY_REPORT_DIR=./reports
```

## 🎮 Usage

### CLI Commands

#### Security Testing

Test your website for bot detection vulnerabilities:

```bash
# Basic security test
npm run start -- test https://your-website.com

# Advanced test with proxies and multiple attempts
npm run start -- test https://your-website.com \
  --attempts 10 \
  --use-proxies \
  --human-behavior \
  --output ./reports
```

**Options:**
- `-a, --attempts <number>` - Number of test attempts (default: 5)
- `-p, --use-proxies` - Enable proxy rotation
- `-b, --human-behavior` - Simulate human behavior patterns
- `-o, --output <path>` - Output directory for reports

**Example Output:**

```
═══════════════════════════════════════════════════════
  SECURITY VULNERABILITY ASSESSMENT REPORT
═══════════════════════════════════════════════════════

Target: https://your-website.com
Session ID: 550e8400-e29b-41d4-a716-446655440000
Bypass Success: ✅ YES (VULNERABLE)
Detection Rate: 0.00%
Vulnerabilities Found: 1

Vulnerabilities:

┌──────────┬─────────────────┬──────────────────────────────────┐
│ Severity │ Category        │ Title                            │
├──────────┼─────────────────┼──────────────────────────────────┤
│ CRITICAL │ Bot Detection   │ No Bot Detection Mechanisms Found│
└──────────┴─────────────────┴──────────────────────────────────┘

Top Recommendations:

1. URGENT: Implement basic bot detection mechanisms immediately
2. Deploy a Web Application Firewall (WAF) with bot protection
3. Enable rate limiting on all API endpoints
4. Implement browser fingerprinting (Canvas, WebGL, Audio)
5. Deploy behavioral analysis to detect non-human patterns

✓ Full report saved to: ./reports
```

#### Stress Testing

Stress test your infrastructure with concurrent sessions:

```bash
npm run start -- stress https://your-website.com \
  --concurrent 10 \
  --requests 20 \
  --use-proxies
```

**Options:**
- `-c, --concurrent <number>` - Concurrent sessions (default: 5)
- `-r, --requests <number>` - Requests per session (default: 10)
- `-p, --use-proxies` - Enable proxy rotation

#### Scraping

Execute a scraping task (for your own sites):

```bash
npm run start -- scrape https://your-website.com \
  --selector "h1.title" \
  --output data.json \
  --human-behavior
```

**Options:**
- `-s, --selector <selector>` - CSS selector to extract
- `-o, --output <file>` - Output file for data
- `-p, --use-proxies` - Enable proxy rotation
- `-b, --human-behavior` - Simulate human behavior

### Programmatic Usage

#### Basic Security Test

```typescript
import { StealthScraper } from 'corystack-stealth-scraper';

const scraper = new StealthScraper({
  fingerprint: {
    randomizeCanvas: true,
    randomizeWebGL: true,
    hideWebDriver: true,
  },
  behavior: {
    humanMouseMovements: true,
    randomScrolling: true,
  },
});

const report = await scraper.testSecurity('https://your-website.com', {
  attempts: 5,
  useProxies: false,
  simulateHumanBehavior: true,
});

console.log(`Bypass Success: ${report.bypassSuccess}`);
console.log(`Vulnerabilities: ${report.vulnerabilities.length}`);

await scraper.cleanup();
```

#### Custom Scraping Task

```typescript
import { StealthScraper } from 'corystack-stealth-scraper';

const scraper = new StealthScraper();

const task = {
  id: 'custom-task',
  url: 'https://your-website.com',
  method: 'GET',
  actions: [
    { type: 'click', selector: '#accept-cookies', humanLike: true },
    { type: 'scroll', humanLike: true },
    { type: 'wait', duration: 2000 },
  ],
  extractors: [
    {
      name: 'title',
      selector: 'h1',
      type: 'text',
    },
    {
      name: 'links',
      selector: 'a',
      type: 'multiple',
    },
  ],
  priority: 1,
  retries: 0,
  maxRetries: 3,
};

const result = await scraper.executeTask(task);
console.log(result.data);

await scraper.cleanup();
```

#### With Proxy Rotation

```typescript
import { StealthScraper, ProxyManager } from 'corystack-stealth-scraper';

const proxies = await ProxyManager.loadFromFile('./proxies.txt');

const scraper = new StealthScraper({
  network: {
    proxyEnabled: true,
    proxyList: proxies,
    proxyRotationInterval: 60000, // Rotate every 60s
  },
});

// Your scraping code here
```

## 📋 Proxy List Format

Create a `proxies.txt` file with one proxy per line:

```
host:port
host:port@username:password
```

Example:

```
proxy1.example.com:8080
proxy2.example.com:8080@user:pass
192.168.1.100:3128
```

## 🛡️ Understanding Vulnerability Reports

Reports include:

### Severity Levels

- **Critical** - No protection detected, immediate action required
- **High** - Significant weaknesses, easily bypassed
- **Medium** - Some protection but with known bypass methods
- **Low** - Good protection with minor improvements needed
- **Info** - Informational findings

### Common Vulnerabilities

1. **No Bot Detection Mechanisms Found**
   - **Severity:** Critical
   - **Impact:** Complete bypass possible
   - **Fix:** Implement WAF, rate limiting, fingerprinting

2. **IP/Browser Blocking Detected**
   - **Severity:** High
   - **Impact:** Basic protection but vulnerable to proxies
   - **Fix:** Add behavioral analysis and device fingerprinting

3. **CAPTCHA Challenge Triggered**
   - **Severity:** Medium
   - **Impact:** Reliance on CAPTCHA alone
   - **Fix:** Combine with fingerprinting for early detection

## 🔧 Advanced Configuration

### Complete Config Example

```typescript
import { StealthScraper, StealthConfig } from 'corystack-stealth-scraper';

const config: StealthConfig = {
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
    proxyEnabled: true,
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

const scraper = new StealthScraper(config);
```

## 📊 Metrics and Monitoring

Get real-time metrics:

```typescript
const metrics = scraper.getMetrics();

console.log(`Total Requests: ${metrics.totalRequests}`);
console.log(`Success Rate: ${(metrics.successfulRequests / metrics.totalRequests * 100).toFixed(2)}%`);
console.log(`CAPTCHA Detections: ${metrics.captchaDetections}`);
console.log(`Block Detections: ${metrics.blockDetections}`);
```

## 🧪 Testing Your Defenses

### Recommended Testing Methodology

1. **Baseline Test** - Test without any evasion techniques
2. **Fingerprint Test** - Enable fingerprint randomization
3. **Behavior Test** - Add human behavior simulation
4. **Proxy Test** - Add proxy rotation
5. **Full Test** - All techniques combined

```bash
# Test 1: Baseline
npm run start -- test https://your-site.com --attempts 5

# Test 2: With fingerprinting
FINGERPRINT_RANDOMIZATION=true npm run start -- test https://your-site.com

# Test 3: With behavior
npm run start -- test https://your-site.com --human-behavior

# Test 4: With proxies
npm run start -- test https://your-site.com --use-proxies

# Test 5: Full stealth
npm run start -- test https://your-site.com --use-proxies --human-behavior --attempts 10
```

## 🔒 Security Best Practices

Based on testing results, implement:

### Essential Defenses

1. **Web Application Firewall (WAF)**
   - Cloudflare
   - AWS WAF
   - Imperva

2. **Bot Management Solutions**
   - PerimeterX
   - DataDome
   - Kasada

3. **Rate Limiting**
   - Per-IP limits
   - Per-session limits
   - Distributed rate limiting

4. **Fingerprinting**
   - Canvas fingerprinting
   - WebGL fingerprinting
   - TLS fingerprinting
   - Device fingerprinting

5. **Behavioral Analysis**
   - Mouse movement patterns
   - Typing patterns
   - Click patterns
   - Navigation patterns

## 🤝 Contributing

This is a security research tool. Contributions are welcome for:
- New evasion techniques (for testing)
- Detection methods
- Vulnerability analysis
- Documentation improvements

## 📄 License

MIT License - See LICENSE file for details

## ⚠️ Disclaimer

This tool is provided for educational and authorized security testing purposes only. The developers:
- Do NOT condone illegal activity
- Are NOT responsible for misuse
- Provide NO warranty or guarantee
- Recommend using ONLY on systems you own or have permission to test

## 🙏 Acknowledgments

Built with:
- Playwright - Browser automation
- TypeScript - Type-safe development
- Various stealth techniques from security research community

---

**Remember:** Use this tool responsibly and ethically. Always obtain proper authorization before testing any system you don't own.
