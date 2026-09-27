/**
 * Canonical Concept Registry — the ONE authoritative list of learnable concepts.
 *
 * Sources, joined by EXACT concept id:
 *   1. Authored classroom lessons (lib/classroom/classroomCatalog.ts)
 *   2. Curriculum topics (lib/curriculum/curriculumCatalog.ts)
 *
 * Lookup rules (deliberately strict):
 *   - Ids are normalised (trim, lower-case, spaces/hyphens → "_") and then
 *     matched EXACTLY against a canonical id or an explicit alias.
 *   - There is NO substring / keyword / fuzzy matching. "industrial_revolution"
 *     can never match "evolution"; "research_methods" can never match
 *     "binary_search"; "brain_anatomy" can never match the heart lesson.
 *   - Unknown ids return null. Callers must show an explicit "unavailable"
 *     state — never another concept.
 *
 * The registry is built lazily on first use so that modules which import each
 * other (catalog ↔ resolver) never read a half-initialised binding.
 */

import type { ClassroomLesson, ClassStepStage } from '@/components/classroom/types';
import { CANONICAL_CLASSROOM_LESSONS } from '../classroom/classroomCatalog';
import { CURRICULUM_SUBJECTS, type CurriculumTopic } from '../curriculum/curriculumCatalog';
import { resolveStepStage } from '../classroom/classStage';
import type { CanonicalConcept, ConceptVisualKind } from './types';

/** Maximum accepted raw id length (matches the session API limit). */
export const MAX_CONCEPT_ID_LENGTH = 100;

/** Exact renderer family per authored concept. Anything else is semantic. */
const AUTHORED_VISUAL_KIND: Record<string, ConceptVisualKind> = {
  dc_motor: 'dc_motor_diagram',
  projectile_motion: 'projectile_simulation',
  quadratic_equation: 'parabola_graph',
  linear_regression: 'regression_graph',
  calculus_derivatives: 'derivative_graph',
  molecular_bonding: 'molecular_geometry',
  human_heart_anatomy: 'heart_anatomy',
  french_revolution: 'history_timeline',
  industrial_revolution: 'history_timeline',
  binary_search: 'binary_search_trace',
  polymorphism: 'polymorphism_dispatch',
  periodic_table: 'periodic_table_interactive',
};

/** Explicit alternative ids. Exact-match only; never substrings. */
const EXPLICIT_ALIASES: Record<string, string[]> = {
  dc_motor: ['dc_electric_motor'],
  human_heart_anatomy: ['human_heart', 'heart_anatomy'],
  quadratic_equation: ['quadratic_equations'],
  calculus_derivatives: ['derivatives'],
  periodic_table: ['periodic_table_of_elements'],
  molecular_bonding: ['covalent_bonding'],
};

/**
 * Concepts that exist only as hands-on Experience-engine labs (no Class lesson).
 * Kept here so the registry is the single source of truth for EVERY concept id
 * used by /learn, /tutor, /quest and the Experience engine. A consistency test
 * asserts every Experience definition's conceptId is registered.
 */
const EXPERIENCE_ONLY_CONCEPTS: Array<{ id: string; subject: string; title: string; description: string }> = [
  {
    id: 'spatial_reasoning',
    subject: 'Mathematics',
    title: '3D Spatial Reasoning',
    description: 'Rotate and align 3D polyhedral models to match target orientations.',
  },
  {
    id: 'python_debugging_basics',
    subject: 'Programming',
    title: 'Python Debugging Basics',
    description: 'Diagnose variable accumulation and loop bugs in a live code lab.',
  },
];

/** Recommended prior concepts (must reference registry ids). */
const PREREQUISITES: Record<string, string[]> = {
  calculus_derivatives: ['quadratic_equation'],
  linear_regression: ['quadratic_equation'],
  molecular_bonding: ['periodic_table'],
  projectile_motion: ['quadratic_equation'],
  dc_motor: ['electromagnetic_force'],
};

/**
 * Normalises a raw id to canonical form. Returns '' for values that cannot be
 * a concept id. This is formatting only — it never changes which concept an
 * id refers to.
 */
export function normalizeConceptId(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > MAX_CONCEPT_ID_LENGTH) return '';
  const normalized = trimmed
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/_+/g, '_');
  return /^[a-z0-9_]+$/.test(normalized) ? normalized : '';
}

function stagesOf(lesson: ClassroomLesson): ClassStepStage[] {
  const stages: ClassStepStage[] = [];
  lesson.steps.forEach((step, idx) => {
    const stage = resolveStepStage(step, idx, lesson.steps.length);
    if (!stages.includes(stage)) stages.push(stage);
  });
  return stages;
}

interface CurriculumEntry {
  topic: CurriculumTopic;
  subjectId: string;
}

function curriculumIndex(): Map<string, CurriculumEntry> {
  const index = new Map<string, CurriculumEntry>();
  for (const subject of CURRICULUM_SUBJECTS) {
    for (const topic of subject.topics) {
      index.set(topic.conceptId, { topic, subjectId: subject.id });
    }
  }
  return index;
}

