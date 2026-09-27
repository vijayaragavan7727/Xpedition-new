import { NextRequest, NextResponse } from 'next/server';
import { classroomIntegrationRegistry } from '@/lib/classroom/integrations';
import {
  CacheBackedOwnershipStore,
  handleIntegrationRequest,
  INTEGRATION_MAX_BODY_BYTES,
} from '@/lib/classroom/integrations/integrationAuthorization';
import { requireServerAuth } from '@/lib/auth/serverAuth';
import { readJsonBodyWithLimit } from '@/lib/security/requestBody';
import {
  rateLimiter,
  getClientRateLimitKey,
  createRateLimitExceededResponse,
  applyRateLimitHeaders,
} from '@/lib/security/rateLimiter';

export const runtime = 'nodejs';

const ownership = new CacheBackedOwnershipStore();

/**
 * Classroom integrations (OpenMAIC / Canvas / Miro / LiveGenie adapters).
 *
 * Requires an authenticated learner for BOTH status and actions. Server-held
 * provider credentials (e.g. the Canvas course token) are only ever used on
 * behalf of an authenticated, authorized learner — see integrationAuthorization.ts.
 */
export async function GET(request: NextRequest) {
  const { user, errorResponse } = await requireServerAuth(request);
  if (errorResponse) return errorResponse;
  const result = await handleIntegrationRequest({ method: 'GET', user, registry: classroomIntegrationRegistry, ownership });
  return NextResponse.json(result.body, { status: result.status });
}

export async function POST(request: NextRequest) {
  const { user, errorResponse } = await requireServerAuth(request);
  if (errorResponse) return errorResponse;

  const rateLimitKey = getClientRateLimitKey(request, user?.id, 'classroom-integrations');
  const rateResult = await rateLimiter.checkLimit(rateLimitKey, { maxRequests: 60, windowMs: 60000 });
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
    ownership,
  });
  return applyRateLimitHeaders(NextResponse.json(result.body, { status: result.status }), rateResult);
}
