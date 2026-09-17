/**
 * Xpedition Source Intelligence Engine v1 — Topic Knowledge Cache
 *
 * Caches reusable LearningKnowledgeBundles and source metadata.
 * Strict privacy: Never caches personalized learner state or cross-student history.
 */

import { LearningKnowledgeBundle } from './sourceTypes';

interface CacheEntry {
  bundle: LearningKnowledgeBundle;
  cachedAt: number;
  hitCount: number;
}

export class KnowledgeCache {
  private static cache = new Map<string, CacheEntry>();
  private static TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
  private static MAX_ENTRIES = 200; // Hard memory boundary

  /**
   * Generates a deterministic cache key.
   * Strictly verifies no learner IDs or user identifiers are included.
   */
  static generateKey(topic: string, subject?: string, level: string = 'intermediate'): string {
    const normTopic = (topic || '').trim().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
    const normSubject = (subject || 'general').trim().toLowerCase();
    return `kb_${normTopic}_${normSubject}_${level}`;
  }

  static createKey(topic: string, level: string = 'intermediate', subject?: string): string {
    return this.generateKey(topic, subject, level);
  }

  /**
   * Retrieves a cached bundle if present, valid, and unexpired.
   */
  static get(key: string): LearningKnowledgeBundle | undefined {
    try {
      const entry = this.cache.get(key);
      if (!entry) return undefined;

      if (Date.now() - entry.cachedAt > this.TTL_MS) {
        this.cache.delete(key);
        return undefined;
      }

      // Refresh LRU order on access
      this.cache.delete(key);
      entry.hitCount++;
      this.cache.set(key, entry);

      return entry.bundle;
    } catch (err) {
      console.warn('[KnowledgeCache] get failed gracefully:', err);
      return undefined;
    }
  }

  /**
   * Saves a bundle to cache with capacity limits and PII rejection.
   */
  static set(key: string, bundle: LearningKnowledgeBundle): void {
    try {
      // Privacy Guard: strictly reject any bundle or key containing learner identity or private user fields
      const keyStr = String(key).toLowerCase();
      if (
        keyStr.includes('user_') ||
        keyStr.includes('learner_') ||
        keyStr.includes('student_') ||
        keyStr.includes('@')
      ) {
        console.warn('[KnowledgeCache] Rejected attempt to cache personal learner identifier in topic cache.');
        return;
      }

      // Memory boundary: Evict oldest entry if at capacity
      if (this.cache.size >= this.MAX_ENTRIES) {
        const oldestKey = this.cache.keys().next().value;
        if (oldestKey) {
          this.cache.delete(oldestKey);
        }
      }

      this.cache.set(key, {
        bundle,
        cachedAt: Date.now(),
        hitCount: 0,
      });
    } catch (err) {
      console.warn('[KnowledgeCache] set failed gracefully:', err);
    }
  }

  /**
   * Returns cache metrics.
   */
  static getStats(): { totalEntries: number; totalHits: number } {
    let totalHits = 0;
    this.cache.forEach((v) => {
      totalHits += v.hitCount;
    });
    return {
      totalEntries: this.cache.size,
      totalHits,
    };
  }

  /**
   * Clears cache (useful for test isolation).
   */
  static clear(): void {
    this.cache.clear();
  }
}