interface RegistryState {
  concepts: Map<string, CanonicalConcept>;
  aliasToId: Map<string, string>;
  /** Outline lessons for curriculum topics without an authored lesson. */
  outlineLessons: Map<string, ClassroomLesson>;
}

let registryState: RegistryState | null = null;

function buildRegistry(): RegistryState {
  const concepts = new Map<string, CanonicalConcept>();
  const aliasToId = new Map<string, string>();
  const outlineLessons = new Map<string, ClassroomLesson>();
  const curriculum = curriculumIndex();

  // 1. Authored lessons
  for (const [key, lesson] of Object.entries(CANONICAL_CLASSROOM_LESSONS)) {
    if (key !== lesson.conceptId) {
      throw new Error(`[ConceptRegistry] Lesson key "${key}" does not match lesson.conceptId "${lesson.conceptId}"`);
    }
    const entry = curriculum.get(lesson.conceptId);
    concepts.set(lesson.conceptId, {
      id: lesson.conceptId,
      subject: lesson.subject,
      title: lesson.topicTitle,
      description: entry?.topic.description ?? lesson.learningObjective,
      learningObjective: lesson.learningObjective,
      prerequisites: PREREQUISITES[lesson.conceptId] ?? [],
      lessonId: lesson.id,
      lessonSource: 'authored',
      hasClassLesson: true,
      visualKind: AUTHORED_VISUAL_KIND[lesson.conceptId] ?? 'semantic_lesson',
      availableStages: stagesOf(lesson),
      supportsRevision: true,
      aliases: EXPLICIT_ALIASES[lesson.conceptId] ?? [],
      metadata: {
        category: lesson.category ?? entry?.topic.category,
        curriculumSubjectId: entry?.subjectId,
        level: entry?.topic.level,
        estimatedMinutes: lesson.estimatedMinutes,
      },
    });
  }

  // 2. Curriculum topics without an authored lesson → honest outline lessons
  for (const [id, entry] of curriculum) {
    if (concepts.has(id)) continue;
    const lesson = buildCurriculumOutlineLesson(entry.topic);
    outlineLessons.set(id, lesson);
    concepts.set(id, {
      id,
      subject: entry.topic.subject,
      title: entry.topic.title,
      description: entry.topic.description,
      learningObjective: lesson.learningObjective,
      prerequisites: PREREQUISITES[id] ?? [],
      lessonId: lesson.id,
      lessonSource: 'curriculum_outline',
      hasClassLesson: true,
      visualKind: 'semantic_lesson',
      availableStages: stagesOf(lesson),
      supportsRevision: false,
      aliases: EXPLICIT_ALIASES[id] ?? [],
      metadata: {
        category: entry.topic.category,
        curriculumSubjectId: entry.subjectId,
        level: entry.topic.level,
        estimatedMinutes: entry.topic.estimatedMinutes,
      },
    });
  }

  // 3. Experience-only concepts (hands-on labs without a Class lesson)
  for (const exp of EXPERIENCE_ONLY_CONCEPTS) {
    if (concepts.has(exp.id)) continue;
    concepts.set(exp.id, {
      id: exp.id,
      subject: exp.subject,
      title: exp.title,
      description: exp.description,
      learningObjective: exp.description,
      prerequisites: [],
      lessonId: '',
      lessonSource: 'experience_only',
      hasClassLesson: false,
      visualKind: 'semantic_lesson',
      availableStages: [],
      supportsRevision: false,
      aliases: [],
      metadata: {},
    });
  }

  // 4. Aliases (exact) — conflicts are programming errors.
  for (const concept of concepts.values()) {
    for (const alias of concept.aliases) {
      const normalized = normalizeConceptId(alias);
      if (!normalized || concepts.has(normalized) || aliasToId.has(normalized)) {
        throw new Error(`[ConceptRegistry] Alias "${alias}" for "${concept.id}" collides or is invalid`);
      }
      aliasToId.set(normalized, concept.id);
    }
  }

  return { concepts, aliasToId, outlineLessons };
}

function registry(): RegistryState {
  if (!registryState) registryState = buildRegistry();
  return registryState;
}

/**
 * Builds a deterministic outline lesson from a curriculum topic's OWN metadata.
 * It is explicitly marked as an outline; it contains no quiz (we do not invent
 * assessment content), and no content from any other concept.
 */
