import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { defaultLocalPersistence, defaultSupabasePersistence } from '@/lib/persistence';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/user/export
 * Exports all learning data for the authenticated learner in standard JSON.
 *
 * Enforces strict user scoping, session identity authority, and IDOR prevention.
 * Excludes all API keys, internal credentials, infrastructure data, or secrets.
 */
export async function GET(request: Request) {
  try {
    let userId: string | null = null;
    let email = 'learner@xpedition.local';

    // 1. Check authoritative Supabase session
    const supabase = createClient();
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        email = user.email || email;
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to export your learning data.' },
        { status: 401 }
      );
    }

    // 3. Fetch canonical data scoped strictly to this authenticated userId
    let canonicalState = await defaultSupabasePersistence.getUserState(userId);

    if (!canonicalState) {
      canonicalState = defaultLocalPersistence.createDefaultUserData(userId, email, 'Learner');
    }

    // 4. Construct sanitized export payload
    const exportBundle = {
      format: 'Xpedition Learner Data Archive',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      user: {
        id: userId,
        email: canonicalState.profile?.email || email,
        displayName: canonicalState.profile?.displayName || 'Learner',
        goal: canonicalState.profile?.goal || '',
        level: canonicalState.profile?.level || 'Beginner',
        subjects: canonicalState.profile?.subjects || [],
        interests: canonicalState.profile?.interests || [],
        createdAt: canonicalState.profile?.createdAt ? new Date(canonicalState.profile.createdAt).toISOString() : null,
      },
      progression: canonicalState.progression || {
        xp: 0,
        level: 1,
        streak: 0,
        longestStreak: 0,
        coins: 0,
        badges: [],
      },
      mastery: {
        activeGraphId: canonicalState.activeGraphId,
        graphs: (canonicalState.graphs || []).map((g) => ({
          id: g.id,
          goalText: g.goalText,
          concepts: (g.concepts || []).map((c) => ({
            id: c.id,
            name: c.name,
            masteryPercentage: c.masteryPercentage,
            retentionRisk: c.retentionRisk,
            thetaAssisted: c.thetaAssisted,
            thetaSolo: c.thetaSolo,
          })),
        })),
      },
      attempts: (canonicalState.graphs || []).flatMap((g) =>
        (g.attempts || []).map((a) => ({
          id: a.id,
          conceptId: a.conceptId,
          conceptName: a.conceptName,
          isCorrect: a.isCorrect,
          isSolo: a.isSolo,
          confidence: a.confidence,
          timestamp: a.timestamp ? new Date(a.timestamp).toISOString() : null,
        }))
      ),
      xiraEducationalMemories: canonicalState.xiraMemories || [],
      questProgress: canonicalState.questProgress || {},
      flowState: canonicalState.flowState || null,
    };

    return new NextResponse(JSON.stringify(exportBundle, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="xpedition-learning-export-${userId.slice(0, 8)}.json"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err: any) {
    console.error('[API /api/user/export GET] Error:', err);
    return NextResponse.json({ error: 'Failed to generate data export' }, { status: 500 });
  }
}
