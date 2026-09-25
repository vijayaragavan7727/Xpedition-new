import crypto from 'crypto';
import {
  VisualGenerationRequest,
  VisualGenerationJob,
  EducationalAsset,
  GeneratedVisualOutput,
  VisualType,
  CachePolicy,
} from './types';
import {
  VisualGenerationError,
  InvalidVisualRequestError,
  ComfyUIUnavailableError,
  ComfyUITimeoutError,
  WorkflowExecutionError,
} from './errors';
import { workflowRegistry, WorkflowRegistry } from './WorkflowRegistry';
import { assetStore, IAssetStore, LocalAssetStore } from './AssetStore';
import { generationJobStore, IGenerationJobStore, MemoryJobStore } from './GenerationJobStore';
import { ComfyUIAdapter } from './ComfyUIAdapter';
import { buildCacheKeyFromRequest } from './cacheUtils';
import { comfyUICircuitBreaker } from './ComfyUICircuitBreaker';

export interface VisualGenerationEngineOptions {
  adapter?: ComfyUIAdapter;
  registry?: WorkflowRegistry;
  assetStore?: IAssetStore;
  jobStore?: IGenerationJobStore;
  mockMode?: boolean;
  maxRetries?: number;
}

export class VisualGenerationEngine {
  private static instance: VisualGenerationEngine;
  private readonly adapter: ComfyUIAdapter;
  private readonly registry: WorkflowRegistry;
  private readonly assetStore: IAssetStore;
  private readonly jobStore: IGenerationJobStore;
  private readonly mockMode: boolean;
  private readonly maxRetries: number;

  // Active in-flight generation promises keyed by cacheKey to eliminate duplicate concurrent jobs
  private readonly inFlightJobs: Map<string, Promise<VisualGenerationJob>> = new Map();

  constructor(options: VisualGenerationEngineOptions = {}) {
    this.adapter = options.adapter || new ComfyUIAdapter();
    this.registry = options.registry || workflowRegistry;
    this.assetStore = options.assetStore || assetStore;
    this.jobStore = options.jobStore || generationJobStore;
    this.mockMode = options.mockMode ?? (process.env.MOCK_VISUAL_GENERATION === 'true');
    this.maxRetries = options.maxRetries ?? 1;
  }

  public static getInstance(options?: VisualGenerationEngineOptions): VisualGenerationEngine {
    if (!VisualGenerationEngine.instance || options) {
      VisualGenerationEngine.instance = new VisualGenerationEngine(options);
    }
    return VisualGenerationEngine.instance;
  }

  /**
   * Validates incoming visual generation requests against safety and format limits
   */
  public validateRequest(request: VisualGenerationRequest): void {
    if (!request || typeof request !== 'object') {
      throw new InvalidVisualRequestError('Request payload must be an object');
    }

    if (!request.conceptId || typeof request.conceptId !== 'string' || request.conceptId.trim().length === 0) {
      throw new InvalidVisualRequestError('conceptId is required and must be a non-empty string');
    }

    if (request.conceptId.length > 64) {
      throw new InvalidVisualRequestError('conceptId must not exceed 64 characters');
    }

    if (!request.prompt || typeof request.prompt !== 'string' || request.prompt.trim().length === 0) {
      throw new InvalidVisualRequestError('prompt is required and must be a non-empty string');
    }

    if (request.prompt.length > 2000) {
      throw new InvalidVisualRequestError('prompt must not exceed 2000 characters');
    }

    if (request.negativePrompt && request.negativePrompt.length > 1000) {
      throw new InvalidVisualRequestError('negativePrompt must not exceed 1000 characters');
    }

    const validVisualTypes: VisualType[] = [
      'educational_illustration',
      'schematic',
      'diagram',
      'formula_focus',
      'tactile_learning_object',
      'scientific_diagram',
      'concept_illustration',
      'anatomy_visual',
      'chemistry_visual',
    ];

    if (request.visualType && !validVisualTypes.includes(request.visualType)) {
      throw new InvalidVisualRequestError(
        `Invalid visualType: ${request.visualType}. Must be one of: ${validVisualTypes.join(', ')}`
      );
    }

    const validCachePolicies: CachePolicy[] = ['reuse', 'refresh', 'force'];
    if (request.cachePolicy && !validCachePolicies.includes(request.cachePolicy)) {
      throw new InvalidVisualRequestError(
        `Invalid cachePolicy: ${request.cachePolicy}. Must be one of: ${validCachePolicies.join(', ')}`
      );
    }
  }

