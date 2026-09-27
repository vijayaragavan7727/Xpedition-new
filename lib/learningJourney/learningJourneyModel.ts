/**
 * Xpedition Pre-Class Learning Journey Data Model & Resolver
 *
 * Connects canonical UserStoreData, learnerProfile, and active pathway to the
 * warm, illustrative Learning Journey screen.
 */

import { UserStoreData } from '../store';
import { resolveHomeState } from '../home/homeState';
import { resolveConceptVisual } from '../home/homeDashboardModel';
import { buildPassportView } from '../passport/passportView';
import { getCanonicalConcept } from '../concepts/conceptRegistry';

/** 'open' = available in the learner's pathway but not the current lesson. */
export type NodeStatus = 'completed' | 'current' | 'open' | 'locked';

export interface JourneyNode {
  id: string;
  stepNumber: number;
  title: string;
  subtitle: string;
  status: NodeStatus;
  estimatedMinutes?: number;
  description?: string;
  conceptId: string;
  iconName?: string;
  coords: { x: number; y: number }; // Relative percentage coordinates on 2D map
}

export interface LearningJourneyData {
  learnerName: string;
  greetingTitle: string;
  quoteSubtitle: string;
  subject: {
    id: string;
    title: string;
    topic: string;
    completedCount: number;
    totalCount: number;
    progressPercentage: number;
    level: number;
    levelTitle: string;
  };
  currentLesson: {
    conceptId: string;
    title: string;
    conceptNumberLabel: string;
    estimatedMinutes: number;
    description: string;
    imageSrc: string;
    route: string;
  };
  nodes: JourneyNode[];
  progress: {
    percentage: number;
    level: number;
    levelTitle: string;
    currentXp: number;
    targetXp: number;
  };
  todayFocus: {
    id: string;
    text: string;
    isCompleted: boolean;
  }[];
  passport: {
    subject: string;
    status: string;
    route: string;
    coverSrc: string;
  };
  world: {
    title: string;
    description: string;
    route: string;
    thumbnailSrc: string;
  };
}

