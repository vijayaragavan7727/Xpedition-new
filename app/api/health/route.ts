/**
 * Xpedition Production Hardening — Health Check & Readiness Endpoint
 *
 * Provides a standardized endpoint (/api/health) for load balancers, Vercel health
 * probes, and uptime monitors. Verifies core dependencies while ensuring no internal
 * ports, credentials, or secrets are exposed.
 */

import { NextResponse } from 'next/server';
import { getProductionConfig } from '@/lib/config/productionConfig';
import { visualGenerationEngine } from '@/lib/visualGeneration';
import { comfyUICircuitBreaker } from '@/lib/visualGeneration/ComfyUICircuitBreaker';
import { getCacheAdapter } from '@/lib/cache/cacheAdapter';
import { getStorageBackend } from '@/lib/storage/storageBackend';
import { isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const config = getProductionConfig();
  const startTime = Date.now();

  const services: Record<string, { status: 'healthy' | 'degraded' | 'offline'; details?: string }> = {};

  // 1. Supabase Database & Auth status
  if (isSupabaseConfigured) {
    services.database = { status: 'healthy', details: 'Cloud persistence configured' };
  } else {
    services.database = { status: 'degraded', details: 'Local offline persistence mode' };
  }

  // 2. Cache status
  const cache = getCacheAdapter();
  try {
    await cache.set('health:probe', 'ok', 5);
    const probe = await cache.get<string>('health:probe');
    services.cache = {
      status: probe === 'ok' ? 'healthy' : 'degraded',
      details: `Provider: ${config.cache.provider}`,
    };
  } catch (err: any) {
    services.cache = { status: 'degraded', details: 'Using in-memory cache fallback' };
  }

  // 3. Storage status
  const storage = getStorageBackend();
  services.storage = {
    status: 'healthy',
    details: `Provider: ${storage.getProviderName()}`,
  };

  // 4. Visual Generation Engine & ComfyUI Circuit Breaker status
  const circuitState = comfyUICircuitBreaker.getState();
  if (circuitState === 'OPEN') {
    services.visualEngine = {
      status: 'degraded',
      details: 'Circuit breaker OPEN (deterministic visual fallback active)',
    };
  } else {
    try {
      const isEngineHealthy = await visualGenerationEngine.isEngineHealthy();
      services.visualEngine = {
        status: isEngineHealthy ? 'healthy' : 'degraded',
        details: isEngineHealthy
          ? 'Diffusion engine ready'
          : 'ComfyUI offline (deterministic visual fallback active)',
      };
    } catch {
      services.visualEngine = {
        status: 'degraded',
        details: 'ComfyUI offline (deterministic visual fallback active)',
      };
    }
  }

  // Determine overall status
  const hasDegraded = Object.values(services).some((s) => s.status === 'degraded');
  const overallStatus = hasDegraded ? 'degraded' : 'healthy';

  const latencyMs = Date.now() - startTime;

  return NextResponse.json(
    {
      status: overallStatus,
      version: '1.0.0',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      environment: config.env,
      latencyMs,
      services,
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
