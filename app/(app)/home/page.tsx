'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { getStoreData, UserStoreData } from '@/lib/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { resolveHomeDashboardData } from '@/lib/home/homeDashboardModel';
import { HomeDesktopSidebar, HomeMobileBottomNav } from '@/components/home/HomeNavigation';
import { HomeDashboardView } from '@/components/home/HomeDashboardView';

export default function HomePage() {
  const [storeData, setStoreData] = useState<UserStoreData | null>(null);
  const [authUser, setAuthUser] = useState<{ user_metadata?: { full_name?: string; name?: string }; email?: string } | null>(null);

  // Load store and authenticated user profile
  useEffect(() => {
    setStoreData(getStoreData());

    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data }) => {
        if (data?.session?.user) {
          setAuthUser(data.session.user);
        }
      }).catch(() => {});
    }
  }, []);

  // Compute canonical presentation view-model decoupled from content
  const dashboardData = useMemo(() => {
    return resolveHomeDashboardData(storeData, authUser);
  }, [storeData, authUser]);

  // Non-blocking idle pre-fetch for target concept to eliminate cold latency without competing with Home render
  useEffect(() => {
    if (!dashboardData?.continueLearning?.conceptId) return;
    const conceptId = dashboardData.continueLearning.conceptId;
    const conceptName = dashboardData.continueLearning.title;

    if (conceptId && conceptId !== 'default') {
      const cacheKey = `xyra_lesson_${conceptId}`;
      if (typeof window !== 'undefined' && !sessionStorage.getItem(cacheKey)) {
        let idleId: any;
        const doPrefetch = () => {
          fetch('/api/lesson', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              conceptId,
              conceptName,
              conceptSummary: '',
              language: storeData?.learnerProfile?.language || 'english',
              startingLevel: storeData?.learnerProfile?.startingLevel || 'Complete beginner',
              masteryPercentage: dashboardData.progress.percentage || 0,
              isQuickLearn: false,
            }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data?.chunks && typeof window !== 'undefined') {
                sessionStorage.setItem(cacheKey, JSON.stringify(data));
              }
            })
            .catch(() => {});
        };

        if ('requestIdleCallback' in window) {
          idleId = (window as any).requestIdleCallback(doPrefetch, { timeout: 4000 });
          return () => (window as any).cancelIdleCallback(idleId);
        } else {
          idleId = setTimeout(doPrefetch, 2500);
          return () => clearTimeout(idleId);
        }
      }
    }
  }, [dashboardData?.continueLearning?.conceptId, dashboardData?.continueLearning?.title, dashboardData?.progress?.percentage, storeData?.learnerProfile]);

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#FAF8F5] text-slate-900 flex flex-col md:flex-row overflow-x-hidden selection:bg-[#184E38] selection:text-white">
      {/* Desktop Left Sidebar (>= 768px) */}
      <HomeDesktopSidebar />

      {/* Main Dashboard Canvas Area */}
      <main className="flex-1 min-h-[100dvh] overflow-y-auto px-3 sm:px-6 md:px-8 lg:px-9 py-2 sm:py-4 lg:py-3.5 pb-24 md:pb-8 max-w-[1400px] w-full box-border">
        <HomeDashboardView data={dashboardData} />
      </main>

      {/* Mobile Bottom Navigation Bar (< 1024px) */}
      <HomeMobileBottomNav />
    </div>
  );
}
