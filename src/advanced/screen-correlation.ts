import type { BrowserContext } from 'playwright';
import pino from 'pino';

const logger = pino({ name: 'screen-correlation' });

/**
 * Common screen resolutions by platform
 */
export interface ScreenProfile {
  width: number;
  height: number;
  availWidth: number; // Available width (minus OS UI)
  availHeight: number; // Available height (minus taskbar/dock)
  colorDepth: 24 | 30 | 32;
  pixelDepth: 24 | 30 | 32;
  devicePixelRatio: number;
  orientation: 'landscape' | 'portrait';
  taskbarHeight: number; // Platform-specific taskbar/dock height
}

/**
 * Platform-specific screen profiles
 */
export const SCREEN_PROFILES: Record<string, ScreenProfile[]> = {
  'Win32': [
    // Windows 11 common resolutions
    {
      width: 1920,
      height: 1080,
      availWidth: 1920,
      availHeight: 1040, // 40px taskbar
      colorDepth: 24,
      pixelDepth: 24,
      devicePixelRatio: 1,
      orientation: 'landscape',
      taskbarHeight: 40,
    },
    {
      width: 2560,
      height: 1440,
      availWidth: 2560,
      availHeight: 1400,
      colorDepth: 24,
      pixelDepth: 24,
      devicePixelRatio: 1,
      orientation: 'landscape',
      taskbarHeight: 40,
    },
    {
      width: 1920,
      height: 1080,
      availWidth: 1920,
      availHeight: 1040,
      colorDepth: 24,
      pixelDepth: 24,
      devicePixelRatio: 1.25, // 125% scaling
      orientation: 'landscape',
      taskbarHeight: 40,
    },
    {
      width: 3840,
      height: 2160,
      availWidth: 3840,
      availHeight: 2120,
      colorDepth: 30,
      pixelDepth: 30,
      devicePixelRatio: 1.5, // 150% scaling common on 4K
      orientation: 'landscape',
      taskbarHeight: 40,
    },
    {
      width: 1366,
      height: 768,
      availWidth: 1366,
      availHeight: 728,
      colorDepth: 24,
      pixelDepth: 24,
      devicePixelRatio: 1,
      orientation: 'landscape',
      taskbarHeight: 40,
    },
  ],
  'MacIntel': [
    // macOS Retina displays
    {
      width: 2880,
      height: 1800,
      availWidth: 2880,
      availHeight: 1755, // 45px menu bar + dock space
      colorDepth: 30,
      pixelDepth: 30,
      devicePixelRatio: 2,
      orientation: 'landscape',
      taskbarHeight: 45,
    },
    {
      width: 1680,
      height: 1050,
      availWidth: 1680,
      availHeight: 1005,
      colorDepth: 30,
      pixelDepth: 30,
      devicePixelRatio: 2,
      orientation: 'landscape',
      taskbarHeight: 45,
    },
    {
      width: 1920,
      height: 1080,
      availWidth: 1920,
      availHeight: 1035,
      colorDepth: 24,
      pixelDepth: 24,
      devicePixelRatio: 2,
      orientation: 'landscape',
      taskbarHeight: 45,
    },
    {
      width: 2560,
      height: 1600,
      availWidth: 2560,
      availHeight: 1555,
      colorDepth: 30,
      pixelDepth: 30,
      devicePixelRatio: 2,
      orientation: 'landscape',
      taskbarHeight: 45,
    },
  ],
  'Linux x86_64': [
    {
      width: 1920,
      height: 1080,
      availWidth: 1920,
      availHeight: 1052, // 28px panel (Ubuntu/GNOME)
      colorDepth: 24,
      pixelDepth: 24,
      devicePixelRatio: 1,
      orientation: 'landscape',
      taskbarHeight: 28,
    },
    {
      width: 2560,
      height: 1440,
      availWidth: 2560,
      availHeight: 1412,
      colorDepth: 24,
      pixelDepth: 24,
      devicePixelRatio: 1,
      orientation: 'landscape',
      taskbarHeight: 28,
    },
    {
      width: 1366,
      height: 768,
      availWidth: 1366,
      availHeight: 740,
      colorDepth: 24,
      pixelDepth: 24,
      devicePixelRatio: 1,
      orientation: 'landscape',
      taskbarHeight: 28,
    },
  ],
};

/**
 * Screen Correlation Manager
 */
export class ScreenCorrelationManager {
  private screenProfile: ScreenProfile;
  private platform: string;

