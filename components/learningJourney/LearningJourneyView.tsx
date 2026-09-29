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
import { Map } from 'lucide-react';

interface LearningJourneyViewProps { data: LearningJourneyData; }

export const LearningJourneyView: React.FC<LearningJourneyViewProps> = ({ data }) => (
  <div className="xp-learn-page relative min-h-[100dvh] w-full bg-[#FAF8F5] text-slate-900 flex flex-col md:flex-row overflow-x-hidden selection:bg-[#0F5132] selection:text-white">
    <HomeDesktopSidebar />
    <div className="flex-1 min-h-0 flex flex-col min-w-0">
      <LearningJourneyTopBar learnerName={data.learnerName} />
      <main className="xp-learn-main flex-1 min-h-0 flex flex-col justify-start overflow-visible px-2.5 sm:px-6 md:px-8 lg:px-10 py-2 sm:py-4 md:py-6 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-12 max-w-[1440px] w-full mx-auto box-border">
        <div className="xp-learn-fit w-full">
          <LearningJourneyHero learnerName={data.learnerName} />
          <div className="flex items-center justify-between gap-2 mb-3 sm:mb-5">
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-[#F0F8F2] border border-[#D7E9DC] text-[#0F5132] text-xs sm:text-sm font-bold">
              <Map className="w-4 h-4" />
              <span>Neural Network Learning World</span>
            </div>
            <div className="hidden sm:block text-xs font-semibold text-slate-500">One concept at a time • Full roadmap visible</div>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-2 sm:gap-6 items-start">
            <div className="xl:col-span-8 w-full"><JourneyPathCard data={data} /></div>
            <div className="hidden md:block xl:col-span-4 w-full space-y-3 sm:space-y-5"><JourneyProgressSidebar data={data} /></div>
          </div>
          <div className="block md:hidden w-full mt-2.5"><MobileLearningDesk data={data} /></div>
          <div className="hidden md:block mt-6"><LearningJourneyCompanion /></div>
        </div>
      </main>
    </div>
    <HomeMobileBottomNav />
  </div>
);

export default LearningJourneyView;
