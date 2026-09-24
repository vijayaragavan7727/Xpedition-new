'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LearningJourneyData } from '@/lib/learningJourney/learningJourneyModel';
import {
  Award,
  CheckCircle2,
  Circle,
  Globe,
  ArrowRight,
  Mountain,
  Sparkles,
} from 'lucide-react';

interface JourneyProgressSidebarProps {
  data: LearningJourneyData;
}

export const JourneyProgressSidebar: React.FC<JourneyProgressSidebarProps> = ({ data }) => {
  // SVG circular progress calculation for 68%
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (data.progress.percentage / 100) * circumference;

  return (
    <div className="w-full space-y-3 sm:space-y-5 select-none">
      {/* 1. YOUR PROGRESS CARD */}
      <div className="rounded-2xl sm:rounded-3xl bg-white/95 border border-[#EBE7DF] p-3.5 sm:p-5 shadow-xs sm:shadow-sm space-y-2.5 sm:space-y-3.5">
        <h3 className="font-sans font-bold text-xs sm:text-sm text-slate-800 tracking-tight">
          Your Progress
        </h3>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Circular Progress Gauge */}
          <div className="relative w-14 h-14 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
              {/* Background ring */}
              <circle
                cx="40"
                cy="40"
                r={radius}
                className="text-[#EBE7DF]"
                strokeWidth="7"
                stroke="currentColor"
                fill="transparent"
              />
              {/* Foreground progress ring */}
              <circle
                cx="40"
                cy="40"
                r={radius}
                stroke="#0F5132"
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-serif font-black text-sm sm:text-lg text-slate-900 leading-none">
                {data.progress.percentage}%
              </span>
            </div>
          </div>

          {/* Level & XP Details */}
          <div className="space-y-1 sm:space-y-1.5 flex-1 min-w-0">
            <div>
              <span className="text-[10px] sm:text-[11px] font-sans font-semibold text-slate-500 uppercase tracking-wider block">
                Level {data.progress.level}
              </span>
              <p className="font-sans font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5 truncate">
                <Mountain className="w-3.5 h-3.5 text-[#0F5132] shrink-0" />
                <span>{data.progress.levelTitle}</span>
              </p>
            </div>

            {/* XP progress bar */}
            <div className="space-y-1 pt-0.5 sm:pt-1">
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-slate-500">
                <span>XP:</span>
                <span className="font-bold text-slate-700">
                  {data.progress.currentXp.toLocaleString()} / {data.progress.targetXp.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-1 sm:h-1.5 rounded-full bg-[#EAE6DB] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#0F5132]"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((data.progress.currentXp / data.progress.targetXp) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TODAY'S FOCUS & YELLOW STICKY NOTE */}
      <div className="relative rounded-2xl sm:rounded-3xl bg-white/95 border border-[#EBE7DF] p-3.5 sm:p-5 shadow-xs sm:shadow-sm space-y-2 sm:space-y-3">
        <h3 className="font-sans font-bold text-xs sm:text-sm text-slate-800 tracking-tight">
          Today&apos;s Focus
        </h3>

        {/* Checklist */}
        <div className="space-y-2 sm:space-y-2.5 max-w-[70%] sm:max-w-[75%]">
          {data.todayFocus.map((item) => (
            <div key={item.id} className="flex items-start gap-2 sm:gap-2.5 text-[11px] sm:text-xs font-sans">
              {item.isCompleted ? (
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0F5132] shrink-0 mt-0.5" />
              ) : (
                <Circle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0 mt-0.5" />
              )}
              <span
                className={`leading-tight ${
                  item.isCompleted ? 'text-slate-800 font-semibold' : 'text-slate-600'
                }`}
              >
                {item.text}
              </span>
            </div>
          ))}
        </div>

        {/* Pinned Yellow Sticky Note Graphic on top right */}
        <div className="absolute top-2 right-2 w-20 sm:w-28 md:w-32 h-18 sm:h-24 md:h-28 pointer-events-none drop-shadow-sm transition-transform hover:rotate-3">
          <Image
            src="/images/learning-journey/sticky-note.svg"
            alt="Small steps Big dreams"
            fill
            sizes="(max-width: 640px) 80px, 128px"
            className="object-contain"
          />
        </div>
      </div>

      {/* 3. YOUR PASSPORTS PREVIEW */}
      <div className="rounded-2xl sm:rounded-3xl bg-white/90 border border-[#EBE7DF]/80 p-3 sm:p-4 md:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-2 sm:space-y-3">
        <h3 className="font-sans font-bold text-xs sm:text-sm text-slate-800 tracking-tight">
          Your Passports
        </h3>

        <div className="flex items-center justify-between gap-2.5 p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-[#FAF8F5] border border-[#EBE7DF]">
          {/* Passport Booklet Preview Graphic */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="relative w-8 h-11 sm:w-11 sm:h-14 shrink-0 drop-shadow-sm transition-transform hover:scale-105">
              <Image
                src="/images/learning-journey/passport-mini.svg"
                alt="Xpedition Physics Passport"
                width={44}
                height={56}
                className="object-contain"
              />
            </div>

            <div>
              <p className="font-sans font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                {data.passport.subject}
              </p>
              <span className="inline-block mt-0.5 sm:mt-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-[#E8F5EE] text-[#0F5132] text-[9px] sm:text-[10px] font-sans font-semibold">
                {data.passport.status}
              </span>
            </div>
          </div>

          {/* Action Link Button */}
          <Link
            href={data.passport.route}
            className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl border border-[#D5CFBF] hover:bg-[#F0ECE1] text-[11px] sm:text-xs font-sans font-semibold text-slate-700 flex items-center gap-1 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132]"
          >
            <span>View Passport</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Carousel indicators */}
        <div className="flex justify-center gap-1.5 pt-0.5 sm:pt-1">
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#0F5132]" />
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#EAE6DB]" />
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#EAE6DB]" />
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#EAE6DB]" />
        </div>
      </div>

      {/* 4. EXPLORE THE WORLD PREVIEW */}
      <div className="rounded-2xl sm:rounded-3xl bg-white/90 border border-[#EBE7DF]/80 p-3 sm:p-4 md:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-2 sm:space-y-3 relative overflow-hidden">
        {/* Soft landscape background */}
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <Image
            src={data.world.thumbnailSrc}
            alt=""
            fill
            className="object-cover object-center"
          />
        </div>

        <div className="relative z-10 space-y-1.5 sm:space-y-2">
          <h3 className="font-sans font-bold text-xs sm:text-sm text-slate-900 tracking-tight flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0F5132]" />
            <span>{data.world.title}</span>
          </h3>

          <p className="font-sans text-[11px] sm:text-xs text-slate-600 leading-relaxed">
            {data.world.description}
          </p>

          <Link
            href={data.world.route}
            className="w-full h-9 sm:h-10 rounded-xl bg-[#0F5132] hover:bg-[#0B3D26] text-white font-sans font-bold text-xs flex items-center justify-center gap-1.5 sm:gap-2 shadow-xs transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132]"
          >
            <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Go to World →</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default JourneyProgressSidebar;
