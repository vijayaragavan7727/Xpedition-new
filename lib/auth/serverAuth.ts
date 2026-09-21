import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { User } from '@supabase/supabase-js';

export interface ServerAuthResult {
  user: User | null;
  errorResponse: NextResponse | null;
}

/**
 * Validates that an incoming server request is authenticated via Supabase SSR session.
 * Protects expensive AI endpoints from unauthenticated access (Denial of Wallet).
 */
export async function requireServerAuth(request?: Request): Promise<ServerAuthResult> {
  const supabase = createClient();

  // If Supabase is not configured (e.g. local offline mode without Supabase env vars)
  if (!supabase) {
    if (process.env.NODE_ENV === 'development' || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      // Allow fallback mock user in local offline dev mode so developers can test without keys
      return {
        user: {
          id: 'dev-local-user',
          email: 'dev@xpedition.local',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        } as User,
        errorResponse: null,
      };
    }
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: 'Authentication service unavailable' },
        { status: 503 }
      ),
    };
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return {
        user: null,
        errorResponse: NextResponse.json(
          { error: 'Unauthorized: Valid session required to access AI services' },
          { status: 401 }
        ),
      };
    }

    return { user, errorResponse: null };
  } catch (err: any) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: 'Unauthorized: Authentication validation failed' },
        { status: 401 }
      ),
    };
  }
}