export function resolveLearningJourneyData(
  storeData: UserStoreData | null,
  authUser?: { user_metadata?: { full_name?: string; name?: string }; email?: string } | null
): LearningJourneyData {
  const profileName =
    authUser?.user_metadata?.full_name ||
    authUser?.user_metadata?.name ||
    storeData?.learnerProfile?.name ||
    'Learner';

  const defaultNodes: JourneyNode[] = [
    {
      id: 'node-1',
      stepNumber: 1,
      title: 'Foundations',
      subtitle: 'Completed',
      status: 'completed',
      estimatedMinutes: 6,
      description: 'Master scalar and vector quantities, coordinate systems, and baseline SI unit standards.',
      conceptId: 'physics_foundations',
      coords: { x: 14, y: 27 },
    },
    {
      id: 'node-2',
      stepNumber: 2,
      title: 'Motion & Forces',
      subtitle: 'Completed',
      status: 'completed',
      estimatedMinutes: 10,
      description: 'Analyze acceleration, velocity vectors, and Newton’s governing laws of linear motion.',
      conceptId: 'motion_forces',
      coords: { x: 42, y: 25 },
    },
    {
      id: 'node-3',
      stepNumber: 3,
      title: 'DC Motor & Commutation',
      subtitle: 'Current Lesson',
      status: 'current',
      estimatedMinutes: 8,
      description: 'Explore how a DC motor converts electrical energy into mechanical energy using electromagnetic interactions.',
      conceptId: 'dc_motor',
      coords: { x: 52, y: 44 },
    },
    {
      id: 'node-4',
      stepNumber: 4,
      title: 'Electromagnetic Force',
      subtitle: 'Locked',
      status: 'locked',
      estimatedMinutes: 9,
      description: 'Investigate Lorentz force laws, magnetic flux densities, and right-hand rules.',
      conceptId: 'electromagnetic_force',
      coords: { x: 80, y: 48 },
    },
    {
      id: 'node-5',
      stepNumber: 5,
      title: 'Waves & Sound',
      subtitle: 'Locked',
      status: 'locked',
      estimatedMinutes: 8,
      description: 'Study oscillatory wave propagation, resonance frequencies, and acoustic waves.',
      conceptId: 'waves_sound',
      coords: { x: 76, y: 76 },
    },
    {
      id: 'node-6',
      stepNumber: 6,
      title: 'Energy & Work',
      subtitle: 'Locked',
      status: 'locked',
      estimatedMinutes: 11,
      description: 'Formulate kinetic vs. potential energy conservation across closed thermodynamic systems.',
      conceptId: 'energy_work',
      coords: { x: 50, y: 82 },
    },
    {
      id: 'node-7',
      stepNumber: 7,
      title: 'Simple Machines',
      subtitle: 'Locked',
      status: 'locked',
      estimatedMinutes: 7,
      description: 'Examine levers, pulleys, mechanical advantage, and ideal mechanical efficiency.',
      conceptId: 'simple_machines',
      coords: { x: 26, y: 78 },
    },
    {
      id: 'node-8',
      stepNumber: 8,
      title: 'Final Challenge',
      subtitle: 'Locked',
      status: 'locked',
      estimatedMinutes: 15,
      description: 'Synthesize mechanics, motor dynamics, and energy conservation in a unified mission.',
      conceptId: 'mechanics_final_challenge',
      coords: { x: 14, y: 56 },
    },
  ];

  // ---------------------------------------------------------------------------
  // Everything below reflects the learner's own record. The template path above
  // is only a layout (8 map positions) and a suggested pathway for learners who
  // have not chosen a goal yet; it never marks anything completed for them.
  // ---------------------------------------------------------------------------
  const store: UserStoreData = storeData ?? {
    handle: 'Learner',
    activeGraphId: 'graph_default',
    graphs: [],
    goalText: '',
    concepts: [],
    quests: [],
    attempts: [],
    rewardsCount: 0,
    flowState: 'unknown',
  };
  const home = resolveHomeState(store);
  const stats = home.stats;
  const attempts = store.attempts ?? [];
  const pathway = home.pathway.concepts;
  const levelTitle = stats.level >= 4 ? 'Rising Explorer' : stats.level >= 2 ? 'Pathfinder' : 'Apprentice';

  const coords = defaultNodes.map((n) => n.coords);
  let nodes: JourneyNode[];
  if (pathway.length > 0) {
    const currentId = home.mission.conceptId || home.pathway.currentConceptId;
    nodes = pathway.slice(0, coords.length).map((c, idx) => {
      const practised = attempts.some((a) => a.conceptId === c.id);
      const isCurrent = c.id === currentId;
      // Only the current lesson carries the "Current Lesson" beacon; the rest of the
      // learner's own pathway stays open (Class can teach any of its concepts).
      const status: NodeStatus = c.isMastered ? 'completed' : isCurrent ? 'current' : 'open';
      return {
        id: `node-${idx + 1}`,
        stepNumber: idx + 1,
        title: c.name,
        subtitle: c.isMastered ? 'Mastered' : isCurrent ? 'Current Lesson' : practised ? 'In progress' : 'Not started',
        status,
        conceptId: c.id,
        coords: coords[idx],
      };
    });
  } else {
    // No goal yet: the suggested pathway, with nothing completed.
    nodes = defaultNodes.map((n, idx) => ({
      ...n,
      status: idx === 0 ? 'current' : 'locked',
      subtitle: idx === 0 ? 'Suggested start' : 'Not started',
    }));
  }

  const current = nodes.find((n) => n.status === 'current') ?? nodes.find((n) => n.status === 'open') ?? nodes[0];
  const currentIdx = nodes.indexOf(current);
  const template = defaultNodes.find((n) => n.conceptId === current.conceptId);
  const canonical = getCanonicalConcept(current.conceptId);
  const subjectTitle = canonical?.subject || (pathway.length > 0 ? store.goalText || 'Your pathway' : 'Physics');
  const masteredCount = pathway.filter((c) => c.isMastered).length;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const answersToday = attempts.filter((a) => a.timestamp >= startOfToday.getTime()).length;

  const passportView = buildPassportView(store);
  const firstStamp =
    passportView.subjects.find((x) => x.state === 'mastered') ?? passportView.subjects.find((x) => x.state === 'in_progress');

  return {
    learnerName: profileName,
    greetingTitle: 'Your Learning Journey Continues',
    quoteSubtitle: 'Small steps. Big dreams. One concept at a time.',
    subject: {
      id: canonical?.subject?.toLowerCase().replace(/\s+/g, '_') || 'pathway',
      title: pathway.length > 0 ? store.goalText || 'Your pathway' : 'Physics',
      topic: pathway.length > 0 ? `Now: ${subjectTitle}` : 'Suggested pathway',
      completedCount: masteredCount,
      totalCount: pathway.length > 0 ? pathway.length : nodes.length,
      progressPercentage: attempts.length > 0 ? stats.masteryPercentage : 0,
      level: stats.level,
      levelTitle,
    },
    currentLesson: {
      conceptId: current.conceptId,
      title: current.title,
      conceptNumberLabel: `Concept ${currentIdx + 1} of ${nodes.length}`,
      estimatedMinutes: template?.estimatedMinutes ?? (home.mission.estimatedMinutes || 8),
      description:
        template?.description ??
        (pathway.length > 0 ? `Continue ${current.title} in Class: theory on the Smart Board, then practice.` : ''),
      imageSrc: template?.conceptId === 'dc_motor' ? '/images/learning-journey/dc-motor.png' : resolveConceptVisual(current.conceptId, subjectTitle),
      route: `/class?concept=${encodeURIComponent(current.conceptId)}`,
    },
    nodes,
    progress: {
      percentage: attempts.length > 0 ? stats.masteryPercentage : 0,
      level: stats.level,
      levelTitle,
      currentXp: stats.xp,
      targetXp: stats.xp + stats.progressToNextLevel,
    },
    todayFocus: [
      { id: 'f1', text: `Complete ${current.title} lesson`, isCompleted: false },
      { id: 'f2', text: 'Attempt 5 practice questions', isCompleted: answersToday >= 5 },
      { id: 'f3', text: 'Explore career paths', isCompleted: false },
    ],
    passport: {
      subject: firstStamp ? firstStamp.subject : 'No stamps yet',
      status: firstStamp ? (firstStamp.state === 'mastered' ? 'Mastered' : 'In progress') : 'Start a lesson',
      route: '/passport',
      coverSrc: '/images/learning-journey/passport-mini.png',
    },
    world: {
      title: 'Explore the World',
      description: 'Discover new places, cultures and real-world connections.',
      route: '/world',
      thumbnailSrc: '/images/learning-journey/world-preview.jpg',
    },
  };
}
