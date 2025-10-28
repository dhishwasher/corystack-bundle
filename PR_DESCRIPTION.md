# 🔒 Advanced Stealth Scraper for Security Testing

## Overview

This PR introduces a **production-grade stealth web scraper framework** specifically designed for testing your own website's bot detection and security measures. This is a defensive security tool that helps identify vulnerabilities in your anti-bot infrastructure.

## ⚠️ Important Legal Notice

**This tool is ONLY for:**
- Testing websites and applications you own
- Authorized security assessments with written permission
- Educational purposes in controlled environments
- Legitimate penetration testing engagements

## 🎯 Key Features

### Advanced Evasion Techniques

- **Browser Fingerprint Randomization**
  - Canvas fingerprinting evasion with noise injection
  - WebGL renderer and vendor spoofing
  - Audio context fingerprint randomization
  - Font enumeration protection
  - Hardware concurrency & device memory spoofing

- **Automation Detection Bypass**
  - WebDriver property removal
  - Chrome DevTools Protocol hiding
  - Navigator properties spoofing
  - Plugin and permission spoofing
  - WebRTC leak prevention

- **Human Behavior Simulation**
  - Bezier curve mouse movements
  - Natural typing patterns with mistakes
  - Realistic scroll behavior
  - Random page dwell time
  - Mouse jiggle and hover patterns

- **Network-Level Evasion**
  - Proxy rotation (HTTP/SOCKS5/Residential)
  - IP geolocation selection by country
  - Custom header ordering
  - Success rate tracking per proxy

### Bot Detection Analysis

Detects and reports on:
- ✅ Cloudflare protection
- ✅ PerimeterX challenges
- ✅ DataDome protection
- ✅ Google reCAPTCHA
- ✅ hCaptcha
- ✅ Rate limiting
- ✅ IP blocks
- ✅ Generic bot challenges

### Security Assessment & Reporting

- **Vulnerability Reports** - Detailed JSON and Markdown reports
- **CVSS Scoring** - Industry-standard vulnerability severity scoring
- **Actionable Recommendations** - Specific steps to improve security
- **Detection Rate Analysis** - Measure effectiveness of defenses
- **Evidence Collection** - Screenshots and detailed detection logs

## 📦 Architecture

```
src/
├── core/
│   ├── stealth-scraper.ts       # Main scraper engine
│   ├── fingerprint.ts           # Browser fingerprint randomization
│   ├── behavior.ts              # Human behavior simulation
│   ├── detection.ts             # Bot detection analysis
│   ├── proxy-manager.ts         # Proxy rotation with tracking
│   ├── session-manager.ts       # Session isolation & management
│   └── vulnerability-reporter.ts # Detailed security reporting
├── types/index.ts               # TypeScript type definitions
├── config/default.ts            # Default configuration
├── cli.ts                       # CLI interface
└── index.ts                     # Public API exports

examples/
├── basic-test.ts                # Simple security test example
├── advanced-scraping.ts         # Advanced usage examples
└── with-proxies.ts              # Proxy rotation examples
```

## 🚀 Usage

### CLI Commands

```bash
# Install dependencies
npm install
npx playwright install chromium

# Build project
npm run build

# Test your website security
npm run start -- test https://your-website.com --attempts 10 --human-behavior

# Stress test infrastructure
npm run start -- stress https://your-website.com --concurrent 10 --requests 20

# Scrape data (your own sites only)
npm run start -- scrape https://your-website.com --selector "h1" --output data.json
```

### Programmatic API

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

const report = await scraper.testSecurity('https://your-site.com', {
  attempts: 5,
  useProxies: true,
  simulateHumanBehavior: true,
});

console.log(`Vulnerabilities found: ${report.vulnerabilities.length}`);
console.log(`Bypass successful: ${report.bypassSuccess}`);

await scraper.cleanup();
```

## 📊 Example Output

```
═══════════════════════════════════════════════════════
  SECURITY VULNERABILITY ASSESSMENT REPORT
═══════════════════════════════════════════════════════

Target: https://your-website.com
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
```

## 🧪 Technical Implementation

### Core Technologies

- **Playwright** - Headless browser automation
- **TypeScript** - Type-safe development
- **BullMQ/Redis** - Distributed task queuing (ready for scaling)
- **Pino** - High-performance logging
- **Commander** - CLI framework
- **Chalk/Ora** - Beautiful terminal output

### Evasion Techniques Implemented

1. **Canvas Fingerprinting Evasion**
   - Noise injection into canvas data
   - Randomized getImageData responses

2. **WebGL Fingerprinting Evasion**
   - Vendor/renderer spoofing
   - Parameter randomization

3. **Audio Context Evasion**
   - Gain manipulation for fingerprint variation

4. **Navigator Object Spoofing**
   - Platform, vendor, plugins
   - Hardware concurrency, device memory
   - Languages and timezone

5. **Human Behavior Simulation**
   - Bezier curve calculations for realistic mouse paths
   - Variable typing speed with natural errors
   - Scroll patterns with reading pauses
   - Random idle time with micro-movements

## 🔒 Security & Compliance

### Built-in Safeguards

- Clear legal warnings in README and code comments
- Intended use documentation
- No credential harvesting features
- No malicious payload capabilities
- Transparent reporting only

### Recommended Use Cases

✅ **Legitimate:**
- Testing your own website's bot detection
- Authorized penetration testing
- Security research with permission
- Improving your anti-bot defenses

❌ **Prohibited:**
- Testing sites you don't own
- Bypassing protections without authorization
- Data harvesting from third parties
- Any illegal activity

## 📈 Future Enhancements (Planned)

- [ ] TLS fingerprinting evasion
- [ ] Machine learning-based detection
- [ ] Real-time monitoring dashboard
- [ ] Multi-region distributed scraping
- [ ] Advanced CAPTCHA solving integration
- [ ] Browser extension detection bypass
- [ ] Mobile device emulation

## 🧪 Testing

Build verification:
```bash
npm run build   # ✅ Compiles successfully
node test-basic.js  # ✅ Basic imports and initialization
```

Full test suite coming in follow-up PR.

## 📝 Documentation

Comprehensive documentation includes:
- Full README with installation, usage, examples
- API documentation in TypeScript types
- Example scripts for common use cases
- Configuration guide
- Legal notices and disclaimers

## 🤝 Contributing

Contributions welcome for:
- New evasion techniques (for testing purposes)
- Additional bot detection signatures
- Vulnerability analysis improvements
- Documentation enhancements

---

## Checklist

- [x] Code compiles without errors
- [x] All dependencies resolved
- [x] TypeScript types complete
- [x] README documentation
- [x] Example scripts
- [x] Legal notices included
- [x] CLI interface functional
- [x] Programmatic API exported
- [ ] Unit tests (follow-up PR)
- [ ] Integration tests (follow-up PR)

## Breaking Changes

None - this is the initial implementation.

## Migration Guide

N/A - initial release

---

**⚠️ Important:** This is a security research and testing tool. Use responsibly and only on systems you own or have explicit permission to test.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
