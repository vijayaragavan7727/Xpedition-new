import crypto from 'crypto';
import { VisualGenerationRequest, VisualType } from './types';

/**
 * Normalizes prompt text by lowercasing, stripping extra whitespace,
 * and ensuring stable UTF-8 character representation.
 */
export function normalizePrompt(prompt: string): string {
  if (!prompt) return '';
  return prompt
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/**
 * Generates a deterministic SHA-256 hash of a prompt and optional negative prompt.
 */
export function hashPrompt(prompt: string, negativePrompt?: string): string {
  const normalizedPositive = normalizePrompt(prompt);
  const normalizedNegative = normalizePrompt(negativePrompt || '');
  const combined = `pos:${normalizedPositive}|neg:${normalizedNegative}`;
  return crypto.createHash('sha256').update(combined, 'utf8').digest('hex');
}

export interface CacheKeyParams {
  conceptId: string;
  visualType: VisualType;
  workflowId: string;
  workflowVersion: string;
  model: string;
  promptHash: string;
  width: number;
  height: number;
  steps?: number;
  cfg?: number;
  seed?: number; // Only included if deterministic seed is explicitly requested
}

/**
 * Generates a stable, canonical cache key for an educational visual.
 * Omits volatile runtime fields (requestId, timestamps, random job IDs).
 */
export function generateCacheKey(params: CacheKeyParams): string {
  const parts = [
    `c:${params.conceptId.trim().toLowerCase()}`,
    `vt:${params.visualType}`,
    `wf:${params.workflowId}@${params.workflowVersion}`,
    `m:${params.model}`,
    `p:${params.promptHash.substring(0, 16)}`,
    `dim:${params.width}x${params.height}`,
  ];

  if (typeof params.steps === 'number') {
    parts.push(`st:${params.steps}`);
  }

  if (typeof params.cfg === 'number') {
    parts.push(`cfg:${params.cfg}`);
  }

  if (typeof params.seed === 'number') {
    parts.push(`sd:${params.seed}`);
  }

  return parts.join('::');
}

/**
 * Extracts cache parameters from a request and resolved workflow definition
 */
export function buildCacheKeyFromRequest(
  request: VisualGenerationRequest,
  workflowInfo: { workflowId: string; version: string; model: string }
): { promptHash: string; cacheKey: string } {
  const promptHash = hashPrompt(request.prompt, request.negativePrompt);
  const width = request.width || 512;
  const height = request.height || 512;
  const visualType = request.visualType || 'educational_illustration';

  const cacheKey = generateCacheKey({
    conceptId: request.conceptId,
    visualType,
    workflowId: workflowInfo.workflowId,
    workflowVersion: workflowInfo.version,
    model: workflowInfo.model,
    promptHash,
    width,
    height,
    steps: request.steps,
    cfg: request.cfg,
    seed: request.seed,
  });

  return { promptHash, cacheKey };
}
