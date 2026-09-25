import { NextResponse } from 'next/server';
import { requireServerAuth } from '@/lib/auth/serverAuth';
import { visualRequirementEngine, VisualStage } from '@/lib/visualIntelligence';
import { LocalAssetStore } from '@/lib/visualGeneration';

export const runtime = 'nodejs';

const VALID_STAGES: Set<VisualStage> = new Set([
  'introduce',
  'explain',
  'demonstrate',
  'interact',
  'question',
  'practice',
  'challenge',
  'assess',
  'feedback',
]);

export async function POST(request: Request) {
  try {
    const { user, errorResponse } = await requireServerAuth(request);
    if (errorResponse) {
      return errorResponse;
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
      conceptId,
      subject,
      topic,
      learningObjective,
      stage,
      allowGeneration,
      cachePolicy,
    } = body;

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

    if (stage && !VALID_STAGES.has(stage as VisualStage)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: `Invalid stage "${stage}". Permitted values: ${Array.from(VALID_STAGES).join(', ')}`,
          },
        },
        { status: 400 }
      );
    }

    // Run Visual Intelligence reasoning
    const requirement = await visualRequirementEngine.evaluateVisualRequirement({
      conceptId: conceptId.trim(),
      subject: typeof subject === 'string' ? subject.trim() : undefined,
      topic: typeof topic === 'string' ? topic.trim() : undefined,
      learningObjective:
        typeof learningObjective === 'string' ? learningObjective.trim() : undefined,
      stage: (stage as VisualStage) || 'explain',
      allowGeneration: Boolean(allowGeneration),
      cachePolicy: cachePolicy === 'refresh' || cachePolicy === 'force' ? cachePolicy : 'reuse',
    });

    // Sanitize output (ensure no internal filesystem paths leak)
    const sanitizedResolvedAsset = requirement.resolvedAsset
      ? LocalAssetStore.sanitizeForClient(requirement.resolvedAsset)
      : undefined;

    const sanitizedCandidates = (requirement.existingAssetCandidates || []).map((a) =>
      LocalAssetStore.sanitizeForClient(a)
    );

    const smartBoardPayload = visualRequirementEngine.formatSmartBoardPayload({
      ...requirement,
      resolvedAsset: sanitizedResolvedAsset,
    });

    return NextResponse.json({
      success: true,
      requirement: {
        ...requirement,
        resolvedAsset: sanitizedResolvedAsset,
        existingAssetCandidates: sanitizedCandidates,
      },
      smartBoardPayload,
    });
  } catch (error: any) {
    console.error('[VisualIntelligence API Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while evaluating visual intelligence.',
        },
      },
      { status: 500 }
    );
  }
}
