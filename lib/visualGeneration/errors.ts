/**
 * Xpedition Visual Intelligence — Normalized Error System
 *
 * Ensures ComfyUI internal errors, worker stacktraces, or internal URLs
 * are never leaked to students while giving developers clear actionable logs.
 */

export type VisualGenerationErrorCode =
  | 'COMFYUI_UNAVAILABLE'
  | 'COMFYUI_TIMEOUT'
  | 'COMFYUI_WORKFLOW_REJECTED'
  | 'COMFYUI_NO_OUTPUT'
  | 'INVALID_REQUEST'
  | 'DISALLOWED_WORKFLOW'
  | 'UNKNOWN_ERROR';

export class VisualGenerationError extends Error {
  public readonly code: VisualGenerationErrorCode;
  public readonly userMessage: string;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(
    code: VisualGenerationErrorCode,
    developerMessage: string,
    userMessage: string,
    statusCode = 500,
    details?: any
  ) {
    super(developerMessage);
    this.name = 'VisualGenerationError';
    this.code = code;
    this.userMessage = userMessage;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class ComfyUIUnavailableError extends VisualGenerationError {
  constructor(message = 'ComfyUI generation service is currently unreachable') {
    super(
      'COMFYUI_UNAVAILABLE',
      message,
      'Visual generation is temporarily unavailable. Please verify the local generation service is running.',
      503
    );
  }
}

export class ComfyUITimeoutError extends VisualGenerationError {
  constructor(timeoutMs: number) {
    super(
      'COMFYUI_TIMEOUT',
      `ComfyUI generation exceeded maximum execution timeout of ${timeoutMs}ms`,
      'Visual generation timed out. The generation queue may be congested.',
      504,
      { timeoutMs }
    );
  }
}

export class ComfyUIWorkflowRejectedError extends VisualGenerationError {
  constructor(nodeErrors: any) {
    super(
      'COMFYUI_WORKFLOW_REJECTED',
      `ComfyUI rejected prompt workflow: ${JSON.stringify(nodeErrors)}`,
      'The requested visual workflow could not be processed.',
      422,
      nodeErrors
    );
  }
}

export class WorkflowExecutionError extends VisualGenerationError {
  constructor(reason: string, details?: any) {
    super(
      'COMFYUI_WORKFLOW_REJECTED',
      `Workflow execution failed: ${reason}`,
      'Visual generation failed during processing.',
      502,
      details
    );
  }
}

export class WorkflowNotFoundError extends VisualGenerationError {
  constructor(workflowId: string) {
    super(
      'DISALLOWED_WORKFLOW',
      `Workflow not found or not allowed: ${workflowId}`,
      `The visual workflow "${workflowId}" is not permitted.`,
      400
    );
  }
}

export class InvalidVisualRequestError extends VisualGenerationError {
  constructor(reason: string) {
    super(
      'INVALID_REQUEST',
      `Invalid visual generation request: ${reason}`,
      `Invalid request: ${reason}`,
      400
    );
  }
}

export class InvalidAssetError extends VisualGenerationError {
  constructor(reason: string) {
    super(
      'INVALID_REQUEST',
      `Asset validation failed: ${reason}`,
      'Generated visual asset failed quality and integrity verification.',
      422
    );
  }
}

export class AssetNotFoundError extends VisualGenerationError {
  constructor(assetId: string) {
    super(
      'INVALID_REQUEST',
      `Asset not found: ${assetId}`,
      'The requested visual asset does not exist.',
      404
    );
  }
}

export class JobNotFoundError extends VisualGenerationError {
  constructor(jobId: string) {
    super(
      'INVALID_REQUEST',
      `Generation job not found: ${jobId}`,
      'The requested visual generation job was not found.',
      404
    );
  }
}


