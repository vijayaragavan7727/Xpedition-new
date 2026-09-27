import '@/lib/supabase/serverDb';
import { NextResponse } from 'next/server';
import { requireServerAuth } from '@/lib/auth/serverAuth';
import { learnerVisualEngine, toClientJob } from '@/lib/visualGeneration/learnerVisualGeneration';

export const runtime = 'nodejs';

/**
 * Job status. Requires an authenticated requester AND job.ownerId === requester.
 * Another learner's job id is indistinguishable from a non-existent one (404).
 */
export async function GET(request: Request, { params }: { params: { jobId: string } }) {
  try {
    const { user, errorResponse } = await requireServerAuth(request);
    if (errorResponse || !user) return errorResponse!;

    const { jobId } = params;
    if (!jobId || typeof jobId !== 'string' || jobId.length > 128) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid jobId parameter.' } },
        { status: 400 }
      );
    }

    const job = await learnerVisualEngine().getJobForOwner(jobId, user.id);
    if (!job) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Job not found.' } }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: toClientJob(job) });
  } catch (error: any) {
    console.error('[API:visual-generation/[jobId]] Error:', error?.message || error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An error occurred while fetching job status.' } },
      { status: 500 }
    );
  }
}
