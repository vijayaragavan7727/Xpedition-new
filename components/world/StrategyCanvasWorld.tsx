'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlayableGameWorldData, LearningZone } from '@/lib/engine/gameWorldAdapter';
import GameTopHud from './GameTopHud';
import BuildingActionPopup from './BuildingActionPopup';
import { Maximize2 } from 'lucide-react';

interface StrategyCanvasWorldProps {
  worldData: PlayableGameWorldData;
}

// Fixed World Map Dimensions
const MAP_WIDTH = 840;
const MAP_HEIGHT = 840;

interface WorldObject {
  id: string;
  type: 'building' | 'character' | 'tree' | 'prop' | 'resource';
  x: number;
  y: number;
  width: number;
  height: number;
  render: (ctx: CanvasRenderingContext2D, time: number, isSelected: boolean, isRecommended: boolean) => void;
  zoneData?: LearningZone;
  clickable?: boolean;
}

export default function StrategyCanvasWorld({ worldData }: StrategyCanvasWorldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Camera & Transform State
  const [zoom, setZoom] = useState<number>(1);
  const [baseAutoFitScale, setBaseAutoFitScale] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMovedRef = useRef<boolean>(false);
  const lastTouchDistRef = useRef<number | null>(null);

  // Selected building for bottom sheet
  const [selectedBuilding, setSelectedBuilding] = useState<LearningZone | null>(null);

  const { buildings, zones, mentor } = worldData;

  // Resolve 7 Core Strategy Locations
  const learningCamp = buildings.knowledgeCore || zones.learningCamp;
  const skillDistrict = buildings.courseAcademy || zones.skillDistrict;
  const projectValley = buildings.practiceGrounds || zones.projectValley;
  const challengeArena = buildings.challengeArena || zones.challengeArena;
  const rewardVault = buildings.rewardVault || zones.learningCamp;
  const careerCity = buildings.careerHub || zones.careerCity;
  const skillLab = buildings.skillLab || zones.skillDistrict;

  // Identify Recommended Target
  const recommendedId = mentor?.recommendedConceptId || skillDistrict.id;

  // Auto-fit calculation for mobile screens
  const calculateAutoFit = useCallback(() => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth || window.innerWidth;
    const containerHeight = containerRef.current.clientHeight || window.innerHeight;

    const availableWidth = containerWidth;
    const availableHeight = containerHeight - 110;

    const scaleX = availableWidth / MAP_WIDTH;
    const scaleY = availableHeight / MAP_HEIGHT;
    const optimalScale = Math.min(scaleX, scaleY, 1.25);

    const safeScale = Math.max(0.40, Math.min(optimalScale, 1.15));
    setBaseAutoFitScale(safeScale);
    setZoom(safeScale);
    setPan({
      x: (containerWidth - MAP_WIDTH * safeScale) / 2,
      y: (containerHeight - MAP_HEIGHT * safeScale) / 2,
    });
  }, []);

  useEffect(() => {
    calculateAutoFit();
    window.addEventListener('resize', calculateAutoFit);
    return () => window.removeEventListener('resize', calculateAutoFit);
  }, [calculateAutoFit]);

  // Handle building click from world coordinates
  const handleMapClick = (screenX: number, screenY: number) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = (screenX - rect.left - pan.x) / zoom;
    const clickY = (screenY - rect.top - pan.y) / zoom;

    // Building hit-boxes (centered on building base)
    const buildingTargets: { zone: LearningZone; x: number; y: number; radius: number }[] = [
      { zone: learningCamp, x: 420, y: 410, radius: 55 },
      { zone: skillDistrict, x: 240, y: 270, radius: 50 },
      { zone: projectValley, x: 230, y: 550, radius: 50 },
      { zone: challengeArena, x: 610, y: 270, radius: 52 },
      { zone: rewardVault, x: 620, y: 550, radius: 48 },
      { zone: careerCity, x: 420, y: 640, radius: 55 },
      { zone: skillLab, x: 420, y: 190, radius: 48 },
    ];

    for (const b of buildingTargets) {
      const dist = Math.hypot(clickX - b.x, clickY - b.y);
      if (dist <= b.radius) {
        setSelectedBuilding(b.zone);
        return;
      }
    }
  };

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

  const handleMouseUp = (e: React.MouseEvent) => {
    setIsDragging(false);
    if (!hasMovedRef.current) {
      handleMapClick(e.clientX, e.clientY);
    }
  };

  // Touch Handlers for Mobile Pan & Pinch Zoom
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
      setZoom((prev) => Math.min(1.5, Math.max(0.38, prev * factor)));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsDragging(false);
    if (!hasMovedRef.current && e.changedTouches.length === 1) {
      handleMapClick(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    }
    lastTouchDistRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const newZoom = Math.min(1.5, Math.max(0.38, zoom - e.deltaY * 0.0012));
    setZoom(newZoom);
  };

  const resetToAutoFit = () => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth || window.innerWidth;
    const containerHeight = containerRef.current.clientHeight || window.innerHeight;
    setZoom(baseAutoFitScale);
    setPan({
      x: (containerWidth - MAP_WIDTH * baseAutoFitScale) / 2,
      y: (containerHeight - MAP_HEIGHT * baseAutoFitScale) / 2,
    });
  };

  // Main 60fps Canvas Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let startTime = performance.now();

    const render = () => {
      const time = (performance.now() - startTime) / 1000;
      const dpr = window.devicePixelRatio || 1;

      // Handle Canvas Sizing
      if (canvas.width !== canvas.clientWidth * dpr || canvas.height !== canvas.clientHeight * dpr) {
        canvas.width = canvas.clientWidth * dpr;
        canvas.height = canvas.clientHeight * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

      // Apply Camera Transform
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      // =========================================================================
      // 1. TERRAIN BASE LAYER (Lush Meadow, Grass Variations, River, and Trails)
      // =========================================================================
      drawTerrainBase(ctx, time);

      // =========================================================================
      // 2. Y-SORTED WORLD SCENE OBJECTS (Buildings, Trees, Characters, Props)
      // =========================================================================
      const sceneObjects: WorldObject[] = [];

      // 7 Core Buildings
      sceneObjects.push({
        id: learningCamp.id,
        type: 'building',
        x: 420,
        y: 410,
        width: 130,
        height: 120,
        zoneData: learningCamp,
        clickable: true,
        render: (c, t, isSel, isRec) => drawLearningCamp(c, t, 420, 410, isSel, isRec, learningCamp),
      });

      sceneObjects.push({
        id: skillDistrict.id,
        type: 'building',
        x: 240,
        y: 270,
        width: 120,
        height: 115,
        zoneData: skillDistrict,
        clickable: true,
        render: (c, t, isSel, isRec) => drawSkillDistrict(c, t, 240, 270, isSel, isRec, skillDistrict),
      });

      sceneObjects.push({
        id: projectValley.id,
        type: 'building',
        x: 230,
        y: 550,
        width: 125,
        height: 110,
        zoneData: projectValley,
        clickable: true,
        render: (c, t, isSel, isRec) => drawProjectValley(c, t, 230, 550, isSel, isRec, projectValley),
      });

      sceneObjects.push({
        id: challengeArena.id,
        type: 'building',
        x: 610,
        y: 270,
        width: 130,
        height: 110,
        zoneData: challengeArena,
        clickable: true,
        render: (c, t, isSel, isRec) => drawChallengeArena(c, t, 610, 270, isSel, isRec, challengeArena),
      });

      sceneObjects.push({
        id: rewardVault.id,
        type: 'building',
        x: 620,
        y: 550,
        width: 115,
        height: 105,
        zoneData: rewardVault,
        clickable: true,
        render: (c, t, isSel, isRec) => drawRewardVault(c, t, 620, 550, isSel, isRec, rewardVault),
      });

      sceneObjects.push({
        id: careerCity.id,
        type: 'building',
        x: 420,
        y: 640,
        width: 130,
        height: 135,
        zoneData: careerCity,
        clickable: true,
        render: (c, t, isSel, isRec) => drawCareerCity(c, t, 420, 640, isSel, isRec, careerCity),
      });

      sceneObjects.push({
        id: skillLab.id,
        type: 'building',
        x: 420,
        y: 190,
        width: 110,
        height: 105,
        zoneData: skillLab,
        clickable: true,
        render: (c, t, isSel, isRec) => drawSkillLab(c, t, 420, 190, isSel, isRec, skillLab),
      });

      // Resource Areas: Quarry & Lumber Yard
      sceneObjects.push({
        id: 'quarry_node',
        type: 'resource',
        x: 520,
        y: 205,
        width: 80,
        height: 60,
        render: (c, t) => drawQuarryZone(c, t, 520, 205),
      });

      sceneObjects.push({
        id: 'lumber_node',
        type: 'resource',
        x: 320,
        y: 205,
        width: 80,
        height: 60,
        render: (c, t) => drawLumberZone(c, t, 320, 205),
      });

      // Characters (Hero, Builder, Miner, Scholar, Trainer)
      sceneObjects.push({
        id: 'hero_avatar',
        type: 'character',
        x: 370 + Math.sin(time * 0.8) * 15,
        y: 430 + Math.cos(time * 0.8) * 8,
        width: 28,
        height: 36,
        render: (c, t) => drawCharacter(c, t, 370 + Math.sin(time * 0.8) * 15, 430 + Math.cos(time * 0.8) * 8, 'hero'),
      });

      sceneObjects.push({
        id: 'builder_npc',
        type: 'character',
        x: 275,
        y: 575,
        width: 24,
        height: 32,
        render: (c, t) => drawCharacter(c, t, 275, 575, 'builder'),
      });

      sceneObjects.push({
        id: 'miner_npc',
        type: 'character',
        x: 540,
        y: 220,
        width: 24,
        height: 32,
        render: (c, t) => drawCharacter(c, t, 540, 220, 'miner'),
      });

      sceneObjects.push({
        id: 'scholar_npc',
        type: 'character',
        x: 270,
        y: 310,
        width: 24,
        height: 32,
        render: (c, t) => drawCharacter(c, t, 270, 310, 'scholar'),
      });

      // Trees & Props for High Environmental Density
      const treePositions: { x: number; y: number; type: 'pine' | 'oak' }[] = [
        { x: 140, y: 190, type: 'pine' },
        { x: 180, y: 150, type: 'oak' },
        { x: 230, y: 130, type: 'pine' },
        { x: 340, y: 120, type: 'oak' },
        { x: 490, y: 120, type: 'pine' },
        { x: 600, y: 140, type: 'oak' },
        { x: 680, y: 180, type: 'pine' },
        { x: 720, y: 240, type: 'oak' },
        { x: 740, y: 350, type: 'pine' },
        { x: 720, y: 460, type: 'oak' },
        { x: 710, y: 580, type: 'pine' },
        { x: 670, y: 680, type: 'oak' },
        { x: 570, y: 720, type: 'pine' },
        { x: 480, y: 740, type: 'oak' },
        { x: 350, y: 730, type: 'pine' },
        { x: 240, y: 710, type: 'oak' },
        { x: 170, y: 660, type: 'pine' },
        { x: 130, y: 560, type: 'oak' },
        { x: 130, y: 430, type: 'pine' },
        { x: 140, y: 310, type: 'oak' },
        // Interior cluster trees
        { x: 330, y: 340, type: 'pine' },
        { x: 505, y: 340, type: 'oak' },
        { x: 340, y: 490, type: 'oak' },
        { x: 510, y: 490, type: 'pine' },
      ];

      treePositions.forEach((tp, idx) => {
        sceneObjects.push({
          id: `tree_${idx}`,
          type: 'tree',
          x: tp.x,
          y: tp.y,
          width: 36,
          height: 48,
          render: (c, t) => drawTree(c, t, tp.x, tp.y, tp.type),
        });
      });

      // Sort by Y-coordinate for genuine 2.5D visual depth
      sceneObjects.sort((a, b) => a.y - b.y);

      // Render all sorted objects
      sceneObjects.forEach((obj) => {
        const isSel = selectedBuilding?.id === obj.id;
        const isRec = recommendedId === obj.id;
        obj.render(ctx, time, isSel, isRec);
      });

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [pan, zoom, selectedBuilding, recommendedId, learningCamp, skillDistrict, projectValley, challengeArena, rewardVault, careerCity, skillLab]);

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
      {/* 1. TOP STRATEGY HUD */}
      <GameTopHud
        worldData={worldData}
        onOpenHQ={() => setSelectedBuilding(learningCamp)}
      />

      {/* 2. HIGH-DPI STRATEGY GAME CANVAS */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />

      {/* 3. FLOATING CAMERA CONTROLS */}
      <div className="fixed bottom-20 right-4 z-40 pointer-events-auto">
        <button
          type="button"
          onClick={resetToAutoFit}
          className="h-10 px-4 rounded-full bg-slate-900/90 border border-amber-400/60 text-amber-300 font-mono text-xs font-bold flex items-center gap-1.5 shadow-[0_8px_20px_rgba(0,0,0,0.85)] backdrop-blur-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Fit View</span>
        </button>
      </div>

      {/* 4. BUILDING INSPECTION BOTTOM SHEET */}
      <BuildingActionPopup
        building={selectedBuilding}
        onClose={() => setSelectedBuilding(null)}
      />
    </div>
  );
}

