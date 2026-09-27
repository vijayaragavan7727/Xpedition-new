import '@/lib/supabase/serverDb';
import { NextResponse } from 'next/server';
import { requireServerAuth } from '@/lib/auth/serverAuth';
import { readOwnedAsset } from '@/lib/visualGeneration/learnerVisualGeneration';

export const runtime = 'nodejs';

/**
 * The only way to retrieve a learner-requested generated image. The bytes live
 * outside public/, so there is no static URL that could bypass this check.
 */
export async function GET(request: Request, { params }: { params: { jobId: string } }) {
  const { user, errorResponse } = await requireServerAuth(request);
  if (errorResponse || !user) return errorResponse!;

  const asset = await readOwnedAsset(String(params.jobId || ''), user.id);
  if (!asset) {
    return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Asset not found.' } }, { status: 404 });
  }
  return new NextResponse(new Uint8Array(asset.buffer), {
    status: 200,
    headers: {
      'Content-Type': asset.mimeType,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
