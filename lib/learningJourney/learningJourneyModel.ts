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

  const roadmap = [
    ['What Is a Neuron?', 'neural_network_basics', 6, 'Understand the basic idea of an artificial neuron.'],
    ['Inputs & Features', 'neural_network_inputs', 6, 'See how real-world information becomes numeric inputs.'],
    ['Weights', 'neural_network_weights', 7, 'Discover how weights control the importance of each input.'],
    ['Weighted Sum', 'neural_network_weighted_sum', 7, 'Calculate how inputs and weights combine.'],
    ['Bias', 'neural_network_bias', 6, 'See why a neuron needs a bias term.'],
    ['Activation Function', 'neural_network_activation', 8, 'Turn a weighted signal into a useful neuron output.'],
    ['Hidden Layers', 'neural_network_hidden_layers', 10, 'Stack neurons to learn more complex patterns.'],
    ['Forward Propagation', 'neural_network_forward', 10, 'Watch information travel through the network.'],
    ['Prediction & Loss', 'neural_network_loss', 9, 'Compare a prediction with the correct answer.'],
    ['Backpropagation', 'neural_network_backprop', 12, 'Trace error backward through the network.'],
    ['Attention & Transformers', 'neural_network_attention', 15, 'See how modern models decide what to focus on.'],
    ['LLM Next-Token Prediction', 'neural_network_llm', 15, 'Connect neural networks to modern language models.'],
  ] as const;

  const defaultNodes: JourneyNode[] = roadmap.map(([title, conceptId, estimatedMinutes, description], idx) => ({
    id: `node-${idx + 1}`,
    stepNumber: idx + 1,
    title,
    subtitle: idx === 0 ? 'Current Lesson' : 'Next',
    status: idx === 0 ? 'current' : 'locked',
    estimatedMinutes,
    description,
    conceptId,
    coords: { x: 50, y: 8 + idx * 7.5 },
  }));

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
  const completedConcepts = new Set(attempts.filter((a) => a.score >= 0.7).map((a) => a.conceptId));
  const firstIncomplete = defaultNodes.findIndex((n) => !completedConcepts.has(n.conceptId));
  const currentNodeIndex = firstIncomplete < 0 ? defaultNodes.length - 1 : firstIncomplete;
  const nodes: JourneyNode[] = defaultNodes.map((node, idx) => ({
    ...node,
    status: completedConcepts.has(node.conceptId)
      ? 'completed'
      : idx === currentNodeIndex
      ? 'current'
      : idx < currentNodeIndex
      ? 'completed'
      : 'locked',
    subtitle: completedConcepts.has(node.conceptId)
      ? 'Mastered'
      : idx === currentNodeIndex
      ? 'Current Lesson'
      : 'Next',
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
      completedCount: masteredCount,
      totalCount: nodes.length,
      progressPercentage: attempts.length > 0 ? stats.masteryPercentage : 0,
      level: stats.level,
      levelTitle,
    },
    currentLesson: {
      conceptId: current.conceptId,
      title: 'Neural Networks',
      conceptNumberLabel: `Concept ${currentIdx + 1} of ${nodes.length}`,
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
