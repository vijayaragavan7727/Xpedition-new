import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * GET /api/admin/check
 * Validates server-side whether the currently authenticated user is an administrator.
 */
export async function GET() {
  try {
    const supabase = createClient();
    if (!supabase) {
      // In local offline mode without Supabase configured, check NODE_ENV or disallow
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({ isAdmin: true, mode: 'development_fallback' }, { status: 200 });
      }
      return NextResponse.json({ error: 'Authentication service unavailable', isAdmin: false }, { status: 503 });
    }

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized: Session missing or expired', isAdmin: false }, { status: 401 });
    }

    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const userEmail = (user.email || '').toLowerCase();
    const appRole = user.app_metadata?.role;

    // Strict Admin Authorization:
    // Only server-managed app_metadata (never client-writable user_metadata) or server-configured ADMIN_EMAILS
    const isExplicitAdmin =
      appRole === 'admin' ||
      (adminEmails.length > 0 && adminEmails.includes(userEmail));

    if (!isExplicitAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: User does not have administrator privileges', isAdmin: false },
        { status: 403 }
      );
    }

    return NextResponse.json({
      isAdmin: true,
      userId: user.id,
      email: user.email,
    }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Internal server error checking admin privileges', isAdmin: false },
      { status: 500 }
    );
  }
}
