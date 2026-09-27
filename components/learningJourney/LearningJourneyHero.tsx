'use client';

import React from 'react';
import Image from 'next/image';

interface LearningJourneyHeroProps {
  learnerName: string;
}

export const LearningJourneyHero: React.FC<LearningJourneyHeroProps> = ({ learnerName }) => {
  return (
    <div className="relative w-full overflow-hidden mb-1.5 sm:mb-5 select-none rounded-xl sm:rounded-3xl bg-[#FAF8F5]">
      {/* Mobile (< 640px): the same live composition, compact (the learner's own name,
          not a picture with a name painted into it). */}
      <div className="sm:hidden relative w-full h-[108px] xs:h-[114px] rounded-xl overflow-hidden border border-[#EBE7DF]/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <Image
          src="/images/learning-journey/learning-journey-bg.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_35%] opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#FAF8F5]/95 via-[#FAF8F5]/80 to-transparent" />
        <div className="absolute bottom-0 right-2 w-16 h-[84px] pointer-events-none">
          <Image src="/images/learning-journey/buddy-wave.png" alt="" fill sizes="64px" className="object-contain object-bottom" />
        </div>
        <div className="absolute inset-0 flex flex-col justify-center pl-3.5 pr-20">
          <p className="font-sans font-bold text-[11px] text-[#0F5132] flex items-center gap-1.5 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0F5132] shrink-0" />
            <span className="truncate">Welcome back, {learnerName || 'Learner'}!</span>
          </p>
          <h1 className="font-serif font-black text-[19px] xs:text-[21px] text-[#1F2937] tracking-tight leading-[1.12] mt-0.5">
            Your Learning Journey Continues <span className="text-amber-500 text-base" aria-hidden="true">✨</span>
          </h1>
          <p className="font-sans text-[10.5px] text-slate-600 mt-0.5 font-medium truncate">Small steps. Big dreams. One concept at a time.</p>
        </div>
      </div>

      {/* Desktop (>= 640px): Spacious Dynamic Landscape Canvas */}
      <div className="hidden sm:block relative w-full sm:h-[180px] md:h-[220px] rounded-3xl overflow-hidden border border-[#EBE7DF]/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        {/* Soft landscape background */}
        <Image
          src="/images/learning-journey/learning-journey-bg.jpg"
          alt="Learning Journey Landscape"
          fill
          priority
          sizes="(max-width: 1440px) 100vw, 1440px"
          className="object-cover object-center sm:object-[center_35%] opacity-90"
        />

        {/* Natural gradient masks blending into warm ivory background */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#FAF8F5]/80 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#FAF8F5]/95 via-[#FAF8F5]/80 sm:via-[#FAF8F5]/70 to-transparent sm:max-w-2xl" />

        {/* Floating decorative hot-air balloon in sky */}
        <div className="absolute top-4 right-[32%] w-12 h-16 animate-pulse duration-[5000ms] pointer-events-none opacity-85 z-10">
          <Image
            src="/images/home/home-hot-air-balloon.png"
            alt=""
            width={44}
            height={56}
            className="object-contain drop-shadow-2xs"
          />
        </div>

        {/* Buddy companion integrated into the scenic landscape */}
        <div className="absolute bottom-0 right-[124px] md:right-[150px] w-22 md:w-28 h-24 md:h-30 drop-shadow-sm pointer-events-none z-10">
          <Image
            src="/images/learning-journey/buddy-wave.png"
            alt="Buddy Explorer"
            fill
            sizes="112px"
            className="object-contain object-bottom"
          />
        </div>

        {/* Exploration wooden signpost */}
        <div className="absolute bottom-2 right-6 md:right-8 w-26 md:w-32 h-30 md:h-36 drop-shadow-md pointer-events-none z-10">
          <Image
            src="/images/learning-journey/explorer-sign.svg"
            alt="Explore Learn Practice Grow"
            fill
            sizes="128px"
            className="object-contain object-bottom"
          />
        </div>

        {/* Main Hero Typography */}
        <div className="absolute inset-0 flex flex-col justify-center px-7 md:px-10 max-w-xl z-20">
          <p className="font-sans font-bold text-xs md:text-sm text-[#0F5132] tracking-wide mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0F5132] shrink-0" />
            <span className="truncate">Welcome back, {learnerName || 'Learner'}!</span>
          </p>
          <h1 className="font-serif font-black text-2xl md:text-3xl lg:text-4xl text-[#1F2937] tracking-tight leading-[1.15]">
            <span>Your Learning Journey</span>
            <br />
            <span>Continues </span>
            <span className="text-amber-500 inline-block text-xl" aria-hidden="true">✨</span>
          </h1>
          <p className="font-sans text-xs md:text-sm text-slate-600 mt-1 font-medium leading-relaxed">
            Small steps. Big dreams. One concept at a time.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LearningJourneyHero;