  constructor(platform: string = 'Win32', screenProfile?: ScreenProfile) {
    this.platform = platform;

    if (screenProfile) {
      this.screenProfile = screenProfile;
    } else {
      // Select random profile for platform
      const profiles = SCREEN_PROFILES[platform] || SCREEN_PROFILES['Win32'];
      this.screenProfile = profiles[Math.floor(Math.random() * profiles.length)];
    }
  }

  /**
   * Get correlated viewport size (window inner dimensions)
   * Should be smaller than screen size and account for browser chrome
   */
  getCorrelatedViewport(): { width: number; height: number } {
    const { width, availHeight, devicePixelRatio } = this.screenProfile;

    // Browser chrome (address bar, tabs, etc.) typically 100-150px
    const browserChromeHeight = 120 + Math.floor(Math.random() * 30);

    // Most users don't maximize window exactly, leave 0-100px margin
    const windowMargin = Math.floor(Math.random() * 100);

    // Calculate logical viewport dimensions
    const viewportWidth = Math.floor((width - windowMargin) / devicePixelRatio);
    const viewportHeight = Math.floor((availHeight - browserChromeHeight - windowMargin) / devicePixelRatio);

    return {
      width: viewportWidth,
      height: viewportHeight,
    };
  }

  /**
   * Get window outer dimensions (includes browser chrome)
   */
  getOuterDimensions(viewport: { width: number; height: number }): { outerWidth: number; outerHeight: number } {
    const browserChromeHeight = 120 + Math.floor(Math.random() * 30);
    const browserChromeWidth = 16; // Scrollbar + borders

    return {
      outerWidth: viewport.width + browserChromeWidth,
      outerHeight: viewport.height + browserChromeHeight,
    };
  }

  /**
   * Get realistic window position on screen
   */
  getWindowPosition(outerWidth: number, outerHeight: number): { screenX: number; screenY: number } {
    const { width, availHeight } = this.screenProfile;

    // Ensure window position is valid (not off-screen)
    const maxX = width - outerWidth;
    const maxY = availHeight - outerHeight;

    // Most users center or slightly offset windows
    const randomX = Math.floor(Math.random() * Math.min(maxX, 200));
    const randomY = Math.floor(Math.random() * Math.min(maxY, 100));

    return {
      screenX: randomX,
      screenY: randomY,
    };
  }

  /**
   * Inject screen correlation overrides into browser context
   */
  async injectScreenOverrides(context: BrowserContext): Promise<void> {
    const screenProfile = this.screenProfile;
    const viewport = this.getCorrelatedViewport();
    const outerDimensions = this.getOuterDimensions(viewport);
    const windowPosition = this.getWindowPosition(outerDimensions.outerWidth, outerDimensions.outerHeight);

    await context.addInitScript(
      ({
        screen,
        viewport,
        outer,
        position,
      }: {
        screen: ScreenProfile;
        viewport: { width: number; height: number };
        outer: { outerWidth: number; outerHeight: number };
        position: { screenX: number; screenY: number };
      }) => {
        // Override screen properties
        Object.defineProperties(window.screen, {
          width: { get: () => screen.width, configurable: true },
          height: { get: () => screen.height, configurable: true },
          availWidth: { get: () => screen.availWidth, configurable: true },
          availHeight: { get: () => screen.availHeight, configurable: true },
          colorDepth: { get: () => screen.colorDepth, configurable: true },
          pixelDepth: { get: () => screen.pixelDepth, configurable: true },
          availLeft: { get: () => 0, configurable: true },
          availTop: { get: () => 0, configurable: true },
        });

        // Override window dimensions
        Object.defineProperties(window, {
          innerWidth: { get: () => viewport.width, configurable: true },
          innerHeight: { get: () => viewport.height, configurable: true },
          outerWidth: { get: () => outer.outerWidth, configurable: true },
          outerHeight: { get: () => outer.outerHeight, configurable: true },
          screenX: { get: () => position.screenX, configurable: true },
          screenY: { get: () => position.screenY, configurable: true },
          screenLeft: { get: () => position.screenX, configurable: true },
          screenTop: { get: () => position.screenY, configurable: true },
        });

        // Override devicePixelRatio
        Object.defineProperty(window, 'devicePixelRatio', {
          get: () => screen.devicePixelRatio,
          configurable: true,
        });

        // Override screen.orientation
        if (window.screen.orientation) {
          Object.defineProperty(window.screen.orientation, 'type', {
            get: () =>
              screen.orientation === 'portrait' ? 'portrait-primary' : 'landscape-primary',
            configurable: true,
          });

          Object.defineProperty(window.screen.orientation, 'angle', {
            get: () => (screen.orientation === 'portrait' ? 0 : 0),
            configurable: true,
          });
        }

        // Override matchMedia for screen size queries
        const originalMatchMedia = window.matchMedia;
        (window as any).matchMedia = function(query: string) {
          const result = originalMatchMedia.call(window, query);

          // Override specific media queries that might detect screen size
          if (query.includes('min-width') || query.includes('max-width')) {
            const widthMatch = query.match(/(\d+)px/);
            if (widthMatch) {
              const queryWidth = parseInt(widthMatch[1]);
              const matches =
                query.includes('min-width')
                  ? viewport.width >= queryWidth
                  : viewport.width <= queryWidth;

              return {
                ...result,
                matches,
              };
            }
          }

          return result;
        };

        // Override visualViewport if it exists
        if (window.visualViewport) {
          Object.defineProperties(window.visualViewport, {
            width: { get: () => viewport.width, configurable: true },
            height: { get: () => viewport.height, configurable: true },
            scale: { get: () => 1, configurable: true },
            offsetLeft: { get: () => 0, configurable: true },
            offsetTop: { get: () => 0, configurable: true },
            pageLeft: { get: () => window.scrollX || window.pageXOffset, configurable: true },
            pageTop: { get: () => window.scrollY || window.pageYOffset, configurable: true },
          });
        }

        // Ensure document.documentElement client dimensions match
        Object.defineProperties(document.documentElement, {
          clientWidth: {
            get: () => viewport.width,
            configurable: true,
          },
          clientHeight: {
            get: () => viewport.height,
            configurable: true,
          },
        });
      },
      {
        screen: screenProfile,
        viewport,
        outer: outerDimensions,
        position: windowPosition,
      }
    );

    logger.info(
      {
        platform: this.platform,
        screen: `${screenProfile.width}x${screenProfile.height}`,
        viewport: `${viewport.width}x${viewport.height}`,
        dpr: screenProfile.devicePixelRatio,
      },
      'Screen correlation overrides injected'
    );
  }

