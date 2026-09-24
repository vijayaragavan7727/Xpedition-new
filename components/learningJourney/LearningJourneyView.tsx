'use client';

import React from 'react';
import { LearningJourneyData } from '@/lib/learningJourney/learningJourneyModel';
import { HomeDesktopSidebar, HomeMobileBottomNav } from '@/components/home/HomeNavigation';
import { LearningJourneyTopBar } from './LearningJourneyTopBar';
import { LearningJourneyHero } from './LearningJourneyHero';
import { JourneyPathCard } from './JourneyPathCard';
import { JourneyProgressSidebar } from './JourneyProgressSidebar';
import { LearningJourneyCompanion } from './LearningJourneyCompanion';

interface LearningJourneyViewProps {
  data: LearningJourneyData;
}

export const LearningJourneyView: React.FC<LearningJourneyViewProps> = ({ data }) => {
  return (
    <div className="relative min-h-[100dvh] w-full bg-[#FAF8F5] text-slate-900 flex flex-col md:flex-row overflow-x-hidden selection:bg-[#0F5132] selection:text-white">
      {/* 1. Desktop Left Sidebar (>= 768px) */}
      <HomeDesktopSidebar />

      {/* 2. Main Content Canvas */}
      <div className="flex-1 min-h-[100dvh] flex flex-col min-w-0">
        {/* Top Bar with Search, Notifications, Avatar */}
        <LearningJourneyTopBar learnerName={data.learnerName} />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto px-2.5 sm:px-6 md:px-8 lg:px-10 py-2 sm:py-4 md:py-6 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-12 max-w-[1440px] w-full mx-auto box-border">
          {/* Main Hero Landscape Banner with Signpost */}
          <LearningJourneyHero learnerName={data.learnerName} />

          {/* Core Content Grid: Path Card (Left) + Sidebar (Right) */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-3.5 sm:gap-6 items-start">
            {/* Left/Center: The Journey Path & Current Lesson */}
            <div className="xl:col-span-8 w-full space-y-3.5 sm:space-y-6">
              <JourneyPathCard data={data} />
            </div>

            {/* Right: Progress, Focus, Passports, World */}
            <div className="xl:col-span-4 w-full space-y-3 sm:space-y-5">
              <JourneyProgressSidebar data={data} />
            </div>
          </div>

          {/* Lower Section: Buddy Companion with Speech Bubble & Vintage Books */}
          <LearningJourneyCompanion />
        </main>
      </div>

      {/* 3. Mobile Bottom Navigation Bar (< 768px) */}
      <HomeMobileBottomNav />
    </div>
  );
};

export default LearningJourneyView;
