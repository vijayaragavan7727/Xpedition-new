/**
 * Xpedition Pre-Class Learning Journey Data Model & Resolver
 *
 * Connects canonical UserStoreData, learnerProfile, and active pathway to the
 * warm, illustrative Learning Journey screen.
 */

import { UserStoreData } from '../store';

export type NodeStatus = 'completed' | 'current' | 'locked';

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
      coords: { x: 14, y: 18 },
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
      coords: { x: 42, y: 16 },
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

  return {
    learnerName: profileName,
    greetingTitle: 'Your Learning Journey Continues',
    quoteSubtitle: 'Small steps. Big dreams. One concept at a time.',
    subject: {
      id: 'physics_mechanics',
      title: 'Physics',
      topic: 'Mechanics',
      completedCount: 2,
      totalCount: 8,
      progressPercentage: 37,
      level: 4,
      levelTitle: 'Rising Explorer',
    },
    currentLesson: {
      conceptId: 'dc_motor',
      title: 'DC Motor & Commutation',
      conceptNumberLabel: 'Concept 3 of 8',
      estimatedMinutes: 8,
      description:
        'Explore how a DC motor converts electrical energy into mechanical energy using electromagnetic interactions.',
      imageSrc: '/images/learning-journey/dc-motor.png',
      route: '/class?concept=dc_motor',
    },
    nodes: defaultNodes,
    progress: {
      percentage: 68,
      level: 4,
      levelTitle: 'Rising Explorer',
      currentXp: 1240,
      targetXp: 2000,
    },
    todayFocus: [
      { id: 'f1', text: 'Complete DC Motor lesson', isCompleted: false },
      { id: 'f2', text: 'Attempt 5 practice questions', isCompleted: true },
      { id: 'f3', text: 'Explore career paths', isCompleted: false },
    ],
    passport: {
      subject: 'Physics',
      status: 'Applied',
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
