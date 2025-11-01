import type { BrowserContext } from 'playwright';
import pino from 'pino';

const logger = pino({ name: 'battery-spoof' });

/**
 * Battery status profile
 */
export interface BatteryProfile {
  charging: boolean;
  chargingTime: number; // seconds until fully charged (Infinity if not charging)
  dischargingTime: number; // seconds until empty (Infinity if charging)
  level: number; // 0.0 to 1.0
}

/**
 * Platform-specific battery profiles
 */
export const BATTERY_PROFILES: Record<string, BatteryProfile[]> = {
  'Win32': [
    // Laptop plugged in, high battery
    {
      charging: true,
      chargingTime: 0,
      dischargingTime: Infinity,
      level: 0.95,
    },
    // Laptop on battery, moderate
    {
      charging: false,
      chargingTime: Infinity,
      dischargingTime: 14400, // ~4 hours
      level: 0.72,
    },
    // Laptop charging, medium battery
    {
      charging: true,
      chargingTime: 3600, // 1 hour to full
      dischargingTime: Infinity,
      level: 0.58,
    },
    // Laptop on battery, lower
    {
      charging: false,
      chargingTime: Infinity,
      dischargingTime: 7200, // 2 hours
      level: 0.45,
    },
  ],
  'MacIntel': [
    // MacBook plugged in, fully charged
    {
      charging: true,
      chargingTime: 0,
      dischargingTime: Infinity,
      level: 1.0,
    },
    // MacBook on battery, good
    {
      charging: false,
      chargingTime: Infinity,
      dischargingTime: 21600, // 6 hours (MacBooks have good battery)
      level: 0.83,
    },
    // MacBook charging, medium
    {
      charging: true,
      chargingTime: 2400, // 40 minutes
      dischargingTime: Infinity,
      level: 0.62,
    },
    // MacBook on battery, moderate
    {
      charging: false,
      chargingTime: Infinity,
      dischargingTime: 10800, // 3 hours
      level: 0.55,
    },
  ],
  'Linux x86_64': [
    // Desktop (no battery - most common for Linux)
    {
      charging: true,
      chargingTime: 0,
      dischargingTime: Infinity,
      level: 1.0,
    },
    // Linux laptop on battery
    {
      charging: false,
      chargingTime: Infinity,
      dischargingTime: 12600, // ~3.5 hours
      level: 0.68,
    },
    // Linux laptop charging
    {
      charging: true,
      chargingTime: 4200, // 70 minutes
      dischargingTime: Infinity,
      level: 0.51,
    },
  ],
};

/**
 * Battery API Spoof Manager
 */
export class BatteryManager {
  private platform: string;
  private batteryProfile: BatteryProfile;
  private mode: 'realistic' | 'desktop' | 'remove';

  constructor(
    platform: string = 'Win32',
    mode: 'realistic' | 'desktop' | 'remove' = 'realistic',
    customProfile?: BatteryProfile
  ) {
    this.platform = platform;
    this.mode = mode;

    if (customProfile) {
      this.batteryProfile = customProfile;
    } else if (mode === 'desktop') {
      // Desktop mode: always charging, 100% battery
      this.batteryProfile = {
        charging: true,
        chargingTime: 0,
        dischargingTime: Infinity,
        level: 1.0,
      };
    } else {
      // Realistic mode: random battery profile for platform
      const profiles = BATTERY_PROFILES[platform] || BATTERY_PROFILES['Win32'];
      this.batteryProfile = profiles[Math.floor(Math.random() * profiles.length)];
    }

    // Add some variance to level (±5%)
    if (mode === 'realistic') {
      const variance = (Math.random() - 0.5) * 0.1;
      this.batteryProfile.level = Math.max(0, Math.min(1, this.batteryProfile.level + variance));
    }
  }

  /**
   * Inject battery API spoofing into browser context
   */
  async injectBatterySpoofing(context: BrowserContext): Promise<void> {
    const mode = this.mode;
    const batteryProfile = this.batteryProfile;

    await context.addInitScript(
      ({ mode, battery }: { mode: string; battery: BatteryProfile }) => {
        if (mode === 'remove') {
          // Remove battery API entirely (common for desktops)
          Object.defineProperty(navigator, 'getBattery', {
            get: () => undefined,
            configurable: true,
          });
          return;
        }

        // Mock BatteryManager object
        const mockBattery = {
          charging: battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime,
          level: battery.level,
          onchargingchange: null,
          onchargingtimechange: null,
          ondischargingtimechange: null,
          onlevelchange: null,
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => true,
        };

        // Override navigator.getBattery()
        Object.defineProperty(navigator, 'getBattery', {
          value: async () => {
            return Promise.resolve(mockBattery);
          },
          configurable: true,
        });

        // For older browsers that had direct battery property
        if ('battery' in navigator || 'mozBattery' in navigator || 'webkitBattery' in navigator) {
          Object.defineProperty(navigator, 'battery', {
            get: () => mockBattery,
            configurable: true,
          });

          Object.defineProperty(navigator, 'mozBattery', {
            get: () => mockBattery,
            configurable: true,
          });

          Object.defineProperty(navigator, 'webkitBattery', {
            get: () => mockBattery,
            configurable: true,
          });
        }
      },
      { mode, battery: batteryProfile }
    );

    logger.info(
      {
        platform: this.platform,
        mode,
        charging: batteryProfile.charging,
        level: Math.round(batteryProfile.level * 100) + '%',
      },
      'Battery API spoofing injected'
    );
  }

