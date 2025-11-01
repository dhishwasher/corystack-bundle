import type { BrowserContext } from 'playwright';
import pino from 'pino';

const logger = pino({ name: 'browser-timing' });

/**
 * Browser Timing and Performance API Manager
 * Masks automation-specific timing patterns
 */
export class BrowserTimingManager {
  /**
   * Inject realistic browser timing overrides into context
   */
  static async injectTimingOverrides(context: BrowserContext): Promise<void> {
    await context.addInitScript(() => {
      // 1. Performance timing - add realistic page load times
      const navigationStart = Date.now() - Math.floor(Math.random() * 2000 + 1000); // 1-3 seconds ago

      const timingOverrides = {
        navigationStart,
        fetchStart: navigationStart + Math.floor(Math.random() * 50 + 10),
        domainLookupStart: navigationStart + Math.floor(Math.random() * 30 + 20),
        domainLookupEnd: navigationStart + Math.floor(Math.random() * 50 + 40),
        connectStart: navigationStart + Math.floor(Math.random() * 60 + 50),
        connectEnd: navigationStart + Math.floor(Math.random() * 80 + 70),
        requestStart: navigationStart + Math.floor(Math.random() * 100 + 90),
        responseStart: navigationStart + Math.floor(Math.random() * 200 + 150),
        responseEnd: navigationStart + Math.floor(Math.random() * 300 + 250),
        domLoading: navigationStart + Math.floor(Math.random() * 350 + 300),
        domInteractive: navigationStart + Math.floor(Math.random() * 700 + 600),
        domContentLoadedEventStart: navigationStart + Math.floor(Math.random() * 750 + 700),
        domContentLoadedEventEnd: navigationStart + Math.floor(Math.random() * 800 + 750),
        domComplete: navigationStart + Math.floor(Math.random() * 1200 + 1000),
        loadEventStart: navigationStart + Math.floor(Math.random() * 1250 + 1200),
        loadEventEnd: navigationStart + Math.floor(Math.random() * 1300 + 1250),
      };

      // Override performance.timing
      try {
        Object.defineProperty(window.performance, 'timing', {
          get: () => timingOverrides,
          configurable: true,
        });
      } catch (e) {
        // Fallback if not configurable
      }

      // 2. Performance.now() - add small random jitter
      const originalPerformanceNow = Performance.prototype.now;
      let performanceNowOffset = Math.random() * 10; // Random offset 0-10ms

      Performance.prototype.now = function() {
        const realTime = originalPerformanceNow.apply(this);
        // Add jitter that increases over time (simulates real timing variance)
        const jitter = (Math.random() - 0.5) * 0.1;
        performanceNowOffset += jitter;
        return realTime + performanceNowOffset;
      };

      // 3. Date.now() - ensure consistency with performance.now()
      const originalDateNow = Date.now;
      let dateNowOffset = 0;

      Date.now = function() {
        const realDate = originalDateNow.apply(this);
        // Slight offset to match performance timing
        return realDate + dateNowOffset;
      };

      // 4. Performance.getEntries() - add realistic resource timing
      const originalGetEntries = Performance.prototype.getEntries;
      Performance.prototype.getEntries = function() {
        const entries = originalGetEntries.apply(this);

        // Add slight timing variance to each entry
        return entries.map((entry: any) => {
          if (entry.duration !== undefined) {
            const variance = (Math.random() - 0.5) * 2;
            return {
              ...entry,
              duration: Math.max(0, entry.duration + variance),
            };
          }
          return entry;
        });
      };

      // 5. RequestAnimationFrame timing - add realistic frame variance
      const originalRAF = window.requestAnimationFrame;
      window.requestAnimationFrame = function(callback: FrameRequestCallback): number {
        return originalRAF.call(this, (timestamp: number) => {
          // Add small random variance to frame timing
          const variance = (Math.random() - 0.5) * 0.5;
          callback(timestamp + variance);
        });
      };

      // 6. SetTimeout/SetInterval - add realistic timing variance
      const originalSetTimeout = window.setTimeout;
      const originalSetInterval = window.setInterval;

      (window as any).setTimeout = function(handler: TimerHandler, timeout?: number, ...args: any[]): number {
        // Add 0-2ms variance to timeout
        const variance = Math.random() * 2;
        const adjustedTimeout = timeout !== undefined ? timeout + variance : timeout;
        return originalSetTimeout(handler, adjustedTimeout, ...args) as any;
      };

      (window as any).setInterval = function(handler: TimerHandler, timeout?: number, ...args: any[]): number {
        // Add 0-1ms variance to interval
        const variance = Math.random();
        const adjustedTimeout = timeout !== undefined ? timeout + variance : timeout;
        return originalSetInterval(handler, adjustedTimeout, ...args) as any;
      };

      // 7. Performance.mark() and Performance.measure() - ensure they work properly
      const originalMark = Performance.prototype.mark;
      const originalMeasure = Performance.prototype.measure;

      Performance.prototype.mark = function(markName: string, markOptions?: PerformanceMarkOptions) {
        try {
          return originalMark.call(this, markName, markOptions);
        } catch (e) {
          // Silently fail for invalid marks
          return undefined as any;
        }
      };

      Performance.prototype.measure = function(
        measureName: string,
        startOrMeasureOptions?: string | PerformanceMeasureOptions,
        endMark?: string
      ) {
        try {
          return originalMeasure.call(this, measureName, startOrMeasureOptions as any, endMark);
        } catch (e) {
          // Silently fail for invalid measures
          return undefined as any;
        }
      };

      // 8. Performance.timeOrigin - ensure it's realistic
      try {
        Object.defineProperty(window.performance, 'timeOrigin', {
          get: () => navigationStart,
          configurable: true,
        });
      } catch (e) {
        // Fallback if not configurable
      }

      // 9. Event.timeStamp - add realistic timestamps
      const originalAddEventListener = EventTarget.prototype.addEventListener;
      EventTarget.prototype.addEventListener = function(
        this: EventTarget,
        type: string,
        listener: EventListenerOrEventListenerObject | null,
        options?: boolean | AddEventListenerOptions
      ) {
        const self = this;
        const wrappedListener = function(this: any, event: Event) {
          // Add small variance to event timestamps
          try {
            Object.defineProperty(event, 'timeStamp', {
              get: () => performance.now() + (Math.random() - 0.5) * 0.1,
              configurable: true,
            });
          } catch (e) {
            // Fallback if not configurable
          }

          if (typeof listener === 'function') {
            return listener.call(this, event);
          } else if (listener && typeof listener.handleEvent === 'function') {
            return listener.handleEvent(event);
          }
        };

        return originalAddEventListener.call(self, type, wrappedListener, options);
      };

      // 10. High-resolution time - ensure consistency
      if ((window as any).chrome && (window as any).chrome.loadTimes) {
        const originalLoadTimes = (window as any).chrome.loadTimes;
        (window as any).chrome.loadTimes = function() {
          const loadTimes = originalLoadTimes.apply(this);
          // Add realistic variance
          return {
            ...loadTimes,
            startLoadTime: navigationStart / 1000,
            commitLoadTime: (navigationStart + 100) / 1000,
            finishDocumentLoadTime: (navigationStart + 800) / 1000,
            finishLoadTime: (navigationStart + 1200) / 1000,
          };
        };
      }
    });

    logger.debug('Injected browser timing overrides');
  }