  /**
   * Healthcheck proxy for local ComfyUI instance
   */
  public async isEngineHealthy(): Promise<boolean> {
    if (comfyUICircuitBreaker.getState() === 'OPEN') {
      return false;
    }
    const res = await this.adapter.isHealthy();
    if (res.ok) {
      comfyUICircuitBreaker.recordSuccess();
    }
    return res.ok;
  }

  /**
   * Step 15: Resolves whether an existing asset is already available without generating.
   * Answers: "Do we already have a suitable asset?"
   */
  public async resolveExistingAsset(query: {
    conceptId: string;
    visualType?: VisualType;
    promptHash?: string;
  }): Promise<EducationalAsset | null> {
    return this.assetStore.resolveExistingAsset(query);
  }

  /**
   * Retrieves a job by ID from the job store
   */
  public async getJob(jobId: string): Promise<VisualGenerationJob | null> {
    return this.jobStore.getJob(jobId);
  }

  /**
   * Primary entry point:
   * Validates -> Computes Cache Identity -> Checks Existing Asset -> Concurrency Check -> Generates
   */
  public async generateVisual(request: VisualGenerationRequest): Promise<VisualGenerationJob> {
    const startTime = Date.now();
    this.validateRequest(request);

    const cachePolicy = request.cachePolicy || 'reuse';
    const visualType = request.visualType || 'educational_illustration';
    const workflowId = request.workflowId || request.workflow || visualType;

    // Resolve workflow definition
    const workflow = this.registry.resolve(workflowId);

    // Compute deterministic cache identity
    const { promptHash, cacheKey } = buildCacheKeyFromRequest(request, {
      workflowId: workflow.workflowId,
      version: workflow.version,
      model: workflow.targetModel,
    });

    const requestId = request.requestId || `req_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    // -------------------------------------------------------------------------
    // STEP 8: Cache Lookup & Concurrency Safety
    // -------------------------------------------------------------------------
    if (cachePolicy === 'reuse') {
      // 1. Check if a completed asset already exists for this exact cache key
      const cachedAsset = await this.assetStore.findByCacheKey(cacheKey);
      if (cachedAsset && cachedAsset.status === 'ready') {
        const cachedOutput: GeneratedVisualOutput = {
          filename: `xpedition_${cachedAsset.assetId}.png`,
          subfolder: '',
          type: 'output',
          mimeType: cachedAsset.mimeType,
          url: cachedAsset.publicUrl,
          width: cachedAsset.width,
          height: cachedAsset.height,
          sizeBytes: cachedAsset.sizeBytes,
        };

        const cachedJob: VisualGenerationJob = {
          jobId: `job_cached_${cachedAsset.assetId}`,
          requestId,
          conceptId: request.conceptId,
          workflowId: workflow.workflowId,
          status: 'completed',
          createdAt: startTime,
          startedAt: startTime,
          completedAt: startTime,
          updatedAt: startTime,
          cacheKey,
          outputAssetId: cachedAsset.assetId,
          asset: cachedAsset,
          output: cachedOutput,
          retryCount: 0,
          maxRetries: this.maxRetries,
          reused: true,
          request,
          metadata: {
            model: cachedAsset.provenance.model,
            modelLicense: cachedAsset.provenance.modelLicense,
            workflowId: cachedAsset.workflowId,
            workflowVersion: cachedAsset.workflowVersion,
            seed: cachedAsset.seed,
            steps: request.steps || workflow.defaultParameters.steps,
            cfg: request.cfg || workflow.defaultParameters.cfg,
            promptId: `cached_${cachedAsset.assetId}`,
            executionTimeMs: 0,
            vramMode: cachedAsset.provenance.vramMode,
            generatedAt: cachedAsset.generatedAt,
            cacheKey,
            reused: true,
          },
        };

        return cachedJob;
      }

      // 2. Check if an equivalent generation job is currently in flight
      const inFlight = this.inFlightJobs.get(cacheKey);
      if (inFlight) {
        return inFlight;
      }
    }

    // -------------------------------------------------------------------------
    // STEP 5: Create Job Record
    // -------------------------------------------------------------------------
    const initialJobId = `job_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const initialJob: VisualGenerationJob = {
      jobId: initialJobId,
      requestId,
      conceptId: request.conceptId,
      workflowId: workflow.workflowId,
      status: 'queued',
      createdAt: startTime,
      updatedAt: startTime,
      cacheKey,
      retryCount: 0,
      maxRetries: this.maxRetries,
      reused: false,
      request,
      metadata: {
        model: workflow.targetModel,
        modelLicense: workflow.license,
        workflowId: workflow.workflowId,
        workflowVersion: workflow.version,
        seed: request.seed ?? Math.floor(Math.random() * 1000000000),
        steps: request.steps ?? workflow.defaultParameters.steps,
        cfg: request.cfg ?? workflow.defaultParameters.cfg,
        promptId: '',
        vramMode: 'cpu',
        generatedAt: startTime,
        cacheKey,
        reused: false,
      },
    };

    await this.jobStore.createJob(initialJob);

    // Fast-path for mock mode in unit tests and CI/CD
    if (this.mockMode) {
      return this.handleMockGeneration(initialJob, promptHash, cacheKey, workflow);
    }

    // Wrap execution in in-flight cache map to protect concurrency
    const executionPromise = this.executeGenerationWithRetry(initialJob, workflow, promptHash, cacheKey);
    this.inFlightJobs.set(cacheKey, executionPromise);

    try {
      return await executionPromise;
    } finally {
      this.inFlightJobs.delete(cacheKey);
    }
  }

