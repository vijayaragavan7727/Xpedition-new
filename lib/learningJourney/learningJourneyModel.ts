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
      title: 'Neural Networks',
      subtitle: 'Current Lesson',
      status: 'current',
      estimatedMinutes: 35,
      description: 'Build neural-network intuition from one neuron through attention, transformers, and next-token prediction.',
      conceptId: 'neural_network_basics',
      coords: { x: 50, y: 48 },
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
  const pathway = home.pathway.concepts.filter((c) => c.id === 'neural_network_basics');
  const levelTitle = stats.level >= 4 ? 'Rising Explorer' : stats.level >= 2 ? 'Pathfinder' : 'Apprentice';

  const coords = defaultNodes.map((n) => n.coords);
  // Xpedition currently ships one focused flagship learning path:
  // Neural Networks. Ignore legacy/pathway topics so the learner never lands
  // on an unrelated or unavailable lesson.
  const nodes: JourneyNode[] = [
    {
      ...defaultNodes[0],
      status: 'current',
      subtitle: 'Current Lesson',
    },
  ];

  const current = nodes.find((n) => n.status === 'current') ?? nodes.find((n) => n.status === 'open') ?? nodes[0];
  const currentIdx = nodes.indexOf(current);
  const template = defaultNodes.find((n) => n.conceptId === current.conceptId);
  const canonical = getCanonicalConcept(current.conceptId);
  const subjectTitle = canonical?.subject || 'Artificial Intelligence';
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
      title: 'Artificial Intelligence',
      topic: 'Now: Neural Networks',
      completedCount: masteredCount,
      totalCount: 1,
      progressPercentage: attempts.length > 0 ? stats.masteryPercentage : 0,
      level: stats.level,
      levelTitle,
    },
    currentLesson: {
      conceptId: current.conceptId,
      title: 'Neural Networks',
      conceptNumberLabel: 'Concept 1 of 1',
      estimatedMinutes: template?.estimatedMinutes ?? (home.mission.estimatedMinutes || 8),
      description:
        template?.description ??
        'Build neural-network intuition from one neuron through attention, transformers, and next-token prediction.',
      imageSrc: resolveConceptVisual('neural_network_basics', 'Artificial Intelligence'),
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
