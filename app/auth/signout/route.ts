import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const supabase = createClient();

  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[SignOut Route] Supabase signOut warning:', err);
    }
  }

  const response = NextResponse.redirect(`${origin}/login`, { status: 302 });

  // Clear any auth cookies that might linger
  response.cookies.delete('sb-access-token');
  response.cookies.delete('sb-refresh-token');

  return response;
}

export async function POST(request: Request) {
  return GET(request);
}
