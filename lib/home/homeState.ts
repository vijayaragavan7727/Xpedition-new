/**
 * Xpedition Home Command Center State Resolver
 *
 * Deterministically constructs the student's daily Home command center presentation model
 * directly from canonical store data, learner state, DecisionEngine, NextExperienceResolver,
 * and NextQuestResolver.
 *
 * Invariants:
 * 1. Zero duplicate decision or recommendation engines.
 * 2. Zero fabricated numbers for XP, streak, or mastery.
 * 3. Primary mission strictly resolves via canonical nextQuestResolver.
 * 4. Xira insights are strictly backed by learner telemetry evidence.
 * 5. Returns intentional, graceful empty state for brand new learners without fake progress.
 */

import {
  UserStoreData,
  calculateStreak,
  selectNextTarget,
} from '../store';
import { thetaToPercent } from '../engine/mastery';
import {
  mapStoreToLearnerState,
  defaultDecisionEngine,
  ACTION_CATALOG,
} from '../intelligence';
import { resolveNextExperience } from '../experience/nextExperienceResolver';
import { resolveNextQuest, NextQuestTarget } from '../experience/nextQuestResolver';

export interface HomeConceptItem {
  id: string;
  name: string;
  mastery: number;
  isCurrent: boolean;
  isMastered: boolean;
  retentionRisk: number;
}

export interface HomeState {
  greeting: string;
  learnerName: string;
  contextSubtitle: string;
  isNewLearner: boolean;

  // Section C & D: Primary Mission & Primary CTA
  mission: {
    title: string;
    conceptName: string;
    conceptId: string;
    actionBadge: string;
    isExperiential: boolean;
    experienceTypeLabel?: string;
    reason: string;
    estimatedMinutes: number;
    buttonLabel: string;
    route: string;
    nextQuestTarget: NextQuestTarget;
  };

  // Section E: Progress Snapshot
  stats: {
    level: number;
    xp: number;
    streak: number;
    masteryPercentage: number;
    progressToNextLevel: number;
    levelProgressPercent: number;
    masteredCount: number;
    totalCount: number;
  };

  // Section F: Continue Learning / Active Pathway
  pathway: {
    goalTitle: string;
    currentConceptId: string;
    currentConceptName: string;
    concepts: HomeConceptItem[];
    overallMastery: number;
  };

  // Section G: Xira Insight
  xiraInsight: {
    tag: string;
    lead: string;
    body: string;
    type: 'MISCONCEPTION' | 'RETENTION' | 'STREAK' | 'MILESTONE' | 'NEW_LEARNER' | 'RECOMMENDATION';
    actionRoute?: string;
    actionLabel?: string;
  };

  // Section H: Quick Entry
  quickEntry: Array<{
    id: string;
    title: string;
    subtitle: string;
    route: string;
    icon: 'learn' | 'world' | 'xira' | 'progress';
  }>;
}

/**
 * Derives the complete Home command center state from user store data.
 */
