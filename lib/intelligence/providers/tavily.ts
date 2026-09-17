/**
 * Tavily Provider Adapter — Web search, grounding, and real-time research.
 */

import { BaseProvider } from './base';
import {
  Capability,
  ProviderExecutionRequest,
  ProviderExecutionResult,
  ProviderId,
  ProviderPolicy,
} from '../types';

export class TavilyProvider extends BaseProvider {
  readonly providerId: ProviderId = 'tavily';
  readonly envKeyName = 'TAVILY_API_KEY';
  readonly isPaidProvider = false;

  readonly defaultPolicy: ProviderPolicy = {
    providerId: 'tavily',
    costTier: 'low',
    latencyTier: 'fast',
    qualityTier: 'high',
    priority: 1, // High priority for research
    supportedCapabilities: ['research'],
  };

  async execute<T = unknown>(request: ProviderExecutionRequest): Promise<ProviderExecutionResult<T>> {
    const startTime = Date.now();
    const apiKey = this.getApiKey();

    if (!apiKey) {
      return {
        data: null,
        text: '',
        provider: this.providerId,
        latencyMs: Date.now() - startTime,
        success: false,
        error: 'TAVILY_API_KEY is not configured',
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          query: request.userPrompt,
          search_depth: 'basic',
          max_results: 5,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const results = Array.isArray(data.results) ? data.results : [];
        const textSummary = results
          .map((r: { title?: string; content?: string; url?: string }) => `[${r.title || 'Source'}] (${r.url || ''}): ${r.content || ''}`)
          .join('\n\n');

        return {
          data: data as T,
          text: textSummary,
          provider: this.providerId,
          modelUsed: 'tavily-search',
          latencyMs: Date.now() - startTime,
          success: true,
        };
      }

      return {
        data: null,
        text: '',
        provider: this.providerId,
        latencyMs: Date.now() - startTime,
        success: false,
        error: `Tavily search failed with status ${res.status}`,
      };
    } catch (err: any) {
      return {
        data: null,
        text: '',
        provider: this.providerId,
        latencyMs: Date.now() - startTime,
        success: false,
        error: err?.message || 'Tavily search failed',
      };
    }
  }
}
