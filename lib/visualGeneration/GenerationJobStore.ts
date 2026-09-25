import { VisualGenerationJob, VisualGenerationStatus } from './types';
import { JobNotFoundError } from './errors';

export interface IGenerationJobStore {
  createJob(job: VisualGenerationJob): Promise<VisualGenerationJob>;
  getJob(jobId: string): Promise<VisualGenerationJob | null>;
  updateJob(jobId: string, updates: Partial<VisualGenerationJob>): Promise<VisualGenerationJob>;
  findByRequestId(requestId: string): Promise<VisualGenerationJob | null>;
  findActiveByCacheKey(cacheKey: string): Promise<VisualGenerationJob | null>;
  listJobs(status?: VisualGenerationStatus): Promise<VisualGenerationJob[]>;
}

/**
 * Thread-safe in-memory and local development job store.
 * Decoupled behind IGenerationJobStore so production Postgres/Supabase
 * implementations can be swapped without touching the generation engine.
 */
export class MemoryJobStore implements IGenerationJobStore {
  private static instance: MemoryJobStore;
  private readonly jobs: Map<string, VisualGenerationJob> = new Map();
  private readonly requestIdIndex: Map<string, string> = new Map(); // requestId -> jobId
  private readonly cacheKeyActiveIndex: Map<string, string> = new Map(); // cacheKey -> active jobId

  public static getInstance(): MemoryJobStore {
    if (!MemoryJobStore.instance) {
      MemoryJobStore.instance = new MemoryJobStore();
    }
    return MemoryJobStore.instance;
  }

  public async createJob(job: VisualGenerationJob): Promise<VisualGenerationJob> {
    const clone = JSON.parse(JSON.stringify(job));
    this.jobs.set(job.jobId, clone);

    if (job.requestId) {
      this.requestIdIndex.set(job.requestId, job.jobId);
    }

    if (job.cacheKey && this.isActiveStatus(job.status)) {
      this.cacheKeyActiveIndex.set(job.cacheKey, job.jobId);
    }

    return JSON.parse(JSON.stringify(clone));
  }

  public async getJob(jobId: string): Promise<VisualGenerationJob | null> {
    const job = this.jobs.get(jobId);
    if (!job) return null;
    return JSON.parse(JSON.stringify(job));
  }

  public async updateJob(
    jobId: string,
    updates: Partial<VisualGenerationJob>
  ): Promise<VisualGenerationJob> {
    const existing = this.jobs.get(jobId);
    if (!existing) {
      throw new JobNotFoundError(jobId);
    }

    const updated: VisualGenerationJob = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    };

    this.jobs.set(jobId, updated);

    // Update active cache index
    if (updated.cacheKey) {
      if (this.isActiveStatus(updated.status)) {
        this.cacheKeyActiveIndex.set(updated.cacheKey, jobId);
      } else {
        // If no longer active, remove from active index
        const currentActive = this.cacheKeyActiveIndex.get(updated.cacheKey);
        if (currentActive === jobId) {
          this.cacheKeyActiveIndex.delete(updated.cacheKey);
        }
      }
    }

    return JSON.parse(JSON.stringify(updated));
  }

  public async findByRequestId(requestId: string): Promise<VisualGenerationJob | null> {
    const jobId = this.requestIdIndex.get(requestId);
    if (!jobId) return null;
    return this.getJob(jobId);
  }

  public async findActiveByCacheKey(cacheKey: string): Promise<VisualGenerationJob | null> {
    const jobId = this.cacheKeyActiveIndex.get(cacheKey);
    if (!jobId) return null;
    const job = await this.getJob(jobId);
    if (job && this.isActiveStatus(job.status)) {
      return job;
    }
    // Clean up stale pointer
    this.cacheKeyActiveIndex.delete(cacheKey);
    return null;
  }

  public async listJobs(status?: VisualGenerationStatus): Promise<VisualGenerationJob[]> {
    const all = Array.from(this.jobs.values());
    const filtered = status ? all.filter((j) => j.status === status) : all;
    return JSON.parse(JSON.stringify(filtered));
  }

  private isActiveStatus(status: VisualGenerationStatus): boolean {
    return status === 'queued' || status === 'submitted' || status === 'running';
  }
}

export const generationJobStore = MemoryJobStore.getInstance();
