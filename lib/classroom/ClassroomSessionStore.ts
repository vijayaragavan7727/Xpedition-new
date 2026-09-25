/**
 * Xpedition Production Hardening — Distributed Classroom Session Store
 *
 * Provides a resilient, distributed session storage abstraction. Uses distributed caching
 * and cloud database persistence for multi-instance deployments, with transparent in-memory
 * fallback for local and offline scenarios.
 */

import { ClassroomSessionState } from './classroomSessionTypes';
import { getCacheAdapter, ICacheAdapter } from '../cache/cacheAdapter';
import { supabase, isSupabaseConfigured } from '../supabase';

export interface IClassroomSessionStore {
  saveSession(session: ClassroomSessionState, userId?: string): Promise<boolean>;
  getSession(sessionId: string): Promise<ClassroomSessionState | null>;
  deleteSession(sessionId: string): Promise<boolean>;
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

  public async getSession(sessionId: string): Promise<ClassroomSessionState | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    return JSON.parse(JSON.stringify(session));
  }

  public async deleteSession(sessionId: string): Promise<boolean> {
    const existing = this.sessions.get(sessionId);
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

  constructor(cache?: ICacheAdapter) {
    this.cache = cache || getCacheAdapter();
    this.memoryFallback = MemorySessionStore.getInstance();
  }

  private isLive(): boolean {
    return isSupabaseConfigured && Boolean(supabase);
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

    // 3. Persist to database if live
    if (this.isLive() && userId) {
      try {
        const { error } = await supabase!
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

  public async getSession(sessionId: string): Promise<ClassroomSessionState | null> {
    // 1. Check distributed cache
    const cacheKey = this.getCacheKey(sessionId);
    const cached = await this.cache.get<ClassroomSessionState>(cacheKey);
    if (cached) {
      return cached;
    }

    // 2. Check local memory
    const memorySession = await this.memoryFallback.getSession(sessionId);
    if (memorySession) {
      return memorySession;
    }

    // 3. Fallback to Supabase database query if live
    if (this.isLive()) {
      try {
        const { data, error } = await supabase!
          .from('classroom_sessions')
          .select('state_json')
          .eq('session_id', sessionId)
          .maybeSingle();

        if (!error && data?.state_json) {
          const session = data.state_json as ClassroomSessionState;
          await this.cache.set(cacheKey, session, 7200);
          return session;
        }
      } catch (err: any) {
        console.warn('[DistributedSessionStore] Cloud getSession exception:', err?.message);
      }
    }

    return null;
  }

  public async deleteSession(sessionId: string): Promise<boolean> {
    await this.memoryFallback.deleteSession(sessionId);
    await this.cache.delete(this.getCacheKey(sessionId));

    if (this.isLive()) {
      try {
        await supabase!.from('classroom_sessions').delete().eq('session_id', sessionId);
      } catch (err: any) {
        console.warn('[DistributedSessionStore] Cloud deleteSession exception:', err?.message);
      }
    }

    return true;
  }

  public async listUserSessions(userId: string): Promise<ClassroomSessionState[]> {
    if (this.isLive()) {
      try {
        const { data, error } = await supabase!
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
