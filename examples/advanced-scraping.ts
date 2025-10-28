/**
 * Advanced Scraping Example
 *
 * This example demonstrates advanced scraping with:
 * - Custom tasks
 * - Human behavior simulation
 * - Form filling
 * - Data extraction
 */

import { StealthScraper } from '../src/index.js';

async function main() {
  const scraper = new StealthScraper();

  // Example 1: Basic data extraction
  console.log('=== Example 1: Basic Data Extraction ===\n');

  const task1 = {
    id: 'extract-headings',
    url: 'https://your-website.com',
    method: 'GET' as const,
    extractors: [
      {
        name: 'mainHeading',
        selector: 'h1',
        type: 'text' as const,
      },
      {
        name: 'allHeadings',
        selector: 'h2',
        type: 'multiple' as const,
      },
    ],
    priority: 1,
    retries: 0,
    maxRetries: 3,
  };

  try {
    const result1 = await scraper.executeTask(task1);
    console.log('Extracted data:', result1.data);
    console.log('Detections:', result1.detections.length);
  } catch (error) {
    console.error('Task 1 failed:', error);
  }

  // Example 2: Interactive scraping with form filling
  console.log('\n=== Example 2: Interactive Scraping ===\n');

  const task2 = {
    id: 'form-interaction',
    url: 'https://your-website.com/contact',
    method: 'GET' as const,
    actions: [
      // Wait for page load
      { type: 'wait' as const, duration: 2000 },

      // Scroll to form (human-like)
      { type: 'scroll' as const, humanLike: true },

      // Fill form fields
      {
        type: 'type' as const,
        selector: '#name',
        value: 'Test User',
        humanLike: true,
      },
      {
        type: 'type' as const,
        selector: '#email',
        value: 'test@example.com',
        humanLike: true,
      },

      // Take screenshot
      {
        type: 'screenshot' as const,
        value: './screenshots/form-filled.png',
      },

      // Note: We don't actually submit to avoid test data
    ],
    priority: 1,
    retries: 0,
    maxRetries: 3,
  };

  try {
    const result2 = await scraper.executeTask(task2);
    console.log('Form interaction completed');
    console.log('Detections:', result2.detections.map(d => d.type));
  } catch (error) {
    console.error('Task 2 failed:', error);
  }

  // Example 3: Multi-page scraping
  console.log('\n=== Example 3: Multi-Page Scraping ===\n');

  const pages = [
    'https://your-website.com/page1',
    'https://your-website.com/page2',
    'https://your-website.com/page3',
  ];

  const results = [];

  for (const url of pages) {
    const task = {
      id: `scrape-${url}`,
      url,
      method: 'GET' as const,
      extractors: [
        {
          name: 'title',
          selector: 'title',
          type: 'text' as const,
        },
      ],
      priority: 1,
      retries: 0,
      maxRetries: 3,
    };

    try {
      const result = await scraper.executeTask(task);
      results.push({ url, data: result.data });

      // Random delay between pages (human-like)
      await new Promise(resolve =>
        setTimeout(resolve, 2000 + Math.random() * 3000)
      );
    } catch (error) {
      console.error(`Failed to scrape ${url}:`, error);
    }
  }

  console.log('Multi-page results:', results);

  // Example 4: Stress test
  console.log('\n=== Example 4: Stress Test ===\n');

  try {
    const stressResult = await scraper.stressTest('https://your-website.com', {
      concurrentSessions: 3,
      requestsPerSession: 5,
      useProxies: false,
    });

    console.log('Stress test results:');
    console.log(`Total Requests: ${stressResult.totalRequests}`);
    console.log(`Successful: ${stressResult.successfulRequests}`);
    console.log(`Detection Rate: ${(stressResult.detectionRate * 100).toFixed(2)}%`);
    console.log(`Avg Response Time: ${stressResult.averageResponseTime.toFixed(2)}ms`);
  } catch (error) {
    console.error('Stress test failed:', error);
  }

  // Cleanup
  await scraper.cleanup();
  console.log('\nAll tasks completed!');
}

main();
