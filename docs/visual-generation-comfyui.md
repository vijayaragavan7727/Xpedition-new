# Xpedition — Visual Intelligence Engine: ComfyUI Foundation & Engine (Phase D1 & D2)

## 1. Architecture Overview (Phase 2)

Phase 2 transitions Xpedition from a single-endpoint generation script into a decoupled, robust **Visual Generation Engine**. The engine acts as a resilient domain boundary between high-level educational services (and future Phase 3 visual reasoning) and the raw ComfyUI execution transport.

```
Visual Request (Domain Contract)
      │
      ▼
VisualGenerationEngine (lib/visualGeneration/VisualGenerationEngine.ts)
      │
      ├──> WorkflowRegistry (lib/visualGeneration/WorkflowRegistry.ts)
      │      [Validates workflow, resolves version & target dimensions]
      │
      ├──> Cache / Identity (lib/visualGeneration/cacheUtils.ts)
      │      [Deterministic prompt hashing & cacheKey resolution]
      │
      ├──> GenerationJobStore (lib/visualGeneration/GenerationJobStore.ts)
      │      [In-flight deduplication, job status tracking & lifecycle]
      │
      ├──> ComfyUIAdapter (lib/visualGeneration/ComfyUIAdapter.ts)
      │      [Transport boundary: POST /prompt, WebSocket/Polling, GET /view]
      │      [Controlled retry policy on transient transport errors]
      │
      └──> AssetStore (lib/visualGeneration/AssetStore.ts)
             [Validation, file persistence in public/generated-visuals/, manifest index]
```

### Key Separation of Concerns
1. **VisualGenerationEngine**: Core orchestrator handling domain validation, cache lookup (`reuse`, `refresh`, `force`), in-flight request deduplication, job state transitions, controlled retries, output processing, and asset registration.
2. **VisualGenerationService**: High-level domain service layer providing backward-compatible APIs and convenience methods for learning objects and educational modules.
3. **WorkflowRegistry**: Versioned catalog of ComfyUI prompt graphs. Prevents client execution of arbitrary JSON node graphs or disk paths.
4. **GenerationJobStore (`IGenerationJobStore`)**: Abstraction for tracking jobs across their lifecycle (`queued`, `submitted`, `running`, `completed`, `failed`, `timed_out`). Prevents concurrent duplicate generation tasks for identical requests.
5. **AssetStore (`IAssetStore`)**: Storage abstraction for validating image buffers (magic bytes, dimensions, file size), persisting output files, creating stable asset IDs, and maintaining a metadata manifest.
6. **ComfyUIAdapter**: Strict low-level transport boundary. The client/browser NEVER communicates with ComfyUI port 8188 directly.

---

## 2. Strong Generation Request Contract

All generation requests are strongly typed through `VisualGenerationRequest` (`lib/visualGeneration/types.ts`):

```typescript
export interface VisualGenerationRequest {
  requestId?: string;
  conceptId: string;                    // e.g., 'dc_motor', 'photosynthesis'
  subject?: string;                      // e.g., 'physics', 'biology'
  visualType: VisualType;               // 'educational_illustration' | 'scientific_diagram' | ...
  prompt: string;                       // Educational prompt (max 1000 characters)
  negativePrompt?: string;              // Optional negative prompt
  workflowId?: string;                  // Target workflow (defaults to visualType)
  width?: number;                       // Supported dimensions (e.g. 512, 768, 1024)
  height?: number;
  seed?: number;                        // Deterministic reproduction seed
  priority?: GenerationPriority;        // 'low' | 'normal' | 'high' | 'interactive'
  cachePolicy?: CachePolicy;            // 'reuse' (default) | 'refresh' | 'force'
  metadata?: Record<string, unknown>;
}
```

### Safety Validations
- **Concept & Prompt**: Required, trimmed, prompt max length bounded to 1,000 characters.
- **Visual Type**: Strictly validated against permitted educational visual types.
- **Dimensions**: Must match supported workflow dimensions and aspect ratios (e.g., 512×512, 768×768, 1024×768, etc.). Minimum 256px, maximum 2048px.
- **Workflow Security**: Workflows cannot be arbitrary file paths; they must resolve deterministically via `WorkflowRegistry`.

---

## 3. Workflow Registry

Workflows are versioned JSON graphs stored under `comfyui/workflows/`. The registry validates workflows at registration time:

- **Currently Active Workflows**:
  - `educational_illustration` (v1.0.0, SD 1.5, CreativeML Open RAIL-M)
- **Supported Future Workflow Slots**:
  - `scientific_diagram`, `concept_illustration`, `historical_scene`, `anatomy_visual`, `chemistry_visual`, `formula_visual`, `background_illustration`
- **Metadata Contract**:
  - Workflow ID, semantic version, model family, supported resolutions, default steps & CFG, license/provenance, and source path.

Clients cannot supply arbitrary workflow graphs; all graphs are strictly loaded from safe local files configured within the registry.

---

## 4. Deterministic Cache & Identity System

To avoid wasteful redundant diffusion passes across classroom sessions, the engine enforces deterministic cache identity (`lib/visualGeneration/cacheUtils.ts`):

