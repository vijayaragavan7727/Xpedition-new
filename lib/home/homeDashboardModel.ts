/**
 * Xpedition Home Dashboard Presentation View-Model
 *
 * Transforms canonical learner state and adaptive intelligence into a decoupled
 * presentation model for the Home/Dashboard UI.
 *
 * Invariants:
 * 1. Zero duplicate intelligence/mastery engines — delegates directly to resolveHomeState().
 * 2. Learner display name is derived from authenticated profile with a neutral fallback ("Learner").
 * 3. Concept visuals and learning cards are dynamic and support any course (Physics, Python, Biology, Math, etc.).
 * 4. Sample reference assets (DC Motor, Magnetic Fields) serve as high-fidelity visual representations.
 */

import { UserStoreData } from '../store';
import { buildPassportView, PASSPORT_SUBJECTS } from '../passport/passportView';
import { getCanonicalConcept } from '../concepts/conceptRegistry';
import { resolveHomeState, HomeState } from './homeState';

export interface ConceptVisualProps {
  conceptId: string;
  title: string;
  subject: string;
  topic?: string;
  visualAsset?: string;
  durationMinutes?: number;
}

export interface ContinueLearningCardData {
  conceptId: string;
  title: string;
  subject: string;
  topic: string;
  durationLabel: string;
  route: string;
  buttonLabel: string;
  visualAsset: string;
  badgeLabel: string;
}

export interface NextUpCardData {
  conceptId: string;
  title: string;
  subject: string;
  durationLabel: string;
  route: string;
  buttonLabel: string;
  visualAsset: string;
  badgeLabel: string;
  iconType?: string;
}

export interface ProgressCardData {
  percentage: number;
  level: number;
  levelTitle: string;
  currentXp: number;
  targetXp: number;
  streak: number;
}

export interface FocusItem {
  id: string;
  label: string;
  completed: boolean;
}

export interface PassportCardData {
  hasPassport: boolean;
  subjectTitle: string;
  statusBadge: string;
  route: string;
  coverImage: string;
  emptyStateText?: string;
  emptyStateCta?: string;
}

export interface HomeDashboardData {
  learnerName: string;
  greetingTitle: string;
  quoteSubtitle: string;
  continueLearning: ContinueLearningCardData;
  nextUp: NextUpCardData;
  progress: ProgressCardData;
  todaysFocus: FocusItem[];
  passports: PassportCardData[];
  worldCta: {
    title: string;
    description: string;
    route: string;
    buttonLabel: string;
    imageAsset: string;
  };
}

/**
 * Resolves the appropriate concept visual asset path.
 * Supports supplied sample assets while gracefully accommodating any curriculum subject.
 */
export function resolveConceptVisual(conceptId: string, subject?: string, isNextUp = false): string {
  const normId = (conceptId || '').toLowerCase();
  const normSub = (subject || '').toLowerCase();

  if (normId.includes('neural_network') || normId.includes('neuralnetwork')) {
    return '/images/neural-network/step-01-one-neuron.png';
  }
  if (normId.includes('motor') || normId.includes('commutat') || normId.includes('mechanic') || normId.includes('torque')) {
    return '/images/home/home-dc-motor.png';
  }
  if (normId.includes('magnet') || normId.includes('field') || normId.includes('induction') || normId.includes('flux')) {
    return '/images/home/home-magnetic-fields.png';
  }
  // Otherwise show the concept's subject stamp (a motor picture on a heart or
  // periodic-table card misrepresents the lesson).
  const canonicalSubject = getCanonicalConcept(conceptId)?.subject?.toLowerCase() ?? '';
  const stamp = PASSPORT_SUBJECTS.find((s) => {
    const name = s.subject.toLowerCase();
    return canonicalSubject === name || (!canonicalSubject && normSub.includes(name));
  });
  if (stamp) return `/images/passport/stamp-${stamp.slug}.png`;
  if (!canonicalSubject && normSub.includes('physics')) {
    return isNextUp ? '/images/home/home-magnetic-fields.png' : '/images/home/home-dc-motor.png';
  }
  return '/images/passport/cover-front.png';
}

