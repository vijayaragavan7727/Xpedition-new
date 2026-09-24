'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { getStoreData, UserStoreData } from '@/lib/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { resolveLearningJourneyData } from '@/lib/learningJourney/learningJourneyModel';
import { LearningJourneyView } from '@/components/learningJourney';

export default function LearnPage() {
  const [storeData, setStoreData] = useState<UserStoreData | null>(null);
  const [authUser, setAuthUser] = useState<{
    user_metadata?: { full_name?: string; name?: string };
    email?: string;
  } | null>(null);

  // Load canonical user store and Supabase session
  useEffect(() => {
    setStoreData(getStoreData());

    if (isSupabaseConfigured && supabase) {
      supabase.auth
        .getSession()
        .then(({ data }) => {
          if (data?.session?.user) {
            setAuthUser(data.session.user);
          }
        })
        .catch(() => {});
    }
  }, []);

  // Resolve presentation view-model
  const journeyData = useMemo(() => {
    return resolveLearningJourneyData(storeData, authUser);
  }, [storeData, authUser]);

  // Non-blocking prefetch for the current lesson to eliminate latency when entering Class
  useEffect(() => {
    if (!journeyData?.currentLesson?.conceptId) return;
    const conceptId = journeyData.currentLesson.conceptId;
    const conceptName = journeyData.currentLesson.title;
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
            conceptSummary: journeyData.currentLesson.description,
            language: storeData?.learnerProfile?.language || 'english',
            startingLevel: storeData?.learnerProfile?.startingLevel || 'Complete beginner',
            masteryPercentage: journeyData.progress.percentage || 0,
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
  }, [
    journeyData?.currentLesson?.conceptId,
    journeyData?.currentLesson?.title,
    journeyData?.currentLesson?.description,
    journeyData?.progress?.percentage,
    storeData?.learnerProfile,
  ]);

  return <LearningJourneyView data={journeyData} />;
}
