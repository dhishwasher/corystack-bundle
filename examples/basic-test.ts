/**
 * Basic Security Test Example
 *
 * This example demonstrates how to run a basic security test
 * against your own website to identify bot detection vulnerabilities.
 */

import { StealthScraper } from '../src/index.js';

async function main() {
  // Replace with your own website URL
  const targetUrl = 'https://your-website.com';

  console.log(`Testing security of: ${targetUrl}\n`);

  // Create scraper with default configuration
  const scraper = new StealthScraper({
    fingerprint: {
      randomizeCanvas: true,
      randomizeWebGL: true,
      randomizeAudioContext: true,
      hideWebDriver: true,
      preventWebRTC: true,
    },
    behavior: {
      humanMouseMovements: true,
      randomScrolling: true,
      naturalErrors: true,
    },
    logging: {
      level: 'info',
      toFile: true,
      toConsole: true,
      logDir: './logs',
      includeScreenshots: true,
      includeHAR: false,
    },
  });

  try {
    // Run security test
    const report = await scraper.testSecurity(targetUrl, {
      attempts: 5,
      useProxies: false,
      simulateHumanBehavior: true,
    });

    // Display results
    console.log('\n=== SECURITY TEST RESULTS ===\n');
    console.log(`Bypass Success: ${report.bypassSuccess ? 'YES (VULNERABLE!)' : 'NO (Protected)'}`);
    console.log(`Detection Rate: ${(report.detectionRate * 100).toFixed(2)}%`);
    console.log(`Vulnerabilities Found: ${report.vulnerabilities.length}`);

    if (report.vulnerabilities.length > 0) {
      console.log('\nVulnerabilities:');
      report.vulnerabilities.forEach((vuln, idx) => {
        console.log(`\n${idx + 1}. [${vuln.severity.toUpperCase()}] ${vuln.title}`);
        console.log(`   ${vuln.description}`);
      });
    }

    console.log('\nTop Recommendations:');
    report.recommendations.slice(0, 5).forEach((rec, idx) => {
      console.log(`${idx + 1}. ${rec}`);
    });

    // Get metrics
    const metrics = scraper.getMetrics();
    console.log('\n=== METRICS ===\n');
    console.log(`Total Requests: ${metrics.totalRequests}`);
    console.log(`Successful: ${metrics.successfulRequests}`);
    console.log(`Failed: ${metrics.failedRequests}`);
    console.log(`CAPTCHA Detections: ${metrics.captchaDetections}`);
    console.log(`Block Detections: ${metrics.blockDetections}`);

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Clean up
    await scraper.cleanup();
  }
}

main();
