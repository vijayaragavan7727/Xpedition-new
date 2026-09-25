/**
 * Xpedition Visual Intelligence — Server-Side Generation Service
 *
 * Coordinates visual generation requests, workflow loading, ComfyUI execution,
 * image retrieval, and metadata tracking.
 *
 * INVARIANT: Browser never contacts ComfyUI directly. Server validates requests
 * and controls all allowed workflows.
 */

import fs from 'fs';
import path from 'path';
import {
  VisualGenerationRequest,
  VisualGenerationJob,
  VisualType,
  GeneratedVisualOutput,
} from './types';
import {
  InvalidVisualRequestError,
  ComfyUIUnavailableError,
  VisualGenerationError,
} from './errors';
import ComfyUIAdapter from './ComfyUIAdapter';

import { VisualGenerationEngine, visualGenerationEngine } from './VisualGenerationEngine';

export interface VisualGenerationServiceOptions {
  adapter?: ComfyUIAdapter;
  workflowsDir?: string;
  outputStorageDir?: string;
  mockMode?: boolean;                    // For unit testing without live ComfyUI
  engine?: VisualGenerationEngine;
}

export class VisualGenerationService {
  private static instance: VisualGenerationService | null = null;
  private readonly adapter: ComfyUIAdapter;
  private readonly engine: VisualGenerationEngine;
  private readonly workflowsDir: string;
  private readonly outputStorageDir: string;
  private readonly mockMode: boolean;
  private readonly jobCache = new Map<string, VisualGenerationJob>();

  constructor(options: VisualGenerationServiceOptions = {}) {
    this.adapter = options.adapter || new ComfyUIAdapter();
    this.engine =
      options.engine ||
      new VisualGenerationEngine({
        adapter: this.adapter,
        mockMode: options.mockMode,
      });
    this.workflowsDir =
      options.workflowsDir ||
      path.join(process.cwd(), 'comfyui', 'workflows');
    this.outputStorageDir =
      options.outputStorageDir ||
      path.join(process.cwd(), 'public', 'generated-visuals');
    this.mockMode = options.mockMode ?? (process.env.MOCK_VISUAL_GENERATION === 'true');

    // Ensure output storage directory exists
    try {
      if (!fs.existsSync(this.outputStorageDir)) {
        fs.mkdirSync(this.outputStorageDir, { recursive: true });
      }
    } catch {}
  }


  public static getInstance(): VisualGenerationService {
    if (!VisualGenerationService.instance) {
      VisualGenerationService.instance = new VisualGenerationService();
    }
    return VisualGenerationService.instance;
  }

  /**
   * Healthcheck proxy for local ComfyUI instance
   */
  public async isEngineHealthy(): Promise<boolean> {
    const res = await this.adapter.isHealthy();
    return res.ok;
  }

  /**
   * Primary generation method (alias for generateVisual)
   */
  public async generate(request: VisualGenerationRequest): Promise<VisualGenerationJob> {
    return this.generateVisual(request);
  }


  /**
   * Validates incoming request parameters
   */
  public validateRequest(request: VisualGenerationRequest): void {
    if (!request.conceptId || typeof request.conceptId !== 'string') {
      throw new InvalidVisualRequestError('conceptId is required');
    }

    if (!request.prompt || typeof request.prompt !== 'string' || request.prompt.trim().length === 0) {
      throw new InvalidVisualRequestError('prompt is required and cannot be empty');
    }

    const validVisualTypes: VisualType[] = [
      'educational_illustration',
      'schematic',
      'diagram',
      'formula_focus',
      'tactile_learning_object',
    ];

    if (request.visualType && !validVisualTypes.includes(request.visualType)) {
      throw new InvalidVisualRequestError(
        `Invalid visualType: ${request.visualType}. Must be one of: ${validVisualTypes.join(', ')}`
      );
    }

    const width = request.width ?? 512;
    const height = request.height ?? 512;

    if (width < 256 || width > 1024 || width % 64 !== 0) {
      throw new InvalidVisualRequestError('width must be between 256 and 1024 and divisible by 64');
    }

    if (height < 256 || height > 1024 || height % 64 !== 0) {
      throw new InvalidVisualRequestError('height must be between 256 and 1024 and divisible by 64');
    }
  }

