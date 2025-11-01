import { promises as fs } from 'fs';
import path from 'path';
import type { BrowserContext } from 'playwright';
import type { GeneratedFingerprint } from '../types/index.js';
import pino from 'pino';

const logger = pino({ name: 'profile-recycling' });

/**
 * Browser profile data
 */
export interface BrowserProfile {
  id: string;
  name: string;
  fingerprint: GeneratedFingerprint;
  storageState: string; // Path to storage state file
  created: number;
  lastUsed: number;
  usageCount: number;
  metadata: {
    domain?: string; // Primary domain this profile is used for
    purpose?: string; // e.g., "social_media", "ecommerce", "testing"
    tags?: string[];
    notes?: string;
  };
}

/**
 * Profile recycling configuration
 */
export interface ProfileRecyclingConfig {
  profilesDir: string;
  storageDir: string;
  maxProfiles?: number;
  autoCleanup?: boolean; // Remove profiles older than maxAge
  maxAge?: number; // Days before profile is considered old
}

/**
 * Browser Profile Recycling Manager
 * Allows reusing browser profiles for consistent identity across sessions
 */
export class ProfileRecyclingManager {
  private config: ProfileRecyclingConfig;
  private profiles: Map<string, BrowserProfile> = new Map();

  constructor(config: ProfileRecyclingConfig) {
    this.config = {
      maxProfiles: 100,
      autoCleanup: true,
      maxAge: 30, // 30 days
      ...config,
    };
  }

  /**
   * Initialize profile manager
   */
  async init(): Promise<void> {
    try {
      await fs.mkdir(this.config.profilesDir, { recursive: true });
      await fs.mkdir(this.config.storageDir, { recursive: true });
      await this.loadProfiles();

      if (this.config.autoCleanup) {
        await this.cleanupOldProfiles();
      }

      logger.info({ count: this.profiles.size }, 'Profile recycling manager initialized');
    } catch (error) {
      logger.error({ error }, 'Failed to initialize profile manager');
      throw error;
    }
  }

  /**
   * Create a new browser profile from a session
   */
  async createProfile(
    name: string,
    fingerprint: GeneratedFingerprint,
    context: BrowserContext,
    metadata: BrowserProfile['metadata'] = {}
  ): Promise<BrowserProfile> {
    const profileId = this.generateProfileId();
    const storageStatePath = path.join(this.config.storageDir, `${profileId}-storage.json`);

    // Save browser context state (cookies, local storage, etc.)
    await context.storageState({ path: storageStatePath });

    const profile: BrowserProfile = {
      id: profileId,
      name,
      fingerprint,
      storageState: storageStatePath,
      created: Date.now(),
      lastUsed: Date.now(),
      usageCount: 1,
      metadata,
    };

    this.profiles.set(profileId, profile);
    await this.saveProfile(profile);

    logger.info({ profileId, name }, 'Browser profile created');
    return profile;
  }

  /**
   * Load an existing profile
   */
  async loadProfile(idOrName: string): Promise<BrowserProfile | null> {
    let profile = this.profiles.get(idOrName);

    if (!profile) {
      // Try to find by name
      profile = Array.from(this.profiles.values()).find((p) => p.name === idOrName);
    }

    if (profile) {
      profile.lastUsed = Date.now();
      profile.usageCount++;
      await this.saveProfile(profile);

      logger.info({ profileId: profile.id, name: profile.name, usageCount: profile.usageCount }, 'Browser profile loaded');
      return profile;
    }

    return null;
  }

  /**
   * Apply profile to a browser context
   */
  async applyProfileToContext(profile: BrowserProfile, context: BrowserContext): Promise<void> {
    try {
      // Verify storage state file exists
      await fs.access(profile.storageState);

      // Note: Storage state must be applied during context creation
      // This method is for reference - actual application should happen in SessionManager
      logger.debug({ profileId: profile.id }, 'Profile storage state verified');
    } catch (error) {
      logger.warn({ profileId: profile.id, error }, 'Profile storage state file not found');
      throw new Error(`Profile storage state not found: ${profile.storageState}`);
    }
  }

