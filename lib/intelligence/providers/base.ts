/**
 * Xpedition Intelligence Layer v1 — Base Provider Abstract Class
 *
 * Implements server-side environment variable security and paid provider kill switches.
 */

import {
  Capability,
  CapabilityProvider,
  ProviderFailureType,
  ProviderHealth,
  ProviderId,
  ProviderPolicy,
  ProviderExecutionRequest,
  ProviderExecutionResult,
} from '../types';

export abstract class BaseProvider implements CapabilityProvider {
  abstract readonly providerId: ProviderId;
  abstract readonly envKeyName: string;
  abstract readonly defaultPolicy: ProviderPolicy;
  abstract readonly isPaidProvider: boolean;

  protected getApiKey(): string | undefined {
    return process.env[this.envKeyName];
  }

  /**
   * Evaluates whether this provider is currently enabled in server configuration.
   * Enforces PAID_AI_ENABLED kill-switch (defaults to false/disabled if unset).
   */
  isEnabled(): boolean {
    if (!this.isPaidProvider) {
      return true;
    }

    const paidEnabled = process.env.PAID_AI_ENABLED === 'true' || process.env.PAID_AI_ENABLED === '1';
    if (!paidEnabled) {
      return false;
    }

    if (this.providerId === 'openai') {
      const flag = process.env.OPENAI_ENABLED;
      return flag === undefined || flag === 'true' || flag === '1';
    }

    if (this.providerId === 'gemini') {
      const flag = process.env.GEMINI_ENABLED;
      return flag === undefined || flag === 'true' || flag === '1';
    }

    return false;
  }

  isConfigured(): boolean {
    if (!this.isEnabled()) {
      return false;
    }
    const key = this.getApiKey();
    return Boolean(key && key.trim().length > 0);
  }

  async healthCheck(): Promise<ProviderHealth> {
    const enabled = this.isEnabled();
    const hasKey = Boolean(this.getApiKey() && this.getApiKey()!.trim().length > 0);

    let status: ProviderHealth['status'] = 'available';
    if (!enabled) {
      status = 'disabled';
    } else if (!hasKey) {
      status = 'missing_key';
    }

    return {
      providerId: this.providerId,
      isConfigured: enabled && hasKey,
      isPaidProvider: this.isPaidProvider,
      envKeyPresent: hasKey,
      status,
      lastCheckedAt: Date.now(),
    };
  }

  supports(capability: Capability): boolean {
    return this.defaultPolicy.supportedCapabilities.includes(capability);
  }

  abstract execute<T = unknown>(request: ProviderExecutionRequest): Promise<ProviderExecutionResult<T>>;

  protected stripMarkdownFences(text: string): string {
    let cleaned = (text || '').trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    return cleaned.trim();
  }

  protected classifyFailure(error: unknown, statusCode?: number): ProviderFailureType {
    return classifyProviderError(error, statusCode);
  }
}

export function classifyProviderError(error: unknown, statusCode?: number): ProviderFailureType {
  if (statusCode === 401 || statusCode === 403) return 'auth_or_config';
  if (statusCode === 429) return 'rate_limit';
  if (statusCode === 402) return 'quota';
  if (statusCode === 502 || statusCode === 503 || statusCode === 504) return 'unavailable';

  const errStr = error instanceof Error
    ? `${error.name} ${error.message}`.toLowerCase()
    : String(error || '').toLowerCase();

  if (errStr.includes('abort') || errStr.includes('timeout') || errStr.includes('timed out')) {
    return 'timeout';
  }
  if (
    errStr.includes('api key') ||
    errStr.includes('unauthorized') ||
    errStr.includes('forbidden') ||
    errStr.includes('authentication') ||
    errStr.includes('not configured')
  ) {
    return 'auth_or_config';
  }
  if (errStr.includes('rate limit') || errStr.includes('too many requests') || errStr.includes('429')) {
    return 'rate_limit';
  }
  if (errStr.includes('quota') || errStr.includes('billing') || errStr.includes('credits') || errStr.includes('exhausted')) {
    return 'quota';
  }
  if (errStr.includes('json') || errStr.includes('syntaxerror') || errStr.includes('malformed') || errStr.includes('parse')) {
    return 'malformed_response';
  }
  if (errStr.includes('unavailable') || errStr.includes('503') || errStr.includes('502') || errStr.includes('bad gateway')) {
    return 'unavailable';
  }
  if (
    errStr.includes('econnrefused') ||
    errStr.includes('enotfound') ||
    errStr.includes('network') ||
    errStr.includes('fetch failed')
  ) {
    return 'network_error';
  }

  return 'unknown';
}
