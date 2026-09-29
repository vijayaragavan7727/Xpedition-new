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

  const roadmapTopics = [
    ['neural-1', 'One Neuron', 'Inputs, weights & bias'],
    ['neural-2', 'Activation Functions', 'Shape the signal'],
    ['neural-3', 'Forward Propagation', 'Move information forward'],
    ['neural-4', 'Loss Function', 'Measure prediction error'],
    ['neural-5', 'Backpropagation', 'Send gradients backward'],
    ['neural-6', 'Gradient Descent', 'Update the weights'],
    ['neural-8', 'Tokens & Embeddings', 'Turn language into vectors'],
    ['neural-9', 'Self-Attention', 'Connect useful context'],
    ['neural-10', 'Multi-Head Attention', 'Learn different relationships'],
  ] as const;

  const roadmapCoords = [
    { x: 10, y: 18 }, { x: 27, y: 12 }, { x: 45, y: 20 }, { x: 63, y: 13 },
    { x: 82, y: 23 }, { x: 72, y: 40 }, { x: 53, y: 36 }, { x: 33, y: 45 },
  ];

  const defaultNodes: JourneyNode[] = roadmapTopics.map(([id, title, subtitle], index) => ({
    id,
    stepNumber: index + 1,
    title,
    subtitle,
    status: index === 0 ? 'current' : 'open',
    estimatedMinutes: index === 9 ? 6 : 4,
    description: 'Neural-network roadmap topic ' + (index + 1) + ': ' + title + '.',
    conceptId: 'neural_network_basics',
    iconName: index < 6 ? 'brain' : 'sparkles',
    coords: roadmapCoords[index],
  }));

  // ---------------------------------------------------------------------------
  // Everything below reflects the learner's own record. The template path above
  // is only a layout (10 compact map positions) and a suggested pathway for learners who
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
  const masteryPercentage = attempts.length > 0 ? Math.min(100, Math.round(stats.masteryPercentage)) : 0;
  const completedRoadmapCount = masteryPercentage >= 100 ? 10 : masteryPercentage >= 75 ? 8 : masteryPercentage >= 50 ? 5 : masteryPercentage >= 25 ? 2 : 0;
  const nodes: JourneyNode[] = defaultNodes.map((node, index) => ({
    ...node,
    status: index === 0 ? 'current' : index < Math.max(1, completedRoadmapCount + 1) ? 'open' : 'locked',
    subtitle: index === 0 ? 'Current Lesson' : node.subtitle,
  }));

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
      completedCount: completedRoadmapCount,
      totalCount: defaultNodes.length,
      progressPercentage: masteryPercentage,
      level: stats.level,
      levelTitle,
    },
    currentLesson: {
      conceptId: current.conceptId,
      title: 'Neural Networks',
      conceptNumberLabel: 'Concept 1 of 10',
      estimatedMinutes: template?.estimatedMinutes ?? (home.mission.estimatedMinutes || 8),
      description:
        template?.description ??
        'Build neural-network intuition from one neuron through attention and transformer blocks.',
      imageSrc: resolveConceptVisual('neural_network_basics', 'Artificial Intelligence'),
      route: `/class?concept=${encodeURIComponent(current.conceptId)}`,
    },
    nodes,
    progress: {
      percentage: masteryPercentage,
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
