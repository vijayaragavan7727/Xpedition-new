/**
 * Bounded outbound HTTP for server-side integrations (OpenMAIC bridge, Canvas).
 *
 * Every call gets a hard deadline enforced with an AbortController. The deadline
 * covers the WHOLE exchange (headers and body), so a bridge that sends headers and
 * then stalls the body cannot hang the server either. On expiry the request is
 * aborted and an `UpstreamTimeoutError` is thrown; callers map it to a
 * deterministic 504 and the Class keeps its native (deterministic) visuals.
 */

export class UpstreamTimeoutError extends Error {
  readonly code = 'UPSTREAM_TIMEOUT';
  constructor(readonly upstream: string, readonly timeoutMs: number) {
    super(`${upstream} did not respond within ${timeoutMs} ms`);
    this.name = 'UpstreamTimeoutError';
  }
}

export const MIN_UPSTREAM_TIMEOUT_MS = 250;
export const MAX_UPSTREAM_TIMEOUT_MS = 20_000;

/** Parses a timeout setting and clamps it to a safe, bounded range. */
export function boundedTimeoutMs(raw: unknown, fallbackMs: number): number {
  const parsed = typeof raw === 'number' ? raw : Number.parseInt(String(raw ?? ''), 10);
  const value = Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackMs;
  return Math.min(MAX_UPSTREAM_TIMEOUT_MS, Math.max(MIN_UPSTREAM_TIMEOUT_MS, value));
}

export interface BoundedResponse<T> {
  status: number;
  ok: boolean;
  data: T | null;
}

/**
 * Performs a fetch and parses the JSON body within one deadline.
 * - Throws UpstreamTimeoutError when the deadline passes (request aborted).
 * - Returns data=null when the body is not JSON.
 * - A caller-supplied signal (e.g. the incoming request) also aborts the call.
 */
export async function fetchJsonWithTimeout<T = unknown>(
  upstream: string,
  url: string,
  init: RequestInit,
  timeoutMs: number,
  fetchImpl: typeof fetch = fetch
): Promise<BoundedResponse<T>> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const outer = init.signal;
  const onOuterAbort = () => controller.abort();
  if (outer) {
    if (outer.aborted) controller.abort();
    else outer.addEventListener('abort', onOuterAbort, { once: true });
  }
  try {
    const response = await fetchImpl(url, { ...init, signal: controller.signal });
    let data: T | null = null;
    const text = await response.text();
    if (text) {
      try {
        data = JSON.parse(text) as T;
      } catch {
        data = null;
      }
    }
    return { status: response.status, ok: response.ok, data };
  } catch (err) {
    if (timedOut) throw new UpstreamTimeoutError(upstream, timeoutMs);
    throw err;
  } finally {
    clearTimeout(timer);
    outer?.removeEventListener('abort', onOuterAbort);
  }
}
