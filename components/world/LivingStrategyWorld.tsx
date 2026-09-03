'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlayableGameWorldData, LearningZone } from '@/lib/engine/gameWorldAdapter';
import WORLD_ASSETS from '@/lib/worldAssetMap';
import Link from 'next/link';
import {
  Sparkles,
  Zap,
  ArrowRight,
  Maximize2,
  X,
  Star,
} from 'lucide-react';

interface LivingStrategyWorldProps {
  worldData: PlayableGameWorldData;
}

interface BuildingEntity {
  id: string;
  name: string;
  level: number;
  type: string;
  x: number; // Center X on 1000x1000 world canvas
  y: number; // Center Y on 1000x1000 world canvas
  width: number;
  height: number;
  imageSrc: string;
  zone: LearningZone;
  defaultAction: string;
  rewardXp: number;
  activityName: string;
  tagline: string;
}

const WORLD_WIDTH = 1000;
const WORLD_HEIGHT = 1000;

export default function LivingStrategyWorld({ worldData }: LivingStrategyWorldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Transform coordinates stored in ref for 60fps GPU panning without React re-renders
  const transformRef = useRef<{ x: number; y: number; zoom: number }>({ x: 0, y: 0, zoom: 1 });
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMovedRef = useRef<boolean>(false);
  const lastTouchDistRef = useRef<number | null>(null);

  // Selected building for the modal
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingEntity | null>(null);

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

  // 8 Individual Controlled Building Entities (Aligned to 1000x1000 terrain pads)
  const buildingEntities: BuildingEntity[] = [
    {
      id: learningCampZone.id,
      name: 'Learning Camp',
      level: learningCampZone.level || 2,
      type: 'learning_camp',
      x: 500,
      y: 475,
      width: 170,
      height: 150,
      imageSrc: WORLD_ASSETS.buildings.learningCamp,
      zone: learningCampZone,
      defaultAction: 'Enter Camp',
      rewardXp: 80,
      activityName: mentor?.recommendedConceptName || 'Core Fundamentals',
      tagline: 'Main Knowledge Headquarters & Settlement Hub',
    },
    {
      id: skillLabZone.id,
      name: 'Skill Lab',
      level: skillLabZone.level || 3,
      type: 'skill_lab',
      x: 505,
      y: 173,
      width: 155,
      height: 135,
      imageSrc: WORLD_ASSETS.buildings.skillLab,
      zone: skillLabZone,
      defaultAction: 'Enter Lab',
      rewardXp: 90,
      activityName: 'Algorithmic Functions & State',
      tagline: 'Alchemical Experimentation & Research',
    },
    {
      id: challengeArenaZone.id,
      name: 'Challenge Arena',
      level: challengeArenaZone.level || 3,
      type: 'challenge_arena',
      x: 661,
      y: 292,
      width: 160,
      height: 140,
      imageSrc: WORLD_ASSETS.buildings.challengeArena,
      zone: challengeArenaZone,
      defaultAction: 'Enter Arena',
      rewardXp: 120,
      activityName: 'Survivor Duel & Timed Raid',
      tagline: 'Circular Colosseum Combat Arena',
    },
    {
      id: 'lumber_node',
      name: 'Lumber Yard',
      level: 2,
      type: 'lumber_yard',
      x: 833,
      y: 462,
      width: 150,
      height: 130,
      imageSrc: WORLD_ASSETS.buildings.lumberYard,
      zone: projectValleyZone,
      defaultAction: 'Collect Timber',
      rewardXp: 60,
      activityName: 'Wood & Structural Processing',
      tagline: 'Forestry Cabin & Log Mill',
    },
    {
      id: rewardVaultZone.id,
      name: 'Reward Vault',
      level: rewardVaultZone.level || 2,
      type: 'reward_vault',
      x: 692,
      y: 704,
      width: 145,
      height: 130,
      imageSrc: WORLD_ASSETS.buildings.rewardVault,
      zone: rewardVaultZone,
      defaultAction: 'Open Vault',
      rewardXp: 75,
      activityName: 'Claim Knowledge Crystals',
      tagline: 'Ironbound Stone Treasury & Crystals',
    },
    {
      id: careerCityZone.id,
      name: 'Career Academy',
      level: careerCityZone.level || 3,
      type: 'career_academy',
      x: 507,
      y: 799,
      width: 165,
      height: 145,
      imageSrc: WORLD_ASSETS.buildings.careerAcademy,
      zone: careerCityZone,
      defaultAction: 'Build Your Future',
      rewardXp: 150,
      activityName: 'Industry Mastery & Credentials',
      tagline: 'Grand Academy Spire & Citadel',
    },
    {
      id: projectValleyZone.id,
      name: 'Project Workshop',
      level: projectValleyZone.level || 3,
      type: 'project_workshop',
      x: 321,
      y: 730,
      width: 155,
      height: 135,
      imageSrc: WORLD_ASSETS.buildings.projectWorkshop,
      zone: projectValleyZone,
      defaultAction: 'Go to Workshop',
      rewardXp: 100,
      activityName: 'Build an Interactive App',
      tagline: 'Engineering Workshop & Forge',
    },
    {
      id: 'quarry_node',
      name: 'Quarry Mine',
      level: 2,
      type: 'quarry',
      x: 167,
      y: 475,
      width: 150,
      height: 130,
      imageSrc: WORLD_ASSETS.buildings.quarry,
      zone: learningCampZone,
      defaultAction: 'Mine Resources',
      rewardXp: 60,
      activityName: 'Stone & Mineral Excavation',
      tagline: 'Mountain Mine & Scaffolding',
    },
  ];

  // 5 Individual Characters Standing on Terrain
  const characterEntities = [
    {
      id: 'hero_learner',
      name: 'Learner',
      x: 450,
      y: 505,
      width: 42,
      height: 54,
      imageSrc: WORLD_ASSETS.characters.learner,
    },
    {
      id: 'builder_npc',
      name: 'Builder',
      x: 360,
      y: 755,
      width: 40,
      height: 52,
      imageSrc: WORLD_ASSETS.characters.builder,
    },
    {
      id: 'miner_npc',
      name: 'Miner',
      x: 215,
      y: 495,
      width: 40,
      height: 52,
      imageSrc: WORLD_ASSETS.characters.miner,
    },
    {
      id: 'scholar_mentor',
      name: 'Mentor',
      x: 545,
      y: 215,
      width: 40,
      height: 52,
      imageSrc: WORLD_ASSETS.characters.mentor,
    },
    {
      id: 'trainer_npc',
      name: 'Trainer',
      x: 625,
      y: 315,
      width: 40,
      height: 52,
      imageSrc: WORLD_ASSETS.characters.trainer,
    },
  ];

  // Apply GPU Transform Directly (60fps without React re-render overhead)
  const applyTransform = useCallback(() => {
    if (!viewportRef.current) return;
    const { x, y, zoom } = transformRef.current;
    viewportRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${zoom})`;
  }, []);

  // Auto-fit calculation for mobile screens (360px - 430px)
  const calculateAutoFit = useCallback(() => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth || window.innerWidth;
    const containerHeight = containerRef.current.clientHeight || window.innerHeight;

    const availableWidth = containerWidth;
    const availableHeight = containerHeight - 80;

    const scaleX = availableWidth / WORLD_WIDTH;
    const scaleY = availableHeight / WORLD_HEIGHT;
    const optimalScale = Math.min(scaleX, scaleY, 1.25);

    const safeScale = Math.max(0.38, Math.min(optimalScale, 1.15));

    transformRef.current = {
      zoom: safeScale,
      x: (containerWidth - WORLD_WIDTH * safeScale) / 2,
      y: (containerHeight - WORLD_HEIGHT * safeScale) / 2,
    };
    applyTransform();
  }, [applyTransform]);

  useEffect(() => {
    calculateAutoFit();
    window.addEventListener('resize', calculateAutoFit);
    return () => window.removeEventListener('resize', calculateAutoFit);
  }, [calculateAutoFit]);

  // Mouse Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartRef.current = {
      x: e.clientX - transformRef.current.x,
      y: e.clientY - transformRef.current.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    hasMovedRef.current = true;
    transformRef.current.x = e.clientX - dragStartRef.current.x;
    transformRef.current.y = e.clientY - dragStartRef.current.y;
    applyTransform();
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Touch Handlers for Mobile Pan & Pinch Zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      hasMovedRef.current = false;
      dragStartRef.current = {
        x: e.touches[0].clientX - transformRef.current.x,
        y: e.touches[0].clientY - transformRef.current.y,
      };
      lastTouchDistRef.current = null;
    } else if (e.touches.length === 2) {
      isDraggingRef.current = false;
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastTouchDistRef.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDraggingRef.current) {
      hasMovedRef.current = true;
      transformRef.current.x = e.touches[0].clientX - dragStartRef.current.x;
      transformRef.current.y = e.touches[0].clientY - dragStartRef.current.y;
      applyTransform();
    } else if (e.touches.length === 2 && lastTouchDistRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / lastTouchDistRef.current;
      lastTouchDistRef.current = dist;
      transformRef.current.zoom = Math.min(1.5, Math.max(0.35, transformRef.current.zoom * factor));
      applyTransform();
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    lastTouchDistRef.current = null;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[100dvh] overflow-hidden select-none bg-[#07130A] font-sans touch-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ cursor: 'grab' }}
    >
      {/* 1. TOP STRATEGY HUD */}
      <header className="absolute top-0 inset-x-0 z-40 h-14 bg-slate-950/85 backdrop-blur-md border-b border-white/[0.08] px-3.5 flex items-center justify-between pointer-events-auto shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center font-mono font-black text-xs text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.4)]">
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

      {/* 2. LIVING 2.5D GAME WORLD SCENE (1000x1000 Controlled Canvas) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          ref={viewportRef}
          className="relative shrink-0 pointer-events-auto will-change-transform shadow-2xl"
          style={{
            width: `${WORLD_WIDTH}px`,
            height: `${WORLD_HEIGHT}px`,
            transformOrigin: 'top left',
          }}
        >
          {/* ========================================================================= */}
          {/* LAYER 1: BASE TERRAIN & NATURAL MEADOW (z-index 1) */}
          {/* ========================================================================= */}
          <div className="absolute inset-0 rounded-[56px] overflow-hidden shadow-2xl z-1 pointer-events-none select-none">
            <img
              src="/world/terrain/world-map-bg.png"
              alt="Illustrated forest world map"
              className="h-full w-full object-fill"
              draggable={false}
            />
          </div>

          {/* ========================================================================= */}
          {/* LAYER 4: SPARSE, INTENTIONAL PROPS (Campfire, Stones, Logs, Crates) (z-index 4) */}
          {/* ========================================================================= */}
          {/* Campfire at Central Settlement Hub */}
          <div className="absolute left-[545px] top-[495px] -translate-x-1/2 -translate-y-1/2 z-4 pointer-events-none flex flex-col items-center">
            <div className="absolute bottom-0 w-10 h-3.5 rounded-full bg-black/45 blur-[1px]" />
            <img
              src={WORLD_ASSETS.props.campfire}
              alt="Campfire"
              style={{ width: '46px', height: '46px', objectFit: 'contain' }}
              draggable={false}
            />
            <div className="absolute top-1 w-3 h-3 rounded-full bg-amber-400 blur-[1px] animate-ping opacity-75" />
            <div className="absolute top-2 w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          </div>

          {/* Stone Pile near Quarry */}
          <div className="absolute left-[210px] top-[440px] -translate-x-1/2 -translate-y-1/2 z-4 pointer-events-none">
            <div className="absolute bottom-0 w-10 h-3.5 rounded-full bg-black/40 blur-[1px]" />
            <img
              src={WORLD_ASSETS.props.stonePile}
              alt="Stone Pile"
              style={{ width: '48px', height: '36px', objectFit: 'contain' }}
              draggable={false}
            />
          </div>

          {/* Timber Logs near Lumber Yard */}
          <div className="absolute left-[785px] top-[485px] -translate-x-1/2 -translate-y-1/2 z-4 pointer-events-none">
            <div className="absolute bottom-0 w-10 h-3.5 rounded-full bg-black/40 blur-[1px]" />
            <img
              src={WORLD_ASSETS.props.logs}
              alt="Timber Logs"
              style={{ width: '48px', height: '36px', objectFit: 'contain' }}
              draggable={false}
            />
          </div>

          {/* Cargo Crates near Project Workshop */}
          <div className="absolute left-[365px] top-[705px] -translate-x-1/2 -translate-y-1/2 z-4 pointer-events-none">
            <div className="absolute bottom-0 w-9 h-3 rounded-full bg-black/40 blur-[1px]" />
            <img
              src={WORLD_ASSETS.props.crates}
              alt="Crates"
              style={{ width: '42px', height: '34px', objectFit: 'contain' }}
              draggable={false}
            />
          </div>

          {/* ========================================================================= */}
          {/* LAYER 5: 8 LARGE, READABLE BUILDINGS (z-index 5) */}
          {/* ========================================================================= */}
          {buildingEntities.map((b) => {
            const isRec = b.id === recommendedId;
            const isSel = selectedBuilding?.id === b.id;

            return (
              <div
                key={b.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!hasMovedRef.current) {
                    setSelectedBuilding(b);
                  }
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-5 cursor-pointer group flex flex-col items-center"
                style={{
                  left: `${b.x}px`,
                  top: `${b.y}px`,
                  width: `${b.width}px`,
                  height: `${b.height}px`,
                }}
              >
                {/* Soft Contact Shadow Flat on the Ground */}
                <div
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-black/45 blur-[2.5px] pointer-events-none transition-all duration-300"
                  style={{
                    width: `${b.width * 0.78}px`,
                    height: `${b.height * 0.22}px`,
                  }}
                />

                {/* Building Sprite Image */}
                <img
                  src={b.imageSrc}
                  alt={b.name}
                  className={`w-full h-full object-contain drop-shadow-xl transition-transform duration-200 group-hover:scale-105 group-active:scale-95 ${
                    isSel ? 'drop-shadow-[0_0_16px_rgba(251,191,36,0.95)]' : ''
                  }`}
                  draggable={false}
                />

                {/* Adaptive Quest Spotlight Beacon */}
                {isRec && (
                  <div className="absolute -top-8 z-7 flex flex-col items-center pointer-events-none animate-bounce">
                    <div className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-slate-950 font-mono font-black text-[9px] uppercase tracking-wider shadow-[0_0_14px_rgba(251,191,36,0.95)] border border-white flex items-center gap-1">
                      <Star className="w-3 h-3 fill-slate-950 text-slate-950" />
                      <span>NEXT QUEST</span>
                    </div>
                    <div className="w-2 h-2 bg-amber-400 rotate-45 -mt-1 shadow-md" />
                  </div>
                )}
              </div>
            );
          })}

          {/* ========================================================================= */}
          {/* LAYER 6: 5 INDIVIDUAL CHARACTERS STANDING ON TERRAIN (z-index 6) */}
          {/* ========================================================================= */}
          {characterEntities.map((c) => (
            <div
              key={c.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-6 pointer-events-none flex flex-col items-center"
              style={{
                left: `${c.x}px`,
                top: `${c.y}px`,
                width: `${c.width}px`,
                height: `${c.height}px`,
                animation: 'characterIdle 3s ease-in-out infinite',
              }}
            >
              {/* Soft Ground Contact Shadow */}
              <div className="absolute bottom-0.5 w-7 h-2.5 rounded-full bg-black/40 blur-[1px]" />
              <img
                src={c.imageSrc}
                alt={c.name}
                className="w-full h-full object-contain drop-shadow-md"
                draggable={false}
              />
            </div>
          ))}

          {/* ========================================================================= */}
          {/* LAYER 8: SEPARATE HTML/CSS BUILDING LABELS (z-index 8) */}
          {/* ========================================================================= */}
          {buildingEntities.map((b) => (
            <div
              key={`label_${b.id}`}
              className="absolute -translate-x-1/2 z-8 pointer-events-none flex flex-col items-center"
              style={{
                left: `${b.x}px`,
                top: `${b.y + b.height / 2 + 6}px`,
              }}
            >
              <div className="px-2 py-0.5 rounded-full bg-slate-950/85 border border-white/15 backdrop-blur-sm shadow-md flex items-center gap-1.5">
                <span className="font-sans font-bold text-[10px] text-white tracking-wide uppercase">
                  {b.name}
                </span>
                <span className="font-mono text-[9px] font-black text-amber-400">
                  Lv.{b.level}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. FLOATING CAMERA FIT CONTROL */}
      <div className="fixed bottom-20 right-4 z-30 pointer-events-auto">
        <button
          type="button"
          onClick={calculateAutoFit}
          className="h-10 px-4 rounded-full bg-slate-900/90 border border-amber-400/60 text-amber-300 font-mono text-xs font-bold flex items-center gap-1.5 shadow-[0_8px_20px_rgba(0,0,0,0.85)] backdrop-blur-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Fit View</span>
        </button>
      </div>

      {/* 6. INTERACTIVE BUILDING INSPECTION SHEET (Detail Drawer) */}
      {selectedBuilding && (
        <div className="fixed inset-x-3 bottom-18 sm:bottom-6 sm:inset-x-auto sm:right-6 z-50 max-w-sm w-full mx-auto select-none animate-in fade-in slide-in-from-bottom-5">
          <div className="relative p-5 rounded-[22px] bg-[#0A101D]/95 border-2 border-amber-400/80 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.95)] space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-sans font-black text-base text-white uppercase tracking-wide">
                    {selectedBuilding.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono text-[10px] font-black border border-amber-500/40">
                    Lv.{selectedBuilding.level}
                  </span>
                </div>
                <p className="font-mono text-xs text-slate-400 mt-0.5">
                  {selectedBuilding.tagline}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBuilding(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mastery Progress Bar */}
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/90 border border-white/[0.06]">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-slate-400 uppercase font-bold">Territory Mastery</span>
                <span className="font-black text-emerald-400">{selectedBuilding.zone.masteryPercent || 78}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)] transition-all duration-500"
                  style={{ width: `${selectedBuilding.zone.masteryPercent || 78}%` }}
                />
              </div>
            </div>

            {/* Next Activity & Reward XP */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.06] space-y-1">
              <span className="font-mono text-[10px] uppercase text-cyan-400 font-bold tracking-wider block">
                NEXT ACTIVITY
              </span>
              <p className="font-sans font-bold text-sm text-white">
                {selectedBuilding.activityName}
              </p>
              <div className="flex items-center gap-1 font-mono text-xs font-bold text-amber-300 pt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>+{selectedBuilding.rewardXp} XP Reward</span>
              </div>
            </div>

            {/* Action Launch Button */}
            <Link
              href={selectedBuilding.zone.actionUrl || '/quest'}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-sans font-black text-sm uppercase flex items-center justify-center gap-2 shadow-[0_8px_25px_rgba(37,99,235,0.6)] active:scale-98 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>{selectedBuilding.defaultAction}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Embedded CSS for GPU Keyframe Animations */}
      <style jsx global>{`
        @keyframes characterIdle {
          0%, 100% {
            transform: translate3d(-50%, -50%, 0) scale(1);
          }
          50% {
            transform: translate3d(-50%, calc(-50% - 2px), 0) scale(1.02);
          }
        }
      `}</style>
    </div>
  );
}