  /**
   * Get realistic page load timings for injection
   */
  static getRealisticPageLoadTimings(): {
    domContentLoaded: number;
    load: number;
    firstPaint: number;
    firstContentfulPaint: number;
  } {
    return {
      domContentLoaded: Math.floor(Math.random() * 500 + 700), // 700-1200ms
      load: Math.floor(Math.random() * 800 + 1200), // 1200-2000ms
      firstPaint: Math.floor(Math.random() * 300 + 400), // 400-700ms
      firstContentfulPaint: Math.floor(Math.random() * 400 + 600), // 600-1000ms
    };
  }

  /**
   * Get realistic resource timing for specific resource types
   */
  static getRealisticResourceTiming(resourceType: 'script' | 'stylesheet' | 'image' | 'xhr' | 'fetch'): {
    duration: number;
    transferSize: number;
  } {
    const timings = {
      script: { duration: [50, 300], transferSize: [5000, 100000] },
      stylesheet: { duration: [30, 150], transferSize: [2000, 50000] },
      image: { duration: [20, 200], transferSize: [5000, 500000] },
      xhr: { duration: [100, 1000], transferSize: [100, 100000] },
      fetch: { duration: [100, 1000], transferSize: [100, 100000] },
    };

    const config = timings[resourceType];
    return {
      duration: Math.floor(Math.random() * (config.duration[1] - config.duration[0]) + config.duration[0]),
      transferSize: Math.floor(Math.random() * (config.transferSize[1] - config.transferSize[0]) + config.transferSize[0]),
    };
  }

  /**
   * Validate timing consistency
   */
  static validateTimingConsistency(timings: any): boolean {
    // Ensure timing values make logical sense
    if (!timings) return false;

    const requiredSequence = [
      'navigationStart',
      'fetchStart',
      'domainLookupStart',
      'domainLookupEnd',
      'connectStart',
      'connectEnd',
      'requestStart',
      'responseStart',
      'responseEnd',
      'domLoading',
      'domInteractive',
      'domContentLoadedEventStart',
      'domContentLoadedEventEnd',
      'domComplete',
      'loadEventStart',
      'loadEventEnd',
    ];

    for (let i = 1; i < requiredSequence.length; i++) {
      const prev = timings[requiredSequence[i - 1]];
      const current = timings[requiredSequence[i]];

      if (current < prev) {
        logger.warn({ prev: requiredSequence[i - 1], current: requiredSequence[i] }, 'Timing sequence violation');
        return false;
      }
    }

    return true;
  }
}
