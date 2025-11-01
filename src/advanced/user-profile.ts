import type { GeneratedFingerprint } from '../types/index.js';
import { promises as fs } from 'fs';
import path from 'path';
import pino from 'pino';

const logger = pino({ name: 'user-profile' });

export interface UserBehaviorProfile {
  typingSpeed: { min: number; max: number }; // WPM range
  mouseSpeed: number; // Multiplier (0.5-2.0)
  scrollPattern: 'slow' | 'medium' | 'fast';
  readingPauseFrequency: number; // 0-1, how often to pause while scrolling
  typoRate: number; // 0-1, frequency of typing errors
  clickDelay: { min: number; max: number }; // ms before clicking
  preferredHours: number[]; // Hours of day (0-23) when active
  sessionDuration: { min: number; max: number }; // minutes
  pageVisitDepth: { min: number; max: number }; // pages per session
}

export interface UserProfile {
  id: string;
  name: string;
  fingerprint: GeneratedFingerprint;
  behavior: UserBehaviorProfile;
  created: number;
  lastUsed: number;
  usageCount: number;
  metadata: {
    persona?: string; // e.g., "tech_enthusiast", "casual_browser"
    ageGroup?: string;
    interests?: string[];
    notes?: string;
  };
}

export interface ProfileManagerConfig {
  profilesDir: string;
  autoSave: boolean;
  encryptionKey?: string;
}

/**
 * User Profile Manager for behavioral consistency
 */
export class UserProfileManager {
  private config: ProfileManagerConfig;
  private profiles: Map<string, UserProfile> = new Map();
  private currentProfile: UserProfile | null = null;

  constructor(config: ProfileManagerConfig) {
    this.config = {
      ...config,
      autoSave: config.autoSave ?? true,
    };
  }

  /**
   * Initialize and load existing profiles
   */
  async init(): Promise<void> {
    try {
      await fs.mkdir(this.config.profilesDir, { recursive: true });
      await this.loadProfiles();
      logger.info({ count: this.profiles.size }, 'User profiles loaded');
    } catch (error) {
      logger.error({ error }, 'Failed to initialize profile manager');
      throw error;
    }
  }

  /**
   * Create new user profile with realistic behavioral patterns
   */
  async createProfile(
    name: string,
    fingerprint: GeneratedFingerprint,
    persona?: string
  ): Promise<UserProfile> {
    const profile: UserProfile = {
      id: this.generateProfileId(),
      name,
      fingerprint,
      behavior: this.generateBehaviorProfile(persona),
      created: Date.now(),
      lastUsed: Date.now(),
      usageCount: 0,
      metadata: {
        persona,
      },
    };

    this.profiles.set(profile.id, profile);

    if (this.config.autoSave) {
      await this.saveProfile(profile);
    }

    logger.info({ profileId: profile.id, name, persona }, 'Created new user profile');
    return profile;
  }

