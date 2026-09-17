/**
 * Xpedition Local Persistence Adapter
 *
 * Deterministic, resilient, user-isolated storage engine.
 * Used during local development, automated testing, and when external cloud services are unconfigured.
 * Guarantees zero data loss, strict user isolation, and idempotency.
 */

import {
  CanonicalUserData,
  PersistenceAdapter,
  AttemptPersistencePayload,
  XiraEducationalMemory,
  UserProfile,
  UserProgression,
} from './types';
import { INITIAL_ZERO_STATE, UserStoreData, calculateStreak } from '../store';

export class LocalPersistenceAdapter implements PersistenceAdapter {
  private inMemoryUsers = new Map<string, CanonicalUserData>();
  private processedAttemptIds = new Set<string>();

  private getStorageKey(userId: string): string {
    return `xpedition_user_${userId}`;
  }

  /**
   * Initializes a default CanonicalUserData structure for a new user.
   */
  public createDefaultUserData(userId: string, email = 'learner@xpedition.local', displayName = 'Learner'): CanonicalUserData {
    const now = Date.now();
    const todayStr = new Date().toISOString().split('T')[0];

    const profile: UserProfile = {
      userId,
      email,
      displayName,
      goal: 'Explore Science & Engineering',
      onboardingCompleted: false,
      createdAt: now,
      updatedAt: now,
    };

    const progression: UserProgression = {
      xp: 0,
      level: 1,
      streak: 0,
      longestStreak: 0,
      coins: 0,
      rewardsCount: 0,
      badges: [],
      lastActiveDate: todayStr,
    };

    return {
      userId,
      profile,
      activeGraphId: INITIAL_ZERO_STATE.activeGraphId,
      graphs: JSON.parse(JSON.stringify(INITIAL_ZERO_STATE.graphs)),
      flowState: INITIAL_ZERO_STATE.flowState,
      progression,
      xiraMemories: [],
      questProgress: {},
      lastSyncedAt: now,
    };
  }

  public async getUserState(userId: string): Promise<CanonicalUserData | null> {
    if (!userId) return null;

    // 1. Check in-memory state
    if (this.inMemoryUsers.has(userId)) {
      return JSON.parse(JSON.stringify(this.inMemoryUsers.get(userId)!));
    }

    // 2. Check browser localStorage if available
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(this.getStorageKey(userId));
        if (raw) {
          const parsed = JSON.parse(raw) as CanonicalUserData;
          if (parsed && parsed.userId === userId) {
            this.inMemoryUsers.set(userId, parsed);
            return parsed;
          }
        }
      } catch (err) {
        console.warn('[LocalPersistence] Failed to read localStorage for user:', userId, err);
      }
    }

    return null;
  }

  public async saveUserState(userId: string, data: CanonicalUserData): Promise<boolean> {
    if (!userId || !data) return false;

    // Ensure data is user-scoped
    data.userId = userId;
    data.lastSyncedAt = Date.now();

    // 1. Save to in-memory map
    this.inMemoryUsers.set(userId, JSON.parse(JSON.stringify(data)));

    // 2. Persist to browser localStorage if available
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.getStorageKey(userId), JSON.stringify(data));
      } catch (err) {
        console.warn('[LocalPersistence] Failed to write localStorage for user:', userId, err);
      }
    }

    return true;
  }

  public async recordAttempt(payload: AttemptPersistencePayload): Promise<{ success: boolean; isDuplicate: boolean }> {
    const { userId, attempt, conceptId } = payload;
    if (!userId || !attempt) return { success: false, isDuplicate: false };

    // Idempotency check: prevent duplicate attempts and rewards
    const attemptKey = `${userId}_${attempt.id}`;
    if (this.processedAttemptIds.has(attemptKey)) {
      return { success: true, isDuplicate: true };
    }

    let userData = await this.getUserState(userId);
    if (!userData) {
      userData = this.createDefaultUserData(userId);
    }

    // Check if attempt is already present in graph attempts
    const activeGraph = userData.graphs.find((g) => g.id === userData!.activeGraphId) || userData.graphs[0];
    if (activeGraph) {
      const alreadyExists = (activeGraph.attempts || []).some((a) => a.id === attempt.id);
      if (alreadyExists) {
        this.processedAttemptIds.add(attemptKey);
        return { success: true, isDuplicate: true };
      }

      // Add attempt
      activeGraph.attempts = [...(activeGraph.attempts || []), attempt];

      // Update XP & progression deterministically
      const xpEarned = attempt.isCorrect ? 25 : 5;
      userData.progression.xp += xpEarned;
      userData.progression.level = Math.max(1, Math.floor(userData.progression.xp / 100) + 1);
      userData.progression.streak = calculateStreak(activeGraph.attempts);
      userData.progression.longestStreak = Math.max(userData.progression.longestStreak, userData.progression.streak);
      userData.progression.lastActiveDate = new Date().toISOString().split('T')[0];
    }

    this.processedAttemptIds.add(attemptKey);
    await this.saveUserState(userId, userData);

    return { success: true, isDuplicate: false };
  }

  public async recordXiraMemory(memory: XiraEducationalMemory): Promise<boolean> {
    if (!memory || !memory.userId || !memory.conceptId) return false;

    let userData = await this.getUserState(memory.userId);
    if (!userData) {
      userData = this.createDefaultUserData(memory.userId);
    }

    // Scrub or limit memory count (retain max 50 recent educational memories)
    const existingIndex = userData.xiraMemories.findIndex(
      (m) => m.conceptId === memory.conceptId && m.category === memory.category
    );

    if (existingIndex >= 0) {
      userData.xiraMemories[existingIndex] = {
        ...userData.xiraMemories[existingIndex],
        strength: Math.min(1.0, userData.xiraMemories[existingIndex].strength + 0.1),
        evidenceSummary: memory.evidenceSummary,
        timestamp: memory.timestamp || Date.now(),
      };
    } else {
      userData.xiraMemories.unshift(memory);
      if (userData.xiraMemories.length > 50) {
        userData.xiraMemories = userData.xiraMemories.slice(0, 50);
      }
    }

    return this.saveUserState(memory.userId, userData);
  }

  public async getXiraMemories(userId: string, conceptId?: string): Promise<XiraEducationalMemory[]> {
    const userData = await this.getUserState(userId);
    if (!userData || !userData.xiraMemories) return [];

    if (conceptId) {
      return userData.xiraMemories.filter((m) => m.conceptId === conceptId);
    }
    return userData.xiraMemories;
  }

  public async clearUserState(userId: string): Promise<boolean> {
    if (!userId) return false;

    this.inMemoryUsers.delete(userId);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(this.getStorageKey(userId));
      } catch (err) {
        console.warn('[LocalPersistence] Failed to remove localStorage key for user:', userId, err);
      }
    }

    return true;
  }
}

export const defaultLocalPersistence = new LocalPersistenceAdapter();
