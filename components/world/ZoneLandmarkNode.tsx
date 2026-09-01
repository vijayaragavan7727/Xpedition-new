'use client';

import React from 'react';
import { LearningZone } from '@/lib/engine/gameWorldAdapter';
import { Lock, Sparkles, CheckCircle2 } from 'lucide-react';

interface ZoneLandmarkNodeProps {
  zone: LearningZone;
  isSelected?: boolean;
  onClick: () => void;
}

export default function ZoneLandmarkNode({
  zone,
  isSelected = false,
  onClick,
}: ZoneLandmarkNodeProps) {
  const isLocked = zone.status === 'locked';
  const isMastered = zone.status === 'mastered' || zone.masteryPercent >= 80;

  const renderLandmarkSilhouette = () => {
    switch (zone.type) {
      // 1. LEARNING CAMP: Timber starter lodge, stone chimney, campfire, tents
      case 'learning_camp':
        return (
          <div className="relative w-28 h-24 flex flex-col items-center justify-end">
            {/* Campfire with flame */}
            <div className="absolute -left-3 bottom-1 flex flex-col items-center">
              <div className="w-5 h-5 rounded-full bg-amber-950 border border-amber-700 flex items-center justify-center">
                <span className="text-[11px] animate-bounce">🔥</span>
              </div>
            </div>

            {/* Starter Tent */}
            <div className="absolute -right-3 bottom-1 w-6 h-6 bg-emerald-800 border border-emerald-600 rounded-t-lg rotate-12 shadow-sm flex items-center justify-center">
              <span className="text-[10px]">⛺</span>
            </div>

            {/* Main Timber Lodge */}
            <div className="relative w-22 h-16 bg-[#5C3A21] rounded-t-xl border-2 border-[#3D2312] shadow-xl flex flex-col items-center justify-between p-1">
              {/* Roof */}
              <div className="absolute -top-3 inset-x-0 h-5 bg-[#78350F] rounded-t-xl border-t border-amber-500 shadow-md flex justify-between px-2">
                <span className="w-1.5 h-3 bg-slate-700 -mt-2 rounded-t-sm" />
              </div>
              {/* Door & Window */}
              <div className="w-full flex justify-around items-end mt-4">
                <div className="w-3 h-3 bg-amber-300 rounded-sm border border-amber-700 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                <div className="w-4 h-6 bg-[#271406] rounded-t-md border-t border-amber-800" />
                <div className="w-3 h-3 bg-amber-300 rounded-sm border border-amber-700 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
              </div>
            </div>
          </div>
        );

      // 2. SKILL DISTRICT: Grand library academy, copper dome, astrolabe
      case 'skill_district':
        return (
          <div className="relative w-28 h-26 flex flex-col items-center justify-end">
            {/* Celestial Astrolabe Ring */}
            <div className="absolute top-0 w-8 h-8 rounded-full border-2 border-cyan-400 border-dashed animate-spin-slow flex items-center justify-center">
              <span className="text-xs">✨</span>
            </div>

            {/* Observatory Copper Dome */}
            <div className="w-12 h-6 bg-gradient-to-t from-cyan-800 to-cyan-400 rounded-t-full border-t-2 border-cyan-300 shadow-lg -mb-1" />

            {/* Academy Classical Archive Keep */}
            <div className="w-24 h-16 bg-[#1E293B] rounded-t-lg border-2 border-cyan-600 shadow-2xl flex flex-col justify-between p-1.5">
              <div className="w-full flex justify-around">
                <span className="w-2 h-8 bg-slate-400 rounded-t-sm" />
                <span className="w-2 h-8 bg-slate-400 rounded-t-sm" />
                <span className="w-2 h-8 bg-slate-400 rounded-t-sm" />
              </div>
              <div className="w-6 h-5 bg-cyan-950 mx-auto rounded-t-md border border-cyan-500 flex items-center justify-center">
                <span className="text-[10px]">📖</span>
              </div>
            </div>
          </div>
        );

      // 3. CHALLENGE ARENA: Battle Colosseum, crossed broadswords, war torches
      case 'challenge_arena':
        return (
          <div className="relative w-28 h-24 flex flex-col items-center justify-end">
            {/* Crossed Broadswords Crest */}
            <div className="absolute -top-3 w-7 h-7 rounded-full bg-red-950 border border-red-500 flex items-center justify-center shadow-lg">
              <span className="text-xs animate-pulse">⚔️</span>
            </div>

            {/* Colosseum Stone Battle Ring */}
            <div className="relative w-26 h-16 rounded-full bg-[#7F1D1D] border-4 border-[#991B1B] shadow-[0_8px_20px_rgba(185,28,28,0.5)] flex flex-col items-center justify-center overflow-hidden">
              <div className="w-20 h-10 rounded-full bg-[#D97706]/40 border border-amber-500/50 flex items-center justify-center">
                <span className="text-[10px] font-mono font-bold text-amber-200">ARENA</span>
              </div>
            </div>
          </div>
        );

      // 4. PROJECT VALLEY: River watermill, crafting forge, smoking anvil chimney
      case 'project_valley':
        return (
          <div className="relative w-28 h-24 flex flex-col items-center justify-end">
            {/* Watermill Rotating Wheel on Left */}
            <div className="absolute -left-3 bottom-0 w-8 h-8 rounded-full border-2 border-amber-700 border-dashed animate-spin-slow bg-amber-900/60 flex items-center justify-center">
              <span className="text-[9px]">⚙️</span>
            </div>

            {/* Smoking Chimney */}
            <div className="absolute -top-2 right-4 w-3 h-6 bg-slate-700 border border-slate-500 rounded-t-sm flex flex-col items-center">
              <span className="text-[9px] animate-bounce -mt-2">💨</span>
            </div>

            {/* Workshop & Anvil Forge */}
            <div className="w-22 h-16 bg-[#78350F] rounded-t-lg border-2 border-amber-600 shadow-xl flex flex-col items-center justify-between p-1.5">
              <div className="w-full h-3 bg-amber-900 rounded-t-sm" />
              <div className="flex items-center gap-2">
                <span className="text-xs">🔨</span>
                <span className="text-[10px] font-mono font-bold text-amber-300">FORGE</span>
              </div>
            </div>
          </div>
        );

      // 5. CAREER CITY: Gilded sky spires, satellite relay, glowing portal
      case 'career_city':
      default:
        return (
          <div className="relative w-28 h-28 flex flex-col items-center justify-end">
            {/* Satellite Relay Antenna */}
            <div className="absolute top-0 w-8 h-8 rounded-full border border-purple-400 flex items-center justify-center animate-pulse">
              <span className="text-xs">📡</span>
            </div>

            {/* High-Rise Spire Towers */}
            <div className="w-24 h-20 bg-gradient-to-t from-slate-900 via-indigo-950 to-purple-900 rounded-t-xl border-2 border-purple-500 shadow-[0_10px_30px_rgba(168,85,247,0.4)] flex justify-around items-end p-2">
              <div className="w-4 h-14 bg-purple-950 border border-purple-400 rounded-t-sm" />
              <div className="w-6 h-16 bg-purple-900 border border-purple-300 rounded-t-sm flex flex-col items-center justify-around">
                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
                <span className="text-[9px]">🚀</span>
              </div>
              <div className="w-4 h-12 bg-purple-950 border border-purple-400 rounded-t-sm" />
            </div>
          </div>
        );
    }
  };

  return (
    <div
      style={{
        left: `${zone.gridX}%`,
        top: `${zone.gridY}%`,
      }}
      className="absolute -translate-x-1/2 -translate-y-1/2 z-20 select-none cursor-pointer group flex flex-col items-center"
      onClick={onClick}
    >
      {/* Ground Cast Shadow */}
      <div className="w-28 h-7 bg-black/50 rounded-full blur-[4px] -mb-4 pointer-events-none" />

      {/* Landmark Visual Structure */}
      <div
        className={`relative transition-all duration-300 group-hover:scale-105 group-active:scale-95 ${
          isSelected ? 'scale-110 drop-shadow-[0_0_20px_rgba(56,189,248,0.9)]' : ''
        } ${isLocked ? 'grayscale opacity-75' : ''}`}
      >
        {renderLandmarkSilhouette()}

        {/* Lock Overlay if Locked */}
        {isLocked && (
          <div className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center backdrop-blur-[1px]">
            <Lock className="w-6 h-6 text-red-400 animate-bounce" />
          </div>
        )}
      </div>

      {/* Zone Floating Info Tag */}
      <div
        className="mt-1 px-2.5 py-1 rounded-xl border backdrop-blur-md shadow-lg flex items-center gap-1.5 transition-all"
        style={{
          backgroundColor: '#0F172AEE',
          borderColor: isSelected ? zone.accentColor : 'rgba(255,255,255,0.15)',
        }}
      >
        <span className="text-xs">{zone.icon}</span>
        <div className="flex flex-col">
          <span className="font-sans font-bold text-[11px] text-white leading-tight">
            {zone.name}
          </span>
          <span className="font-mono text-[9px] font-bold" style={{ color: zone.accentColor }}>
            {zone.tierName} &middot; Lv.{zone.level}
          </span>
        </div>
      </div>
    </div>
  );
}
