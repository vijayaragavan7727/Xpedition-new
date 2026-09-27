/**
 * Learner-requested visual generation: ownership + private output boundary.
 *
 * Two asset classes exist and must not be mixed:
 *
 *  1. Curriculum assets (public/generated-visuals, shared by concept, curated).
 *     Public by design; they never contain learner input.
 *  2. Learner-requested outputs (POST /api/visual-generation with a learner prompt).
 *     PRIVATE: stored outside public/, never added to the shared curriculum cache,
 *     cache-isolated per owner, and served ONLY through
 *     GET /api/visual-generation/<jobId>/asset after an owner check.
 *
 * A learner never receives: another learner's job, the prompt, internal metadata,
 * cache keys, storage paths or a static URL that bypasses the owner check.
 */

import fs from 'fs';
import path from 'path';
import { LocalAssetStore } from './AssetStore';
import { generationJobStore } from './GenerationJobStore';
import { VisualGenerationEngine } from './VisualGenerationEngine';
import { LocalStorageBackend } from '../storage/storageBackend';
import type { VisualGenerationJob } from './types';

export const PRIVATE_URL_PREFIX = '/__private_learner_visual__';

export function learnerAssetDir(env: Record<string, string | undefined> = process.env): string {
  const dir = path.resolve(env.XPEDITION_PRIVATE_ASSET_DIR || path.join(process.cwd(), '.data', 'learner-visuals'));
  const publicDir = path.resolve(process.cwd(), 'public');
  if (dir === publicDir || dir.startsWith(publicDir + path.sep)) {
    // Anything under public/ is served statically without authentication.
    throw new Error('Learner visual storage must not be inside public/.');
  }
  return dir;
}

let engine: VisualGenerationEngine | null = null;

/** Engine for learner requests: private asset store, owner-scoped jobs. */
export function learnerVisualEngine(): VisualGenerationEngine {
  if (!engine) {
    const dir = learnerAssetDir();
    const store = new LocalAssetStore(dir, new LocalStorageBackend(dir, PRIVATE_URL_PREFIX));
    engine = new VisualGenerationEngine({ assetStore: store, jobStore: generationJobStore });
  }
  return engine;
}

/** Test hook. */
export function __setLearnerVisualEngineForTests(next: VisualGenerationEngine | null): void {
  engine = next;
}

export function ownedAssetUrl(jobId: string): string {
  return `/api/visual-generation/${encodeURIComponent(jobId)}/asset`;
}

/**
 * The ONLY job shape a learner may receive. No prompt, request, cache key,
 * metadata, storage path or static URL.
 */
export function toClientJob(job: VisualGenerationJob) {
  const completed = job.status === 'completed' && Boolean(job.asset || job.output);
  return {
    jobId: job.jobId,
    conceptId: job.conceptId,
    workflowId: job.workflowId,
    status: job.status,
    reused: Boolean(job.reused),
    createdAt: job.createdAt,
    completedAt: job.completedAt,
    errorCode: job.errorCode,
    assetUrl: completed ? ownedAssetUrl(job.jobId) : undefined,
    mimeType: completed ? job.asset?.mimeType || job.output?.mimeType : undefined,
    width: completed ? job.asset?.width ?? job.output?.width : undefined,
    height: completed ? job.asset?.height ?? job.output?.height : undefined,
  };
}

export type ClientJob = ReturnType<typeof toClientJob>;

/**
 * Reads the bytes of an owned, completed job's asset. The file must live inside
 * the private learner directory (no path traversal, no curriculum/public files).
 */
export async function readOwnedAsset(
  jobId: string,
  ownerId: string,
  eng: VisualGenerationEngine = learnerVisualEngine(),
  dir: string = learnerAssetDir()
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  const job = await eng.getJobForOwner(jobId, ownerId);
  if (!job || job.status !== 'completed' || !job.asset?.filePath) return null;
  const resolved = path.resolve(job.asset.filePath);
  if (!resolved.startsWith(path.resolve(dir) + path.sep)) return null;
  try {
    const buffer = await fs.promises.readFile(resolved);
    return { buffer, mimeType: job.asset.mimeType === 'image/jpeg' ? 'image/jpeg' : 'image/png' };
  } catch {
    return null;
  }
}
