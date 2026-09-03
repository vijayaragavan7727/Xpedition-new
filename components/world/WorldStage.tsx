'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { getStoreData, ConceptMastery } from '@/lib/store';
import { thetaToPercent } from '@/lib/engine/mastery';

/**
 * 2.5D World Entity Specification
 * groundX and groundY represent the precise terrain contact footprint (percentage 0-100).
 * All grounded entities anchor via transform: translate(-50%, -100%).
 */
export interface WorldEntityLayout {
  id: string;
  name: string;
  category: 'building' | 'character' | 'worker' | 'animal';
  src: string;
  groundX: number;     // Horizontal percentage of 16:9 canvas (0 - 100)
  groundY: number;     // Ground contact footprint percentage (0 - 100)
  width: number;       // Proportional scale percentage of canvas (0 - 100)
  baseZ?: number;      // Base depth bias
  anchorX?: number;    // Transform anchor X percentage (default 50)
  anchorY?: number;    // Transform anchor Y percentage (default 100 for ground contact)
  unlockedAtStage: number;
  description: string;
}

/**
 * Central Structured World Layout Configuration
 * Mapped to genuine playable terrain clearings in land-base.png.
 */
export const WORLD_LAYOUT = {
  // --- 6 BUILDINGS (Deliberate Ground Footprints) ---
  buildings: {
    learningCamp: {
      id: 'learning-camp',
      name: 'Learning Camp',
      category: 'building',
      src: '/world/buildings/learning-camp.png',
      groundX: 52.5,
      groundY: 55.0,     // Central circular clearing (Heart of Settlement)
      width: 15.5,      // Medium central hub
      baseZ: 0,
      unlockedAtStage: 1,
      description: 'The foundation of your journey — where concepts are first discovered.',
    } as WorldEntityLayout,
    skillLab: {
      id: 'skill-lab',
      name: 'Skill Lab',
      category: 'building',
      src: '/world/buildings/skill-lab.png',
      groundX: 48.5,
      groundY: 31.0,     // Northern forest terrace clearing
      width: 14.5,      // Medium research observatory (visible width ~10.5%)
      baseZ: 0,
      unlockedAtStage: 2,
      description: 'Advanced experimentation laboratory to refine mastery and cognitive skill.',
    } as WorldEntityLayout,
    projectWorkshop: {
      id: 'project-workshop',
      name: 'Project Workshop',
      category: 'building',
      src: '/world/buildings/project-workshop.png',
      groundX: 26.5,
      groundY: 46.0,     // Western timber clearing along the forest path
      width: 15.5,      // Medium craftsman workshop
      baseZ: 0,
      unlockedAtStage: 3,
      description: 'Hands-on creation station where practical prototypes are constructed.',
    } as WorldEntityLayout,
    challengeArena: {
      id: 'challenge-arena',
      name: 'Challenge Arena',
      category: 'building',
      src: '/world/buildings/challenge-arena.png',
      groundX: 74.0,
      groundY: 42.0,     // Eastern stone plateau clearing safely west of river
      width: 17.5,      // Large circular tournament arena
      baseZ: 0,
      unlockedAtStage: 4,
      description: 'High-stakes battleground for speed runs, boss battles, and mastery duels.',
    } as WorldEntityLayout,
    careerAcademy: {
      id: 'career-academy',
      name: 'Career Academy',
      category: 'building',
      src: '/world/buildings/career-academy.png',
      groundX: 32.0,
      groundY: 80.0,     // Southwestern expansive meadow plaza
      width: 18.5,      // Largest / prestigious academy landmark
      baseZ: 0,
      unlockedAtStage: 5,
      description: 'Professional institution bridging academic mastery with real-world industry pathways.',
    } as WorldEntityLayout,
    rewardVault: {
      id: 'reward-vault',
      name: 'Reward Vault',
      category: 'building',
      src: '/world/buildings/reward-vault.png',
      groundX: 67.0,
      groundY: 80.0,     // Southeastern river bank clearing
      width: 16.0,      // Medium grand treasury landmark
      baseZ: 0,
      unlockedAtStage: 6,
      description: 'Grand repository holding badges, rare artifacts, and mastery trophies.',
    } as WorldEntityLayout,
  },

  // --- 5 CHARACTERS & WORKERS (Attached to Associated Buildings) ---
  characters: {
    learner: {
      id: 'learner',
      name: 'Learner',
      category: 'character',
      src: '/world/characters/learner.png',
      groundX: 46.5,
      groundY: 58.0,     // Standing on path directly outside Learning Camp
      width: 3.0,       // Human scale
      baseZ: 20,        // In front of Learning Camp entrance
      unlockedAtStage: 1,
      description: 'The curious explorer expanding their knowledge across the realm.',
    } as WorldEntityLayout,
    builder: {
      id: 'builder',
      name: 'Builder',
      category: 'worker',
      src: '/world/characters/builder.png',
      groundX: 33.5,
      groundY: 48.0,     // Beside Project Workshop entrance
      width: 3.0,       // Human scale
      baseZ: 20,        // In front of Project Workshop
      unlockedAtStage: 3,
      description: 'Master craftsman overseeing workshop production and structures.',
    } as WorldEntityLayout,
    miner: {
      id: 'miner',
      name: 'Miner',
      category: 'worker',
      src: '/world/characters/miner.png',
      groundX: 20.0,
      groundY: 36.0,     // Northwest rocky trail near workshop resources
      width: 2.7,       // Distant human scale
      baseZ: 10,
      unlockedAtStage: 4,
      description: 'Resource gatherer excavating rare gems from the rocky ridges.',
    } as WorldEntityLayout,
    trainer: {
      id: 'trainer',
      name: 'Trainer',
      category: 'worker',
      src: '/world/characters/trainer.png',
      groundX: 67.5,
      groundY: 45.0,     // Standing at Challenge Arena entrance
      width: 2.9,       // Human scale
      baseZ: 20,        // In front of Arena gate
      unlockedAtStage: 4,
      description: 'Arena combat coach drilling agility and tactical reflexes.',
    } as WorldEntityLayout,
    mentor: {
      id: 'mentor',
      name: 'Mentor',
      category: 'character',
      src: '/world/characters/mentor.png',
      groundX: 39.0,
      groundY: 79.0,     // Standing at Career Academy entrance steps
      width: 3.2,       // Human scale
      baseZ: 20,        // In front of Career Academy
      unlockedAtStage: 5,
      description: 'Wise guide counseling advanced learners at Career Academy.',
    } as WorldEntityLayout,
  },

  // --- 4 LIVING ANIMALS (Habitat Details) ---
  animals: {
    rabbit: {
      id: 'rabbit',
      name: 'Forest Rabbit',
      category: 'animal',
      src: '/world/animals/rabbit.png',
      groundX: 59.0,
      groundY: 33.0,     // Wildflower glade east of Skill Lab
      width: 1.8,       // Small wildlife scale
      baseZ: 5,
      unlockedAtStage: 6,
      description: 'Playful woodland bunny hopping peacefully in the eastern wildflowers.',
    } as WorldEntityLayout,
    deer: {
      id: 'deer',
      name: 'Forest Fawn',
      category: 'animal',
      src: '/world/animals/deer.png',
      groundX: 14.0,
      groundY: 43.0,     // Northwest pine clearing edge
      width: 2.7,       // Slender fawn
      baseZ: 5,
      unlockedAtStage: 6,
      description: 'Graceful deer grazing along the peaceful pine groves.',
    } as WorldEntityLayout,
    birds: {
      id: 'birds',
      name: 'Songbird Flock',
      category: 'animal',
      src: '/world/animals/birds.png',
      groundX: 63.0,
      groundY: 15.0,     // Open sky canopy
      width: 4.0,       // Soaring flock
      anchorX: 50,
      anchorY: 50,      // Center anchor for sky fliers
      baseZ: 950,       // Always in sky layer above structures
      unlockedAtStage: 6,
      description: 'Vibrant songbirds gliding across the open sky above the settlement.',
    } as WorldEntityLayout,
    butterflies: {
      id: 'butterflies',
      name: 'Golden Butterflies',
      category: 'animal',
      src: '/world/animals/butterflies.png',
      groundX: 44.0,
      groundY: 42.0,     // Meadow flowers between Skill Lab and Camp
      width: 2.2,       // Delicate fluttering group
      anchorX: 50,
      anchorY: 50,
      baseZ: 15,
      unlockedAtStage: 6,
      description: 'Enchanted butterflies dancing above the blooming meadow flora.',
    } as WorldEntityLayout,
  },
};