// =============================================================================
// TERRAIN RENDERING (Organic Grass, Trails, River & Stone Ramparts)
// =============================================================================
function drawTerrainBase(ctx: CanvasRenderingContext2D, time: number) {
  // Ground Meadow
  const groundGrad = ctx.createRadialGradient(420, 420, 50, 420, 420, 480);
  groundGrad.addColorStop(0, '#3E8E68');
  groundGrad.addColorStop(0.5, '#2D6A4F');
  groundGrad.addColorStop(1, '#1B4332');

  ctx.fillStyle = groundGrad;
  ctx.beginPath();
  ctx.roundRect(40, 40, MAP_WIDTH - 80, MAP_HEIGHT - 80, 50);
  ctx.fill();

  // Natural River Flowing along the Western Edge
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(70, 40);
  ctx.bezierCurveTo(110, 200, 60, 400, 110, 600);
  ctx.bezierCurveTo(130, 690, 80, 780, 80, 800);
  ctx.lineTo(40, 800);
  ctx.lineTo(40, 40);
  ctx.closePath();

  const waterGrad = ctx.createLinearGradient(40, 0, 120, 0);
  waterGrad.addColorStop(0, '#0284C7');
  waterGrad.addColorStop(0.5, '#0369A1');
  waterGrad.addColorStop(1, '#0F766E');
  ctx.fillStyle = waterGrad;
  ctx.fill();

  // Animated Water Wave Shimmers
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 7; i++) {
    const wy = 80 + i * 100 + Math.sin(time * 2 + i) * 8;
    const wx = 65 + Math.cos(time * 1.5 + i) * 12;
    ctx.beginPath();
    ctx.arc(wx, wy, 14, 0.2, 2.8);
    ctx.stroke();
  }
  ctx.restore();

  // Organic Cobblestone & Dirt Paths
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Path Under-Shadow
  ctx.strokeStyle = 'rgba(46, 18, 4, 0.45)';
  ctx.lineWidth = 36;
  drawMainTrails(ctx);

  // Main Sand & Cobble Trail
  ctx.strokeStyle = '#B45309';
  ctx.lineWidth = 26;
  drawMainTrails(ctx);

  // Cobblestone Texture Pattern
  ctx.strokeStyle = '#D97706';
  ctx.lineWidth = 18;
  ctx.setLineDash([8, 10]);
  drawMainTrails(ctx);

  // Central Village Plaza Circle
  ctx.setLineDash([]);
  ctx.fillStyle = '#B45309';
  ctx.beginPath();
  ctx.arc(420, 420, 75, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#D97706';
  ctx.lineWidth = 4;
  ctx.setLineDash([8, 6]);
  ctx.stroke();

  ctx.restore();
}

