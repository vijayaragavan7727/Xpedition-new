import '@/lib/supabase/serverDb';
import { NextRequest, NextResponse } from 'next/server';
import { classroomIntegrationRegistry } from '@/lib/classroom/integrations';
import {
  handleIntegrationRequest,
  INTEGRATION_MAX_BODY_BYTES,
} from '@/lib/classroom/integrations/integrationAuthorization';
import { requireServerAuth } from '@/lib/auth/serverAuth';
import { readJsonBodyWithLimit } from '@/lib/security/requestBody';
import { integrationHandleSigner } from '@/lib/security/resourceHandle';
import { checkUserRateLimit } from '@/lib/security/distributedRateLimit';
import { applyRateLimitHeaders, createRateLimitExceededResponse } from '@/lib/security/rateLimiter';

export const runtime = 'nodejs';

/**
 * Classroom integrations (OpenMAIC / Canvas / Miro / LiveGenie adapters).
 *
 * Requires an authenticated learner for BOTH status and actions. Server-held
 * provider credentials (e.g. the Canvas school token) are only ever used on
 * behalf of an authenticated, authorized learner — see integrationAuthorization.ts.
 * Xpedition learner identity is not equivalent to a per-user Canvas identity.
 */
export async function GET(request: NextRequest) {
  const { user, errorResponse } = await requireServerAuth(request);
  if (errorResponse) return errorResponse;
  const result = await handleIntegrationRequest({ method: 'GET', user, registry: classroomIntegrationRegistry, handles: null });
  return NextResponse.json(result.body, { status: result.status });
}

export async function POST(request: NextRequest) {
  const { user, errorResponse } = await requireServerAuth(request);
  if (errorResponse || !user) return errorResponse!;

  const rateResult = await checkUserRateLimit({
    userId: user.id,
    bucket: 'classroom-integrations',
    maxRequests: 60,
    windowMs: 60000,
  });
  if (!rateResult.allowed) return createRateLimitExceededResponse(rateResult);

  const body = await readJsonBodyWithLimit(request, INTEGRATION_MAX_BODY_BYTES);
  if (!body.ok) {
    return NextResponse.json({ success: false, error: body.error }, { status: body.status });
  }

  const result = await handleIntegrationRequest({
    method: 'POST',
    user,
    body: body.value,
    registry: classroomIntegrationRegistry,
    handles: integrationHandleSigner(),
  });
  return applyRateLimitHeaders(NextResponse.json(result.body, { status: result.status }), rateResult);
}
