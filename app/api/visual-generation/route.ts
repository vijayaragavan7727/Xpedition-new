import '@/lib/supabase/serverDb';
import { NextResponse } from 'next/server';
import { requireServerAuth } from '@/lib/auth/serverAuth';
import {
  VisualGenerationError,
  ComfyUIUnavailableError,
  ComfyUITimeoutError,
  WorkflowExecutionError,
  WorkflowNotFoundError,
  VisualGenerationRequest,
  CachePolicy,
} from '@/lib/visualGeneration';
import { learnerVisualEngine, toClientJob } from '@/lib/visualGeneration/learnerVisualGeneration';
import { visualGenerationEngine } from '@/lib/visualGeneration';
import { createRateLimitExceededResponse, applyRateLimitHeaders } from '@/lib/security/rateLimiter';
import { checkUserRateLimit } from '@/lib/security/distributedRateLimit';
import { getProductionConfig } from '@/lib/config/productionConfig';
import { logger } from '@/lib/observability/productionLogger';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { user, errorResponse } = await requireServerAuth(request);
    if (errorResponse || !user) {
      return errorResponse!;
    }

    const config = getProductionConfig();
    const rateResult = await checkUserRateLimit({
      userId: user.id,
      bucket: 'visual-generation',
      maxRequests: config.rateLimit.visualGenerationMaxPerMin,
      windowMs: 60000,
    });
    if (!rateResult.allowed) {
      logger.warn('[API:visual-generation] Rate limit exceeded', { backend: rateResult.backend });
      return createRateLimitExceededResponse(rateResult);
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Invalid or missing JSON request body',
          },
        },
        { status: 400 }
      );
    }

    const {
      requestId,
      conceptId,
      subject,
      visualType,
      prompt,
      negativePrompt,
      width,
      height,
      workflow,
      workflowId,
      seed,
      steps,
      cfg,
      priority,
      cachePolicy,
    } = body as Partial<VisualGenerationRequest>;

    // Strict validation
    if (!conceptId || typeof conceptId !== 'string' || conceptId.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Field "conceptId" is required and must be a non-empty string.',
          },
        },
        { status: 400 }
      );
    }

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Field "prompt" is required and must be a non-empty string.',
          },
        },
        { status: 400 }
      );
    }

    const genRequest: VisualGenerationRequest = {
      requestId: requestId && typeof requestId === 'string' ? requestId.trim() : undefined,
      conceptId: conceptId.trim(),
      subject: subject && typeof subject === 'string' ? subject.trim() : undefined,
      visualType: visualType || 'educational_illustration',
      prompt: prompt.trim(),
      negativePrompt: negativePrompt && typeof negativePrompt === 'string' ? negativePrompt.trim() : undefined,
      width: typeof width === 'number' ? width : undefined,
      height: typeof height === 'number' ? height : undefined,
      workflow: workflow && typeof workflow === 'string' ? workflow.trim() : undefined,
      workflowId: workflowId && typeof workflowId === 'string' ? workflowId.trim() : undefined,
      seed: typeof seed === 'number' ? seed : undefined,
      steps: typeof steps === 'number' ? steps : undefined,
      cfg: typeof cfg === 'number' ? cfg : undefined,
      priority: priority || 'normal',
      cachePolicy: (cachePolicy as CachePolicy) || 'reuse',
    };

    // Learner jobs are owned by the requester, cache-isolated per owner, and
    // stored privately. The response never carries prompt, metadata, cache keys,
    // storage paths or a static URL — only an owner-checked asset URL.
    const result = await learnerVisualEngine().generateVisual(genRequest, { ownerId: user.id });

    const response = NextResponse.json({ success: true, data: toClientJob(result) });

    return applyRateLimitHeaders(response, rateResult);
  } catch (error: any) {
    console.error('[API:visual-generation] Generation error:', error?.message || error);

    if (error instanceof ComfyUIUnavailableError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: 'The visual generation engine is currently offline or unreachable. Please try again later.',
          },
        },
        { status: 503 }
      );
    }

    if (error instanceof ComfyUITimeoutError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: 'Visual generation timed out while waiting for execution to complete.',
          },
        },
        { status: 504 }
      );
    }

    if (error instanceof WorkflowNotFoundError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: 400 }
      );
    }

    if (error instanceof WorkflowExecutionError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: 'Visual generation failed during workflow processing.',
          },
        },
        { status: 502 }
      );
    }

    if (error instanceof VisualGenerationError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while generating the visual.',
        },
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const jobId = url.searchParams.get('jobId');

  // Job status: authenticated requester AND job owner, otherwise 404.
  if (jobId) {
    const { user, errorResponse } = await requireServerAuth(request);
    if (errorResponse || !user) {
      return errorResponse!;
    }

    const job = await learnerVisualEngine().getJobForOwner(jobId, user.id);
    if (!job) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Job not found.' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: toClientJob(job) });
  }

  // Safe health status check without leaking internals
  try {
    const healthy = await visualGenerationEngine.isEngineHealthy();
    return NextResponse.json({
      status: healthy ? 'online' : 'offline',
      service: 'visual-generation-engine',
      version: '2.0.0',
    });
  } catch {
    return NextResponse.json({
      status: 'offline',
      service: 'visual-generation-engine',
      version: '2.0.0',
    });
  }
}
