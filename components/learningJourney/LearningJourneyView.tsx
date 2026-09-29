'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LearningJourneyData } from '@/lib/learningJourney/learningJourneyModel';
import { HomeDesktopSidebar, HomeMobileBottomNav } from '@/components/home/HomeNavigation';
import { LearningJourneyTopBar } from './LearningJourneyTopBar';
import { LearningJourneyHero } from './LearningJourneyHero';
import { JourneyPathCard } from './JourneyPathCard';
import { JourneyProgressSidebar } from './JourneyProgressSidebar';
import { LearningJourneyCompanion } from './LearningJourneyCompanion';
import { MobileLearningDesk } from './MobileLearningDesk';
import { TopicExplorer } from './TopicExplorer';
import { Map } from 'lucide-react';

interface LearningJourneyViewProps {
  data: LearningJourneyData;
}

export const LearningJourneyView: React.FC<LearningJourneyViewProps> = ({ data }) => {
  const router = useRouter();

  return (
    <div className="xp-learn-page relative min-h-[100dvh] w-full bg-[#FAF8F5] text-slate-900 flex flex-col md:flex-row overflow-x-hidden selection:bg-[#0F5132] selection:text-white">
      {/* 1. Desktop Left Sidebar (>= 768px) */}
      <HomeDesktopSidebar />

      {/* 2. Main Content Canvas */}
      <div className="flex-1 min-h-0 flex flex-col min-w-0">
        {/* Top Bar with Search, Notifications, Avatar */}
        <LearningJourneyTopBar learnerName={data.learnerName} />

        {/* Scrollable Page Body */}
        <main className="xp-learn-main flex-1 min-h-0 flex flex-col justify-start overflow-visible px-2.5 sm:px-6 md:px-8 lg:px-10 py-2 sm:py-4 md:py-6 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-12 max-w-[1440px] w-full mx-auto box-border"><div className="xp-learn-fit w-full">
          {/* Main Hero Landscape Banner with Signpost */}
          <LearningJourneyHero learnerName={data.learnerName} />

          {/* Neural Network flagship journey */}
          <div className="flex items-center justify-between gap-2 mb-3 sm:mb-5">
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-[#F0F8F2] border border-[#D7E9DC] text-[#0F5132] text-xs sm:text-sm font-bold">
              <Map className="w-4 h-4" />
              <span>Neural Network Learning World</span>
            </div>
            <div className="hidden sm:block text-xs font-semibold text-slate-500">One concept at a time • Full roadmap visible</div>
          </div>

          {/* VIEW TAB 1: ACTIVE JOURNEY PATHWAY */}
          {activeTab === 'journey' && (
            <>
              {/* Core Content Grid: Path Card (Left) + Sidebar (Right) */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-2 sm:gap-6 items-start">
                {/* Left/Center: The Complete Journey Path & Current Lesson */}
                <div className="xl:col-span-8 w-full space-y-4">
                  <JourneyPathCard data={data} />

div>
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


