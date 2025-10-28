import type { Proxy } from '../types/index.js';

export class ProxyManager {
  private proxies: Proxy[] = [];
  private currentIndex: number = 0;
  private rotationInterval: number;
  private lastRotation: number = Date.now();

  constructor(proxies: Proxy[], rotationInterval: number = 60000) {
    this.proxies = proxies;
    this.rotationInterval = rotationInterval;
  }

  /**
   * Get next proxy from the pool
   */
  getNextProxy(): Proxy | null {
    if (this.proxies.length === 0) {
      return null;
    }

    const shouldRotate = Date.now() - this.lastRotation >= this.rotationInterval;

    if (shouldRotate) {
      this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
      this.lastRotation = Date.now();
    }

    const proxy = this.proxies[this.currentIndex];
    if (proxy) {
      proxy.lastUsed = Date.now();
    }

    return proxy;
  }

  /**
   * Get a random proxy (for parallel requests)
   */
  getRandomProxy(): Proxy | null {
    if (this.proxies.length === 0) {
      return null;
    }

    const index = Math.floor(Math.random() * this.proxies.length);
    const proxy = this.proxies[index];

    if (proxy) {
      proxy.lastUsed = Date.now();
    }

    return proxy;
  }

  /**
   * Get best performing proxy based on success rate
   */
  getBestProxy(): Proxy | null {
    if (this.proxies.length === 0) {
      return null;
    }

    const proxiesWithRate = this.proxies.filter(p => p.successRate !== undefined);

    if (proxiesWithRate.length === 0) {
      return this.getRandomProxy();
    }

    const best = proxiesWithRate.reduce((prev, current) =>
      (prev.successRate || 0) > (current.successRate || 0) ? prev : current
    );

    best.lastUsed = Date.now();
    return best;
  }

  /**
   * Get proxies from a specific country
   */
  getProxyByCountry(country: string): Proxy | null {
    const countryProxies = this.proxies.filter(
      p => p.country?.toLowerCase() === country.toLowerCase()
    );

    if (countryProxies.length === 0) {
      return null;
    }

    const proxy = countryProxies[Math.floor(Math.random() * countryProxies.length)];
    if (proxy) {
      proxy.lastUsed = Date.now();
    }

    return proxy;
  }

  /**
   * Get residential proxies only
   */
  getResidentialProxy(): Proxy | null {
    const residentialProxies = this.proxies.filter(p => p.isResidential);

    if (residentialProxies.length === 0) {
      return null;
    }

    const proxy = residentialProxies[Math.floor(Math.random() * residentialProxies.length)];
    if (proxy) {
      proxy.lastUsed = Date.now();
    }

    return proxy;
  }

  /**
   * Add proxy to pool
   */
  addProxy(proxy: Proxy): void {
    this.proxies.push(proxy);
  }

  /**
   * Remove proxy from pool
   */
  removeProxy(proxy: Proxy): void {
    this.proxies = this.proxies.filter(
      p => !(p.host === proxy.host && p.port === proxy.port)
    );
  }

  /**
   * Update proxy success rate
   */
  updateProxyStats(proxy: Proxy, success: boolean): void {
    const index = this.proxies.findIndex(
      p => p.host === proxy.host && p.port === proxy.port
    );

    if (index !== -1) {
      const currentRate = this.proxies[index].successRate || 0.5;
      // Exponential moving average
      const newRate = success
        ? currentRate * 0.9 + 0.1
        : currentRate * 0.9;

      this.proxies[index].successRate = newRate;

      // Remove proxy if success rate drops too low
      if (newRate < 0.2) {
        console.warn(`Removing proxy ${proxy.host}:${proxy.port} due to low success rate`);
        this.removeProxy(proxy);
      }
    }
  }

  /**
   * Convert proxy to Playwright format
   */
  toPlaywrightProxy(proxy: Proxy): {
    server: string;
    username?: string;
    password?: string;
  } {
    return {
      server: `${proxy.type}://${proxy.host}:${proxy.port}`,
      username: proxy.username,
      password: proxy.password,
    };
  }

  /**
   * Test proxy connection
   */
  async testProxy(proxy: Proxy): Promise<boolean> {
    try {
      const response = await fetch('https://api.ipify.org?format=json', {
        // @ts-ignore - proxy config
        agent: this.createProxyAgent(proxy),
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create proxy agent for Node.js fetch
   */
  private createProxyAgent(proxy: Proxy): any {
    const proxyUrl = proxy.username
      ? `${proxy.type}://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`
      : `${proxy.type}://${proxy.host}:${proxy.port}`;

    // This would need a proper proxy agent implementation
    return null; // Placeholder
  }

  /**
   * Load proxies from file
   */
  static async loadFromFile(filePath: string): Promise<Proxy[]> {
    const fs = await import('fs/promises');
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());

    return lines.map(line => {
      const [hostPort, credentials] = line.split('@');
      const [host, port] = hostPort.split(':');
      const [username, password] = credentials ? credentials.split(':') : [];

      return {
        type: 'http',
        host,
        port: parseInt(port, 10),
        username,
        password,
        successRate: 0.5,
      };
    });
  }

  /**
   * Get proxy pool statistics
   */
  getStats(): {
    total: number;
    residential: number;
    datacenter: number;
    byCountry: Record<string, number>;
    averageSuccessRate: number;
  } {
    const stats = {
      total: this.proxies.length,
      residential: this.proxies.filter(p => p.isResidential).length,
      datacenter: this.proxies.filter(p => !p.isResidential).length,
      byCountry: {} as Record<string, number>,
      averageSuccessRate: 0,
    };

    this.proxies.forEach(proxy => {
      if (proxy.country) {
        stats.byCountry[proxy.country] = (stats.byCountry[proxy.country] || 0) + 1;
      }
    });

    const ratedProxies = this.proxies.filter(p => p.successRate !== undefined);
    if (ratedProxies.length > 0) {
      stats.averageSuccessRate =
        ratedProxies.reduce((sum, p) => sum + (p.successRate || 0), 0) / ratedProxies.length;
    }

    return stats;
  }
}
