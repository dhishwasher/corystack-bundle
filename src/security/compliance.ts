/**
 * Compliance Checker
 * Ensures usage complies with legal and ethical guidelines
 */

export interface ComplianceCheck {
  compliant: boolean;
  violations: string[];
  warnings: string[];
  recommendations: string[];
}

export class ComplianceChecker {
  /**
   * Check if target URL is compliant
   */
  static checkTargetURL(url: string, options: {
    ownedDomains?: string[];
    authorizedDomains?: string[];
  } = {}): ComplianceCheck {
    const violations: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    const hostname = new URL(url).hostname;

    // Check if targeting own domain
    const isOwnDomain = options.ownedDomains?.some(domain =>
      hostname.endsWith(domain)
    );

    const isAuthorizedDomain = options.authorizedDomains?.some(domain =>
      hostname.endsWith(domain)
    );

    if (!isOwnDomain && !isAuthorizedDomain) {
      violations.push(
        'Targeting domain you do not own without explicit authorization'
      );
      warnings.push(
        'Ensure you have written permission to test this domain'
      );
    }

    // Check for sensitive domains
    const sensitiveDomains = [
      'gov',
      'mil',
      'edu',
      'bank',
      'healthcare',
    ];

    if (sensitiveDomains.some(sensitive => hostname.includes(sensitive))) {
      warnings.push(
        'Targeting sensitive domain - ensure proper authorization and compliance'
      );
    }

    // Recommendations
    if (!isOwnDomain) {
      recommendations.push('Obtain written authorization before testing');
      recommendations.push('Document the scope and duration of testing');
      recommendations.push('Notify the target organization');
    }

    recommendations.push('Ensure testing complies with local laws');
    recommendations.push('Avoid testing during peak business hours');
    recommendations.push('Implement rate limiting to avoid service disruption');

    return {
      compliant: violations.length === 0,
      violations,
      warnings,
      recommendations,
    };
  }

  /**
   * Check GDPR compliance
   */
  static checkGDPRCompliance(options: {
    collectsPersonalData: boolean;
    hasDataProcessingAgreement: boolean;
    hasPrivacyPolicy: boolean;
    dataRetentionDays?: number;
  }): ComplianceCheck {
    const violations: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    if (options.collectsPersonalData) {
      if (!options.hasDataProcessingAgreement) {
        violations.push('Data processing agreement required for personal data');
      }

      if (!options.hasPrivacyPolicy) {
        violations.push('Privacy policy required when processing personal data');
      }

      if (!options.dataRetentionDays) {
        warnings.push('Data retention period not specified');
      } else if (options.dataRetentionDays > 365) {
        warnings.push(
          'Data retention period exceeds recommended 12 months'
        );
      }

      recommendations.push('Implement data minimization principles');
      recommendations.push('Provide data subject access request (DSAR) process');
      recommendations.push('Implement right to deletion');
      recommendations.push('Maintain audit logs of data processing');
    }

    return {
      compliant: violations.length === 0,
      violations,
      warnings,
      recommendations,
    };
  }

  /**
   * Check rate limiting compliance
   */
  static checkRateLimitingCompliance(config: {
    requestsPerSecond: number;
    requestsPerMinute: number;
    requestsPerHour: number;
  }): ComplianceCheck {
    const violations: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Aggressive rate limits could be considered DoS
    if (config.requestsPerSecond > 10) {
      warnings.push(
        'Very high requests per second - may be considered aggressive'
      );
    }

    if (config.requestsPerMinute > 300) {
      warnings.push(
        'Very high requests per minute - ensure target can handle load'
      );
    }

    if (config.requestsPerHour > 5000) {
      warnings.push(
        'Very high requests per hour - may trigger anti-DoS measures'
      );
    }

    recommendations.push('Start with conservative rate limits');
    recommendations.push('Monitor target server response times');
    recommendations.push('Back off if errors or timeouts increase');
    recommendations.push('Respect robots.txt and rate-limiting headers');

    return {
      compliant: violations.length === 0,
      violations,
      warnings,
      recommendations,
    };
  }

  /**
   * Check ethical usage
   */
  static checkEthicalUsage(purpose: string): ComplianceCheck {
    const violations: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    const prohibitedPurposes = [
      'credential',
      'password',
      'steal',
      'hack',
      'attack',
      'ddos',
      'spam',
      'scrape user data',
      'personal information',
      'competitor harm',
    ];

    const lowerPurpose = purpose.toLowerCase();

    if (prohibitedPurposes.some(prohibited => lowerPurpose.includes(prohibited))) {
      violations.push('Purpose indicates potentially malicious or unethical use');
    }

    // Legitimate purposes
    const legitimatePurposes = [
      'security test',
      'penetration test',
      'vulnerability assessment',
      'own website',
      'authorized test',
    ];

    const isLegitimate = legitimatePurposes.some(legitimate =>
      lowerPurpose.includes(legitimate)
    );

    if (!isLegitimate) {
      warnings.push(
        'Purpose does not clearly indicate legitimate security testing'
      );
    }

    recommendations.push('Use only for defensive security purposes');
    recommendations.push('Test only systems you own or have permission to test');
    recommendations.push('Document testing authorization');
    recommendations.push('Follow responsible disclosure practices');

    return {
      compliant: violations.length === 0,
      violations,
      warnings,
      recommendations,
    };
  }

  /**
   * Generate compliance report
   */
  static generateComplianceReport(checks: {
    targetURL?: ComplianceCheck;
    gdpr?: ComplianceCheck;
    rateLimiting?: ComplianceCheck;
    ethical?: ComplianceCheck;
  }): string {
    let report = '# Compliance Report\n\n';

    const allChecks = Object.entries(checks).filter(([_, check]) => check);

    const allCompliant = allChecks.every(([_, check]) => check.compliant);

    report += `**Overall Status:** ${allCompliant ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}\n\n`;

    for (const [name, check] of allChecks) {
      report += `## ${name.charAt(0).toUpperCase() + name.slice(1)} Compliance\n\n`;

      if (check.violations.length > 0) {
        report += '### ❌ Violations\n\n';
        check.violations.forEach(v => {
          report += `- ${v}\n`;
        });
        report += '\n';
      }

      if (check.warnings.length > 0) {
        report += '### ⚠️  Warnings\n\n';
        check.warnings.forEach(w => {
          report += `- ${w}\n`;
        });
        report += '\n';
      }

      if (check.recommendations.length > 0) {
        report += '### 💡 Recommendations\n\n';
        check.recommendations.forEach(r => {
          report += `- ${r}\n`;
        });
        report += '\n';
      }
    }

    return report;
  }

  /**
   * Validate before scraping (comprehensive check)
   */
  static validateBeforeScraping(options: {
    targetURL: string;
    ownedDomains?: string[];
    purpose: string;
    rateLimit: {
      requestsPerSecond: number;
      requestsPerMinute: number;
      requestsPerHour: number;
    };
  }): {
    allowed: boolean;
    report: string;
  } {
    const checks = {
      targetURL: this.checkTargetURL(options.targetURL, {
        ownedDomains: options.ownedDomains,
      }),
      ethical: this.checkEthicalUsage(options.purpose),
      rateLimiting: this.checkRateLimitingCompliance(options.rateLimit),
    };

    const report = this.generateComplianceReport(checks);

    const allowed = Object.values(checks).every(check => check.compliant);

    return {
      allowed,
      report,
    };
  }
}