function drawMainTrails(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  // Center to Skill District
  ctx.moveTo(420, 420);
  ctx.quadraticCurveTo(310, 360, 240, 270);

  // Center to Project Valley
  ctx.moveTo(420, 420);
  ctx.quadraticCurveTo(310, 500, 230, 550);

  // Center to Challenge Arena
  ctx.moveTo(420, 420);
  ctx.quadraticCurveTo(530, 360, 610, 270);

  // Center to Reward Vault
  ctx.moveTo(420, 420);
  ctx.quadraticCurveTo(530, 500, 620, 550);

  // Center to Career City
  ctx.moveTo(420, 420);
  ctx.lineTo(420, 640);

  // Center to Skill Lab
  ctx.moveTo(420, 420);
  ctx.lineTo(420, 190);

  ctx.stroke();
}

// =============================================================================
// ILLUSTRATED 2.5D BUILDINGS
// =============================================================================

// 1. LEARNING CAMP (Pioneer Log Lodge & Campfire)
function drawLearningCamp(
  ctx: CanvasRenderingContext2D,
  time: number,
  x: number,
  y: number,
  isSel: boolean,
  isRec: boolean,
  zone: LearningZone
) {
  // Soft Ground Shadow
  drawGroundShadow(ctx, x, y + 25, 60, 20);

  ctx.save();
  ctx.translate(x, y);

  // Selection Glow
  if (isSel) {
    ctx.shadowColor = '#FBBF24';
    ctx.shadowBlur = 24;
  }

  // Next Best Action Spotlight Beacon
  if (isRec) {
    drawNextQuestBeacon(ctx, 0, -68, time);
  }

  // Solid Log Base Walls
  const wallGrad = ctx.createLinearGradient(-45, -20, 45, 20);
  wallGrad.addColorStop(0, '#78350F');
  wallGrad.addColorStop(1, '#451A03');
  ctx.fillStyle = wallGrad;
  ctx.beginPath();
  ctx.roundRect(-42, -15, 84, 42, 6);
  ctx.fill();
  ctx.strokeStyle = '#2E1204';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Cedar Shake Pitched Roof
  const roofGrad = ctx.createLinearGradient(0, -55, 0, -10);
  roofGrad.addColorStop(0, '#D97706');
  roofGrad.addColorStop(0.4, '#B45309');
  roofGrad.addColorStop(1, '#78350F');
  ctx.fillStyle = roofGrad;
  ctx.beginPath();
  ctx.moveTo(0, -58);
  ctx.lineTo(50, -15);
  ctx.lineTo(-50, -15);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#FDE047';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Floating Knowledge Crystal
  const crystalY = -68 + Math.sin(time * 3) * 4;
  ctx.fillStyle = '#22D3EE';
  ctx.shadowColor = '#00F0FF';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(0, crystalY - 8);
  ctx.lineTo(6, crystalY);
  ctx.lineTo(0, crystalY + 8);
  ctx.lineTo(-6, crystalY);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  // Lit Arched Doorway & Windows
  ctx.fillStyle = '#FEF08A';
  ctx.shadowColor = '#FBBF24';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.roundRect(-10, 5, 20, 22, [6, 6, 0, 0]);
  ctx.fill();

  ctx.beginPath();
  ctx.roundRect(-32, -2, 12, 12, 3);
  ctx.roundRect(20, -2, 12, 12, 3);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Adjacent Campfire with Smoke
  drawCampfire(ctx, time, 48, 18);

  ctx.restore();
}

