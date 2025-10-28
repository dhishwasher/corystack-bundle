/**
 * Input Validation and Sanitization
 * Prevents injection attacks and validates all inputs
 */

import { URL } from 'url';

export class InputValidator {
  /**
   * Validate URL
   */
  static validateURL(url: string): {
    valid: boolean;
    error?: string;
    sanitized?: string;
  } {
    try {
      const parsed = new URL(url);

      // Only allow http and https
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return {
          valid: false,
          error: 'Only HTTP and HTTPS protocols are allowed',
        };
      }

      // Prevent local/private IPs
      if (this.isPrivateIP(parsed.hostname)) {
        return {
          valid: false,
          error: 'Private/local IP addresses are not allowed',
        };
      }

      // Prevent localhost
      if (this.isLocalhost(parsed.hostname)) {
        return {
          valid: false,
          error: 'Localhost is not allowed',
        };
      }

      return {
        valid: true,
        sanitized: parsed.toString(),
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid URL format',
      };
    }
  }

  /**
   * Validate CSS selector
   */
  static validateSelector(selector: string): {
    valid: boolean;
    error?: string;
  } {
    // Prevent script injection
    if (selector.includes('<script') || selector.includes('javascript:')) {
      return {
        valid: false,
        error: 'Script injection detected in selector',
      };
    }

    // Basic length check
    if (selector.length > 1000) {
      return {
        valid: false,
        error: 'Selector too long (max 1000 characters)',
      };
    }

    // Check for valid CSS selector syntax
    try {
      // Simple validation - real browsers would catch invalid selectors anyway
      if (!selector.trim()) {
        return {
          valid: false,
          error: 'Selector cannot be empty',
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid selector syntax',
      };
    }
  }

  /**
   * Validate proxy configuration
   */
  static validateProxy(proxy: {
    type: string;
    host: string;
    port: number;
    username?: string;
    password?: string;
  }): {
    valid: boolean;
    error?: string;
  } {
    // Validate type
    if (!['http', 'https', 'socks4', 'socks5'].includes(proxy.type)) {
      return {
        valid: false,
        error: 'Invalid proxy type',
      };
    }

    // Validate host
    if (!proxy.host || proxy.host.length > 255) {
      return {
        valid: false,
        error: 'Invalid proxy host',
      };
    }

    // Prevent private IPs
    if (this.isPrivateIP(proxy.host)) {
      return {
        valid: false,
        error: 'Private IP addresses are not allowed for proxies',
      };
    }

    // Validate port
    if (proxy.port < 1 || proxy.port > 65535) {
      return {
        valid: false,
        error: 'Invalid proxy port (must be 1-65535)',
      };
    }

    // Validate credentials length
    if (proxy.username && proxy.username.length > 255) {
      return {
        valid: false,
        error: 'Proxy username too long',
      };
    }

    if (proxy.password && proxy.password.length > 255) {
      return {
        valid: false,
        error: 'Proxy password too long',
      };
    }

    return { valid: true };
  }

  /**
   * Sanitize string input
   */
  static sanitizeString(input: string, maxLength: number = 1000): string {
    return input
      .trim()
      .substring(0, maxLength)
      .replace(/[<>]/g, ''); // Remove potentially dangerous chars
  }

  /**
   * Validate number range
   */
  static validateNumber(
    value: number,
    min: number,
    max: number
  ): {
    valid: boolean;
    error?: string;
  } {
    if (typeof value !== 'number' || isNaN(value)) {
      return {
        valid: false,
        error: 'Invalid number',
      };
    }

    if (value < min || value > max) {
      return {
        valid: false,
        error: `Number must be between ${min} and ${max}`,
      };
    }

    return { valid: true };
  }

  /**
   * Check if IP is private
   */
  private static isPrivateIP(hostname: string): boolean {
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^192\.168\./,
      /^169\.254\./, // Link-local
      /^127\./, // Loopback
      /^::1$/, // IPv6 loopback
      /^fc00:/, // IPv6 private
      /^fe80:/, // IPv6 link-local
    ];

    return privateRanges.some(range => range.test(hostname));
  }

  /**
   * Check if hostname is localhost
   */
  private static isLocalhost(hostname: string): boolean {
    return ['localhost', '127.0.0.1', '::1'].includes(hostname.toLowerCase());
  }

  /**
   * Validate file path (prevent directory traversal)
   */
  static validateFilePath(path: string): {
    valid: boolean;
    error?: string;
  } {
    // Prevent directory traversal
    if (path.includes('..') || path.includes('~')) {
      return {
        valid: false,
        error: 'Directory traversal detected',
      };
    }

    // Prevent absolute paths (security risk)
    if (path.startsWith('/') || path.match(/^[a-zA-Z]:\\/)) {
      return {
        valid: false,
        error: 'Absolute paths not allowed',
      };
    }

    return { valid: true };
  }

  /**
   * Validate JSON data
   */
  static validateJSON(data: string, maxSize: number = 1024 * 1024): {
    valid: boolean;
    error?: string;
    parsed?: any;
  } {
    if (data.length > maxSize) {
      return {
        valid: false,
        error: 'JSON data too large',
      };
    }

    try {
      const parsed = JSON.parse(data);
      return {
        valid: true,
        parsed,
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid JSON format',
      };
    }
  }

  /**
   * Validate email
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 255;
  }

  /**
   * Rate limit validation (prevent DoS through excessive config)
   */
  static validateRateLimitConfig(config: {
    maxRequestsPerSecond?: number;
    maxRequestsPerMinute?: number;
    maxRequestsPerHour?: number;
    maxConcurrent?: number;
  }): {
    valid: boolean;
    error?: string;
  } {
    const limits = {
      maxRequestsPerSecond: 100,
      maxRequestsPerMinute: 1000,
      maxRequestsPerHour: 10000,
      maxConcurrent: 50,
    };

    for (const [key, value] of Object.entries(config)) {
      if (value !== undefined) {
        const limit = limits[key as keyof typeof limits];
        if (value > limit) {
          return {
            valid: false,
            error: `${key} cannot exceed ${limit}`,
          };
        }
      }
    }

    return { valid: true };
  }
}
