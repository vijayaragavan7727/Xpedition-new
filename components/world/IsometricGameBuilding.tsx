'use client';

import React from 'react';
import { LearningZone } from '@/lib/engine/gameWorldAdapter';
import { Lock, Sparkles, CheckCircle2 } from 'lucide-react';

interface IsometricGameBuildingProps {
  building: LearningZone;
  isSelected?: boolean;
  onClick: () => void;
}

export default function IsometricGameBuilding({
  building,
  isSelected = false,
  onClick,
}: IsometricGameBuildingProps) {
  const isLocked = building.status === 'locked';
  const isMastered = building.status === 'mastered' || building.masteryPercent >= 80;

  const renderBuildingModel = () => {
    switch (building.type) {
      // 1. COMMAND CENTER (Main Base Citadel Keep)
      case 'knowledge_core':
      case 'learning_camp':
      case 'hq':
        return (
          <div className="relative w-28 h-28 flex flex-col items-center justify-end">
            {/* Castle Roof Gables & Banners */}
            <div className="absolute top-1 inset-x-2 h-6 flex justify-between px-1 z-10">
              <div className="w-2.5 h-6 bg-gradient-to-b from-blue-500 to-indigo-700 rounded-b-sm shadow-md border-x border-blue-300 flex items-center justify-center">
                <span className="text-[7px] text-white font-bold">⚜️</span>
              </div>
              <div className="w-4 h-4 bg-amber-400 rounded-full border border-amber-600 shadow-md flex items-center justify-center -mt-1">
                <span className="text-[9px]">👑</span>
              </div>
              <div className="w-2.5 h-6 bg-gradient-to-b from-blue-500 to-indigo-700 rounded-b-sm shadow-md border-x border-blue-300 flex items-center justify-center">
                <span className="text-[7px] text-white font-bold">⚜️</span>
              </div>
            </div>

            {/* Slate Tile Roof */}
            <div className="w-22 h-9 bg-gradient-to-b from-[#334155] to-[#1E293B] rounded-t-xl border-t-2 border-slate-300 shadow-lg flex justify-around items-center px-2">
              <span className="w-1.5 h-3 bg-amber-800 -mt-3 rounded-t-sm" />
            </div>

            {/* Fortress Stone Keep Walls */}
            <div className="w-24 h-16 bg-gradient-to-b from-[#475569] via-[#334155] to-[#1E293B] rounded-b-lg border-2 border-slate-700 shadow-2xl flex flex-col justify-between p-1.5 relative">
              {/* Stone Texture Lines */}
              <div className="absolute inset-x-2 top-2 h-0.5 bg-slate-600/60" />
              <div className="absolute inset-x-2 top-6 h-0.5 bg-slate-600/60" />
              
              {/* Wooden Arched Main Gate & Windows */}
              <div className="w-full flex justify-around items-end mt-auto">
                <div className="w-3.5 h-3.5 bg-amber-300 rounded-sm border border-amber-600 shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse" />
                <div className="w-6 h-8 bg-gradient-to-t from-[#271406] to-[#451A03] rounded-t-md border-t-2 border-amber-600 flex items-center justify-center shadow-inner">
                  <div className="w-1 h-3 bg-amber-400/80 rounded-full" />
                </div>
                <div className="w-3.5 h-3.5 bg-amber-300 rounded-sm border border-amber-600 shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse" />
              </div>
            </div>
          </div>
        );

      // 2. COURSE ACADEMY (Library Citadel)
      case 'course_academy':
      case 'skill_district':
      case 'library':
        return (
          <div className="relative w-26 h-26 flex flex-col items-center justify-end">
            {/* Celestial Astrolabe Rings */}
            <div className="absolute top-0 w-7 h-7 rounded-full border-2 border-cyan-300 border-dashed animate-spin-slow flex items-center justify-center">
              <span className="text-[10px]">✨</span>
            </div>

            {/* Copper Observatory Dome */}
            <div className="w-14 h-7 bg-gradient-to-t from-[#0E7490] to-[#22D3EE] rounded-t-full border-t-2 border-cyan-200 shadow-md -mb-1" />

            {/* Classical Academy Archive Columns */}
            <div className="w-22 h-15 bg-[#1E293B] rounded-t-md border-2 border-cyan-600 shadow-2xl flex flex-col justify-between p-1.5">
              <div className="w-full flex justify-around">
                <span className="w-2 h-7 bg-slate-300 rounded-t-sm shadow-sm" />
                <span className="w-2 h-7 bg-slate-300 rounded-t-sm shadow-sm" />
                <span className="w-2 h-7 bg-slate-300 rounded-t-sm shadow-sm" />
              </div>
              <div className="w-6 h-4 bg-cyan-950 mx-auto rounded-t-sm border border-cyan-400 flex items-center justify-center">
                <span className="text-[9px]">📚</span>
              </div>
            </div>
          </div>
        );

      // 3. SKILL LAB (Alchemical Cauldron Vat)
      case 'skill_lab':
      case 'ai_lab':
      case 'elixir_condenser':
        return (
          <div className="relative w-24 h-26 flex flex-col items-center justify-end">
            {/* Brass Conduit Pipe on Top */}
            <div className="absolute top-1 right-2 w-4 h-6 border-t-2 border-r-2 border-amber-500 rounded-tr-md" />

            {/* Glass Cauldron Container with Bubbling Purple Mana */}
            <div className="relative w-14 h-15 rounded-2xl bg-slate-900/90 border-2 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.7)] overflow-hidden flex flex-col justify-end p-1">
              <div className="w-full h-9 bg-gradient-to-t from-purple-800 to-fuchsia-500 rounded-b-xl flex justify-around items-center">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-purple-200 rounded-full animate-ping" />
                <span className="w-1 h-1 bg-white rounded-full animate-bounce" />
              </div>
            </div>

            {/* Heavy Iron Base Stand */}
            <div className="w-18 h-5 bg-[#334155] rounded-md border border-slate-500 shadow-md flex items-center justify-center -mt-1">
              <span className="text-[8px] font-mono font-black text-purple-300">LAB</span>
            </div>
          </div>
        );

      // 4. ARENA (Challenge Colosseum)
      case 'challenge_arena':
      case 'quest_board':
        return (
          <div className="relative w-26 h-26 flex flex-col items-center justify-end">
            {/* Crossed Broadswords War Banner */}
            <div className="absolute -top-1 w-8 h-8 rounded-full bg-red-950 border-2 border-amber-400 flex items-center justify-center shadow-lg z-10">
              <span className="text-xs animate-pulse">⚔️</span>
            </div>

            {/* Colosseum Stone Ring with Torch Braziers */}
            <div className="relative w-24 h-16 rounded-full bg-[#7F1D1D] border-4 border-[#991B1B] shadow-[0_8px_20px_rgba(185,28,28,0.6)] flex flex-col items-center justify-center overflow-hidden">
              <div className="w-18 h-10 rounded-full bg-[#D97706]/40 border border-amber-400 flex items-center justify-center">
                <span className="text-[9px] font-mono font-black text-amber-200 tracking-wider">ARENA</span>
              </div>
            </div>
          </div>
        );

      // 5. REWARD VAULT (Gold Ingot Storage Crate)
      case 'reward_vault':
      case 'gold_vault':
        return (
          <div className="relative w-24 h-24 flex flex-col items-center justify-end">
            {/* Heaps of Glistening Gold Coins on Top */}
            <div className="w-18 h-8 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 rounded-t-xl border-t-2 border-yellow-200 shadow-lg flex items-center justify-center text-sm">
              🪙🪙🪙
            </div>

            {/* Ironbound Wooden Storage Crate */}
            <div className="w-20 h-12 bg-gradient-to-b from-[#78350F] to-[#451A03] rounded-b-lg border-2 border-slate-600 shadow-xl flex justify-between p-1">
              <span className="w-1.5 h-full bg-slate-700" />
              <div className="w-5 h-5 rounded-full bg-slate-800 border border-amber-400 mx-auto self-center flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
              </div>
              <span className="w-1.5 h-full bg-slate-700" />
            </div>
          </div>
        );

      // 6. PRACTICE FORGE (Workshop with Chimney & Tools)
      case 'practice_grounds':
      case 'project_valley':
      case 'workshop':
        return (
          <div className="relative w-26 h-26 flex flex-col items-center justify-end">
            {/* Stone Chimney with Rising Smoke */}
            <div className="absolute -top-2 right-2 w-3.5 h-7 bg-slate-700 border border-slate-500 rounded-t-sm flex flex-col items-center">
              <span className="text-[9px] animate-bounce -mt-3 text-slate-300">💨</span>
            </div>

            {/* Wooden Planks Roof */}
            <div className="w-22 h-7 bg-[#B45309] rounded-t-lg border-t-2 border-amber-400 shadow-md flex justify-between px-2">
              <span className="text-[9px]">🪓</span>
              <span className="text-[9px]">🔨</span>
            </div>

            {/* Forge Stone Base with Glowing Furnace Anvil */}
            <div className="w-24 h-14 bg-[#78350F] rounded-b-md border-2 border-[#451A03] shadow-xl flex items-center justify-around p-1.5">
              <div className="w-5 h-6 bg-slate-900 rounded-sm border border-amber-500 flex items-center justify-center shadow-[0_0_8px_rgba(245,158,11,0.8)]">
                <span className="text-xs animate-pulse">🔥</span>
              </div>
              <span className="text-[9px] font-mono font-black text-amber-300">FORGE</span>
            </div>
          </div>
        );

      // 7. CAREER HUB (Advanced Industry Spire)
      case 'career_city':
      case 'career_hub':
      default:
        return (
          <div className="relative w-26 h-28 flex flex-col items-center justify-end">
            {/* Satellite Relay Antenna */}
            <div className="absolute top-0 w-7 h-7 rounded-full border border-purple-400 flex items-center justify-center animate-pulse">
              <span className="text-xs">📡</span>
            </div>

            {/* Gilded Sky Towers */}
            <div className="w-22 h-18 bg-gradient-to-t from-slate-900 via-indigo-950 to-purple-900 rounded-t-xl border-2 border-purple-500 shadow-[0_8px_25px_rgba(168,85,247,0.5)] flex justify-around items-end p-1.5">
              <div className="w-3.5 h-12 bg-purple-950 border border-purple-400 rounded-t-sm" />
              <div className="w-5 h-15 bg-purple-900 border border-purple-300 rounded-t-sm flex flex-col items-center justify-around">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                <span className="text-[8px]">🚀</span>
              </div>
              <div className="w-3.5 h-10 bg-purple-950 border border-purple-400 rounded-t-sm" />
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
      {/* 2.5D Soft Ground Cast Shadow */}
      <div className="w-26 h-7 bg-black/55 rounded-full blur-[3px] -mb-3 pointer-events-none transform translate-y-1" />

      {/* Building Structure */}
      <div
        className={`relative transition-transform duration-200 group-hover:scale-105 group-active:scale-95 ${
          isSelected ? 'scale-110 drop-shadow-[0_0_18px_rgba(250,204,21,0.9)]' : ''
        } ${isLocked ? 'grayscale opacity-75' : ''}`}
      >
        {renderBuildingModel()}

        {/* Lock Overlay */}
        {isLocked && (
          <div className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center backdrop-blur-[1px]">
            <Lock className="w-6 h-6 text-red-400 animate-bounce" />
          </div>
        )}
      </div>

      {/* Compact In-Game Label Badge */}
      <div
        className="mt-0.5 px-2 py-0.5 rounded-lg border backdrop-blur-md shadow-md flex items-center gap-1 transition-all"
        style={{
          backgroundColor: '#0F172AEB',
          borderColor: isSelected ? '#FBBF24' : 'rgba(255,255,255,0.18)',
        }}
      >
        <span className="font-sans font-bold text-[10px] text-white leading-none">
          {building.name}
        </span>
        <span className="font-mono text-[9px] font-black text-amber-300 leading-none">
          Lv.{building.level}
        </span>
      </div>
    </div>
  );
}