  /**
   * Get current battery profile
   */
  getBatteryProfile(): BatteryProfile {
    return { ...this.batteryProfile };
  }

  /**
   * Simulate battery drainage over time
   */
  simulateDrainage(elapsedSeconds: number): BatteryProfile {
    const profile = { ...this.batteryProfile };

    if (!profile.charging && profile.level > 0) {
      // Typical laptop drains ~10-20% per hour during browsing
      const drainRatePerSecond = (0.15 / 3600); // 15% per hour average
      const drainAmount = drainRatePerSecond * elapsedSeconds;

      profile.level = Math.max(0, profile.level - drainAmount);

      // Update discharging time based on new level
      if (profile.level > 0) {
        profile.dischargingTime = Math.floor((profile.level / drainRatePerSecond));
      } else {
        profile.dischargingTime = 0;
      }
    }

    if (profile.charging && profile.level < 1.0) {
      // Typical laptop charges ~25-40% per hour
      const chargeRatePerSecond = (0.30 / 3600); // 30% per hour average
      const chargeAmount = chargeRatePerSecond * elapsedSeconds;

      profile.level = Math.min(1.0, profile.level + chargeAmount);

      // Update charging time based on new level
      if (profile.level < 1.0) {
        profile.chargingTime = Math.floor(((1.0 - profile.level) / chargeRatePerSecond));
      } else {
        profile.chargingTime = 0;
      }
    }

    return profile;
  }

  /**
   * Check if battery profile is realistic
   */
  static validateBatteryProfile(profile: BatteryProfile): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Level should be between 0 and 1
    if (profile.level < 0 || profile.level > 1) {
      errors.push(`Battery level out of range: ${profile.level}`);
    }

    // If charging, chargingTime should be finite or 0
    if (profile.charging && profile.chargingTime === Infinity && profile.level < 1.0) {
      errors.push('Charging with infinite charging time but not full');
    }

    // If not charging, dischargingTime should be finite
    if (!profile.charging && profile.dischargingTime === Infinity) {
      errors.push('Not charging but infinite discharging time');
    }

    // If fully charged, chargingTime should be 0
    if (profile.level === 1.0 && profile.charging && profile.chargingTime !== 0) {
      errors.push('Fully charged but chargingTime is not 0');
    }

    // If empty, dischargingTime should be 0
    if (profile.level === 0 && !profile.charging && profile.dischargingTime !== 0) {
      errors.push('Empty battery but dischargingTime is not 0');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Determine best battery mode for platform
   */
  static suggestMode(platform: string): 'realistic' | 'desktop' | 'remove' {
    // Linux desktops commonly don't have batteries
    if (platform === 'Linux x86_64') {
      return Math.random() > 0.6 ? 'desktop' : 'realistic';
    }

    // MacBooks and Windows laptops typically have batteries
    if (platform === 'MacIntel' || platform === 'Win32') {
      return 'realistic';
    }

    return 'realistic';
  }

  /**
   * Get battery information
   */
  static getBatteryInfo(): string {
    const platforms = Object.keys(BATTERY_PROFILES);
    const info: string[] = ['Battery API Spoofing:', '', 'Supported Platforms:'];

    platforms.forEach((platform) => {
      const profiles = BATTERY_PROFILES[platform];
      info.push(`  ${platform}: ${profiles.length} battery profiles`);
      profiles.forEach((profile, idx) => {
        const levelPct = Math.round(profile.level * 100);
        const status = profile.charging ? 'Charging' : 'Discharging';
        info.push(`    ${idx + 1}. ${status} - ${levelPct}%`);
      });
    });

    info.push('');
    info.push('Modes:');
    info.push('  - realistic: Random battery profile for platform');
    info.push('  - desktop: Always plugged in, 100% (common for desktops)');
    info.push('  - remove: Remove battery API entirely');
    info.push('');
    info.push('Features:');
    info.push('  - Platform-specific battery profiles');
    info.push('  - Realistic charging/discharging times');
    info.push('  - Battery level variance (±5%)');
    info.push('  - Mock BatteryManager object');
    info.push('  - Override navigator.getBattery()');
    info.push('  - Support for legacy battery properties');
    info.push('  - Battery drainage simulation over time');

    return info.join('\n');
  }
}
