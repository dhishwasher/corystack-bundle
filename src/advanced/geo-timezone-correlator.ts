import pino from 'pino';

const logger = pino({ name: 'geo-timezone' });

/**
 * Country code to timezone mapping
 * Maps ISO 3166-1 alpha-2 country codes to IANA timezone identifiers
 */
export const COUNTRY_TO_TIMEZONES: Record<string, string[]> = {
  // North America
  'US': [
    'America/New_York',        // Eastern
    'America/Chicago',         // Central
    'America/Denver',          // Mountain
    'America/Phoenix',         // Arizona (no DST)
    'America/Los_Angeles',     // Pacific
    'America/Anchorage',       // Alaska
    'Pacific/Honolulu',        // Hawaii
  ],
  'CA': [
    'America/Toronto',         // Eastern
    'America/Winnipeg',        // Central
    'America/Edmonton',        // Mountain
    'America/Vancouver',       // Pacific
    'America/Halifax',         // Atlantic
    'America/St_Johns',        // Newfoundland
  ],
  'MX': ['America/Mexico_City', 'America/Tijuana', 'America/Monterrey'],

  // Europe
  'GB': ['Europe/London'],
  'FR': ['Europe/Paris'],
  'DE': ['Europe/Berlin'],
  'IT': ['Europe/Rome'],
  'ES': ['Europe/Madrid'],
  'NL': ['Europe/Amsterdam'],
  'BE': ['Europe/Brussels'],
  'CH': ['Europe/Zurich'],
  'AT': ['Europe/Vienna'],
  'SE': ['Europe/Stockholm'],
  'NO': ['Europe/Oslo'],
  'DK': ['Europe/Copenhagen'],
  'FI': ['Europe/Helsinki'],
  'PL': ['Europe/Warsaw'],
  'CZ': ['Europe/Prague'],
  'PT': ['Europe/Lisbon'],
  'IE': ['Europe/Dublin'],
  'GR': ['Europe/Athens'],

  // Asia-Pacific
  'CN': ['Asia/Shanghai', 'Asia/Urumqi'],
  'JP': ['Asia/Tokyo'],
  'KR': ['Asia/Seoul'],
  'IN': ['Asia/Kolkata'],
  'SG': ['Asia/Singapore'],
  'HK': ['Asia/Hong_Kong'],
  'TW': ['Asia/Taipei'],
  'TH': ['Asia/Bangkok'],
  'MY': ['Asia/Kuala_Lumpur'],
  'PH': ['Asia/Manila'],
  'ID': ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura'],
  'VN': ['Asia/Ho_Chi_Minh'],
  'AU': [
    'Australia/Sydney',        // NSW
    'Australia/Melbourne',     // Victoria
    'Australia/Brisbane',      // Queensland
    'Australia/Perth',         // Western Australia
    'Australia/Adelaide',      // South Australia
  ],
  'NZ': ['Pacific/Auckland'],

  // South America
  'BR': [
    'America/Sao_Paulo',
    'America/Manaus',
    'America/Recife',
  ],
  'AR': ['America/Argentina/Buenos_Aires'],
  'CL': ['America/Santiago'],
  'CO': ['America/Bogota'],
  'PE': ['America/Lima'],
  'VE': ['America/Caracas'],

  // Middle East & Africa
  'AE': ['Asia/Dubai'],
  'SA': ['Asia/Riyadh'],
  'IL': ['Asia/Jerusalem'],
  'TR': ['Europe/Istanbul'],
  'EG': ['Africa/Cairo'],
  'ZA': ['Africa/Johannesburg'],
  'KE': ['Africa/Nairobi'],
  'NG': ['Africa/Lagos'],

  // Eastern Europe & Russia
  'RU': [
    'Europe/Moscow',
    'Asia/Yekaterinburg',
    'Asia/Novosibirsk',
    'Asia/Vladivostok',
  ],
  'UA': ['Europe/Kiev'],
  'RO': ['Europe/Bucharest'],
  'BG': ['Europe/Sofia'],
};

/**
 * City to timezone mapping for more precise correlation
 */