  /**
   * Generate realistic behavior profile based on persona
   */
  private generateBehaviorProfile(persona?: string): UserBehaviorProfile {
    switch (persona) {
      case 'tech_enthusiast':
        return {
          typingSpeed: { min: 60, max: 90 }, // Fast typer
          mouseSpeed: 1.3,
          scrollPattern: 'fast',
          readingPauseFrequency: 0.2, // Quick scanner
          typoRate: 0.03,
          clickDelay: { min: 100, max: 300 },
          preferredHours: [9, 10, 11, 14, 15, 16, 19, 20, 21, 22], // Business hours + evening
          sessionDuration: { min: 10, max: 45 },
          pageVisitDepth: { min: 5, max: 20 },
        };

      case 'casual_browser':
        return {
          typingSpeed: { min: 30, max: 50 }, // Average typer
          mouseSpeed: 0.9,
          scrollPattern: 'medium',
          readingPauseFrequency: 0.5, // Moderate reading
          typoRate: 0.05,
          clickDelay: { min: 200, max: 600 },
          preferredHours: [10, 11, 12, 18, 19, 20, 21], // Lunch + evening
          sessionDuration: { min: 5, max: 20 },
          pageVisitDepth: { min: 2, max: 8 },
        };

      case 'elderly_user':
        return {
          typingSpeed: { min: 15, max: 30 }, // Slow typer
          mouseSpeed: 0.6,
          scrollPattern: 'slow',
          readingPauseFrequency: 0.7, // Thorough reader
          typoRate: 0.08,
          clickDelay: { min: 400, max: 1000 },
          preferredHours: [9, 10, 11, 14, 15, 16], // Morning + afternoon
          sessionDuration: { min: 15, max: 60 },
          pageVisitDepth: { min: 2, max: 6 },
        };

      case 'power_user':
        return {
          typingSpeed: { min: 70, max: 110 }, // Very fast typer
          mouseSpeed: 1.5,
          scrollPattern: 'fast',
          readingPauseFrequency: 0.1, // Minimal pauses
          typoRate: 0.02,
          clickDelay: { min: 50, max: 200 },
          preferredHours: [8, 9, 10, 11, 13, 14, 15, 16, 17], // Full work day
          sessionDuration: { min: 20, max: 90 },
          pageVisitDepth: { min: 10, max: 30 },
        };

      case 'mobile_user':
        return {
          typingSpeed: { min: 25, max: 45 }, // Slower on mobile
          mouseSpeed: 0.7,
          scrollPattern: 'medium',
          readingPauseFrequency: 0.4,
          typoRate: 0.08, // Higher typo rate on mobile
          clickDelay: { min: 150, max: 500 },
          preferredHours: Array.from({ length: 24 }, (_, i) => i), // All hours
          sessionDuration: { min: 3, max: 15 },
          pageVisitDepth: { min: 2, max: 6 },
        };

      default: // 'average_user'
        return {
          typingSpeed: { min: 40, max: 65 },
          mouseSpeed: 1.0,
          scrollPattern: 'medium',
          readingPauseFrequency: 0.4,
          typoRate: 0.05,
          clickDelay: { min: 150, max: 500 },
          preferredHours: [9, 10, 11, 12, 13, 14, 15, 16, 17, 19, 20],
          sessionDuration: { min: 10, max: 30 },
          pageVisitDepth: { min: 3, max: 12 },
        };
    }
  }

  /**
   * Load profile by ID or name
   */
  async loadProfile(idOrName: string): Promise<UserProfile | null> {
    let profile = this.profiles.get(idOrName);

    if (!profile) {
      // Try to find by name
      profile = Array.from(this.profiles.values()).find((p) => p.name === idOrName);
    }

    if (profile) {
      profile.lastUsed = Date.now();
      profile.usageCount++;
      this.currentProfile = profile;

      if (this.config.autoSave) {
        await this.saveProfile(profile);
      }

      logger.info({ profileId: profile.id, name: profile.name }, 'Loaded user profile');
      return profile;
    }

    return null;
  }

  /**
   * Get current active profile
   */
  getCurrentProfile(): UserProfile | null {
    return this.currentProfile;
  }

  /**
   * Update profile's fingerprint
   */
  async updateFingerprint(profileId: string, fingerprint: GeneratedFingerprint): Promise<void> {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      throw new Error(`Profile not found: ${profileId}`);
    }

    profile.fingerprint = fingerprint;

    if (this.config.autoSave) {
      await this.saveProfile(profile);
    }

