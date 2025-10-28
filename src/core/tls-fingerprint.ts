/**
 * TLS Fingerprinting Evasion
 *
 * Modern bot detection can identify automation tools by analyzing TLS/SSL handshake
 * characteristics (cipher suites, extensions, curve preferences).
 *
 * This module provides TLS fingerprint randomization to evade such detection.
 */

export interface TLSProfile {
  name: string;
  cipherSuites: string[];
  extensions: number[];
  supportedGroups: number[];
  signatureAlgorithms: number[];
  alpnProtocols: string[];
  versions: number[];
}

/**
 * Common TLS fingerprints that mimic real browsers
 */
export const TLS_PROFILES: Record<string, TLSProfile> = {
  'chrome-120': {
    name: 'Chrome 120',
    cipherSuites: [
      'TLS_AES_128_GCM_SHA256',
      'TLS_AES_256_GCM_SHA384',
      'TLS_CHACHA20_POLY1305_SHA256',
      'TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256',
      'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256',
      'TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384',
      'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384',
      'TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256',
      'TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256',
    ],
    extensions: [0, 10, 11, 13, 16, 23, 27, 35, 43, 45, 51, 65281],
    supportedGroups: [29, 23, 24],
    signatureAlgorithms: [0x0403, 0x0503, 0x0603, 0x0804, 0x0805, 0x0806],
    alpnProtocols: ['h2', 'http/1.1'],
    versions: [0x0304], // TLS 1.3
  },

  'chrome-119': {
    name: 'Chrome 119',
    cipherSuites: [
      'TLS_AES_128_GCM_SHA256',
      'TLS_AES_256_GCM_SHA384',
      'TLS_CHACHA20_POLY1305_SHA256',
      'TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256',
      'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256',
      'TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384',
      'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384',
    ],
    extensions: [0, 10, 11, 13, 16, 23, 27, 35, 43, 45, 51, 65281],
    supportedGroups: [29, 23, 24],
    signatureAlgorithms: [0x0403, 0x0503, 0x0603],
    alpnProtocols: ['h2', 'http/1.1'],
    versions: [0x0304],
  },

  'firefox-120': {
    name: 'Firefox 120',
    cipherSuites: [
      'TLS_AES_128_GCM_SHA256',
      'TLS_CHACHA20_POLY1305_SHA256',
      'TLS_AES_256_GCM_SHA384',
      'TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256',
      'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256',
      'TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256',
      'TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256',
    ],
    extensions: [0, 10, 11, 13, 16, 23, 35, 43, 45, 51],
    supportedGroups: [29, 23, 24, 25],
    signatureAlgorithms: [0x0403, 0x0503, 0x0603, 0x0804, 0x0805, 0x0806],
    alpnProtocols: ['h2', 'http/1.1'],
    versions: [0x0304, 0x0303], // TLS 1.3, 1.2
  },

  'safari-17': {
    name: 'Safari 17',
    cipherSuites: [
      'TLS_AES_128_GCM_SHA256',
      'TLS_AES_256_GCM_SHA384',
      'TLS_CHACHA20_POLY1305_SHA256',
      'TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384',
      'TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256',
    ],
    extensions: [0, 10, 11, 13, 16, 23, 35, 43, 45],
    supportedGroups: [29, 23, 24],
    signatureAlgorithms: [0x0403, 0x0503, 0x0603, 0x0804],
    alpnProtocols: ['h2', 'http/1.1'],
    versions: [0x0304],
  },
};

export class TLSFingerprintManager {
  private currentProfile: TLSProfile;

  constructor(profileName?: string) {
    this.currentProfile = profileName
      ? TLS_PROFILES[profileName] || TLS_PROFILES['chrome-120']
      : TLS_PROFILES['chrome-120'];
  }

  /**
   * Get a random TLS profile
   */
  getRandomProfile(): TLSProfile {
    const profiles = Object.values(TLS_PROFILES);
    const randomIndex = Math.floor(Math.random() * profiles.length);
    this.currentProfile = profiles[randomIndex];
    return this.currentProfile;
  }

  /**
   * Set specific TLS profile
   */
  setProfile(profileName: string): void {
    if (TLS_PROFILES[profileName]) {
      this.currentProfile = TLS_PROFILES[profileName];
    } else {
      throw new Error(`TLS profile '${profileName}' not found`);
    }
  }

  /**
   * Get current TLS profile
   */
  getCurrentProfile(): TLSProfile {
    return this.currentProfile;
  }