/**
 * Calculates 2.5D Isometric Depth Order:
 * Lower on screen (higher groundY) = closer to camera = higher z-index.
 */
function compute2DDepth(entity: WorldEntityLayout): number {
  const yScore = Math.round(entity.groundY * 10);
  return yScore + (entity.baseZ || 0);
}

// Reusable Building Renderer with Bottom-Ground Contact
function BuildingEntity({
  entity,
  onClick,
}: {
  entity: WorldEntityLayout;
  onClick: () => void;
}) {
  const zIndex = useMemo(() => compute2DDepth(entity), [entity]);
  const anchorX = entity.anchorX ?? 50;
  const anchorY = entity.anchorY ?? 100;

  return (
    <div
      className="absolute pointer-events-auto transition-transform duration-300 ease-out hover:scale-105 cursor-pointer flex flex-col items-center"
      style={{
        left: `${entity.groundX}%`,
        top: `${entity.groundY}%`,
        width: `${entity.width}%`,
        transform: `translate(-${anchorX}%, -${anchorY}%)`,
        zIndex,
      }}
      onClick={onClick}
      title={entity.name}
    >
      <img
        src={entity.src}
        alt={entity.name}
        className="w-full h-auto object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.5)] select-none"
        draggable={false}
      />
      {/* Soft Contact Foundation Shadow */}
      <div className="w-[78%] h-[5px] sm:h-[7px] bg-black/35 rounded-full blur-[2px] -mt-1.5 pointer-events-none" />
    </div>
  );
}