  /**
   * Get current screen profile
   */
  getScreenProfile(): ScreenProfile {
    return { ...this.screenProfile };
  }

  /**
   * Validate screen/viewport correlation
   */
  static validateCorrelation(screen: ScreenProfile, viewport: { width: number; height: number }): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check viewport doesn't exceed screen
    if (viewport.width > screen.width) {
      errors.push(`Viewport width (${viewport.width}) exceeds screen width (${screen.width})`);
    }

    if (viewport.height > screen.availHeight) {
      errors.push(`Viewport height (${viewport.height}) exceeds available screen height (${screen.availHeight})`);
    }

    // Check availHeight is less than height (OS UI)
    if (screen.availHeight >= screen.height) {
      errors.push(`Available height (${screen.availHeight}) should be less than screen height (${screen.height})`);
    }

    // Check devicePixelRatio is realistic
    if (screen.devicePixelRatio < 0.5 || screen.devicePixelRatio > 3) {
      errors.push(`Unusual devicePixelRatio: ${screen.devicePixelRatio}`);
    }

    // Check color depth is valid
    if (![24, 30, 32].includes(screen.colorDepth)) {
      errors.push(`Invalid colorDepth: ${screen.colorDepth}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get information about screen profiles
   */
  static getScreenInfo(): string {
    const platforms = Object.keys(SCREEN_PROFILES);
    const info: string[] = ['Screen Correlation Defense:', '', 'Supported Platforms:'];

    platforms.forEach((platform) => {
      const profiles = SCREEN_PROFILES[platform];
      info.push(`  ${platform}: ${profiles.length} screen profiles`);
      profiles.forEach((profile, idx) => {
        info.push(
          `    ${idx + 1}. ${profile.width}x${profile.height} @ ${profile.devicePixelRatio}x DPR, ${profile.colorDepth}-bit`
        );
      });
    });

    info.push('');
    info.push('Features:');
    info.push('  - Platform-specific screen resolutions');
    info.push('  - Realistic taskbar/dock height subtraction');
    info.push('  - Correlated viewport/window dimensions');
    info.push('  - Browser chrome height simulation');
    info.push('  - Window position validation');
    info.push('  - devicePixelRatio correlation');
    info.push('  - visualViewport API override');
    info.push('  - matchMedia query consistency');

    return info.join('\n');
  }
}
