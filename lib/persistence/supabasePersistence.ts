/**
 * Xpedition Supabase Persistence Adapter
 *
 * Provides cloud database persistence via Supabase (@supabase/supabase-js & @supabase/ssr).
 * Enforces Row Level Security (RLS) and strict user isolation.
 * Automatically fails over to local persistence if network errors or missing tables occur.
 */

import {
  CanonicalUserData,
  PersistenceAdapter,
  AttemptPersistencePayload,
  XiraEducationalMemory,
} from './types';
import { supabase, isSupabaseConfigured } from '../supabase';
import { defaultLocalPersistence } from './localPersistence';

export class SupabasePersistenceAdapter implements PersistenceAdapter {
  private localFallback = defaultLocalPersistence;

  private isLive(): boolean {
    return isSupabaseConfigured && Boolean(supabase);
  }

  public async getUserState(userId: string): Promise<CanonicalUserData | null> {
    if (!userId) return null;

    if (!this.isLive()) {
      return this.localFallback.getUserState(userId);
    }

    try {
      // 1. Fetch user profile from Supabase
      const { data: profileRow, error: profileErr } = await supabase!
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileErr) {
        console.warn('[SupabasePersistence] Profile query issue, falling back:', profileErr.message);
        return this.localFallback.getUserState(userId);
      }

      // Check local cache for rich graph & concept data
      const localData = await this.localFallback.getUserState(userId);
      if (localData) {
        if (profileRow?.display_name) {
          localData.profile.displayName = profileRow.display_name;
        }
        return localData;
      }

      // If no local state exists yet, create default user data
      const defaultData = this.localFallback.createDefaultUserData(
        userId,
        profileRow?.email || 'learner@xpedition.app',
        profileRow?.display_name || 'Learner'
      );
      await this.localFallback.saveUserState(userId, defaultData);
      return defaultData;
    } catch (err) {
      console.warn('[SupabasePersistence] Unexpected error in getUserState:', err);
      return this.localFallback.getUserState(userId);
    }
  }

  public async saveUserState(userId: string, data: CanonicalUserData): Promise<boolean> {
    if (!userId || !data) return false;

    // Always mirror to local persistence for instant hydration & offline resilience
    await this.localFallback.saveUserState(userId, data);

    if (!this.isLive()) {
      return true;
    }

    try {
      // Upsert profile in Supabase
      const { error: profileErr } = await supabase!
        .from('profiles')
        .upsert({
          id: userId,
          email: data.profile.email,
          updated_at: new Date().toISOString(),
        });

      if (profileErr) {
        console.warn('[SupabasePersistence] Profile sync warning:', profileErr.message);
      }

      return true;
    } catch (err) {
      console.warn('[SupabasePersistence] Cloud state save error (safe fallback engaged):', err);
      return true; // Local write succeeded, so operation completes safely
    }
  }

  public async recordAttempt(payload: AttemptPersistencePayload): Promise<{ success: boolean; isDuplicate: boolean }> {
    const { userId, attempt, conceptId } = payload;
    if (!userId || !attempt) return { success: false, isDuplicate: false };

    // Record locally first with idempotency check
    const localResult = await this.localFallback.recordAttempt(payload);
    if (localResult.isDuplicate || !this.isLive()) {
      return localResult;
    }

    try {
      // Persist attempt to Supabase `attempts` table
      const { error: attErr } = await supabase!
        .from('attempts')
        .insert({
          user_id: userId,
          correct: attempt.isCorrect,
          difficulty: attempt.isSolo ? 2 : 1,
          created_at: new Date(attempt.timestamp || Date.now()).toISOString(),
        });

      if (attErr) {
        console.warn('[SupabasePersistence] Attempts table insert warning:', attErr.message);
      }

      return { success: true, isDuplicate: false };
    } catch (err) {
      console.warn('[SupabasePersistence] Attempt cloud sync error:', err);
      return { success: true, isDuplicate: false };
    }
  }

  public async recordXiraMemory(memory: XiraEducationalMemory): Promise<boolean> {
    // Record to local resilient store first
    const localResult = await this.localFallback.recordXiraMemory(memory);
    if (!this.isLive() || !memory?.userId) {
      return localResult;
    }

    try {
      const { error } = await supabase!
        .from('xira_memories')
        .upsert(
          {
            id: memory.id,
            user_id: memory.userId,
            concept_id: memory.conceptId,
            concept_name: memory.conceptName,
            category: memory.category,
            strength: memory.strength,
            evidence_summary: memory.evidenceSummary,
            timestamp: memory.timestamp || Date.now(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,concept_id,category' }
        );

      if (error) {
        console.warn('[SupabasePersistence] xira_memories upsert warning:', error.message);
      }
      return true;
    } catch (err) {
      console.warn('[SupabasePersistence] Cloud xira memory sync error:', err);
      return true;
    }
  }

  public async getXiraMemories(userId: string, conceptId?: string): Promise<XiraEducationalMemory[]> {
    if (!userId) return [];

    if (!this.isLive()) {
      return this.localFallback.getXiraMemories(userId, conceptId);
    }

    try {
      let query = supabase!
        .from('xira_memories')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (conceptId) {
        query = query.eq('concept_id', conceptId);
      }

      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        return this.localFallback.getXiraMemories(userId, conceptId);
      }

      return data.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        conceptId: row.concept_id,
        conceptName: row.concept_name,
        category: row.category,
        strength: Number(row.strength) || 0.5,
        evidenceSummary: row.evidence_summary || '',
        timestamp: Number(row.timestamp) || (row.created_at ? new Date(row.created_at).getTime() : Date.now()),
      }));
    } catch (err) {
      console.warn('[SupabasePersistence] Unexpected error in getXiraMemories:', err);
      return this.localFallback.getXiraMemories(userId, conceptId);
    }
  }

  public async clearUserState(userId: string): Promise<boolean> {
    if (!userId) return false;

    // Clear local storage and memory fallback first
    const localCleared = await this.localFallback.clearUserState(userId);

    if (this.isLive()) {
      try {
        // Delete user's xira memories, attempts, and profile records from Supabase tables
        await supabase!.from('xira_memories').delete().eq('user_id', userId);
        await supabase!.from('attempts').delete().eq('user_id', userId);
        await supabase!.from('profiles').delete().eq('id', userId);
      } catch (err) {
        console.warn('[SupabasePersistence] Cloud data deletion warning:', err);
      }
    }

    return localCleared;
  }
}

export const defaultSupabasePersistence = new SupabasePersistenceAdapter();
