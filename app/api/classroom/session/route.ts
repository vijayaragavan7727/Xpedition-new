import { NextResponse } from 'next/server';
import { requireServerAuth } from '@/lib/auth/serverAuth';
import {
  xiraClassroomOrchestrator,
  ConceptUnavailableError,
  SessionNotFoundError,
} from '@/lib/classroom/XiraClassroomOrchestrator';
import { getCanonicalConcept } from '@/lib/concepts/conceptRegistry';
import { parseClassIntent } from '@/lib/concepts/lessonResolver';
import { ClassroomLearnerAction, ClassroomStage } from '@/lib/classroom/classroomSessionTypes';
import {
  rateLimiter,
  getClientRateLimitKey,
  createRateLimitExceededResponse,
  applyRateLimitHeaders,
} from '@/lib/security/rateLimiter';
import { getProductionConfig } from '@/lib/config/productionConfig';
import { logger } from '@/lib/observability/productionLogger';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { user, errorResponse } = await requireServerAuth(request);
    if (errorResponse) {
      return errorResponse;
    }

    const config = getProductionConfig();
    const rateLimitKey = getClientRateLimitKey(request, user?.id, 'classroom-session');
    const rateResult = await rateLimiter.checkLimit(rateLimitKey, {
      maxRequests: config.rateLimit.classroomSessionMaxPerMin,
      windowMs: 60000,
    });
    if (!rateResult.allowed) {
      logger.warn('[API:classroom:session] Rate limit exceeded', { rateLimitKey });
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

    const { action, conceptId, sessionId, learnerAction, initialStage, intent } = body;

    // Strict validation
    if (!conceptId || typeof conceptId !== 'string' || conceptId.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Field "conceptId" is required and must be a non-empty string.',
          },
        },
        { status: 400 }
      );
    }

    if (conceptId.length > 100) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Field "conceptId" exceeds maximum allowed length of 100 characters.',
          },
        },
        { status: 400 }
      );
    }

    // Exact concept identity: unknown concepts are refused (never substituted).
    const concept = getCanonicalConcept(conceptId);
    if (!concept) {
      return NextResponse.json(
        { success: false, error: { code: 'CONCEPT_UNAVAILABLE', message: 'Requested concept is not available.' } },
        { status: 404 }
      );
    }

    // 1. Session Creation Action
    if (action === 'create' || !sessionId) {
      const session = await xiraClassroomOrchestrator.createSession(
        concept.id,
        (initialStage as ClassroomStage) || 'INTRODUCE',
        { ownerId: user?.id, intent: parseClassIntent(intent) }
      );

      const response = NextResponse.json({
        success: true,
        session,
      });
      return applyRateLimitHeaders(response, rateResult);
    }

    // 2. Learner Action Processing
    if (action === 'process') {
      if (!learnerAction || typeof learnerAction !== 'object' || !learnerAction.type) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_REQUEST',
              message: 'Field "learnerAction" is required for action "process".',
            },
          },
          { status: 400 }
        );
      }

      if (typeof sessionId !== 'string' || sessionId.length > 120) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_REQUEST', message: 'Invalid sessionId.' } },
          { status: 400 }
        );
      }
      const updatedSession = await xiraClassroomOrchestrator.processLearnerAction(
        sessionId,
        learnerAction as ClassroomLearnerAction,
        user?.id
      );
      if (updatedSession.conceptId !== concept.id) {
        // The session belongs to a different concept than the caller claims.
        return NextResponse.json(
          { success: false, error: { code: 'CONCEPT_MISMATCH', message: 'Session concept does not match request.' } },
          { status: 409 }
        );
      }

      const response = NextResponse.json({
        success: true,
        session: updatedSession,
      });
      return applyRateLimitHeaders(response, rateResult);
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_ACTION',
          message: `Unrecognized action "${action}". Permitted actions: "create", "process"`,
        },
      },
      { status: 400 }
    );
  } catch (error: any) {
    if (error instanceof SessionNotFoundError) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Classroom session not found.' } },
        { status: 404 }
      );
    }
    if (error instanceof ConceptUnavailableError) {
      return NextResponse.json(
        { success: false, error: { code: 'CONCEPT_UNAVAILABLE', message: 'Requested concept is not available.' } },
        { status: 404 }
      );
    }
    console.error('[ClassroomSession API Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while managing classroom session.',
        },
      },
      { status: 500 }
    );
  }
}
