import { Queue, Worker, QueueEvents, Job } from 'bullmq';
import { Redis } from 'ioredis';
import type { ScraperTask, VulnerabilityReport } from '../types/index.js';
import { StealthScraper } from './stealth-scraper.js';
import type { StealthConfig } from '../types/index.js';

export interface QueueConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  concurrency: number;
  attempts: number;
  backoff: {
    type: 'exponential' | 'fixed';
    delay: number;
  };
}

/**
 * Distributed scraping queue manager using BullMQ
 * Enables horizontal scaling across multiple workers
 */
export class DistributedQueue {
  private queue: Queue;
  private worker: Worker | null = null;
  private queueEvents: QueueEvents;
  private connection: Redis;
  private config: QueueConfig;
  private scraperConfig: StealthConfig;

  constructor(scraperConfig: StealthConfig, queueConfig: QueueConfig) {
    this.config = queueConfig;
    this.scraperConfig = scraperConfig;

    // Create Redis connection
    this.connection = new Redis({
      host: queueConfig.redis.host,
      port: queueConfig.redis.port,
      password: queueConfig.redis.password,
      db: queueConfig.redis.db || 0,
      maxRetriesPerRequest: null,
    });

    // Create queue
    this.queue = new Queue('scraper-tasks', {
      connection: this.connection,
      defaultJobOptions: {
        attempts: queueConfig.attempts,
        backoff: queueConfig.backoff,
        removeOnComplete: {
          age: 3600, // Keep completed jobs for 1 hour
          count: 1000,
        },
        removeOnFail: {
          age: 86400, // Keep failed jobs for 24 hours
        },
      },
    });

    // Create queue events for monitoring
    this.queueEvents = new QueueEvents('scraper-tasks', {
      connection: this.connection,
    });

    this.setupEventListeners();
  }

  /**
   * Set up event listeners for monitoring
   */
  private setupEventListeners(): void {
    this.queueEvents.on('completed', ({ jobId, returnvalue }) => {
      console.log(`Job ${jobId} completed:`, returnvalue);
    });

    this.queueEvents.on('failed', ({ jobId, failedReason }) => {
      console.error(`Job ${jobId} failed:`, failedReason);
    });

    this.queueEvents.on('progress', ({ jobId, data }) => {
      console.log(`Job ${jobId} progress:`, data);
    });
  }

  /**
   * Add a scraping task to the queue
   */
  async addTask(
    task: ScraperTask,
    options: {
      priority?: number;
      delay?: number;
      jobId?: string;
    } = {}
  ): Promise<Job<ScraperTask>> {
    return await this.queue.add('scrape', task, {
      priority: options.priority || task.priority || 1,
      delay: options.delay,
      jobId: options.jobId || task.id,
    });
  }

  /**
   * Add multiple tasks in bulk
   */
  async addBulkTasks(
    tasks: ScraperTask[],
    options: { priority?: number } = {}
  ): Promise<Job<ScraperTask>[]> {
    const jobs = tasks.map(task => ({
      name: 'scrape',
      data: task,
      opts: {
        priority: options.priority || task.priority || 1,
        jobId: task.id,
      },
    }));

    return await this.queue.addBulk(jobs);
  }

  /**
   * Add a security testing task
   */
  async addSecurityTest(
    url: string,
    options: {
      attempts?: number;
      useProxies?: boolean;
      simulateHumanBehavior?: boolean;
      priority?: number;
    } = {}
  ): Promise<Job> {
    return await this.queue.add(
      'security-test',
      {
        url,
        attempts: options.attempts || 5,
        useProxies: options.useProxies || false,
        simulateHumanBehavior: options.simulateHumanBehavior || true,
      },
      {
        priority: options.priority || 2, // Higher priority for security tests
      }
    );
  }

  /**
   * Start the worker to process tasks
   */
  startWorker(): void {
    if (this.worker) {
      console.warn('Worker already running');
      return;
    }

    this.worker = new Worker(
      'scraper-tasks',
      async (job) => {
        console.log(`Processing job ${job.id} of type ${job.name}`);

        const scraper = new StealthScraper(this.scraperConfig);

        try {
          let result;

          if (job.name === 'scrape') {
            // Regular scraping task
            const task = job.data as ScraperTask;
            await job.updateProgress(10);

            result = await scraper.executeTask(task);

            await job.updateProgress(90);
          } else if (job.name === 'security-test') {
            // Security testing task
            const { url, attempts, useProxies, simulateHumanBehavior } = job.data;
            await job.updateProgress(10);

            result = await scraper.testSecurity(url, {
              attempts,
              useProxies,
              simulateHumanBehavior,
            });

            await job.updateProgress(90);
          } else {
            throw new Error(`Unknown job type: ${job.name}`);
          }

          await job.updateProgress(100);
          await scraper.cleanup();

          return result;
        } catch (error) {
          await scraper.cleanup();
          throw error;
        }
      },
      {
        connection: this.connection,
        concurrency: this.config.concurrency,
      }
    );

    console.log(`Worker started with concurrency: ${this.config.concurrency}`);
  }

  /**
   * Stop the worker gracefully
   */
  async stopWorker(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
      console.log('Worker stopped');
    }
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<Job | undefined> {
    return await this.queue.getJob(jobId);
  }

  /**
   * Get job state
   */
  async getJobState(jobId: string): Promise<string | 'unknown'> {
    const job = await this.getJob(jobId);
    return job ? await job.getState() : 'unknown';
  }

  /**
   * Remove a job
   */
  async removeJob(jobId: string): Promise<void> {
    const job = await this.getJob(jobId);
    if (job) {
      await job.remove();
    }
  }

  /**
   * Pause the queue
   */
  async pause(): Promise<void> {
    await this.queue.pause();
    console.log('Queue paused');
  }

  /**
   * Resume the queue
   */
  async resume(): Promise<void> {
    await this.queue.resume();
    console.log('Queue resumed');
  }

  /**
   * Clean old jobs
   */
  async cleanJobs(options: {
    grace?: number;
    limit?: number;
    type?: 'completed' | 'failed';
  } = {}): Promise<string[]> {
    const grace = options.grace || 3600000; // 1 hour
    const limit = options.limit || 100;
    const type = options.type || 'completed';

    return await this.queue.clean(grace, limit, type);
  }

  /**
   * Drain queue (remove all waiting/delayed jobs)
   */
  async drain(delayed = false): Promise<void> {
    await this.queue.drain(delayed);
    console.log('Queue drained');
  }

  /**
   * Obliterate queue (remove everything)
   */
  async obliterate(): Promise<void> {
    await this.queue.obliterate({ force: true });
    console.log('Queue obliterated');
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    await this.stopWorker();
    await this.queueEvents.close();
    await this.queue.close();
    await this.connection.quit();
    console.log('All connections closed');
  }

  /**
   * Get queue metrics for monitoring
   */
  async getMetrics(): Promise<{
    stats: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
      delayed: number;
    };
    isPaused: boolean;
    name: string;
  }> {
    const stats = await this.getStats();
    const isPaused = await this.queue.isPaused();

    return {
      stats,
      isPaused,
      name: this.queue.name,
    };
  }
}
