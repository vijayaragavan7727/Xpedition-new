/**
 * Xpedition Production Hardening — Distributed Classroom Session Store
 *
 * Provides a resilient, distributed session storage abstraction. Uses distributed caching
 * and cloud database persistence for multi-instance deployments, with transparent in-memory
 * fallback for local and offline scenarios.
 */

import { ClassroomSessionState } from './classroomSessionTypes';
import { getCacheAdapter, ICacheAdapter } from '../cache/cacheAdapter';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getLearnerDb } from '../supabase/dbContext';

export interface IClassroomSessionStore {
  saveSession(session: ClassroomSessionState, userId?: string): Promise<boolean>;
  /**
   * When `ownerId` is given, only a session owned by that user is returned.
   * Authorization is enforced by the orchestrator; this is defence in depth.
   */
  getSession(sessionId: string, ownerId?: string): Promise<ClassroomSessionState | null>;
  deleteSession(sessionId: string, ownerId?: string): Promise<boolean>;
  listUserSessions(userId: string): Promise<ClassroomSessionState[]>;
}

/**
 * High-performance In-Memory Session Store
 */
export class MemorySessionStore implements IClassroomSessionStore {
  private static instance: MemorySessionStore;
  private readonly sessions: Map<string, ClassroomSessionState> = new Map();
  private readonly userSessions: Map<string, Set<string>> = new Map();

  public static getInstance(): MemorySessionStore {
    if (!MemorySessionStore.instance) {
      MemorySessionStore.instance = new MemorySessionStore();
    }
    return MemorySessionStore.instance;
  }

  public async saveSession(session: ClassroomSessionState, userId?: string): Promise<boolean> {
    const clone = JSON.parse(JSON.stringify(session));
    this.sessions.set(session.sessionId, clone);

    if (userId) {
      let set = this.userSessions.get(userId);
      if (!set) {
        set = new Set();
        this.userSessions.set(userId, set);
      }
      set.add(session.sessionId);
    }

    return true;
  }

  public async getSession(sessionId: string, ownerId?: string): Promise<ClassroomSessionState | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    if (ownerId !== undefined && session.ownerId !== ownerId) return null;
    return JSON.parse(JSON.stringify(session));
  }

  public async deleteSession(sessionId: string, ownerId?: string): Promise<boolean> {
    const existing = this.sessions.get(sessionId);
    if (existing && ownerId !== undefined && existing.ownerId !== ownerId) return false;
    if (existing) {
      this.sessions.delete(sessionId);
      for (const set of this.userSessions.values()) {
        set.delete(sessionId);
      }
      return true;
    }
    return false;
  }

  public async listUserSessions(userId: string): Promise<ClassroomSessionState[]> {
    const set = this.userSessions.get(userId);
    if (!set) return [];
    const list: ClassroomSessionState[] = [];
    for (const id of set) {
      const s = this.sessions.get(id);
      if (s) list.push(JSON.parse(JSON.stringify(s)));
    }
    return list;
  }

  public clear(): void {
    this.sessions.clear();
    this.userSessions.clear();
  }
}

/**
 * Distributed Session Store backed by cache and cloud database
 */
export class DistributedSessionStore implements IClassroomSessionStore {
  private readonly cache: ICacheAdapter;
  private readonly memoryFallback: MemorySessionStore;

  private readonly dbProvider: () => SupabaseClient | null;

  constructor(cache?: ICacheAdapter, dbProvider: () => SupabaseClient | null = getLearnerDb) {
    this.cache = cache || getCacheAdapter();
    this.memoryFallback = MemorySessionStore.getInstance();
    this.dbProvider = dbProvider;
  }

  /**
   * The request-scoped learner client (RLS as the requester) or null. Never the
   * anon singleton and never a service-role client.
   */
  private db(): SupabaseClient | null {
    return this.dbProvider();
  }

  private getCacheKey(sessionId: string): string {
    return `classroom:session:${sessionId}`;
  }

