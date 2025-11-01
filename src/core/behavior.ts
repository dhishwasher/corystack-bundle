import type { Page } from 'playwright';
import type { BehaviorConfig } from '../types/index.js';
import BezierEasing from 'bezier-easing';

/**
 * QWERTY keyboard layout proximity map
 * Maps each key to its adjacent keys for realistic typos
 */
const QWERTY_PROXIMITY: Record<string, string[]> = {
  'q': ['w', 'a', 's'],
  'w': ['q', 'e', 'a', 's', 'd'],
  'e': ['w', 'r', 's', 'd', 'f'],
  'r': ['e', 't', 'd', 'f', 'g'],
  't': ['r', 'y', 'f', 'g', 'h'],
  'y': ['t', 'u', 'g', 'h', 'j'],
  'u': ['y', 'i', 'h', 'j', 'k'],
  'i': ['u', 'o', 'j', 'k', 'l'],
  'o': ['i', 'p', 'k', 'l'],
  'p': ['o', 'l'],
  'a': ['q', 'w', 's', 'z', 'x'],
  's': ['q', 'w', 'e', 'a', 'd', 'z', 'x', 'c'],
  'd': ['w', 'e', 'r', 's', 'f', 'x', 'c', 'v'],
  'f': ['e', 'r', 't', 'd', 'g', 'c', 'v', 'b'],
  'g': ['r', 't', 'y', 'f', 'h', 'v', 'b', 'n'],
  'h': ['t', 'y', 'u', 'g', 'j', 'b', 'n', 'm'],
  'j': ['y', 'u', 'i', 'h', 'k', 'n', 'm'],
  'k': ['u', 'i', 'o', 'j', 'l', 'm'],
  'l': ['i', 'o', 'p', 'k'],
  'z': ['a', 's', 'x'],
  'x': ['a', 's', 'd', 'z', 'c'],
  'c': ['s', 'd', 'f', 'x', 'v'],
  'v': ['d', 'f', 'g', 'c', 'b'],
  'b': ['f', 'g', 'h', 'v', 'n'],
  'n': ['g', 'h', 'j', 'b', 'm'],
  'm': ['h', 'j', 'k', 'n'],
  '1': ['2', 'q'],
  '2': ['1', '3', 'q', 'w'],
  '3': ['2', '4', 'w', 'e'],
  '4': ['3', '5', 'e', 'r'],
  '5': ['4', '6', 'r', 't'],
  '6': ['5', '7', 't', 'y'],
  '7': ['6', '8', 'y', 'u'],
  '8': ['7', '9', 'u', 'i'],
  '9': ['8', '0', 'i', 'o'],
  '0': ['9', 'o', 'p'],
};

export class HumanBehaviorSimulator {
  private config: BehaviorConfig;
  private currentMousePosition: { x: number; y: number } | null = null;

  constructor(config: BehaviorConfig) {
    this.config = config;
  }

  /**
   * Get a random adjacent key based on QWERTY keyboard proximity
   */
  private getAdjacentKey(char: string): string {
    const lowerChar = char.toLowerCase();
    const adjacent = QWERTY_PROXIMITY[lowerChar];

    if (!adjacent || adjacent.length === 0) {
      // Fallback to charCode + 1 for special characters
      return String.fromCharCode(char.charCodeAt(0) + 1);
    }

    // Return random adjacent key
    const typo = adjacent[Math.floor(Math.random() * adjacent.length)];

    // Preserve case
    return char === char.toUpperCase() ? typo.toUpperCase() : typo;
  }

  /**
   * Get current mouse position, initializing if needed
   */
  private getCurrentMousePosition(viewport?: { width: number; height: number }): { x: number; y: number } {
    if (!this.currentMousePosition) {
      // Initialize to a realistic starting position (not 0,0 which is suspicious)
      const width = viewport?.width || 1920;
      const height = viewport?.height || 1080;
      this.currentMousePosition = {
        x: Math.floor(Math.random() * (width * 0.6) + width * 0.2), // 20-80% of width
        y: Math.floor(Math.random() * (height * 0.6) + height * 0.2), // 20-80% of height
      };
    }
    return this.currentMousePosition;
  }

  /**
   * Update tracked mouse position
   */
  private updateMousePosition(x: number, y: number): void {
    this.currentMousePosition = { x, y };
  }

  /**
   * Reset mouse position (useful when navigating to new page)
   */
  resetMousePosition(): void {
    this.currentMousePosition = null;
  }