// 2. SKILL DISTRICT (Classical Domed Academy & Astrolabe)
function drawSkillDistrict(
  ctx: CanvasRenderingContext2D,
  time: number,
  x: number,
  y: number,
  isSel: boolean,
  isRec: boolean,
  zone: LearningZone
) {
  drawGroundShadow(ctx, x, y + 25, 55, 18);

  ctx.save();
  ctx.translate(x, y);

  if (isSel) {
    ctx.shadowColor = '#FBBF24';
    ctx.shadowBlur = 24;
  }

  if (isRec) {
    drawNextQuestBeacon(ctx, 0, -65, time);
  }

  // Stone Academy Base
  ctx.fillStyle = '#1E293B';
  ctx.beginPath();
  ctx.roundRect(-38, -12, 76, 40, 6);
  ctx.fill();
  ctx.strokeStyle = '#0EA5E9';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Marble Pillars
  ctx.fillStyle = '#E2E8F0';
  for (let i = -28; i <= 28; i += 18) {
    ctx.fillRect(i - 2, -10, 5, 24);
  }

  // Patina Copper Dome
  const domeGrad = ctx.createLinearGradient(0, -50, 0, -12);
  domeGrad.addColorStop(0, '#5EEAD4');
  domeGrad.addColorStop(0.6, '#0D9488');
  domeGrad.addColorStop(1, '#115E59');
  ctx.fillStyle = domeGrad;
  ctx.beginPath();
  ctx.arc(0, -12, 30, Math.PI, 0);
  ctx.fill();
  ctx.strokeStyle = '#99F6E4';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Rotating Astrolabe Rings
  ctx.save();
  ctx.translate(0, -46);
  ctx.rotate(time * 0.8);
  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Portal Arch
  ctx.fillStyle = '#082F49';
  ctx.beginPath();
  ctx.roundRect(-9, 8, 18, 20, [6, 6, 0, 0]);
  ctx.fill();

  ctx.restore();
}

