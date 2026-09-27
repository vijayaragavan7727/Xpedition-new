'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { DashBackdrop } from '@/components/DashBackdrop';
import { TopBar } from '@/components/TopBar';
import { HomeDesktopSidebar, HomeMobileBottomNav } from '@/components/home/HomeNavigation';
import { getStoreData, UserStoreData } from '@/lib/store';
import { getNextStep, OnboardingStep } from '@/lib/onboarding';

/** Lesson screens that need an active pathway (goal + calibration) before they can run. */
const PATHWAY_GATED_PREFIXES = ['/teach', '/experience'];
function requiresActivePathway(pathname: string | null): boolean {
  if (!pathname) return false;
  return PATHWAY_GATED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const [storeData, setStoreData] = useState<UserStoreData | null>(null);
  const [step, setStep] = useState<OnboardingStep | null>(null);
  const [loopBrokenNotice, setLoopBrokenNotice] = useState<boolean>(false);
  const isWorldPage = pathname === '/world';
  const isPassportPage = pathname === '/passport';
  // Only screens that run a lesson on the active pathway need a goal + calibration
  // first. Everything else (Home, Learn, World, Profile, Passport, History,
  // Progress, Xira) is a navigation or record view with its own honest empty
  // state, so it must open directly: redirecting it to /onboarding or /calibrate
  // sent learners to a different screen on the first click (and only an "Exit"
  // there made the second click work).
  const isBypassedPage = !requiresActivePathway(pathname);

  useEffect(() => {
    const data = getStoreData();
    setStoreData(data);

    if (!requiresActivePathway(pathname)) {
      setStep('ready');
      return;
    }

    // 1. Check Exit Override
    if (typeof window !== 'undefined') {
      const exitOverride = sessionStorage.getItem('xpedition_exit_override');
      if (exitOverride === 'true') {
        console.log('[AppLayout Gate] User explicitly exited onboarding. Bypassing gate redirects.');
        setStep('ready');
        return;
      }
    }

    const nextStep = getNextStep(data);
    setStep(nextStep);

    // 2. Loop Protection & Hard Stop
    if (typeof window !== 'undefined') {
      const redirectKey = 'xpedition_gate_redirect_count';
      const rawCount = sessionStorage.getItem(redirectKey);
      const count = parseInt(rawCount || '0', 10);

      if (count >= 2) {
        console.warn('[AppLayout Gate] HARD STOP: Gate redirected 2 times in session. Breaking loop and forcing ready state.');
        setLoopBrokenNotice(true);
        setStep('ready');
        return;
      }

      if (nextStep === 'goal' && pathname !== '/onboarding' && pathname !== '/world' && pathname !== '/profile') {
        sessionStorage.setItem(redirectKey, String(count + 1));
        router.replace('/onboarding');
      } else if (nextStep === 'calibrate' && pathname !== '/calibrate' && pathname !== '/world' && pathname !== '/profile') {
        sessionStorage.setItem(redirectKey, String(count + 1));
        router.replace('/calibrate');
      }
    }
  }, [pathname, router]);

  // Render skeleton loader while resolving (only lesson screens are gated)
  if (!isBypassedPage && (!storeData || step === null || (step !== 'ready' && typeof window !== 'undefined' && sessionStorage.getItem('xpedition_exit_override') !== 'true' && !loopBrokenNotice))) {
    return (
      <div className="flex h-[100dvh] overflow-hidden bg-ink text-text relative">
        <HomeDesktopSidebar />
        <div className="relative flex-1 min-w-0 flex flex-col">
          <header className="flex-none h-14 border-b border-line/40 flex items-center z-50 bg-ink/90 backdrop-blur-md">
            <TopBar />
          </header>
          <main className="flex-1 overflow-y-auto min-h-0 relative z-10">
            <div className="w-full max-w-[640px] lg:max-w-[1080px] mx-auto px-4 sm:px-6 pt-6 space-y-6">
              <div className="space-y-2 pt-2">
                <div className="h-6 w-48 bg-raised/80 rounded-md animate-pulse" />
                <div className="h-4 w-72 bg-raised/50 rounded-md animate-pulse" />
              </div>
              <div className="h-56 w-full bg-[#150F2A]/90 rounded-[16px] border border-line/40 p-6 space-y-4 animate-pulse">
                <div className="flex justify-between">
                  <div className="h-4 w-24 bg-raised rounded" />
                  <div className="h-4 w-32 bg-raised rounded" />
                </div>
                <div className="h-6 w-3/4 bg-raised rounded" />
                <div className="h-2 w-full bg-raised rounded-full" />
                <div className="h-11 w-full bg-raised rounded-[10px]" />
              </div>
            </div>
          </main>
        </div>
        <HomeMobileBottomNav />
      </div>
    );
  }

  // Home, Learn and Profile render their own canonical layout (same navigation as below)
  if (pathname === '/home' || pathname === '/learn' || pathname === '/profile') {
    return <>{children}</>;
  }

  // Passport is a light, paper page: it sits in the same shell as Home and Profile.
  if (isPassportPage) {
    return (
      <div className="flex h-[100dvh] overflow-hidden bg-[#F6F3EC] text-slate-900 selection:bg-[#184E38] selection:text-white">
        <HomeDesktopSidebar />
        <main className="relative z-0 flex-1 min-w-0 min-h-0 overflow-y-auto">
          <div className="w-full max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 md:pt-5 pb-24 md:pb-6">
            {children}
          </div>
        </main>
        <HomeMobileBottomNav />
      </div>
    );
  }

  // Other app screens (World, Xira, History, Progress, lessons) keep their dark
  // stage and the pathway top bar, with the same primary navigation as Home.
  return (
    <div className="flex h-[100dvh] overflow-hidden bg-ink text-text selection:bg-violet selection:text-white">
      <HomeDesktopSidebar />
      <div className="relative flex-1 min-w-0 flex flex-col">
        {!isWorldPage && <DashBackdrop src="" /* no photo slot shipped: use the CSS backdrop directly (avoids a 404 per page) */ />}

        <header className="flex-none h-14 border-b border-line/40 flex items-center z-50 bg-ink/90 backdrop-blur-md">
          <TopBar />
        </header>

        {loopBrokenNotice && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-300 font-mono text-xs px-4 py-2 text-center relative z-40 shrink-0">
            ⚠️ Loop Guard: Navigation state was restored to Home. You can resume calibration anytime.
          </div>
        )}

        {isWorldPage ? (
          <main className="flex-1 min-h-0 relative z-10 overflow-hidden w-full pb-[calc(56px+env(safe-area-inset-bottom,0px))] md:pb-0">
            {children}
          </main>
        ) : (
          <main className="flex-1 overflow-y-auto min-h-0 relative z-10">
            <div className="w-full max-w-[640px] lg:max-w-[1080px] mx-auto px-4 sm:px-6 pt-4 pb-24 md:pb-8">
              {children}
            </div>
          </main>
        )}
      </div>

      <HomeMobileBottomNav />
    </div>
  );
}