  /**
   * Generate a randomized Bezier curve for natural mouse movement
   */
  private generateRandomBezierCurve(): (t: number) => number {
    // Randomize Bezier curve parameters for each movement
    // Using realistic ranges that produce natural-looking curves
    const curves = [
      // Standard ease-in-out variations
      [0.25 + (Math.random() - 0.5) * 0.1, 0.1 + (Math.random() - 0.5) * 0.1, 0.25 + (Math.random() - 0.5) * 0.1, 1.0],
      // Slow start, fast end
      [0.42 + (Math.random() - 0.5) * 0.1, 0, 0.58 + (Math.random() - 0.5) * 0.1, 1],
      // Fast start, slow end
      [0.42 + (Math.random() - 0.5) * 0.1, 0, 1, 0.58 + (Math.random() - 0.5) * 0.1],
      // Elastic-like (slight overshoot)
      [0.68 + (Math.random() - 0.5) * 0.1, -0.05 + Math.random() * 0.1, 0.265 + (Math.random() - 0.5) * 0.1, 1.05 + Math.random() * 0.1],
    ];

    const selectedCurve = curves[Math.floor(Math.random() * curves.length)];
    return BezierEasing(
      selectedCurve[0],
      selectedCurve[1],
      selectedCurve[2],
      selectedCurve[3]
    );
  }

  /**
   * Simulate human-like mouse movement from point A to B
   */
  async moveMouseHumanLike(
    page: Page,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number
  ): Promise<void> {
    if (!this.config.humanMouseMovements) {
      await page.mouse.move(toX, toY);
      this.updateMousePosition(toX, toY);
      return;
    }

    const steps = Math.floor(Math.random() * 20) + 30; // 30-50 steps
    const easing = this.generateRandomBezierCurve(); // Randomized curve per movement

    for (let i = 0; i <= steps; i++) {
      const progress = easing(i / steps);

      // Add some randomness to the path (overshoot and correction)
      const randomOffsetX = (Math.random() - 0.5) * 5;
      const randomOffsetY = (Math.random() - 0.5) * 5;

      const x = fromX + (toX - fromX) * progress + randomOffsetX;
      const y = fromY + (toY - fromY) * progress + randomOffsetY;

      await page.mouse.move(x, y);

      // Variable delay between movements
      await this.randomDelay(5, 15);
    }

    // Final correction to exact position
    await page.mouse.move(toX, toY);

    // Update tracked position
    this.updateMousePosition(toX, toY);
  }

  /**
   * Click an element with human-like behavior
   */
  async clickHumanLike(page: Page, selector: string): Promise<void> {
    const element = await page.locator(selector).first();
    const box = await element.boundingBox();

    if (!box) {
      throw new Error(`Element not found or not visible: ${selector}`);
    }

    // Get viewport for initial position
    const viewport = page.viewportSize() || { width: 1920, height: 1080 };

    // Random point within the element (not always center)
    const targetX = box.x + box.width * (0.3 + Math.random() * 0.4);
    const targetY = box.y + box.height * (0.3 + Math.random() * 0.4);

    // Get ACTUAL current mouse position (tracked)
    const currentPos = this.getCurrentMousePosition(viewport);

    // Move mouse to element from actual current position
    await this.moveMouseHumanLike(page, currentPos.x, currentPos.y, targetX, targetY);

    // Random hover time before click
    await this.randomDelay(100, 300);

    // Sometimes miss and correct
    if (Math.random() < 0.1) {
      const missX = targetX + (Math.random() - 0.5) * 20;
      const missY = targetY + (Math.random() - 0.5) * 20;
      await page.mouse.move(missX, missY);
      this.updateMousePosition(missX, missY);
      await this.randomDelay(50, 150);
      await page.mouse.move(targetX, targetY);
      this.updateMousePosition(targetX, targetY);
    }

    // Mouse down, wait, mouse up (not instant click)
    await page.mouse.down();
    await this.randomDelay(50, 150);
    await page.mouse.up();

    // Post-click delay
    await this.randomDelay(200, 500);
  }

  /**
   * Type text with human-like timing and occasional mistakes
   */
  async typeHumanLike(page: Page, selector: string, text: string): Promise<void> {
    await page.click(selector);
    await this.randomDelay(100, 300);

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      // Occasionally make a typo and correct it (QWERTY-based)
      if (this.config.naturalErrors && Math.random() < 0.05 && i > 0) {
        const wrongChar = this.getAdjacentKey(char);
        await page.keyboard.type(wrongChar);
        await this.randomDelay(100, 300);
        await page.keyboard.press('Backspace');
        await this.randomDelay(100, 200);
      }

      // Type the correct character
      await page.keyboard.type(char);

      // Variable typing speed
      const baseDelay = this.randomRange(
        this.config.typingDelay.min,
        this.config.typingDelay.max
      );

      // Slower for uppercase, faster for common letters
      let delay = baseDelay;
      if (char === char.toUpperCase() && char !== char.toLowerCase()) {
        delay *= 1.5; // Slower for shift+letter
      }
      if (['e', 't', 'a', 'o', 'i', 'n'].includes(char.toLowerCase())) {
        delay *= 0.8; // Faster for common letters
      }

      await this.randomDelay(delay * 0.8, delay * 1.2);
    }

