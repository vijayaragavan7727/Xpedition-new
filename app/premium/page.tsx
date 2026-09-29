'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Crown, Compass, Sparkles, X } from 'lucide-react';

const PremiumPage = () => {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#FBFAF3] text-[#163D35]">
      <div className="absolute inset-0">
        <Image
          src="/images/learning-journey/learning-journey-bg.jpg"
          alt=""
          fill
          priority
          className="object-cover object-center opacity-55"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,.96),rgba(255,255,255,.72)_48%,rgba(244,248,231,.86))]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1500px] flex-col px-5 py-7 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between">
          <Link href="/learn" className="inline-flex items-center gap-2 rounded-full border border-[#DCE5D4] bg-white/75 px-4 py-2 text-xs font-bold text-[#164B39] shadow-sm backdrop-blur-md">
            <X className="h-4 w-4" />
            Back to Xpedition
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50/90 px-4 py-2 text-xs font-black text-amber-800 shadow-sm">
            <Crown className="h-4 w-4" />
            Premium
          </div>
        </div>

        <section className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <div className="relative">
            <div className="absolute -inset-8 rounded-full bg-white/70 blur-2xl" />
            <h1 className="relative font-serif text-4xl font-black tracking-tight text-[#16453C] sm:text-6xl lg:text-7xl">
              Unlock Your Next Chapter
            </h1>
          </div>
          <p className="mt-4 max-w-2xl font-sans text-base font-medium leading-relaxed text-[#55706A] sm:text-lg">
            More learning. Smarter guidance. Bigger opportunities.
            <br className="hidden sm:block" />
            With Xpedition Premium, your journey goes further.
          </p>

          <div className="mt-8 grid w-full max-w-[1080px] grid-cols-1 gap-5 lg:grid-cols-2">
            <Link
              href="/experience?mode=career"
              className="group relative min-h-[320px] overflow-hidden rounded-[32px] border border-white/90 bg-white/70 p-7 text-left shadow-[0_20px_60px_rgba(72,95,74,.12)] backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-[#DDEFD9]/70 blur-2xl" />
              <div className="relative flex h-full flex-col">
                <div className="flex items-start justify-between">
                  <div className="rounded-2xl bg-[#EFF8EA] p-3 text-[#34765A]">
                    <Compass className="h-7 w-7" />
                  </div>
                  <span className="rounded-full bg-[#F5F8E9] px-3 py-1 text-[10px] font-black uppercase tracking-[.16em] text-[#55745D]">Premium path</span>
                </div>
                <div className="relative mt-5 h-24">
                  <div className="absolute left-2 top-2 h-16 w-32 -rotate-6 rounded-[20px] bg-gradient-to-br from-[#A9D99E] via-[#D9E9B4] to-[#FFF2C7] shadow-lg" />
                  <div className="absolute left-16 top-0 rounded-2xl bg-white px-3 py-2 text-[10px] font-bold shadow-md">AI</div>
                  <div className="absolute left-28 top-10 rounded-full bg-[#F5B94A] p-2 shadow-md"><Sparkles className="h-4 w-4 text-white" /></div>
                </div>
                <h2 className="mt-2 font-serif text-3xl font-black text-[#16453C]">AI Career Guidance</h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-[#60756F]">
                  Get personalized career paths based on your skills, interests, and learning journey.
                </p>
                <span className="mt-auto inline-flex h-11 w-11 items-center justify-center self-end rounded-full bg-[#E8F4E4] text-[#317155] transition-all group-hover:bg-[#DCEED8] group-hover:translate-x-1">
                  <ArrowRight className="h-5 w-5" />
                </span>
              </div>
            </Link>

            <Link
              href="/xira"
              className="group relative min-h-[320px] overflow-hidden rounded-[32px] border border-white/90 bg-white/70 p-7 text-left shadow-[0_20px_60px_rgba(72,95,74,.12)] backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-[#DFF3E3]/80 blur-2xl" />
              <div className="relative flex h-full flex-col">
                <div className="flex items-start justify-between">
                  <div className="relative h-20 w-24">
                    <Image src="/images/robot.png" alt="Xira" fill sizes="96px" className="object-contain object-left drop-shadow-lg" />
                  </div>
                  <span className="rounded-full bg-[#EDF8EE] px-3 py-1 text-[10px] font-black uppercase tracking-[.16em] text-[#55745D]">AI companion</span>
                </div>
                <div className="mt-2 h-20">
                  <div className="inline-flex items-center gap-2 rounded-2xl border border-[#DCEBDD] bg-white/85 px-4 py-2 shadow-sm">
                    <Sparkles className="h-4 w-4 text-[#4A9A70]" />
                    <span className="text-xs font-bold text-[#39715A]">Always by your side</span>
                  </div>
                </div>
                <h2 className="mt-2 font-serif text-3xl font-black text-[#16453C]">Xira</h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-[#60756F]">
                  Your AI learning companion for explanations, examples, hints, deeper questions, and guided exploration.
                </p>
                <span className="mt-auto inline-flex h-11 w-11 items-center justify-center self-end rounded-full bg-[#E8F4E4] text-[#317155] transition-all group-hover:bg-[#DCEED8] group-hover:translate-x-1">
                  <ArrowRight className="h-5 w-5" />
                </span>
              </div>
            </Link>
          </div>

          <p className="mt-7 text-xs font-semibold text-[#71827D]">
            Premium features unlock progressively as your learning journey grows.
          </p>
        </section>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 h-48 w-72 opacity-80">
        <Image src="/images/home/home-village-house.png" alt="" fill sizes="288px" className="object-contain object-left-bottom" />
      </div>
      <div className="pointer-events-none absolute bottom-2 right-4 hidden h-40 w-52 opacity-75 sm:block">
        <Image src="/images/home/home-village-house.png" alt="" fill sizes="208px" className="object-contain object-right-bottom scale-x-[-1]" />
      </div>
      <div className="pointer-events-none absolute left-8 top-20 h-28 w-20 opacity-70 sm:left-20">
        <Image src="/images/home/home-hot-air-balloon.png" alt="" fill sizes="80px" className="object-contain animate-pulse" />
      </div>
    </main>
  );
};

export default PremiumPage;