  /**
   * Executes generation with bounded, transient retry policy (Step 11)
   */
  private async executeGenerationWithRetry(
    job: VisualGenerationJob,
    workflow: any,
    promptHash: string,
    cacheKey: string
  ): Promise<VisualGenerationJob> {
    if (!comfyUICircuitBreaker.canExecute()) {
      throw new ComfyUIUnavailableError(
        `Visual generation engine is temporarily paused (circuit breaker is ${comfyUICircuitBreaker.getState()}).`
      );
    }

    let currentAttempt = 0;
    const maxAttempts = 1 + this.maxRetries;

    while (currentAttempt < maxAttempts) {
      try {
        currentAttempt++;
        const result = await this.executePipeline(job, workflow, promptHash, cacheKey);
        comfyUICircuitBreaker.recordSuccess();
        return result;
      } catch (err: any) {
        comfyUICircuitBreaker.recordFailure();
        const isTransient =
          err instanceof ComfyUIUnavailableError ||
          (err instanceof Error && err.message.includes('ECONNREFUSED'));

        if (isTransient && currentAttempt < maxAttempts) {
          console.warn(
            `[VisualGenerationEngine] Transient generation error on attempt ${currentAttempt}/${maxAttempts}. Retrying in 1500ms...`
          );
          await this.jobStore.updateJob(job.jobId, {
            retryCount: currentAttempt,
            status: 'queued',
          });
          await new Promise((resolve) => setTimeout(resolve, 1500));
          continue;
        }

        // Permanent failure or retry exhausted
        const status = err instanceof ComfyUITimeoutError ? 'timed_out' : 'failed';
        await this.jobStore.updateJob(job.jobId, {
          status,
          completedAt: Date.now(),
          error: err.userMessage || 'Visual generation failed.',
          errorCode: err.code || 'UNKNOWN_ERROR',
        });

        throw err;
      }
    }

    throw new VisualGenerationError(
      'UNKNOWN_ERROR',
      'Retry loop terminated unexpectedly',
      'Visual generation could not be completed.'
    );
  }

