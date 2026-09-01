/**
 * Game World Progression & State Adapter
 * Connects learner XP, streak, accuracy, BKT mastery, and concept skills
 * directly to the 5 living learning territory zones.
 */

import { UserStoreData, calculateStreak } from '../store';
import { thetaToPercent } from './mastery';

export type WorldTierLevel = 1 | 2 | 3 | 4 | 5;

export type GameZoneType =
  | 'learning_camp'
  | 'skill_district'
  | 'challenge_arena'
  | 'project_valley'
  | 'career_city'
  | 'knowledge_core'
  | 'course_academy'
  | 'skill_lab'
  | 'reward_vault'
  | 'practice_grounds'
  | 'career_hub'
  | 'hq'
  | 'library'
  | 'quest_board'
  | 'ai_lab'
  | 'gold_vault'
  | 'elixir_condenser'
  | 'workshop';

export interface LearningZone {
  id: string;
  name: string;
  tagline: string;
  type: GameZoneType;
  level: number; // 1 to 5
  tierName: string;
  icon: string;
  masteryPercent: number;
  completedQuests: number;
  questsCompleted?: number;
  totalQuests: number;
  status: 'unlocked' | 'in_progress' | 'mastered' | 'completed' | 'locked';
  unlockRequirement: string;
  actionTitle: string;
  actionText?: string;
  title?: string;
  subtitle?: string;
  isUpgrading?: boolean;
  upgradeProgress?: number;
  actionUrl: string;
  accentColor: string;
  environmentFeatures: string[];
  gridX: number; // 0 to 100 on continuous terrain map
  gridY: number; // 0 to 100 on continuous terrain map
  position: [number, number, number];
  conceptName?: string;
  statsLabel: string;
}

export type GameBuildingState = LearningZone;

export interface GameMentorDialogue {
  npcName: string;
  avatarIcon: string;
  greeting: string;
  recommendedConceptId: string;
  recommendedConceptName: string;
  challengeTitle: string;
  difficultyLabel: string;
  actionUrl: string;
}

export interface PlayableGameWorldData {
  learnerName: string;
  learnerLevel: number;
  totalXp: number;
  worldLevel: WorldTierLevel;
  worldLevelName: string;
  worldProgressPercent: number; // 0 to 100 toward next World Tier
  currentXpInTier: number;
  xpNeededForNextTier: number;
  streakDays: number;
  accuracyRate: number; // 0 to 100
  workerCount: number;
  totalWorkers: number;
  shieldHoursRemaining: number;
  masteredTopicsCount: number;
  totalTopicsCount: number;
  availableQuestsCount: number;
  resources: {
    wood: number;
    stone: number;
    crystal: number;
    gold: number;
  };
  zones: {
    learningCamp: LearningZone;
    skillDistrict: LearningZone;
    challengeArena: LearningZone;
    projectValley: LearningZone;
    careerCity: LearningZone;
  };
  // Backward compatibility aliases
  buildings: {
    knowledgeCore: LearningZone;
    courseAcademy: LearningZone;
    skillLab: LearningZone;
    challengeArena: LearningZone;
    rewardVault: LearningZone;
    practiceGrounds: LearningZone;
    careerHub: LearningZone;
    hq: LearningZone;
    library: LearningZone;
    questBoard: LearningZone;
    aiLab: LearningZone;
    goldVault: LearningZone;
    elixirCondenser: LearningZone;
    workshop: LearningZone;
  };
  mentor: GameMentorDialogue;
}

// XP Thresholds for World Evolution Tiers
const WORLD_TIER_THRESHOLDS: { tier: WorldTierLevel; name: string; minXp: number; maxXp: number }[] = [
  { tier: 1, name: 'Pioneer Camp (Tier 1)', minXp: 0, maxXp: 500 },
  { tier: 2, name: 'Settled Haven (Tier 2)', minXp: 500, maxXp: 1500 },
  { tier: 3, name: 'Grand Stronghold (Tier 3)', minXp: 1500, maxXp: 3000 },
  { tier: 4, name: 'Sovereign Citadel (Tier 4)', minXp: 3000, maxXp: 5000 },
  { tier: 5, name: 'Empire Metropolis (Tier 5)', minXp: 5000, maxXp: 10000 },
];

