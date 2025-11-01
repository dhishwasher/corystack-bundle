import type { Page } from 'playwright';
import pino from 'pino';

const logger = pino({ name: 'captcha-solver' });

export interface CaptchaSolverConfig {
  apiKey: string;
  service: '2captcha' | 'anticaptcha' | 'capsolver';
  timeout?: number;
  pollingInterval?: number;
}

export interface CaptchaTask {
  type: 'recaptcha-v2' | 'recaptcha-v3' | 'hcaptcha' | 'funcaptcha' | 'geetest';
  siteKey: string;
  pageUrl: string;
  action?: string; // For reCAPTCHA v3
  minScore?: number; // For reCAPTCHA v3
  data?: Record<string, any>;
}

export interface CaptchaResult {
  success: boolean;
  token?: string;
  error?: string;
  cost?: number;
  solveTime?: number;
}

/**
 * Universal CAPTCHA solver supporting multiple services
 */
export class CaptchaSolver {
  private config: CaptchaSolverConfig;
  private baseUrls: Record<string, string> = {
    '2captcha': 'https://2captcha.com',
    'anticaptcha': 'https://api.anti-captcha.com',
    'capsolver': 'https://api.capsolver.com',
  };

  constructor(config: CaptchaSolverConfig) {
    this.config = {
      timeout: 120000, // 2 minutes
      pollingInterval: 5000, // 5 seconds
      ...config,
    };
  }

