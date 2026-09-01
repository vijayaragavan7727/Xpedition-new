'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlayableGameWorldData, LearningZone } from '@/lib/engine/gameWorldAdapter';
import GameTopHud from './GameTopHud';
import WorldBuildingNode from './WorldBuildingNode';
import WorkerCharacter from './WorkerCharacter';
import BuildingDetailModal from './BuildingDetailModal';
import Link from 'next/link';
import { Swords, Compass, Maximize2, Sparkles, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

interface StrategyGameWorldProps {
  worldData: PlayableGameWorldData;
}

const MAP_WIDTH = 760;
const MAP_HEIGHT = 760;

export default function StrategyGameWorld({ worldData }: StrategyGameWorldProps) {
  // Container & Viewport ref
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-fit Zoom & Pan State
  const [zoom, setZoom] = useState<number>(1);
  const [baseAutoFitScale, setBaseAutoFitScale] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastTouchDistRef = useRef<number | null>(null);

  // Selected Building for Inspection Modal
  const [selectedBuilding, setSelectedBuilding] = useState<LearningZone | null>(null);

  // Upgrade Particle state
  const [upgradeBurst, setUpgradeBurst] = useState<string | null>(null);

  // Auto-fit camera calculation on mount and resize
  const calculateAutoFit = useCallback(() => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth || window.innerWidth;
    const containerHeight = containerRef.current.clientHeight || window.innerHeight;

    // Available space accounting for top HUD (60px) and bottom nav/buttons (70px) and safe margins
    const availableWidth = containerWidth - 16;
    const availableHeight = containerHeight - 130;

    const scaleX = availableWidth / MAP_WIDTH;
    const scaleY = availableHeight / MAP_HEIGHT;
    const optimalScale = Math.min(scaleX, scaleY, 1.35);

    const safeScale = Math.max(0.42, Math.min(optimalScale, 1.25));
    setBaseAutoFitScale(safeScale);
    setZoom(safeScale);
    setPan({ x: 0, y: 15 }); // slight vertical center balance
  }, []);

  useEffect(() => {
    calculateAutoFit();
    window.addEventListener('resize', calculateAutoFit);
    return () => window.removeEventListener('resize', calculateAutoFit);
  }, [calculateAutoFit]);

  // Mouse Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Touch Handlers for Mobile Pan & Pinch Zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
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
      setZoom((prev) => Math.min(1.5, Math.max(0.35, prev * factor)));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    lastTouchDistRef.current = null;
  };

  // Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const newZoom = Math.min(1.5, Math.max(0.38, zoom - e.deltaY * 0.0012));
    setZoom(newZoom);
  };

  const resetToAutoFit = () => {
    setZoom(baseAutoFitScale);
    setPan({ x: 0, y: 15 });
  };

  const handleUpgradeBuilding = (buildingId: string) => {
    setUpgradeBurst(buildingId);
    setTimeout(() => setUpgradeBurst(null), 2500);
  };

  const { buildings, zones } = worldData;

  // Resolve 7 Core Strategy Locations
  const knowledgeCore = buildings.knowledgeCore || zones.learningCamp;
  const courseAcademy = buildings.courseAcademy || zones.skillDistrict;
  const skillLab = buildings.skillLab || zones.skillDistrict;
  const challengeArena = buildings.challengeArena || zones.challengeArena;
  const rewardVault = buildings.rewardVault || zones.learningCamp;
  const practiceGrounds = buildings.practiceGrounds || zones.projectValley;
  const careerHub = buildings.careerHub || zones.careerCity;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[100dvh] overflow-hidden select-none bg-[#112417] font-sans touch-none"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* 1. TOP STRATEGY GAME HUD */}
      <GameTopHud
        worldData={worldData}
        onOpenHQ={() => setSelectedBuilding(knowledgeCore)}
      />

      {/* 2. AUTO-FRAMED CONTINUOUS STRATEGY MAP CANVAS */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="relative transition-transform duration-75 ease-out shrink-0 pointer-events-auto"
          style={{
            width: `${MAP_WIDTH}px`,
            height: `${MAP_HEIGHT}px`,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          {/* =================================================================== */}
          {/* A. CONTINUOUS STRATEGY TERRAIN: CHECKERBOARD LAWN & WATERWAYS */}
          {/* =================================================================== */}
          <div className="relative w-full h-full rounded-[40px] shadow-[0_25px_90px_rgba(0,0,0,0.85)] overflow-hidden border-4 border-[#1E3A24] bg-[#2D6A4F]">
            {/* Dual-Tone Lawn Checkerboard Grid */}
            <div
              className="absolute inset-0 opacity-45"
              style={{
                backgroundImage: `
                  linear-gradient(45deg, #1B4332 25%, transparent 25%), 
                  linear-gradient(-45deg, #1B4332 25%, transparent 25%), 
                  linear-gradient(45deg, transparent 75%, #1B4332 75%), 
                  linear-gradient(-45deg, transparent 75%, #1B4332 75%)
                `,
                backgroundSize: '40px 40px',
                backgroundPosition: '0 0, 0 20px, 20px -20px, -20px 0px',
              }}
            />

            {/* Left Flowing River & Shoreline */}
            <div className="absolute top-0 bottom-0 left-0 w-20 bg-gradient-to-r from-[#0284C7] via-[#0369A1] to-[#0F766E] border-r-4 border-[#CA8A04] shadow-inner flex flex-col justify-around items-center">
              <div className="w-full h-6 bg-white/20 blur-[1px] animate-pulse" />
              <div className="w-full h-6 bg-white/10 blur-[1px] animate-pulse" />
              <div className="w-full h-6 bg-white/20 blur-[1px] animate-pulse" />
            </div>

            {/* Perimeter Dense Jungle Forest Canopy */}
            {/* North Border Trees */}
            <div className="absolute top-0 inset-x-0 h-12 bg-[#143621] flex justify-around items-center px-4 border-b-2 border-[#0D2416]">
              {Array.from({ length: 14 }).map((_, i) => (
                <span key={i} className="text-xl drop-shadow-md">
                  {i % 3 === 0 ? '🌲' : i % 2 === 0 ? '🌳' : '🌴'}
                </span>
              ))}
            </div>

            {/* South Border Trees */}
            <div className="absolute bottom-0 inset-x-0 h-12 bg-[#143621] flex justify-around items-center px-4 border-t-2 border-[#0D2416]">
              {Array.from({ length: 14 }).map((_, i) => (
                <span key={i} className="text-xl drop-shadow-md">
                  {i % 3 === 0 ? '🌳' : i % 2 === 0 ? '🌲' : '🌴'}
                </span>
              ))}
            </div>

            {/* East Border Trees */}
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-[#143621] flex flex-col justify-around items-center py-4 border-l-2 border-[#0D2416]">
              {Array.from({ length: 10 }).map((_, i) => (
                <span key={i} className="text-xl drop-shadow-md">
                  {i % 2 === 0 ? '🌳' : '🌲'}
                </span>
              ))}
            </div>

            {/* =================================================================== */}
            {/* B. COBBLESTONE & DIRT ROADWAYS CONNECTING ALL DISTRICTS */}
            {/* =================================================================== */}
            {/* Central Circular Plaza Road */}
            <div className="absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2 w-52 h-52 rounded-full border-6 border-dashed border-[#A16207]/50 pointer-events-none" />

            {/* North-South Main Thoroughfare */}
            <div className="absolute left-1/2 -translate-x-1/2 top-12 bottom-12 w-10 bg-[#854D0E]/50 border-x border-[#713F12] shadow-inner pointer-events-none" />

            {/* East-West Cross Road */}
            <div className="absolute top-[48%] -translate-y-1/2 left-20 right-12 h-10 bg-[#854D0E]/50 border-y border-[#713F12] shadow-inner pointer-events-none" />

            {/* =================================================================== */}
            {/* C. DEFENSIVE STONE WALL BARRICADES DIVIDING DISTRICTS */}
            {/* =================================================================== */}
            {/* Citadel North Wall */}
            <div className="absolute top-[38%] left-[36%] right-[36%] h-3 bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 rounded-sm border border-slate-600 shadow-sm flex justify-between px-1 pointer-events-none">
              <span className="w-1.5 h-full bg-slate-700" />
              <span className="w-1.5 h-full bg-slate-700" />
            </div>

            {/* West Yard Wall */}
            <div className="absolute top-[28%] bottom-[40%] left-[16%] w-3 bg-gradient-to-b from-slate-400 via-slate-200 to-slate-400 rounded-sm border border-slate-600 shadow-sm pointer-events-none" />

            {/* East Yard Wall */}
            <div className="absolute top-[28%] bottom-[40%] right-[16%] w-3 bg-gradient-to-b from-slate-400 via-slate-200 to-slate-400 rounded-sm border border-slate-600 shadow-sm pointer-events-none" />

            {/* =================================================================== */}
            {/* D. NATURAL PROPS: CAMPFIRE, LUMBER DEPOT, QUARRY, FLOWERS */}
            {/* =================================================================== */}
            {/* Central Campfire */}
            <div className="absolute left-[50%] top-[59%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
              <div className="w-7 h-7 rounded-full bg-amber-950 border border-amber-800 flex items-center justify-center shadow-md">
                <span className="text-sm animate-bounce">🔥</span>
              </div>
              <span className="text-[9px] font-mono text-amber-200 font-bold">Campfire</span>
            </div>

            {/* Lumber Depot */}
            <div className="absolute left-[36%] top-[23%] flex items-center gap-1 p-1 bg-amber-950/40 rounded-lg border border-amber-800 pointer-events-none">
              <span className="text-base">🪵</span>
              <span className="text-[9px] font-mono font-bold text-amber-300">Lumber</span>
            </div>

            {/* Gold Quarry Vein */}
            <div className="absolute right-[34%] top-[23%] flex items-center gap-1 p-1 bg-slate-900/60 rounded-lg border border-amber-500/40 pointer-events-none">
              <span className="text-base">⛏️</span>
              <span className="text-[9px] font-mono font-bold text-yellow-300">Quarry</span>
            </div>

            {/* Wildflowers */}
            <div className="absolute top-[27%] left-[45%] text-xs">🌸🌼</div>
            <div className="absolute top-[67%] left-[34%] text-xs">🌺🌷</div>
            <div className="absolute top-[67%] right-[34%] text-xs">🌻🌹</div>

            {/* =================================================================== */}
            {/* E. 7 DATA-DRIVEN ARCHITECTURAL LEARNING STRUCTURES */}
            {/* =================================================================== */}

            {/* 1. CITADEL HQ (Knowledge Core - Center) */}
            <WorldBuildingNode
              building={{
                ...knowledgeCore,
                gridX: 50,
                gridY: 48,
              }}
              isSelected={selectedBuilding?.id === knowledgeCore.id}
              onClick={() => setSelectedBuilding(knowledgeCore)}
            />

            {/* 2. COURSE ACADEMY (Observatory Library - North-West) */}
            <WorldBuildingNode
              building={{
                ...courseAcademy,
                gridX: 28,
                gridY: 32,
              }}
              isSelected={selectedBuilding?.id === courseAcademy.id}
              onClick={() => setSelectedBuilding(courseAcademy)}
            />

            {/* 3. SKILL LAB (Alchemical Cauldron - West) */}
            <WorldBuildingNode
              building={{
                ...skillLab,
                gridX: 26,
                gridY: 64,
              }}
              isSelected={selectedBuilding?.id === skillLab.id}
              onClick={() => setSelectedBuilding(skillLab)}
            />

            {/* 4. CHALLENGE ARENA (Battle Colosseum - North-East) */}
            <WorldBuildingNode
              building={{
                ...challengeArena,
                gridX: 72,
                gridY: 32,
              }}
              isSelected={selectedBuilding?.id === challengeArena.id}
              onClick={() => setSelectedBuilding(challengeArena)}
            />

            {/* 5. REWARD VAULT (Treasury Gold Reserves - East) */}
            <WorldBuildingNode
              building={{
                ...rewardVault,
                gridX: 74,
                gridY: 64,
              }}
              isSelected={selectedBuilding?.id === rewardVault.id}
              onClick={() => setSelectedBuilding(rewardVault)}
            />

            {/* 6. PRACTICE FORGE (Project Valley - North-Center) */}
            <WorldBuildingNode
              building={{
                ...practiceGrounds,
                gridX: 50,
                gridY: 22,
              }}
              isSelected={selectedBuilding?.id === practiceGrounds.id}
              onClick={() => setSelectedBuilding(practiceGrounds)}
            />

            {/* 7. CAREER CITY (Industry Relay - South-Center) */}
            <WorldBuildingNode
              building={{
                ...careerHub,
                gridX: 50,
                gridY: 78,
              }}
              isSelected={selectedBuilding?.id === careerHub.id}
              onClick={() => setSelectedBuilding(careerHub)}
            />

            {/* =================================================================== */}
            {/* F. AUTONOMOUS ANIMATED WORKERS WALKING ALONG PATHWAYS */}
            {/* =================================================================== */}
            <WorkerCharacter
              startPos={{ x: 50, y: 48 }}
              endPos={{ x: 28, y: 32 }}
              speed={7}
              resource="wood"
              color="#38BDF8"
              name="Builder 1"
            />
            <WorkerCharacter
              startPos={{ x: 50, y: 48 }}
              endPos={{ x: 72, y: 32 }}
              speed={8}
              resource="gold"
              color="#F59E0B"
              name="Builder 2"
            />
            <WorkerCharacter
              startPos={{ x: 50, y: 48 }}
              endPos={{ x: 26, y: 64 }}
              speed={6}
              resource="crystal"
              color="#A855F7"
              name="Builder 3"
            />
            <WorkerCharacter
              startPos={{ x: 50, y: 48 }}
              endPos={{ x: 50, y: 22 }}
              speed={5}
              resource="hammer"
              color="#EF4444"
              name="Smith"
            />

            {/* Upgrade Burst Particle */}
            {upgradeBurst && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-40">
                <div className="p-5 rounded-3xl bg-[#0F172A]/90 border-2 border-amber-400 shadow-[0_0_40px_rgba(250,204,21,0.9)] text-center space-y-1 animate-bounce">
                  <span className="text-3xl">⭐</span>
                  <h3 className="font-sans font-black text-lg text-amber-300">
                    STRUCTURE UPGRADED!
                  </h3>
                  <p className="font-mono text-xs text-white">
                    Territory Power Increased! +150 XP
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. BOTTOM HUD ACTION CONTROLS */}
      <div className="fixed bottom-3 inset-x-3 z-30 pointer-events-none flex justify-between items-end max-w-lg mx-auto">
        {/* Left: Quest Attack Battle Button */}
        <Link
          href="/quest"
          className="pointer-events-auto h-11 px-3.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-mono font-bold text-xs flex items-center gap-1.5 border border-amber-300 shadow-[0_6px_20px_rgba(220,38,38,0.6)] active:scale-95 transition-all cursor-pointer"
        >
          <Swords className="w-4 h-4 fill-white" />
          <span>ATTACK / QUEST</span>
        </Link>

        {/* Center: Quick Auto-Fit View Button */}
        <button
          type="button"
          onClick={resetToAutoFit}
          className="pointer-events-auto h-9 px-2.5 rounded-lg bg-[#0F172A]/90 hover:bg-slate-800 text-emerald-300 font-mono text-[11px] font-bold flex items-center gap-1 border border-emerald-500/40 backdrop-blur-md shadow-md active:scale-95 transition-all cursor-pointer"
          title="Reset Camera Framing"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Fit View</span>
        </button>

        {/* Right: Village HQ */}
        <button
          type="button"
          onClick={() => setSelectedBuilding(knowledgeCore)}
          className="pointer-events-auto h-11 px-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold text-xs flex items-center gap-1.5 border border-cyan-300 shadow-[0_6px_20px_rgba(2,132,199,0.6)] active:scale-95 transition-all cursor-pointer"
        >
          <Compass className="w-4 h-4 fill-white" />
          <span>VILLAGE HQ</span>
        </button>
      </div>

      {/* 4. BUILDING INSPECTION DETAIL MODAL */}
      <BuildingDetailModal
        building={selectedBuilding}
        onClose={() => setSelectedBuilding(null)}
        onUpgrade={handleUpgradeBuilding}
      />
    </div>
  );
}
