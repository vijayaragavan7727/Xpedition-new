/**
 * Inventory of server-side in-memory state that matters for security, with its
 * multi-instance classification. Kept in code so tests fail if a new store is
 * added without being classified, and so the docs have one source of truth.
 *
 *   safe_process_local       correct even when every instance has its own copy
 *   unsafe_in_memory_prod    wrong/weaker across instances; mitigated or documented
 *   requires_shared_store    must use the shared backend in production
 */

export type StateClassification = 'safe_process_local' | 'unsafe_in_memory_prod' | 'requires_shared_store';

export interface StateInventoryEntry {
  id: string;
  module: string;
  holds: string;
  classification: StateClassification;
  productionBoundary: string;
}

export const SECURITY_STATE_INVENTORY: StateInventoryEntry[] = [
  {
    id: 'rate_limit_buckets',
    module: 'lib/security/rateLimiter.ts',
    holds: 'Sliding-window request timestamps per key',
    classification: 'requires_shared_store',
    productionBoundary:
      'Learner-facing sensitive routes use checkUserRateLimit (lib/security/distributedRateLimit.ts) → Postgres xp_rate_limit_hit, shared by all instances. Process-local buckets are only the fallback; XPEDITION_RATE_LIMIT_REQUIRE_SHARED=1 fails closed instead.',
  },
  {
    id: 'canvas_conversation_ownership',
    module: 'lib/security/resourceHandle.ts',
    holds: 'Nothing (stateless HMAC handles bound to the learner)',
    classification: 'safe_process_local',
    productionBoundary:
      'Requires XPEDITION_INTEGRATION_SIGNING_SECRET (same value on every instance). Missing in production → Canvas conversation actions return 503.',
  },
  {
    id: 'classroom_session_cache',
    module: 'lib/classroom/ClassroomSessionStore.ts',
    holds: 'Session state cache + memory fallback',
    classification: 'unsafe_in_memory_prod',
    productionBoundary:
      'Every read is owner-filtered, so a cache miss on another instance fails closed (404), never open. Postgres (RLS auth.uid() = user_id, via the request-scoped client) is the durable cross-instance store.',
  },
  {
    id: 'visual_generation_jobs',
    module: 'lib/visualGeneration/GenerationJobStore.ts',
    holds: 'Generation job records',
    classification: 'unsafe_in_memory_prod',
    productionBoundary:
      'Owner-checked on every read; a poll that lands on another instance returns 404 (fails closed). Generation is synchronous, so the POST response already carries the owned result. A shared job store is required before async/multi-instance polling.',
  },
  {
    id: 'learner_visual_assets',
    module: 'lib/visualGeneration/learnerVisualGeneration.ts',
    holds: 'Private learner-generated images on local disk (outside public/)',
    classification: 'unsafe_in_memory_prod',
    productionBoundary:
      'Served only through the owner-checked asset route. Local disk is per instance; a private object store is required for multi-instance asset delivery (not configured).',
  },
  {
    id: 'cache_adapter',
    module: 'lib/cache/cacheAdapter.ts',
    holds: 'Generic cache (memory; REDIS_URL placeholder is process-local)',
    classification: 'unsafe_in_memory_prod',
    productionBoundary:
      'No security decision depends on it being shared. The former Redis adapter claimed a connection it did not have; it now reports distributed = false.',
  },
  {
    id: 'auth_mode',
    module: 'lib/auth/authMode.ts',
    holds: 'Derived from environment only',
    classification: 'safe_process_local',
    productionBoundary: 'Identical on every instance with identical environment.',
  },
];
