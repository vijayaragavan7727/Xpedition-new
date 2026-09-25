import { NextResponse } from 'next/server';
import { requireServerAuth } from '@/lib/auth/serverAuth';
import { visualGenerationEngine } from '@/lib/visualGeneration';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const { user, errorResponse } = await requireServerAuth(request);
    if (errorResponse) {
      return errorResponse;
    }

    const { jobId } = params;
    if (!jobId || typeof jobId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid jobId parameter.',
          },
        },
        { status: 400 }
      );
    }

    const job = await visualGenerationEngine.getJob(jobId);
    if (!job) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Job "${jobId}" was not found.`,
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        jobId: job.jobId,
        requestId: job.requestId,
        conceptId: job.conceptId,
        workflowId: job.workflowId,
        status: job.status,
        reused: Boolean(job.reused),
        publicUrl: job.asset?.publicUrl || job.output?.url,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
        errorCode: job.errorCode,
        error: job.error,
      },
    });
  } catch (error: any) {
    console.error('[API:visual-generation/[jobId]] Error:', error?.message || error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching job status.',
        },
      },
      { status: 500 }
    );
  }
}
