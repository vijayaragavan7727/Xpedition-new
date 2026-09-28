/**
 * Passport view model: identity → progress → skills → evidence → achievements.
 *
 * Pure and derived ONLY from the learner's own recorded activity:
 *   - evidence per concept   buildPassportEvidence()  (lib/passport/evidenceModel.ts)
 *   - XP / level / streak    resolveHomeState().stats  (the same real formula Home uses
 *                            for learners with activity; Home's sample figures for
 *                            brand-new learners are NOT used here)
 *   - subject                the canonical concept registry
 *
 * Nothing is invented: a value the record cannot support is left out (null) or
 * shown as "not started" / "not yet earned". The Passport remains an internal
 * learning record (see trustLanguage.ts): nothing here is externally verified.
 */

import type { UserStoreData } from '../store';
import { resolveHomeState } from '../home/homeState';
import { getCanonicalConcept } from '../concepts/conceptRegistry';
import { buildPassportEvidence, type ConceptEvidence, MASTERY_THRESHOLDS } from './evidenceModel';

/** Subjects with a Passport stamp, in the order the Passport shows them. */
export const PASSPORT_SUBJECTS = [
  { subject: 'Mathematics', slug: 'mathematics', color: '#1F7A4A' },
  { subject: 'Physics', slug: 'physics', color: '#1D6FB8' },
  { subject: 'Chemistry', slug: 'chemistry', color: '#D9531E' },
  { subject: 'Biology', slug: 'biology', color: '#3E8E2F' },
  { subject: 'Programming', slug: 'programming', color: '#6D3FC0' },
  { subject: 'Data Science', slug: 'data-science', color: '#16808C' },
  { subject: 'English', slug: 'english', color: '#C0262D' },
  { subject: 'History', slug: 'history', color: '#8A5424' },
] as const;

export type StampState = 'mastered' | 'in_progress' | 'not_started';

export interface SubjectStamp {
  subject: string;
  slug: string;
  color: string;
  stampSrc: string;
  state: StampState;
  concepts: ConceptEvidence[];
  masteredCount: number;
  /** Highest mastery estimate among this subject's concepts with evidence (null if none). */
  bestMastery: number | null;
  lastEvidenceAt: number | null;
}

export interface PassportMilestone {
  id: 'first_expedition' | 'first_mastery' | 'level_up' | 'streak';
  title: string;
  earned: boolean;
  /** Real detail when earned (e.g. "Level 3", "4-day streak"). */
  detail: string | null;
  /** What earns it (shown while locked). */
  requirement: string;
  asset: string;
}

export interface PassportEvidenceTotals {
  /** Concepts with at least one recorded attempt. */
  conceptsLearned: number;
  /** Attempts recorded in hands-on labs / simulations. */
  interactive: number;
  /** All recorded practice attempts. */
  practice: number;
  /** Solo (unassisted) assessment attempts. */
  assessment: number;
  /** Concepts meeting the Passport's mastery threshold. */
  mastered: number;
}

export interface PassportView {
  learnerName: string;
  avatarSrc: string;
  passportNo: string;
  goalText: string | null;
  isNewLearner: boolean;
  xp: number;
  level: number;
  levelProgressPercent: number;
  xpToNextLevel: number;
  streak: number;
  /** Average mastery estimate across tracked concepts; null when nothing is tracked. */
  journeyProgress: number | null;
  totals: PassportEvidenceTotals;
  subjects: SubjectStamp[];
  /** Concepts from the learner's own goal graph that have no canonical subject. */
  otherConcepts: ConceptEvidence[];
  milestones: PassportMilestone[];
  /** Concepts with evidence, most recent first. */
  evidence: ConceptEvidence[];
}

const AVATARS = new Set(['learner', 'builder', 'mentor', 'miner', 'trainer']);