/** Subject shown on a lesson card: the concept's canonical subject when known. */
function subjectForConcept(conceptId: string | undefined, fallback: string): string {
  return (conceptId && getCanonicalConcept(conceptId)?.subject) || fallback;
}

/**
 * Derives the complete HomeDashboardData presentation model.
 */
export function resolveHomeDashboardData(
  storeData: UserStoreData | null,
  authUser?: { user_metadata?: { full_name?: string; name?: string }; email?: string } | null
): HomeDashboardData {
  // 1. Resolve Learner Display Name
  const rawName =
    authUser?.user_metadata?.full_name ||
    authUser?.user_metadata?.name ||
    storeData?.learnerProfile?.name ||
    (storeData?.handle && storeData.handle !== 'Learner' && storeData.handle !== 'Explorer' ? storeData.handle : null);

  const learnerName = rawName || 'Learner';

  // 2. Resolve Canonical Home State from existing intelligence
  const baseStore: UserStoreData = storeData || {
    handle: 'Learner',
    activeGraphId: 'graph_default',
    graphs: [],
    goalText: 'Physics & Applied Mechanics',
    concepts: [],
    quests: [],
    attempts: [],
    rewardsCount: 0,
    flowState: 'unknown',
  };

  const homeState: HomeState = resolveHomeState(baseStore);
  const attempts = baseStore.attempts || [];
  const concepts = baseStore.concepts || [];
  const activeSession = baseStore.activeSession;

  // 3. Time-aware greeting
  const hour = new Date().getHours();
  let timeOfDay = 'Good morning';
  if (hour >= 12 && hour < 17) timeOfDay = 'Good afternoon';
  else if (hour >= 17) timeOfDay = 'Good evening';

  const greetingTitle = `${timeOfDay}, ${learnerName} 👋`;
  const quoteSubtitle = '“A little progress each day leads to big results.”';

  // 4. Continue Learning Card Data
  const isDefaultOrEmpty = !activeSession?.conceptName && concepts.length === 0;
  
  // Use student's real concept when present; fall back cleanly to approved sample concept
  const currentTitle = isDefaultOrEmpty
    ? 'Neural Networks'
    : activeSession?.conceptName || homeState.mission.conceptName || 'Neural Networks';

  const currentSubject = isDefaultOrEmpty
    ? 'Physics'
    : subjectForConcept(
        activeSession?.conceptId || homeState.mission.conceptId,
        baseStore.goalText?.includes('Physics') ? 'Physics' : baseStore.goalText || 'Physics'
      );

  const currentTopic = isDefaultOrEmpty
    ? 'Neural Networks'
    : homeState.mission.experienceTypeLabel || 'Core Concept';

  const durationMin = homeState.mission.estimatedMinutes || 8;
  const currentConceptId = isDefaultOrEmpty ? 'neural_network_basics' : homeState.mission.conceptId;
  const currentRoute = `/class?concept=${encodeURIComponent(currentConceptId)}`;

  // Nothing recorded on this concept yet: the learner is starting it, not resuming.
  const hasStartedCurrent =
    !isDefaultOrEmpty &&
    (activeSession?.conceptId === currentConceptId || attempts.some((a) => a.conceptId === currentConceptId));

  const continueLearning: ContinueLearningCardData = {
    conceptId: currentConceptId,
    title: currentTitle,
    subject: currentSubject,
    topic: currentTopic,
    durationLabel: hasStartedCurrent ? `${durationMin} min left` : `${durationMin} min`,
    route: currentRoute,
    // A learner with nothing recorded yet is starting, not resuming.
    buttonLabel: hasStartedCurrent ? 'Resume Lesson' : 'Start Lesson',
    visualAsset: resolveConceptVisual(currentConceptId, currentSubject, false),
    badgeLabel: hasStartedCurrent ? 'Continue Learning' : isDefaultOrEmpty ? 'Suggested First Lesson' : 'Start Learning',
  };

  // 5. Next Up Card Data
  const nextConceptFromPathway = homeState.pathway.concepts.find(
    (c) => c.id !== homeState.mission.conceptId && !c.isMastered
  );

  const nextTitle = isDefaultOrEmpty
    ? 'Lorentz Force & Magnetic Fields'
    : nextConceptFromPathway?.name || 'Lorentz Force & Magnetic Fields';

  const nextSubject = isDefaultOrEmpty
    ? 'Physics'
    : subjectForConcept(nextConceptFromPathway?.id, currentSubject);

  const nextUp: NextUpCardData = {
    conceptId: isDefaultOrEmpty ? 'electromagnetic_force' : (nextConceptFromPathway?.id || 'electromagnetic_force'),
    title: nextTitle,
    subject: nextSubject,
    durationLabel: '5 min',
    route: `/class?concept=${encodeURIComponent(isDefaultOrEmpty ? 'electromagnetic_force' : (nextConceptFromPathway?.id || 'electromagnetic_force'))}`,
    buttonLabel: 'Start',
    visualAsset: resolveConceptVisual(isDefaultOrEmpty ? 'electromagnetic_force' : (nextConceptFromPathway?.id || 'electromagnetic_force'), nextSubject, true),
    badgeLabel: 'Next Up',
    iconType: 'magnet',
  };

  // 6. Your Progress Card Data: always the learner's real figures (the same
  //    XP / level formula the Passport uses); a new learner sees zeros.
  const stats = homeState.stats;
  const progressLevel = stats.level;
  const progressLevelTitle = progressLevel >= 4 ? 'Rising Explorer' : progressLevel >= 2 ? 'Pathfinder' : 'Apprentice';

  const progress: ProgressCardData = {
    percentage: attempts.length > 0 ? stats.masteryPercentage : 0,
    level: progressLevel,
    levelTitle: progressLevelTitle,
    currentXp: stats.xp,
    targetXp: stats.xp + stats.progressToNextLevel,
    streak: stats.streak,
  };

  // 7. Today's Focus Checklist: ticked only by what was actually recorded today.
  const isLessonComplete = Boolean(activeSession && activeSession.currentIndex >= activeSession.totalLength);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const answersToday = attempts.filter((a) => a.timestamp >= startOfToday.getTime()).length;

  const todaysFocus: FocusItem[] = [
    {
      id: 'focus-lesson',
      label: `Complete ${isDefaultOrEmpty ? 'Neural Networks' : currentTitle} lesson`,
      completed: isLessonComplete,
    },
    {
      id: 'focus-practice',
      label: 'Attempt 5 practice questions',
      completed: answersToday >= 5,
    },
    {
      id: 'focus-explore',
      label: 'Explore career paths',
      completed: false,
    },
  ];

  // 8. Your Passports Card Data: subject stamps the learner's record supports.
  const passportView = buildPassportView(baseStore);
  const passports: PassportCardData[] = passportView.subjects
    .filter((subject) => subject.state !== 'not_started')
    .sort((a, b) => (a.state === b.state ? 0 : a.state === 'mastered' ? -1 : 1))
    .slice(0, 4)
    .map((subject) => ({
      hasPassport: true,
      subjectTitle: subject.subject,
      statusBadge: subject.state === 'mastered' ? 'Mastered' : 'In progress',
      route: '/passport',
      coverImage: '/images/home/home-passport-preview.png',
    }));

  // 9. Explore the World Banner
  const worldCta = {
    title: 'Explore the World',
    description: 'Discover new places, cultures and real-world connections.',
    route: '/world',
    buttonLabel: 'Go to World',
    imageAsset: '/images/home/home-explore-world.jpg',
  };

  return {
    learnerName,
    greetingTitle,
    quoteSubtitle,
    continueLearning,
    nextUp,
    progress,
    todaysFocus,
    passports,
    worldCta,
  };
}
