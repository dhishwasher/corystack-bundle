#!/usr/bin/env node
/**
 * Quick verification test - ensures basic imports work
 */

import { StealthScraper } from './dist/index.js';

console.log('✓ Imports successful');
console.log('✓ StealthScraper class available');

const scraper = new StealthScraper();
console.log('✓ StealthScraper instance created');

const metrics = scraper.getMetrics();
console.log('✓ Metrics:', metrics);

console.log('\n✅ All basic tests passed!');
console.log('\nTo run full security test:');
console.log('  npm run start -- test https://your-website.com');
