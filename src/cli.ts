#!/usr/bin/env node

import { Command } from 'commander';
import { StealthScraper } from './core/stealth-scraper.js';
import { ProxyManager } from './core/proxy-manager.js';
import type { StealthConfig } from './types/index.js';
import { defaultConfig } from './config/default.js';
import chalk from 'chalk';
import ora from 'ora';
import { table } from 'table';
import * as dotenv from 'dotenv';

dotenv.config();

const program = new Command();

program
  .name('corystack-scraper')
  .description('Advanced stealth scraper for security testing and vulnerability assessment')
  .version('1.0.0');

/**
 * Test command - security vulnerability testing
 */
program
  .command('test')
  .description('Test a target URL for bot detection vulnerabilities')
  .argument('<url>', 'Target URL to test')
  .option('-a, --attempts <number>', 'Number of test attempts', '5')
  .option('-p, --use-proxies', 'Use proxy rotation')
  .option('-b, --human-behavior', 'Simulate human behavior', true)
  .option('-o, --output <path>', 'Output directory for reports', './reports')
  .action(async (url, options) => {
    const spinner = ora('Initializing stealth scraper...').start();

    try {
      const config: Partial<StealthConfig> = {
        ...defaultConfig,
        logging: {
          ...defaultConfig.logging,
          logDir: options.output,
        },
      };

      // Load proxies if enabled
      if (options.useProxies && process.env.PROXY_LIST_FILE) {
        spinner.text = 'Loading proxies...';
        const proxies = await ProxyManager.loadFromFile(process.env.PROXY_LIST_FILE);
        config.network = {
          ...defaultConfig.network,
          proxyEnabled: true,
          proxyList: proxies,
        };
        spinner.succeed(`Loaded ${proxies.length} proxies`);
      }

      const scraper = new StealthScraper(config);

      spinner.text = `Testing ${url}...`;
      spinner.start();

      const report = await scraper.testSecurity(url, {
        attempts: parseInt(options.attempts),
        useProxies: options.useProxies,
        simulateHumanBehavior: options.humanBehavior,
      });

      spinner.stop();

      // Display results
      console.log('\n' + chalk.bold.cyan('═══════════════════════════════════════════════════════'));
      console.log(chalk.bold.cyan('  SECURITY VULNERABILITY ASSESSMENT REPORT'));
      console.log(chalk.bold.cyan('═══════════════════════════════════════════════════════\n'));

      console.log(chalk.bold('Target:'), url);
      console.log(chalk.bold('Session ID:'), report.sessionId);
      console.log(
        chalk.bold('Bypass Success:'),
        report.bypassSuccess ? chalk.red('✅ YES (VULNERABLE)') : chalk.green('❌ NO (PROTECTED)')
      );
      console.log(
        chalk.bold('Detection Rate:'),
        `${(report.detectionRate * 100).toFixed(2)}%`
      );
      console.log(
        chalk.bold('Vulnerabilities Found:'),
        report.vulnerabilities.length
      );

      if (report.vulnerabilities.length > 0) {
        console.log('\n' + chalk.bold.yellow('Vulnerabilities:\n'));

        const tableData = [
          [
            chalk.bold('Severity'),
            chalk.bold('Category'),
            chalk.bold('Title'),
          ],
        ];

        report.vulnerabilities.forEach(vuln => {
          const severityColor = {
            critical: chalk.red.bold,
            high: chalk.red,
            medium: chalk.yellow,
            low: chalk.blue,
            info: chalk.gray,
          }[vuln.severity];

          tableData.push([
            severityColor(vuln.severity.toUpperCase()),
            vuln.category,
            vuln.title,
          ]);
        });

        console.log(table(tableData));
      }

      console.log(chalk.bold.yellow('\nTop Recommendations:\n'));
      report.recommendations.slice(0, 5).forEach((rec, idx) => {
        console.log(chalk.yellow(`${idx + 1}. ${rec}`));
      });

      console.log('\n' + chalk.green(`✓ Full report saved to: ${options.output}\n`));

      await scraper.cleanup();

      process.exit(report.bypassSuccess ? 1 : 0);
    } catch (error) {
      spinner.fail('Test failed');
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

/**
 * Stress test command
 */
program
  .command('stress')
  .description('Stress test a target with multiple concurrent sessions')
  .argument('<url>', 'Target URL to stress test')
  .option('-c, --concurrent <number>', 'Concurrent sessions', '5')
  .option('-r, --requests <number>', 'Requests per session', '10')
  .option('-p, --use-proxies', 'Use proxy rotation')
  .action(async (url, options) => {
    const spinner = ora('Initializing stress test...').start();

    try {
      const config: Partial<StealthConfig> = defaultConfig;

      // Load proxies if enabled
      if (options.useProxies && process.env.PROXY_LIST_FILE) {
        spinner.text = 'Loading proxies...';
        const proxies = await ProxyManager.loadFromFile(process.env.PROXY_LIST_FILE);
        config.network = {
          ...defaultConfig.network,
          proxyEnabled: true,
          proxyList: proxies,
        };
      }

      const scraper = new StealthScraper(config);

      spinner.text = `Stress testing ${url}...`;

      const result = await scraper.stressTest(url, {
        concurrentSessions: parseInt(options.concurrent),
        requestsPerSession: parseInt(options.requests),
        useProxies: options.useProxies,
      });

      spinner.succeed('Stress test completed');

      console.log('\n' + chalk.bold.cyan('═══════════════════════════════════════'));
      console.log(chalk.bold.cyan('  STRESS TEST RESULTS'));
      console.log(chalk.bold.cyan('═══════════════════════════════════════\n'));

      console.log(chalk.bold('Total Requests:'), result.totalRequests);
      console.log(chalk.bold('Successful:'), chalk.green(result.successfulRequests));
      console.log(
        chalk.bold('Failed:'),
        chalk.red(result.totalRequests - result.successfulRequests)
      );
      console.log(
        chalk.bold('Detection Rate:'),
        `${(result.detectionRate * 100).toFixed(2)}%`
      );
      console.log(
        chalk.bold('Avg Response Time:'),
        `${result.averageResponseTime.toFixed(2)}ms`
      );

      const successRate =
        (result.successfulRequests / result.totalRequests) * 100;

      if (successRate > 80) {
        console.log(
          '\n' + chalk.red('⚠️  High success rate indicates weak bot protection!')
        );
      } else if (successRate > 50) {
        console.log('\n' + chalk.yellow('⚠️  Moderate bot protection detected'));
      } else {
        console.log('\n' + chalk.green('✓ Strong bot protection detected'));
      }

      console.log('');

      await scraper.cleanup();
    } catch (error) {
      spinner.fail('Stress test failed');
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

/**
 * Scrape command - execute a scraping task
 */
program
  .command('scrape')
  .description('Execute a scraping task (for your own sites only)')
  .argument('<url>', 'URL to scrape')
  .option('-s, --selector <selector>', 'CSS selector to extract')
  .option('-o, --output <file>', 'Output file')
  .option('-p, --use-proxies', 'Use proxy rotation')
  .option('-b, --human-behavior', 'Simulate human behavior', true)
  .action(async (url, options) => {
    const spinner = ora('Scraping...').start();

    try {
      const scraper = new StealthScraper(defaultConfig);

      const task = {
        id: 'cli-task',
        url,
        method: 'GET' as const,
        extractors: options.selector
          ? [
              {
                name: 'data',
                selector: options.selector,
                type: 'text' as const,
              },
            ]
          : undefined,
        priority: 1,
        retries: 0,
        maxRetries: 3,
      };

      const result = await scraper.executeTask(task);

      spinner.succeed('Scraping completed');

      if (result.detections.length > 0) {
        console.log(
          chalk.yellow(
            `\n⚠️  Detections: ${result.detections.map(d => d.type).join(', ')}`
          )
        );
      }

      if (result.data) {
        console.log('\n' + chalk.bold('Extracted Data:\n'));
        console.log(JSON.stringify(result.data, null, 2));

        if (options.output) {
          const fs = await import('fs/promises');
          await fs.writeFile(options.output, JSON.stringify(result.data, null, 2));
          console.log(chalk.green(`\n✓ Data saved to ${options.output}`));
        }
      }

      await scraper.cleanup();
    } catch (error) {
      spinner.fail('Scraping failed');
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

/**
 * Proxy command - manage proxies
 */
program
  .command('proxy')
  .description('Test and manage proxies')
  .option('-f, --file <path>', 'Proxy list file')
  .option('-t, --test', 'Test all proxies')
  .action(async (options) => {
    if (!options.file) {
      console.error(chalk.red('Error: --file is required'));
      process.exit(1);
    }

    const spinner = ora('Loading proxies...').start();

    try {
      const proxies = await ProxyManager.loadFromFile(options.file);
      spinner.succeed(`Loaded ${proxies.length} proxies`);

      if (options.test) {
        spinner.text = 'Testing proxies...';
        spinner.start();

        const proxyManager = new ProxyManager(proxies);
        const results = await Promise.all(
          proxies.map(async proxy => ({
            proxy,
            working: await proxyManager.testProxy(proxy),
          }))
        );

        spinner.stop();

        const working = results.filter(r => r.working).length;
        const failed = results.length - working;

        console.log('\n' + chalk.bold('Proxy Test Results:\n'));
        console.log(chalk.green(`✓ Working: ${working}`));
        console.log(chalk.red(`✗ Failed: ${failed}`));

        const stats = proxyManager.getStats();
        console.log('\n' + chalk.bold('Statistics:\n'));
        console.log(`Total: ${stats.total}`);
        console.log(`Residential: ${stats.residential}`);
        console.log(`Datacenter: ${stats.datacenter}`);
      }
    } catch (error) {
      spinner.fail('Operation failed');
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

program.parse();
