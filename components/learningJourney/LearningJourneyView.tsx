'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LearningJourneyData } from '@/lib/learningJourney/learningJourneyModel';
import { HomeDesktopSidebar, HomeMobileBottomNav } from '@/components/home/HomeNavigation';
import { LearningJourneyTopBar } from './LearningJourneyTopBar';
import { LearningJourneyHero } from './LearningJourneyHero';
import { JourneyPathCard } from './JourneyPathCard';
import { JourneyProgressSidebar } from './JourneyProgressSidebar';
import { LearningJourneyCompanion } from './LearningJourneyCompanion';
import { MobileLearningDesk } from './MobileLearningDesk';
import { TopicExplorer } from './TopicExplorer';
import { Compass, Map, ArrowRight, Sparkles, BookOpen } from 'lucide-react';

interface LearningJourneyViewProps {
  data: LearningJourneyData;
}

export const LearningJourneyView: React.FC<LearningJourneyViewProps> = ({ data }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams?.get('search') || '';
  const initialTab = searchParams?.get('tab') === 'explore' || Boolean(initialSearch) ? 'explore' : 'journey';
  const [activeTab, setActiveTab] = useState<'journey' | 'explore'>(initialTab);

  React.useEffect(() => {
    if (initialSearch) setActiveTab('explore');
  }, [initialSearch]);

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#FAF8F5] text-slate-900 flex flex-col md:flex-row overflow-x-hidden selection:bg-[#0F5132] selection:text-white">
      {/* 1. Desktop Left Sidebar (>= 768px) */}
      <HomeDesktopSidebar />

      {/* 2. Main Content Canvas */}
      <div className="flex-1 min-h-0 flex flex-col min-w-0">
        {/* Top Bar with Search, Notifications, Avatar */}
        <LearningJourneyTopBar learnerName={data.learnerName} />

        {/* Scrollable Page Body */}
        <main className="flex-1 min-h-0 flex flex-col justify-start overflow-y-auto px-2.5 sm:px-6 md:px-8 lg:px-10 py-2 sm:py-4 md:py-6 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-12 max-w-[1440px] w-full mx-auto box-border">
          {/* Main Hero Landscape Banner with Signpost */}
          <LearningJourneyHero learnerName={data.learnerName} />

          {/* Mode Switcher Tabs: My Journey vs. Explore Topics */}
          <div className="flex items-center justify-between gap-2 mb-3 sm:mb-5">
            <div className="inline-flex p-1 rounded-2xl bg-[#EFECE4] border border-[#E0DBCF] shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTab('journey')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-sans font-bold transition-all cursor-pointer ${
                  activeTab === 'journey'
                    ? 'bg-white text-[#0F5132] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Map className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0F5132]" />
                <span>My Learning Journey</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('explore')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-sans font-bold transition-all cursor-pointer ${
                  activeTab === 'explore'
                    ? 'bg-[#0F5132] text-white shadow-sm shadow-[#0F5132]/30'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Explore Topics</span>
                <span className="hidden xs:inline-block px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-white/20 text-current">
                  8 Subjects
                </span>
              </button>
            </div>

            {/* Quick Context Pill */}
            <div className="hidden sm:flex items-center gap-2 text-xs font-sans text-slate-600 bg-white/80 border border-[#EBE7DF] px-3 py-1.5 rounded-xl shadow-2xs">
              <span className="font-semibold text-slate-800">Current:</span>
              <span className="text-[#0F5132] font-bold truncate max-w-[200px]">{data.currentLesson.title}</span>
              <span className="text-slate-400">•</span>
              <span className="font-mono text-slate-500">{data.subject.progressPercentage}% complete</span>
            </div>
          </div>

          {/* VIEW TAB 1: ACTIVE JOURNEY PATHWAY */}
          {activeTab === 'journey' && (
            <>
              {/* Core Content Grid: Path Card (Left) + Sidebar (Right) */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-2 sm:gap-6 items-start">
                {/* Left/Center: The Complete Journey Path & Current Lesson */}
                <div className="xl:col-span-8 w-full space-y-4">
                  <JourneyPathCard
                    data={data}
                    onExploreTopics={() => setActiveTab('explore')}
                  />

                  {/* Topic Explorer Launcher Banner */}
                  <div className="w-full rounded-2xl bg-gradient-to-r from-[#EBF5EE] via-white to-[#F9F7F2] border border-[#C5E6D2] p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#0F5132]">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Ready to explore other subjects?</span>
                      </div>
                      <h4 className="font-serif font-black text-sm sm:text-base text-slate-900">
                        Explore Topics across 8 Disciplines
                      </h4>
                      <p className="font-sans text-xs text-slate-600">
                        Choose from Mathematics, Chemistry, Biology, Code, Data Science, English, or History topics.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('explore')}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F5132] hover:bg-[#0B3D26] text-white font-sans font-bold text-xs sm:text-sm shadow-sm transition-transform active:scale-95 cursor-pointer shrink-0"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Choose a Topic</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Right: Progress, Focus, Passports, World (Desktop only) */}
                <div className="hidden md:block xl:col-span-4 w-full space-y-3 sm:space-y-5">
                  <JourneyProgressSidebar data={data} />
                </div>
              </div>

              {/* Mobile Only: Learning Desk / Explorer Desk */}
              <div className="block md:hidden w-full mt-2.5">
                <MobileLearningDesk data={data} />
              </div>

              {/* Lower Section: Large Buddy Companion (Desktop only) */}
              <div className="hidden md:block mt-6">
                <LearningJourneyCompanion />
              </div>
            </>
          )}

          {/* VIEW TAB 2: EXPLORE TOPICS & SUBJECTS LAUNCHER */}
          {activeTab === 'explore' && (
            <div className="w-full space-y-4">
              {/* Current Progress Snapshot Strip */}
              <div className="w-full rounded-2xl bg-white border border-[#EBE7DF] p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#E8F5EE] text-[#0F5132] flex items-center justify-center font-bold text-sm shrink-0">
                    3
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                      Currently In Progress
                    </div>
                    <div className="font-serif font-black text-sm text-slate-900">
                      {data.currentLesson.title}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('journey')}
                    className="px-3.5 py-1.5 rounded-xl border border-[#EBE7DF] bg-[#FAF8F5] hover:bg-[#F2EFE9] text-slate-700 text-xs font-sans font-semibold cursor-pointer"
                  >
                    View Map Pathway
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push(`/class?concept=${data.currentLesson.conceptId}`)}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#0F5132] hover:bg-[#0B3D26] text-white text-xs font-sans font-bold shadow-xs cursor-pointer"
                  >
                    <span>Resume Lesson</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Comprehensive Topic Explorer */}
              <TopicExplorer currentConceptId={data.currentLesson.conceptId} initialSearch={initialSearch} />
            </div>
          )}
        </main>
      </div>

      {/* 3. Mobile Bottom Navigation Bar (< 768px) */}
      <HomeMobileBottomNav />
    </div>
  );
};

export default LearningJourneyView;