### Cache Key Structure
```
c:<concept>::vt:<visualType>::wf:<workflowId>@<version>::m:<modelFamily>::p:<promptHash>::dim:<width>x<height>
```

- **Prompt Normalization**: Lowercased, whitespace collapsed, non-semantic punctuation stripped.
- **Prompt Hash**: SHA-256 (first 16 hex chars) of normalized prompt + negative prompt.
- **Exclusions**: Ephemeral fields (`requestId`, client timestamps, job IDs) are explicitly excluded from cache key calculation.
- **Cache Policies**:
  - `reuse` (default): Returns existing persisted completed asset instantly if available.
  - `refresh`: Re-runs generation and updates the asset record.
  - `force`: Bypasses cache, creates a fresh asset, and preserves existing assets.

---

## 5. Job Lifecycle & In-Flight Concurrency Deduplication

### Job State Transitions
```
queued ──> submitted ──> running ──> completed
   │            │           │
   └───(fail)───┴──(timeout)┴──> failed / timed_out
```

- **Duplicate Prevention**: If Request A is running for `cacheKey_X` and Request B arrives with `cachePolicy: 'reuse'` for the same `cacheKey_X`, Request B attaches to the in-flight Promise of Request A rather than queueing a redundant diffusion job on ComfyUI.

---

## 6. Controlled Retry Policy

The engine differentiates transient transport failures from permanent validation errors:

- **Retried (up to 2 attempts, exponential backoff)**:
  - `COMFYUI_UNAVAILABLE` (network blips, daemon briefly busy)
  - `COMFYUI_TIMEOUT` (temporary load spike, if safe)
  - Raw network `ECONNREFUSED` / `ETIMEDOUT`
- **Never Retried**:
  - `INVALID_REQUEST` / Validation errors
  - `INVALID_WORKFLOW` / Unknown workflow
  - Unsupported dimensions or visual types
  - `INVALID_ASSET` / Corrupt buffer signatures

---

## 7. Asset Store & Output Processing

When ComfyUI completes diffusion:
1. **Magic Byte Validation**: Verifies PNG (`89 50 4E 47`) or JPEG (`FF D8 FF`) file signatures.
2. **Dimension & Size Inspection**: Ensures non-zero length and adheres to maximum payload sizes (15 MB).
3. **Persistence**: Saves asset into `public/generated-visuals/` under sanitized stable naming (`xpedition_<concept>_<promptHash>.png`).
4. **Manifest Indexing**: Records metadata in `public/generated-visuals/assets-manifest.json` for rapid cold-start cache resolution.
5. **Client Sanitization**: `filePath` is stripped before returning to clients; only `publicUrl` (`/generated-visuals/...`) is exposed.

---

## 8. Safe Server Endpoints

### `POST /api/visual-generation`
Generates or reuses an educational visual.
- **Authentication**: Required (NextAuth session or local development bypass).
- **Request Body**: Validated against `VisualGenerationRequest`.
- **Response**: Sanitized asset metadata (`assetId`, `publicUrl`, `visualType`, `dimensions`, `reused: boolean`, `status`).

### `GET /api/visual-generation/[jobId]`
Queries the status of an asynchronous generation job.
- **Authentication**: Required.
- **Response**: `{ jobId, status, conceptId, visualType, assetUrl, createdAt, completedAt, errorCode }`.
- **Security**: Raw stack traces, ComfyUI port 8188 URLs, and filesystem paths are strictly withheld.

---

## 9. Hardware Profile & Model Selection

- **Host OS**: Windows 11 64-bit
- **CPU**: Intel Core (14 logical threads)
- **RAM**: 16 GB System Memory
- **GPU**: Integrated Intel(R) Graphics (CPU execution mode `--cpu`)
- **Selected Model**: Stable Diffusion v1.5 Pruned EMA-only (`v1-5-pruned-emaonly.safetensors`)
- **License**: **CreativeML Open RAIL-M** (Commercial use permitted with standard ethical terms)
- **VRAM / RAM Requirement**: ~2 GB checkpoint size; ~3.5 GB RAM in CPU mode.

---

## 10. How to Run Locally

### Start ComfyUI Daemon (PowerShell):
```powershell
& "$env:USERPROFILE\.comfyui\python\python.exe" "$env:USERPROFILE\.comfyui\ComfyUI\main.py" --cpu --listen 127.0.0.1 --port 8188
```

### Run Phase 1 & 2 Automated Test Suites:
```bash
npm run test:visual-generation          # Phase 1 adapter & service tests
npm run test:visual-generation:engine   # Phase 2 engine, cache, workflow, asset store tests
npm test                                # Full test suite
```

### Run Real Integration Test:
```bash
npx tsx scripts/run-real-generation.ts
```

This script verifies:
1. Engine connectivity to local ComfyUI.
2. Request 1: Fresh generation or manifest resolution for DC Motor.
3. Request 2: Identical request verifying **instant cache reuse** (`reused: true`, 0 diffusion steps).
4. Step 15 Asset Resolver: Instant lookup of existing educational assets.
