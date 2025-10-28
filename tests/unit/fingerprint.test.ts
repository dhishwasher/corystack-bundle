import { describe, it, expect, beforeEach } from 'vitest';
import { FingerprintGenerator } from '../../src/core/fingerprint.js';
import type { FingerprintConfig } from '../../src/types/index.js';

describe('FingerprintGenerator', () => {
  let config: FingerprintConfig;
  let generator: FingerprintGenerator;

  beforeEach(() => {
    config = {
      randomizeCanvas: true,
      randomizeWebGL: true,
      randomizeAudioContext: true,
      randomizeFonts: true,
      randomizeTimezone: true,
      randomizeLocale: true,
      randomizeUserAgent: true,
      randomizeViewport: true,
      hideWebDriver: true,
      hideAutomation: true,
      preventWebRTC: true,
      spoofHardwareConcurrency: true,
      spoofDeviceMemory: true,
      spoofPlatform: true,
      spoofPlugins: true,
    };
    generator = new FingerprintGenerator(config);
  });

  describe('generate()', () => {
    it('should generate a complete fingerprint', () => {
      const fingerprint = generator.generate();

      expect(fingerprint).toHaveProperty('userAgent');
      expect(fingerprint).toHaveProperty('viewport');
      expect(fingerprint).toHaveProperty('platform');
      expect(fingerprint).toHaveProperty('vendor');
      expect(fingerprint).toHaveProperty('language');
      expect(fingerprint).toHaveProperty('timezone');
      expect(fingerprint).toHaveProperty('canvasFingerprint');
      expect(fingerprint).toHaveProperty('webglFingerprint');
      expect(fingerprint).toHaveProperty('audioFingerprint');
      expect(fingerprint).toHaveProperty('fonts');
      expect(fingerprint).toHaveProperty('hardwareConcurrency');
      expect(fingerprint).toHaveProperty('deviceMemory');
      expect(fingerprint).toHaveProperty('plugins');
    });

    it('should generate different fingerprints on each call when randomization enabled', () => {
      const fp1 = generator.generate();
      const fp2 = generator.generate();

      // Should have different values for randomized properties
      // Note: May occasionally be same due to randomness, but very unlikely
      const different =
        fp1.userAgent !== fp2.userAgent ||
        fp1.viewport.width !== fp2.viewport.width ||
        fp1.timezone !== fp2.timezone ||
        fp1.language !== fp2.language;

      expect(different).toBe(true);
    });

    it('should use consistent values when randomization disabled', () => {
      const staticConfig: FingerprintConfig = {
        ...config,
        randomizeUserAgent: false,
        randomizeViewport: false,
        randomizeTimezone: false,
        randomizeLocale: false,
      };

      const staticGenerator = new FingerprintGenerator(staticConfig);
      const fp1 = staticGenerator.generate();
      const fp2 = staticGenerator.generate();

      expect(fp1.userAgent).toBe(fp2.userAgent);
      expect(fp1.viewport).toEqual(fp2.viewport);
      expect(fp1.timezone).toBe(fp2.timezone);
      expect(fp1.language).toBe(fp2.language);
    });

    it('should generate valid viewport dimensions', () => {
      const fingerprint = generator.generate();

      expect(fingerprint.viewport.width).toBeGreaterThan(0);
      expect(fingerprint.viewport.height).toBeGreaterThan(0);
      expect(fingerprint.viewport.width).toBeLessThanOrEqual(4000);
      expect(fingerprint.viewport.height).toBeLessThanOrEqual(3000);
    });

    it('should generate valid hardware specs', () => {
      const fingerprint = generator.generate();

      expect(fingerprint.hardwareConcurrency).toBeGreaterThanOrEqual(4);
      expect(fingerprint.hardwareConcurrency).toBeLessThanOrEqual(16);
      expect([4, 8, 16, 32]).toContain(fingerprint.deviceMemory);
    });

    it('should generate non-empty string fingerprints', () => {
      const fingerprint = generator.generate();

      expect(fingerprint.canvasFingerprint).toBeTruthy();
      expect(fingerprint.webglFingerprint).toBeTruthy();
      expect(fingerprint.audioFingerprint).toBeTruthy();
      expect(typeof fingerprint.canvasFingerprint).toBe('string');
      expect(typeof fingerprint.webglFingerprint).toBe('string');
      expect(typeof fingerprint.audioFingerprint).toBe('string');
    });

    it('should generate font list', () => {
      const fingerprint = generator.generate();

      expect(Array.isArray(fingerprint.fonts)).toBe(true);
      expect(fingerprint.fonts.length).toBeGreaterThan(0);
      fingerprint.fonts.forEach(font => {
        expect(typeof font).toBe('string');
      });
    });

    it('should generate plugin list', () => {
      const fingerprint = generator.generate();

      expect(Array.isArray(fingerprint.plugins)).toBe(true);
      fingerprint.plugins.forEach(plugin => {
        expect(typeof plugin).toBe('string');
      });
    });
  });
});