  /**
   * Internal pipeline: Load graph -> ComfyUI queue -> Monitor -> Fetch -> AssetStore -> Complete
   */
  private async executePipeline(
    job: VisualGenerationJob,
    workflow: any,
    promptHash: string,
    cacheKey: string
  ): Promise<VisualGenerationJob> {
    const startTime = Date.now();
    const { nodes, metadata } = this.registry.loadWorkflowPromptGraph(workflow, job.request);

    // 1. Submit workflow to ComfyUI
    await this.jobStore.updateJob(job.jobId, { status: 'submitted', startedAt: startTime });
    const submitResponse = await this.adapter.submitWorkflow(nodes);
    const promptId = submitResponse.prompt_id;

    await this.jobStore.updateJob(job.jobId, {
      status: 'running',
      metadata: {
        ...job.metadata!,
        promptId,
      },
    });

    // 2. Monitor execution until completion
    const historyItem = await this.adapter.waitForCompletion(promptId);

    // 3. Extract output image descriptors
    const outputs = historyItem.outputs || {};
    let firstImage: { filename: string; subfolder: string; type: string } | null = null;

    for (const [, nodeOutput] of Object.entries(outputs)) {
      if (nodeOutput.images && nodeOutput.images.length > 0) {
        firstImage = nodeOutput.images[0];
        break;
      }
    }

    if (!firstImage) {
      throw new VisualGenerationError(
        'COMFYUI_NO_OUTPUT',
        `Generation finished but no image outputs recorded for prompt ${promptId}`,
        'The visual engine did not return an image output.'
      );
    }

    // 4. Retrieve image binary through ComfyUI adapter boundary
    const { buffer, mimeType } = await this.adapter.fetchImageBuffer(
      firstImage.filename,
      firstImage.subfolder,
      firstImage.type
    );

    // 5. Output Processing & Persistence through AssetStore (Step 7 & 10)
    const asset = await this.assetStore.saveAsset({
      conceptId: job.request.conceptId,
      visualType: job.request.visualType || 'educational_illustration',
      workflowId: workflow.workflowId,
      workflowVersion: workflow.version,
      modelFamily: workflow.modelFamily,
      model: workflow.targetModel,
      modelLicense: workflow.license,
      prompt: job.request.prompt,
      negativePrompt: job.request.negativePrompt,
      promptHash,
      cacheKey,
      width: metadata.width,
      height: metadata.height,
      seed: metadata.seed,
      imageBuffer: buffer,
      mimeType,
    });

    const executionTimeMs = Date.now() - startTime;

    const output: GeneratedVisualOutput = {
      filename: `xpedition_${asset.assetId}.png`,
      subfolder: firstImage.subfolder,
      type: firstImage.type,
      mimeType,
      url: asset.publicUrl,
      base64Data: `data:${mimeType};base64,${buffer.toString('base64')}`,
      width: asset.width,
      height: asset.height,
      sizeBytes: asset.sizeBytes,
    };

    const completedJob: VisualGenerationJob = {
      ...job,
      status: 'completed',
      completedAt: Date.now(),
      updatedAt: Date.now(),
      outputAssetId: asset.assetId,
      asset,
      output,
      reused: false,
      metadata: {
        ...job.metadata!,
        promptId,
        executionTimeMs,
        cacheKey,
        reused: false,
      },
    };

    await this.jobStore.updateJob(job.jobId, completedJob);
    return completedJob;
  }

  /**
   * Deterministic mock generation for offline test environments
   */
  private async handleMockGeneration(
    job: VisualGenerationJob,
    promptHash: string,
    cacheKey: string,
    workflow: any
  ): Promise<VisualGenerationJob> {
    // 1x1 transparent PNG binary
    const pngBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const buffer = Buffer.from(pngBase64, 'base64');

    const asset = await this.assetStore.saveAsset({
      conceptId: job.request.conceptId,
      visualType: job.request.visualType || 'educational_illustration',
      workflowId: workflow.workflowId,
      workflowVersion: workflow.version,
      modelFamily: workflow.modelFamily,
      model: workflow.targetModel,
      modelLicense: workflow.license,
      prompt: job.request.prompt,
      negativePrompt: job.request.negativePrompt,
      promptHash,
      cacheKey,
      width: job.request.width || 512,
      height: job.request.height || 512,
      seed: 42,
      imageBuffer: buffer,
      mimeType: 'image/png',
    });

    const output: GeneratedVisualOutput = {
      filename: `xpedition_${asset.assetId}.png`,
      subfolder: '',
      type: 'output',
      mimeType: 'image/png',
      url: asset.publicUrl,
      base64Data: `data:image/png;base64,${pngBase64}`,
      width: asset.width,
      height: asset.height,
      sizeBytes: buffer.length,
    };

    const completedJob: VisualGenerationJob = {
      ...job,
      status: 'completed',
      completedAt: Date.now(),
      updatedAt: Date.now(),
      outputAssetId: asset.assetId,
      asset,
      output,
      reused: false,
      metadata: {
        ...job.metadata!,
        executionTimeMs: 15,
        cacheKey,
        reused: false,
      },
    };

    await this.jobStore.updateJob(job.jobId, completedJob);
    return completedJob;
  }
}

export const visualGenerationEngine = VisualGenerationEngine.getInstance();
