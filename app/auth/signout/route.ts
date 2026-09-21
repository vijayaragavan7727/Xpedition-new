import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin;
  const response = NextResponse.redirect(`${origin}/login`, { status: 302 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
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

    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[SignOut Route] Supabase signOut warning:', err);
    }
  }

  // Explicitly clear all project auth token cookies and chunks from response
  const cookiesList = (request as any).cookies?.getAll
    ? (request as any).cookies.getAll()
    : (request.headers.get('cookie') || '')
        .split(';')
        .map((c: string) => ({ name: c.trim().split('=')[0] }))
        .filter((c: any) => c.name);

  cookiesList.forEach((c: { name: string }) => {
    if (c.name.startsWith('sb-') || c.name.includes('auth-token') || c.name.includes('supabase')) {
      response.cookies.delete(c.name);
      response.cookies.set(c.name, '', { maxAge: 0, path: '/' });
    }
  });

  return response;
}

export async function POST(request: Request) {
  return GET(request);
}
