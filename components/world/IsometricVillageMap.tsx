'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlayableGameWorldData, LearningZone } from '@/lib/engine/gameWorldAdapter';
import GameTopHud from './GameTopHud';
import IsometricGameBuilding from './IsometricGameBuilding';
import BuildingActionPopup from './BuildingActionPopup';
import Link from 'next/link';
import { Swords, Compass, Maximize2, ShieldCheck, Flame, Hammer, Star, Sparkles, Navigation } from 'lucide-react';

interface IsometricVillageMapProps {
  worldData: PlayableGameWorldData;
}

const VILLAGE_WIDTH = 760;
const VILLAGE_HEIGHT = 760;

export default function IsometricVillageMap({ worldData }: IsometricVillageMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-fit Zoom & Pan State
  const [zoom, setZoom] = useState<number>(1);
  const [baseAutoFitScale, setBaseAutoFitScale] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastTouchDistRef = useRef<number | null>(null);

  // Selected Building for Inspection Sheet
  const [selectedBuilding, setSelectedBuilding] = useState<LearningZone | null>(null);

  // Auto-fit camera calculation on mount and resize
  const calculateAutoFit = useCallback(() => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth || window.innerWidth;
    const containerHeight = containerRef.current.clientHeight || window.innerHeight;

    // Available space accounting for Top HUD (60px) and Bottom Nav (70px)
    const availableWidth = containerWidth - 16;
    const availableHeight = containerHeight - 130;

    const scaleX = availableWidth / VILLAGE_WIDTH;
    const scaleY = availableHeight / VILLAGE_HEIGHT;
    const optimalScale = Math.min(scaleX, scaleY, 1.35);

    const safeScale = Math.max(0.40, Math.min(optimalScale, 1.2));
    setBaseAutoFitScale(safeScale);
    setZoom(safeScale);
    setPan({ x: 0, y: 8 }); // Centered base
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
      setZoom((prev) => Math.min(1.6, Math.max(0.38, prev * factor)));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    lastTouchDistRef.current = null;
  };

  // Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const newZoom = Math.min(1.6, Math.max(0.38, zoom - e.deltaY * 0.0012));
    setZoom(newZoom);
  };

  const resetToAutoFit = () => {
    setZoom(baseAutoFitScale);
    setPan({ x: 0, y: 8 });
  };

  const { buildings, zones, mentor } = worldData;

  // Resolve 7 Core Strategy Locations
  const learningCamp = buildings.knowledgeCore || zones.learningCamp;
  const skillDistrict = buildings.courseAcademy || zones.skillDistrict;
  const projectValley = buildings.practiceGrounds || zones.projectValley;
  const challengeArena = buildings.challengeArena || zones.challengeArena;
  const rewardVault = buildings.rewardVault || zones.learningCamp;
  const skillLab = buildings.skillLab || zones.skillDistrict;
  const careerCity = buildings.careerHub || zones.careerCity;

  // Identify Recommended Next Best Action Target
  const recommendedId = mentor?.recommendedConceptId || skillDistrict.id;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[100dvh] overflow-hidden select-none bg-[#09180E] font-sans touch-none"
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
        onOpenHQ={() => setSelectedBuilding(learningCamp)}
      />

      {/* 2. AUTO-FRAMED CONTINUOUS ISOMETRIC VILLAGE CANVAS */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="relative transition-transform duration-75 ease-out shrink-0 pointer-events-auto"
          style={{
            width: `${VILLAGE_WIDTH}px`,
            height: `${VILLAGE_HEIGHT}px`,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          {/* =================================================================== */}
          {/* A. LUSH ORGANIC TERRAIN WITH ELEVATIONS, HILLS & RIVER */}
          {/* =================================================================== */}
          <div className="relative w-full h-full rounded-[56px] shadow-[0_30px_100px_rgba(0,0,0,0.95)] overflow-hidden border-4 border-[#1B4332] bg-gradient-to-br from-[#2D6A4F] via-[#20523B] to-[#143621]">
            
            {/* Multi-layered Organic Meadow Gradient Blends */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,_#40916C_0%,_#2D6A4F_45%,_#1B4332_100%)] opacity-90" />

            {/* Elevated Hillock Contours */}
            <div className="absolute top-[18%] left-[22%] w-60 h-44 rounded-[40px] bg-[#52B788]/20 blur-[12px] pointer-events-none" />
            <div className="absolute bottom-[20%] right-[22%] w-64 h-48 rounded-[50px] bg-[#52B788]/15 blur-[14px] pointer-events-none" />

            {/* West Flowing River Stream with Stone Embankments & Animated Water */}
            <div className="absolute top-0 bottom-0 left-0 w-22 bg-gradient-to-r from-[#0369A1] via-[#0284C7] to-[#0D9488] border-r-4 border-[#CA8A04] shadow-2xl flex flex-col justify-around items-center overflow-hidden">
              <div className="w-full h-8 bg-white/25 blur-[1px] -rotate-6 animate-pulse" />
              <div className="w-full h-8 bg-white/15 blur-[1px] -rotate-6 animate-pulse" />
              <div className="w-full h-8 bg-white/20 blur-[1px] -rotate-6 animate-pulse" />
              <div className="w-full h-8 bg-white/15 blur-[1px] -rotate-6 animate-pulse" />
            </div>

            {/* =================================================================== */}
            {/* B. ORGANIC WINDING COBBLESTONE & DIRT TRAILS */}
            {/* =================================================================== */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 760 760"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Soft Earth Under-Path Shadow */}
              <path
                d="M 120 370 Q 220 360 380 370 T 640 370 M 380 130 Q 370 240 380 370 T 380 630 M 230 250 Q 300 310 380 370 T 540 490 M 540 250 Q 460 310 380 370 T 230 490"
                stroke="#451A03"
                strokeWidth="32"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.45"
              />

              {/* Main Cobblestone Trail */}
              <path
                d="M 120 370 Q 220 360 380 370 T 640 370 M 380 130 Q 370 240 380 370 T 380 630 M 230 250 Q 300 310 380 370 T 540 490 M 540 250 Q 460 310 380 370 T 230 490"
                stroke="#B45309"
                strokeWidth="24"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.8"
              />

              {/* Inner Cobble Pattern Texture */}
              <path
                d="M 120 370 Q 220 360 380 370 T 640 370 M 380 130 Q 370 240 380 370 T 380 630 M 230 250 Q 300 310 380 370 T 540 490 M 540 250 Q 460 310 380 370 T 230 490"
                stroke="#D97706"
                strokeWidth="16"
                strokeDasharray="6 8"
                strokeLinecap="round"
                opacity="0.75"
              />

              {/* Central Village Plaza Circle */}
              <circle
                cx="380"
                cy="370"
                r="70"
                fill="#B45309"
                fillOpacity="0.5"
                stroke="#D97706"
                strokeWidth="4"
                strokeDasharray="8 6"
              />
            </svg>

            {/* =================================================================== */}
            {/* C. PERIMETER DENSE PINE & OAK FOREST BORDER */}
            {/* =================================================================== */}
            {/* North Border Tree Canopy */}
            <div className="absolute top-0 inset-x-0 h-14 bg-[#143621] flex justify-around items-center px-4 border-b-2 border-[#0D2416] z-10">
              {['🌲', '🌳', '🌲', '🌴', '🌳', '🌲', '🌳', '🌲', '🌴', '🌲', '🌳', '🌲', '🌴'].map((t, i) => (
                <span key={`nt-${i}`} className="text-2xl drop-shadow-md transform hover:scale-110 transition-transform">
                  {t}
                </span>
              ))}
            </div>

            {/* South Border Tree Canopy */}
            <div className="absolute bottom-0 inset-x-0 h-14 bg-[#143621] flex justify-around items-center px-4 border-t-2 border-[#0D2416] z-10">
              {['🌳', '🌲', '🌴', '🌲', '🌳', '🌲', '🌳', '🌴', '🌲', '🌳', '🌲', '🌳', '🌲'].map((t, i) => (
                <span key={`st-${i}`} className="text-2xl drop-shadow-md transform hover:scale-110 transition-transform">
                  {t}
                </span>
              ))}
            </div>

            {/* East Border Tree Canopy */}
            <div className="absolute right-0 top-0 bottom-0 w-14 bg-[#143621] flex flex-col justify-around items-center py-4 border-l-2 border-[#0D2416] z-10">
              {['🌲', '🌳', '🌲', '🌴', '🌳', '🌲', '🌳', '🌲'].map((t, i) => (
                <span key={`et-${i}`} className="text-2xl drop-shadow-md transform hover:scale-110 transition-transform">
                  {t}
                </span>
              ))}
            </div>

            {/* =================================================================== */}
            {/* D. DEFENSIVE STONE WALLS & WOODEN PALISADES */}
            {/* =================================================================== */}
            {/* North Stone Wall Section with Corner Bastions */}
            <div className="absolute top-[36%] left-[34%] right-[34%] h-3.5 bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 rounded-sm border border-slate-600 shadow-sm flex justify-between px-1 pointer-events-none z-10">
              <span className="w-2 h-full bg-slate-700 shadow-sm" />
              <span className="w-2 h-full bg-slate-700 shadow-sm" />
            </div>

            {/* West Stone Wall Section */}
            <div className="absolute top-[26%] bottom-[42%] left-[17%] w-3.5 bg-gradient-to-b from-slate-400 via-slate-200 to-slate-400 rounded-sm border border-slate-600 shadow-sm pointer-events-none z-10" />

            {/* East Stone Wall Section */}
            <div className="absolute top-[26%] bottom-[42%] right-[17%] w-3.5 bg-gradient-to-b from-slate-400 via-slate-200 to-slate-400 rounded-sm border border-slate-600 shadow-sm pointer-events-none z-10" />

            {/* Wooden Palisade Fences */}
            <div className="absolute top-[21%] right-[28%] flex gap-0.5 pointer-events-none z-10">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="w-1.5 h-4.5 bg-[#78350F] rounded-t-sm border-t border-amber-400 shadow-xs" />
              ))}
            </div>

            <div className="absolute top-[21%] left-[28%] flex gap-0.5 pointer-events-none z-10">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="w-1.5 h-4.5 bg-[#78350F] rounded-t-sm border-t border-amber-400 shadow-xs" />
              ))}
            </div>

            {/* =================================================================== */}
            {/* E. NATURAL PROPS: CAMPFIRE, LUMBER, QUARRY, FLOWERS */}
            {/* =================================================================== */}
            {/* Center Campfire */}
            <div className="absolute left-[50%] top-[58%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-15">
              <div className="w-8 h-8 rounded-full bg-amber-950 border-2 border-amber-700 flex items-center justify-center shadow-lg">
                <span className="text-base animate-bounce">🔥</span>
              </div>
              <span className="text-[9px] font-mono text-amber-200 font-black tracking-wider">CAMPFIRE</span>
            </div>

            {/* Lumber Processing Yard */}
            <div className="absolute left-[33%] top-[23%] flex items-center gap-1.5 p-1 px-2 bg-amber-950/70 rounded-xl border border-amber-700/80 shadow-md pointer-events-none z-15">
              <span className="text-lg">🪵</span>
              <span className="text-[9px] font-mono font-black text-amber-300">LUMBER</span>
            </div>

            {/* Gold Quarry Vein */}
            <div className="absolute right-[31%] top-[23%] flex items-center gap-1.5 p-1 px-2 bg-slate-900/80 rounded-xl border border-amber-500/60 shadow-md pointer-events-none z-15">
              <span className="text-lg">⛏️</span>
              <span className="text-[9px] font-mono font-black text-yellow-300">QUARRY</span>
            </div>

            {/* Flowerbeds & Environmental Props */}
            <div className="absolute top-[28%] left-[45%] text-sm z-10">🌸🌼🌸</div>
            <div className="absolute top-[68%] left-[32%] text-sm z-10">🌺🌷🌺</div>
            <div className="absolute top-[68%] right-[32%] text-sm z-10">🌻🌹🌻</div>
            <div className="absolute top-[48%] left-[24%] text-xs z-10">🍄🪨</div>
            <div className="absolute top-[48%] right-[24%] text-xs z-10">🪨🍄</div>

            {/* =================================================================== */}
            {/* F. ANIMATED LIVING WORLD CHARACTERS */}
            {/* =================================================================== */}
            {/* Learner Hero Avatar on Trail */}
            <div className="absolute left-[44%] top-[50%] z-25 flex flex-col items-center pointer-events-none animate-pulse">
              <div className="w-6 h-6 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center text-xs shadow-md">
                🧙
              </div>
              <span className="text-[8px] font-mono font-black text-white bg-indigo-950/80 px-1 rounded">
                YOU
              </span>
            </div>

            {/* Builder Apprentice in Project Valley */}
            <div className="absolute left-[34%] top-[60%] z-25 flex flex-col items-center pointer-events-none">
              <span className="text-base animate-bounce">🔨</span>
              <span className="text-[7px] font-mono text-amber-200 bg-black/60 px-1 rounded">
                BUILDER
              </span>
            </div>

            {/* Scholar in Skill District */}
            <div className="absolute left-[36%] top-[34%] z-25 flex flex-col items-center pointer-events-none">
              <span className="text-base">📜</span>
              <span className="text-[7px] font-mono text-cyan-200 bg-black/60 px-1 rounded">
                SCHOLAR
              </span>
            </div>

            {/* Miner in Quarry */}
            <div className="absolute right-[33%] top-[30%] z-25 flex flex-col items-center pointer-events-none">
              <span className="text-base animate-pulse">⛏️</span>
              <span className="text-[7px] font-mono text-yellow-200 bg-black/60 px-1 rounded">
                MINER
              </span>
            </div>

            {/* =================================================================== */}
            {/* G. 7 HANDCRAFTED 2.5D ORIGINAL LEARNING DESTINATIONS */}
            {/* =================================================================== */}

            {/* 1. LEARNING CAMP (Center Base Pioneer Keep) */}
            <IsometricGameBuilding
              building={{
                ...learningCamp,
                name: 'Learning Camp',
                gridX: 50,
                gridY: 48,
              }}
              isSelected={selectedBuilding?.id === learningCamp.id}
              isRecommended={recommendedId === learningCamp.id}
              onClick={() => setSelectedBuilding(learningCamp)}
            />

            {/* 2. SKILL DISTRICT (Academy Library - North-West) */}
            <IsometricGameBuilding
              building={{
                ...skillDistrict,
                name: 'Skill District',
                gridX: 28,
                gridY: 30,
              }}
              isSelected={selectedBuilding?.id === skillDistrict.id}
              isRecommended={recommendedId === skillDistrict.id}
              onClick={() => setSelectedBuilding(skillDistrict)}
            />

            {/* 3. PROJECT VALLEY (Forge & Workshop - South-West) */}
            <IsometricGameBuilding
              building={{
                ...projectValley,
                name: 'Project Valley',
                gridX: 27,
                gridY: 65,
              }}
              isSelected={selectedBuilding?.id === projectValley.id}
              isRecommended={recommendedId === projectValley.id}
              onClick={() => setSelectedBuilding(projectValley)}
            />

            {/* 4. CHALLENGE ARENA (Colosseum Duel Pit - North-East) */}
            <IsometricGameBuilding
              building={{
                ...challengeArena,
                name: 'Challenge Arena',
                gridX: 73,
                gridY: 30,
              }}
              isSelected={selectedBuilding?.id === challengeArena.id}
              isRecommended={recommendedId === challengeArena.id}
              onClick={() => setSelectedBuilding(challengeArena)}
            />

            {/* 5. REWARD VAULT (Gold & Gem Reserves - South-East) */}
            <IsometricGameBuilding
              building={{
                ...rewardVault,
                name: 'Reward Vault',
                gridX: 74,
                gridY: 65,
              }}
              isSelected={selectedBuilding?.id === rewardVault.id}
              isRecommended={recommendedId === rewardVault.id}
              onClick={() => setSelectedBuilding(rewardVault)}
            />

            {/* 6. CAREER CITY (Summit Spire - South Peak) */}
            <IsometricGameBuilding
              building={{
                ...careerCity,
                name: 'Career City',
                gridX: 50,
                gridY: 74,
              }}
              isSelected={selectedBuilding?.id === careerCity.id}
              isRecommended={recommendedId === careerCity.id}
              onClick={() => setSelectedBuilding(careerCity)}
            />

            {/* 7. SKILL LAB (Alchemical Cauldron - North Peak) */}
            <IsometricGameBuilding
              building={{
                ...skillLab,
                name: 'Skill Lab',
                gridX: 50,
                gridY: 20,
              }}
              isSelected={selectedBuilding?.id === skillLab.id}
              isRecommended={recommendedId === skillLab.id}
              onClick={() => setSelectedBuilding(skillLab)}
            />

          </div>
        </div>
      </div>

      {/* 3. FLOATING VIEW CONTROLS & NEXT BEST ACTION CHIP */}
      <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2 pointer-events-auto">
        <button
          type="button"
          onClick={resetToAutoFit}
          className="h-10 px-3.5 rounded-full bg-slate-900/90 border border-amber-400/60 text-amber-300 font-mono text-xs font-bold flex items-center gap-1.5 shadow-[0_8px_20px_rgba(0,0,0,0.8)] backdrop-blur-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Fit View</span>
        </button>
      </div>

      {/* 4. BUILDING INSPECTION MODAL / SHEET */}
      <BuildingActionPopup
        building={selectedBuilding}
        onClose={() => setSelectedBuilding(null)}
      />
    </div>
  );
}
