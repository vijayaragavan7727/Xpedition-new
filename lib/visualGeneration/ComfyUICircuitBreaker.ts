/**
 * Xpedition Production Hardening — ComfyUI Circuit Breaker
 *
 * Protects application latency and resources by fast-failing generation requests
 * when ComfyUI is unavailable or failing consecutively, preventing 5-minute timeout hangs.
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeoutMs: number;
  probeSuccessThreshold?: number;
}

export class ComfyUICircuitBreaker {
  private static instance: ComfyUICircuitBreaker;

  private state: CircuitState = 'CLOSED';
  private consecutiveFailures = 0;
  private consecutiveSuccesses = 0;
  private lastFailureTime: number | null = null;

  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;
  private readonly probeSuccessThreshold: number;

  constructor(config?: Partial<CircuitBreakerConfig>) {
    this.failureThreshold = config?.failureThreshold ?? 3;
    this.resetTimeoutMs = config?.resetTimeoutMs ?? 30000; // 30 seconds
    this.probeSuccessThreshold = config?.probeSuccessThreshold ?? 1;
  }

  public static getInstance(): ComfyUICircuitBreaker {
    if (!ComfyUICircuitBreaker.instance) {
      ComfyUICircuitBreaker.instance = new ComfyUICircuitBreaker();
    }
    return ComfyUICircuitBreaker.instance;
  }

  /**
   * Evaluates if execution is permitted
   */
  public canExecute(): boolean {
    const now = Date.now();

    if (this.state === 'CLOSED') {
      return true;
    }

    if (this.state === 'OPEN') {
      if (this.lastFailureTime && now - this.lastFailureTime >= this.resetTimeoutMs) {
        // Half-open: test single probe
        this.state = 'HALF_OPEN';
        this.consecutiveSuccesses = 0;
        return true;
      }
      return false;
    }

    // HALF_OPEN: allow probe
    return true;
  }

  /**
   * Records a successful execution
   */
  public recordSuccess(): void {
    if (this.state === 'HALF_OPEN') {
      this.consecutiveSuccesses++;
      if (this.consecutiveSuccesses >= this.probeSuccessThreshold) {
        this.state = 'CLOSED';
        this.consecutiveFailures = 0;
        this.lastFailureTime = null;
      }
    } else if (this.state === 'CLOSED') {
      this.consecutiveFailures = 0;
    }
  }

  /**
   * Records an execution failure
   */
  public recordFailure(): void {
    this.consecutiveFailures++;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN' || this.consecutiveFailures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  public getState(): CircuitState {
    // Check if timeout has naturally moved OPEN -> HALF_OPEN
    if (this.state === 'OPEN' && this.lastFailureTime && Date.now() - this.lastFailureTime >= this.resetTimeoutMs) {
      this.state = 'HALF_OPEN';
    }
    return this.state;
  }

  public getStatus() {
    return {
      state: this.getState(),
      consecutiveFailures: this.consecutiveFailures,
      lastFailureTime: this.lastFailureTime,
      nextProbeTime: this.lastFailureTime ? this.lastFailureTime + this.resetTimeoutMs : null,
    };
  }

  public reset(): void {
    this.state = 'CLOSED';
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses = 0;
    this.lastFailureTime = null;
  }
}

export const comfyUICircuitBreaker = ComfyUICircuitBreaker.getInstance();