  /**
   * Generate TLS client hello options for HTTP clients
   * Note: This is a simplified version - real implementation would require
   * low-level network control (e.g., using curl-impersonate or similar)
   */
  getTLSOptions(): {
    ciphers: string;
    honorCipherOrder: boolean;
    minVersion: string;
    maxVersion: string;
  } {
    return {
      ciphers: this.currentProfile.cipherSuites.join(':'),
      honorCipherOrder: true,
      minVersion: 'TLSv1.2',
      maxVersion: 'TLSv1.3',
    };
  }

  /**
   * Get JA3 fingerprint (simplified representation)
   * JA3 is a method for creating SSL/TLS client fingerprints
   */
  getJA3Hash(): string {
    // This is a simplified representation
    // Real JA3 calculation is more complex
    const parts = [
      this.currentProfile.versions.join('-'),
      this.currentProfile.cipherSuites.length.toString(),
      this.currentProfile.extensions.join('-'),
      this.currentProfile.supportedGroups.join('-'),
    ];

    return Buffer.from(parts.join(',')).toString('base64').substring(0, 32);
  }

  /**
   * Get recommended HTTP/2 settings to match browser
   */
  getHTTP2Settings(): Record<string, number> {
    return {
      headerTableSize: 65536,
      enablePush: 1,
      initialWindowSize: 6291456,
      maxFrameSize: 16384,
      maxConcurrentStreams: 1000,
      maxHeaderListSize: 262144,
    };
  }

  /**
   * Get ALPN protocols for this profile
   */
  getALPNProtocols(): string[] {
    return this.currentProfile.alpnProtocols;
  }

  /**
   * Randomize profile elements slightly (for additional uniqueness)
   */
  randomizeProfile(): TLSProfile {
    const profile = { ...this.currentProfile };

    // Randomly shuffle cipher suites
    if (Math.random() > 0.5) {
      profile.cipherSuites = this.shuffleArray([...profile.cipherSuites]);
    }

    // Randomly add/remove optional extensions
    if (Math.random() > 0.7) {
      profile.extensions = profile.extensions.filter(() => Math.random() > 0.2);
    }

    this.currentProfile = profile;
    return profile;
  }

  /**
   * Utility: Shuffle array
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Get profile comparison (for testing/debugging)
   */
  compareProfiles(otherProfile: TLSProfile): {
    similarity: number;
    differences: string[];
  } {
    const differences: string[] = [];
    let matches = 0;
    let total = 0;

    // Compare cipher suites
    total++;
    const commonCiphers = this.currentProfile.cipherSuites.filter(c =>
      otherProfile.cipherSuites.includes(c)
    );
    if (commonCiphers.length === this.currentProfile.cipherSuites.length) {
      matches++;
    } else {
      differences.push('Cipher suites differ');
    }

    // Compare extensions
    total++;
    const commonExtensions = this.currentProfile.extensions.filter(e =>
      otherProfile.extensions.includes(e)
    );
    if (commonExtensions.length === this.currentProfile.extensions.length) {
      matches++;
    } else {
      differences.push('Extensions differ');
    }

    // Compare supported groups
    total++;
    const commonGroups = this.currentProfile.supportedGroups.filter(g =>
      otherProfile.supportedGroups.includes(g)
    );
    if (commonGroups.length === this.currentProfile.supportedGroups.length) {
      matches++;
    } else {
      differences.push('Supported groups differ');
    }

    return {
      similarity: (matches / total) * 100,
      differences,
    };
  }

  /**
   * List all available profiles
   */
  static listProfiles(): string[] {
    return Object.keys(TLS_PROFILES);
  }

  /**
   * Get profile details
   */
  static getProfileDetails(profileName: string): TLSProfile | null {
    return TLS_PROFILES[profileName] || null;
  }
}

/**
 * Utility function to create custom TLS profile
 */
export function createCustomTLSProfile(
  name: string,
  options: Partial<TLSProfile>
): TLSProfile {
  const baseProfile = TLS_PROFILES['chrome-120'];

  return {
    name,
    cipherSuites: options.cipherSuites || baseProfile.cipherSuites,
    extensions: options.extensions || baseProfile.extensions,
    supportedGroups: options.supportedGroups || baseProfile.supportedGroups,
    signatureAlgorithms: options.signatureAlgorithms || baseProfile.signatureAlgorithms,
    alpnProtocols: options.alpnProtocols || baseProfile.alpnProtocols,
    versions: options.versions || baseProfile.versions,
  };
}