  /**
   * Loads and builds the ComfyUI workflow prompt graph
   */
  public loadWorkflow(
    workflowId = 'educational-illustration',
    request: VisualGenerationRequest
  ): { nodes: Record<string, any>; metadata: any } {
    const filename = `${workflowId}.json`;
    const filePath = path.join(this.workflowsDir, filename);

    if (!fs.existsSync(filePath)) {
      throw new InvalidVisualRequestError(`Workflow "${workflowId}" is not permitted or does not exist`);
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(fileContent);

    const nodes = JSON.parse(JSON.stringify(parsed.nodes || parsed));
    const metadata = parsed._metadata || {};

    const width = request.width ?? metadata.defaultResolution?.width ?? 512;
    const height = request.height ?? metadata.defaultResolution?.height ?? 512;
    const seed = request.seed ?? Math.floor(Math.random() * 1000000000);
    const steps = request.steps ?? 18;
    const cfg = request.cfg ?? 7.0;

    // Inject parameters into standard node types
    for (const [nodeId, node] of Object.entries<any>(nodes)) {
      if (node.class_type === 'KSampler') {
        node.inputs.seed = seed;
        node.inputs.steps = steps;
        node.inputs.cfg = cfg;
      } else if (node.class_type === 'EmptyLatentImage') {
        node.inputs.width = width;
        node.inputs.height = height;
      } else if (node.class_type === 'CLIPTextEncode') {
        // Distinguish positive vs negative by node title or default text
        const title = node._meta?.title || '';
        if (title.toLowerCase().includes('negative') || node.inputs.text?.includes('blurry')) {
          if (request.negativePrompt) {
            node.inputs.text = request.negativePrompt;
          }
        } else {
          // Construct pedagogical prompt
          const enhancedPrompt = `educational scientific illustration of ${request.conceptId.replace(/_/g, ' ')}, ${request.prompt}, high clarity textbook schematic, clear lighting, detailed visual teaching aid`;
          node.inputs.text = enhancedPrompt;
        }
      }
    }

    return {
      nodes,
      metadata: {
        ...metadata,
        seed,
        steps,
        cfg,
        width,
        height,
      },
    };
  }

  /**
   * Core generation pipeline:
   * Validate -> Load Workflow -> Submit to ComfyUI -> Monitor -> Retrieve Output
   */
  public async generateVisual(request: VisualGenerationRequest): Promise<VisualGenerationJob> {
    const job = await this.engine.generateVisual(request);
    this.jobCache.set(job.jobId, job);
    if (job.metadata?.promptId) {
      this.jobCache.set(job.metadata.promptId, job);
    }
    return job;
  }

  /**
   * Reference implementation kept for compatibility and metadata tracking
   */
  public createInitialJobRecord(request: VisualGenerationRequest, metadata: any, startTime: number): VisualGenerationJob {
    const workflowId = request.workflowId || 'educational-illustration';
    return {
      jobId: `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      requestId: request.requestId || `req_${Date.now()}`,
      conceptId: request.conceptId,
      workflowId,
      status: 'queued',
      request,
      createdAt: startTime,
      updatedAt: startTime,
      cacheKey: `c:${request.conceptId}`,
      retryCount: 0,
      maxRetries: 1,
      metadata: {
        model: metadata.targetModel || 'v1-5-pruned-emaonly.safetensors',
        modelLicense: metadata.modelLicense || 'CreativeML Open RAIL-M',
        workflowId,
        workflowVersion: metadata.workflowVersion || '1.0.0',
        seed: metadata.seed,
        steps: metadata.steps,
        cfg: metadata.cfg,
        promptId: '',
        vramMode: 'cpu',
        generatedAt: startTime,
      },
    };
  }

  /**
   * Legacy pipeline execution preserved for fallback and test contract compatibility
   */
  public async executeLegacyPipeline(
    initialJob: VisualGenerationJob,
    nodes: any,
    metadata: any,
    startTime: number
  ): Promise<VisualGenerationJob> {
    // Fast-path mock mode for unit tests and local mock verification
    if (this.mockMode) {
      return this.handleMockGeneration(initialJob, startTime);
    }

    try {
      // 1. Submit workflow to ComfyUI
      const submitResponse = await this.adapter.submitWorkflow(nodes);
      const promptId = submitResponse.prompt_id;

      initialJob.jobId = promptId;
      if (initialJob.metadata) {
        initialJob.metadata.promptId = promptId;
      }
      initialJob.status = 'running';
      initialJob.updatedAt = Date.now();
      this.jobCache.set(promptId, initialJob);

      // 2. Monitor execution until completion
      const historyItem = await this.adapter.waitForCompletion(promptId);

      // 3. Extract output image descriptors
      const outputs = historyItem.outputs || {};
      let firstImage: { filename: string; subfolder: string; type: string } | null = null;

      for (const nodeOut of Object.values(outputs)) {
        if (Array.isArray(nodeOut.images) && nodeOut.images.length > 0) {
          firstImage = nodeOut.images[0];
          break;
        }
      }

      if (!firstImage) {
        throw new VisualGenerationError(
          'COMFYUI_NO_OUTPUT',
          `Generation finished but no image outputs were recorded for prompt ${promptId}`,
          'The generation service did not produce an image.'
        );
      }

      // 4. Retrieve image binary and persist to public visual storage for Xpedition
      const { buffer, mimeType } = await this.adapter.fetchImageBuffer(
        firstImage.filename,
        firstImage.subfolder,
        firstImage.type
      );

      const persistedFilename = `xpedition_${initialJob.conceptId}_${promptId.substring(0, 8)}.png`;
      const targetPath = path.join(this.outputStorageDir, persistedFilename);
      fs.writeFileSync(targetPath, buffer);

      const base64Data = `data:${mimeType};base64,${buffer.toString('base64')}`;
      const executionTimeMs = Date.now() - startTime;

      const output: GeneratedVisualOutput = {
        filename: persistedFilename,
        subfolder: firstImage.subfolder,
        type: firstImage.type,
        mimeType,
        url: `/generated-visuals/${persistedFilename}`,
        base64Data,
        width: initialJob.request.width || 512,
        height: initialJob.request.height || 512,
        sizeBytes: buffer.length,
      };

      const completedJob: VisualGenerationJob = {
        ...initialJob,
        status: 'completed',
        updatedAt: Date.now(),
        output,
        metadata: {
          ...initialJob.metadata!,
          executionTimeMs,
        },
      };

      this.jobCache.set(promptId, completedJob);
      return completedJob;
    } catch (err: any) {
      const failedJob: VisualGenerationJob = {
        ...initialJob,
        status: 'failed',
        updatedAt: Date.now(),
        error: err.userMessage || 'Visual generation could not be completed.',
      };

      if (initialJob.metadata?.promptId) {
        this.jobCache.set(initialJob.metadata.promptId, failedJob);
      }

      if (err instanceof VisualGenerationError) {
        throw err;
      }

      throw new VisualGenerationError(
        'UNKNOWN_ERROR',
        `Generation failed: ${err.message}`,
        'Visual generation encountered an unexpected problem.',
        500
      );
    }
  }

  /**
   * Retrieves a previously submitted or cached job
   */
  public getJob(jobId: string): VisualGenerationJob | undefined {
    return this.jobCache.get(jobId);
  }

  /**
   * Quick mock generation for deterministic unit tests and offline environments
   */
  private handleMockGeneration(job: VisualGenerationJob, startTime: number): VisualGenerationJob {
    const mockFilename = `mock_${job.request.conceptId}.png`;
    // 1x1 transparent PNG data URI
    const mockBase64 =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const output: GeneratedVisualOutput = {
      filename: mockFilename,
      subfolder: '',
      type: 'output',
      mimeType: 'image/png',
      url: `/generated-visuals/${mockFilename}`,
      base64Data: mockBase64,
      width: job.request.width || 512,
      height: job.request.height || 512,
      sizeBytes: 68,
    };

    const completed: VisualGenerationJob = {
      ...job,
      status: 'completed',
      output,
      updatedAt: Date.now(),
      metadata: {
        ...job.metadata!,
        executionTimeMs: Date.now() - startTime,
      },
    };

    this.jobCache.set(job.jobId, completed);
    return completed;
  }
}

export const visualGenerationService = VisualGenerationService.getInstance();
export default VisualGenerationService;