    // Pause after typing
    await this.randomDelay(300, 700);
  }

  /**
   * Scroll page with human-like behavior using quantized wheel steps
   */
  async scrollHumanLike(page: Page, direction: 'down' | 'up' = 'down'): Promise<void> {
    if (!this.config.randomScrolling) {
      await page.evaluate((dir) => {
        window.scrollBy(0, dir === 'down' ? 500 : -500);
      }, direction);
      return;
    }

    const scrolls = Math.floor(Math.random() * 3) + 2; // 2-5 scroll actions

    for (let i = 0; i < scrolls; i++) {
      // Mouse wheel scrolling is quantized to ~120 pixel steps (or multiples)
      // Real users typically scroll 1-3 wheel "clicks" at a time
      const wheelClicks = Math.floor(Math.random() * 3) + 1; // 1-3 clicks
      const pixelsPerClick = 120; // Standard wheel delta

      // Add slight variance to simulate different wheel sensitivities
      const variance = Math.random() * 20 - 10; // ±10 pixels
      const amount = (wheelClicks * pixelsPerClick) + variance;
      const delta = direction === 'down' ? amount : -amount;

      // Use mouse wheel for more realistic scrolling
      await page.mouse.wheel(0, delta);

      // Variable delay between scrolls
      await this.randomDelay(
        this.config.scrollDelay.min,
        this.config.scrollDelay.max
      );

      // Occasionally pause (reading content)
      if (Math.random() < 0.3) {
        await this.randomDelay(1000, 3000);
      }
    }
  }

  /**
   * Simulate reading behavior by scrolling through page
   */
  async simulateReading(page: Page): Promise<void> {
    const scrollCount = this.randomRange(3, 7);

    for (let i = 0; i < scrollCount; i++) {
      await this.scrollHumanLike(page, 'down');

      // Random reading pause
      await this.randomDelay(1000, 4000);

      // Occasionally scroll back up (re-reading)
      if (Math.random() < 0.2) {
        await this.scrollHumanLike(page, 'up');
        await this.randomDelay(500, 1500);
      }
    }
  }

  /**
   * Simulate idle time (user reading or thinking)
   */
  async simulateIdle(page: Page): Promise<void> {
    if (!this.config.randomPageDwell) return;

    const idleTime = this.randomRange(2000, 8000);

    // During idle, occasionally move mouse slightly
    const movements = Math.floor(idleTime / 2000);

    for (let i = 0; i < movements; i++) {
      await this.randomDelay(1000, 2500);

      // Small random mouse movement
      await page.mouse.move(
        this.randomRange(100, 800),
        this.randomRange(100, 600)
      );
    }
  }

  /**
   * Hover over element with human-like movement
   */
  async hoverHumanLike(page: Page, selector: string): Promise<void> {
    const element = await page.locator(selector).first();
    const box = await element.boundingBox();

    if (!box) {
      throw new Error(`Element not found: ${selector}`);
    }

    const targetX = box.x + box.width / 2;
    const targetY = box.y + box.height / 2;

    const fromX = targetX - this.randomRange(50, 150);
    const fromY = targetY - this.randomRange(50, 150);

    await this.moveMouseHumanLike(page, fromX, fromY, targetX, targetY);
    await this.randomDelay(200, 800);
  }

  /**
   * Wait for page load with random delay
   */
  async waitForPageLoad(page: Page): Promise<void> {
    await page.waitForLoadState('domcontentloaded');

    const delay = this.randomRange(
      this.config.pageLoadDelay.min,
      this.config.pageLoadDelay.max
    );

    await this.randomDelay(delay * 0.8, delay * 1.2);
  }

  /**
   * Random delay within range
   */
  async randomDelay(min: number, max: number): Promise<void> {
    const delay = this.randomRange(min, max);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Get random number within range
   */
  private randomRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Simulate form filling with human behavior
   */
  async fillFormHumanLike(
    page: Page,
    fields: { selector: string; value: string }[]
  ): Promise<void> {
    for (const field of fields) {
      // Click on field
      await this.clickHumanLike(page, field.selector);

      // Small pause before typing
      await this.randomDelay(200, 500);

      // Type with human-like behavior
      await this.typeHumanLike(page, field.selector, field.value);

      // Pause between fields
      await this.randomDelay(500, 1500);
    }
  }

  /**
   * Simulate mouse jiggle (common human behavior when thinking)
   */
  async mouseJiggle(page: Page, duration: number = 2000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < duration) {
      const currentPos = await page.evaluate(() => ({ x: 0, y: 0 })); // Approximate

      await page.mouse.move(
        currentPos.x + this.randomRange(-10, 10),
        currentPos.y + this.randomRange(-10, 10)
      );

      await this.randomDelay(100, 300);
    }
  }

  /**
   * Simulate tab switching behavior
   */
  async simulateTabSwitch(page: Page): Promise<void> {
    // Minimize/hide page to simulate tab switch
    await page.evaluate(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await this.randomDelay(2000, 10000);

    // Return focus
    await page.evaluate(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
  }
}