export function buildCurriculumOutlineLesson(topic: CurriculumTopic): ClassroomLesson {
  const id = topic.conceptId;
  return {
    id: `lesson_outline_${id}`,
    conceptId: id,
    topicTitle: topic.title,
    subject: topic.subject,
    category: topic.category,
    gradeLevel: topic.level,
    estimatedMinutes: topic.estimatedMinutes,
    hasFormulas: false,
    isOutline: true,
    learningObjective: topic.description,
    steps: [
      {
        id: `step_1_${id}_overview`,
        stepNumber: 1,
        stage: 'introduce',
        title: 'Overview',
        subtitle: topic.category,
        buddyDialogue: `Let us start ${topic.title}. ${topic.description}`,
        buddyState: 'INTRODUCING',
        boardTitle: topic.title,
        boardSummary: topic.description,
        keyPrinciple: topic.keyTakeaway,
        visualType: 'scientific_diagram',
        tryThis: `Before continuing, write one sentence about what you already know about ${topic.title}.`,
      },
      {
        id: `step_2_${id}_key_idea`,
        stepNumber: 2,
        stage: 'explain',
        title: 'Key Idea',
        subtitle: 'The Core Takeaway',
        buddyDialogue: `Here is the key idea: ${topic.keyTakeaway}`,
        buddyState: 'EXPLAINING',
        boardTitle: 'Key Idea',
        boardSummary: topic.keyTakeaway,
        keyPrinciple: topic.keyTakeaway,
        visualType: 'scientific_diagram',
        tryThis: 'Restate the key idea in your own words, then compare it with the board.',
      },
      {
        id: `step_3_${id}_reflect`,
        stepNumber: 3,
        stage: 'reward',
        title: 'Reflect',
        subtitle: 'Connect and Ask',
        buddyDialogue: `Nice work. Ask Xira for a worked example of ${topic.title} to go deeper.`,
        buddyState: 'ENCOURAGING',
        boardTitle: `Connect: ${topic.category}`,
        boardSummary: `${topic.title} is part of ${topic.category} in ${topic.subject}.`,
        keyPrinciple: topic.keyTakeaway,
        visualType: 'scientific_diagram',
        tryThis: `Ask Xira for a worked example of ${topic.title}.`,
      },
    ],
    buddyScript: {
      introduction: `Let us start ${topic.title}.`,
      correct: 'Correct!',
      incorrect: 'Not quite. Check the key idea on the board.',
      hint: `Re-read the key idea: ${topic.keyTakeaway}`,
      transition: 'Good. On to the next idea.',
      completion: `You have covered the outline of ${topic.title}.`,
    },
    xiraPrompts: {
      why: `Why is this true for ${topic.title}?`,
      simpler: `Explain ${topic.title} in the simplest possible terms.`,
      example: `Give me a worked example of ${topic.title}.`,
      hint: `Give me a hint about ${topic.title}.`,
      deeper: `What is the deeper idea behind ${topic.title}?`,
    },
  };
}

/** Exact lookup by canonical id or explicit alias. Returns null if unknown. */
export function lookupConcept(rawId: unknown): { concept: CanonicalConcept; matchedBy: 'exact' | 'alias' } | null {
  const normalized = normalizeConceptId(rawId);
  if (!normalized) return null;
  const state = registry();
  const direct = state.concepts.get(normalized);
  if (direct) return { concept: direct, matchedBy: 'exact' };
  const aliasTarget = state.aliasToId.get(normalized);
  if (aliasTarget) {
    const concept = state.concepts.get(aliasTarget);
    if (concept) return { concept, matchedBy: 'alias' };
  }
  return null;
}

export function getCanonicalConcept(rawId: unknown): CanonicalConcept | null {
  return lookupConcept(rawId)?.concept ?? null;
}

export function listCanonicalConcepts(): CanonicalConcept[] {
  return Array.from(registry().concepts.values());
}

/** Returns the lesson for a canonical id (authored or outline), or null. */
/**
 * Finds a canonical concept by its exact canonical TITLE (case/space-insensitive).
 * Used by free-text entry points (e.g. /teach) so "Periodic Table" or
 * "The Periodic Table: Organisation & Trends" map to periodic_table. Still exact
 * — never a substring.
 */
export function lookupConceptByExactTitle(rawTitle: unknown): CanonicalConcept | null {
  if (typeof rawTitle !== 'string') return null;
  const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const target = norm(rawTitle);
  if (!target) return null;
  for (const concept of registry().concepts.values()) {
    if (norm(concept.title) === target) return concept;
  }
  return null;
}

export function getLessonForCanonicalId(conceptId: string): ClassroomLesson | null {
  const authored = CANONICAL_CLASSROOM_LESSONS[conceptId];
  if (authored) return authored;
  return registry().outlineLessons.get(conceptId) ?? null;
}

/**
 * Next concept in the same curriculum subject, or null. Never a fixed default.
 */
export function getNextConceptId(conceptId: string): string | null {
  for (const subject of CURRICULUM_SUBJECTS) {
    const idx = subject.topics.findIndex((t) => t.conceptId === conceptId);
    if (idx >= 0) {
      return subject.topics[idx + 1]?.conceptId ?? null;
    }
  }
  return null;
}

/** Test hook: rebuild after catalogs change (not used at runtime). */
export function __resetConceptRegistryForTests(): void {
  registryState = null;
}
