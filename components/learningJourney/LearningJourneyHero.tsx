'use client';

import React from 'react';
import Image from 'next/image';

interface LearningJourneyHeroProps {
  learnerName: string;
}

export const LearningJourneyHero: React.FC<LearningJourneyHeroProps> = ({ learnerName }) => {
  return (
    <div className="relative w-full overflow-hidden mb-1.5 sm:mb-5 select-none rounded-xl sm:rounded-3xl bg-[#FAF8F5]">
      {/* Illustrated Environment Canvas */}
      <div className="relative w-full h-[100px] xs:h-[108px] sm:h-[180px] md:h-[220px] rounded-xl sm:rounded-3xl overflow-hidden border border-[#EBE7DF]/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        {/* Soft landscape background */}
        <Image
          src="/images/learning-journey/learning-journey-bg.jpg"
          alt="Learning Journey Landscape"
          fill
          priority
          sizes="(max-width: 1440px) 100vw, 1440px"
          className="object-cover object-center sm:object-[center_35%] opacity-90"
        />

        {/* Natural gradient masks blending into warm ivory background for pristine text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#FAF8F5]/80 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#FAF8F5]/95 via-[#FAF8F5]/80 sm:via-[#FAF8F5]/70 to-transparent max-w-[70%] sm:max-w-2xl" />

        {/* Floating decorative hot-air balloon in sky */}
        <div className="absolute top-1.5 sm:top-4 right-[25%] sm:right-[32%] w-5 xs:w-6 sm:w-12 h-7 xs:h-8 sm:h-16 animate-pulse duration-[5000ms] pointer-events-none opacity-85 z-10">
          <Image
            src="/images/home/home-hot-air-balloon.png"
            alt=""
            width={44}
            height={56}
            className="object-contain drop-shadow-2xs"
          />
        </div>

        {/* Buddy companion integrated into the scenic landscape */}
        <div className="absolute bottom-0 right-[62px] xs:right-[72px] sm:right-[124px] md:right-[150px] w-12 xs:w-14 sm:w-22 md:w-28 h-13 xs:h-15 sm:h-24 md:h-30 drop-shadow-sm pointer-events-none z-10">
          <Image
            src="/images/learning-journey/buddy-wave.png"
            alt="Buddy Explorer"
            fill
            sizes="112px"
            className="object-contain object-bottom"
          />
        </div>

        {/* Exploration wooden signpost ("EXPLORE LEARN PRACTICE GROW") */}
        <div className="absolute bottom-0.5 sm:bottom-2 right-1.5 xs:right-2 sm:right-6 md:right-8 w-13 xs:w-15 sm:w-26 md:w-32 h-16 xs:h-19 sm:h-30 md:h-36 drop-shadow-md pointer-events-none z-10">
          <Image
            src="/images/learning-journey/explorer-sign.svg"
            alt="Explore Learn Practice Grow"
            fill
            sizes="128px"
            className="object-contain object-bottom"
          />
        </div>

        {/* Main Hero Typography */}
        <div className="absolute inset-0 flex flex-col justify-center px-3 sm:px-7 md:px-10 max-w-[215px] xs:max-w-[245px] sm:max-w-xl z-20">
          <p className="font-sans font-bold text-[9.5px] xs:text-[10px] sm:text-xs md:text-sm text-[#0F5132] tracking-wide mb-0.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0F5132] shrink-0" />
            <span className="truncate">Welcome back, {learnerName || 'Learner'}!</span>
          </p>
          <h1 className="font-serif font-black text-[13px] xs:text-[14.5px] sm:text-2xl md:text-3xl lg:text-4xl text-[#1F2937] tracking-tight leading-[1.15]">
            <span>Your Learning Journey</span>
            <br />
            <span>Continues </span>
            <span className="text-amber-500 inline-block text-xs sm:text-xl" aria-hidden="true">✨</span>
          </h1>
          <p className="font-sans text-[8.5px] xs:text-[9.5px] sm:text-xs md:text-sm text-slate-600 mt-0.5 font-medium leading-tight">
            Small steps. Big dreams. One concept at a time.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LearningJourneyHero;