export const CITY_TO_TIMEZONE: Record<string, string> = {
  // US Cities
  'New York': 'America/New_York',
  'Los Angeles': 'America/Los_Angeles',
  'Chicago': 'America/Chicago',
  'Houston': 'America/Chicago',
  'Phoenix': 'America/Phoenix',
  'Philadelphia': 'America/New_York',
  'San Antonio': 'America/Chicago',
  'San Diego': 'America/Los_Angeles',
  'Dallas': 'America/Chicago',
  'San Jose': 'America/Los_Angeles',
  'Austin': 'America/Chicago',
  'Jacksonville': 'America/New_York',
  'Fort Worth': 'America/Chicago',
  'Columbus': 'America/New_York',
  'San Francisco': 'America/Los_Angeles',
  'Charlotte': 'America/New_York',
  'Indianapolis': 'America/New_York',
  'Seattle': 'America/Los_Angeles',
  'Denver': 'America/Denver',
  'Boston': 'America/New_York',
  'Portland': 'America/Los_Angeles',
  'Las Vegas': 'America/Los_Angeles',
  'Miami': 'America/New_York',
  'Atlanta': 'America/New_York',

  // European Cities
  'London': 'Europe/London',
  'Paris': 'Europe/Paris',
  'Berlin': 'Europe/Berlin',
  'Madrid': 'Europe/Madrid',
  'Rome': 'Europe/Rome',
  'Amsterdam': 'Europe/Amsterdam',
  'Brussels': 'Europe/Brussels',
  'Vienna': 'Europe/Vienna',
  'Stockholm': 'Europe/Stockholm',
  'Copenhagen': 'Europe/Copenhagen',
  'Oslo': 'Europe/Oslo',
  'Helsinki': 'Europe/Helsinki',
  'Warsaw': 'Europe/Warsaw',
  'Prague': 'Europe/Prague',
  'Lisbon': 'Europe/Lisbon',
  'Dublin': 'Europe/Dublin',
  'Athens': 'Europe/Athens',
  'Zurich': 'Europe/Zurich',

  // Asian Cities
  'Tokyo': 'Asia/Tokyo',
  'Shanghai': 'Asia/Shanghai',
  'Beijing': 'Asia/Shanghai',
  'Seoul': 'Asia/Seoul',
  'Mumbai': 'Asia/Kolkata',
  'Delhi': 'Asia/Kolkata',
  'Singapore': 'Asia/Singapore',
  'Hong Kong': 'Asia/Hong_Kong',
  'Taipei': 'Asia/Taipei',
  'Bangkok': 'Asia/Bangkok',
  'Jakarta': 'Asia/Jakarta',
  'Manila': 'Asia/Manila',
  'Ho Chi Minh': 'Asia/Ho_Chi_Minh',
  'Kuala Lumpur': 'Asia/Kuala_Lumpur',

  // Australian Cities
  'Sydney': 'Australia/Sydney',
  'Melbourne': 'Australia/Melbourne',
  'Brisbane': 'Australia/Brisbane',
  'Perth': 'Australia/Perth',
  'Adelaide': 'Australia/Adelaide',

  // Other Major Cities
  'Toronto': 'America/Toronto',
  'Vancouver': 'America/Vancouver',
  'Montreal': 'America/Toronto',
  'Mexico City': 'America/Mexico_City',
  'Sao Paulo': 'America/Sao_Paulo',
  'Buenos Aires': 'America/Argentina/Buenos_Aires',
  'Dubai': 'Asia/Dubai',
  'Moscow': 'Europe/Moscow',
  'Istanbul': 'Europe/Istanbul',
};

/**
 * Locale to timezone mapping for consistency
 */
export const LOCALE_TO_COMMON_TIMEZONE: Record<string, string> = {
  'en-US': 'America/New_York',
  'en-GB': 'Europe/London',
  'en-CA': 'America/Toronto',
  'en-AU': 'Australia/Sydney',
  'de-DE': 'Europe/Berlin',
  'fr-FR': 'Europe/Paris',
  'es-ES': 'Europe/Madrid',
  'it-IT': 'Europe/Rome',
  'ja-JP': 'Asia/Tokyo',
  'zh-CN': 'Asia/Shanghai',
  'ko-KR': 'Asia/Seoul',
  'pt-BR': 'America/Sao_Paulo',
  'ru-RU': 'Europe/Moscow',
  'ar-SA': 'Asia/Riyadh',
  'tr-TR': 'Europe/Istanbul',
  'nl-NL': 'Europe/Amsterdam',
  'pl-PL': 'Europe/Warsaw',
  'sv-SE': 'Europe/Stockholm',
};

/**
 * Geographic and Timezone Correlation Manager
 */
export class GeoTimezoneCorrelator {
  /**
   * Get timezone for a country code
   */
  static getTimezoneForCountry(countryCode: string): string | null {
    const timezones = COUNTRY_TO_TIMEZONES[countryCode.toUpperCase()];
    if (!timezones || timezones.length === 0) {
      logger.warn({ countryCode }, 'No timezone found for country');
      return null;
    }

    // Return random timezone from country (for variety)
    return timezones[Math.floor(Math.random() * timezones.length)];
  }