export function resolveHomeState(
  storeData: UserStoreData,
  options?: {
    currentTime?: Date;
  }
): HomeState {
  const activeGraph =
    storeData.graphs?.find((g) => g.id === storeData.activeGraphId) ||
    storeData.graphs?.[0];

  const attempts = (activeGraph?.attempts || storeData.attempts || []).filter((a) => !a.isVoid);
  const concepts = activeGraph?.concepts || storeData.concepts || [];
  const activeSession = activeGraph?.activeSession || storeData.activeSession;
  const learnerProfile = activeGraph?.learnerProfile || storeData.learnerProfile;

  // 1. Learner Profile & New Learner State
  const isNewLearner = attempts.length === 0;
  const learnerName = learnerProfile?.name || storeData.handle || 'Explorer';
  const goalTitle = activeGraph?.goalText || storeData.goalText || 'Learning Expedition';

  // 2. Greeting & Context Subtitle
  const now = options?.currentTime || new Date();
  const hour = now.getHours();
  let timeGreeting = 'Good evening';
  if (hour < 12) timeGreeting = 'Good morning';
  else if (hour < 17) timeGreeting = 'Good afternoon';

  const streak = calculateStreak(attempts);

  // Calculate mastery counts
  const masteredCount = concepts.filter(
    (c) => (c.thetaSolo !== undefined ? thetaToPercent(c.thetaSolo) : c.masteryPercentage || 0) >= 80
  ).length;

  const totalCount = concepts.length;
  const overallMastery =
    totalCount > 0
      ? Math.round(
          concepts.reduce(
            (acc, c) => acc + (c.thetaSolo !== undefined ? thetaToPercent(c.thetaSolo) : c.masteryPercentage || 0),
            0
          ) / totalCount
        )
      : 0;

  const fadingConcepts = concepts.filter((c) => (c.retentionRisk || 0) > 0.35);

  let contextSubtitle: string;
  if (isNewLearner) {
    contextSubtitle = 'Your expedition begins here. Calibration complete.';
  } else if (activeSession && activeSession.conceptId && activeSession.currentIndex < activeSession.totalLength) {
    contextSubtitle = `Resuming active session in ${activeSession.conceptName || 'concept'} (${activeSession.currentIndex} of ${activeSession.totalLength} completed).`;
  } else if (fadingConcepts.length > 0) {
    contextSubtitle = `${fadingConcepts.length} concept${fadingConcepts.length > 1 ? 's' : ''} need a quick review to protect retention.`;
  } else if (streak >= 3) {
    contextSubtitle = `${streak}-day streak active. Steady daily momentum.`;
  } else if (masteredCount > 0) {
    contextSubtitle = `${masteredCount} of ${totalCount} milestones mastered in ${goalTitle}.`;
  } else {
    contextSubtitle = `Ready for your next learning challenge in ${goalTitle}.`;
  }

  // 3. Adaptive Intelligence Flow:
  // LearnerState -> DecisionEngine -> Next Experience Resolver -> Next Quest Resolver -> Mission
  const target = selectNextTarget(storeData);
  const targetConceptId = target?.conceptId;

  const learnerState = mapStoreToLearnerState(storeData, targetConceptId);
  const nextAction = defaultDecisionEngine.decideNextAction(learnerState);
  const resolvedExperience = resolveNextExperience(
    nextAction.action,
    nextAction.targetConceptId,
    learnerState
  );
  const nextQuest = resolveNextQuest({
    action: nextAction.action,
    conceptId: nextAction.targetConceptId,
    learnerState,
    resolvedExperience,
  });

  // Action badge and experience type label
  const actionBadge = ACTION_CATALOG[nextAction.action]?.name || 'Adaptive Quest';
  let experienceTypeLabel: string | undefined;
  if (nextQuest.isExperiential && nextQuest.experienceType) {
    switch (nextQuest.experienceType) {
      case 'CODE_DEBUGGING':
        experienceTypeLabel = 'Interactive Code Lab';
        break;
      case 'PROJECTILE_SIMULATION':
        experienceTypeLabel = 'Physics Simulation';
        break;
      case 'OBJECT_MANIPULATION':
        experienceTypeLabel = '3D Spatial Lab';
        break;
      case 'MOLECULE_BUILDER':
        experienceTypeLabel = '3D Molecule Builder';
        break;
      case 'HEART_ANATOMY_EXPLORER':
        experienceTypeLabel = '3D Anatomy Explorer';
        break;
    }
  }

  // Determine Mission Title and Button Label
  let missionTitle = nextQuest.title;
  let missionButtonLabel = nextQuest.buttonLabel;
  let missionReason = nextQuest.reason;

  if (isNewLearner) {
    missionTitle = `Start your first quest: ${nextQuest.conceptName}`;
    missionButtonLabel = 'Start your first quest';
    missionReason = 'Your expedition begins here. Complete your opening challenge to unlock your learning world.';
  }

  const mission = {
    title: missionTitle,
    conceptName: nextQuest.conceptName,
    conceptId: nextQuest.conceptId,
    actionBadge,
    isExperiential: nextQuest.isExperiential,
    experienceTypeLabel,
    reason: missionReason,
    estimatedMinutes: nextAction.estimatedMinutes || 10,
    buttonLabel: missionButtonLabel,
    route: nextQuest.route,
    nextQuestTarget: nextQuest,
  };

  // 4. Progress Snapshot Metrics (strictly real data)
  const correctCount = attempts.filter((a) => a.isCorrect).length;
  const totalAttempts = attempts.length;
  const totalXp = correctCount * 25 + totalAttempts * 10 + masteredCount * 100;
  const level = Math.floor(totalXp / 300) + 1;
  const xpInLevel = totalXp % 300;
  const progressToNextLevel = 300 - xpInLevel;
  const levelProgressPercent = Math.min(100, Math.round((xpInLevel / 300) * 100));

  const stats = {
    level,
    xp: totalXp,
    streak,
    masteryPercentage: overallMastery,
    progressToNextLevel,
    levelProgressPercent,
    masteredCount,
    totalCount,
  };

  // 5. Active Pathway Hierarchy
  const pathwayConcepts: HomeConceptItem[] = concepts.slice(0, 5).map((c) => {
    const masteryVal = c.thetaSolo !== undefined ? thetaToPercent(c.thetaSolo) : c.masteryPercentage || 0;
    return {
      id: c.id,
      name: c.name,
      mastery: masteryVal,
      isCurrent: c.id === targetConceptId || c.id === nextQuest.conceptId,
      isMastered: masteryVal >= 80,
      retentionRisk: c.retentionRisk || 0,
    };
  });

  const pathway = {
    goalTitle,
    currentConceptId: nextQuest.conceptId,
    currentConceptName: nextQuest.conceptName,
    concepts: pathwayConcepts,
    overallMastery,
  };

  // 6. Xira Insight: strictly grounded in learner evidence
  let xiraInsight: HomeState['xiraInsight'];

  if (isNewLearner) {
    xiraInsight = {
      tag: 'Expedition Start',
      lead: 'Your learning baseline is initialized.',
      body: `Xira has mapped your foundational milestones for ${goalTitle}. Complete your first hands-on challenge to start unlocking your Learning World.`,
      type: 'NEW_LEARNER',
      actionRoute: nextQuest.route,
      actionLabel: 'Begin Quest',
    };
  } else if (learnerState.repeatedMistakes || learnerState.recentMistakeCount >= 2) {
    xiraInsight = {
      tag: 'Misconception Spotted',
      lead: `Xira noticed recurring friction in ${nextQuest.conceptName}.`,
      body: `You are encountering repeated mistakes on the underlying pattern. A guided hands-on correction will build the right intuitive mental model.`,
      type: 'MISCONCEPTION',
      actionRoute: nextQuest.route,
      actionLabel: 'Correct Now',
    };
  } else if (fadingConcepts.length > 0) {
    const fading = fadingConcepts[0];
    const riskPct = Math.round(fading.retentionRisk * 100);
    xiraInsight = {
      tag: 'Memory Retention',
      lead: `Retention risk is rising for "${fading.name}".`,
      body: `Recall confidence is estimated at ${100 - riskPct}%. A fast 5-minute refresher will anchor this concept into permanent long-term memory.`,
      type: 'RETENTION',
      actionRoute: `/quest?concept=${encodeURIComponent(fading.id)}&mode=review`,
      actionLabel: 'Quick Review',
    };
  } else if (streak >= 3) {
    xiraInsight = {
      tag: 'Learning Momentum',
      lead: `You are on a ${streak}-day daily streak!`,
      body: `Consistent daily practice dramatically reduces memory decay. You're well on track to master ${goalTitle}.`,
      type: 'STREAK',
      actionRoute: '/progress',
      actionLabel: 'View Analytics',
    };
  } else if (masteredCount > 0) {
    xiraInsight = {
      tag: 'Milestone Progress',
      lead: `You have mastered ${masteredCount} core milestone${masteredCount > 1 ? 's' : ''}.`,
      body: `Your foundation in ${goalTitle} is solidifying. Moving to ${nextQuest.conceptName} is the next natural step in your graph.`,
      type: 'MILESTONE',
      actionRoute: nextQuest.route,
      actionLabel: 'Next Challenge',
    };
  } else {
    xiraInsight = {
      tag: 'Recommended Focus',
      lead: `Ready to explore ${nextQuest.conceptName}.`,
      body: `Your next quest provides hands-on practice directly tailored to your current skill level.`,
      type: 'RECOMMENDATION',
      actionRoute: nextQuest.route,
      actionLabel: 'Start Practice',
    };
  }

  // 7. Quick Entry Portals
  const quickEntry = [
    {
      id: 'learn',
      title: 'Curriculum',
      subtitle: 'Knowledge Map',
      route: '/learn',
      icon: 'learn' as const,
    },
    {
      id: 'world',
      title: 'Learning World',
      subtitle: 'Interactive Realm',
      route: '/world',
      icon: 'world' as const,
    },
    {
      id: 'xira',
      title: 'Ask Xira',
      subtitle: 'Pedagogical AI',
      route: '/xira',
      icon: 'xira' as const,
    },
    {
      id: 'progress',
      title: 'Progress',
      subtitle: 'Mastery & Stats',
      route: '/progress',
      icon: 'progress' as const,
    },
  ];

  return {
    greeting: `${timeGreeting}, ${learnerName}`,
    learnerName,
    contextSubtitle,
    isNewLearner,
    mission,
    stats,
    pathway,
    xiraInsight,
    quickEntry,
  };
}
