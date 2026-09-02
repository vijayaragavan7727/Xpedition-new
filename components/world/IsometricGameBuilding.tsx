'use client';

import React from 'react';
import { LearningZone } from '@/lib/engine/gameWorldAdapter';
import { Lock, Sparkles, CheckCircle2, Star, Zap } from 'lucide-react';

interface IsometricGameBuildingProps {
  building: LearningZone;
  isSelected?: boolean;
  isRecommended?: boolean;
  onClick: () => void;
}

export default function IsometricGameBuilding({
  building,
  isSelected = false,
  isRecommended = false,
  onClick,
}: IsometricGameBuildingProps) {
  const isLocked = building.status === 'locked';
  const isMastered = building.status === 'mastered' || building.masteryPercent >= 80;

  // Render 2.5D Strategy Game Architecture with Rich Roofs, Gables, Chimneys, and Details
  const renderBuildingGraphic = () => {
    switch (building.type) {
      // 1. LEARNING CAMP / KNOWLEDGE CORE (Pioneer Study Lodge & Campfire)
      case 'learning_camp':
      case 'knowledge_core':
      case 'hq':
        return (
          <div className="relative w-32 h-32 flex flex-col items-center justify-end">
            {/* Knowledge Crystal Floating on Peak */}
            <div className="absolute top-1 z-20 flex items-center justify-center">
              <div className="w-5 h-5 rounded-md bg-cyan-400 rotate-45 border border-white shadow-[0_0_12px_rgba(34,211,238,0.9)] animate-pulse flex items-center justify-center">
                <span className="text-[8px] -rotate-45 font-black text-cyan-950">✦</span>
              </div>
            </div>

            {/* Timber Gabled Roof with Overhang */}
            <div className="relative z-10 w-26 h-12 bg-gradient-to-b from-[#B45309] to-[#78350F] rounded-t-xl border-t-2 border-[#FDE047] shadow-lg flex flex-col justify-between px-2 overflow-hidden">
              <div className="flex justify-between w-full pt-1">
                <span className="w-2 h-4 bg-[#451A03] rounded-t-sm" />
                <span className="w-2 h-4 bg-[#451A03] rounded-t-sm" />
              </div>
              {/* Roof Shingle Lines */}
              <div className="w-full h-0.5 bg-[#451A03]/60 mb-1" />
            </div>

            {/* Solid Log Cabin Base & Warm Lit Porch */}
            <div className="w-28 h-18 bg-gradient-to-b from-[#78350F] via-[#5B2909] to-[#3B1704] rounded-b-xl border-2 border-[#2E1204] shadow-2xl flex flex-col justify-between p-2 relative">
              {/* Wooden Wall Planks */}
              <div className="space-y-1">
                <div className="w-full h-0.5 bg-[#2E1204]/80" />
                <div className="w-full h-0.5 bg-[#2E1204]/80" />
              </div>

              {/* Entrance Gate & Warm Lit Windows */}
              <div className="w-full flex justify-between items-end mt-auto">
                <div className="w-4 h-4 bg-amber-300 rounded-md border border-amber-600 shadow-[0_0_10px_rgba(251,191,36,0.9)] animate-pulse flex items-center justify-center">
                  <span className="text-[7px]">📖</span>
                </div>
                <div className="w-7 h-9 bg-gradient-to-t from-[#1F0E04] to-[#3D1A06] rounded-t-lg border-t-2 border-amber-500 flex items-center justify-center shadow-inner">
                  <div className="w-1.5 h-3.5 bg-amber-400 rounded-full animate-pulse" />
                </div>
                <div className="w-4 h-4 bg-amber-300 rounded-md border border-amber-600 shadow-[0_0_10px_rgba(251,191,36,0.9)] animate-pulse flex items-center justify-center">
                  <span className="text-[7px]">📜</span>
                </div>
              </div>
            </div>
          </div>
        );

      // 2. SKILL DISTRICT (Classical Academy Library & Celestial Astrolabe)
      case 'skill_district':
      case 'course_academy':
      case 'library':
        return (
          <div className="relative w-30 h-30 flex flex-col items-center justify-end">
            {/* Spinning Brass Astrolabe Rings */}
            <div className="absolute top-0 z-20 w-8 h-8 rounded-full border-2 border-cyan-300 border-dashed animate-spin-slow flex items-center justify-center shadow-[0_0_12px_rgba(34,211,238,0.8)]">
              <span className="text-[9px]">🪐</span>
            </div>

            {/* Patina Copper Dome Roof */}
            <div className="w-18 h-9 bg-gradient-to-t from-[#0D9488] via-[#14B8A6] to-[#5EEAD4] rounded-t-full border-t-2 border-cyan-200 shadow-md -mb-1 flex items-center justify-center">
              <span className="w-1 h-3 bg-amber-300 rounded-full" />
            </div>

            {/* Classical Marble Pillars & Archive Halls */}
            <div className="w-26 h-18 bg-gradient-to-b from-[#1E293B] via-[#0F172A] to-[#020617] rounded-b-lg border-2 border-cyan-600 shadow-2xl flex flex-col justify-between p-2">
              <div className="w-full flex justify-around">
                <span className="w-2.5 h-8 bg-gradient-to-b from-slate-200 to-slate-400 rounded-t-sm shadow-sm" />
                <span className="w-2.5 h-8 bg-gradient-to-b from-slate-200 to-slate-400 rounded-t-sm shadow-sm" />
                <span className="w-2.5 h-8 bg-gradient-to-b from-slate-200 to-slate-400 rounded-t-sm shadow-sm" />
              </div>

              {/* Archive Grand Portal */}
              <div className="w-8 h-5 bg-cyan-950 mx-auto rounded-t-md border border-cyan-400 flex items-center justify-center shadow-[0_0_8px_rgba(6,182,212,0.6)]">
                <span className="text-[10px]">📚</span>
              </div>
            </div>
          </div>
        );

      // 3. PROJECT VALLEY (Blacksmith Forge & Timber Mill with Smoke)
      case 'project_valley':
      case 'practice_grounds':
      case 'workshop':
        return (
          <div className="relative w-30 h-30 flex flex-col items-center justify-end">
            {/* Smoking Stone Chimney */}
            <div className="absolute top-1 right-2 z-20 w-4 h-9 bg-gradient-to-b from-slate-600 to-slate-800 border border-slate-500 rounded-t-sm flex flex-col items-center shadow-md">
              <span className="text-[10px] animate-bounce -mt-3.5 text-slate-300">💨</span>
            </div>

            {/* Woodshake Roof */}
            <div className="relative z-10 w-24 h-10 bg-gradient-to-b from-[#9A3412] to-[#7C2D12] rounded-t-xl border-t-2 border-amber-400 shadow-md flex justify-between px-2 pt-1">
              <span className="text-[9px]">⚙️</span>
              <span className="text-[9px]">📐</span>
            </div>

            {/* Forge Base with Anvil & Roaring Hearth */}
            <div className="w-26 h-16 bg-gradient-to-b from-[#78350F] via-[#522504] to-[#2B1102] rounded-b-lg border-2 border-amber-700 shadow-2xl flex items-center justify-around p-2">
              {/* Roaring Forge Pit */}
              <div className="w-6 h-8 bg-slate-950 rounded-md border border-amber-500 flex flex-col items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.9)]">
                <span className="text-xs animate-pulse">🔥</span>
                <span className="text-[7px] text-amber-300 font-bold">FORGE</span>
              </div>

              {/* Worktable Anvil */}
              <div className="flex flex-col items-center">
                <span className="text-sm animate-bounce">🔨</span>
                <span className="text-[8px] font-mono text-amber-200 font-bold">PROJECTS</span>
              </div>
            </div>
          </div>
        );

      // 4. CHALLENGE ARENA (Colosseum Duel Pit & Flaming Braziers)
      case 'challenge_arena':
      case 'quest_board':
        return (
          <div className="relative w-30 h-30 flex flex-col items-center justify-end">
            {/* Crossed Sword Champion Crest */}
            <div className="absolute -top-1 z-20 w-9 h-9 rounded-full bg-gradient-to-br from-red-600 to-red-950 border-2 border-yellow-400 flex items-center justify-center shadow-[0_0_14px_rgba(220,38,38,0.8)]">
              <span className="text-xs animate-pulse">⚔️</span>
            </div>

            {/* Fortified Stone Colosseum Ring */}
            <div className="relative w-28 h-20 rounded-full bg-gradient-to-b from-[#991B1B] via-[#7F1D1D] to-[#450A0A] border-4 border-[#B91C1C] shadow-[0_12px_28px_rgba(153,27,27,0.7)] flex flex-col items-center justify-center overflow-hidden p-1">
              {/* Inner Duel Sand Ring */}
              <div className="w-20 h-12 rounded-full bg-gradient-to-r from-[#D97706]/60 via-[#F59E0B]/50 to-[#D97706]/60 border border-yellow-400/80 flex flex-col items-center justify-center">
                <span className="text-[10px] font-mono font-black text-yellow-200 tracking-widest shadow-sm">
                  ARENA
                </span>
                <span className="text-[7px] font-mono text-yellow-300">RAIDS & DUELS</span>
              </div>
            </div>
          </div>
        );

      // 5. CAREER CITY / SUMMIT SPIRE (Gilded Towers & Academy Crest)
      case 'career_city':
      case 'career_hub':
        return (
          <div className="relative w-30 h-34 flex flex-col items-center justify-end">
            {/* Sky Satellite Relay Dish */}
            <div className="absolute top-0 z-20 w-8 h-8 rounded-full border border-purple-400 bg-purple-950/80 flex items-center justify-center shadow-[0_0_12px_rgba(192,132,252,0.8)]">
              <span className="text-xs animate-pulse">📡</span>
            </div>

            {/* Gilded Sky Citadel Spire */}
            <div className="w-26 h-22 bg-gradient-to-t from-[#0F172A] via-[#1E1B4B] to-[#3B0764] rounded-t-2xl border-2 border-purple-400 shadow-[0_12px_32px_rgba(147,51,234,0.6)] flex justify-around items-end p-2">
              <div className="w-4 h-14 bg-gradient-to-t from-purple-950 to-indigo-900 border border-purple-400 rounded-t-md shadow-sm" />
              <div className="w-6 h-18 bg-gradient-to-t from-purple-900 to-fuchsia-800 border border-purple-300 rounded-t-lg flex flex-col items-center justify-around shadow-md">
                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
                <span className="text-[9px]">👑</span>
                <span className="text-[6px] font-mono font-bold text-white">CAREER</span>
              </div>
              <div className="w-4 h-12 bg-gradient-to-t from-purple-950 to-indigo-900 border border-purple-400 rounded-t-md shadow-sm" />
            </div>
          </div>
        );

      // 6. VAULT / SKILL LAB (Alchemical Lab & Treasure Reserves)
      case 'skill_lab':
      case 'reward_vault':
      case 'gold_vault':
      default:
        return (
          <div className="relative w-28 h-28 flex flex-col items-center justify-end">
            {/* Glowing Gem Pile */}
            <div className="w-20 h-9 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 rounded-t-xl border-t-2 border-yellow-200 shadow-lg flex items-center justify-center text-xs">
              💎🪙💎
            </div>

            {/* Ironbound Stone Vault */}
            <div className="w-22 h-14 bg-gradient-to-b from-[#334155] via-[#1E293B] to-[#0F172A] rounded-b-xl border-2 border-amber-500 shadow-2xl flex items-center justify-around p-1.5">
              <div className="w-6 h-6 rounded-full bg-slate-900 border border-amber-400 flex items-center justify-center shadow-inner">
                <span className="text-[10px]">✨</span>
              </div>
              <span className="text-[9px] font-mono font-black text-amber-300">VAULT</span>
            </div>
          </div>
        );
    }
  };

  return (
    <div
      style={{
        left: `${building.gridX}%`,
        top: `${building.gridY}%`,
      }}
      className="absolute -translate-x-1/2 -translate-y-1/2 z-20 select-none cursor-pointer group flex flex-col items-center"
      onClick={onClick}
    >
      {/* 1. Next Best Learning Action Beacon Spotlight */}
      {isRecommended && !isLocked && (
        <div className="absolute -top-10 z-30 flex flex-col items-center pointer-events-none animate-bounce">
          <div className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-slate-950 font-mono font-black text-[9px] uppercase tracking-wider shadow-[0_0_15px_rgba(251,191,36,0.95)] border border-white flex items-center gap-1">
            <Star className="w-3 h-3 fill-slate-950 text-slate-950 animate-spin-slow" />
            <span>NEXT QUEST</span>
          </div>
          <div className="w-2 h-2 bg-amber-400 rotate-45 -mt-1 shadow-md" />
        </div>
      )}

      {/* 2. Soft Ambient Ground Cast Shadow */}
      <div className="w-28 h-8 bg-black/60 rounded-full blur-[3px] -mb-4 pointer-events-none transform translate-y-1" />

      {/* 3. Handcrafted 2.5D Building Model */}
      <div
        className={`relative transition-all duration-200 group-hover:scale-108 group-active:scale-95 ${
          isSelected ? 'scale-110 drop-shadow-[0_0_20px_rgba(251,191,36,0.9)] ring-2 ring-amber-400/80 rounded-2xl p-1' : ''
        } ${isLocked ? 'grayscale opacity-70' : ''}`}
      >
        {renderBuildingGraphic()}

        {/* Mastered Badge */}
        {isMastered && (
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 border border-white flex items-center justify-center shadow-lg">
            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
          </div>
        )}

        {/* Lock Overlay */}
        {isLocked && (
          <div className="absolute inset-0 bg-black/65 rounded-2xl flex flex-col items-center justify-center backdrop-blur-[1px] p-2 text-center">
            <Lock className="w-6 h-6 text-red-400 animate-bounce" />
            <span className="text-[8px] font-mono font-bold text-red-300 mt-1">LOCKED</span>
          </div>
        )}
      </div>

      {/* 4. Compact Strategy In-Game Label Badge */}
      <div
        className="mt-1 px-2.5 py-0.5 rounded-lg border backdrop-blur-md shadow-lg flex items-center gap-1.5 transition-all"
        style={{
          backgroundColor: isRecommended ? '#F59E0BE6' : '#0F172AEB',
          borderColor: isRecommended ? '#FEF08A' : isSelected ? '#FBBF24' : 'rgba(255,255,255,0.2)',
        }}
      >
        <span
          className={`font-sans font-black text-[10px] tracking-wide uppercase leading-none ${
            isRecommended ? 'text-slate-950' : 'text-white'
          }`}
        >
          {building.name}
        </span>
        <span
          className={`font-mono text-[9px] font-black leading-none ${
            isRecommended ? 'text-slate-900 bg-white/40 px-1 rounded' : 'text-amber-300'
          }`}
        >
          Lv.{building.level}
        </span>
      </div>
    </div>
  );
}
