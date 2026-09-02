'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlayableGameWorldData, LearningZone } from '@/lib/engine/gameWorldAdapter';
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
  x: number; // Center X on 880x880 world canvas
  y: number; // Center Y on 880x880 world canvas
  width: number;
  height: number;
  imageSrc: string;
  zone: LearningZone;
  defaultAction: string;
  rewardXp: number;
  activityName: string;
  tagline: string;
}

const WORLD_WIDTH = 880;
const WORLD_HEIGHT = 880;

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

  // 8 Individual Illustrated PNG Buildings
  const buildingEntities: BuildingEntity[] = [
    {
      id: learningCampZone.id,
      name: 'Learning Camp',
      level: learningCampZone.level || 2,
      type: 'learning_camp',
      x: 430,
      y: 380,
      width: 175,
      height: 155,
      imageSrc: '/world/buildings/learning-camp.png',
      zone: learningCampZone,
      defaultAction: 'Enter Camp',
      rewardXp: 80,
      activityName: mentor?.recommendedConceptName || 'Core Fundamentals',
      tagline: 'Main Knowledge Headquarters & Settlement Hub',
    },
    {
      id: projectValleyZone.id,
      name: 'Project Workshop',
      level: projectValleyZone.level || 3,
      type: 'project_workshop',
      x: 430,
      y: 190,
      width: 160,
      height: 140,
      imageSrc: '/world/buildings/project-workshop.png',
      zone: projectValleyZone,
      defaultAction: 'Go to Workshop',
      rewardXp: 100,
      activityName: 'Build an Interactive App',
      tagline: 'Engineering Workshop & Forge',
    },
    {
      id: skillLabZone.id,
      name: 'Skill Lab',
      level: skillLabZone.level || 3,
      type: 'skill_lab',
      x: 235,
      y: 200,
      width: 160,
      height: 140,
      imageSrc: '/world/buildings/skill-lab.png',
      zone: skillLabZone,
      defaultAction: 'Enter Lab',
      rewardXp: 90,
      activityName: 'Algorithmic Functions & State',
      tagline: 'Alchemical Experimentation & Research',
    },
    {
      id: 'quarry_node',
      name: 'Quarry Mine',
      level: 2,
      type: 'quarry',
      x: 135,
      y: 340,
      width: 150,
      height: 135,
      imageSrc: '/world/buildings/quarry.png',
      zone: learningCampZone,
      defaultAction: 'Mine Resources',
      rewardXp: 60,
      activityName: 'Stone & Mineral Excavation',
      tagline: 'Mountain Mine & Scaffolding',
    },
    {
      id: challengeArenaZone.id,
      name: 'Challenge Arena',
      level: challengeArenaZone.level || 3,
      type: 'challenge_arena',
      x: 650,
      y: 205,
      width: 165,
      height: 145,
      imageSrc: '/world/buildings/challenge-arena.png',
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
      x: 720,
      y: 360,
      width: 155,
      height: 135,
      imageSrc: '/world/buildings/lumber-yard.png',
      zone: projectValleyZone,
      defaultAction: 'Collect Timber',
      rewardXp: 60,
      activityName: 'Wood & Structural Processing',
      tagline: 'Forestry Cabin & Log Cords',
    },
    {
      id: rewardVaultZone.id,
      name: 'Reward Vault',
      level: rewardVaultZone.level || 2,
      type: 'reward_vault',
      x: 240,
      y: 530,
      width: 150,
      height: 135,
      imageSrc: '/world/buildings/reward-vault.png',
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
      x: 480,
      y: 550,
      width: 170,
      height: 150,
      imageSrc: '/world/buildings/career-academy.png',
      zone: careerCityZone,
      defaultAction: 'Build Your Future',
      rewardXp: 150,
      activityName: 'Industry Mastery & Credentials',
      tagline: 'Grand Academy Spire & Domes',
    },
  ];

  // 5 Individual Illustrated PNG Characters
  const characterEntities = [
    {
      id: 'hero_learner',
      name: 'Learner',
      x: 395,
      y: 430,
      width: 44,
      height: 58,
      imageSrc: '/world/characters/learner.png',
    },
    {
      id: 'builder_npc',
      name: 'Builder',
      x: 480,
      y: 235,
      width: 42,
      height: 56,
      imageSrc: '/world/characters/builder.png',
    },
    {
      id: 'miner_npc',
      name: 'Miner',
      x: 185,
      y: 375,
      width: 42,
      height: 56,
      imageSrc: '/world/characters/miner.png',
    },
    {
      id: 'scholar_mentor',
      name: 'Mentor',
      x: 285,
      y: 245,
      width: 42,
      height: 56,
      imageSrc: '/world/characters/mentor.png',
    },
    {
      id: 'trainer_npc',
      name: 'Trainer',
      x: 610,
      y: 245,
      width: 42,
      height: 56,
      imageSrc: '/world/characters/trainer.png',
    },
  ];

  // Individual Perimeter & Cluster Trees (PNG Assets)
  const treePositions = [
    { x: 120, y: 170, type: 'pine', src: '/world/props/tree-pine.png' },
    { x: 165, y: 135, type: 'oak', src: '/world/props/tree-oak.png' },
    { x: 330, y: 110, type: 'pine', src: '/world/props/tree-pine.png' },
    { x: 530, y: 115, type: 'oak', src: '/world/props/tree-oak.png' },
    { x: 740, y: 135, type: 'pine', src: '/world/props/tree-pine.png' },
    { x: 800, y: 190, type: 'oak', src: '/world/props/tree-oak.png' },
    { x: 820, y: 280, type: 'pine', src: '/world/props/tree-pine.png' },
    { x: 810, y: 440, type: 'oak', src: '/world/props/tree-oak.png' },
    { x: 780, y: 560, type: 'pine', src: '/world/props/tree-pine.png' },
    { x: 730, y: 670, type: 'oak', src: '/world/props/tree-oak.png' },
    { x: 610, y: 730, type: 'pine', src: '/world/props/tree-pine.png' },
    { x: 490, y: 745, type: 'oak', src: '/world/props/tree-oak.png' },
    { x: 370, y: 735, type: 'pine', src: '/world/props/tree-pine.png' },
    { x: 250, y: 710, type: 'oak', src: '/world/props/tree-oak.png' },
    { x: 150, y: 650, type: 'pine', src: '/world/props/tree-pine.png' },
    { x: 90, y: 520, type: 'oak', src: '/world/props/tree-oak.png' },
    { x: 85, y: 410, type: 'pine', src: '/world/props/tree-pine.png' },
    { x: 95, y: 250, type: 'oak', src: '/world/props/tree-oak.png' },
    // Interior grove clusters
    { x: 345, y: 310, type: 'pine', src: '/world/props/tree-pine.png' },
    { x: 525, y: 310, type: 'oak', src: '/world/props/tree-oak.png' },
    { x: 350, y: 485, type: 'oak', src: '/world/props/tree-oak.png' },
    { x: 605, y: 470, type: 'pine', src: '/world/props/tree-pine.png' },
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

    const safeScale = Math.max(0.42, Math.min(optimalScale, 1.15));

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
      transformRef.current.zoom = Math.min(1.5, Math.max(0.38, transformRef.current.zoom * factor));
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
      className="relative w-full h-[100dvh] overflow-hidden select-none bg-[#09180E] font-sans touch-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ cursor: 'grab' }}
    >
      {/* 1. TOP STRATEGY HUD */}
      <header className="absolute top-0 inset-x-0 z-30 h-14 bg-slate-950/85 backdrop-blur-md border-b border-white/[0.08] px-3.5 flex items-center justify-between pointer-events-auto shadow-md">
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

      {/* 2. LIVING 2.5D GAME WORLD SCENE COMPOSED OF INDIVIDUAL PNG ASSETS */}
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
          {/* LAYER 1: BASE TERRAIN & NATURAL MEADOW (Layered Procedural Canvas) */}
          {/* ========================================================================= */}
          <div className="absolute inset-0 rounded-[48px] overflow-hidden bg-[#2D6A4F] shadow-inner">
            {/* Rich Radial Elevation Meadow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#41946D] via-[#2A654A] to-[#183E2D]" />

            {/* Natural Cobblestone & Dirt Road Paths (Connecting Central Hub to Districts) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 880 880">
              {/* Path Under-Shadow */}
              <g stroke="rgba(30,12,3,0.45)" strokeLinecap="round" strokeLinejoin="round" fill="none">
                {/* Center to Project Workshop (North) */}
                <path d="M430,380 Q430,280 430,190" strokeWidth="36" />
                {/* Center to Skill Lab (North-West) */}
                <path d="M430,380 Q320,300 235,200" strokeWidth="36" />
                {/* Center to Quarry (West) */}
                <path d="M430,380 Q270,360 135,340" strokeWidth="36" />
                {/* Center to Challenge Arena (North-East) */}
                <path d="M430,380 Q550,290 650,205" strokeWidth="36" />
                {/* Center to Lumber Yard (East) */}
                <path d="M430,380 Q580,370 720,360" strokeWidth="36" />
                {/* Center to Reward Vault (South-West) */}
                <path d="M430,380 Q320,460 240,530" strokeWidth="36" />
                {/* Center to Career Academy (South) */}
                <path d="M430,380 Q460,470 480,550" strokeWidth="36" />
                {/* Career Academy to River Bridge */}
                <path d="M480,550 Q590,620 680,680" strokeWidth="36" />
              </g>

              {/* Main Sand & Earth Road */}
              <g stroke="#B45309" strokeLinecap="round" strokeLinejoin="round" fill="none">
                <path d="M430,380 Q430,280 430,190" strokeWidth="26" />
                <path d="M430,380 Q320,300 235,200" strokeWidth="26" />
                <path d="M430,380 Q270,360 135,340" strokeWidth="26" />
                <path d="M430,380 Q550,290 650,205" strokeWidth="26" />
                <path d="M430,380 Q580,370 720,360" strokeWidth="26" />
                <path d="M430,380 Q320,460 240,530" strokeWidth="26" />
                <path d="M430,380 Q460,470 480,550" strokeWidth="26" />
                <path d="M430,550 Q590,620 680,680" strokeWidth="26" />
              </g>

              {/* Cobblestone Pattern Overlay */}
              <g stroke="#D97706" strokeLinecap="round" strokeDasharray="6 8" strokeWidth="18" fill="none">
                <path d="M430,380 Q430,280 430,190" />
                <path d="M430,380 Q320,300 235,200" />
                <path d="M430,380 Q270,360 135,340" />
                <path d="M430,380 Q550,290 650,205" />
                <path d="M430,380 Q580,370 720,360" />
                <path d="M430,380 Q320,460 240,530" />
                <path d="M430,380 Q460,470 480,550" />
                <path d="M430,550 Q590,620 680,680" />
              </g>

              {/* Central Village Plaza Ring */}
              <circle cx="430" cy="380" r="78" fill="#B45309" />
              <circle cx="430" cy="380" r="70" stroke="#D97706" strokeWidth="3" strokeDasharray="6 6" fill="none" />

              {/* South-Eastern Curved River Canal */}
              <path
                d="M600,880 Q690,750 780,670 Q850,600 880,580 L880,880 Z"
                fill="url(#riverWater)"
              />
              <defs>
                <linearGradient id="riverWater" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#0284C7" />
                  <stop offset="50%" stopColor="#0369A1" />
                  <stop offset="100%" stopColor="#0F766E" />
                </linearGradient>
              </defs>
            </svg>

            {/* Wooden Footbridge Over River */}
            <div className="absolute left-[680px] top-[670px] w-18 h-9 bg-[#78350F] rounded border-2 border-[#451A03] shadow-lg rotate-35 flex items-center justify-between px-1.5 pointer-events-none z-10">
              <div className="w-1.5 h-full bg-[#451A03]/60" />
              <div className="w-1.5 h-full bg-[#451A03]/60" />
              <div className="w-1.5 h-full bg-[#451A03]/60" />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* LAYER 2: INDIVIDUAL ENVIRONMENT PROPS (Trees, Rocks, Logs, Flowers) */}
          {/* ========================================================================= */}
          {/* Individual Trees (PNG) */}
          {treePositions.map((tp, idx) => (
            <div
              key={`tree_${idx}`}
              className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 z-12"
              style={{ left: `${tp.x}px`, top: `${tp.y}px` }}
            >
              {/* Soft Ground Contact Shadow */}
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-9 h-3.5 rounded-full bg-black/40 blur-[1.5px]" />
              <img
                src={tp.src}
                alt="Tree"
                className="w-15 h-19 object-contain drop-shadow-md"
                draggable={false}
              />
            </div>
          ))}

          {/* Individual Campfire at Center Plaza (PNG) */}
          <div className="absolute left-[475px] top-[405px] -translate-x-1/2 -translate-y-1/2 z-14 pointer-events-none flex flex-col items-center">
            <div className="absolute bottom-0 w-9 h-3.5 rounded-full bg-black/45 blur-[1px]" />
            <img
              src="/world/props/campfire.png"
              alt="Campfire"
              className="w-12 h-12 object-contain drop-shadow-md"
              draggable={false}
            />
            {/* Animated Flame Particle */}
            <div className="absolute top-1 w-3.5 h-3.5 rounded-full bg-amber-400 blur-[1px] animate-ping opacity-75" />
            <div className="absolute top-2 w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          </div>

          {/* Individual Stone Pile Prop (PNG) */}
          <div className="absolute left-[195px] top-[320px] -translate-x-1/2 -translate-y-1/2 z-13 pointer-events-none">
            <div className="absolute bottom-0 w-9 h-3 rounded-full bg-black/40 blur-[1px]" />
            <img
              src="/world/props/stone-pile.png"
              alt="Stone Pile"
              className="w-13 h-10 object-contain drop-shadow-sm"
              draggable={false}
            />
          </div>

          {/* Individual Timber Logs Prop (PNG) */}
          <div className="absolute left-[660px] top-[390px] -translate-x-1/2 -translate-y-1/2 z-13 pointer-events-none">
            <div className="absolute bottom-0 w-9 h-3 rounded-full bg-black/40 blur-[1px]" />
            <img
              src="/world/props/logs.png"
              alt="Timber Logs"
              className="w-13 h-10 object-contain drop-shadow-sm"
              draggable={false}
            />
          </div>

          {/* Individual Crates Prop (PNG) */}
          <div className="absolute left-[380px] top-[230px] -translate-x-1/2 -translate-y-1/2 z-13 pointer-events-none">
            <div className="absolute bottom-0 w-8 h-2.5 rounded-full bg-black/40 blur-[1px]" />
            <img
              src="/world/props/crates.png"
              alt="Crates"
              className="w-11 h-9 object-contain drop-shadow-sm"
              draggable={false}
            />
          </div>

          {/* Individual Flower Patches (PNG) */}
          <div className="absolute left-[430px] top-[290px] -translate-x-1/2 -translate-y-1/2 z-11 pointer-events-none">
            <img
              src="/world/terrain/flowers.png"
              alt="Wildflowers"
              className="w-11 h-8 object-contain opacity-95"
              draggable={false}
            />
          </div>
          <div className="absolute left-[430px] top-[480px] -translate-x-1/2 -translate-y-1/2 z-11 pointer-events-none">
            <img
              src="/world/terrain/flowers.png"
              alt="Wildflowers"
              className="w-11 h-8 object-contain opacity-95"
              draggable={false}
            />
          </div>

          {/* ========================================================================= */}
          {/* LAYER 3: 8 INDIVIDUAL ILLUSTRATED PNG BUILDINGS */}
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
                className="absolute -translate-x-1/2 -translate-y-1/2 z-16 cursor-pointer group flex flex-col items-center"
                style={{
                  left: `${b.x}px`,
                  top: `${b.y}px`,
                  width: `${b.width}px`,
                  height: `${b.height}px`,
                }}
              >
                {/* Ground Ambient Contact Shadow */}
                <div
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/45 blur-[2.5px] pointer-events-none transition-all duration-300"
                  style={{
                    width: `${b.width * 0.78}px`,
                    height: `${b.height * 0.22}px`,
                  }}
                />

                {/* Individual Illustrated PNG Building Sprite */}
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
                  <div className="absolute -top-7 z-30 flex flex-col items-center pointer-events-none animate-bounce">
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
          {/* LAYER 4: 5 INDIVIDUAL LIVING PNG CHARACTERS */}
          {/* ========================================================================= */}
          {characterEntities.map((c) => (
            <div
              key={c.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-18 pointer-events-none flex flex-col items-center"
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
