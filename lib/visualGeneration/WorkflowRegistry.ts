import fs from 'fs';
import path from 'path';
import { WorkflowDefinition, VisualType, VisualGenerationRequest } from './types';
import { WorkflowNotFoundError, InvalidVisualRequestError } from './errors';

export class WorkflowRegistry {
  private static instance: WorkflowRegistry;
  private readonly workflowsDir: string;
  private readonly registry: Map<string, WorkflowDefinition> = new Map();
  private readonly aliasMap: Map<string, string> = new Map();

  constructor(customWorkflowsDir?: string) {
    this.workflowsDir =
      customWorkflowsDir ||
      path.join(process.cwd(), 'comfyui', 'workflows');

    this.registerBuiltinWorkflows();
  }

  public static getInstance(): WorkflowRegistry {
    if (!WorkflowRegistry.instance) {
      WorkflowRegistry.instance = new WorkflowRegistry();
    }
    return WorkflowRegistry.instance;
  }

  /**
   * Registers verified production workflows available on this deployment.
   * Only real, tested workflows with verifiable model checkpoints are registered.
   */
  private registerBuiltinWorkflows(): void {
    const educationalIllustration: WorkflowDefinition = {
      workflowId: 'educational_illustration',
      version: '1.0.0',
      name: 'Educational Illustration & Schematic',
      description: 'Standard production-ready text-to-image educational diagram and concept visual workflow.',
      visualType: 'educational_illustration',
      modelFamily: 'Stable Diffusion 1.5',
      targetModel: 'v1-5-pruned-emaonly.safetensors',
      license: 'CreativeML Open RAIL-M (Commercial use permitted with standard ethical restrictions)',
      sourceFile: 'educational-illustration.json',
      supportedDimensions: {
        minWidth: 256,
        maxWidth: 1024,
        minHeight: 256,
        maxHeight: 1024,
        defaultWidth: 512,
        defaultHeight: 512,
        step: 64,
      },
      defaultParameters: {
        steps: 12,
        cfg: 7.0,
        sampler: 'euler',
        scheduler: 'normal',
      },
      enabled: true,
    };

    this.register(educationalIllustration);

    // Aliases
    this.aliasMap.set('educational-illustration', 'educational_illustration');
    this.aliasMap.set('schematic', 'educational_illustration');
    this.aliasMap.set('diagram', 'educational_illustration');
  }

  /**
   * Registers a workflow definition into the registry
   */
  public register(workflow: WorkflowDefinition): void {
    this.registry.set(workflow.workflowId, workflow);
  }

  /**
   * Resolves a workflow by identifier or visualType alias
   */
  public resolve(identifierOrType: string): WorkflowDefinition {
    if (!identifierOrType || typeof identifierOrType !== 'string') {
      throw new WorkflowNotFoundError('empty_identifier');
    }

    const normalized = identifierOrType.trim().toLowerCase();
    const resolvedId = this.aliasMap.get(normalized) || normalized;
    const workflow = this.registry.get(resolvedId);

    if (!workflow || !workflow.enabled) {
      throw new WorkflowNotFoundError(identifierOrType);
    }

    return workflow;
  }

  /**
   * Checks if a workflow is registered and enabled
   */
  public has(identifierOrType: string): boolean {
    try {
      this.resolve(identifierOrType);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Lists all currently registered and active workflows
   */
  public listWorkflows(): WorkflowDefinition[] {
    return Array.from(this.registry.values()).filter((w) => w.enabled);
  }

  /**
   * Validates dimensions against the resolved workflow constraints
   */
  public validateDimensions(workflow: WorkflowDefinition, width?: number, height?: number): { width: number; height: number } {
    const w = width ?? workflow.supportedDimensions.defaultWidth;
    const h = height ?? workflow.supportedDimensions.defaultHeight;
    const { minWidth, maxWidth, minHeight, maxHeight, step } = workflow.supportedDimensions;

    if (w < minWidth || w > maxWidth || w % step !== 0) {
      throw new InvalidVisualRequestError(
        `Width ${w} is invalid for workflow "${workflow.workflowId}". Must be between ${minWidth} and ${maxWidth} and divisible by ${step}.`
      );
    }

    if (h < minHeight || h > maxHeight || h % step !== 0) {
      throw new InvalidVisualRequestError(
        `Height ${h} is invalid for workflow "${workflow.workflowId}". Must be between ${minHeight} and ${maxHeight} and divisible by ${step}.`
      );
    }

    return { width: w, height: h };
  }

  /**
   * Loads the ComfyUI workflow JSON safely from the server workflows directory.
   * Prevents arbitrary path traversal.
   */
  public loadWorkflowPromptGraph(
    workflow: WorkflowDefinition,
    request: VisualGenerationRequest
  ): { nodes: Record<string, any>; metadata: any } {
    // Sanitize sourceFile to prevent directory traversal
    const safeFilename = path.basename(workflow.sourceFile);
    const fullPath = path.join(this.workflowsDir, safeFilename);

    if (!fs.existsSync(fullPath)) {
      throw new WorkflowNotFoundError(
        `Workflow template file "${safeFilename}" was not found on disk.`
      );
    }

    const rawContent = fs.readFileSync(fullPath, 'utf8');
    const parsed = JSON.parse(rawContent);

    const nodes = JSON.parse(JSON.stringify(parsed.nodes || parsed));
    const metadata = parsed._metadata || {};

    const { width, height } = this.validateDimensions(workflow, request.width, request.height);
    const seed = request.seed ?? Math.floor(Math.random() * 1000000000);
    const steps = request.steps ?? workflow.defaultParameters.steps;
    const cfg = request.cfg ?? workflow.defaultParameters.cfg;

    // Inject parameters into standard ComfyUI node graphs
    for (const [, node] of Object.entries<any>(nodes)) {
      if (node.class_type === 'KSampler') {
        node.inputs.seed = seed;
        node.inputs.steps = steps;
        node.inputs.cfg = cfg;
        if (workflow.defaultParameters.sampler) {
          node.inputs.sampler_name = workflow.defaultParameters.sampler;
        }
        if (workflow.defaultParameters.scheduler) {
          node.inputs.scheduler = workflow.defaultParameters.scheduler;
        }
      } else if (node.class_type === 'EmptyLatentImage') {
        node.inputs.width = width;
        node.inputs.height = height;
      } else if (node.class_type === 'CLIPTextEncode') {
        const title = (node._meta?.title || '').toLowerCase();
        if (title.includes('negative') || node.inputs.text?.includes('blurry')) {
          if (request.negativePrompt) {
            node.inputs.text = request.negativePrompt;
          }
        } else {
          // Construct pedagogical positive prompt
          const conceptLabel = request.conceptId.replace(/_/g, ' ');
          node.inputs.text = `educational scientific illustration of ${conceptLabel}, ${request.prompt}, high clarity textbook schematic, clear lighting, detailed visual teaching aid`;
        }
      }
    }

    return {
      nodes,
      metadata: {
        ...metadata,
        workflowId: workflow.workflowId,
        workflowVersion: workflow.version,
        targetModel: workflow.targetModel,
        modelFamily: workflow.modelFamily,
        modelLicense: workflow.license,
        seed,
        steps,
        cfg,
        width,
        height,
      },
    };
  }
}

export const workflowRegistry = WorkflowRegistry.getInstance();