// 3. PROJECT VALLEY (Blacksmith Forge, Watermill & Timber Workshop)
function drawProjectValley(
  ctx: CanvasRenderingContext2D,
  time: number,
  x: number,
  y: number,
  isSel: boolean,
  isRec: boolean,
  zone: LearningZone
) {
  drawGroundShadow(ctx, x, y + 25, 58, 18);

  ctx.save();
  ctx.translate(x, y);

  if (isSel) {
    ctx.shadowColor = '#FBBF24';
    ctx.shadowBlur = 24;
  }

  if (isRec) {
    drawNextQuestBeacon(ctx, 0, -62, time);
  }

  // Smoking Stone Chimney
  ctx.fillStyle = '#475569';
  ctx.fillRect(20, -50, 12, 35);
  drawSmokeParticle(ctx, time, 26, -52);

  // Workshop Walls
  ctx.fillStyle = '#78350F';
  ctx.beginPath();
  ctx.roundRect(-40, -10, 80, 38, 6);
  ctx.fill();
  ctx.strokeStyle = '#451A03';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Pitched Shingle Roof
  ctx.fillStyle = '#9A3412';
  ctx.beginPath();
  ctx.moveTo(0, -45);
  ctx.lineTo(46, -10);
  ctx.lineTo(-46, -10);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#F97316';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Glowing Forge Hearth
  ctx.fillStyle = '#F59E0B';
  ctx.shadowColor = '#EA580C';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.roundRect(-24, 6, 18, 18, 3);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Outdoor Worktable Anvil
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(10, 10, 18, 12);

  ctx.restore();
}

