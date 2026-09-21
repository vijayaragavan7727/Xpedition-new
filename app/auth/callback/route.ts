import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const rawNext = requestUrl.searchParams.get('next');
  let safeNext = '/home';
  if (rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//')) {
    safeNext = rawNext;
  }
  const errorParam = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  const origin = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin;

  // Handle OAuth provider error parameters
  if (errorParam || errorDescription) {
    console.error('OAuth Callback Error:', errorParam, errorDescription);
    const errorMsg = errorDescription || errorParam || 'OAuth provider authentication failed';
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorMsg)}`);
  }

  // Handle OAuth authorization code exchange
  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      // Create redirect response upfront to bind Set-Cookie headers from exchangeCodeForSession
      const response = NextResponse.redirect(`${origin}${safeNext}`);

      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            if ((request as any).cookies?.getAll) {
              return (request as any).cookies.getAll();
            }
            const cookieHeader = request.headers.get('cookie') || '';
            return cookieHeader
              .split(';')
              .map((c) => {
                const [name, ...val] = c.trim().split('=');
                return { name, value: val.join('=') };
              })
              .filter((c) => c.name);
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      });

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return response;
      }
      console.error('OAuth Code Exchange Error:', error);
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
    }
  }

  // Fallback for missing code or unconfigured Supabase
  return NextResponse.redirect(`${origin}/login?error=missing_oauth_code`);
}
