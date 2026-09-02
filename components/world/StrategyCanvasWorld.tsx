'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlayableGameWorldData, LearningZone } from '@/lib/engine/gameWorldAdapter';
import GameTopHud from './GameTopHud';
import BuildingActionPopup from './BuildingActionPopup';
import { Maximize2, Sparkles, Navigation, Flame } from 'lucide-react';

interface StrategyCanvasWorldProps {
  worldData: PlayableGameWorldData;
}

// Fixed World Map Dimensions
const MAP_WIDTH = 840;
const MAP_HEIGHT = 840;

interface SceneEntity {
  id: string;
  type: 'building' | 'character' | 'tree' | 'prop' | 'resource';
  x: number;
  y: number;
  width: number;
  height: number;
  spriteKey?: string;
  render?: (ctx: CanvasRenderingContext2D, time: number, isSelected: boolean, isRecommended: boolean, images: Record<string, HTMLImageElement>) => void;
  zoneData?: LearningZone;
  clickable?: boolean;
}

export default function StrategyCanvasWorld({ worldData }: StrategyCanvasWorldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<Record<string, HTMLImageElement>>({});
  const [imagesLoaded, setImagesLoaded] = useState<boolean>(false);

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

  // Identify Recommended Target from Adaptive Engine
  const recommendedId = mentor?.recommendedConceptId || skillDistrict.id;

  // Preload all real illustrated sprite assets
  useEffect(() => {
    const assetManifest: Record<string, string> = {
      'learning-camp': '/world/buildings/learning-camp.png',
      'skill-lab': '/world/buildings/skill-lab.png',
      'project-workshop': '/world/buildings/project-workshop.png',
      'challenge-arena': '/world/buildings/challenge-arena.png',
      'career-academy': '/world/buildings/career-academy.png',
      'reward-vault': '/world/buildings/reward-vault.png',
      'quarry': '/world/buildings/quarry.png',
      'lumber-yard': '/world/buildings/lumber-yard.png',
      'learner': '/world/characters/learner.png',
      'builder': '/world/characters/builder.png',
      'miner': '/world/characters/miner.png',
      'trainer': '/world/characters/trainer.png',
      'mentor': '/world/characters/mentor.png',
      'campfire': '/world/props/campfire.png',
      'tree-pine': '/world/props/tree-pine.png',
      'tree-oak': '/world/props/tree-oak.png',
      'stone-pile': '/world/props/stone-pile.png',
      'logs': '/world/props/logs.png',
      'crates': '/world/props/crates.png',
      'flowers': '/world/terrain/flowers.png',
      'quest-beacon': '/world/effects/quest-beacon.png',
    };

    let loadedCount = 0;
    const totalCount = Object.keys(assetManifest).length;
    const loadedImages: Record<string, HTMLImageElement> = {};

    Object.entries(assetManifest).forEach(([key, src]) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        loadedCount++;
        loadedImages[key] = img;
        if (loadedCount >= totalCount) {
          imagesRef.current = loadedImages;
          setImagesLoaded(true);
        }
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount >= totalCount) {
          imagesRef.current = loadedImages;
          setImagesLoaded(true);
        }
      };
    });
  }, []);

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
      { zone: learningCamp, x: 420, y: 410, radius: 65 },
      { zone: skillDistrict, x: 240, y: 270, radius: 60 },
      { zone: projectValley, x: 230, y: 550, radius: 60 },
      { zone: challengeArena, x: 610, y: 270, radius: 62 },
      { zone: rewardVault, x: 620, y: 550, radius: 58 },
      { zone: careerCity, x: 420, y: 640, radius: 65 },
      { zone: skillLab, x: 420, y: 190, radius: 58 },
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
      const images = imagesRef.current;

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
      // 1. TERRAIN BASE LAYER (Lush Meadow, Grass Variations, River & Trails)
      // =========================================================================
      drawTerrainBase(ctx, time);

      // =========================================================================
      // 2. Y-SORTED WORLD SCENE OBJECTS (Illustrated Buildings, Characters, Trees, Props)
      // =========================================================================
      const sceneObjects: SceneEntity[] = [];

      // 7 Core Buildings
      sceneObjects.push({
        id: learningCamp.id,
        type: 'building',
        x: 420,
        y: 410,
        width: 140,
        height: 125,
        zoneData: learningCamp,
        clickable: true,
        render: (c, t, isSel, isRec, imgs) =>
          drawSpriteBuilding(c, t, 420, 410, 140, 125, imgs['learning-camp'], isSel, isRec, learningCamp),
      });

      sceneObjects.push({
        id: skillDistrict.id,
        type: 'building',
        x: 240,
        y: 270,
        width: 135,
        height: 120,
        zoneData: skillDistrict,
        clickable: true,
        render: (c, t, isSel, isRec, imgs) =>
          drawSpriteBuilding(c, t, 240, 270, 135, 120, imgs['career-academy'] || imgs['skill-lab'], isSel, isRec, skillDistrict),
      });

      sceneObjects.push({
        id: projectValley.id,
        type: 'building',
        x: 230,
        y: 550,
        width: 140,
        height: 120,
        zoneData: projectValley,
        clickable: true,
        render: (c, t, isSel, isRec, imgs) =>
          drawSpriteBuilding(c, t, 230, 550, 140, 120, imgs['project-workshop'], isSel, isRec, projectValley),
      });

      sceneObjects.push({
        id: challengeArena.id,
        type: 'building',
        x: 610,
        y: 270,
        width: 145,
        height: 120,
        zoneData: challengeArena,
        clickable: true,
        render: (c, t, isSel, isRec, imgs) =>
          drawSpriteBuilding(c, t, 610, 270, 145, 120, imgs['challenge-arena'], isSel, isRec, challengeArena),
      });

      sceneObjects.push({
        id: rewardVault.id,
        type: 'building',
        x: 620,
        y: 550,
        width: 130,
        height: 115,
        zoneData: rewardVault,
        clickable: true,
        render: (c, t, isSel, isRec, imgs) =>
          drawSpriteBuilding(c, t, 620, 550, 130, 115, imgs['reward-vault'], isSel, isRec, rewardVault),
      });

      sceneObjects.push({
        id: careerCity.id,
        type: 'building',
        x: 420,
        y: 640,
        width: 145,
        height: 145,
        zoneData: careerCity,
        clickable: true,
        render: (c, t, isSel, isRec, imgs) =>
          drawSpriteBuilding(c, t, 420, 640, 145, 145, imgs['career-academy'], isSel, isRec, careerCity),
      });

      sceneObjects.push({
        id: skillLab.id,
        type: 'building',
        x: 420,
        y: 190,
        width: 125,
        height: 115,
        zoneData: skillLab,
        clickable: true,
        render: (c, t, isSel, isRec, imgs) =>
          drawSpriteBuilding(c, t, 420, 190, 125, 115, imgs['skill-lab'], isSel, isRec, skillLab),
      });

      // Resource Areas: Quarry & Lumber Yard
      sceneObjects.push({
        id: 'quarry_node',
        type: 'resource',
        x: 525,
        y: 205,
        width: 110,
        height: 85,
        render: (c, t, _, __, imgs) => drawSpriteProp(c, t, 525, 205, 110, 85, imgs['quarry'] || imgs['stone-pile']),
      });

      sceneObjects.push({
        id: 'lumber_node',
        type: 'resource',
        x: 315,
        y: 205,
        width: 110,
        height: 85,
        render: (c, t, _, __, imgs) => drawSpriteProp(c, t, 315, 205, 110, 85, imgs['lumber-yard'] || imgs['logs']),
      });

      // Animated Campfire
      sceneObjects.push({
        id: 'campfire_prop',
        type: 'prop',
        x: 470,
        y: 430,
        width: 45,
        height: 45,
        render: (c, t, _, __, imgs) => drawCampfireSprite(c, t, 470, 430, imgs['campfire']),
      });

      // Illustrated Small Game Characters
      sceneObjects.push({
        id: 'hero_avatar',
        type: 'character',
        x: 365 + Math.sin(time * 0.8) * 16,
        y: 435 + Math.cos(time * 0.8) * 8,
        width: 32,
        height: 42,
        render: (c, t, _, __, imgs) =>
          drawSpriteCharacter(c, t, 365 + Math.sin(time * 0.8) * 16, 435 + Math.cos(time * 0.8) * 8, 32, 42, imgs['learner'], 'hero'),
      });

      sceneObjects.push({
        id: 'builder_npc',
        type: 'character',
        x: 280,
        y: 575,
        width: 30,
        height: 40,
        render: (c, t, _, __, imgs) =>
          drawSpriteCharacter(c, t, 280, 575, 30, 40, imgs['builder'], 'builder'),
      });

      sceneObjects.push({
        id: 'miner_npc',
        type: 'character',
        x: 555,
        y: 220,
        width: 30,
        height: 40,
        render: (c, t, _, __, imgs) =>
          drawSpriteCharacter(c, t, 555, 220, 30, 40, imgs['miner'], 'miner'),
      });

      sceneObjects.push({
        id: 'scholar_npc',
        type: 'character',
        x: 275,
        y: 310,
        width: 30,
        height: 40,
        render: (c, t, _, __, imgs) =>
          drawSpriteCharacter(c, t, 275, 310, 30, 40, imgs['mentor'] || imgs['trainer'], 'scholar'),
      });

      // Layered 2.5D Trees & Foliage Props
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
          width: 48,
          height: 60,
          render: (c, t, _, __, imgs) =>
            drawSpriteTree(c, t, tp.x, tp.y, 48, 60, tp.type === 'pine' ? imgs['tree-pine'] : imgs['tree-oak'], tp.type),
        });
      });

      // Environmental Props: Crates, Logs, Stone Piles, Flowers
      sceneObjects.push({
        id: 'prop_crates',
        type: 'prop',
        x: 185,
        y: 570,
        width: 38,
        height: 28,
        render: (c, t, _, __, imgs) => drawSpriteProp(c, t, 185, 570, 38, 28, imgs['crates']),
      });

      sceneObjects.push({
        id: 'prop_logs',
        type: 'prop',
        x: 360,
        y: 220,
        width: 38,
        height: 28,
        render: (c, t, _, __, imgs) => drawSpriteProp(c, t, 360, 220, 38, 28, imgs['logs']),
      });

      sceneObjects.push({
        id: 'prop_flowers_1',
        type: 'prop',
        x: 420,
        y: 330,
        width: 35,
        height: 24,
        render: (c, t, _, __, imgs) => drawSpriteProp(c, t, 420, 330, 35, 24, imgs['flowers']),
      });

      sceneObjects.push({
        id: 'prop_flowers_2',
        type: 'prop',
        x: 420,
        y: 510,
        width: 35,
        height: 24,
        render: (c, t, _, __, imgs) => drawSpriteProp(c, t, 420, 510, 35, 24, imgs['flowers']),
      });

      // Sort by Y-coordinate for genuine 2.5D visual depth
      sceneObjects.sort((a, b) => a.y - b.y);

      // Render all sorted objects
      sceneObjects.forEach((obj) => {
        const isSel = selectedBuilding?.id === obj.id;
        const isRec = recommendedId === obj.id;
        if (obj.render) {
          obj.render(ctx, time, isSel, isRec, images);
        }
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
// SPRITE RENDERING WITH VECTOR FALLBACKS
// =============================================================================

function drawSpriteBuilding(
  ctx: CanvasRenderingContext2D,
  time: number,
  x: number,
  y: number,
  w: number,
  h: number,
  img: HTMLImageElement | undefined,
  isSel: boolean,
  isRec: boolean,
  zone: LearningZone
) {
  // Soft Ground Ambient Shadow
  drawGroundShadow(ctx, x, y + h * 0.32, w * 0.45, 18);

  ctx.save();
  ctx.translate(x, y);

  // Selection Glow
  if (isSel) {
    ctx.shadowColor = '#FBBF24';
    ctx.shadowBlur = 24;
  }

  // Next Best Action Spotlight Beacon
  if (isRec) {
    drawNextQuestBeacon(ctx, 0, -h * 0.58, time);
  }

  if (img && img.complete && img.naturalWidth > 0) {
    // Render Illustrated Sprite Asset
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
  } else {
    // Vector Architecture Fallback
    drawVectorBuildingFallback(ctx, w, h, zone.type);
  }

  // Mastered Crown Badge
  if (zone.status === 'mastered' || zone.masteryPercent >= 80) {
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(w * 0.32, -h * 0.32, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('👑', w * 0.32, -h * 0.32 + 3);
  }

  ctx.restore();
}

function drawSpriteCharacter(
  ctx: CanvasRenderingContext2D,
  time: number,
  x: number,
  y: number,
  w: number,
  h: number,
  img: HTMLImageElement | undefined,
  role: 'hero' | 'builder' | 'miner' | 'scholar'
) {
  drawGroundShadow(ctx, x, y + 10, 14, 5);

  ctx.save();
  ctx.translate(x, y);

  const bob = Math.sin(time * 6) * 1.5;

  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, -w / 2, -h / 2 + bob, w, h);
  } else {
    // Fallback Vector Character
    ctx.fillStyle = role === 'hero' ? '#4F46E5' : role === 'builder' ? '#D97706' : '#0284C7';
    ctx.beginPath();
    ctx.roundRect(-7, -12 + bob, 14, 14, 3);
    ctx.fill();
    ctx.fillStyle = '#FED7AA';
    ctx.beginPath();
    ctx.arc(0, -18 + bob, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawSpriteTree(
  ctx: CanvasRenderingContext2D,
  time: number,
  x: number,
  y: number,
  w: number,
  h: number,
  img: HTMLImageElement | undefined,
  type: 'pine' | 'oak'
) {
  drawGroundShadow(ctx, x, y + 16, 24, 9);

  ctx.save();
  ctx.translate(x, y);

  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
  } else {
    // Fallback Tree
    ctx.fillStyle = '#78350F';
    ctx.fillRect(-3, -4, 6, 18);
    ctx.fillStyle = type === 'pine' ? '#047857' : '#10B981';
    ctx.beginPath();
    ctx.arc(0, -22, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawSpriteProp(
  ctx: CanvasRenderingContext2D,
  time: number,
  x: number,
  y: number,
  w: number,
  h: number,
  img: HTMLImageElement | undefined
) {
  drawGroundShadow(ctx, x, y + h * 0.35, w * 0.4, 8);

  ctx.save();
  ctx.translate(x, y);

  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
  } else {
    ctx.fillStyle = '#64748B';
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 4);
    ctx.fill();
  }

  ctx.restore();
}

function drawCampfireSprite(
  ctx: CanvasRenderingContext2D,
  time: number,
  x: number,
  y: number,
  img: HTMLImageElement | undefined
) {
  drawGroundShadow(ctx, x, y + 12, 18, 7);

  ctx.save();
  ctx.translate(x, y);

  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, -22, -22, 45, 45);
  } else {
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(0, -4, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Rising Smoke Particles
  ctx.fillStyle = 'rgba(226, 232, 240, 0.45)';
  for (let i = 0; i < 3; i++) {
    const offset = (time * 1.5 + i * 0.4) % 1.2;
    const px = Math.sin(time * 2 + i) * 3;
    const py = -10 - offset * 18;
    const pr = 2.5 + offset * 3;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawVectorBuildingFallback(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  type: string
) {
  ctx.fillStyle = '#78350F';
  ctx.beginPath();
  ctx.roundRect(-w * 0.35, -h * 0.1, w * 0.7, h * 0.5, 6);
  ctx.fill();
  ctx.strokeStyle = '#451A03';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#D97706';
  ctx.beginPath();
  ctx.moveTo(0, -h * 0.45);
  ctx.lineTo(w * 0.4, -h * 0.1);
  ctx.lineTo(-w * 0.4, -h * 0.1);
  ctx.closePath();
  ctx.fill();
}

// =============================================================================
// UTILITY RENDER HELPERS
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
  ctx.roundRect(x - 42, bounceY - 14, 84, 24, 12);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('⭐ NEXT QUEST', x, bounceY + 2);

  // Arrow Pointer
  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.moveTo(x - 6, bounceY + 10);
  ctx.lineTo(x + 6, bounceY + 10);
  ctx.lineTo(x, bounceY + 16);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}
