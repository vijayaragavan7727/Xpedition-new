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
      className="relative w-full rounded-xl sm:rounded-2xl overflow-hidden select-none border border-[#D5C9B3] shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-[#EBE2D2]"
      aria-label="Explorer Learning Desk"
    >
      <div className="relative w-full h-[84px] xs:h-[92px]">
        <Image
          src="/images/learning-journey/explorer-desk-exact.png"
          alt="Explorer Learning Desk"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />

        {/* Interactive Link Overlays matching visual positions on desk */}
        {/* Passport Link (right center) */}
        <Link
          href="/passport"
          aria-label="View Passports"
          className="absolute top-1 right-[18%] w-[13%] h-[90%] rounded-md cursor-pointer hover:opacity-90 active:scale-95 transition-transform"
        />

        {/* World Postcard Link (far right) */}
        <Link
          href="/world"
          aria-label="Explore World"
          className="absolute top-1 right-[3%] w-[14%] h-[90%] rounded-md cursor-pointer hover:opacity-90 active:scale-95 transition-transform"
        />
      </div>
    </div>
  );
};

export default MobileLearningDesk;