// Reusable Character & Worker Renderer with Foot Grounding
function CharacterEntity({
  entity,
  delay = '0s',
  onClick,
}: {
  entity: WorldEntityLayout;
  delay?: string;
  onClick: () => void;
}) {
  const zIndex = useMemo(() => compute2DDepth(entity), [entity]);
  const anchorX = entity.anchorX ?? 50;
  const anchorY = entity.anchorY ?? 100;

  return (
    <div
      className="absolute pointer-events-auto group cursor-pointer transition-transform duration-200 hover:scale-110 flex flex-col items-center"
      style={{
        left: `${entity.groundX}%`,
        top: `${entity.groundY}%`,
        width: `${entity.width}%`,
        transform: `translate(-${anchorX}%, -${anchorY}%)`,
        zIndex,
      }}
      onClick={onClick}
      title={entity.name}
    >
      <div className="w-full animate-world-idle" style={{ animationDelay: delay }}>
        <img
          src={entity.src}
          alt={entity.name}
          className="w-full h-auto object-contain select-none drop-shadow-[0_3px_8px_rgba(0,0,0,0.4)]"
          draggable={false}
        />
      </div>
      {/* Ground Contact Shadow directly under feet */}
      <div className="w-[60%] h-[3px] sm:h-[4px] bg-black/50 rounded-full blur-[1px] -mt-0.5 pointer-events-none" />
    </div>
  );
}

// Reusable Animal Renderer
function AnimalEntity({
  entity,
  delay = '0s',
  isFlying = false,
  onClick,
}: {
  entity: WorldEntityLayout;
  delay?: string;
  isFlying?: boolean;
  onClick: () => void;
}) {
  const zIndex = useMemo(() => compute2DDepth(entity), [entity]);
  const anchorX = entity.anchorX ?? 50;
  const anchorY = entity.anchorY ?? (isFlying ? 50 : 100);

  return (
    <div
      className={`absolute pointer-events-auto group cursor-pointer transition-transform duration-300 hover:scale-115 flex flex-col items-center ${
        isFlying ? 'animate-float-slow' : ''
      }`}
      style={{
        left: `${entity.groundX}%`,
        top: `${entity.groundY}%`,
        width: `${entity.width}%`,
        transform: `translate(-${anchorX}%, -${anchorY}%)`,
        zIndex,
      }}
      onClick={onClick}
      title={entity.name}
    >
      <div className={!isFlying ? 'w-full animate-world-idle' : 'w-full'} style={{ animationDelay: delay }}>
        <img
          src={entity.src}
          alt={entity.name}
          className="w-full h-auto object-contain select-none drop-shadow-[0_3px_6px_rgba(0,0,0,0.3)]"
          draggable={false}
        />
      </div>
      {!isFlying && (
        <div className="w-[55%] h-[2.5px] sm:h-[3.5px] bg-black/40 rounded-full blur-[1px] -mt-0.5 pointer-events-none" />
      )}
    </div>
  );
}

