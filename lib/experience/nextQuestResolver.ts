/**
 * Xpedition Experience Engine v1 — Next Quest Resolver
 *
 * Resolves a deterministic NextBestAction, concept, and resolved experience
 * into a concrete, valid, secure quest target and route.
 *
 * Separation of Concerns:
 * - Decision Engine = WHAT (Action: CORRECT_MISCONCEPTION, HARDER_CHALLENGE, etc.)
 * - Experience Resolver = WHICH (Concrete registered 3D/code experience definition)
 * - Quest Resolver = WHERE / ROUTE (Canonical quest target, title, button, and navigation URL)
 * - Xira = SUPPORT (Contextual guidance and explanation)
 *
 * Invariants:
 * 1. NEVER invents broken routes, fake IDs, or arbitrary unverified destinations.
 * 2. If an interactive experience is available, routes to the verified canonical quest or experience URL.
 * 3. If no interactive experience exists, gracefully falls back to standard curriculum quest or tutor.
 * 4. Resolves deterministically based on learner evidence and decision state.
 */

import { NextBestAction, ResolvedExperience, LearnerState, NextQuestTarget } from '../intelligence/types';
import { experienceRegistry } from './experienceRegistry';
import { ExperienceType } from './types';
import { getActionRoute, formatActionTitle, getActionCtaLabel } from '../intelligence/actions';

export type { NextQuestTarget };

export interface ResolveNextQuestParams {
  action: NextBestAction['action'];
  conceptId?: string;
  learnerState?: Partial<LearnerState>;
  resolvedExperience?: ResolvedExperience;
}

interface CanonicalQuestEntry {
  conceptId: string;
  conceptName: string;
  questId: string;
  experienceType: ExperienceType;
  experienceId: string;
  defaultTitle: string;
  remediationTitle: string;
  challengeTitle: string;
  reviewTitle: string;
}

const CANONICAL_QUEST_REGISTRY: Record<string, CanonicalQuestEntry> = {
  python_debugging_basics: {
    conceptId: 'python_debugging_basics',
    conceptName: 'Python Debugging Basics',
    questId: 'quest_python_debugging_01',
    experienceType: 'CODE_DEBUGGING',
    experienceId: 'programming_code_lab',
    defaultTitle: 'Programming Code Lab: Debug by Doing',
    remediationTitle: 'Code Lab: Variable Accumulation Remediation',
    challengeTitle: 'Advanced Python Debugging Challenge',
    reviewTitle: 'Code Lab: Spaced Retention Review',
  },
  human_heart_anatomy: {
    conceptId: 'human_heart_anatomy',
    conceptName: 'Human Heart Anatomy',
    questId: 'quest_heart_anatomy_01',
    experienceType: 'HEART_ANATOMY_EXPLORER',
    experienceId: 'exp_heart_anatomy_01',
    defaultTitle: '3D Human Heart Anatomy Explorer',
    remediationTitle: '3D Heart Anatomy: Valve & Chamber Guided Review',
    challengeTitle: '3D Heart Anatomy: Dynamic Hemodynamic Challenge',
    reviewTitle: '3D Heart Anatomy: Spaced Retention Circuit',
  },
  spatial_reasoning: {
    conceptId: 'spatial_reasoning',
    conceptName: 'Spatial Reasoning',
    questId: 'quest_spatial_orientation_01',
    experienceType: 'OBJECT_MANIPULATION',
    experienceId: 'exp_scholar_prism_01',
    defaultTitle: "3D Object Manipulation: Scholar's Prism",
    remediationTitle: 'Spatial Alignment: Multi-Axis Guidance',
    challengeTitle: "Scholar's Prism: Rotational Convergence Challenge",
    reviewTitle: "Scholar's Prism: Spaced Alignment Drill",
  },
  projectile_motion: {
    conceptId: 'projectile_motion',
    conceptName: 'Projectile Motion',
    questId: 'quest_projectile_motion_01',
    experienceType: 'PROJECTILE_SIMULATION',
    experienceId: 'exp_projectile_motion_01',
    defaultTitle: 'Projectile Motion Physics Lab',
    remediationTitle: 'Kinematics: Launch Angle Scaffolding',
    challengeTitle: 'Kinematics: Variable Gravity & Drag Challenge',
    reviewTitle: 'Projectile Motion: Trajectory Review Drill',
  },
  molecular_bonding: {
    conceptId: 'molecular_bonding',
    conceptName: 'Molecular Bonding',
    questId: 'quest_molecule_builder_01',
    experienceType: 'MOLECULE_BUILDER',
    experienceId: 'exp_molecule_builder_01',
    defaultTitle: '3D Molecule Builder: H₂O Covalent Bonding',
    remediationTitle: 'Valence Rule Scaffold: Hydrogen & Oxygen Bonds',
    challengeTitle: 'Molecule Builder: Polyatomic Covalent Synthesis',
    reviewTitle: 'Molecule Builder: Octet Rule Spaced Review',
  },
};

/**
 * Resolves the next learning quest and route based on the deterministic decision.
 */
