/**
 * Xpedition Production Persistence Manager
 *
 * Unified façade coordinating local and cloud persistence, user session scoping,
 * store data translation, and seamless recovery upon login/logout.
 */

import {
  CanonicalUserData,
  PersistenceAdapter,
  AttemptPersistencePayload,
  XiraEducationalMemory,
  UserProfile,
  UserProgression,
} from './types';
import { defaultSupabasePersistence } from './supabasePersistence';
import { defaultLocalPersistence } from './localPersistence';
import { UserStoreData, INITIAL_ZERO_STATE, Attempt, calculateStreak } from '../store';

export class PersistenceManager {
  private adapter: PersistenceAdapter;
  private currentUserId: string | null = null;
  private syncTimer: NodeJS.Timeout | null = null;

  constructor(customAdapter?: PersistenceAdapter) {
    this.adapter = customAdapter || defaultSupabasePersistence;
  }

  /**
   * Sets the active user context (e.g. after login or session detection).
   */
  public setActiveUserId(userId: string | null): void {
    this.currentUserId = userId;
    if (typeof window !== 'undefined') {
      if (userId) {
        try {
          sessionStorage.setItem('xpedition_active_user_id', userId);
        } catch {
          // ignore
        }
      } else {
        try {
          sessionStorage.removeItem('xpedition_active_user_id');
        } catch {
          // ignore
        }
      }
    }
  }

