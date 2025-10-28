/**
 * Proxy Rotation Example
 *
 * This example demonstrates how to use proxy rotation
 * for distributed scraping and IP-based detection evasion.
 */

import { StealthScraper, ProxyManager } from '../src/index.js';
import { writeFile } from 'fs/promises';

async function main() {
  // Example 1: Create proxy list programmatically
  console.log('=== Example 1: Programmatic Proxy Setup ===\n');

  const proxies = [
    {
      type: 'http' as const,
      host: 'proxy1.example.com',
      port: 8080,
      username: 'user1',
      password: 'pass1',
      country: 'US',
      isResidential: true,
    },
    {
      type: 'http' as const,
      host: 'proxy2.example.com',
      port: 8080,
      username: 'user2',
      password: 'pass2',
      country: 'UK',
      isResidential: false,
    },
  ];

  const scraper = new StealthScraper({
    network: {
      proxyEnabled: true,
      proxyList: proxies,
      proxyRotationInterval: 60000, // Rotate every 60 seconds
      maxRetries: 3,
      timeout: 30000,
      customHeaders: {},
      headerOrder: [],
      tlsFingerprint: null,
      http2Enabled: true,
    },
  });

  try {
    const report = await scraper.testSecurity('https://your-website.com', {
      attempts: 5,
      useProxies: true,
      simulateHumanBehavior: true,
    });

    console.log('Test completed with proxy rotation');
    console.log(`Bypass success: ${report.bypassSuccess}`);
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await scraper.cleanup();
  }

  // Example 2: Load proxies from file
  console.log('\n=== Example 2: Load Proxies from File ===\n');

  // First, create a sample proxy file
  const proxyFileContent = `
proxy1.example.com:8080@user1:pass1
proxy2.example.com:8080@user2:pass2
192.168.1.100:3128
  `.trim();

  await writeFile('./examples/proxies-example.txt', proxyFileContent);

  try {
    const loadedProxies = await ProxyManager.loadFromFile('./examples/proxies-example.txt');
    console.log(`Loaded ${loadedProxies.length} proxies from file`);

    const proxyManager = new ProxyManager(loadedProxies);

    // Get proxy stats
    const stats = proxyManager.getStats();
    console.log('\nProxy Statistics:');
    console.log(`Total: ${stats.total}`);
    console.log(`Residential: ${stats.residential}`);
    console.log(`Datacenter: ${stats.datacenter}`);

    // Get specific proxy types
    const residentialProxy = proxyManager.getResidentialProxy();
    if (residentialProxy) {
      console.log(`\nGot residential proxy: ${residentialProxy.host}:${residentialProxy.port}`);
    }

    const bestProxy = proxyManager.getBestProxy();
    console.log(`Best performing proxy: ${bestProxy?.host}:${bestProxy?.port}`);

  } catch (error) {
    console.error('Failed to load proxies:', error);
  }

  // Example 3: Test proxies
  console.log('\n=== Example 3: Test Proxy Connections ===\n');

  const testProxies = [
    {
      type: 'http' as const,
      host: 'proxy.example.com',
      port: 8080,
    },
  ];

  const proxyManager = new ProxyManager(testProxies);

  for (const proxy of testProxies) {
    console.log(`Testing ${proxy.host}:${proxy.port}...`);
    const isWorking = await proxyManager.testProxy(proxy);
    console.log(`Result: ${isWorking ? 'Working ✓' : 'Failed ✗'}`);
  }

  // Example 4: Country-specific proxies
  console.log('\n=== Example 4: Country-Specific Proxies ===\n');

  const geoProxies = [
    {
      type: 'http' as const,
      host: 'us-proxy.example.com',
      port: 8080,
      country: 'US',
      isResidential: true,
    },
    {
      type: 'http' as const,
      host: 'uk-proxy.example.com',
      port: 8080,
      country: 'UK',
      isResidential: true,
    },
    {
      type: 'http' as const,
      host: 'de-proxy.example.com',
      port: 8080,
      country: 'DE',
      isResidential: true,
    },
  ];

  const geoProxyManager = new ProxyManager(geoProxies);

  // Get proxy for specific country
  const usProxy = geoProxyManager.getProxyByCountry('US');
  if (usProxy) {
    console.log(`US Proxy: ${usProxy.host} (${usProxy.country})`);
  }

  const ukProxy = geoProxyManager.getProxyByCountry('UK');
  if (ukProxy) {
    console.log(`UK Proxy: ${ukProxy.host} (${ukProxy.country})`);
  }

  console.log('\nAll proxy examples completed!');
}

main();
