/**
 * Xpedition Experience Engine v1 — Next Experience Resolver
 *
 * Resolves a deterministic NextBestAction and concept into a concrete, registered
 * ExperienceDefinition or Quest.
 *
 * Invariants:
 * 1. NEVER recommends an experience that is not actively registered in ExperienceRegistry.
 * 2. Clean separation:
 *    - Decision Engine = WHAT (Action)
 *    - Resolver = WHICH (Concrete registered experience)
 *    - Template = HOW (Simulation, Manipulation, Builder, Code)
 *    - Xira = SUPPORT (Guidance & explanation)
 * 3. Returns safe fallback (available: false) when no suitable 3D/code lab exists.
 */

import { NextBestAction, ResolvedExperience, LearnerState } from '../intelligence/types';
import { experienceRegistry } from './experienceRegistry';
import { ExperienceType } from './types';

// Map of canonical concepts to their registered experience metadata and quests
interface ExperienceCatalogItem {
  conceptId: string;
  conceptName: string;
  experienceType: ExperienceType;
  experienceId: string;
  questId: string;
  defaultTitle: string;
  remediationTitle?: string;
  harderChallengeAvailable: boolean;
  harderChallengeId?: string;
}

const REGISTERED_EXPERIENCE_CATALOG: Record<string, ExperienceCatalogItem> = {
  python_debugging_basics: {
    conceptId: 'python_debugging_basics',
    conceptName: 'Python Debugging Basics',
    experienceType: 'CODE_DEBUGGING',
    experienceId: 'programming_code_lab',
    questId: 'quest_py_debug_01',
    defaultTitle: 'Programming Code Lab: Debug by Doing',
    remediationTitle: 'Code Lab: Variable Accumulation Remediation',
    harderChallengeAvailable: false, // Initial proof catalog has single tier
  },
  human_heart_anatomy: {
    conceptId: 'human_heart_anatomy',
    conceptName: 'Human Heart Anatomy',
    experienceType: 'HEART_ANATOMY_EXPLORER',
    experienceId: 'exp_heart_anatomy_01',
    questId: 'quest_heart_01',
    defaultTitle: '3D Human Heart Anatomy Explorer',
    remediationTitle: '3D Heart Anatomy: Valve & Chamber Guided Review',
    harderChallengeAvailable: false,
  },
  spatial_reasoning: {
    conceptId: 'spatial_reasoning',
    conceptName: 'Spatial Reasoning',
    experienceType: 'OBJECT_MANIPULATION',
    experienceId: 'exp_scholar_prism_01',
    questId: 'quest_spatial_01',
    defaultTitle: "3D Object Manipulation: Scholar's Prism",
    remediationTitle: 'Spatial Alignment: Multi-Axis Guidance',
    harderChallengeAvailable: false,
  },
  projectile_motion: {
    conceptId: 'projectile_motion',
    conceptName: 'Projectile Motion',
    experienceType: 'PROJECTILE_SIMULATION',
    experienceId: 'exp_projectile_motion_01',
    questId: 'quest_projectile_01',
    defaultTitle: 'Projectile Motion Physics Lab',
    remediationTitle: 'Kinematics: Launch Angle Scaffolding',
    harderChallengeAvailable: false,
  },
  molecular_bonding: {
    conceptId: 'molecular_bonding',
    conceptName: 'Molecular Bonding',
    experienceType: 'MOLECULE_BUILDER',
    experienceId: 'exp_molecule_builder_01',
    questId: 'quest_molecule_01',
    defaultTitle: '3D Molecule Builder: H₂O Covalent Bonding',
    remediationTitle: 'Valence Rule Scaffold: Hydrogen & Oxygen Bonds',
    harderChallengeAvailable: false,
  },
};

