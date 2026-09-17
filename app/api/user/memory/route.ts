import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { defaultSupabasePersistence, XiraEducationalMemory } from '@/lib/persistence';

export const runtime = 'nodejs';

const ALLOWED_CATEGORIES = new Set([
  'recurring_error',
  'confidence_calibration',
  'difficulty_response',
  'intervention_effectiveness',
  'preferred_format',
]);

/**
 * GET /api/user/memory
 * Retrieves educational Xira memories for the authenticated user.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const conceptId = searchParams.get('conceptId') || undefined;

    let userId: string | null = null;
    const supabase = createClient();
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
      }
    }

    if (!userId) {
      userId = request.headers.get('x-user-id');
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const memories = await defaultSupabasePersistence.getXiraMemories(userId, conceptId);
    return NextResponse.json({ success: true, memories });
  } catch (err: any) {
    console.error('[API /api/user/memory GET] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/user/memory
 * Persists an educational Xira memory with validation.
 */
export async function POST(request: Request) {
  try {
    let userId: string | null = null;
    const supabase = createClient();
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
      }
    }

    if (!userId) {
      userId = request.headers.get('x-user-id');
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.memory) {
      return NextResponse.json({ error: 'Missing memory payload' }, { status: 400 });
    }

    const mem = body.memory;

    // Validate category
    if (!ALLOWED_CATEGORIES.has(mem.category)) {
      return NextResponse.json(
        { error: `Invalid memory category. Must be one of: ${Array.from(ALLOWED_CATEGORIES).join(', ')}` },
        { status: 400 }
      );
    }

    // Validate concept ID
    if (!mem.conceptId || typeof mem.conceptId !== 'string') {
      return NextResponse.json({ error: 'Missing valid conceptId' }, { status: 400 });
    }

    // Validate strength (0.0 to 1.0)
    const strength = Math.max(0, Math.min(1.0, Number(mem.strength ?? 0.5)));

    const sanitizedMemory: XiraEducationalMemory = {
      id: mem.id || `xmem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId,
      conceptId: mem.conceptId,
      conceptName: String(mem.conceptName || 'Core Topic').slice(0, 100),
      category: mem.category,
      strength,
      evidenceSummary: String(mem.evidenceSummary || '').slice(0, 300),
      timestamp: Number(mem.timestamp) || Date.now(),
    };

    const saved = await defaultSupabasePersistence.recordXiraMemory(sanitizedMemory);

    return NextResponse.json({ success: saved, memoryId: sanitizedMemory.id });
  } catch (err: any) {
    console.error('[API /api/user/memory POST] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
