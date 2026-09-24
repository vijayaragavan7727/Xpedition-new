'use client';

import React from 'react';
import Image from 'next/image';

export const LearningJourneyCompanion: React.FC = () => {
  return (
    <div className="relative flex flex-col xs:flex-row items-center xs:items-end justify-between select-none pointer-events-none mt-3 sm:mt-6 pt-3 sm:pt-4 pb-2 gap-3 xs:gap-0">
      {/* 1. Buddy Companion + Speech Bubble + Grounding Shadow */}
      <div className="relative flex flex-col items-center xs:items-start shrink-0">
        {/* Speech Bubble - flows safely above Buddy */}
        <div className="relative mb-1 w-36 xs:w-40 sm:w-48 h-12 xs:h-14 sm:h-18 drop-shadow-sm transition-transform hover:-translate-y-0.5">
          <Image
            src="/images/learning-journey/buddy-continue-bubble.svg"
            alt="Ready to continue? You're doing great!"
            fill
            sizes="(max-width: 640px) 160px, 208px"
            className="object-contain object-bottom xs:object-left-bottom"
          />
        </div>

        {/* 3D Buddy Character Waving (approx 96-144px visual height) */}
        <div className="relative w-20 sm:w-28 md:w-36 h-24 sm:h-32 md:h-40 shrink-0 drop-shadow-md">
          <Image
            src="/images/learning-journey/buddy-wave.png"
            alt="Buddy the AI Learning Partner"
            fill
            sizes="(max-width: 640px) 96px, 144px"
            className="object-contain object-bottom"
          />
          {/* Subtle Grounding Floor Shadow */}
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-20 sm:w-28 h-3 rounded-full bg-slate-800/15 blur-[2px] -z-10" />
        </div>
      </div>

      {/* 2. Vintage Study Table: Hardcover Books, Formula Card, and Brass Compass */}
      <div className="flex items-center xs:items-end gap-2.5 sm:gap-4 md:gap-5 pr-0 sm:pr-4 md:pr-8 z-10 shrink-0">
        {/* Subtle Formula Study Card */}
        <div className="w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20 drop-shadow-sm -rotate-6 transform hover:rotate-0 transition-transform">
          <Image
            src="/images/learning-journey/formula-card.svg"
            alt="Pythagorean theorem formula card"
            width={80}
            height={80}
            className="object-contain"
          />
        </div>

        {/* Brass Compass */}
        <div className="w-8 h-8 sm:w-12 sm:h-12 md:w-14 md:h-14 drop-shadow-sm rotate-12 transform hover:rotate-0 transition-transform">
          <Image
            src="/images/learning-journey/compass.svg"
            alt="Compass"
            width={56}
            height={56}
            className="object-contain"
          />
        </div>

        {/* Vintage Stack of Hardcover Books */}
        <div className="flex flex-col items-center drop-shadow-xs">
          <div className="w-20 sm:w-32 md:w-36 h-3.5 sm:h-5 rounded-sm bg-[#184E38] border border-[#113828] text-white text-[7px] sm:text-[9px] font-serif font-bold flex items-center justify-center shadow-xs">
            Physics
          </div>
          <div className="w-22 sm:w-36 md:w-40 h-3.5 sm:h-5 rounded-sm bg-[#B48332] border border-[#8C6422] text-white text-[7px] sm:text-[9px] font-serif font-bold flex items-center justify-center -mt-0.5 sm:-mt-1 shadow-xs">
            Mathematics
          </div>
          <div className="w-24 sm:w-40 md:w-44 h-4 sm:h-6 rounded-sm bg-[#2E5B88] border border-[#1E3F60] text-white text-[8px] sm:text-[10px] font-serif font-bold flex items-center justify-center -mt-0.5 sm:-mt-1 shadow-sm">
            Science
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningJourneyCompanion;
