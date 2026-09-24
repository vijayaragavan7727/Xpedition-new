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
      className="relative w-full rounded-xl sm:rounded-2xl bg-gradient-to-b from-[#F7F3EA] via-[#FAF7F0] to-[#F1ECE0] border border-[#E5DECD] p-2 xs:p-2.5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] overflow-hidden select-none"
      aria-label="Explorer Learning Desk"
    >
      {/* Subtle Warm Desk Texture & Parchment Runner Border */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#C5A880]/60 to-transparent pointer-events-none" />
      <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-[#E8DEC8]/40 blur-xl pointer-events-none" />

      {/* Main Desk Surface Layout: Buddy (Left) + Physical Study Objects (Right) */}
      <div className="relative flex items-end justify-between gap-1.5 xs:gap-2">
        {/* 1. Buddy Companion + Speech Bubble */}
        <div className="relative flex flex-col items-start shrink-0 z-10">
          {/* Speech Bubble - flows directly above Buddy */}
          <div className="relative mb-0.5 w-26 xs:w-30 h-7 xs:h-8 drop-shadow-2xs transition-transform hover:-translate-y-0.5">
            <Image
              src="/images/learning-journey/buddy-continue-bubble.svg"
              alt="Ready to continue? You're doing great!"
              fill
              sizes="120px"
              className="object-contain object-left-bottom"
            />
          </div>

          {/* 3D Buddy Character Waving (~68-76px visual height) */}
          <div className="relative w-13 xs:w-15 h-16 xs:h-18 drop-shadow-sm">
            <Image
              src="/images/learning-journey/buddy-wave.png"
              alt="Buddy"
              fill
              sizes="64px"
              className="object-contain object-bottom"
            />
            {/* Soft Grounding Desk Shadow */}
            <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-12 xs:w-14 h-1.5 rounded-full bg-slate-900/15 blur-[1px] -z-10" />
          </div>
        </div>

        {/* 2. Physical Study & Explorer Objects (Books, Formula Card, Sticky Note, Compass, Passport, World Postcard) */}
        <div className="flex items-end justify-end gap-1.5 xs:gap-2 flex-1 min-w-0 pb-0.5">
          {/* A. Books Stack + Formula Card Cluster */}
          <div className="relative flex flex-col items-center shrink-0">
            {/* Formula Card resting on top of book stack */}
            <div className="relative z-10 w-9 xs:w-11 h-9 xs:h-11 drop-shadow-2xs transform -rotate-3 hover:rotate-0 transition-transform">
              <Image
                src="/images/learning-journey/formula-card.svg"
                alt="Pythagorean theorem formula card"
                fill
                sizes="44px"
                className="object-contain"
              />
            </div>

            {/* Vintage Stack of Hardcover Books Spines */}
            <div className="flex flex-col items-center drop-shadow-2xs -mt-1 z-0">
              <div className="w-13 xs:w-15 h-2.5 rounded-2xs bg-[#184E38] border border-[#113828] text-white text-[6.5px] font-serif font-bold flex items-center justify-center leading-none">
                Physics
              </div>
              <div className="w-14 xs:w-16 h-2.5 rounded-2xs bg-[#B48332] border border-[#8C6422] text-white text-[6.5px] font-serif font-bold flex items-center justify-center -mt-0.5 leading-none">
                Math
              </div>
              <div className="w-15 xs:w-17 h-2.5 rounded-2xs bg-[#2E5B88] border border-[#1E3F60] text-white text-[6.5px] font-serif font-bold flex items-center justify-center -mt-0.5 leading-none">
                Science
              </div>
            </div>
          </div>

          {/* B. Sticky Note */}
          <div className="relative w-10 xs:w-12 h-10 xs:h-12 drop-shadow-2xs transform rotate-2 hover:rotate-0 transition-transform shrink-0">
            <Image
              src="/images/learning-journey/sticky-note.svg"
              alt="Small steps Big dreams"
              fill
              sizes="48px"
              className="object-contain"
            />
          </div>

          {/* C. Brass Explorer Compass */}
          <div className="relative w-7.5 xs:w-9 h-7.5 xs:h-9 drop-shadow-2xs transform -rotate-6 hover:rotate-0 transition-transform shrink-0 mb-1">
            <Image
              src="/images/learning-journey/compass.svg"
              alt="Explorer Compass"
              fill
              sizes="36px"
              className="object-contain"
            />
          </div>

          {/* D. Mini Passport Link */}
          <Link
            href="/passport"
            aria-label="View Physics Passport"
            className="group relative w-8 xs:w-9.5 h-11 xs:h-13 drop-shadow-xs transform rotate-3 hover:scale-105 active:scale-95 transition-transform shrink-0 cursor-pointer"
          >
            <Image
              src="/images/learning-journey/passport-mini.svg"
              alt="Physics Passport"
              fill
              sizes="38px"
              className="object-contain"
            />
          </Link>

          {/* E. World Postcard Link */}
          <Link
            href="/world"
            aria-label="Explore World"
            className="group relative w-12 xs:w-14 h-11 xs:h-13 p-0.5 xs:p-1 rounded-sm bg-white border border-[#E0D9CB] shadow-xs transform -rotate-2 hover:scale-105 active:scale-95 transition-transform flex flex-col justify-between shrink-0 cursor-pointer"
          >
            <div className="relative w-full flex-1 rounded-[1px] overflow-hidden bg-slate-100">
              <Image
                src="/images/learning-journey/world-preview.jpg"
                alt="World Preview"
                fill
                sizes="56px"
                className="object-cover"
              />
            </div>
            <div className="flex items-center justify-between pt-0.5 px-0.5">
              <span className="font-sans font-bold text-[7px] text-slate-700 leading-none">World</span>
              <span className="text-[#0F5132] font-bold text-[7px] leading-none">→</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MobileLearningDesk;
