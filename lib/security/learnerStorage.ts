/**
 * Learner-scoped browser storage.
 *
 * Rules (shared-device safety):
 *   - Learner data is persisted ONLY under a key that includes the authenticated
 *     learner id: `<base>__u_<userId>`.
 *   - With no authenticated learner (guest), data lives in memory for the current
 *     page only and is NEVER written to localStorage.
 *   - There is no unscoped/global fallback key. Reading never falls back to
 *     another learner's data.
 *   - `purgeLearnerLocalData(userId)` removes every key belonging to that learner
 *     (called on logout).
 *
 * The active learner id is a pointer to the last authenticated learner in this
 * browser. It is cleared on logout and is re-validated against the real
 * Supabase session by `AuthIdentitySync`.
 */

export const ACTIVE_USER_KEY = 'xpedition_active_user_id';
const USER_SUFFIX = '__u_';

const guestMemory = new Map<string, string>();
let activeUserMemory: string | null = null;

function storage(kind: 'local' | 'session'): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

function isValidUserId(id: unknown): id is string {
  return typeof id === 'string' && /^[A-Za-z0-9_.:@-]{1,128}$/.test(id);
}

export function setActiveLearnerId(userId: string | null): void {
  activeUserMemory = isValidUserId(userId) ? userId : null;
  const local = storage('local');
  const session = storage('session');
  try {
    if (activeUserMemory) {
      session?.setItem(ACTIVE_USER_KEY, activeUserMemory);
      local?.setItem(ACTIVE_USER_KEY, activeUserMemory);
    } else {
      session?.removeItem(ACTIVE_USER_KEY);
      local?.removeItem(ACTIVE_USER_KEY);
    }
  } catch {
    // ignore storage failures
  }
  if (!activeUserMemory) guestMemory.clear();
}

export function getActiveLearnerId(): string | null {
  if (activeUserMemory) return activeUserMemory;
  try {
    const fromSession = storage('session')?.getItem(ACTIVE_USER_KEY) ?? null;
    const fromLocal = storage('local')?.getItem(ACTIVE_USER_KEY) ?? null;
    const id = fromSession || fromLocal;
    if (isValidUserId(id)) {
      activeUserMemory = id;
      return id;
    }
  } catch {
    // ignore
  }
  return null;
}

export function learnerKey(base: string, userId: string): string {
  return `${base}${USER_SUFFIX}${userId}`;
}

export function readLearnerItem(base: string): string | null {
  const userId = getActiveLearnerId();
  if (!userId) return guestMemory.get(base) ?? null;
  try {
    return storage('local')?.getItem(learnerKey(base, userId)) ?? null;
  } catch {
    return null;
  }
}

/** Returns true when persisted for an authenticated learner, false when kept in guest memory only. */
export function writeLearnerItem(base: string, value: string): boolean {
  const userId = getActiveLearnerId();
  if (!userId) {
    guestMemory.set(base, value);
    return false;
  }
  try {
    storage('local')?.setItem(learnerKey(base, userId), value);
    return true;
  } catch {
    return false;
  }
}

export function removeLearnerItem(base: string): void {
  const userId = getActiveLearnerId();
  guestMemory.delete(base);
  if (!userId) return;
  try {
    storage('local')?.removeItem(learnerKey(base, userId));
  } catch {
    // ignore
  }
}

/** Removes every persisted key that belongs to `userId` (and all guest memory). */
export function purgeLearnerLocalData(userId: string | null): void {
  guestMemory.clear();
  const local = storage('local');
  if (!local || !userId) return;
  const suffix = `${USER_SUFFIX}${userId}`;
  const toRemove: string[] = [];
  for (let i = 0; i < local.length; i++) {
    const key = local.key(i);
    if (!key) continue;
    if (key.endsWith(suffix) || key === `xpedition_user_${userId}` || key.startsWith(`xpedition_notes_${userId}_`)) {
      toRemove.push(key);
    }
  }
  toRemove.forEach((k) => local.removeItem(k));
}

const LEARNER_KEY_PATTERNS: RegExp[] = [
  /__u_(.+)$/, // learnerKey(base, uid)
  /^xpedition_user_state_(.+)$/, // local persistence adapter per learner
  /^xpedition_user_(.+)$/, // store snapshot per learner
  /^xpedition_notes_([^_].*?)_/, // legacy per-learner notes
];

/**
 * Removes every learner-scoped key on this device that does NOT belong to
 * `keepUserId` (null → removes all learners' data). Used on logout and whenever
 * the authenticated identity changes, including changes this tab did not see
 * (sign-out in another tab, expired session, direct sign-in as someone else).
 */
export function purgeAllLearnerLocalDataExcept(keepUserId: string | null): string[] {
  guestMemory.clear();
  const local = storage('local');
  if (!local) return [];
  const toRemove: string[] = [];
  for (let i = 0; i < local.length; i++) {
    const key = local.key(i);
    if (!key || key === ACTIVE_USER_KEY) continue;
    for (const re of LEARNER_KEY_PATTERNS) {
      const m = key.match(re);
      if (m) {
        const owner = m[1];
        if (!keepUserId || (owner !== keepUserId && !key.endsWith(`__u_${keepUserId}`))) toRemove.push(key);
        break;
      }
    }
  }
  toRemove.forEach((k) => local.removeItem(k));
  return toRemove;
}

/** Legacy unscoped keys that could hold ANOTHER learner's data. Never read; always removed. */
export const LEGACY_GLOBAL_KEYS = ['xpedition_user_store_v3', 'xpedition_user_store_v2'];

export function purgeLegacyGlobalKeys(): void {
  const local = storage('local');
  if (!local) return;
  for (const key of LEGACY_GLOBAL_KEYS) {
    try {
      local.removeItem(key);
    } catch {
      // ignore
    }
  }
  // Legacy unscoped notes (`xyra_notes_<concept>` / `xpedition_notes_guest_<concept>`).
  const stale: string[] = [];
  for (let i = 0; i < local.length; i++) {
    const key = local.key(i);
    if (!key) continue;
    if ((key.startsWith('xyra_notes_') || key.startsWith('xpedition_notes_guest_')) && !key.includes(USER_SUFFIX)) {
      stale.push(key);
    }
  }
  stale.forEach((k) => local.removeItem(k));
}

/** Test hook: reset module memory between simulated sessions. */
export function __resetLearnerStorageMemoryForTests(): void {
  guestMemory.clear();
  activeUserMemory = null;
}