  /**
   * Solve CAPTCHA using configured service
   */
  async solve(task: CaptchaTask): Promise<CaptchaResult> {
    const startTime = Date.now();
    logger.info({ type: task.type, service: this.config.service }, 'Solving CAPTCHA');

    try {
      switch (this.config.service) {
        case '2captcha':
          return await this.solve2Captcha(task, startTime);
        case 'anticaptcha':
          return await this.solveAntiCaptcha(task, startTime);
        case 'capsolver':
          return await this.solveCapsolver(task, startTime);
        default:
          throw new Error(`Unsupported service: ${this.config.service}`);
      }
    } catch (error) {
      logger.error({ error, task }, 'CAPTCHA solving failed');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        solveTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Auto-detect and solve CAPTCHA on page
   */
  async autoSolve(page: Page): Promise<CaptchaResult> {
    logger.info('Auto-detecting CAPTCHA on page');

    // Detect reCAPTCHA v2
    const recaptchaV2 = await page.locator('.g-recaptcha, [data-sitekey]').first().count();
    if (recaptchaV2 > 0) {
      const siteKey = await page.locator('[data-sitekey]').first().getAttribute('data-sitekey');
      if (siteKey) {
        logger.info({ siteKey }, 'Detected reCAPTCHA v2');
        const result = await this.solve({
          type: 'recaptcha-v2',
          siteKey,
          pageUrl: page.url(),
        });

        if (result.success && result.token) {
          await this.injectRecaptchaToken(page, result.token);
        }

        return result;
      }
    }

    // Detect hCaptcha
    const hcaptcha = await page.locator('.h-captcha, [data-hcaptcha-sitekey]').first().count();
    if (hcaptcha > 0) {
      const siteKey = await page.locator('[data-hcaptcha-sitekey]').first().getAttribute('data-hcaptcha-sitekey');
      if (siteKey) {
        logger.info({ siteKey }, 'Detected hCaptcha');
        const result = await this.solve({
          type: 'hcaptcha',
          siteKey,
          pageUrl: page.url(),
        });

        if (result.success && result.token) {
          await this.injectHCaptchaToken(page, result.token);
        }

        return result;
      }
    }

    // Check for reCAPTCHA v3 (invisible)
    const recaptchaV3 = await page.evaluate(() => {
      return !!(window as any).grecaptcha || document.querySelector('script[src*="recaptcha"]');
    });

    if (recaptchaV3) {
      // Try to extract site key from page source
      const pageContent = await page.content();
      const siteKeyMatch = pageContent.match(/['\"]sitekey['\"]\s*:\s*['\"]([\w-]+)['\"]/) ||
                          pageContent.match(/data-sitekey=['\"]([\w-]+)['\"]/) ||
                          pageContent.match(/\?k=([\w-]+)/);

      if (siteKeyMatch && siteKeyMatch[1]) {
        logger.info({ siteKey: siteKeyMatch[1] }, 'Detected reCAPTCHA v3');
        return await this.solve({
          type: 'recaptcha-v3',
          siteKey: siteKeyMatch[1],
          pageUrl: page.url(),
          action: 'submit',
          minScore: 0.5,
        });
      }
    }

    return {
      success: false,
      error: 'No CAPTCHA detected on page',
    };
  }

  /**
   * Solve using 2captcha service
   */
  private async solve2Captcha(task: CaptchaTask, startTime: number): Promise<CaptchaResult> {
    // Submit CAPTCHA task
    const submitUrl = `${this.baseUrls['2captcha']}/in.php`;
    const submitParams = new URLSearchParams({
      key: this.config.apiKey,
      json: '1',
      ...this.get2CaptchaParams(task),
    });

    const submitResponse = await fetch(`${submitUrl}?${submitParams}`);
    const submitData = await submitResponse.json();

    if (submitData.status !== 1) {
      throw new Error(`2captcha submit failed: ${submitData.request}`);
    }

    const taskId = submitData.request;
    logger.info({ taskId }, '2captcha task submitted');

    // Poll for result
    const resultUrl = `${this.baseUrls['2captcha']}/res.php`;
    const maxAttempts = Math.floor(this.config.timeout! / this.config.pollingInterval!);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await this.sleep(this.config.pollingInterval!);

      const resultParams = new URLSearchParams({
        key: this.config.apiKey,
        action: 'get',
        id: taskId,
        json: '1',
      });

      const resultResponse = await fetch(`${resultUrl}?${resultParams}`);
      const resultData = await resultResponse.json();

      if (resultData.status === 1) {
        logger.info({ taskId, attempts: attempt + 1 }, '2captcha solved successfully');
        return {
          success: true,
          token: resultData.request,
          solveTime: Date.now() - startTime,
        };
      }

      if (resultData.request !== 'CAPCHA_NOT_READY') {
        throw new Error(`2captcha error: ${resultData.request}`);
      }

      logger.debug({ taskId, attempt: attempt + 1 }, 'Waiting for 2captcha result');
    }

    throw new Error('2captcha timeout');
  }

  /**
   * Get 2captcha-specific parameters
   */
  private get2CaptchaParams(task: CaptchaTask): Record<string, string> {
    const params: Record<string, string> = {
      pageurl: task.pageUrl,
      googlekey: task.siteKey,
    };

    switch (task.type) {
      case 'recaptcha-v2':
        params.method = 'userrecaptcha';
        break;
      case 'recaptcha-v3':
        params.method = 'userrecaptcha';
        params.version = 'v3';
        params.action = task.action || 'verify';
        params.min_score = (task.minScore || 0.5).toString();
        break;
      case 'hcaptcha':
        params.method = 'hcaptcha';
        break;
      case 'funcaptcha':
        params.method = 'funcaptcha';
        params.publickey = task.siteKey;
        delete params.googlekey;
        break;
      case 'geetest':
        params.method = 'geetest';
        break;
    }

    return params;
  }

  /**
   * Solve using AntiCaptcha service
   */
  private async solveAntiCaptcha(task: CaptchaTask, startTime: number): Promise<CaptchaResult> {
    const submitUrl = `${this.baseUrls['anticaptcha']}/createTask`;

    const taskPayload = this.getAntiCaptchaTask(task);
    const submitResponse = await fetch(submitUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientKey: this.config.apiKey,
        task: taskPayload,
      }),
    });

    const submitData = await submitResponse.json();

    if (submitData.errorId !== 0) {
      throw new Error(`AntiCaptcha submit failed: ${submitData.errorDescription}`);
    }

    const taskId = submitData.taskId;
    logger.info({ taskId }, 'AntiCaptcha task submitted');

    // Poll for result
    const resultUrl = `${this.baseUrls['anticaptcha']}/getTaskResult`;
    const maxAttempts = Math.floor(this.config.timeout! / this.config.pollingInterval!);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await this.sleep(this.config.pollingInterval!);

      const resultResponse = await fetch(resultUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientKey: this.config.apiKey,
          taskId,
        }),
      });

      const resultData = await resultResponse.json();

      if (resultData.status === 'ready') {
        logger.info({ taskId, attempts: attempt + 1 }, 'AntiCaptcha solved successfully');
        return {
          success: true,
          token: resultData.solution.gRecaptchaResponse || resultData.solution.token,
          cost: resultData.cost,
          solveTime: Date.now() - startTime,
        };
      }

      if (resultData.errorId !== 0) {
        throw new Error(`AntiCaptcha error: ${resultData.errorDescription}`);
      }

