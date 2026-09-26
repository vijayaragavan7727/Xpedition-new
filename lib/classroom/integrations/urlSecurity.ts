/**
 * External URL Security & Sanitization
 *
 * Hardened validation for external integration URLs (OpenMAIC, Miro, Canvas).
 * Rejects dangerous protocols (javascript:, data:, vbscript:, file:, blob:)
 * and ensures only safe HTTPS (or localhost HTTP for dev bridges) origins are processed.
 */

const DANGEROUS_PROTOCOLS = new Set([
  'javascript:',
  'data:',
  'vbscript:',
  'file:',
  'blob:',
]);

export interface UrlValidationOptions {
  allowedProtocols?: string[];
  allowedDomains?: string[];
  allowLocalhost?: boolean;
}

/**
 * Validates and sanitizes an external URL.
 * Returns the normalized URL string if valid, or null if invalid/unsafe.
 */
export function sanitizeExternalUrl(
  rawUrl: unknown,
  options: UrlValidationOptions = {}
): string | null {
  if (typeof rawUrl !== 'string') return null;

  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  // Reject strings containing explicit dangerous schemes (case-insensitive)
  const lower = trimmed.toLowerCase();
  for (const protocol of DANGEROUS_PROTOCOLS) {
    if (lower.startsWith(protocol)) return null;
  }

  try {
    const parsed = new URL(trimmed);

    // Reject URLs with embedded user credentials (e.g. https://user:pass@evil.com)
    if (parsed.username || parsed.password) {
      return null;
    }

    const allowLocal = options.allowLocalhost ?? process.env.NODE_ENV !== 'production';
    const isLocal = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';

    // Allow https by default, and http only for local loopback in development
    if (parsed.protocol === 'http:') {
      if (!allowLocal || !isLocal) {
        return null;
      }
    } else if (parsed.protocol !== 'https:') {
      return null;
    }

    // Optional domain allowlist matching (supports *.domain.com wildcard)
    if (options.allowedDomains && options.allowedDomains.length > 0) {
      const hostname = parsed.hostname.toLowerCase();
      const isAllowed = options.allowedDomains.some((domain) => {
        const d = domain.toLowerCase();
        if (d.startsWith('*.')) {
          const rootDomain = d.slice(2);
          return hostname === rootDomain || hostname.endsWith(`.${rootDomain}`);
        }
        return hostname === d;
      });

      if (!isAllowed) {
        return null;
      }
    }

    return parsed.toString();
  } catch {
    return null;
  }
}