export function buildPassportView(store: UserStoreData, now: number = Date.now()): PassportView {
  const record = buildPassportEvidence(store, now);
  const home = resolveHomeState(store, { currentTime: new Date(now) });
  const stats = home.stats;

  const activeGraph = store.graphs?.find((g) => g.id === store.activeGraphId) ?? store.graphs?.[0];
  const profile = activeGraph?.learnerProfile ?? store.learnerProfile;
  const avatarId = profile?.avatar_id && AVATARS.has(profile.avatar_id) ? profile.avatar_id : 'learner';

  const withEvidence = record.concepts.filter((c) => c.attempts.total > 0);

  // Subject stamps (canonical subjects only; unknown ids are kept apart, never re-labelled).
  const bySubject = new Map<string, ConceptEvidence[]>();
  const otherConcepts: ConceptEvidence[] = [];
  for (const c of record.concepts) {
    const subject = getCanonicalConcept(c.conceptId)?.subject;
    if (subject && PASSPORT_SUBJECTS.some((s) => s.subject === subject)) {
      bySubject.set(subject, [...(bySubject.get(subject) ?? []), c]);
    } else if (c.attempts.total > 0) {
      otherConcepts.push(c);
    }
  }
  const subjects: SubjectStamp[] = PASSPORT_SUBJECTS.map((s) => {
    const concepts = (bySubject.get(s.subject) ?? []).filter((c) => c.attempts.total > 0);
    const masteredCount = concepts.filter((c) => c.mastery.level === 'mastered').length;
    const state: StampState = masteredCount > 0 ? 'mastered' : concepts.length > 0 ? 'in_progress' : 'not_started';
    return {
      subject: s.subject,
      slug: s.slug,
      color: s.color,
      stampSrc: `/images/passport/stamp-${s.slug}.png`,
      state,
      concepts,
      masteredCount,
      bestMastery: concepts.length ? Math.max(...concepts.map((c) => c.mastery.percent)) : null,
      lastEvidenceAt: concepts.length ? Math.max(...concepts.map((c) => c.lastEvidenceAt ?? 0)) : null,
    };
  });

  const totals: PassportEvidenceTotals = {
    conceptsLearned: withEvidence.length,
    interactive: withEvidence.reduce((n, c) => n + c.interactions.handsOnAttempts, 0),
    practice: withEvidence.reduce((n, c) => n + c.attempts.total, 0),
    assessment: withEvidence.reduce((n, c) => n + c.assessment.soloAttempts, 0),
    mastered: record.concepts.filter((c) => c.mastery.level === 'mastered').length,
  };

  const firstMastered = record.concepts.find((c) => c.mastery.level === 'mastered') ?? null;
  const milestones: PassportMilestone[] = [
    {
      id: 'first_expedition',
      title: 'First Expedition',
      earned: totals.practice > 0,
      detail: totals.practice > 0 ? `${totals.practice} answer${totals.practice === 1 ? '' : 's'} recorded` : null,
      requirement: 'Answer your first question in a Class or quest.',
      asset: '/images/passport/milestone-first-expedition.png',
    },
    {
      id: 'first_mastery',
      title: 'Explorer Badge',
      earned: firstMastered !== null,
      detail: firstMastered ? `First mastered: ${firstMastered.title}` : null,
      requirement: `Master your first concept: ${MASTERY_THRESHOLDS.masteredPercent}%+ with ${MASTERY_THRESHOLDS.masteredMinSoloAttempts}+ solo attempts.`,
      asset: '/images/passport/milestone-explorer.png',
    },
    {
      id: 'level_up',
      title: 'Level Up',
      earned: stats.level >= 2,
      detail: stats.level >= 2 ? `Level ${stats.level}` : null,
      requirement: 'Reach level 2 (300 XP).',
      asset: '/images/passport/milestone-level-up.png',
    },
    {
      id: 'streak',
      title: 'Learning Streak',
      earned: stats.streak >= 3,
      detail: stats.streak >= 3 ? `${stats.streak}-day streak` : null,
      requirement: 'Learn on 3 days in a row.',
      asset: '/images/passport/milestone-streak.png',
    },
  ];

  const tracked = store.concepts ?? [];
  return {
    learnerName: profile?.name || store.handle || 'Learner',
    avatarSrc: `/world/characters/${avatarId}.png`,
    passportNo: store.activeGraphId ? `XP-${store.activeGraphId.substring(0, 10).toUpperCase()}` : 'XP-CORE-01',
    goalText: store.goalText && store.goalText !== 'Initial Skill Goal' ? store.goalText : null,
    isNewLearner: totals.practice === 0,
    xp: stats.xp,
    level: stats.level,
    levelProgressPercent: stats.levelProgressPercent,
    xpToNextLevel: stats.progressToNextLevel,
    streak: stats.streak,
    journeyProgress: tracked.length > 0 ? stats.masteryPercentage : null,
    totals,
    subjects,
    otherConcepts,
    milestones,
    evidence: withEvidence,
  };
}