      logger.debug({ taskId, attempt: attempt + 1 }, 'Waiting for AntiCaptcha result');
    }

    throw new Error('AntiCaptcha timeout');
  }

  /**
   * Get AntiCaptcha-specific task
   */
  private getAntiCaptchaTask(task: CaptchaTask): Record<string, any> {
    const baseTask = {
      websiteURL: task.pageUrl,
      websiteKey: task.siteKey,
    };

    switch (task.type) {
      case 'recaptcha-v2':
        return {
          type: 'RecaptchaV2TaskProxyless',
          ...baseTask,
        };
      case 'recaptcha-v3':
        return {
          type: 'RecaptchaV3TaskProxyless',
          ...baseTask,
          pageAction: task.action || 'verify',
          minScore: task.minScore || 0.5,
        };
      case 'hcaptcha':
        return {
          type: 'HCaptchaTaskProxyless',
          ...baseTask,
        };
      case 'funcaptcha':
        return {
          type: 'FunCaptchaTaskProxyless',
          websiteURL: task.pageUrl,
          websitePublicKey: task.siteKey,
        };
      default:
        throw new Error(`Unsupported task type for AntiCaptcha: ${task.type}`);
    }
  }

  /**
   * Solve using Capsolver service
   */
  private async solveCapsolver(task: CaptchaTask, startTime: number): Promise<CaptchaResult> {
    const submitUrl = `${this.baseUrls['capsolver']}/createTask`;

    const taskPayload = this.getCapsolverTask(task);
    const submitResponse = await fetch(submitUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientKey: this.config.apiKey,
        task: taskPayload,
      }),
    });

    const submitData = await submitResponse.json();

    if (submitData.errorId !== 0) {
      throw new Error(`Capsolver submit failed: ${submitData.errorDescription}`);
    }

    const taskId = submitData.taskId;
    logger.info({ taskId }, 'Capsolver task submitted');

    // Poll for result
    const resultUrl = `${this.baseUrls['capsolver']}/getTaskResult`;
    const maxAttempts = Math.floor(this.config.timeout! / this.config.pollingInterval!);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await this.sleep(this.config.pollingInterval!);

      const resultResponse = await fetch(resultUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientKey: this.config.apiKey,
          taskId,
        }),
      });

      const resultData = await resultResponse.json();

      if (resultData.status === 'ready') {
        logger.info({ taskId, attempts: attempt + 1 }, 'Capsolver solved successfully');
        return {
          success: true,
          token: resultData.solution.gRecaptchaResponse || resultData.solution.token,
          solveTime: Date.now() - startTime,
        };
      }

      if (resultData.errorId !== 0) {
        throw new Error(`Capsolver error: ${resultData.errorDescription}`);
      }

      logger.debug({ taskId, attempt: attempt + 1 }, 'Waiting for Capsolver result');
    }

    throw new Error('Capsolver timeout');
  }

  /**
   * Get Capsolver-specific task
   */
  private getCapsolverTask(task: CaptchaTask): Record<string, any> {
    const baseTask = {
      websiteURL: task.pageUrl,
      websiteKey: task.siteKey,
    };

    switch (task.type) {
      case 'recaptcha-v2':
        return {
          type: 'ReCaptchaV2TaskProxyLess',
          ...baseTask,
        };
      case 'recaptcha-v3':
        return {
          type: 'ReCaptchaV3TaskProxyLess',
          ...baseTask,
          pageAction: task.action || 'verify',
          minScore: task.minScore || 0.5,
        };
      case 'hcaptcha':
        return {
          type: 'HCaptchaTaskProxyLess',
          ...baseTask,
        };
      case 'funcaptcha':
        return {
          type: 'FunCaptchaTaskProxyLess',
          websiteURL: task.pageUrl,
          websitePublicKey: task.siteKey,
        };
      default:
        throw new Error(`Unsupported task type for Capsolver: ${task.type}`);
    }
  }

  /**
   * Inject reCAPTCHA token into page
   */
  private async injectRecaptchaToken(page: Page, token: string): Promise<void> {
    await page.evaluate((token) => {
      const textarea = document.querySelector('#g-recaptcha-response, [name="g-recaptcha-response"]') as HTMLTextAreaElement;
      if (textarea) {
        textarea.value = token;
        textarea.innerHTML = token;
      }

      // Trigger callbacks
      if ((window as any).___grecaptcha_cfg?.clients) {
        Object.values((window as any).___grecaptcha_cfg.clients).forEach((client: any) => {
          if (client?.callback) {
            client.callback(token);
          }
        });
      }
    }, token);

    logger.info('reCAPTCHA token injected into page');
  }

  /**
   * Inject hCaptcha token into page
   */
  private async injectHCaptchaToken(page: Page, token: string): Promise<void> {
    await page.evaluate((token) => {
      const textarea = document.querySelector('[name="h-captcha-response"]') as HTMLTextAreaElement;
      if (textarea) {
        textarea.value = token;
        textarea.innerHTML = token;
      }

      // Trigger callbacks
      if ((window as any).hcaptcha) {
        const callbacks = (window as any).hcaptcha.callbacks || [];
        callbacks.forEach((callback: any) => {
          if (typeof callback === 'function') {
            callback(token);
          }
        });
      }
    }, token);

    logger.info('hCaptcha token injected into page');
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
