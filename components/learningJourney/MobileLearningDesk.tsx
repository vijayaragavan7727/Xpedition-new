'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { LearningJourneyData } from '@/lib/learningJourney/learningJourneyModel';

interface MobileLearningDeskProps {
  data: LearningJourneyData;
}

export const MobileLearningDesk: React.FC<MobileLearningDeskProps> = ({ data }) => {
  return (
    <div
      className="relative w-full rounded-xl sm:rounded-2xl bg-gradient-to-b from-[#EFE6D6] via-[#E8DEC8] to-[#DDD2B8] border border-[#D2C5AB] p-1.5 xs:p-2 shadow-[0_2px_10px_rgba(0,0,0,0.04)] overflow-hidden select-none"
      aria-label="Explorer Learning Desk"
    >
      {/* Warm Tabletop Wood Grain & Soft Sunlight Glow */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#C2A377]/60 to-transparent pointer-events-none" />
      <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-[#E8DCC0]/40 blur-xl pointer-events-none" />
      <div className="absolute top-1 left-1/4 right-1/4 h-[1px] bg-white/20 pointer-events-none" />

      {/* Main Desk Surface: LEFT (Buddy + Bubble + Books) | CENTER (Sticky Note + Compass) | RIGHT (Formula + Passport + World) */}
      <div className="relative flex items-end justify-between gap-1 xs:gap-2">
        {/* 1. LEFT: Buddy Companion + Speech Bubble + Stacked Books Spines */}
        <div className="relative flex items-end gap-1 shrink-0 z-10">
          {/* Buddy + Bubble Cluster */}
          <div className="flex flex-col items-start">
            {/* Speech Bubble */}
            <div className="relative mb-0.5 w-24 xs:w-27 h-6 xs:h-7 drop-shadow-2xs transition-transform hover:-translate-y-0.5">
              <Image
                src="/images/learning-journey/buddy-continue-bubble.svg"
                alt="Ready to continue? You're doing great!"
                fill
                sizes="110px"
                className="object-contain object-left-bottom"
              />
            </div>

            {/* Buddy Character (~52-58px height) */}
            <div className="relative w-11 xs:w-12 h-13 xs:h-14 drop-shadow-sm">
              <Image
                src="/images/learning-journey/buddy-wave.png"
                alt="Buddy Explorer"
                fill
                sizes="56px"
                className="object-contain object-bottom"
              />
              <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-slate-900/20 blur-[1px] -z-10" />
            </div>
          </div>

          {/* Stack of 3 Hardcover Textbooks beside Buddy */}
          <div className="flex flex-col items-center drop-shadow-2xs mb-0.5 pb-0.5">
            <div className="w-11 xs:w-13 h-2 rounded-[2px] bg-[#184E38] border border-[#113828] text-white text-[5.5px] xs:text-[6px] font-serif font-bold flex items-center justify-center leading-none shadow-2xs">
              Physics
            </div>
            <div className="w-12 xs:w-14 h-2 rounded-[2px] bg-[#B48332] border border-[#8C6422] text-white text-[5.5px] xs:text-[6px] font-serif font-bold flex items-center justify-center -mt-0.5 leading-none shadow-2xs">
              Mathematics
            </div>
            <div className="w-13 xs:w-15 h-2.5 rounded-[2px] bg-[#2E5B88] border border-[#1E3F60] text-white text-[6px] xs:text-[6.5px] font-serif font-bold flex items-center justify-center -mt-0.5 leading-none shadow-2xs">
              Science
            </div>
          </div>
        </div>

        {/* 2. CENTER: Sticky Note + Brass Compass */}
        <div className="flex items-end justify-center gap-1 shrink-0 pb-0.5">
          {/* Sticky Note */}
          <div className="relative w-9 xs:w-11 h-9 xs:h-11 drop-shadow-2xs transform rotate-2 hover:rotate-0 transition-transform">
            <Image
              src="/images/learning-journey/sticky-note.svg"
              alt="Small steps Big dreams"
              fill
              sizes="44px"
              className="object-contain"
            />
          </div>

          {/* Compass */}
          <div className="relative w-7 xs:w-8.5 h-7 xs:h-8.5 drop-shadow-2xs transform -rotate-6 hover:rotate-0 transition-transform mb-0.5">
            <Image
              src="/images/learning-journey/compass.svg"
              alt="Compass"
              fill
              sizes="34px"
              className="object-contain"
            />
          </div>
        </div>

        {/* 3. RIGHT: Formula Card + Passport Mini + World Postcard */}
        <div className="flex items-end justify-end gap-1 xs:gap-1.5 shrink-0 pb-0.5">
          {/* Formula Card */}
          <div className="relative w-8 xs:w-9.5 h-8 xs:h-9.5 drop-shadow-2xs transform -rotate-2 hover:rotate-0 transition-transform">
            <Image
              src="/images/learning-journey/formula-card.svg"
              alt="Formula Card a² + b² = c²"
              fill
              sizes="38px"
              className="object-contain"
            />
          </div>

          {/* Passport Mini Link */}
          <Link
            href="/passport"
            aria-label="View Passports"
            className="group relative w-7.5 xs:w-9 h-10 xs:h-11.5 drop-shadow-xs transform rotate-2 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          >
            <Image
              src="/images/learning-journey/passport-mini.svg"
              alt="Xpedition Passport"
              fill
              sizes="36px"
              className="object-contain"
            />
          </Link>

          {/* World Postcard Link */}
          <Link
            href="/world"
            aria-label="Explore World"
            className="group relative w-10.5 xs:w-12 h-10 xs:h-11.5 p-0.5 rounded-xs bg-white border border-[#DDD4C4] shadow-xs transform -rotate-2 hover:scale-105 active:scale-95 transition-transform flex flex-col justify-between cursor-pointer"
          >
            <div className="relative w-full flex-1 rounded-[1px] overflow-hidden bg-slate-100">
              <Image
                src="/images/learning-journey/world-preview.jpg"
                alt="World Preview"
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
            <div className="flex items-center justify-between pt-0.5 px-0.5">
              <span className="font-sans font-bold text-[6.5px] xs:text-[7px] text-slate-700 leading-none">WORLD</span>
              <span className="text-[#0F5132] font-bold text-[6.5px] xs:text-[7px] leading-none">→</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MobileLearningDesk;
