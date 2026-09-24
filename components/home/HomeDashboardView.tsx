'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { HomeDashboardData } from '@/lib/home/homeDashboardModel';
import { ConceptVisual } from './ConceptVisual';
import {
  Search,
  Bell,
  ChevronDown,
  Play,
  ArrowRight,
  Target,
  CheckCircle2,
  Mountain,
  Globe,
  Award,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

interface HomeDashboardViewProps {
  data: HomeDashboardData;
}

export const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({ data }) => {
  const {
    learnerName,
    greetingTitle,
    quoteSubtitle,
    continueLearning,
    nextUp,
    progress,
    todaysFocus,
    passports,
    worldCta,
  } = data;

  // Calculate circular SVG progress values
  const strokeWidth = 8;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress.percentage / 100) * circumference;

  return (
    <div className="w-full space-y-4 lg:space-y-5">
      {/* =========================================================================
          TOP COMPACT HEADER: SEARCH + NOTIFICATIONS + LEARNER PROFILE
          ========================================================================= */}
      <header className="w-full flex items-center justify-between gap-4 select-none pt-0.5">
        {/* Search Bar (Rounded Pill) */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" aria-hidden="true" />
          </div>
          <input
            type="search"
            placeholder="Search anything..."
            className="w-full h-10 pl-10 pr-4 rounded-full bg-[#F0EDE6] border border-[#E5E0D5] text-sm font-sans text-slate-800 placeholder:text-slate-500 focus:outline-none focus:border-[#184E38] focus:ring-1 focus:ring-[#184E38] transition-all"
          />
        </div>

        {/* Right Section: Notifications + User Profile */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <button
            type="button"
            aria-label="Notifications"
            className="relative w-10 h-10 rounded-full bg-white border border-[#EBE7DF] flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {/* Unread indicator */}
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>

          {/* User Profile Pill */}
          <Link
            href="/profile"
            className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-white border border-[#EBE7DF] hover:bg-slate-50 transition-colors shadow-sm"
          >
            <div className="w-8 h-8 rounded-full bg-[#184E38] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-inner">
              {learnerName.charAt(0).toUpperCase()}
            </div>
            <span className="font-sans text-xs font-semibold text-slate-800 hidden sm:inline">
              {learnerName}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </Link>
        </div>
      </header>

      {/* =========================================================================
          HERO SECTION: GREETING + QUOTE + SCENIC LEARNING WORLD LANDSCAPE
          ========================================================================= */}
      <section className="relative w-full rounded-[22px] overflow-hidden bg-gradient-to-r from-[#FAF8F5] via-[#F4F0E8] to-[#EAE4D7] border border-[#EBE7DF] min-h-[140px] sm:min-h-[155px] flex items-center shadow-sm">
        {/* Left Side: Editorial Greeting & Motivational Quote */}
        <div className="relative z-10 p-5 sm:p-6 lg:py-5 lg:px-7 max-w-xl">
          <h1 className="font-['Georgia',serif] text-2xl sm:text-[28px] lg:text-[32px] font-bold text-slate-900 tracking-tight leading-tight">
            {greetingTitle}
          </h1>
          <p className="font-sans text-xs sm:text-sm text-slate-600 font-normal mt-1.5 leading-relaxed max-w-md">
            {quoteSubtitle}
          </p>
        </div>

        {/* Right Side: Seamless Illustrated Scenic Learning Landscape */}
        <div className="absolute right-0 top-0 bottom-0 w-3/5 sm:w-3/5 md:w-1/2 pointer-events-none select-none overflow-hidden">
          <div className="relative w-full h-full">
            <Image
              src="/images/home/home-hero-landscape.jpg"
              alt="Xpedition scenic learning world"
              fill
              priority
              sizes="(max-width: 768px) 60vw, 50vw"
              className="object-cover object-right opacity-60 sm:opacity-100 transition-opacity"
            />
            {/* Soft left gradient fade into warm background */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#FAF8F5] via-[#FAF8F5]/85 to-transparent sm:via-[#FAF8F5]/30" />
          </div>
        </div>
      </section>

      {/* =========================================================================
          LEARNING CARDS ROW: CONTINUE LEARNING (62%) + NEXT UP (38%)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-4.5 items-stretch">
        {/* CARD 1: CONTINUE LEARNING */}
        <div className="lg:col-span-7 bg-white rounded-[20px] p-5 sm:p-5.5 border border-[#EBE7DF] shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-md">
          <div>
            {/* Pill Badge */}
            <span className="inline-block px-3 py-0.5 rounded-full bg-[#E3EBE5] text-[#184E38] font-sans text-xs font-semibold mb-2.5">
              {continueLearning.badgeLabel}
            </span>

            {/* Concept Title */}
            <h2 className="font-['Georgia',serif] text-xl sm:text-[22px] font-bold text-slate-900 leading-snug tracking-tight">
              {continueLearning.title}
            </h2>

            {/* Metadata (Subject · Topic · Duration) */}
            <p className="font-sans text-xs text-slate-500 font-medium mt-1">
              {continueLearning.subject} · {continueLearning.topic} · {continueLearning.durationLabel}
            </p>
          </div>

          <div className="flex items-center justify-between mt-4 pt-1">
            {/* CTA Button: Resume Lesson */}
            <Link
              href={continueLearning.route}
              className="h-10 px-5 rounded-full bg-[#184E38] hover:bg-[#133E2D] active:bg-[#0E2E21] text-white font-sans text-sm font-semibold inline-flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{continueLearning.buttonLabel}</span>
            </Link>

            {/* Concept Visual Asset */}
            <div className="shrink-0 -mr-2 -my-3">
              <ConceptVisual
                conceptId={continueLearning.conceptId}
                title={continueLearning.title}
                subject={continueLearning.subject}
                visualAsset={continueLearning.visualAsset}
                size="medium"
              />
            </div>
          </div>
        </div>

        {/* CARD 2: NEXT UP */}
        <div className="lg:col-span-5 bg-white rounded-[20px] p-5 sm:p-5.5 border border-[#EBE7DF] shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-md">
          <div>
            {/* Pill Badge */}
            <span className="inline-block px-3 py-0.5 rounded-full bg-[#E3EBE5] text-[#184E38] font-sans text-xs font-semibold mb-2.5">
              {nextUp.badgeLabel}
            </span>

            <div className="flex items-start gap-3 mt-0.5">
              {/* U-Shape / Magnet Icon Badge */}
              <div className="w-9 h-9 rounded-full bg-[#184E38] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <span className="font-mono text-sm font-bold">🧲</span>
              </div>

              <div>
                <h3 className="font-['Georgia',serif] text-lg sm:text-[19px] font-bold text-slate-900 leading-snug">
                  {nextUp.title}
                </h3>
                <p className="font-sans text-xs text-slate-500 font-medium mt-0.5">
                  {nextUp.subject} · {nextUp.durationLabel}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-1">
            {/* Start CTA Button */}
            <Link
              href={nextUp.route}
              className="h-10 px-5 rounded-full bg-[#184E38] hover:bg-[#133E2D] active:bg-[#0E2E21] text-white font-sans text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <span>{nextUp.buttonLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {/* Concept Visual Asset */}
            <div className="shrink-0 -mr-2 -my-2">
              <ConceptVisual
                conceptId={nextUp.conceptId}
                title={nextUp.title}
                subject={nextUp.subject}
                visualAsset={nextUp.visualAsset}
                size="small"
              />
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MIDDLE ROW: YOUR PROGRESS (30%) + TODAY'S FOCUS (38%) + YOUR PASSPORTS (32%)
          ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-5 items-stretch">
        {/* CARD 3: YOUR PROGRESS */}
        <div className="lg:col-span-4 bg-white rounded-[20px] p-5 border border-[#EBE7DF] shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <h3 className="font-sans font-bold text-sm sm:text-base text-slate-900">Your Progress</h3>

          <div className="flex items-center gap-5 my-3">
            {/* Circular Progress Indicator */}
            <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 88 88">
                {/* Track Circle */}
                <circle
                  cx="44"
                  cy="44"
                  r={radius}
                  stroke="#E8ECE9"
                  strokeWidth={strokeWidth}
                  fill="none"
                />
                {/* Progress Fill Arc */}
                <circle
                  cx="44"
                  cy="44"
                  r={radius}
                  stroke="#184E38"
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-sans font-bold text-lg text-slate-900">
                {progress.percentage}%
              </div>
            </div>

            {/* Level & Rank Details */}
            <div className="space-y-1">
              <span className="font-sans text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Level {progress.level}
              </span>
              <div className="flex items-center gap-1.5 font-sans font-bold text-sm text-slate-900">
                <Mountain className="w-4 h-4 text-[#184E38]" />
                <span>{progress.levelTitle}</span>
              </div>
              <div className="pt-1.5 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-sans font-medium text-slate-600">
                  <span>XP: {progress.currentXp.toLocaleString()} / {progress.targetXp.toLocaleString()}</span>
                </div>
                <div className="w-28 h-1.5 bg-[#E8ECE9] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#184E38] rounded-full"
                    style={{ width: `${Math.min(100, Math.round((progress.currentXp / progress.targetXp) * 100))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 4: TODAY'S FOCUS */}
        <div className="lg:col-span-4 bg-white rounded-[20px] p-5 border border-[#EBE7DF] shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <Target className="w-4 h-4 text-[#184E38]" />
              <h3 className="font-sans font-bold text-sm sm:text-base text-slate-900">Today&apos;s Focus</h3>
            </div>

            {/* Checklist */}
            <div className="space-y-2">
              {todaysFocus.map((item) => (
                <div key={item.id} className="flex items-center gap-2.5 text-left">
                  <div className="w-4 h-4 rounded-full bg-[#184E38] text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-sans text-xs text-slate-700 font-medium">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Decorative Sticky Note ("Small steps Big dreams") */}
          <div className="absolute -bottom-2 right-2 w-28 h-28 pointer-events-none select-none rotate-2">
            <div className="w-full h-full bg-[#FDF8E7] rounded-md shadow-sm border border-[#EFE5C6] p-2.5 flex flex-col justify-center items-center text-center">
              <span className="font-caveat font-bold text-[15px] text-amber-900 leading-tight">
                Small steps <br /> Big dreams
              </span>
              <span className="text-[10px] text-amber-700 mt-1">✦</span>
            </div>
          </div>
        </div>

        {/* CARD 5: YOUR PASSPORTS */}
        <div className="lg:col-span-4 bg-white rounded-[20px] p-5 border border-[#EBE7DF] shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-sans font-bold text-sm sm:text-base text-slate-900">Your Passports</h3>
                <p className="font-sans text-[11px] text-slate-500 mt-0.5">
                  Track your skills. Build your future.
                </p>
              </div>
              <Link href="/passport" className="text-slate-400 hover:text-slate-600 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Passport Book Item */}
            <div className="mt-3.5 p-2.5 sm:p-3 rounded-xl bg-[#FAF8F5] border border-[#EBE7DF] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* Green Passport Cover Book */}
                <div className="w-10 h-14 rounded bg-[#184E38] border border-[#133E2D] p-1 flex flex-col items-center justify-between text-white shadow-sm shrink-0">
                  <span className="text-[7px] font-mono tracking-tighter">✦</span>
                  <Award className="w-4 h-4" />
                  <span className="text-[6px] font-sans font-bold uppercase tracking-wider">Pass</span>
                </div>

                <div>
                  <div className="font-sans font-bold text-sm text-slate-900">
                    {passports.subjectTitle}
                  </div>
                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-[#E3EBE5] text-[#184E38] font-sans text-[10px] font-semibold">
                    {passports.statusBadge}
                  </span>
                </div>
              </div>

              <Link
                href={passports.route}
                className="px-3 py-1.5 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-sans text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
              >
                View Passport
              </Link>
            </div>
          </div>

          {/* Carousel Pagination Dots */}
          <div className="flex items-center justify-center gap-1.5 pt-2.5">
            <span className="w-2 h-2 rounded-full bg-[#184E38]" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          </div>
        </div>
      </div>

      {/* =========================================================================
          BOTTOM BANNER: EXPLORE THE WORLD (PIXEL-PERFECT ASSET ON DESKTOP, RESPONSIVE ON MOBILE)
          ========================================================================= */}
      <section className="relative w-full rounded-[20px] overflow-hidden border border-[#EBE7DF] shadow-sm hover:shadow-md transition-shadow mb-2 md:mb-0">
        {/* Desktop / Tablet View (>= 768px): Display complete supplied asset seamlessly */}
        <Link
          href={worldCta.route}
          className="hidden md:block relative w-full aspect-[11.8/1] min-h-[76px] cursor-pointer"
          aria-label={`${worldCta.title}: ${worldCta.description}. ${worldCta.buttonLabel}`}
        >
          <Image
            src={worldCta.imageAsset}
            alt="Explore the World - Go to World"
            fill
            sizes="(max-width: 1400px) 100vw, 1200px"
            className="object-cover"
            priority
          />
        </Link>

        {/* Mobile View (< 768px): Optimized mobile layout with high-contrast text and 44px+ touch target */}
        <div className="md:hidden relative w-full bg-[#FAF7F2] p-4 flex flex-col items-start gap-3 overflow-hidden">
          {/* Subtle scenic mountain artwork on the far left edge only */}
          <div className="absolute inset-y-0 left-0 w-24 pointer-events-none select-none overflow-hidden opacity-40">
            <Image
              src={worldCta.imageAsset}
              alt=""
              fill
              className="object-cover object-left"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#FAF7F2]" />
          </div>

          <div className="relative z-10">
            <h3 className="font-['Georgia',serif] text-base font-bold text-[#184E38]">
              {worldCta.title}
            </h3>
            <p className="font-sans text-xs text-slate-600 mt-0.5">
              {worldCta.description}
            </p>
          </div>

          <Link
            href={worldCta.route}
            className="relative z-10 w-full min-h-[44px] px-5 rounded-full bg-[#184E38] hover:bg-[#133E2D] active:bg-[#0E2E21] text-white font-sans text-xs font-semibold inline-flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <Globe className="w-4 h-4" />
            <span>{worldCta.buttonLabel}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
};
