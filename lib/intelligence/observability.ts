/**
 * Xpedition Intelligence Layer v1 — Safe Observability & Telemetry
 *
 * Securely tracks execution latency, provider distribution, and errors without
 * logging secrets, keys, or private learner records.
 */

import { IntelligenceTrace } from './types';

const traceBuffer: IntelligenceTrace[] = [];
const MAX_BUFFER_SIZE = 100;

export function recordIntelligenceTrace(trace: IntelligenceTrace): void {
  // Sanitize: ensure no accidental secrets or oversized payloads
  const sanitizedTrace: IntelligenceTrace = {
    requestId: trace.requestId,
    timestamp: trace.timestamp,
    capability: trace.capability,
    selectedProvider: trace.selectedProvider,
    attemptedProviders: [...trace.attemptedProviders],
    fallbackUsed: trace.fallbackUsed,
    latencyMs: trace.latencyMs,
    success: trace.success,
    error: trace.error ? trace.error.slice(0, 150) : undefined,
    failureType: trace.failureType,
    tokenMetadata: trace.tokenMetadata,
  };

  traceBuffer.push(sanitizedTrace);
  if (traceBuffer.length > MAX_BUFFER_SIZE) {
    traceBuffer.shift();
  }

  // Developer-friendly structured log in development
  if (process.env.NODE_ENV !== 'production') {
    const statusTag = trace.success ? '✓ SUCCESS' : '✗ FAILED';
    const fallbackTag = trace.fallbackUsed ? '[FALLBACK]' : '[PRIMARY]';
    console.log(
      `[IntelligenceTrace] ${statusTag} ${fallbackTag} |` +
      ` Cap: ${trace.capability} |` +
      ` Provider: ${trace.selectedProvider} |` +
      ` Latency: ${trace.latencyMs}ms` +
      (trace.failureType ? ` | FailureType: ${trace.failureType}` : '') +
      (trace.error ? ` | Error: ${trace.error}` : '')
    );
  }
}

export function getRecentIntelligenceTraces(): IntelligenceTrace[] {
  return [...traceBuffer];
}
