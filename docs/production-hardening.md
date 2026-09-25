# Xpedition — Phase 5: Production Hardening & Release Readiness

## 1. Overview & Architecture

Phase 5 hardens the entire Xpedition learning and visual intelligence platform for production cloud deployment while preserving local offline developer workflows.

```
                         Xpedition
                            │
                     Authentication (Supabase SSR / ServerAuth)
                            │
                            ▼
                     Application APIs
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
      Classroom        Visual Engine      Learning Data
          │                 │                 │
          ▼                 ▼                 ▼
       Xira             Asset Store       PostgreSQL
          │                 │                 │
          ▼                 ▼                 │
      Telemetry       Object Storage          │
          │         (Supabase / S3)           │
          │                 │                 │
          └─────────────────┼─────────────────┘
                            ▼
                     Redis / Cache (TTL)
                            │
                            ▼
                     Circuit Breaker
                            │
                            ▼
                         ComfyUI
```

---

## 2. Persistent Data Architecture & Database DDL

Production database tables and Row-Level Security (RLS) policies are defined idempotently in [`supabase/schema.sql`](file:///c:/Users/VIJAYA%20RAGAVAN/Desktop/Xpedition%20new/supabase/schema.sql).

### 2.1 Classroom Sessions (`public.classroom_sessions`)
- **Purpose**: Stores active and completed multi-stage classroom states across instances.
- **Columns**: `session_id` (PK), `user_id` (FK), `concept_id`, `current_stage`, `stage_index`, `mastery_level`, `mastery_score`, `state_json` (JSONB), `created_at`, `updated_at`.
- **Security**: RLS enabled. Users can only read and write their own sessions (`auth.uid() = user_id`).

### 2.2 Classroom Telemetry (`public.classroom_telemetry`)
- **Purpose**: Captures sanitized pedagogical events (actions, hint requests, misconceptions, stage progression).
- **Columns**: `id` (PK UUID), `session_id`, `user_id` (FK), `event_type`, `concept_id`, `stage`, `data_json` (JSONB), `timestamp`, `created_at`.
- **Security**: RLS enabled. Strips all authentication tokens, passwords, and student PII before insertion.

### 2.3 Educational Assets (`public.educational_assets`)
- **Purpose**: Persistent catalog of verified deterministic diagrams and cached diffusion-generated visuals.
- **Columns**: `asset_id` (PK), `concept_id`, `visual_type`, `workflow_id`, `workflow_version`, `model_family`, `prompt_hash`, `cache_key` (UNIQUE), `public_url`, `storage_path`, `mime_type`, `size_bytes`, `status`, `provenance_json` (JSONB), `created_at`.
- **Security**: RLS enabled. Public read access allowed for ready assets (`status = 'ready'`); write access restricted to authenticated service roles.

### 2.4 Generation Jobs (`public.generation_jobs`)
- **Purpose**: Tracks asynchronous and synchronous ComfyUI generation jobs.
- **Columns**: `job_id` (PK), `request_id`, `user_id` (FK), `concept_id`, `cache_key`, `status`, `retry_count`, `error`, `error_code`, `output_asset_id` (FK), `metadata_json`, `created_at`, `updated_at`.
- **Security**: RLS enabled. Users can view and create their own jobs.

---

## 3. Distributed Session Architecture

Implemented in [`lib/classroom/ClassroomSessionStore.ts`](file:///c:/Users/VIJAYA%20RAGAVAN/Desktop/Xpedition%20new/lib/classroom/ClassroomSessionStore.ts):
- **`MemorySessionStore`**: Fast, thread-safe in-memory session cache for local development and offline mode.
- **`DistributedSessionStore`**: Backed by `ICacheAdapter` (Redis / memory) and Supabase database persistence.
- **Seamless Failover**: If the cloud database or cache is temporarily unreachable, the store falls back to memory without interrupting the learner's live classroom session.

---

## 4. Production Asset Storage Abstraction

Implemented in [`lib/storage/storageBackend.ts`](file:///c:/Users/VIJAYA%20RAGAVAN/Desktop/Xpedition%20new/lib/storage/storageBackend.ts) and integrated into [`lib/visualGeneration/AssetStore.ts`](file:///c:/Users/VIJAYA%20RAGAVAN/Desktop/Xpedition%20new/lib/visualGeneration/AssetStore.ts):
- **`LocalStorageBackend`**: Writes to `public/generated-visuals` with clean relative URLs (`/generated-visuals/xpedition_*.png`).
- **`SupabaseStorageBackend`**: Uploads binary buffers directly to Supabase Storage bucket (`educational-assets`), returning CDN-backed public URLs (`https://<ref>.supabase.co/storage/v1/object/public/...`).
- **Security Invariant**: Internal server filesystem paths (`filePath`) are strictly sanitized via `LocalAssetStore.sanitizeForClient()` prior to returning responses to browser clients.

---

## 5. Distributed Cache Abstraction

Implemented in [`lib/cache/cacheAdapter.ts`](file:///c:/Users/VIJAYA%20RAGAVAN/Desktop/Xpedition%20new/lib/cache/cacheAdapter.ts):
- **`ICacheAdapter`**: Contract for `get<T>`, `set<T>`, `delete`, `has`, `clear`.
- **`MemoryCacheAdapter`**: High-performance LRU memory store with TTL support.
- **`RedisCacheAdapter`**: Cloud distributed cache supporting Redis or Upstash REST. Transparently falls back to in-memory caching upon network interruptions.

---

## 6. Generation Reliability & ComfyUI Circuit Breaker

Implemented in [`lib/visualGeneration/ComfyUICircuitBreaker.ts`](file:///c:/Users/VIJAYA%20RAGAVAN/Desktop/Xpedition%20new/lib/visualGeneration/ComfyUICircuitBreaker.ts):
- **Three-State Machine**:
  - `CLOSED`: Normal operation; all requests sent to ComfyUI.
  - `OPEN`: Tripped after 3 consecutive failures; requests fast-fail immediately without blocking for 5-minute timeouts, instantly engaging deterministic fallbacks.
  - `HALF_OPEN`: Entered after 30 seconds; permits a single probe request to test ComfyUI recovery.
- **Integration**: Wrapped around `VisualGenerationEngine.executeGenerationWithRetry()` and `isEngineHealthy()`.

---

## 7. API Hardening & Rate Limiting

Implemented in [`lib/security/rateLimiter.ts`](file:///c:/Users/VIJAYA%20RAGAVAN/Desktop/Xpedition%20new/lib/security/rateLimiter.ts):
- **Sliding-Window Rate Limiter**:
  - `POST /api/visual-generation`: 10 requests / minute per client/user.
  - `POST /api/classroom/session`: 60 requests / minute per client/user.
  - Default API ceiling: 120 requests / minute.
- **RFC Standards**: Returns HTTP 429 Too Many Requests with standard response headers:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`
  - `Retry-After`
- **Isolation**: Keyed by `user:<userId>:<endpoint>` for authenticated sessions and `ip:<clientIp>:<endpoint>` for unauthenticated traffic.

---

## 8. Observability & Readiness Health Check

- **Production Logger** ([`lib/observability/productionLogger.ts`](file:///c:/Users/VIJAYA%20RAGAVAN/Desktop/Xpedition%20new/lib/observability/productionLogger.ts)):
  - Outputs single-line structured JSON in production for Datadog / CloudWatch / Vercel Logs.
  - Automatically redacts sensitive fields: `password`, `token`, `authorization`, `cookie`, `secret`, `apiKey`, `anonKey`, `serviceRoleKey`.
- **Health Check Endpoint** ([`app/api/health/route.ts`](file:///c:/Users/VIJAYA%20RAGAVAN/Desktop/Xpedition%20new/app/api/health/route.ts)):
  - Public `GET /api/health` reporting on core subsystems (`database`, `cache`, `storage`, `visualEngine`).
  - Returns `status: 'healthy'` or `status: 'degraded'`.
  - Sets `Cache-Control: no-store, no-cache, must-revalidate`.
  - Zero leak of server IP addresses, internal ports (8188), or private tokens.

---

## 9. Production Configuration Template

Documented in [`.env.example`](file:///c:/Users/VIJAYA%20RAGAVAN/Desktop/Xpedition%20new/.env.example) and managed by [`lib/config/productionConfig.ts`](file:///c:/Users/VIJAYA%20RAGAVAN/Desktop/Xpedition%20new/lib/config/productionConfig.ts):

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | - | Supabase project API gateway |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | - | Public Supabase client key |
| `SUPABASE_SERVICE_ROLE_KEY` | - | Backend server privileged key (optional) |
| `COMFYUI_BASE_URL` | `http://127.0.0.1:8188` | Internal ComfyUI host (server-only) |
| `COMFYUI_TIMEOUT_MS` | `300000` | Maximum generation timeout |
| `CACHE_PROVIDER` | `memory` | Distributed cache (`memory` or `redis`) |
| `REDIS_URL` | - | Connection string for cloud Redis |
| `STORAGE_PROVIDER` | `local` | Asset backend (`local`, `supabase`, `s3`) |
| `SUPABASE_STORAGE_BUCKET`| `educational-assets` | Target Supabase storage bucket |
| `RATE_LIMIT_ENABLED` | `true` | Sliding-window rate limiting toggle |
| `RATE_LIMIT_VISUAL_GEN` | `10` | Max visual generations per minute |
| `RATE_LIMIT_CLASSROOM` | `60` | Max classroom actions per minute |
| `LOG_LEVEL` | `info` | Minimum log severity |

---

## 10. Regression Protection & Verification

- **Comprehensive Test Suite**:
  - `test/runPhase5HardeningTest.js`: 89 tests covering storage, cache, circuit breaker, rate limiting, logging, sessions, health API, database DDL, and API security.
  - Integrated into `npm test` across all 20 test suites.
- **Verification Matrix**:
  - `npm test`: PASS (20 suites)
  - `npx tsc --noEmit`: PASS (0 errors)
  - `npm run lint`: PASS (0 errors)
  - `npm run build`: PASS (51 static & dynamic routes compiled)
