'use client';

import React, { useState } from 'react';
import { PlayableGameWorldData, LearningZone } from '@/lib/engine/gameWorldAdapter';
import WorldHud from './WorldHud';
import ZoneLandmarkNode from './ZoneLandmarkNode';
import ZoneDetailDrawer from './ZoneDetailDrawer';
import WorkerCharacter from './WorkerCharacter';
import Link from 'next/link';
import { Swords, Compass, Sparkles } from 'lucide-react';

interface LivingWorldMapProps {
  worldData: PlayableGameWorldData;
}

export default function LivingWorldMap({ worldData }: LivingWorldMapProps) {
  const [selectedZone, setSelectedZone] = useState<LearningZone | null>(null);

  const { zones } = worldData;

  return (
    <div className="relative w-full h-full min-h-[100dvh] overflow-y-auto overflow-x-hidden bg-[#102416] select-none font-sans flex flex-col items-center">
      {/* 1. TOP STATUS HUD */}
      <WorldHud
        worldData={worldData}
        onOpenTerritoryInfo={() => setSelectedZone(zones.learningCamp)}
      />

      {/* 2. CONTINUOUS ORGANIC GAME TERRITORY (Mobile-Optimized 100% Viewport) */}
      <div className="relative w-full max-w-lg min-h-[920px] pb-24 pt-16 flex flex-col items-center justify-center">
        {/* =================================================================== */}
        {/* A. ORGANIC TERRAIN BACKGROUND: LUSH GRASS, RIVER & FOREST CANOPY */}
        {/* =================================================================== */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#143621] via-[#1B4332] to-[#2D6A4F] overflow-hidden">
          {/* Dual-Tone Organic Lawn Pattern */}
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage: `
                radial-gradient(#52B788 15%, transparent 16%),
                radial-gradient(#40916C 15%, transparent 16%)
              `,
              backgroundSize: '32px 32px',
              backgroundPosition: '0 0, 16px 16px',
            }}
          />

          {/* Left Flowing River with Water Ripples */}
          <div className="absolute top-0 bottom-0 left-0 w-16 bg-gradient-to-r from-[#0284C7] to-[#0F766E] border-r-4 border-[#CA8A04] shadow-inner flex flex-col justify-around items-center opacity-90">
            <div className="w-full h-6 bg-white/20 blur-[1px] animate-pulse" />
            <div className="w-full h-6 bg-white/10 blur-[1px] animate-pulse" />
            <div className="w-full h-6 bg-white/20 blur-[1px] animate-pulse" />
          </div>

          {/* Stone Arch Bridge crossing the river to Project Valley */}
          <div className="absolute top-[32%] left-10 w-12 h-6 bg-[#64748B] rounded-sm border border-slate-400 shadow-md flex items-center justify-center -rotate-12 z-10">
            <span className="text-[8px] font-mono text-white font-bold">BRIDGE</span>
          </div>

          {/* Perimeter Trees & Environment Props */}
          <div className="absolute top-2 left-20 text-xl">🌲🌳</div>
          <div className="absolute top-2 right-6 text-xl">🌴🌲</div>
          <div className="absolute top-[40%] right-3 text-lg">🌳🌲</div>
          <div className="absolute top-[70%] left-20 text-lg">🌲🌿</div>
          <div className="absolute bottom-6 right-8 text-xl">🌳🌲</div>

          {/* =================================================================== */}
          {/* B. WINDING COBBLESTONE ROAD CONNECTING ALL 5 LEARNING ZONES */}
          {/* =================================================================== */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-[#854D0E]/70 fill-none" strokeWidth="20" strokeLinecap="round">
            {/* Road Path from Learning Camp (50, 82) -> Skill District (25, 58) */}
            <path d="M 190 750 Q 140 640 100 530" strokeDasharray="4 6" />
            {/* Road Path from Learning Camp (50, 82) -> Challenge Arena (75, 58) */}
            <path d="M 210 750 Q 250 640 290 530" strokeDasharray="4 6" />
            {/* Road Path from Skill District (25, 58) -> Project Valley (30, 30) */}
            <path d="M 100 530 Q 80 400 120 280" strokeDasharray="4 6" />
            {/* Road Path from Challenge Arena (75, 58) -> Project Valley (30, 30) */}
            <path d="M 290 530 Q 220 400 130 280" strokeDasharray="4 6" />
            {/* Road Path to Career City (50, 14) */}
            <path d="M 120 280 Q 150 180 200 130" strokeDasharray="4 6" />
          </svg>
        </div>

        {/* =================================================================== */}
        {/* C. 5 DATA-DRIVEN LEARNING TERRITORY ZONES */}
        {/* =================================================================== */}

        {/* 1. LEARNING CAMP (South - Basic/Beginner Learning) */}
        <ZoneLandmarkNode
          zone={zones.learningCamp}
          isSelected={selectedZone?.id === zones.learningCamp.id}
          onClick={() => setSelectedZone(zones.learningCamp)}
        />

        {/* 2. SKILL DISTRICT (Mid-West - Modules & Library) */}
        <ZoneLandmarkNode
          zone={zones.skillDistrict}
          isSelected={selectedZone?.id === zones.skillDistrict.id}
          onClick={() => setSelectedZone(zones.skillDistrict)}
        />

        {/* 3. CHALLENGE ARENA (Mid-East - Practice & Solo Raids) */}
        <ZoneLandmarkNode
          zone={zones.challengeArena}
          isSelected={selectedZone?.id === zones.challengeArena.id}
          onClick={() => setSelectedZone(zones.challengeArena)}
        />

        {/* 4. PROJECT VALLEY (North-West - Applied Projects & Works) */}
        <ZoneLandmarkNode
          zone={zones.projectValley}
          isSelected={selectedZone?.id === zones.projectValley.id}
          onClick={() => setSelectedZone(zones.projectValley)}
        />

        {/* 5. CAREER CITY (North-Center - Industry & Careers) */}
        <ZoneLandmarkNode
          zone={zones.careerCity}
          isSelected={selectedZone?.id === zones.careerCity.id}
          onClick={() => setSelectedZone(zones.careerCity)}
        />

        {/* =================================================================== */}
        {/* D. ANIMATED BUILDERS & PARTICLES */}
        {/* =================================================================== */}
        <WorkerCharacter
          startPos={{ x: 50, y: 82 }}
          endPos={{ x: 25, y: 58 }}
          speed={7}
          resource="wood"
          color="#10B981"
          name="Camp Scout"
        />
        <WorkerCharacter
          startPos={{ x: 50, y: 82 }}
          endPos={{ x: 75, y: 58 }}
          speed={8}
          resource="gold"
          color="#EF4444"
          name="Arena Fighter"
        />
        <WorkerCharacter
          startPos={{ x: 25, y: 58 }}
          endPos={{ x: 30, y: 30 }}
          speed={6}
          resource="crystal"
          color="#38BDF8"
          name="Project Engineer"
        />
      </div>

      {/* 3. BOTTOM QUICK ACTION BAR */}
      <div className="fixed bottom-4 inset-x-4 z-30 max-w-lg mx-auto pointer-events-none flex justify-between items-center">
        {/* Start Next Quest Attack */}
        <Link
          href="/quest"
          className="pointer-events-auto h-12 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono font-bold text-xs sm:text-sm flex items-center gap-2 border border-emerald-300 shadow-[0_8px_20px_rgba(16,185,129,0.5)] active:scale-95 transition-all cursor-pointer"
        >
          <Swords className="w-4 h-4 fill-white" />
          <span>START QUEST</span>
        </Link>

        {/* Inspect Camp */}
        <button
          type="button"
          onClick={() => setSelectedZone(zones.learningCamp)}
          className="pointer-events-auto h-12 px-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white font-mono font-bold text-xs sm:text-sm flex items-center gap-2 border border-white/20 shadow-lg active:scale-95 transition-all cursor-pointer backdrop-blur-md"
        >
          <Compass className="w-4 h-4 text-emerald-400" />
          <span>INSPECT ZONES</span>
        </button>
      </div>

      {/* 4. SLIDE-UP ZONE INSPECTION DRAWER */}
      <ZoneDetailDrawer
        zone={selectedZone}
        onClose={() => setSelectedZone(null)}
      />
    </div>
  );
}
