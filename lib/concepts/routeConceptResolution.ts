/**
 * Registry-backed concept resolution adapters for the Experience-engine routes
 * (/learn/[conceptId], /tutor/[conceptId], /quest).
 *
 * Those pages keep their own UI and behaviour; they now resolve identity HERE.
 *
 * Resolution order (all EXACT, no substring / keyword matching):
 *   1. Canonical concept registry (id or explicit alias)  → authoritative identity
 *   2. The learner's own goal graph node with that exact id (user-generated ids)
 *   3. /tutor "quick learn" free-text topic (explicitly flagged, never a registry id)
 *   4. otherwise → 'unavailable'  (never the goal text, never another concept)
 *
 * Previously these routes fell back to the learner's goal text or a default
 * concept ('c_1', 'Photosynthesis') when an id was unknown, and /quest served
 * the ENTIRE goal-graph quest pool for an unknown concept.
 */

import type { UserStoreData } from '../store';
import { lookupConcept } from './conceptRegistry';
import type { CanonicalConcept } from './types';

export type RouteConceptResolution =
  | {
      status: 'canonical';
      requestedConceptId: string;
      conceptId: string;
      title: string;
      summary: string;
      subject: string;
      concept: CanonicalConcept;
    }
  | {
      status: 'learner_graph';
      requestedConceptId: string;
      conceptId: string;
      title: string;
      summary: string;
    }
  | {
      status: 'quick_topic';
      requestedConceptId: string;
      conceptId: 'quick';
      title: string;
      summary: string;
    }
  | {
      status: 'unavailable';
      requestedConceptId: string;
      reason: 'missing_id' | 'unknown_concept' | 'missing_quick_topic';
    };

type GraphLike = Pick<UserStoreData, 'graphs' | 'activeGraphId' | 'concepts'>;

function activeGraphConcepts(store: GraphLike | null | undefined) {
  if (!store) return [] as Array<{ id: string; name: string; summary?: string }>;
  const graph = store.graphs?.find((g) => g.id === store.activeGraphId) || store.graphs?.[0];
  const list = (graph?.concepts as Array<{ id: string; name: string; summary?: string }> | undefined) ?? [];
  return list.length > 0 ? list : ((store.concepts as Array<{ id: string; name: string; summary?: string }>) ?? []);
}

export function resolveLearnerRouteConcept(
  rawConceptId: unknown,
  store: GraphLike | null | undefined,
  options: { quickTopic?: string | null } = {}
): RouteConceptResolution {
  const requestedConceptId = typeof rawConceptId === 'string' ? rawConceptId : '';
  const trimmed = requestedConceptId.trim();
  if (!trimmed) return { status: 'unavailable', requestedConceptId, reason: 'missing_id' };

  // 3. Explicit quick-learn mode (free-text topic typed by the learner).
  if (trimmed === 'quick') {
    const topic = (options.quickTopic ?? '').trim().slice(0, 200);
    if (!topic) return { status: 'unavailable', requestedConceptId, reason: 'missing_quick_topic' };
    return { status: 'quick_topic', requestedConceptId, conceptId: 'quick', title: topic, summary: '' };
  }

  // 1. Canonical registry (authoritative).
  const match = lookupConcept(trimmed);
  if (match) {
    return {
      status: 'canonical',
      requestedConceptId,
      conceptId: match.concept.id,
      title: match.concept.title,
      summary: match.concept.description,
      subject: match.concept.subject,
      concept: match.concept,
    };
  }

  // 2. Learner's own goal-graph node (exact id).
  const node = activeGraphConcepts(store).find((c) => c.id === trimmed);
  if (node) {
    return {
      status: 'learner_graph',
      requestedConceptId,
      conceptId: node.id,
      title: node.name || node.id,
      summary: node.summary || '',
    };
  }

  return { status: 'unavailable', requestedConceptId, reason: 'unknown_concept' };
}

export interface QuestLike {
  id: string;
  conceptId: string;
  [key: string]: unknown;
}

export type QuestPoolResolution<Q extends QuestLike> =
  | { status: 'ok'; conceptId: string | null; pool: Q[] }
  | { status: 'no_items'; conceptId: string; pool: [] }
  | { status: 'unavailable'; requestedConceptId: string; pool: [] };

/**
 * Chooses the quest pool for /quest.
 *  - No target → the learner's adaptive graph pool (unchanged behaviour).
 *  - Target → must resolve exactly; a registered hands-on quest wins; otherwise
 *    only graph quests whose conceptId is EXACTLY the target. If none exist the
 *    result is 'no_items' — never the rest of the pool.
 */
export function resolveQuestPool<Q extends QuestLike>(args: {
  targetConceptId: string | null | undefined;
  store: GraphLike | null | undefined;
  graphPool: Q[];
  specialQuests: Record<string, Q>;
}): QuestPoolResolution<Q> {
  const { targetConceptId, store, graphPool, specialQuests } = args;
  if (!targetConceptId) return { status: 'ok', conceptId: null, pool: graphPool };

  const resolution = resolveLearnerRouteConcept(targetConceptId, store);
  if (resolution.status === 'unavailable' || resolution.status === 'quick_topic') {
    return { status: 'unavailable', requestedConceptId: targetConceptId, pool: [] };
  }
  const id = resolution.conceptId;
  const special = specialQuests[id];
  if (special) return { status: 'ok', conceptId: id, pool: [special] };

  const exact = graphPool.filter((q) => q.conceptId === id);
  if (exact.length === 0) return { status: 'no_items', conceptId: id, pool: [] };
  return { status: 'ok', conceptId: id, pool: exact };
}

export type LessonRequestIdentity =
  | { ok: true; conceptId: string; conceptName: string; conceptSummary: string; source: 'canonical' | 'client_topic' }
  | { ok: false; error: string };

/**
 * Server-side identity for /api/lesson. A canonical id ALWAYS uses the
 * registry's title/description (client-supplied names cannot re-label it).
 * Non-canonical ids (learner goal-graph nodes, quick-learn topics) must carry an
 * explicit name. There is no default concept (the route used to default to
 * 'Photosynthesis').
 */
export function resolveLessonRequestIdentity(body: {
  conceptId?: unknown;
  conceptName?: unknown;
  conceptSummary?: unknown;
}): LessonRequestIdentity {
  const rawId = typeof body.conceptId === 'string' ? body.conceptId.trim() : '';
  if (!rawId || rawId.length > 100) return { ok: false, error: 'conceptId is required' };
  const match = lookupConcept(rawId);
  if (match) {
    return {
      ok: true,
      conceptId: match.concept.id,
      conceptName: match.concept.title,
      conceptSummary: match.concept.description,
      source: 'canonical',
    };
  }
  const name = typeof body.conceptName === 'string' ? body.conceptName.trim().slice(0, 200) : '';
  if (!name) return { ok: false, error: 'conceptName is required for non-curriculum concepts' };
  const summary = typeof body.conceptSummary === 'string' ? body.conceptSummary.trim().slice(0, 1000) : '';
  return { ok: true, conceptId: rawId.slice(0, 100), conceptName: name, conceptSummary: summary, source: 'client_topic' };
}