    logger.info({ profileId }, 'Updated profile fingerprint');
  }

  /**
   * Update profile's behavior settings
   */
  async updateBehavior(profileId: string, behavior: Partial<UserBehaviorProfile>): Promise<void> {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      throw new Error(`Profile not found: ${profileId}`);
    }

    profile.behavior = {
      ...profile.behavior,
      ...behavior,
    };

    if (this.config.autoSave) {
      await this.saveProfile(profile);
    }

    logger.info({ profileId }, 'Updated profile behavior');
  }

  /**
   * Delete profile
   */
  async deleteProfile(profileId: string): Promise<void> {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      throw new Error(`Profile not found: ${profileId}`);
    }

    this.profiles.delete(profileId);

    const profilePath = path.join(this.config.profilesDir, `${profileId}.json`);
    try {
      await fs.unlink(profilePath);
      logger.info({ profileId }, 'Deleted user profile');
    } catch (error) {
      logger.error({ error, profileId }, 'Failed to delete profile file');
    }

    if (this.currentProfile?.id === profileId) {
      this.currentProfile = null;
    }
  }

  /**
   * List all profiles
   */
  listProfiles(): UserProfile[] {
    return Array.from(this.profiles.values()).sort((a, b) => b.lastUsed - a.lastUsed);
  }

  /**
   * Get profile statistics
   */
  getProfileStats(profileId: string): {
    totalUsage: number;
    lastUsed: Date;
    averageSessionDuration: number;
    created: Date;
  } | null {
    const profile = this.profiles.get(profileId);
    if (!profile) return null;

    return {
      totalUsage: profile.usageCount,
      lastUsed: new Date(profile.lastUsed),
      averageSessionDuration:
        (profile.behavior.sessionDuration.min + profile.behavior.sessionDuration.max) / 2,
      created: new Date(profile.created),
    };
  }

  /**
   * Check if current time matches profile's preferred hours
   */
  isPreferredTime(profile: UserProfile): boolean {
    const currentHour = new Date().getHours();
    return profile.behavior.preferredHours.includes(currentHour);
  }

  /**
   * Get typing delay based on profile
   */
  getTypingDelay(profile: UserProfile): number {
    const wpm = this.randomInRange(profile.behavior.typingSpeed.min, profile.behavior.typingSpeed.max);
    // Convert WPM to ms per character (assuming 5 chars per word)
    return (60 * 1000) / (wpm * 5);
  }

  /**
   * Check if should make a typo based on profile
   */
  shouldMakeTypo(profile: UserProfile): boolean {
    return Math.random() < profile.behavior.typoRate;
  }

  /**
   * Get click delay based on profile
   */
  getClickDelay(profile: UserProfile): number {
    return this.randomInRange(profile.behavior.clickDelay.min, profile.behavior.clickDelay.max);
  }

  /**
   * Save profile to disk
   */
  private async saveProfile(profile: UserProfile): Promise<void> {
    const profilePath = path.join(this.config.profilesDir, `${profile.id}.json`);

    try {
      await fs.writeFile(profilePath, JSON.stringify(profile, null, 2), 'utf-8');
      logger.debug({ profileId: profile.id }, 'Saved profile to disk');
    } catch (error) {
      logger.error({ error, profileId: profile.id }, 'Failed to save profile');
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
        const profilePath = path.join(this.config.profilesDir, file);
        const content = await fs.readFile(profilePath, 'utf-8');
        const profile: UserProfile = JSON.parse(content);
        this.profiles.set(profile.id, profile);
      }
    } catch (error) {
      logger.warn({ error }, 'No existing profiles found or failed to load');
    }
  }

  /**
   * Generate unique profile ID
   */
  private generateProfileId(): string {
    return `profile_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Random number in range
   */
  private randomInRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  /**
   * Export profile for backup/sharing
   */
  async exportProfile(profileId: string): Promise<string> {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      throw new Error(`Profile not found: ${profileId}`);
    }

    return JSON.stringify(profile, null, 2);
  }

  /**
   * Import profile from JSON
   */
  async importProfile(profileJson: string): Promise<UserProfile> {
    const profile: UserProfile = JSON.parse(profileJson);

    // Generate new ID to avoid conflicts
    profile.id = this.generateProfileId();
    profile.created = Date.now();
    profile.lastUsed = Date.now();
    profile.usageCount = 0;

    this.profiles.set(profile.id, profile);

    if (this.config.autoSave) {
      await this.saveProfile(profile);
    }

    logger.info({ profileId: profile.id, name: profile.name }, 'Imported user profile');
    return profile;
  }
}