  public async saveSession(session: ClassroomSessionState, userId?: string): Promise<boolean> {
    // 1. Always mirror to local memory fallback for resilience
    await this.memoryFallback.saveSession(session, userId);

    // 2. Set into distributed cache with 2-hour TTL
    const cacheKey = this.getCacheKey(session.sessionId);
    await this.cache.set(cacheKey, session, 7200);

    // 3. Persist to database as the learner (RLS: auth.uid() = user_id)
    const db = this.db();
    if (db && userId) {
      try {
        const { error } = await db
          .from('classroom_sessions')
          .upsert({
            session_id: session.sessionId,
            user_id: userId,
            concept_id: session.conceptId,
            current_stage: session.currentStage,
            stage_index: session.stageIndex,
            mastery_level: session.masteryState,
            mastery_score: session.masteryScore,
            state_json: session,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'session_id' });

        if (error) {
          console.warn('[DistributedSessionStore] Cloud session sync warning:', error.message);
        }
      } catch (err: any) {
        console.warn('[DistributedSessionStore] Cloud session save exception:', err?.message);
      }
    }

    return true;
  }

  public async getSession(sessionId: string, ownerId?: string): Promise<ClassroomSessionState | null> {
    const owned = (s: ClassroomSessionState | null) =>
      s && (ownerId === undefined || s.ownerId === ownerId) ? s : null;

    // 1. Check distributed cache
    const cacheKey = this.getCacheKey(sessionId);
    const cached = await this.cache.get<ClassroomSessionState>(cacheKey);
    if (cached) {
      return owned(cached);
    }

    // 2. Check local memory
    const memorySession = await this.memoryFallback.getSession(sessionId, ownerId);
    if (memorySession) {
      return memorySession;
    }

    // 3. Fallback to Supabase database query if live
    const db = this.db();
    if (db) {
      try {
        let query = db
          .from('classroom_sessions')
          .select('state_json')
          .eq('session_id', sessionId);
        if (ownerId !== undefined) query = query.eq('user_id', ownerId);
        const { data, error } = await query.maybeSingle();

        if (!error && data?.state_json) {
          const session = data.state_json as ClassroomSessionState;
          await this.cache.set(cacheKey, session, 7200);
          return owned(session);
        }
      } catch (err: any) {
        console.warn('[DistributedSessionStore] Cloud getSession exception:', err?.message);
      }
    }

    return null;
  }

  public async deleteSession(sessionId: string, ownerId?: string): Promise<boolean> {
    if (ownerId !== undefined) {
      // Owner-only delete: refuse (without touching anything) if not the owner.
      const owned = await this.getSession(sessionId, ownerId);
      if (!owned) return false;
    }
    await this.memoryFallback.deleteSession(sessionId);
    await this.cache.delete(this.getCacheKey(sessionId));

    const db = this.db();
    if (db) {
      try {
        let del = db.from('classroom_sessions').delete().eq('session_id', sessionId);
        if (ownerId !== undefined) del = del.eq('user_id', ownerId);
        await del;
      } catch (err: any) {
        console.warn('[DistributedSessionStore] Cloud deleteSession exception:', err?.message);
      }
    }

    return true;
  }

  public async listUserSessions(userId: string): Promise<ClassroomSessionState[]> {
    const db = this.db();
    if (db) {
      try {
        const { data, error } = await db
          .from('classroom_sessions')
          .select('state_json')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(20);

        if (!error && data && data.length > 0) {
          return data.map((d: any) => d.state_json as ClassroomSessionState);
        }
      } catch (err: any) {
        console.warn('[DistributedSessionStore] Cloud listUserSessions exception:', err?.message);
      }
    }

    return this.memoryFallback.listUserSessions(userId);
  }
}

let defaultSessionStore: IClassroomSessionStore | null = null;

export function getClassroomSessionStore(): IClassroomSessionStore {
  if (!defaultSessionStore) {
    defaultSessionStore = new DistributedSessionStore();
  }
  return defaultSessionStore;
}

export function resetClassroomSessionStore(): void {
  defaultSessionStore = null;
}
