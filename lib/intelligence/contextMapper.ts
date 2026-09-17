/**
 * Xpedition Intelligence Layer v1 — Learner State Mapper
 *
 * Derives the normalized LearnerState purely from existing Xpedition user store data,
 * concept mastery records, profile preferences, and attempt logs.
 * Zero duplicate mastery calculations. Zero fabricated data.
 */

import { LearnerState } from './types';
import type { ConceptMastery, LearnerProfileData, Attempt, UserStoreData } from '../store';

export function mapStoreToLearnerState(
  storeData?: Partial<UserStoreData>,
  explicitConceptId?: string
): LearnerState {
  const activeGraph = storeData?.graphs?.find((g) => g.id === storeData?.activeGraphId) || storeData?.graphs?.[0];
  const profile: Partial<LearnerProfileData> = activeGraph?.learnerProfile || storeData?.learnerProfile || {};
  const concepts: ConceptMastery[] = activeGraph?.concepts || storeData?.concepts || [];
  const attempts: Attempt[] = activeGraph?.attempts || storeData?.attempts || [];
  const activeSession = activeGraph?.activeSession || storeData?.activeSession;

  // Determine current focus concept
  let currentConcept: ConceptMastery | undefined;
  if (explicitConceptId) {
    currentConcept = concepts.find((c) => c.id === explicitConceptId);
  } else if (activeSession?.conceptId) {
    currentConcept = concepts.find((c) => c.id === activeSession.conceptId);
  }

  if (!currentConcept && concepts.length > 0) {
    // Pick lowest mastery concept or first concept
    currentConcept = concepts.slice().sort((a, b) => (a.masteryPercentage ?? 0) - (b.masteryPercentage ?? 0))[0];
  }

  // Filter attempts for target concept (or all recent attempts if not concept-specific)
  const conceptAttempts = currentConcept
    ? attempts.filter((a) => a.conceptId === currentConcept!.id)
    : attempts;

  const totalAttemptsCount = attempts.length;
  const recentSlice = conceptAttempts.slice(-5);
  const correctCount = recentSlice.filter((a) => a.isCorrect).length;
  const recentAccuracy = recentSlice.length > 0 ? correctCount / recentSlice.length : 1.0;
  const recentMistakeCount = recentSlice.filter((a) => !a.isCorrect).length;

  // Check for repeated mistakes on the same item
  const itemMistakeCounts = new Map<string, number>();
  for (const a of conceptAttempts) {
    if (!a.isCorrect && a.itemHash) {
      itemMistakeCounts.set(a.itemHash, (itemMistakeCounts.get(a.itemHash) || 0) + 1);
    }
  }
  const repeatedMistakes = Array.from(itemMistakeCounts.values()).some((count) => count >= 2);

  // High-confidence wrong: confident ('known') but incorrect
  const highConfidenceWrong = recentSlice.filter((a) => a.confidence === 'known' && !a.isCorrect).length;

  // Low-confidence correct: unsure but correct
  const lowConfidenceCorrect = recentSlice.filter((a) => a.confidence === 'unsure' && a.isCorrect).length;

  const currentMastery = currentConcept?.masteryPercentage ?? 0;
  const isNewLearner = totalAttemptsCount === 0 || (currentMastery < 20 && conceptAttempts.length === 0);

  // Weak concepts (< 60% mastery)
  const weakConcepts = concepts
    .filter((c) => c.masteryPercentage < 60)
    .map((c) => ({
      id: c.id,
      name: c.name,
      mastery: c.masteryPercentage,
      retentionRisk: c.retentionRisk ?? 0,
    }));

  // Fading concepts (> 0.35 retention risk and previously practiced)
  const fadingConcepts = concepts
    .filter((c) => (c.retentionRisk ?? 0) > 0.35 && c.ptsSinceCalibration > 0)
    .map((c) => ({
      id: c.id,
      name: c.name,
      mastery: c.masteryPercentage,
      retentionRisk: c.retentionRisk ?? 0,
    }));

  // Exam deadline calculations if configured
  const examDateStr = profile.testDate || profile.deadlineDate;
  let daysUntilExam: number | undefined;
  if (examDateStr) {
    const examTime = new Date(examDateStr).getTime();
    if (!isNaN(examTime)) {
      const diffMs = examTime - Date.now();
      daysUntilExam = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }
  }

  // Session context if in-progress
  let sessionContext: LearnerState['sessionContext'];
  if (activeSession && activeSession.conceptId && activeSession.currentIndex < activeSession.totalLength) {
    sessionContext = {
      conceptId: activeSession.conceptId,
      conceptName: activeSession.conceptName || currentConcept?.name || 'Active Session',
      currentIndex: activeSession.currentIndex,
      totalLength: activeSession.totalLength,
      inProgress: true,
    };
  }

  // Calculate XP, Level, and Streak derived from attempts and points
  const totalPts = concepts.reduce((sum, c) => sum + (c.ptsSinceCalibration || 0), 0);
  const xp = totalPts > 0 ? totalPts : attempts.filter((a) => a.isCorrect).length * 10;
  const level = Math.max(1, Math.floor(xp / 100) + 1);

  const attemptDays = new Set(
    attempts.map((a) => new Date(a.timestamp || Date.now()).toDateString())
  );
  const streak = attemptDays.size;

  return {
    learnerId: profile.name || undefined,
    goalText: profile.topic || activeGraph?.goalText || storeData?.goalText || 'General Learning',
    currentConceptId: currentConcept?.id,
    currentConceptName: currentConcept?.name,
    masteryPercentage: currentMastery,
    recentAccuracy,
    recentMistakeCount,
    repeatedMistakes,
    highConfidenceWrong,
    lowConfidenceCorrect,
    forgettingRisk: currentConcept?.retentionRisk ?? 0,
    isNewLearner,
    streak,
    level,
    xp,
    language: profile.language || 'english',
    flowState: storeData?.flowState || 'unknown',
    weakConcepts,
    fadingConcepts,
    examDate: examDateStr,
    daysUntilExam,
    sessionContext,
  };
}

// Backward-compatible alias for existing context callers
export function mapToLearnerContext(params: {
  storeData?: Partial<UserStoreData>;
  profile?: Partial<LearnerProfileData>;
  currentConcept?: Partial<ConceptMastery>;
  recentAttempts?: Attempt[];
  weakConcepts?: ConceptMastery[];
}): LearnerState {
  return mapStoreToLearnerState(params.storeData, params.currentConcept?.id);
}
