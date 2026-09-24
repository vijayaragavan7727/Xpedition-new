'use client';

import React from 'react';
import { LearningJourneyData } from '@/lib/learningJourney/learningJourneyModel';
import { HomeDesktopSidebar, HomeMobileBottomNav } from '@/components/home/HomeNavigation';
import { LearningJourneyTopBar } from './LearningJourneyTopBar';
import { LearningJourneyHero } from './LearningJourneyHero';
import { JourneyPathCard } from './JourneyPathCard';
import { JourneyProgressSidebar } from './JourneyProgressSidebar';
import { LearningJourneyCompanion } from './LearningJourneyCompanion';
import { MobileLearningDesk } from './MobileLearningDesk';

interface LearningJourneyViewProps {
  data: LearningJourneyData;
}

export const LearningJourneyView: React.FC<LearningJourneyViewProps> = ({ data }) => {
  return (
    <div className="relative h-[100dvh] md:min-h-[100dvh] md:h-auto w-full bg-[#FAF8F5] text-slate-900 flex flex-col md:flex-row overflow-hidden md:overflow-x-hidden selection:bg-[#0F5132] selection:text-white">
      {/* 1. Desktop Left Sidebar (>= 768px) */}
      <HomeDesktopSidebar />

      {/* 2. Main Content Canvas */}
      <div className="flex-1 h-full min-h-0 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar with Search, Notifications, Avatar */}
        <LearningJourneyTopBar learnerName={data.learnerName} />

        {/* Mobile One-Screen Viewport (< 768px) / Spacious Scrollable Page Body (>= 768px) */}
        <main className="flex-1 min-h-0 flex flex-col justify-start md:justify-start overflow-hidden md:overflow-y-auto px-2 sm:px-6 md:px-8 lg:px-10 py-1.5 sm:py-4 md:py-6 pb-[calc(3.75rem+env(safe-area-inset-bottom,0px))] md:pb-12 max-w-[1440px] w-full mx-auto box-border">
          {/* Main Hero Landscape Banner with Signpost */}
          <LearningJourneyHero learnerName={data.learnerName} />

          {/* Core Content Grid: Path Card (Left) + Sidebar (Right) */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-2 sm:gap-6 items-start">
            {/* Left/Center: The Complete Journey Path & Current Lesson */}
            <div className="xl:col-span-8 w-full">
              <JourneyPathCard data={data} />
            </div>

            {/* Right: Progress, Focus, Passports, World (Desktop only, omitted from mobile one-screen composition) */}
            <div className="hidden md:block xl:col-span-4 w-full space-y-3 sm:space-y-5">
              <JourneyProgressSidebar data={data} />
            </div>
          </div>

          {/* Mobile Only: Learning Desk / Explorer Desk physical study composition */}
          <div className="block md:hidden w-full mt-1.5 xs:mt-2">
            <MobileLearningDesk data={data} />
          </div>

          {/* Lower Section: Large Buddy Companion with Speech Bubble & Vintage Books (Desktop only) */}
          <div className="hidden md:block">
            <LearningJourneyCompanion />
          </div>
        </main>
      </div>

      {/* 3. Mobile Bottom Navigation Bar (< 768px) */}
      <HomeMobileBottomNav />
    </div>
  );
};

export default LearningJourneyView;