export function computeGameWorldData(store: UserStoreData, fallbackXp: number = 240): PlayableGameWorldData {
  const concepts = store.concepts || [];
  const attempts = store.attempts || [];
  const streak = calculateStreak(attempts);

  // Calculate real metrics
  const correctAttempts = attempts.filter((a) => a.isCorrect).length;
  const accuracyRate = attempts.length > 0 ? Math.round((correctAttempts / attempts.length) * 100) : 75;

  let totalMasterySum = 0;
  let masteredCount = 0;
  concepts.forEach((c) => {
    const pct = c.thetaAssisted !== undefined ? thetaToPercent(c.thetaAssisted) : c.masteryPercentage || 0;
    totalMasterySum += pct;
    if (pct >= 80) masteredCount++;
  });

  const avgMastery = concepts.length > 0 ? Math.round(totalMasterySum / concepts.length) : 50;

  // Derive total XP from store attempts, rewards, and mastery
  const computedXp = attempts.length * 25 + correctAttempts * 15 + Math.round(totalMasterySum * 8) + (store.rewardsCount || 0) * 50;
  const totalXp = Math.max(computedXp, fallbackXp, 120);

  // Determine World Tier
  let currentTierInfo = WORLD_TIER_THRESHOLDS[0];
  for (const t of WORLD_TIER_THRESHOLDS) {
    if (totalXp >= t.minXp) {
      currentTierInfo = t;
    }
  }

  const range = currentTierInfo.maxXp - currentTierInfo.minXp;
  const inTier = Math.max(0, totalXp - currentTierInfo.minXp);
  const worldProgressPercent = Math.min(100, Math.max(0, Math.round((inTier / range) * 100)));
  const xpNeededForNextTier = Math.max(0, currentTierInfo.maxXp - totalXp);

  const learnerLevel = Math.max(1, Math.floor(Math.pow(totalXp / 100, 1 / 1.5)) + 1);

  // Dynamic Workers: More active days & streaks = more workers in the world
  const workerCount = Math.min(5, Math.max(2, Math.floor(streak / 2) + 2));
  const totalWorkers = 5;

  // Resources generated from real activity
  const wood = Math.floor(totalXp * 0.8 + attempts.length * 10 + 120);
  const stone = Math.floor(totalXp * 0.5 + correctAttempts * 12 + 80);
  const crystal = Math.floor(masteredCount * 40 + currentTierInfo.tier * 25 + 45);
  const gold = Math.floor(streak * 35 + (store.rewardsCount || 0) * 50 + totalXp * 0.45 + 250);

  // Concept mapping for individual domain buildings
  const c0 = concepts[0] || { id: 'c0', name: 'Core Foundations & Syntax', masteryPercentage: 80 };
  const c1 = concepts[1] || { id: 'c1', name: 'Object Architecture & Data', masteryPercentage: 65 };
  const c2 = concepts[2] || { id: 'c2', name: 'Algorithmic Problem Solving', masteryPercentage: 45 };

  const getPct = (c: any) => (c.thetaAssisted !== undefined ? thetaToPercent(c.thetaAssisted) : c.masteryPercentage || 50);

  // 1. LEARNING CAMP (South - Basic/Beginner Learning)
  const campLevel = getPct(c0) >= 80 ? 4 : getPct(c0) >= 50 ? 3 : getPct(c0) >= 20 ? 2 : 1;
  const learningCamp: LearningZone = {
    id: 'zone_learning_camp',
    name: 'Learning Camp',
    tagline: 'Foundations & Starter Lodge',
    type: 'learning_camp',
    level: campLevel,
    tierName: campLevel >= 4 ? 'Grand Lodge' : campLevel >= 2 ? 'Outpost Manor' : 'Pioneer Camp',
    icon: '🏕️',
    masteryPercent: getPct(c0),
    completedQuests: attempts.length,
    questsCompleted: attempts.length,
    totalQuests: Math.max(10, attempts.length + 5),
    status: 'unlocked',
    unlockRequirement: 'Unlocked by Default',
    actionTitle: 'Practice Basics',
    actionUrl: `/quest?concept=${encodeURIComponent(c0.id)}`,
    accentColor: '#10B981',
    environmentFeatures: ['Campfire & Embers', 'Tent Lodges', 'Torchlit Trails', 'Timber Stacks'],
    gridX: 50,
    gridY: 82,
    position: [0, 0, 4],
    conceptName: c0.name,
    statsLabel: `${getPct(c0)}% Syntax Mastery · Lv.${campLevel}`,
  };

  // 2. SKILL DISTRICT (Mid-West - Skill-Building Modules & Library)
  const districtLevel = getPct(c1) >= 80 ? 4 : getPct(c1) >= 50 ? 3 : getPct(c1) >= 20 ? 2 : 1;
  const skillDistrict: LearningZone = {
    id: 'zone_skill_district',
    name: 'Skill District',
    tagline: 'Academy Library & Spires',
    type: 'skill_district',
    level: districtLevel,
    tierName: districtLevel >= 4 ? 'Sovereign Academy' : districtLevel >= 2 ? 'Grand Archive' : 'Scriptorium',
    icon: '🏛️',
    masteryPercent: getPct(c1),
    completedQuests: Math.floor(attempts.length * 0.4),
    totalQuests: concepts.length * 4 || 16,
    status: 'unlocked',
    unlockRequirement: 'Complete Camp Basics',
    actionTitle: 'Study Modules',
    actionUrl: `/quest?concept=${encodeURIComponent(c1.id)}`,
    accentColor: '#38BDF8',
    environmentFeatures: ['Observatory Dome', 'Crystal Libraries', 'Celestial Astrolabe', 'Cobblestone Plazas'],
    gridX: 25,
    gridY: 58,
    position: [-3.5, 0, 1.5],
    conceptName: c1.name,
    statsLabel: `${masteredCount}/${concepts.length || 4} Modules Mastered`,
  };

  // 3. CHALLENGE ARENA (Mid-East - Practice, Solo Raids & Assessments)
  const arenaLevel = attempts.length >= 20 ? 4 : attempts.length >= 10 ? 3 : attempts.length >= 3 ? 2 : 1;
  const challengeArena: LearningZone = {
    id: 'zone_challenge_arena',
    name: 'Challenge Arena',
    tagline: 'PvP & Solo Colosseum',
    type: 'challenge_arena',
    level: arenaLevel,
    tierName: arenaLevel >= 4 ? 'Imperial Colosseum' : arenaLevel >= 2 ? 'Battle Ground' : 'Training Pit',
    icon: '⚔️',
    masteryPercent: accuracyRate,
    completedQuests: attempts.length,
    totalQuests: Math.max(25, attempts.length + 10),
    status: 'unlocked',
    unlockRequirement: 'Earn 100 XP to Raid',
    actionTitle: 'Enter Arena',
    actionUrl: '/arena',
    accentColor: '#EF4444',
    environmentFeatures: ['Sand Duel Pit', 'Crossed Broadswords', 'Torch Braziers', 'War Banners'],
    gridX: 75,
    gridY: 58,
    position: [3.5, 0, 1.5],
    conceptName: 'PvP & Solo Mastery',
    statsLabel: `${accuracyRate}% Win Accuracy · ${attempts.length} Battles`,
  };

  // 4. PROJECT VALLEY (North-West - Projects & Engineering Works)
  const valleyLevel = getPct(c2) >= 80 ? 4 : getPct(c2) >= 50 ? 3 : getPct(c2) >= 20 ? 2 : 1;
  const isValleyUnlocked = totalXp >= 300 || attempts.length >= 5;
  const projectValley: LearningZone = {
    id: 'zone_project_valley',
    name: 'Project Valley',
    tagline: 'Engineering Forge & Watermill',
    type: 'project_valley',
    level: valleyLevel,
    tierName: valleyLevel >= 4 ? 'Grand Foundry' : valleyLevel >= 2 ? 'Master Workshop' : 'Crafting Forge',
    icon: '🛠️',
    masteryPercent: getPct(c2),
    completedQuests: Math.floor(attempts.length * 0.3),
    totalQuests: 12,
    status: isValleyUnlocked ? 'unlocked' : 'locked',
    unlockRequirement: 'Reach 300 Total XP',
    actionTitle: 'Build Projects',
    actionUrl: `/quest?concept=${encodeURIComponent(c2.id)}`,
    accentColor: '#F59E0B',
    environmentFeatures: ['River Watermill', 'Smoking Anvil Chimney', 'Stone Arch Bridge', 'Lumber Mills'],
    gridX: 30,
    gridY: 30,
    position: [-3, 0, -2],
    conceptName: c2.name,
    statsLabel: `${wood} Wood · ${stone} Stone Crafted`,
  };

  // 5. CAREER CITY (North-Center - Industry & Career Spire)
  const isCityUnlocked = currentTierInfo.tier >= 2 || totalXp >= 600;
  const cityLevel = totalXp >= 2000 ? 4 : totalXp >= 1000 ? 3 : totalXp >= 600 ? 2 : 1;
  const careerCity: LearningZone = {
    id: 'zone_career_city',
    name: 'Career City',
    tagline: 'Sky Spires & Industry Relay',
    type: 'career_city',
    level: cityLevel,
    tierName: cityLevel >= 4 ? 'Metropolis Spire' : cityLevel >= 2 ? 'Tech Hub' : 'Ascent Tower',
    icon: '🏙️',
    masteryPercent: avgMastery,
    completedQuests: 0,
    totalQuests: 8,
    status: isCityUnlocked ? 'unlocked' : 'locked',
    unlockRequirement: 'Achieve Tier 2 Settlement',
    actionTitle: 'Explore Careers',
    actionUrl: '/career',
    accentColor: '#8B5CF6',
    environmentFeatures: ['Gilded Sky Towers', 'Satellite Relay Dish', 'Neon Cloudline', 'Citadel Gates'],
    gridX: 50,
    gridY: 14,
    position: [0, 0, -4.5],
    conceptName: 'Professional Credentials',
    statsLabel: isCityUnlocked ? 'Career Pathways Online' : 'Unlocks at 600 XP',
  };

  const zones = {
    learningCamp,
    skillDistrict,
    challengeArena,
    projectValley,
    careerCity,
  };

  return {
    learnerName: store.handle || 'Commander',
    learnerLevel,
    totalXp,
    worldLevel: currentTierInfo.tier,
    worldLevelName: currentTierInfo.name,
    worldProgressPercent,
    currentXpInTier: inTier,
    xpNeededForNextTier,
    streakDays: streak,
    accuracyRate,
    workerCount,
    totalWorkers,
    shieldHoursRemaining: 14,
    masteredTopicsCount: masteredCount,
    totalTopicsCount: concepts.length || 5,
    availableQuestsCount: Math.max(3, concepts.length),
    resources: {
      wood,
      stone,
      crystal,
      gold,
    },
    zones,
    buildings: {
      knowledgeCamp: learningCamp,
      knowledgeCore: learningCamp,
      courseAcademy: skillDistrict,
      skillLab: projectValley,
      challengeArena: challengeArena,
      rewardVault: learningCamp,
      practiceGrounds: projectValley,
      careerHub: careerCity,
      hq: learningCamp,
      library: skillDistrict,
      questBoard: challengeArena,
      aiLab: projectValley,
      goldVault: learningCamp,
      elixirCondenser: skillDistrict,
      workshop: projectValley,
    } as any,
    mentor: {
      npcName: 'XYRA (Commander)',
      avatarIcon: '🤖',
      greeting: `Commander ${store.handle || 'Learner'}! Your territory has ${workerCount} active builders.`,
      recommendedConceptId: c0.id,
      recommendedConceptName: c0.name,
      challengeTitle: `Adaptive Quest: ${c0.name}`,
      difficultyLabel: accuracyRate > 80 ? 'Mastery Raid' : 'Target Practice',
      actionUrl: `/quest?concept=${encodeURIComponent(c0.id)}`,
    },
  };
}
