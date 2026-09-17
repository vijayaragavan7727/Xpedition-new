/**
 * Xpedition Intelligence Layer v1 — Provider Registry
 *
 * Central catalog of all active capability providers: Groq, Tavily, OpenAI, Gemini.
 */

import { Capability, CapabilityProvider, ProviderHealth, ProviderId, ProviderPolicy } from './types';
import { GroqProvider } from './providers/groq';
import { TavilyProvider } from './providers/tavily';
import { OpenAIProvider } from './providers/openai';
import { GeminiProvider } from './providers/gemini';
import { FreeLLMAPIProvider } from './providers/freellmapi';

export class ProviderRegistry {
  private providers = new Map<ProviderId, CapabilityProvider>();
  private policies = new Map<ProviderId, ProviderPolicy>();

  constructor() {
    this.register(new GroqProvider());
    this.register(new TavilyProvider());
    this.register(new FreeLLMAPIProvider());
    this.register(new OpenAIProvider());
    this.register(new GeminiProvider());
  }

  register(provider: CapabilityProvider, customPolicy?: Partial<ProviderPolicy>): void {
    this.providers.set(provider.providerId, provider);
    this.policies.set(provider.providerId, {
      ...provider.defaultPolicy,
      ...(customPolicy || {}),
    });
  }

  get(providerId: ProviderId): CapabilityProvider | undefined {
    return this.providers.get(providerId);
  }

  getPolicy(providerId: ProviderId): ProviderPolicy | undefined {
    return this.policies.get(providerId);
  }

  getAll(): CapabilityProvider[] {
    return Array.from(this.providers.values());
  }

  getAvailableProviders(): ProviderId[] {
    return Array.from(this.providers.values())
      .filter((p) => p.isConfigured())
      .map((p) => p.providerId);
  }

  getProvidersForCapability(capability: Capability): ProviderId[] {
    const candidates: Array<{ id: ProviderId; policy: ProviderPolicy }> = [];

    for (const [id, provider] of this.providers.entries()) {
      if (provider.supports(capability)) {
        const policy = this.policies.get(id) || provider.defaultPolicy;
        candidates.push({ id, policy });
      }
    }

    // Sort by priority (lowest number first: Groq=1, Tavily=1, OpenAI/Gemini=3)
    candidates.sort((a, b) => a.policy.priority - b.policy.priority);
    return candidates.map((c) => c.id);
  }

  async getHealthMatrix(): Promise<Record<ProviderId, ProviderHealth>> {
    const result: Partial<Record<ProviderId, ProviderHealth>> = {};
    for (const [id, provider] of this.providers.entries()) {
      result[id] = await provider.healthCheck();
    }
    return result as Record<ProviderId, ProviderHealth>;
  }
}

// Singleton global registry instance
export const defaultProviderRegistry = new ProviderRegistry();
