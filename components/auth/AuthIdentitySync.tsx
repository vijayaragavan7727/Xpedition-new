'use client';

/**
 * Keeps the local "active learner" pointer consistent with the REAL auth session.
 *
 *  - Supabase configured: the pointer must equal the Supabase session user.
 *    A mismatch (e.g. another learner signed in on this device) or no session
 *    clears the pointer, so the previous learner's locally cached data is never
 *    shown to anyone else.
 *  - Explicit dev bypass: local learners are allowed (development only).
 *  - Auth unavailable (e.g. production without Supabase): no learner identity.
 */

import { useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { currentAuthMode } from '@/lib/auth/authMode';
import { getActiveStoreUser, setActiveStoreUser } from '@/lib/store';
import { purgeLearnerLocalData } from '@/lib/security/learnerStorage';

export function AuthIdentitySync() {
  useEffect(() => {
    const mode = currentAuthMode();
    if (mode === 'dev_local') return;
    if (mode === 'unavailable' || !isSupabaseConfigured || !supabase) {
      if (getActiveStoreUser()) setActiveStoreUser(null);
      return;
    }
    let cancelled = false;
    const reconcile = (sessionUserId: string | null) => {
      if (cancelled) return;
      const pointer = getActiveStoreUser();
      if (sessionUserId && pointer !== sessionUserId) {
        // A different learner is now signed in on this device: remove the
        // previous learner's local copy before switching identity.
        if (pointer) purgeLearnerLocalData(pointer);
        setActiveStoreUser(sessionUserId);
        window.dispatchEvent(new CustomEvent('xpedition:identity-changed'));
      } else if (!sessionUserId && pointer) {
        setActiveStoreUser(null);
        window.dispatchEvent(new CustomEvent('xpedition:identity-changed'));
      }
    };
    supabase.auth
      .getSession()
      .then(({ data }) => reconcile(data?.session?.user?.id ?? null))
      .catch(() => reconcile(null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => reconcile(session?.user?.id ?? null));
    return () => {
      cancelled = true;
      sub?.subscription?.unsubscribe();
    };
  }, []);
  return null;
}

export default AuthIdentitySync;