// 4. CHALLENGE ARENA (Colosseum Duel Pit & Flaming Braziers)
function drawChallengeArena(
  ctx: CanvasRenderingContext2D,
  time: number,
  x: number,
  y: number,
  isSel: boolean,
  isRec: boolean,
  zone: LearningZone
) {
  drawGroundShadow(ctx, x, y + 25, 62, 22);

  ctx.save();
  ctx.translate(x, y);

  if (isSel) {
    ctx.shadowColor = '#FBBF24';
    ctx.shadowBlur = 24;
  }

  if (isRec) {
    drawNextQuestBeacon(ctx, 0, -58, time);
  }

  // Fortified Stone Ring
  const colosseumGrad = ctx.createLinearGradient(0, -35, 0, 25);
  colosseumGrad.addColorStop(0, '#991B1B');
  colosseumGrad.addColorStop(0.5, '#7F1D1D');
  colosseumGrad.addColorStop(1, '#450A0A');
  ctx.fillStyle = colosseumGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, 48, 32, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#DC2626';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Inner Duel Pit Arena Floor
  ctx.fillStyle = '#D97706';
  ctx.beginPath();
  ctx.ellipse(0, 2, 32, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#FDE047';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Flaming Torch Braziers
  drawTorchBrazier(ctx, time, -40, -8);
  drawTorchBrazier(ctx, time, 40, -8);

  // Crossed Sword War Crest
  ctx.fillStyle = '#FEF08A';
  ctx.beginPath();
  ctx.arc(0, -36, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#B45309';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
}

// 5. REWARD VAULT (Ironbound Stone Treasury & Gold Ingot Reserves)
function drawRewardVault(
  ctx: CanvasRenderingContext2D,
  time: number,
  x: number,
  y: number,
  isSel: boolean,
  isRec: boolean,
  zone: LearningZone
) {
  drawGroundShadow(ctx, x, y + 25, 54, 18);

  ctx.save();
  ctx.translate(x, y);

  if (isSel) {
    ctx.shadowColor = '#FBBF24';
    ctx.shadowBlur = 24;
  }

  if (isRec) {
    drawNextQuestBeacon(ctx, 0, -56, time);
  }

  // Heavy Vault Stone Base
  ctx.fillStyle = '#1E293B';
  ctx.beginPath();
  ctx.roundRect(-34, -12, 68, 38, 6);
  ctx.fill();
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Golden Ingot Pyramid Roof
  const goldGrad = ctx.createLinearGradient(-35, -40, 35, -12);
  goldGrad.addColorStop(0, '#FDE047');
  goldGrad.addColorStop(0.5, '#F59E0B');
  goldGrad.addColorStop(1, '#B45309');
  ctx.fillStyle = goldGrad;
  ctx.beginPath();
  ctx.moveTo(0, -42);
  ctx.lineTo(38, -12);
  ctx.lineTo(-38, -12);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#FEF08A';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Vault Door Dial
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.arc(0, 6, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#FBBF24';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
}

// 6. CAREER CITY (Summit Spire & Academy Towers)
function drawCareerCity(
  ctx: CanvasRenderingContext2D,
  time: number,
  x: number,
  y: number,
  isSel: boolean,
  isRec: boolean,
  zone: LearningZone
) {
  drawGroundShadow(ctx, x, y + 25, 64, 20);

  ctx.save();
  ctx.translate(x, y);

  if (isSel) {
    ctx.shadowColor = '#FBBF24';
    ctx.shadowBlur = 24;
  }

  if (isRec) {
    drawNextQuestBeacon(ctx, 0, -82, time);
  }

  // Gilded Spire Sky Citadel
  const towerGrad = ctx.createLinearGradient(0, -75, 0, 25);
  towerGrad.addColorStop(0, '#3B0764');
  towerGrad.addColorStop(0.5, '#1E1B4B');
  towerGrad.addColorStop(1, '#0F172A');
  ctx.fillStyle = towerGrad;

  // Center Tall Spire
  ctx.beginPath();
  ctx.roundRect(-16, -65, 32, 88, [8, 8, 0, 0]);
  ctx.fill();
  ctx.strokeStyle = '#C084FC';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Left & Right Flanking Towers
  ctx.beginPath();
  ctx.roundRect(-42, -35, 24, 58, [6, 6, 0, 0]);
  ctx.roundRect(18, -35, 24, 58, [6, 6, 0, 0]);
  ctx.fill();
  ctx.stroke();

  // Satellite Relay Dish on Peak
  ctx.fillStyle = '#A855F7';
  ctx.beginPath();
  ctx.arc(0, -74, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#E9D5FF';
  ctx.stroke();

  // Lit Stained Glass Windows
  ctx.fillStyle = '#67E8F9';
  ctx.fillRect(-6, -45, 12, 16);
  ctx.fillRect(-34, -20, 8, 12);
  ctx.fillRect(26, -20, 8, 12);

  ctx.restore();
}

// 7. SKILL LAB (Alchemical Cauldron & Laboratory)
function drawSkillLab(
  ctx: CanvasRenderingContext2D,
  time: number,
  x: number,
  y: number,
  isSel: boolean,
  isRec: boolean,
  zone: LearningZone
) {
  drawGroundShadow(ctx, x, y + 22, 50, 16);

  ctx.save();
  ctx.translate(x, y);

  if (isSel) {
    ctx.shadowColor = '#FBBF24';
    ctx.shadowBlur = 24;
  }

  if (isRec) {
    drawNextQuestBeacon(ctx, 0, -56, time);
  }

  // Stone Lab Base
  ctx.fillStyle = '#1E293B';
  ctx.beginPath();
  ctx.roundRect(-30, -10, 60, 34, 6);
  ctx.fill();
  ctx.strokeStyle = '#A855F7';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Glass Alembic Vat with Purple Mana
  ctx.fillStyle = '#9333EA';
  ctx.shadowColor = '#C084FC';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(0, -22, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.restore();
}

// =============================================================================
// RESOURCE NODES & PROPS (Quarry & Lumber Yard)
// =============================================================================
function drawQuarryZone(ctx: CanvasRenderingContext2D, time: number, x: number, y: number) {
  drawGroundShadow(ctx, x, y + 15, 45, 14);
  ctx.save();
  ctx.translate(x, y);

  // Stone Boulders
  ctx.fillStyle = '#64748B';
  ctx.beginPath();
  ctx.arc(-14, 0, 16, 0, Math.PI * 2);
  ctx.arc(10, -4, 18, 0, Math.PI * 2);
  ctx.arc(4, 8, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Exposed Gold Mineral Veins
  ctx.fillStyle = '#FDE047';
  ctx.beginPath();
  ctx.arc(8, -6, 5, 0, Math.PI * 2);
  ctx.arc(-8, 2, 4, 0, Math.PI * 2);
  ctx.fill();

  // Minecart
  ctx.fillStyle = '#78350F';
  ctx.fillRect(-22, 8, 18, 10);
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.arc(-18, 20, 3, 0, Math.PI * 2);
  ctx.arc(-8, 20, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawLumberZone(ctx: CanvasRenderingContext2D, time: number, x: number, y: number) {
  drawGroundShadow(ctx, x, y + 15, 45, 14);
  ctx.save();
  ctx.translate(x, y);

  // Stacked Timber Logs
  ctx.fillStyle = '#B45309';
  ctx.beginPath();
  ctx.roundRect(-22, -2, 34, 8, 3);
  ctx.roundRect(-22, 6, 34, 8, 3);
  ctx.roundRect(-16, -10, 30, 8, 3);
  ctx.fill();
  ctx.strokeStyle = '#451A03';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Woodcutter Axe in Tree Stump
  ctx.fillStyle = '#78350F';
  ctx.beginPath();
  ctx.arc(18, 6, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#CBD5E1';
  ctx.fillRect(16, -4, 4, 10);

  ctx.restore();
}

// =============================================================================
// SMALL GAME CHARACTERS (Hero, Builder, Miner, Scholar)
// =============================================================================
function drawCharacter(
  ctx: CanvasRenderingContext2D,
  time: number,
  x: number,
  y: number,
  role: 'hero' | 'builder' | 'miner' | 'scholar'
) {
  drawGroundShadow(ctx, x, y + 8, 14, 5);

  ctx.save();
  ctx.translate(x, y);

  const bob = Math.sin(time * 6) * 1.5;

  // Legs
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(-4, 0, 3, 7);
  ctx.fillRect(1, 0, 3, 7);

  // Body / Tunic
  let bodyColor = '#4F46E5';
  if (role === 'builder') bodyColor = '#D97706';
  if (role === 'miner') bodyColor = '#475569';
  if (role === 'scholar') bodyColor = '#0284C7';

  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.roundRect(-6, -11 + bob, 12, 12, 3);
  ctx.fill();

  // Head
  ctx.fillStyle = '#FED7AA';
  ctx.beginPath();
  ctx.arc(0, -16 + bob, 5, 0, Math.PI * 2);
  ctx.fill();

  // Role Headwear / Tools
  if (role === 'hero') {
    // Wizard / Hero Hat
    ctx.fillStyle = '#6366F1';
    ctx.beginPath();
    ctx.moveTo(0, -26 + bob);
    ctx.lineTo(6, -18 + bob);
    ctx.lineTo(-6, -18 + bob);
    ctx.closePath();
    ctx.fill();
  } else if (role === 'builder') {
    // Swinging Hammer
    ctx.save();
    ctx.translate(7, -8 + bob);
    ctx.rotate(Math.sin(time * 8) * 0.6);
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(-2, -6, 6, 4);
    ctx.fillStyle = '#78350F';
    ctx.fillRect(0, -2, 2, 8);
    ctx.restore();
  } else if (role === 'miner') {
    // Mining Pickaxe
    ctx.fillStyle = '#CBD5E1';
    ctx.fillRect(5, -12 + bob, 8, 2);
    ctx.fillStyle = '#78350F';
    ctx.fillRect(7, -10 + bob, 2, 8);
  }

  ctx.restore();
}

// =============================================================================
// TREES & NATURAL PROPS
// =============================================================================
function drawTree(
  ctx: CanvasRenderingContext2D,
  time: number,
  x: number,
  y: number,
  type: 'pine' | 'oak'
) {
  drawGroundShadow(ctx, x, y + 12, 22, 8);

  ctx.save();
  ctx.translate(x, y);

  // Brown Trunk
  ctx.fillStyle = '#78350F';
  ctx.fillRect(-3, -4, 6, 16);

  // Layered Foliage
  if (type === 'pine') {
    // Pine Triangle Tiers
    const pineGrad = ctx.createLinearGradient(0, -42, 0, -4);
    pineGrad.addColorStop(0, '#10B981');
    pineGrad.addColorStop(1, '#065F46');
    ctx.fillStyle = pineGrad;

    ctx.beginPath();
    ctx.moveTo(0, -42);
    ctx.lineTo(15, -24);
    ctx.lineTo(-15, -24);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.lineTo(18, -12);
    ctx.lineTo(-18, -12);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(20, 0);
    ctx.lineTo(-20, 0);
    ctx.closePath();
    ctx.fill();
  } else {
    // Oak Rounded Canopy
    const oakGrad = ctx.createRadialGradient(0, -18, 4, 0, -18, 24);
    oakGrad.addColorStop(0, '#34D399');
    oakGrad.addColorStop(1, '#047857');
    ctx.fillStyle = oakGrad;

    ctx.beginPath();
    ctx.arc(0, -20, 18, 0, Math.PI * 2);
    ctx.arc(-10, -14, 14, 0, Math.PI * 2);
    ctx.arc(10, -14, 14, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// =============================================================================
// UTILITY RENDER HELPERS (Shadows, Smoke, Campfire, Beacons)
// =============================================================================
function drawGroundShadow(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number) {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawNextQuestBeacon(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  const bounceY = y + Math.sin(time * 4) * 6;
  ctx.save();

  // Golden Marker Card
  ctx.fillStyle = '#F59E0B';
  ctx.shadowColor = '#FBBF24';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.roundRect(x - 38, bounceY - 14, 76, 22, 11);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('⭐ NEXT QUEST', x, bounceY + 1);

  // Arrow Pointer
  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.moveTo(x - 6, bounceY + 8);
  ctx.lineTo(x + 6, bounceY + 8);
  ctx.lineTo(x, bounceY + 14);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawCampfire(ctx: CanvasRenderingContext2D, time: number, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);

  // Stone Circle
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.fill();

  // Roaring Flames
  const flameH = 10 + Math.sin(time * 12) * 3;
  ctx.fillStyle = '#F59E0B';
  ctx.shadowColor = '#EF4444';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(-6, 2);
  ctx.lineTo(6, 2);
  ctx.lineTo(0, -flameH);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  // Smoke
  drawSmokeParticle(ctx, time, 0, -flameH);

  ctx.restore();
}

function drawTorchBrazier(ctx: CanvasRenderingContext2D, time: number, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#475569';
  ctx.fillRect(-3, 0, 6, 12);

  const flameH = 7 + Math.sin(time * 10) * 2;
  ctx.fillStyle = '#F97316';
  ctx.shadowColor = '#FBBF24';
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.arc(0, -2, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawSmokeParticle(ctx: CanvasRenderingContext2D, time: number, x: number, y: number) {
  ctx.save();
  ctx.fillStyle = 'rgba(203, 213, 225, 0.45)';
  for (let i = 0; i < 3; i++) {
    const offset = (time * 1.5 + i * 0.4) % 1.2;
    const px = x + Math.sin(time * 2 + i) * 4;
    const py = y - offset * 18;
    const pr = 3 + offset * 4;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
