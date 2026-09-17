/**
 * Xpedition Source Intelligence Engine v1 — Source Discovery & SSRF Protection
 *
 * Discovers and validates authoritative educational sources for topics.
 * Strictly enforces SSRF prevention and URL security.
 */

import { EducationalSource } from './sourceTypes';
import { SourceRegistry } from './sourceRegistry';

export class SourceDiscovery {
  /**
   * SSRF Protection: Validates whether a remote URL is safe to fetch or reference.
   * Rejects loopback, internal IP subnets, cloud metadata endpoints, and non-HTTP protocols.
   */
  static isSafeUrl(rawUrl: string): boolean {
    if (!rawUrl || typeof rawUrl !== 'string') return false;

    try {
      const parsed = new URL(rawUrl);

      // 1. Only allow standard HTTP / HTTPS
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return false;
      }

      const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');

      // 2. Reject localhost / loopback
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '::1' ||
        hostname === '0.0.0.0' ||
        hostname === '::' ||
        hostname.endsWith('.localhost') ||
        hostname.endsWith('.local')
      ) {
        return false;
      }

      // 3. Reject cloud metadata endpoints (AWS, GCP, Azure, Alibaba, OpenStack)
      if (
        hostname === '169.254.169.254' ||
        hostname === 'metadata.google.internal' ||
        hostname === '100.100.100.200' ||
        hostname.includes('instance-data')
      ) {
        return false;
      }

      // 4. Reject numeric decimal/hex IP representations (e.g. 2130706433 = 127.0.0.1)
      if (/^\d+$/.test(hostname)) {
        return false;
      }
      if (/^0x[0-9a-f]+$/i.test(hostname)) {
        return false;
      }

      // 5. Reject private IPv4 address ranges (10.x, 192.168.x, 172.16-31.x, 127.x, 169.254.x)
      const ipMatch = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
      if (ipMatch) {
        const octet1 = parseInt(ipMatch[1], 10);
        const octet2 = parseInt(ipMatch[2], 10);

        if (octet1 === 10) return false;
        if (octet1 === 192 && octet2 === 168) return false;
        if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) return false;
        if (octet1 === 127) return false;
        if (octet1 === 169 && octet2 === 254) return false;
        if (octet1 === 0) return false;
      }

      // 6. Reject IPv6 private / link-local / ULA ranges (fc00::, fd00::, fe80::)
      if (
        hostname.startsWith('fc') ||
        hostname.startsWith('fd') ||
        hostname.startsWith('fe80')
      ) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  static isUrlSafe(rawUrl: string): boolean {
    return this.isSafeUrl(rawUrl);
  }

  /**
   * Discovers and scores educational sources matching a topic.
   */
  static discoverSources(normalizedTopic: string, subject?: string): EducationalSource[] {
    const registryMatches = SourceRegistry.findSourcesForTopic(normalizedTopic, subject);

    // Filter by SSRF safety
    const safeSources = registryMatches.filter((s) => this.isSafeUrl(s.url));

    return safeSources.length > 0 ? safeSources : SourceRegistry.getAllSources().slice(0, 1);
  }
}
