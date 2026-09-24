'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { AuthCard } from '@/components/AuthCard';
import { XpeditionLogo } from '@/components/XpeditionLogo';
import { GraduationCap, Target, Trophy, Sparkles } from 'lucide-react';

function LoginContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';
  const error = searchParams.get('error');

  return <AuthCard initialMode={mode} initialError={error} />;
}

export default function LoginPage() {
  const valuePoints = [
    {
      title: 'Personalized Learning',
      icon: GraduationCap,
    },
    {
      title: 'Real-World Skills',
      icon: Target,
    },
    {
      title: 'Gamified Progress',
      icon: Trophy,
    },
    {
      title: 'AI-Powered Guidance',
      icon: Sparkles,
    },
  ];

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#FAF8F5] text-slate-900 flex flex-col justify-between overflow-x-hidden selection:bg-[#184E38] selection:text-white">
      {/* =========================================================================
          BACKGROUND SCENIC LAYER
          Warm study environment, sunlit window, mountain landscape, wooden table
          ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden" aria-hidden="true">
        <Image
          src="/images/login-study-bg.jpg"
          alt=""
          priority
          fill
          sizes="100vw"
          className="object-cover object-center sm:object-[left_center]"
        />
        {/* Subtle daylight overlay for guaranteed text contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/70 via-white/30 to-white/50 lg:from-white/35 lg:via-transparent lg:to-black/10" />
      </div>

      {/* =========================================================================
          MAIN UNIFIED RESPONSIVE CONTAINER
          Desktop: Split-Screen (~55% Left Brand Story / ~45% Right Auth Card)
          Mobile: Canonical Recomposed Vertical Stream (ZERO duplicate rendering)
          ========================================================================= */}
      <div className="relative z-10 w-full min-h-[100dvh] flex flex-col justify-between p-3 sm:p-6 md:p-8 lg:p-12 xl:p-14 max-w-[1600px] mx-auto box-border">
        {/* Top Header: Logo for Mobile & Desktop */}
        <header className="w-full flex items-center justify-center lg:justify-start pt-0.5 pb-1 lg:pb-0 lg:mb-4">
          <Link
            href="/"
            className="inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#184E38] rounded-lg"
          >
            <XpeditionLogo />
          </Link>
        </header>

        {/* Canonical Main Grid Layout (Single representation in DOM tree) */}
        <main className="w-full my-auto grid grid-cols-1 lg:grid-cols-12 gap-y-3 sm:gap-y-5 lg:gap-y-4 lg:gap-x-10 xl:gap-x-14 items-center py-1 sm:py-6">
          {/* 1. Main Editorial Headline & Tagline */}
          <div className="order-1 lg:order-none lg:col-span-7 text-center lg:text-left">
            <div className="space-y-1 sm:space-y-3 mb-0.5 lg:mb-6">
              <h1 className="font-['Georgia',serif] text-[26px] sm:text-4xl md:text-5xl xl:text-[54px] font-bold text-slate-900 tracking-tight leading-[1.16]">
                <span className="sm:hidden">
                  Your Learning Journey <br />
                  Starts Here
                </span>
                <span className="hidden sm:inline">
                  Your <br />
                  Learning Journey <br />
                  Starts Here
                </span>
              </h1>
              <p className="font-sans text-xs sm:text-base font-medium text-slate-700 tracking-wide pt-0.5 sm:pt-1">
                Plan. Learn. Explore. Grow.
              </p>
            </div>
          </div>

          {/* 2. Production Authentication Card (Spans rows 1-3 on Desktop) */}
          <div className="order-2 lg:order-none lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:row-span-3 flex justify-center lg:justify-end items-center w-full self-center">
            <Suspense
              fallback={
                <div className="w-full max-w-[340px] sm:max-w-[420px] h-[480px] bg-white rounded-[22px] animate-pulse shadow-xl border border-slate-100" />
              }
            >
              <LoginContent />
            </Suspense>
          </div>

          {/* 3. Four Core Value Points (Single Canonical DOM element) */}
          <div className="order-3 lg:order-none lg:col-span-7 w-full max-w-sm lg:max-w-none mx-auto lg:mx-0">
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5 sm:gap-3.5 lg:space-y-4 lg:gap-0 lg:mb-8">
              {valuePoints.map((item) => {
                const IconComponent = item.icon;
                return (
                  <div key={item.title} className="flex items-center gap-2 sm:gap-3.5 group text-left">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#184E38] text-white flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105">
                      <IconComponent className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden="true" />
                    </div>
                    <span className="font-sans font-semibold text-slate-900 text-xs sm:text-[15px] leading-tight">
                      {item.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Handwriting Callout: A Brighter You Awaits (Single Canonical DOM element) */}
          <div className="order-4 lg:order-none lg:col-span-7 text-center lg:text-left pt-1 lg:pt-2">
            <span className="font-caveat font-bold text-2xl sm:text-3xl xl:text-4xl text-slate-900 tracking-tight leading-none inline-block -rotate-1 sm:-rotate-2 select-none">
              <span className="sm:hidden">A Brighter You Awaits</span>
              <span className="hidden sm:inline">
                A Brighter <br />
                You Awaits
              </span>
            </span>
          </div>
        </main>

        {/* =========================================================================
            CLEAN UNOBTRUSIVE FOOTER (Desktop & Mobile)
            ========================================================================= */}
        <footer className="w-full py-3 flex flex-col sm:flex-row items-center justify-between text-xs font-sans text-slate-600 gap-2 select-none mt-2">
          <span>© {new Date().getFullYear()} Xpedition. All rights reserved.</span>
          <div className="flex items-center gap-4 text-xs font-medium">
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">
              Privacy
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-slate-900 transition-colors">
              Terms
            </Link>
            <span>•</span>
            <Link href="/trust" className="hover:text-slate-900 transition-colors">
              Trust Center
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