  /**
   * Get timezone for a city
   */
  static getTimezoneForCity(city: string): string | null {
    const timezone = CITY_TO_TIMEZONE[city];
    if (!timezone) {
      logger.warn({ city }, 'No timezone found for city');
      return null;
    }

    return timezone;
  }

  /**
   * Get timezone for a locale
   */
  static getTimezoneForLocale(locale: string): string | null {
    const timezone = LOCALE_TO_COMMON_TIMEZONE[locale];
    if (!timezone) {
      // Try to extract country from locale (e.g., "en-US" -> "US")
      const parts = locale.split('-');
      if (parts.length === 2) {
        return this.getTimezoneForCountry(parts[1]);
      }
      logger.warn({ locale }, 'No timezone found for locale');
      return null;
    }

    return timezone;
  }

  /**
   * Get recommended locale for a timezone
   */
  static getLocaleForTimezone(timezone: string): string {
    // Reverse lookup: find locale that commonly uses this timezone
    for (const [locale, tz] of Object.entries(LOCALE_TO_COMMON_TIMEZONE)) {
      if (tz === timezone) {
        return locale;
      }
    }

    // Fallback: try to infer from timezone name
    if (timezone.startsWith('America/')) {
      return 'en-US';
    } else if (timezone.startsWith('Europe/')) {
      if (timezone.includes('London')) return 'en-GB';
      if (timezone.includes('Paris')) return 'fr-FR';
      if (timezone.includes('Berlin')) return 'de-DE';
      return 'en-GB'; // Default Europe
    } else if (timezone.startsWith('Asia/')) {
      if (timezone.includes('Tokyo')) return 'ja-JP';
      if (timezone.includes('Shanghai') || timezone.includes('Beijing')) return 'zh-CN';
      if (timezone.includes('Seoul')) return 'ko-KR';
      return 'en-US'; // Default Asia
    } else if (timezone.startsWith('Australia/')) {
      return 'en-AU';
    }

    return 'en-US'; // Default fallback
  }

  /**
   * Get correlated timezone and locale for geographic targeting
   */
  static getCorrelatedSettings(options: {
    country?: string;
    city?: string;
    locale?: string;
  }): { timezone: string; locale: string } {
    let timezone: string | null = null;
    let locale: string | null = null;

    // Priority: city > country > locale
    if (options.city) {
      timezone = this.getTimezoneForCity(options.city);
    }

    if (!timezone && options.country) {
      timezone = this.getTimezoneForCountry(options.country);
    }

    if (!timezone && options.locale) {
      timezone = this.getTimezoneForLocale(options.locale);
    }

    // Default timezone
    if (!timezone) {
      timezone = 'America/New_York';
      logger.warn('Using default timezone: America/New_York');
    }

    // Get or infer locale
    if (options.locale) {
      locale = options.locale;
    } else {
      locale = this.getLocaleForTimezone(timezone);
    }

    logger.debug({ timezone, locale, options }, 'Correlated timezone and locale');

    return { timezone, locale };
  }

  /**
   * Validate timezone and locale consistency
   */
  static validateConsistency(timezone: string, locale: string): boolean {
    const expectedLocale = this.getLocaleForTimezone(timezone);
    const expectedTimezone = this.getTimezoneForLocale(locale);

    // Check if they're consistent
    const consistent = expectedLocale === locale || expectedTimezone === timezone;

    if (!consistent) {
      logger.warn(
        { timezone, locale, expectedLocale, expectedTimezone },
        'Timezone and locale may be inconsistent'
      );
    }

    return consistent;
  }

  /**
   * Get all supported countries
   */
  static getSupportedCountries(): string[] {
    return Object.keys(COUNTRY_TO_TIMEZONES);
  }

  /**
   * Get all supported cities
   */
  static getSupportedCities(): string[] {
    return Object.keys(CITY_TO_TIMEZONE);
  }

  /**
   * Get timezone offset in minutes
   */
  static getTimezoneOffset(timezone: string): number {
    try {
      const now = new Date();
      const localTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
      const utcTime = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
      return Math.round((localTime.getTime() - utcTime.getTime()) / 60000);
    } catch (error) {
      logger.error({ error, timezone }, 'Failed to get timezone offset');
      return 0;
    }
  }

  /**
   * Get current time in timezone
   */
  static getCurrentTimeInTimezone(timezone: string): string {
    try {
      return new Date().toLocaleString('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    } catch (error) {
      logger.error({ error, timezone }, 'Failed to get current time');
      return new Date().toISOString();
    }
  }
}
