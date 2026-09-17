'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AuthCard } from '@/components/AuthCard';
import { ArrowLeft } from 'lucide-react';

function LoginContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';

  return <AuthCard initialMode={mode} />;
}

export default function LoginPage() {
  return (
    <div className="relative min-h-[100dvh] w-full bg-[#0B0D14] text-[#F8FAFC] flex flex-col justify-between overflow-x-hidden selection:bg-indigo-600 selection:text-white">
      {/* =========================================================================
          ATMOSPHERIC AMBIENT BACKDROP (Calm, Deep Nocturne Scholar)
          ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden" aria-hidden="true">
        {/* Soft top indigo aura */}
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[360px] rounded-full blur-[140px]"
          style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.10) 0%, transparent 70%)' }}
        />
        {/* Soft natural meadow aura beneath card */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[500px] h-[320px] rounded-full blur-[130px]"
          style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, rgba(245, 158, 11, 0.03) 50%, transparent 75%)' }}
        />
        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      {/* =========================================================================
          TOP NAVIGATION BAR: BACK TO INTRO
          ========================================================================= */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-400 hover:text-white transition-colors py-1.5 px-2.5 rounded-lg hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to Intro</span>
        </Link>
      </header>

      {/* =========================================================================
          MAIN AUTH CARD VIEWPORT
          ========================================================================= */}
      <main className="relative z-10 w-full px-4 sm:px-6 py-6 sm:py-8 my-auto flex flex-col items-center justify-center">
        <Suspense fallback={<AuthCard />}>
          <LoginContent />
        </Suspense>
      </main>

      {/* =========================================================================
          MINIMALIST FOOTER
          ========================================================================= */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between text-[12px] font-sans text-slate-500 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <span>© {new Date().getFullYear()} Xpedition</span>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="hover:text-slate-400 transition-colors underline-offset-4 hover:underline">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-slate-400 transition-colors underline-offset-4 hover:underline">
            Terms
          </Link>
          <Link href="/trust" className="hover:text-slate-400 transition-colors underline-offset-4 hover:underline">
            Trust Center
          </Link>
        </div>
      </footer>
    </div>
  );
}