const STAGE_TITLES: Record<number, { title: string; subtitle: string }> = {
  0: { title: 'Stage 0: Untouched Wilderness', subtitle: 'The vast fertile land awaits the first pioneer.' },
  1: { title: 'Stage 1: Learning Camp', subtitle: 'Learner establishes base camp in the central clearing.' },
  2: { title: 'Stage 2: Skill Lab', subtitle: 'Scientific research lab constructed on northern terrace (~20%+ Mastery).' },
  3: { title: 'Stage 3: Project Workshop', subtitle: 'Builder arrives to forge prototypes in western timberland (~40%+ Mastery).' },
  4: { title: 'Stage 4: Challenge Arena', subtitle: 'Trainer and Miner assemble tournament arena on eastern plateau (~60%+ Mastery).' },
  5: { title: 'Stage 5: Career Academy', subtitle: 'Mentor inaugurates grand academy plaza in southern clearing (~75%+ Mastery).' },
  6: { title: 'Stage 6: Reward Vault & Living World', subtitle: 'Complete settlement flourishing with wildlife and grand vault (~90%+ Mastery).' },
};

const HIGH_WATER_KEY = 'xpedition_max_world_stage';

/**
 * Extracts concept mastery percentage from BKT theta/percentage data safely.
 */
function getConceptMasteryPercentage(concept: ConceptMastery): number {
  if (concept.thetaSolo !== undefined && concept.thetaSolo !== null) {
    return thetaToPercent(concept.thetaSolo);
  }
  if (concept.thetaAssisted !== undefined && concept.thetaAssisted !== null) {
    return thetaToPercent(concept.thetaAssisted);
  }
  if (typeof concept.masteryPercentage === 'number' && !isNaN(concept.masteryPercentage)) {
    return Math.max(0, Math.min(100, Math.round(concept.masteryPercentage)));
  }
  return 0;
}

/**
 * Pure calculation of overall mastery progress and corresponding World Stage.
 * Evaluates mastery from the existing BKT/Rasch mastery system.
 * Attempts, rewards, XP, and streak alone cannot unlock stages.
 */
export function calculateWorldMasteryStage(store: ReturnType<typeof getStoreData> | null): {
  stage: number;
  overallMasteryPercent: number;
  masteredConceptsCount: number;
  totalConceptsCount: number;
} {
  if (!store) {
    return { stage: 0, overallMasteryPercent: 0, masteredConceptsCount: 0, totalConceptsCount: 0 };
  }

  const concepts = store.concepts || [];
  const totalConcepts = concepts.length;

  const hasStartedJourney = Boolean(
    store.calibrationCompletedAt ||
    (store.attempts && store.attempts.length > 0) ||
    totalConcepts > 0 ||
    store.goalText
  );

  // Edge case: No concepts registered yet
  if (totalConcepts === 0) {
    return {
      stage: hasStartedJourney ? 1 : 0,
      overallMasteryPercent: 0,
      masteredConceptsCount: 0,
      totalConceptsCount: 0,
    };
  }

  // Calculate sum of individual concept mastery percentages
  let sumMastery = 0;
  let masteredCount = 0;

  for (const c of concepts) {
    const pct = getConceptMasteryPercentage(c);
    sumMastery += pct;
    if (pct >= 75) {
      masteredCount++;
    }
  }

  // Continuous average mastery across all concepts (0 - 100)
  const averageMastery = sumMastery / totalConcepts;

  // Discrete ratio of fully mastered concepts: masteredConcepts / totalConcepts (0 - 100)
  const masteredRatio = (masteredCount / totalConcepts) * 100;

  // Effective overall mastery combines continuous mastery and mastered concepts
  const effectiveMastery = Math.max(averageMastery, masteredRatio);

  // Strict World Stage Gating
  let stage = 0;
  if (effectiveMastery >= 90) {
    stage = 6; // Stage 6: ~90%+ overall mastery (Reward Vault + Wildlife Animals)
  } else if (effectiveMastery >= 75) {
    stage = 5; // Stage 5: ~75%+ overall mastery (Career Academy + Mentor)
  } else if (effectiveMastery >= 60) {
    stage = 4; // Stage 4: ~60%+ overall mastery (Challenge Arena + Trainer/Miner)
  } else if (effectiveMastery >= 40) {
    stage = 3; // Stage 3: ~40%+ overall mastery (Project Workshop + Builder)
  } else if (effectiveMastery >= 20) {
    stage = 2; // Stage 2: ~20%+ overall mastery (Skill Lab)
  } else if (hasStartedJourney) {
    stage = 1; // Stage 1: Started learning journey (Learning Camp + Learner)
  } else {
    stage = 0; // Stage 0: Untouched Wilderness (Land only)
  }

  return {
    stage,
    overallMasteryPercent: Math.round(effectiveMastery),
    masteredConceptsCount: masteredCount,
    totalConceptsCount: totalConcepts,
  };
}

