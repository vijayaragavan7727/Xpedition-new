/**
 * Xpedition Visual Intelligence — Types (Phase 1 & Phase 2 Foundation)
 *
 * Strongly typed contracts for the Visual Generation Engine, Workflow Registry,
 * Asset Store, and Job Store underneath Xpedition.
 */

export type VisualType =
  | 'educational_illustration'
  | 'schematic'
  | 'diagram'
  | 'formula_focus'
  | 'tactile_learning_object'
  | 'scientific_diagram'
  | 'concept_illustration'
  | 'anatomy_visual'
  | 'chemistry_visual';

export type VisualGenerationStatus =
  | 'queued'
  | 'submitted'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timed_out';

export type CachePolicy = 'reuse' | 'refresh' | 'force';

export type GenerationPriority = 'low' | 'normal' | 'high';

export interface VisualGenerationRequest {
  requestId?: string;                    // Client or server tracking ID
  conceptId: string;                     // e.g. "dc_motor", "magnetic_force"
  subject?: string;                      // e.g. "physics", "chemistry", "mathematics"
  visualType?: VisualType;               // e.g. "educational_illustration"
  prompt: string;                        // Educational prompt describing the concept
  negativePrompt?: string;               // Quality and safety exclusions
  width?: number;                        // Output width (256 - 1024, step 64)
  height?: number;                       // Output height (256 - 1024, step 64)
  workflow?: string;                     // Workflow name or alias
  workflowId?: string;                   // Allowed server-managed workflow template
  seed?: number;                         // Deterministic seed if specified
  steps?: number;                        // Sampling steps (e.g. 12-25)
  cfg?: number;                          // Classifier free guidance scale (e.g. 7.0)
  priority?: GenerationPriority;         // Queue priority (low, normal, high)
  cachePolicy?: CachePolicy;             // "reuse" (default) | "refresh" | "force"
  clientMetadata?: Record<string, any>;  // Optional tracing context
}

export interface GeneratedVisualOutput {
  filename: string;
  subfolder: string;
  type: string;                          // "output" | "temp"
  mimeType: string;                      // "image/png" | "image/jpeg"
  url: string;                           // Server-proxied internal endpoint or public URL
  base64Data?: string;                   // Direct base64 payload for embedding
  width: number;
  height: number;
  sizeBytes?: number;
}

export interface EducationalAssetProvenance {
  model: string;
  modelLicense: string;
  modelFamily: string;
  vramMode: 'cpu' | 'lowvram' | 'cuda';
  source: 'comfyui';
}

export interface EducationalAsset {
  assetId: string;                       // Stable unique asset identifier (e.g. "ast_dcmotor_...")
  conceptId: string;
  visualType: VisualType;
  workflowId: string;
  workflowVersion: string;
  modelFamily: string;
  promptHash: string;                    // Deterministic SHA-256 hash of normalized prompt
  cacheKey: string;                      // Deterministic composite cache key
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  seed: number;
  source: 'comfyui';
  generatedAt: number;
  publicUrl: string;                     // Web-accessible URL (/generated-visuals/...)
  mimeType: string;
  sizeBytes: number;
  provenance: EducationalAssetProvenance;
  status: 'ready' | 'pending' | 'failed';
  filePath?: string;                     // Internal server path (never exposed in public API)
}

export interface VisualGenerationMetadata {
  model: string;
  modelLicense: string;
  workflowId: string;
  workflowVersion: string;
  seed: number;
  steps: number;
  cfg: number;
  promptId: string;
  executionTimeMs?: number;
  vramMode: 'cpu' | 'lowvram' | 'cuda';
  generatedAt: number;
  cacheKey?: string;
  reused?: boolean;
}

export interface VisualGenerationJob {
  jobId: string;                         // ComfyUI prompt_id or internal UUID
  requestId: string;                     // Request tracking ID
  conceptId: string;
  workflowId: string;
  status: VisualGenerationStatus;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  updatedAt: number;
  cacheKey: string;
  outputAssetId?: string;
  asset?: EducationalAsset;
  output?: GeneratedVisualOutput;        // Backwards compatibility with Phase 1
  error?: string;
  errorCode?: string;
  retryCount: number;
  maxRetries: number;
  metadata?: VisualGenerationMetadata;
  request: VisualGenerationRequest;
  reused?: boolean;
}

export interface WorkflowDefinition {
  workflowId: string;
  version: string;
  name: string;
  description: string;
  visualType: VisualType;
  modelFamily: string;
  targetModel: string;
  license: string;
  sourceFile: string;                    // Relative to comfyui/workflows
  supportedDimensions: {
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    maxHeight: number;
    defaultWidth: number;
    defaultHeight: number;
    step: number;
  };
  defaultParameters: {
    steps: number;
    cfg: number;
    sampler: string;
    scheduler: string;
  };
  enabled: boolean;
}

export interface ComfyUIPromptResponse {
  prompt_id: string;
  number: number;
  node_errors?: Record<string, any>;
}

export interface ComfyUIHistoryOutput {
  images?: Array<{
    filename: string;
    subfolder: string;
    type: string;
  }>;
}

export interface ComfyUIHistoryItem {
  prompt: [number, string, Record<string, any>, Record<string, any>, string[]];
  outputs: Record<string, ComfyUIHistoryOutput>;
  status?: {
    status_str: string;
    completed: boolean;
    messages?: any[];
  };
}

export type ComfyUIHistoryResponse = Record<string, ComfyUIHistoryItem>;

export interface ComfyUISystemStats {
  system: {
    os: string;
    python_version: string;
    embedded_python: boolean;
  };
  devices: Array<{
    name: string;
    type: string;
    total_memory: number;
    free_memory: number;
  }>;
}
