/**
 * Xpedition Universal Teaching Engine v1 — AI Teaching Assistant
 *
 * Optional enhancement service that enriches topic descriptions, real-world analogies,
 * and prediction challenge wording using LLMs.
 *
 * Guarantees:
 * 1. AI is NEVER the authority for mastery, learner state, assessment truth, or routing.
 * 2. Strict schema validation on all AI outputs.
 * 3. 100% deterministic fallback when AI is disabled, unconfigured, or errors.
 */

import { callAi } from '../ai';
import { AiValidator } from '../intelligence/aiValidator';

export interface AiTopicEnrichment {
  analogy: string;
  realWorldApplication: string;
  enhancedExplanation: string;
  deepDiveQuestion: string;
  source: 'ai_groq' | 'ai_gemini' | 'deterministic_fallback';
}

export class TopicAiAssistant {
  /**
   * Enriches a topic with pedagogical analogies and real-world framing.
   */
  static async enrichTopic(
    topicName: string,
    subject: string,
    keyPrinciples: string[]
  ): Promise<AiTopicEnrichment> {
    const fallback: AiTopicEnrichment = {
      analogy: `Think of ${topicName} as an interconnected system where input adjustments directly govern observable outcomes.`,
      realWorldApplication: `${topicName} forms the engineering and empirical foundation for modern technological and scientific breakthroughs in ${subject}.`,
      enhancedExplanation: `In ${subject}, ${topicName} relies on core principles: ${keyPrinciples.join('; ')}. Experimenting with these variables reveals the underlying conservation and balance of the system.`,
      deepDiveQuestion: `How would changing the governing constraints alter the stability of ${topicName}?`,
      source: 'deterministic_fallback',
    };

    // Check if API keys exist
    const hasApiKey = Boolean(process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY);
    if (!hasApiKey) {
      return fallback;
    }

    try {
      const systemPrompt = `You are Xira, an expert STEM educational AI for Xpedition.
Given a learning topic, return a JSON object with:
- "analogy": A brilliant, concrete real-world analogy (1-2 sentences)
- "realWorldApplication": How this principle is used in modern technology or nature (1-2 sentences)
- "enhancedExplanation": A clear, intuitive pedagogical explanation (2-3 sentences)
- "deepDiveQuestion": A thought-provoking conceptual question (1 sentence)
Return ONLY valid JSON.`;

      const userPrompt = `Topic: ${topicName}
Subject: ${subject}
Key Principles: ${keyPrinciples.join(', ')}`;

      const response = await callAi<{
        analogy?: string;
        realWorldApplication?: string;
        enhancedExplanation?: string;
        deepDiveQuestion?: string;
      }>({
        systemPrompt,
        userPrompt,
        json: true,
        temperature: 0.3,
        maxTokens: 500,
        route: '/api/teach/enrich',
      });

      const validation = AiValidator.validateTopicEnrichment(response.data);
      if (validation.valid && validation.sanitized) {
        return {
          analogy: validation.sanitized.analogy,
          realWorldApplication: validation.sanitized.realWorldApplication,
          enhancedExplanation: validation.sanitized.enhancedExplanation,
          deepDiveQuestion: validation.sanitized.deepDiveQuestion,
          source: response.provider === 'groq' ? 'ai_groq' : 'ai_gemini',
        };
      }

      return fallback;
    } catch (err) {
      console.warn('[TopicAiAssistant] Falling back to deterministic enrichment:', err);
      return fallback;
    }
  }
}