export default function WorldStage() {
  const [stage, setStage] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [selectedEntity, setSelectedEntity] = useState<WorldEntityLayout | null>(null);
  const [autoStage, setAutoStage] = useState<number>(0);
  const [masteryStats, setMasteryStats] = useState<{
    overallMasteryPercent: number;
    masteredConceptsCount: number;
    totalConceptsCount: number;
  }>({ overallMasteryPercent: 0, masteredConceptsCount: 0, totalConceptsCount: 0 });
  const [isManualOverride, setIsManualOverride] = useState<boolean>(false);

  useEffect(() => {
    try {
      const store = getStoreData();
      const { stage: computedStage, overallMasteryPercent, masteredConceptsCount, totalConceptsCount } =
        calculateWorldMasteryStage(store);

      setMasteryStats({
        overallMasteryPercent,
        masteredConceptsCount,
        totalConceptsCount,
      });

      let finalStage = computedStage;

      // Persistence: Maintain legitimately unlocked stage high-water mark unless account was reset
      const hasStartedJourney = Boolean(
        store?.calibrationCompletedAt ||
        (store?.attempts && store.attempts.length > 0) ||
        (store?.concepts && store.concepts.length > 0) ||
        store?.goalText
      );

      if (!hasStartedJourney) {
        finalStage = 0;
        try {
          localStorage.removeItem(HIGH_WATER_KEY);
        } catch {}
      } else {
        try {
          const savedMax = parseInt(localStorage.getItem(HIGH_WATER_KEY) || '0', 10);
          if (!isNaN(savedMax) && savedMax > finalStage) {
            finalStage = Math.min(6, savedMax);
          } else if (finalStage > savedMax) {
            localStorage.setItem(HIGH_WATER_KEY, String(finalStage));
          }
        } catch {}
      }

      setAutoStage(finalStage);
      if (!isManualOverride) {
        setStage(finalStage);
      }
    } catch {
      setAutoStage(0);
      if (!isManualOverride) setStage(0);
    }
    setIsLoaded(true);
  }, [isManualOverride]);

  const handleStageSelect = (s: number) => {
    setIsManualOverride(true);
    setStage(s);
  };

  const handleResetToAuto = () => {
    setIsManualOverride(false);
    setStage(autoStage);
  };

  const { buildings, characters, animals } = WORLD_LAYOUT;

  return (
    <div className="relative w-full min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-2 sm:p-4 bg-slate-950 overflow-x-hidden selection:bg-amber-500/30">
      
      {/* Top Header & Stage Navigation */}
      <header className="w-full max-w-[1600px] mb-3 flex flex-wrap items-center justify-between gap-3 px-2 sm:px-4 z-40">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-lg sm:text-xl font-bold tracking-wide text-amber-300 drop-shadow">
              {STAGE_TITLES[stage]?.title}
            </h1>
            {!isManualOverride && masteryStats.totalConceptsCount > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800/90 text-amber-300 border border-amber-500/30">
                {masteryStats.overallMasteryPercent}% Mastery ({masteryStats.masteredConceptsCount}/{masteryStats.totalConceptsCount} Mastered)
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-300 font-medium">
            {STAGE_TITLES[stage]?.subtitle}
          </p>
        </div>

        {/* Stage Testing & Mode Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded-xl p-1 shadow-lg backdrop-blur-md">
          <span className="text-[10px] font-semibold tracking-wider text-slate-400 px-2 uppercase hidden sm:inline">
            Stage:
          </span>
          {[0, 1, 2, 3, 4, 5, 6].map((s) => (
            <button
              key={s}
              onClick={() => handleStageSelect(s)}
              className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all duration-200 ${
                stage === s && isManualOverride
                  ? 'bg-amber-500 text-slate-950 shadow-md scale-105 ring-2 ring-amber-300/60'
                  : stage === s
                  ? 'bg-amber-500/80 text-slate-950 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {s}
            </button>
          ))}
          {isManualOverride && (
            <button
              onClick={handleResetToAuto}
              className="ml-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/50 transition-colors"
              title="Reset to live mastery stage"
            >
              Auto ({autoStage})
            </button>
          )}
        </div>
      </header>

      {/* Main 16:9 Continuous Game World Canvas */}
      <main
        className="relative w-full max-w-[1600px] aspect-[16/9] rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.85)] border border-slate-800/80 bg-slate-950 select-none"
      >
        {/* Layer 0: Continuous Land Base Terrain */}
        <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <img
            src="/world/terrain/land-base.png"
            alt="Xpedition World Continuous Land"
            className="w-full h-full object-cover object-center select-none"
            draggable={false}
          />
        </div>

        {/* Ambient Warm Hand-Painted Forest Lighting */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-black/15 pointer-events-none z-[1]" />

        {/* --- STAGE-GATED 2.5D ENTITY LAYERS --- */}
        {isLoaded && (
          <>
            {/* Stage 1: Learning Camp & Learner */}
            {stage >= 1 && (
              <>
                <BuildingEntity entity={buildings.learningCamp} onClick={() => setSelectedEntity(buildings.learningCamp)} />
                <CharacterEntity entity={characters.learner} delay="0s" onClick={() => setSelectedEntity(characters.learner)} />
              </>
            )}

            {/* Stage 2: Skill Lab */}
            {stage >= 2 && (
              <BuildingEntity entity={buildings.skillLab} onClick={() => setSelectedEntity(buildings.skillLab)} />
            )}

            {/* Stage 3: Project Workshop & Builder */}
            {stage >= 3 && (
              <>
                <BuildingEntity entity={buildings.projectWorkshop} onClick={() => setSelectedEntity(buildings.projectWorkshop)} />
                <CharacterEntity entity={characters.builder} delay="1.2s" onClick={() => setSelectedEntity(characters.builder)} />
              </>
            )}

            {/* Stage 4: Challenge Arena, Trainer & Miner */}
            {stage >= 4 && (
              <>
                <BuildingEntity entity={buildings.challengeArena} onClick={() => setSelectedEntity(buildings.challengeArena)} />
                <CharacterEntity entity={characters.trainer} delay="0.7s" onClick={() => setSelectedEntity(characters.trainer)} />
                <CharacterEntity entity={characters.miner} delay="2.1s" onClick={() => setSelectedEntity(characters.miner)} />
              </>
            )}

            {/* Stage 5: Career Academy & Mentor */}
            {stage >= 5 && (
              <>
                <BuildingEntity entity={buildings.careerAcademy} onClick={() => setSelectedEntity(buildings.careerAcademy)} />
                <CharacterEntity entity={characters.mentor} delay="1.6s" onClick={() => setSelectedEntity(characters.mentor)} />
              </>
            )}

            {/* Stage 6: Reward Vault & Living Animals */}
            {stage >= 6 && (
              <>
                <BuildingEntity entity={buildings.rewardVault} onClick={() => setSelectedEntity(buildings.rewardVault)} />
                <AnimalEntity entity={animals.rabbit} delay="2.8s" onClick={() => setSelectedEntity(animals.rabbit)} />
                <AnimalEntity entity={animals.deer} delay="1.9s" onClick={() => setSelectedEntity(animals.deer)} />
                <AnimalEntity entity={animals.birds} isFlying={true} onClick={() => setSelectedEntity(animals.birds)} />
                <AnimalEntity entity={animals.butterflies} delay="0.5s" isFlying={false} onClick={() => setSelectedEntity(animals.butterflies)} />
              </>
            )}
          </>
        )}

        {/* Entity Inspector Popup Modal */}
        {selectedEntity && (
          <div className="absolute bottom-4 left-4 z-50 max-w-sm p-4 bg-slate-900/95 border border-amber-500/40 rounded-xl shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  {selectedEntity.category} • Unlocked Stage {selectedEntity.unlockedAtStage}
                </span>
                <h2 className="text-base font-bold text-white mt-0.5">{selectedEntity.name}</h2>
              </div>
              <button
                onClick={() => setSelectedEntity(null)}
                className="text-slate-400 hover:text-white text-sm p-1"
                aria-label="Close details"
              >
                ✕
              </button>
            </div>
            {selectedEntity.description && (
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {selectedEntity.description}
              </p>
            )}
          </div>
        )}
      </main>

      {/* World Legend & Footer */}
      <footer className="w-full max-w-[1600px] mt-3 flex flex-wrap items-center justify-between text-xs text-slate-400 px-2 sm:px-4">
        <div className="flex items-center gap-4">
          <span>🏛️ 6 Major Buildings</span>
          <span>👥 5 Characters & Workers</span>
          <span>🦌 4 Living Animals</span>
        </div>
        <div className="text-[11px] text-slate-400">
          2.5D World Layout Engine • Continuous Forest Canvas
        </div>
      </footer>
    </div>
  );
}
