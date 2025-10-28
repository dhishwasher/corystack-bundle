# Security Testing Guide

## Overview

This guide helps you effectively use the CoryStack Stealth Scraper to test and improve your website's bot detection security.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Testing Methodology](#testing-methodology)
3. [Interpreting Results](#interpreting-results)
4. [Common Vulnerabilities](#common-vulnerabilities)
5. [Recommended Defenses](#recommended-defenses)
6. [Best Practices](#best-practices)

---

## Getting Started

### Prerequisites

- Node.js >= 18
- Your own website or explicit testing permission
- Basic understanding of web security
- Optional: Redis for distributed testing

### Quick Start

```bash
# Install
npm install
npx playwright install chromium
npm run build

# Run basic test
npm run start -- test https://your-website.com
```

---

## Testing Methodology

### Phase 1: Baseline Assessment

**Objective:** Establish baseline without advanced evasion

```bash
npm run start -- test https://your-site.com \
  --attempts 3 \
  --output ./reports/baseline
```

**What to check:**
- Are requests blocked immediately?
- Is CAPTCHA presented?
- What detection methods are used?

### Phase 2: Fingerprint Testing

**Objective:** Test browser fingerprint detection

```typescript
import { StealthScraper } from 'corystack-stealth-scraper';

const scraper = new StealthScraper({
  fingerprint: {
    randomizeCanvas: true,
    randomizeWebGL: true,
    randomizeAudioContext: true,
    hideWebDriver: true,
  },
});

const report = await scraper.testSecurity('https://your-site.com', {
  attempts: 5,
});
```

**What to check:**
- Does fingerprint randomization bypass detection?
- Which fingerprinting techniques detected you?

### Phase 3: Behavior Testing

**Objective:** Test behavioral analysis

```typescript
const scraper = new StealthScraper({
  fingerprint: { ...allEnabled },
  behavior: {
    humanMouseMovements: true,
    randomScrolling: true,
    naturalErrors: true,
    randomPageDwell: true,
  },
});
```

**What to check:**
- Does human behavior simulation help?
- Are mouse/keyboard patterns analyzed?

### Phase 4: Network Testing

**Objective:** Test IP-based detection

```bash
npm run start -- test https://your-site.com \
  --use-proxies \
  --attempts 10
```

**What to check:**
- Does IP rotation bypass blocks?
- Is geolocation checked?
- Are proxy IPs blacklisted?

### Phase 5: Stress Testing

**Objective:** Find rate limit thresholds

```bash
npm run start -- stress https://your-site.com \
  --concurrent 10 \
  --requests 20
```

**What to check:**
- At what point does rate limiting kick in?
- Are limits per-IP, per-session, or global?
- How aggressive is the limiting?

### Phase 6: Full Evasion Testing

**Objective:** Maximum stealth configuration

```typescript
const scraper = new StealthScraper({
  fingerprint: {
    // All options enabled
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
    // All human simulation
    humanMouseMovements: true,
    randomScrolling: true,
    randomClicks: false,
    typingDelay: { min: 50, max: 200 },
    pageLoadDelay: { min: 2000, max: 5000 },
    naturalErrors: true,
    randomPageDwell: true,
  },
  network: {
    proxyEnabled: true,
    // Your proxy list
  },
});
```

**What to check:**
- Can full evasion bypass your defenses?
- What's the success rate?

---

## Interpreting Results

### Vulnerability Report Structure

```json
{
  "bypassSuccess": false,
  "detectionRate": 0.60,
  "vulnerabilities": [
    {
      "severity": "medium",
      "category": "Bot Detection",
      "title": "CAPTCHA Challenge Triggered",
      "description": "...",
      "recommendation": "..."
    }
  ],
  "recommendations": [...]
}
```

### Severity Levels

#### Critical
- **Bypass Success: YES**
- **Detection Rate: 0-20%**
- **Meaning:** Major security gap

**Action:** Immediate remediation required

#### High
- **Bypass Success: YES**
- **Detection Rate: 20-50%**
- **Meaning:** Significant weakness

**Action:** High-priority fixes needed

#### Medium
- **Bypass Success: NO**
- **Detection Rate: 50-80%**
- **Meaning:** Some protection but improvable

**Action:** Implement recommendations

#### Low
- **Bypass Success: NO**
- **Detection Rate: 80-100%**
- **Meaning:** Strong protection

**Action:** Minor improvements suggested

### Key Metrics

**Detection Rate:**
- Percentage of requests that triggered bot detection
- Higher = better protection
- Aim for >80%

**Bypass Success:**
- Did the scraper complete its task without blocks?
- False = good (blocked)
- True = bad (bypassed)

**Vulnerability Count:**
- Number of identified weaknesses
- Focus on critical/high first

---

## Common Vulnerabilities

### 1. No Bot Detection

**Symptoms:**
- 100% success rate
- No CAPTCHAs, no blocks
- Zero detections

**Risk:** CRITICAL

**Fix:**
1. Implement WAF (Cloudflare, AWS WAF)
2. Add rate limiting
3. Deploy bot detection service

### 2. Weak Fingerprinting

**Symptoms:**
- Basic fingerprinting only
- No canvas/WebGL checks
- Easy to spoof

**Risk:** HIGH

**Fix:**
1. Implement multi-layered fingerprinting
2. Canvas + WebGL + Audio
3. Consistency checks across attributes

### 3. IP-Only Blocking

**Symptoms:**
- Blocks by IP address only
- Proxy rotation bypasses completely

**Risk:** HIGH

**Fix:**
1. Add device fingerprinting
2. Track behavior patterns
3. Use browser fingerprints

### 4. Predictable Rate Limits

**Symptoms:**
- Fixed rate limits (e.g., exactly 60/min)
- No progressive throttling
- No behavioral analysis

**Risk:** MEDIUM

**Fix:**
1. Implement dynamic rate limits
2. Add behavioral scoring
3. Progressive throttling

### 5. CAPTCHA-Only Defense

**Symptoms:**
- Only defense is CAPTCHA
- No pre-CAPTCHA filtering
- All suspicious traffic gets CAPTCHA

**Risk:** MEDIUM

**Fix:**
1. Add fingerprinting before CAPTCHA
2. Challenge only high-risk requests
3. Use multiple challenge types

### 6. Client-Side Checks Only

**Symptoms:**
- Detection logic in JavaScript
- No server-side validation
- Easy to bypass in headless browser

**Risk:** HIGH

**Fix:**
1. Move checks to server-side
2. Validate all inputs
3. Use server-side fingerprinting

---

## Recommended Defenses

### Tier 1: Essential (Critical Priority)

#### 1. Web Application Firewall

**Options:**
- Cloudflare
- AWS WAF
- Imperva

**Benefits:**
- DDoS protection
- Bot detection
- Rate limiting
- Geographic filtering

**Cost:** $20-200/month

#### 2. Rate Limiting

**Implementation:**
```javascript
// Server-side (Node.js example)
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);
```

**Levels:**
- Per-IP: 100 req/15min
- Per-session: 50 req/15min
- Global: Based on capacity

#### 3. CAPTCHA

**Options:**
- Google reCAPTCHA v3
- hCaptcha
- Cloudflare Turnstile

**When to use:**
- After N failed attempts
- Suspicious patterns detected
- High-risk actions (login, purchase)

### Tier 2: Strong Protection

#### 4. Browser Fingerprinting

**Implement:**
```javascript
// Client-side
import FingerprintJS from '@fingerprintjs/fingerprintjs';

const fp = await FingerprintJS.load();
const result = await fp.get();

// Send to server for validation
fetch('/api/verify', {
  method: 'POST',
  body: JSON.stringify({
    visitorId: result.visitorId,
    components: result.components,
  }),
});
```

**Server-side validation:**
- Check fingerprint consistency
- Track fingerprint changes
- Flag rapid changes as suspicious

#### 5. Behavioral Analysis

**Track:**
- Mouse movements (natural vs programmatic)
- Keystroke timing
- Scroll patterns
- Click patterns
- Navigation patterns

**Tools:**
- Custom implementation
- Bot detection services

#### 6. Device Fingerprinting

**Commercial:**
- PerimeterX
- DataDome
- Shape Security

**Benefits:**
- Track devices across sessions
- Persistent identification
- Hard to spoof

### Tier 3: Advanced Protection

#### 7. Machine Learning

**Implement:**
- Train models on normal user behavior
- Detect anomalies in real-time
- Continuous learning

**Signals:**
- Request patterns
- Timing analysis
- Behavioral anomalies

#### 8. TLS Fingerprinting

**Server-side:**
- Analyze TLS handshake
- Compare to known browser fingerprints
- Detect automation tools

**Tools:**
- JA3 fingerprinting
- Custom TLS analysis

#### 9. Honeypots

**Implementation:**
```html
<!-- Hidden field (CSS: display:none) -->
<input type="text" name="honeypot" style="display:none" />
```

**Server-side:**
```javascript
if (req.body.honeypot) {
  // Bot detected - field should be empty
  return res.status(403).send('Access denied');
}
```

---

## Best Practices

### For Security Testing

1. **Start Simple**
   - Begin with basic tests
   - Add complexity incrementally
   - Document each phase

2. **Test Regularly**
   - Schedule monthly tests
   - Test after security updates
   - Continuous monitoring

3. **Document Findings**
   - Keep reports organized
   - Track improvements over time
   - Share with team

4. **Respect Rate Limits**
   - Don't DOS your own site
   - Use gradual scaling
   - Monitor server load

### For Implementing Defenses

1. **Layer Security**
   - Multiple defenses
   - No single point of failure
   - Progressive challenges

2. **Monitor & Alert**
   - Real-time monitoring
   - Alert on anomalies
   - Regular reviews

3. **Balance UX & Security**
   - Don't block legitimate users
   - Progressive friction
   - Clear error messages

4. **Keep Updated**
   - Update detection rules
   - Patch vulnerabilities
   - Follow security news

### Red Flags

**Indicators of Poor Security:**

- ✗ 100% scraper success rate
- ✗ No CAPTCHA ever shown
- ✗ No rate limiting
- ✗ Client-side validation only
- ✗ Same fingerprint allowed repeatedly
- ✗ No logging of suspicious activity

**Indicators of Good Security:**

- ✓ <20% scraper success rate
- ✓ CAPTCHA for suspicious patterns
- ✓ Multi-tier rate limiting
- ✓ Server-side validation
- ✓ Fingerprint consistency checks
- ✓ Comprehensive logging

---

## Example Testing Workflow

### Week 1: Initial Assessment

```bash
# Day 1: Baseline
npm run start -- test https://your-site.com --attempts 5

# Day 2: With fingerprinting
# ... run with fingerprint evasion

# Day 3: With behavior
# ... run with behavior simulation

# Day 4: With proxies
# ... run with proxy rotation

# Day 5: Full evasion
# ... run with all techniques

# Review results and create action plan
```

### Week 2-4: Implement Defenses

- Deploy WAF
- Implement rate limiting
- Add fingerprinting
- Deploy CAPTCHA
- Configure monitoring

### Week 5: Retest

```bash
# Same tests as Week 1
# Compare results
# Verify improvements
```

### Ongoing: Monitor

- Weekly security reviews
- Monthly retests
- Continuous monitoring
- Update defenses as needed

---

## Compliance & Legal

### Important Reminders

1. **Only Test What You Own**
   - Your websites
   - Your applications
   - With explicit permission

2. **Document Authorization**
   - Written permission
   - Scope of testing
   - Date ranges

3. **Follow Regulations**
   - GDPR compliance
   - CCPA compliance
   - Industry regulations

4. **Responsible Disclosure**
   - If testing for client, report professionally
   - Give time to fix before disclosure
   - Follow disclosure policy

---

## Getting Help

### Resources

- [API Documentation](API.md)
- [Architecture Guide](ARCHITECTURE.md)
- [Examples](../examples/)

### Support

- GitHub Issues: Report bugs
- Discussions: Ask questions
- Security Issues: Email privately

---

**Remember:** This tool is for **defensive security testing only**. Use responsibly and ethically.
