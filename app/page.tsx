'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getStoreData } from '@/lib/store';
import { getNextStep } from '@/lib/onboarding';
import { ArrowRight, Compass } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(false);

  // If user is already authenticated and active, route them straight to their target step
  const handleGetStarted = async (e: React.MouseEvent) => {
    if (!isSupabaseConfigured || !supabase) {
      // Local mode: check if store has progress or go straight to onboarding
      const store = getStoreData();
      const next = getNextStep(store);
      if (next !== 'goal') {
        e.preventDefault();
        router.push(next === 'calibrate' ? '/calibrate' : '/home');
      }
      return;
    }

    try {
      setCheckingAuth(true);
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        e.preventDefault();
        const store = getStoreData();
        const next = getNextStep(store);
        const targetUrl = next === 'goal' ? '/onboarding' : next === 'calibrate' ? '/calibrate' : '/home';
        router.push(targetUrl);
      }
    } catch {
      // Proceed to default href (/onboarding) on session check failure
    } finally {
      setCheckingAuth(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#0B0D14] text-[#F8FAFC] flex flex-col justify-between overflow-x-hidden selection:bg-indigo-600 selection:text-white">
      {/* =========================================================================
          ATMOSPHERIC AMBIENT BACKDROP (Calm, Deep Nocturne Scholar)
          ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden" aria-hidden="true">
        {/* Soft top indigo aura */}
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[360px] rounded-full blur-[140px]"
          style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)' }}
        />
        {/* Soft natural meadow aura beneath camp */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[520px] h-[320px] rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, rgba(245, 158, 11, 0.05) 45%, transparent 75%)' }}
        />
        {/* Subtle grid pattern overlay with soft fade */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      {/* =========================================================================
          TOP BAR: BRANDING HEADER
          ========================================================================= */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-5 sm:pt-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-sm shadow-indigo-500/10">
            <Compass className="w-4 h-4 text-indigo-400" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="font-orbitron font-bold text-lg tracking-wordmark text-white leading-none">
              XPEDITION
            </span>
          </div>
        </div>

        <div className="flex items-center">
          <span className="font-mono text-[10px] tracking-wider uppercase text-slate-400 bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 rounded-full">
            Learning World
          </span>
        </div>
      </header>

      {/* =========================================================================
          MAIN HERO VIEWPORT: CALM ENTRANCE
          ========================================================================= */}
      <main className="relative z-10 w-full max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-8 my-auto flex flex-col items-center text-center">
        {/* 1. World / Learning Illustration */}
        <div className="relative w-full max-w-[340px] xs:max-w-[380px] sm:max-w-[420px] h-[190px] xs:h-[220px] sm:h-[260px] md:h-[280px] flex items-center justify-center my-2 sm:my-3">
          {/* Subtle grounded shadow pool under camp */}
          <div
            className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[78%] h-[30%] rounded-[100%] blur-[28px] pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.18) 0%, rgba(99, 102, 241, 0.16) 50%, transparent 80%)',
            }}
            aria-hidden="true"
          />

          <Image
            src="/world/buildings/learning-camp.png"
            alt="XPedition Learning Adventure Camp"
            width={480}
            height={320}
            priority
            className="w-full h-full object-contain relative z-10 drop-shadow-xl select-none transition-transform duration-500 ease-out hover:scale-[1.02] motion-reduce:transition-none motion-reduce:hover:scale-100"
          />
        </div>

        {/* 2. Tagline */}
        <div className="space-y-2 mt-3 sm:mt-4">
          <h1 className="font-sans font-bold text-2xl xs:text-3xl sm:text-4xl text-[#F8FAFC] tracking-tight leading-[1.18]">
            <span>Learn by Doing.</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-indigo-300 to-sky-300">
              Not by Watching.
            </span>
          </h1>

          {/* 3. Short Supporting Sentence */}
          <p className="font-sans text-sm sm:text-base text-slate-400 max-w-md mx-auto leading-relaxed pt-1">
            An intelligent learning adventure where you master real skills through hands-on quests, guided by your companion Xira.
          </p>
        </div>

        {/* 4. Action Buttons (Primary + Secondary) */}
        <div className="w-full max-w-sm flex flex-col gap-3 mt-6 sm:mt-7">
          {/* Primary CTA: Get Started */}
          <Link
            href="/onboarding"
            onClick={handleGetStarted}
            className="w-full h-[52px] rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-sans font-semibold text-[15px] sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0D14] motion-reduce:transform-none cursor-pointer"
          >
            <span>{checkingAuth ? 'Opening...' : 'Get Started'}</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200" aria-hidden="true" />
          </Link>

          {/* Secondary CTA: I already have an account */}
          <Link
            href="/login"
            className="w-full h-[48px] rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.03] border border-white/[0.1] hover:border-white/[0.2] text-slate-300 hover:text-white font-sans font-medium text-[14px] flex items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0D14] cursor-pointer"
          >
            I already have an account
          </Link>
        </div>
      </main>

      {/* =========================================================================
          FOOTER: MINIMALIST & ACCESSIBLE
          ========================================================================= */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between text-[12px] font-sans text-slate-500 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <span>© {new Date().getFullYear()} XPedition</span>
        <div className="flex items-center gap-4">
          <Link href="/terms" className="hover:text-slate-400 transition-colors underline-offset-4 hover:underline">
            Terms & Privacy
          </Link>
        </div>
      </footer>
    </div>
  );
}