  /**
   * Retrieves the current active user ID.
   */
  public getActiveUserId(): string | null {
    if (this.currentUserId) return this.currentUserId;
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('xpedition_active_user_id');
        if (stored) {
          this.currentUserId = stored;
          return stored;
        }
      } catch {
        // ignore
      }
    }
    return null;
  }

  /**
   * Converts canonical user data to the UserStoreData structure used across UI components.
   */
  public toStoreData(canonical: CanonicalUserData): UserStoreData {
    const activeGraph = canonical.graphs.find((g) => g.id === canonical.activeGraphId) || canonical.graphs[0];

    return {
      handle: canonical.profile.displayName || 'Learner',
      activeGraphId: canonical.activeGraphId,
      graphs: canonical.graphs,
      rewardsCount: canonical.progression.rewardsCount,
      flowState: canonical.flowState,

      // Canonical compatibility mappings
      goalText: canonical.profile.goal || activeGraph?.goalText || 'Skill Goal',
      concepts: activeGraph?.concepts || [],
      quests: activeGraph?.quests || [],
      attempts: activeGraph?.attempts || [],
      calibratedTheta: activeGraph?.calibratedTheta,
      calibrationCompletedAt: activeGraph?.calibrationCompletedAt,
      learnerProfile: activeGraph?.learnerProfile,
      isSeededFallback: activeGraph?.isSeededFallback,
      activeSession: activeGraph?.activeSession,
      distractorStats: activeGraph?.distractorStats,
    };
  }

  /**
   * Updates or constructs CanonicalUserData from UserStoreData.
   */
  public fromStoreData(userId: string, store: UserStoreData, existing?: CanonicalUserData | null): CanonicalUserData {
    const now = Date.now();
    const todayStr = new Date().toISOString().split('T')[0];

    const activeGraph = store.graphs?.find((g) => g.id === store.activeGraphId) || store.graphs?.[0];

    // Ensure compatibility fields on store synchronize down into activeGraph
    if (activeGraph) {
      if (store.goalText) {
        activeGraph.goalText = store.goalText;
      }
      if (store.concepts && store.concepts.length > 0) {
        activeGraph.concepts = store.concepts;
      }
      if (store.attempts && store.attempts.length > 0) {
        activeGraph.attempts = store.attempts;
      }
      if (store.calibratedTheta !== undefined) {
        activeGraph.calibratedTheta = store.calibratedTheta;
      }
      if (store.calibrationCompletedAt !== undefined) {
        activeGraph.calibrationCompletedAt = store.calibrationCompletedAt;
      }
    }

    const attempts = activeGraph?.attempts || store.attempts || [];

    // Calculate progression based on attempts and store
    const calculatedStreak = calculateStreak(attempts);
    const xp = (existing?.progression.xp ?? 0) > 0
      ? existing!.progression.xp
      : attempts.reduce((acc, a) => acc + (a.isCorrect ? 25 : 5), 0);

    const profile: UserProfile = {
      userId,
      email: existing?.profile.email || `${userId}@xpedition.app`,
      displayName: store.handle || existing?.profile.displayName || 'Learner',
      goal: store.goalText || activeGraph?.goalText || 'Explore Science & Engineering',
      onboardingCompleted: Boolean(activeGraph?.calibrationCompletedAt || activeGraph?.calibratedTheta),
      createdAt: existing?.profile.createdAt || now,
      updatedAt: now,
    };

    const progression: UserProgression = {
      xp,
      level: Math.max(1, Math.floor(xp / 100) + 1),
      streak: calculatedStreak,
      longestStreak: Math.max(existing?.progression.longestStreak || 0, calculatedStreak),
      coins: existing?.progression.coins || 0,
      rewardsCount: store.rewardsCount || existing?.progression.rewardsCount || 0,
      badges: existing?.progression.badges || [],
      lastActiveDate: todayStr,
    };

    return {
      userId,
      profile,
      activeGraphId: store.activeGraphId || INITIAL_ZERO_STATE.activeGraphId,
      graphs: store.graphs && store.graphs.length > 0 ? store.graphs : INITIAL_ZERO_STATE.graphs,
      flowState: store.flowState || 'unknown',
      progression,
      xiraMemories: existing?.xiraMemories || [],
      questProgress: existing?.questProgress || {},
      lastSyncedAt: now,
    };
  }

  /**
   * Loads the active user's persistent state, initializing default state if not found.
   */
  public async loadUserStore(userId?: string): Promise<UserStoreData> {
    const targetUserId = userId || this.getActiveUserId();
    if (!targetUserId) {
      return INITIAL_ZERO_STATE;
    }

    try {
      const canonical = await this.adapter.getUserState(targetUserId);
      if (canonical) {
        return this.toStoreData(canonical);
      }

      // Initialize default user
      const defaultData = defaultLocalPersistence.createDefaultUserData(targetUserId);
      await this.adapter.saveUserState(targetUserId, defaultData);
      return this.toStoreData(defaultData);
    } catch (err) {
      console.warn('[PersistenceManager] loadUserStore error, returning zero state:', err);
      return INITIAL_ZERO_STATE;
    }
  }

  /**
   * Saves user state to persistence. Supports immediate execution when awaited or debounced for store listeners.
   */
  public async saveUserStore(store: UserStoreData, userId?: string, debounce = false): Promise<void> {
    const targetUserId = userId || this.getActiveUserId();
    if (!targetUserId) return;

    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }

    if (!debounce) {
      try {
        const existing = await this.adapter.getUserState(targetUserId);
        const canonical = this.fromStoreData(targetUserId, store, existing);
        await this.adapter.saveUserState(targetUserId, canonical);
      } catch (err) {
        console.warn('[PersistenceManager] saveUserStore error:', err);
      }
      return;
    }

    this.syncTimer = setTimeout(async () => {
      try {
        const existing = await this.adapter.getUserState(targetUserId);
        const canonical = this.fromStoreData(targetUserId, store, existing);
        await this.adapter.saveUserState(targetUserId, canonical);
      } catch (err) {
        console.warn('[PersistenceManager] saveUserStore debounced error:', err);
      }
    }, 300);
  }

  /**
   * Persists an attempt with idempotency guarantees.
   */
  public async recordAttempt(
    attempt: Attempt,
    conceptId: string,
    conceptName: string,
    userId?: string
  ): Promise<{ success: boolean; isDuplicate: boolean }> {
    const targetUserId = userId || this.getActiveUserId() || 'guest_user';

    const payload: AttemptPersistencePayload = {
      userId: targetUserId,
      attempt,
      conceptId,
      conceptName,
    };

    return this.adapter.recordAttempt(payload);
  }

  /**
   * Persists an educational Xira memory.
   */
  public async recordXiraMemory(memory: Omit<XiraEducationalMemory, 'userId'>, userId?: string): Promise<boolean> {
    const targetUserId = userId || this.getActiveUserId() || 'guest_user';

    const fullMemory: XiraEducationalMemory = {
      ...memory,
      userId: targetUserId,
    };

    return this.adapter.recordXiraMemory(fullMemory);
  }

  /**
   * Retrieves raw canonical user state (used for data export and inspections).
   */
  public async getUserState(userId?: string): Promise<CanonicalUserData | null> {
    const targetUserId = userId || this.getActiveUserId();
    if (!targetUserId) return null;
    return this.adapter.getUserState(targetUserId);
  }

  /**
   * Permanently clears all stored state for the target or active user.
   */
  public async clearUserState(userId?: string): Promise<boolean> {
    const targetUserId = userId || this.getActiveUserId();
    if (!targetUserId) return false;

    const result = await this.adapter.clearUserState(targetUserId);

    if (this.currentUserId === targetUserId) {
      this.setActiveUserId(null);
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('xpedition_active_user_id');
    }

    return result;
  }

  /**
   * Cleans user state on logout.
   */
  public async handleLogout(userId?: string): Promise<void> {
    const targetUserId = userId || this.getActiveUserId();
    this.setActiveUserId(null);

    if (targetUserId) {
      // Clear session memory but keep persistent record in adapter
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
      }
    }
  }
}

export const persistenceManager = new PersistenceManager();

// Automatically wire persistenceManager to store sync events
if (typeof window !== 'undefined') {
  try {
    const { registerStoreSyncListener } = require('../store');
    registerStoreSyncListener((data: UserStoreData, userId?: string) => {
      persistenceManager.saveUserStore(data, userId);
    });
  } catch {
    // ignore in environments where dynamic require is restricted
  }
}
