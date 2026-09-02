'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlayableGameWorldData, LearningZone } from '@/lib/engine/gameWorldAdapter';
import Link from 'next/link';
import {
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Maximize2,
  X,
  Compass,
  Award,
  ChevronRight,
  Flame,
  Star,
} from 'lucide-react';

interface LivingStrategyWorldProps {
  worldData: PlayableGameWorldData;
}

interface BuildingHotspot {
  id: string;
  name: string;
  level: number;
  type: string;
  // Percentage coordinates on the base map
  x: number; // 0 to 100%
  y: number; // 0 to 100%
  radius: number; // Hit radius in %
  zone: LearningZone;
  defaultAction: string;
  rewardXp: number;
  activityName: string;
}

export default function LivingStrategyWorld({ worldData }: LivingStrategyWorldProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom & Pan state
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMovedRef = useRef<boolean>(false);
  const lastTouchDistRef = useRef<number | null>(null);

  // Selected building for the modal
  const [selectedZone, setSelectedZone] = useState<BuildingHotspot | null>(null);

  const { buildings, zones, mentor } = worldData;

  // Resolve 7 Core Strategy Locations
  const learningCampZone = buildings.knowledgeCore || zones.learningCamp;
  const skillDistrictZone = buildings.courseAcademy || zones.skillDistrict;
  const projectValleyZone = buildings.practiceGrounds || zones.projectValley;
  const challengeArenaZone = buildings.challengeArena || zones.challengeArena;
  const rewardVaultZone = buildings.rewardVault || zones.learningCamp;
  const careerCityZone = buildings.careerHub || zones.careerCity;
  const skillLabZone = buildings.skillLab || zones.skillDistrict;

  // Identify Recommended Target from Adaptive Engine
  const recommendedId = mentor?.recommendedConceptId || learningCampZone.id;

  // 8 Mapped Interactive Building Hotspots corresponding to the actual illustrated game artwork
  const hotspots: BuildingHotspot[] = [
    {
      id: learningCampZone.id,
      name: 'Learning Camp',
      level: learningCampZone.level || 3,
      type: 'learning_camp',
      x: 51,
      y: 24,
      radius: 12,
      zone: learningCampZone,
      defaultAction: 'Enter Camp',
      rewardXp: 80,
      activityName: mentor?.recommendedConceptName || 'Core Fundamentals',
    },
    {
      id: skillLabZone.id,
      name: 'Skill Lab',
      level: skillLabZone.level || 3,
      type: 'skill_lab',
      x: 27,
      y: 9.5,
      radius: 10,
      zone: skillLabZone,
      defaultAction: 'Enter Lab',
      rewardXp: 90,
      activityName: 'Algorithmic Functions & State',
    },
    {
      id: projectValleyZone.id,
      name: 'Project Workshop',
      level: projectValleyZone.level || 3,
      type: 'project_workshop',
      x: 19.5,
      y: 21.5,
      radius: 11,
      zone: projectValleyZone,
      defaultAction: 'Go to Workshop',
      rewardXp: 100,
      activityName: 'Build an Interactive App',
    },
    {
      id: challengeArenaZone.id,
      name: 'Challenge Arena',
      level: challengeArenaZone.level || 3,
      type: 'challenge_arena',
      x: 82.5,
      y: 28.5,
      radius: 12,
      zone: challengeArenaZone,
      defaultAction: 'Enter Arena',
      rewardXp: 120,
      activityName: 'Survivor Duel & Timed Raid',
    },
    {
      id: careerCityZone.id,
      name: 'Career Academy',
      level: careerCityZone.level || 4,
      type: 'career_academy',
      x: 30.5,
      y: 38,
      radius: 13,
      zone: careerCityZone,
      defaultAction: 'Build Your Future',
      rewardXp: 150,
      activityName: 'Industry Mastery & Credentials',
    },
    {
      id: rewardVaultZone.id,
      name: 'Reward Vault',
      level: rewardVaultZone.level || 3,
      type: 'reward_vault',
      x: 62.5,
      y: 39.5,
      radius: 11,
      zone: rewardVaultZone,
      defaultAction: 'Open Vault',
      rewardXp: 75,
      activityName: 'Claim Knowledge Crystals',
    },
    {
      id: 'quarry_node',
      name: 'Quarry Mine',
      level: 2,
      type: 'quarry',
      x: 62.5,
      y: 6.5,
      radius: 9,
      zone: learningCampZone,
      defaultAction: 'Mine Resources',
      rewardXp: 60,
      activityName: 'Stone & Mineral Excavation',
    },
    {
      id: 'lumber_node',
      name: 'Lumber Yard',
      level: 2,
      type: 'lumber_yard',
      x: 87,
      y: 11.5,
      radius: 9,
      zone: projectValleyZone,
      defaultAction: 'Collect Timber',
      rewardXp: 60,
      activityName: 'Wood & Structural Processing',
    },
  ];

  // Auto-fit calculations
  const calculateAutoFit = useCallback(() => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth || window.innerWidth;
    const containerHeight = containerRef.current.clientHeight || window.innerHeight;

    // Available space
    const targetScale = Math.min(containerWidth / 682, 1.25);
    const safeScale = Math.max(0.45, targetScale);

    setZoom(safeScale);
    setPan({
      x: (containerWidth - 682 * safeScale) / 2,
      y: Math.max(0, (containerHeight - 1024 * safeScale) / 4),
    });
  }, []);

  useEffect(() => {
    calculateAutoFit();
    window.addEventListener('resize', calculateAutoFit);
    return () => window.removeEventListener('resize', calculateAutoFit);
  }, [calculateAutoFit]);

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    hasMovedRef.current = false;
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    hasMovedRef.current = true;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Touch Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      hasMovedRef.current = false;
      dragStartRef.current = {
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      };
      lastTouchDistRef.current = null;
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastTouchDistRef.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      hasMovedRef.current = true;
      setPan({
        x: e.touches[0].clientX - dragStartRef.current.x,
        y: e.touches[0].clientY - dragStartRef.current.y,
      });
    } else if (e.touches.length === 2 && lastTouchDistRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / lastTouchDistRef.current;
      lastTouchDistRef.current = dist;
      setZoom((prev) => Math.min(1.5, Math.max(0.42, prev * factor)));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    lastTouchDistRef.current = null;
  };

  const resetToAutoFit = () => calculateAutoFit();

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[100dvh] overflow-hidden select-none bg-[#09110B] font-sans touch-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* 1. TOP STATUS HUD */}
      <header className="absolute top-0 inset-x-0 z-30 h-14 bg-slate-950/80 backdrop-blur-md border-b border-white/[0.08] px-3.5 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center font-mono font-black text-xs text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.5)]">
            {worldData.worldLevel}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-sans font-bold text-xs text-white">
                {worldData.learnerName}
              </span>
              <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-mono text-[9px] font-bold">
                {worldData.worldLevelName}
              </span>
            </div>
            <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
              <span>{worldData.totalXp} XP</span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">{worldData.accuracyRate}% Acc</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Gold Resource */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/90 border border-yellow-500/40 shadow-sm">
            <span className="text-xs">🪙</span>
            <span className="font-mono text-xs font-bold text-yellow-300">
              {worldData.resources?.gold || 1023}
            </span>
          </div>

          {/* Crystals Resource */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/90 border border-purple-500/40 shadow-sm">
            <span className="text-xs">💎</span>
            <span className="font-mono text-xs font-bold text-purple-300">
              {worldData.resources?.crystal || 95}
            </span>
          </div>
        </div>
      </header>

      {/* 2. AUTHENTIC ILLUSTRATED GAME WORLD VIEWPORT */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="relative transition-transform duration-75 ease-out shrink-0 pointer-events-auto"
          style={{
            width: '682px',
            height: '1024px',
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'top left',
          }}
        >
          {/* Base High-Resolution Illustrated Asset Scene */}
          <img
            src="/world/xpedition-world-assets.png"
            alt="Xpedition Strategy Game World"
            className="w-full h-full object-contain pointer-events-none drop-shadow-2xl"
            draggable={false}
          />

          {/* Dynamic Interactive Building Hotspots */}
          {hotspots.map((spot) => {
            const isRec = spot.id === recommendedId;
            return (
              <div
                key={spot.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!hasMovedRef.current) {
                    setSelectedZone(spot);
                  }
                }}
                style={{
                  left: `${spot.x}%`,
                  top: `${spot.y}%`,
                  width: `${spot.radius * 2}%`,
                  height: `${spot.radius * 2}%`,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group flex items-center justify-center"
              >
                {/* Subtle Interactive Hit Ring on Hover */}
                <div className="w-full h-full rounded-full border-2 border-transparent group-hover:border-amber-400/70 group-hover:bg-amber-400/15 group-active:scale-95 transition-all" />

                {/* Adaptive Next Best Action Floating Beacon */}
                {isRec && (
                  <div className="absolute -top-7 z-30 flex flex-col items-center pointer-events-none animate-bounce">
                    <div className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-slate-950 font-mono font-black text-[9px] uppercase tracking-wider shadow-[0_0_15px_rgba(251,191,36,0.95)] border border-white flex items-center gap-1">
                      <Star className="w-3 h-3 fill-slate-950 text-slate-950 animate-spin-slow" />
                      <span>NEXT QUEST</span>
                    </div>
                    <div className="w-2 h-2 bg-amber-400 rotate-45 -mt-1 shadow-md" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. FLOATING CAMERA FIT CONTROL */}
      <div className="fixed bottom-20 right-4 z-30 pointer-events-auto">
        <button
          type="button"
          onClick={resetToAutoFit}
          className="h-10 px-4 rounded-full bg-slate-900/90 border border-amber-400/60 text-amber-300 font-mono text-xs font-bold flex items-center gap-1.5 shadow-[0_8px_20px_rgba(0,0,0,0.85)] backdrop-blur-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Fit View</span>
        </button>
      </div>

      {/* 4. INTERACTIVE BUILDING INSPECTION SHEET (Matches the reference cards) */}
      {selectedZone && (
        <div className="fixed inset-x-3 bottom-18 sm:bottom-6 sm:inset-x-auto sm:right-6 z-50 max-w-sm w-full mx-auto select-none animate-in fade-in slide-in-from-bottom-5">
          <div className="relative p-5 rounded-[22px] bg-[#0A101D]/95 border-2 border-amber-400/80 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.95)] space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-sans font-black text-base text-white uppercase tracking-wide">
                    {selectedZone.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono text-[10px] font-black border border-amber-500/40">
                    Lv.{selectedZone.level}
                  </span>
                </div>
                <p className="font-mono text-xs text-slate-400 mt-0.5">
                  {selectedZone.zone.tagline || 'Interactive Learning Territory'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedZone(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mastery Progress Bar */}
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/90 border border-white/[0.06]">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-slate-400 uppercase font-bold">Territory Mastery</span>
                <span className="font-black text-emerald-400">{selectedZone.zone.masteryPercent || 78}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)] transition-all duration-500"
                  style={{ width: `${selectedZone.zone.masteryPercent || 78}%` }}
                />
              </div>
            </div>

            {/* Next Activity & Reward XP */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.06] space-y-1">
              <span className="font-mono text-[10px] uppercase text-cyan-400 font-bold tracking-wider block">
                NEXT ACTIVITY
              </span>
              <p className="font-sans font-bold text-sm text-white">
                {selectedZone.activityName}
              </p>
              <div className="flex items-center gap-1 font-mono text-xs font-bold text-amber-300 pt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>+{selectedZone.rewardXp} XP Reward</span>
              </div>
            </div>

            {/* Action Launch Button */}
            <Link
              href={selectedZone.zone.actionUrl || '/quest'}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-sans font-black text-sm uppercase flex items-center justify-center gap-2 shadow-[0_8px_25px_rgba(37,99,235,0.6)] active:scale-98 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>{selectedZone.defaultAction}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