  /**
   * Update profile after use
   */
  async updateProfile(profileId: string, context: BrowserContext): Promise<void> {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      throw new Error(`Profile not found: ${profileId}`);
    }

    // Update storage state
    await context.storageState({ path: profile.storageState });

    profile.lastUsed = Date.now();
    await this.saveProfile(profile);

    logger.debug({ profileId }, 'Browser profile updated');
  }

  /**
   * Delete a profile
   */
  async deleteProfile(profileId: string): Promise<void> {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      throw new Error(`Profile not found: ${profileId}`);
    }

    this.profiles.delete(profileId);

    // Delete profile metadata file
    const profilePath = path.join(this.config.profilesDir, `${profileId}.json`);
    try {
      await fs.unlink(profilePath);
    } catch (error) {
      logger.warn({ error, profileId }, 'Failed to delete profile metadata file');
    }

    // Delete storage state file
    try {
      await fs.unlink(profile.storageState);
    } catch (error) {
      logger.warn({ error, profileId }, 'Failed to delete storage state file');
    }

    logger.info({ profileId, name: profile.name }, 'Browser profile deleted');
  }

  /**
   * List all profiles
   */
  listProfiles(filter?: { domain?: string; purpose?: string; tag?: string }): BrowserProfile[] {
    let profiles = Array.from(this.profiles.values());

    if (filter) {
      profiles = profiles.filter((profile) => {
        if (filter.domain && profile.metadata.domain !== filter.domain) return false;
        if (filter.purpose && profile.metadata.purpose !== filter.purpose) return false;
        if (filter.tag && !profile.metadata.tags?.includes(filter.tag)) return false;
        return true;
      });
    }

    return profiles.sort((a, b) => b.lastUsed - a.lastUsed);
  }

  /**
   * Get profile statistics
   */
  getProfileStats(profileId: string): {
    age: number; // days
    lastUsed: Date;
    usageCount: number;
    domain: string | undefined;
  } | null {
    const profile = this.profiles.get(profileId);
    if (!profile) return null;

    const ageMs = Date.now() - profile.created;
    const ageDays = ageMs / (1000 * 60 * 60 * 24);

    return {
      age: Math.floor(ageDays),
      lastUsed: new Date(profile.lastUsed),
      usageCount: profile.usageCount,
      domain: profile.metadata.domain,
    };
  }

  /**
   * Get a random profile (useful for rotation)
   */
  getRandomProfile(filter?: { domain?: string; purpose?: string }): BrowserProfile | null {
    const profiles = this.listProfiles(filter);
    if (profiles.length === 0) return null;

    return profiles[Math.floor(Math.random() * profiles.length)];
  }

  /**
   * Get least recently used profile (for rotation)
   */
  getLRUProfile(filter?: { domain?: string; purpose?: string }): BrowserProfile | null {
    const profiles = this.listProfiles(filter);
    if (profiles.length === 0) return null;

    return profiles.sort((a, b) => a.lastUsed - b.lastUsed)[0];
  }

  /**
   * Cleanup old profiles
   */
  async cleanupOldProfiles(): Promise<number> {
    const maxAgeMs = this.config.maxAge! * 24 * 60 * 60 * 1000;
    const now = Date.now();
    let deletedCount = 0;

    for (const profile of this.profiles.values()) {
      const age = now - profile.lastUsed;
      if (age > maxAgeMs) {
        await this.deleteProfile(profile.id);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      logger.info({ deletedCount, maxAgeDays: this.config.maxAge }, 'Cleaned up old profiles');
    }

    // If still over max profiles, delete oldest
    if (this.profiles.size > this.config.maxProfiles!) {
      const sortedProfiles = Array.from(this.profiles.values()).sort((a, b) => a.lastUsed - b.lastUsed);
      const toDelete = sortedProfiles.slice(0, this.profiles.size - this.config.maxProfiles!);

      for (const profile of toDelete) {
        await this.deleteProfile(profile.id);
        deletedCount++;
      }

      logger.info({ deletedCount, maxProfiles: this.config.maxProfiles }, 'Cleaned up excess profiles');
    }

    return deletedCount;
  }

  /**
   * Export profile for backup/sharing
   */
  async exportProfile(profileId: string): Promise<{ profile: BrowserProfile; storageState: string }> {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      throw new Error(`Profile not found: ${profileId}`);
    }

    const storageState = await fs.readFile(profile.storageState, 'utf-8');

    return {
      profile,
      storageState,
    };
  }

  /**
   * Import profile from export
   */
  async importProfile(
    profileData: { profile: BrowserProfile; storageState: string },
    newName?: string
  ): Promise<BrowserProfile> {
    const profileId = this.generateProfileId();
    const storageStatePath = path.join(this.config.storageDir, `${profileId}-storage.json`);

    // Write storage state
    await fs.writeFile(storageStatePath, profileData.storageState, 'utf-8');

    const profile: BrowserProfile = {
      ...profileData.profile,
      id: profileId,
      name: newName || profileData.profile.name,
      storageState: storageStatePath,
      created: Date.now(),
      lastUsed: Date.now(),
      usageCount: 0,
    };

    this.profiles.set(profileId, profile);
    await this.saveProfile(profile);

    logger.info({ profileId, name: profile.name }, 'Browser profile imported');
    return profile;
  }

  /**
   * Save profile metadata to disk
   */
  private async saveProfile(profile: BrowserProfile): Promise<void> {
    const profilePath = path.join(this.config.profilesDir, `${profile.id}.json`);

    try {
      await fs.writeFile(profilePath, JSON.stringify(profile, null, 2), 'utf-8');
      logger.debug({ profileId: profile.id }, 'Profile metadata saved');
    } catch (error) {
      logger.error({ error, profileId: profile.id }, 'Failed to save profile metadata');
      throw error;
    }
  }

  /**
   * Load all profiles from disk
   */
  private async loadProfiles(): Promise<void> {
    try {
      const files = await fs.readdir(this.config.profilesDir);
      const jsonFiles = files.filter((f) => f.endsWith('.json'));

      for (const file of jsonFiles) {
        try {
          const profilePath = path.join(this.config.profilesDir, file);
          const content = await fs.readFile(profilePath, 'utf-8');
          const profile: BrowserProfile = JSON.parse(content);

          // Verify storage state exists
          try {
            await fs.access(profile.storageState);
            this.profiles.set(profile.id, profile);
          } catch {
            logger.warn({ profileId: profile.id }, 'Profile storage state missing, skipping');
            // Optionally delete orphaned metadata
            await fs.unlink(profilePath);
          }
        } catch (error) {
          logger.warn({ error, file }, 'Failed to load profile');
        }
      }

      logger.info({ count: this.profiles.size }, 'Loaded browser profiles');
    } catch (error) {
      logger.warn({ error }, 'No existing profiles found');
    }
  }

  /**
   * Generate unique profile ID
   */
  private generateProfileId(): string {
    return `profile_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Get profile recycling info
   */
  static getProfileInfo(): string {
    const info: string[] = [
      'Browser Profile Recycling:',
      '',
      'Features:',
      '  - Save and reuse browser profiles',
      '  - Maintain cookies, local storage, session data',
      '  - Profile metadata (domain, purpose, tags)',
      '  - Usage statistics and tracking',
      '  - Automatic cleanup of old profiles',
      '  - Profile import/export for backup',
      '  - Profile rotation strategies (random, LRU)',
      '  - Domain-specific profile filtering',
      '',
      'Use Cases:',
      '  - Long-term scraping with consistent identity',
      '  - Maintaining logged-in sessions',
      '  - A/B testing with different user profiles',
      '  - Simulating returning vs new users',
      '  - Profile rotation to avoid detection',
      '',
      'Storage:',
      '  - Profile metadata: JSON files',
      '  - Browser state: Playwright storage state',
      '  - Includes: cookies, localStorage, sessionStorage, indexedDB',
    ];

    return info.join('\n');
  }
}
