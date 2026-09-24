'use client';

import React from 'react';
import Image from 'next/image';

interface LearningJourneyHeroProps {
  learnerName: string;
}

export const LearningJourneyHero: React.FC<LearningJourneyHeroProps> = ({ learnerName }) => {
  return (
    <div className="relative w-full overflow-hidden mb-3 sm:mb-5 select-none rounded-2xl sm:rounded-3xl bg-[#FAF8F5]">
      {/* Illustrated Environment Canvas */}
      <div className="relative w-full h-[148px] sm:h-[180px] md:h-[220px] rounded-2xl sm:rounded-3xl overflow-hidden border border-[#EBE7DF]/70 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        {/* Soft landscape background */}
        <Image
          src="/images/learning-journey/learning-journey-bg.jpg"
          alt="Learning Journey Landscape"
          fill
          priority
          sizes="(max-width: 1440px) 100vw, 1440px"
          className="object-cover object-center sm:object-[center_35%] opacity-90 transition-transform duration-700 hover:scale-[1.01]"
        />

        {/* Natural gradient masks blending into warm ivory background */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#FAF8F5] via-[#FAF8F5]/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#FAF8F5]/95 via-[#FAF8F5]/70 to-transparent sm:max-w-2xl" />

        {/* Floating decorative hot-air balloon in sky */}
        <div className="absolute top-2 sm:top-4 right-[26%] sm:right-[32%] w-8 sm:w-12 h-10 sm:h-16 animate-pulse duration-[5000ms] pointer-events-none opacity-85 hidden xs:block">
          <Image
            src="/images/home/home-hot-air-balloon.png"
            alt=""
            width={44}
            height={56}
            className="object-contain drop-shadow-sm"
          />
        </div>

        {/* Exploration wooden signpost ("EXPLORE LEARN PRACTICE GROW") */}
        <div className="absolute top-1.5 sm:top-3 right-2 sm:right-6 md:right-10 w-20 sm:w-28 md:w-36 h-24 sm:h-32 md:h-40 drop-shadow-md pointer-events-none transition-transform hover:rotate-1">
          <Image
            src="/images/learning-journey/explorer-sign.svg"
            alt="Explore Learn Practice Grow"
            fill
            sizes="(max-width: 640px) 80px, 144px"
            className="object-contain"
          />
        </div>

        {/* Main Hero Typography */}
        <div className="absolute inset-0 flex flex-col justify-center px-4 sm:px-7 md:px-10 max-w-xl z-10">
          <p className="font-sans font-bold text-[11px] sm:text-xs md:text-sm text-[#0F5132] tracking-wide mb-0.5 sm:mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0F5132] animate-ping" />
            <span>Welcome back, {learnerName}!</span>
          </p>
          <h1 className="font-serif font-black text-xl sm:text-2xl md:text-3xl lg:text-4xl text-[#1F2937] tracking-tight leading-tight flex items-center gap-1.5 sm:gap-2">
            <span>Your Learning Journey Continues</span>
            <span className="text-amber-500 inline-block animate-bounce text-lg sm:text-2xl" aria-hidden="true">✨</span>
          </h1>
          <p className="font-sans text-[11px] sm:text-xs md:text-sm text-slate-600 mt-1 font-medium leading-relaxed max-w-[260px] sm:max-w-md">
            Small steps. Big dreams. One concept at a time.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LearningJourneyHero;