export function resolveNextExperience(
  action: NextBestAction['action'],
  conceptId: string | undefined,
  learnerState?: Partial<LearnerState>
): ResolvedExperience {
  const targetConcept = conceptId || learnerState?.currentConceptId || 'python_debugging_basics';
  const catalogItem = REGISTERED_EXPERIENCE_CATALOG[targetConcept];

  // 1. Concept has no registered interactive experience
  if (!catalogItem) {
    return {
      available: false,
      conceptId: targetConcept,
      action,
      reason: `No interactive experience currently registered for concept "${targetConcept}". Recommended action will proceed via standard assessment/tutor interface.`,
    };
  }

  // 2. Verify registration in ExperienceRegistry
  const isRegistered = experienceRegistry.hasExperience(catalogItem.conceptId);
  if (!isRegistered) {
    return {
      available: false,
      conceptId: targetConcept,
      action,
      reason: `Experience for "${targetConcept}" is not actively loaded in ExperienceRegistry.`,
    };
  }

  // 3. Resolve by Action Type
  switch (action) {
    case 'CORRECT_MISCONCEPTION':
      return {
        available: true,
        conceptId: targetConcept,
        action,
        experienceType: catalogItem.experienceType,
        experienceId: catalogItem.experienceId,
        questId: catalogItem.questId,
        title: catalogItem.remediationTitle || `${catalogItem.defaultTitle} (Remediation)`,
        description: 'Interactive targeted remediation to eliminate confusion and correct the underlying error.',
        reason: `Remediation session targeting identified misconception for ${catalogItem.conceptName}.`,
      };

    case 'PRACTICE_CONCEPT':
    case 'LEARN_CONCEPT':
      return {
        available: true,
        conceptId: targetConcept,
        action,
        experienceType: catalogItem.experienceType,
        experienceId: catalogItem.experienceId,
        questId: catalogItem.questId,
        title: catalogItem.defaultTitle,
        description: 'Hands-on experiential practice to reinforce core mental models.',
        reason: `Active practice session for ${catalogItem.conceptName}.`,
      };

    case 'SPACED_REVIEW':
    case 'REVIEW_CONCEPT':
      return {
        available: true,
        conceptId: targetConcept,
        action,
        experienceType: catalogItem.experienceType,
        experienceId: catalogItem.experienceId,
        questId: catalogItem.questId,
        title: `${catalogItem.defaultTitle} (Spaced Review)`,
        description: 'High-yield interactive refresher to protect against retention decay.',
        reason: `Spaced retention review for ${catalogItem.conceptName}.`,
      };

    case 'HARDER_CHALLENGE':
      if (catalogItem.harderChallengeAvailable && catalogItem.harderChallengeId) {
        return {
          available: true,
          conceptId: targetConcept,
          action,
          experienceType: catalogItem.experienceType,
          experienceId: catalogItem.harderChallengeId,
          questId: catalogItem.questId,
          title: `${catalogItem.defaultTitle} (Advanced Challenge)`,
          description: 'High-difficulty challenge testing edge cases and advanced applications.',
          reason: `Advanced mastery challenge for ${catalogItem.conceptName}.`,
        };
      }
      return {
        available: false,
        conceptId: targetConcept,
        action,
        reason: `Advanced tier challenge for ${catalogItem.conceptName} is queued for next curriculum update. Foundational experience remains mastered.`,
      };

    // Non-interactive action modalities (handled outside experience engine)
    case 'EXAM_MOCK':
    case 'WRITING_EXERCISE':
    case 'MATH_VERIFICATION':
    case 'DOCUMENT_GROUNDED_QA':
    case 'RESEARCH_TOPIC':
    case 'TUTOR_EXPLANATION':
    case 'FLASHCARD_REVIEW':
    case 'CONFIDENCE_REINFORCEMENT':
    default:
      return {
        available: false,
        conceptId: targetConcept,
        action,
        reason: `Action "${action}" is delivered via dedicated textual, tutor, or assessment modality rather than a 3D/code simulation experience.`,
      };
  }
}