export function resolveNextQuest(params: ResolveNextQuestParams): NextQuestTarget {
  const { action, conceptId, learnerState, resolvedExperience } = params;
  const targetConcept = conceptId || learnerState?.currentConceptId || 'python_debugging_basics';
  const canonicalEntry = CANONICAL_QUEST_REGISTRY[targetConcept];

  // 1. If an interactive experience was successfully resolved by nextExperienceResolver
  if (resolvedExperience?.available && canonicalEntry) {
    // Verify experience registration in ExperienceRegistry
    const isRegistered = experienceRegistry.hasExperience(canonicalEntry.conceptId);
    if (isRegistered) {
      switch (action) {
        case 'CORRECT_MISCONCEPTION':
          return {
            available: true,
            isExperiential: true,
            questId: canonicalEntry.questId,
            conceptId: canonicalEntry.conceptId,
            conceptName: canonicalEntry.conceptName,
            action,
            experienceId: canonicalEntry.experienceId,
            experienceType: canonicalEntry.experienceType,
            title: canonicalEntry.remediationTitle,
            description: 'Hands-on targeted remediation session to eliminate the identified misconception.',
            buttonLabel: 'Correct Misconception',
            route: `/quest?concept=${encodeURIComponent(canonicalEntry.conceptId)}&mode=assisted`,
            reason: resolvedExperience.reason || `Targeted remediation for ${canonicalEntry.conceptName}.`,
          };

        case 'PRACTICE_CONCEPT':
        case 'LEARN_CONCEPT':
          return {
            available: true,
            isExperiential: true,
            questId: canonicalEntry.questId,
            conceptId: canonicalEntry.conceptId,
            conceptName: canonicalEntry.conceptName,
            action,
            experienceId: canonicalEntry.experienceId,
            experienceType: canonicalEntry.experienceType,
            title: canonicalEntry.defaultTitle,
            description: 'Active interactive experience to strengthen mental models.',
            buttonLabel: 'Continue Practice',
            route: `/quest?concept=${encodeURIComponent(canonicalEntry.conceptId)}`,
            reason: resolvedExperience.reason || `Active practice session for ${canonicalEntry.conceptName}.`,
          };

        case 'SPACED_REVIEW':
        case 'REVIEW_CONCEPT':
          return {
            available: true,
            isExperiential: true,
            questId: canonicalEntry.questId,
            conceptId: canonicalEntry.conceptId,
            conceptName: canonicalEntry.conceptName,
            action,
            experienceId: canonicalEntry.experienceId,
            experienceType: canonicalEntry.experienceType,
            title: canonicalEntry.reviewTitle,
            description: 'High-yield interactive refresher to protect retention.',
            buttonLabel: 'Review This Concept',
            route: `/quest?concept=${encodeURIComponent(canonicalEntry.conceptId)}&mode=review`,
            reason: resolvedExperience.reason || `Spaced retention review for ${canonicalEntry.conceptName}.`,
          };

        case 'HARDER_CHALLENGE':
          return {
            available: true,
            isExperiential: true,
            questId: canonicalEntry.questId,
            conceptId: canonicalEntry.conceptId,
            conceptName: canonicalEntry.conceptName,
            action,
            experienceId: canonicalEntry.experienceId,
            experienceType: canonicalEntry.experienceType,
            title: canonicalEntry.challengeTitle,
            description: 'Advanced experiential challenge testing edge cases and complex scenarios.',
            buttonLabel: 'Try a Harder Challenge',
            route: `/quest?concept=${encodeURIComponent(canonicalEntry.conceptId)}&mode=challenge`,
            reason: resolvedExperience.reason || `Advanced challenge for ${canonicalEntry.conceptName}.`,
          };
      }
    }
  }

  // 2. Safe deterministic fallback when no interactive 3D/code experience is available
  // (e.g. HARDER_CHALLENGE without an authored 2nd tier, EXAM_MOCK, TUTOR_EXPLANATION, or uncataloged concepts)
  const conceptName = canonicalEntry?.conceptName || learnerState?.currentConceptName || targetConcept;
  const fallbackRoute = getActionRoute({
    action,
    targetConceptId: targetConcept,
    targetConceptName: conceptName,
  });

  const isTutorFallback = action === 'TUTOR_EXPLANATION' || action === 'WRITING_EXERCISE' || action === 'RESEARCH_TOPIC';
  const fallbackType: NextQuestTarget['fallback'] =
    action === 'SPACED_REVIEW' || action === 'REVIEW_CONCEPT'
      ? 'REVIEW'
      : isTutorFallback
      ? 'TUTOR'
      : 'STANDARD_QUEST';

  const defaultButton = getActionCtaLabel({ action });
  const defaultTitle = formatActionTitle({ action, targetConceptId: targetConcept, targetConceptName: conceptName }, conceptName);

  return {
    available: false,
    isExperiential: false,
    conceptId: targetConcept,
    conceptName,
    action,
    title: defaultTitle,
    description: `Action "${action}" is delivered through the curriculum learning pathway.`,
    buttonLabel: defaultButton,
    route: fallbackRoute,
    fallback: fallbackType,
    reason: resolvedExperience?.reason || `Advancing to curriculum action "${action}" for ${conceptName}.`,
  };
}
