/**
 * Xpedition Intelligence Layer v2 — AI Output & Schema Validators
 *
 * Enforces:
 * 1. AI is never the unvalidated authority for application state, geometry, or learner models.
 * 2. All AI responses undergo strict structural and semantic schema validation.
 * 3. Malformed, corrupted, or injected responses fall back cleanly to deterministic data.
 */

import {
  EducationalSource,
  LearningEntity,
  LearningKnowledgeBundle,
  LearningRelationship,
  SourceLicenseType,
} from './sources/sourceTypes';
import { SourceDiscovery } from './sources/sourceDiscovery';
import { SourceLicensePolicy } from './sources/sourceLicense';

export interface ValidationResult<T> {
  valid: boolean;
  sanitized?: T;
  errors: string[];
}

export class AiValidator {
  /**
   * Validates and sanitizes a LearningKnowledgeBundle against domain invariants:
   * - Must contain a valid topic and subject
   * - Must have >= 2 unique entities with recognized roles
   * - Relationships must connect existing entities (no dangling references)
   * - Must contain >= 1 core principle and >= 2 learning objectives
   * - Must contain verified educational sources
   */
  static validateKnowledgeBundle(bundle: unknown): ValidationResult<LearningKnowledgeBundle> {
    const errors: string[] = [];

    if (!bundle || typeof bundle !== 'object') {
      return { valid: false, errors: ['Knowledge bundle must be a non-null object'] };
    }

    const b = bundle as Record<string, any>;

    // 1. Topic & Subject
    const topic = typeof b.topic === 'string' && b.topic.trim().length > 0 ? b.topic.trim() : '';
    const subject = typeof b.subject === 'string' && b.subject.trim().length > 0 ? b.subject.trim() : 'General STEM';
    if (!topic) {
      errors.push('Missing or empty topic identifier');
    }

    // 2. Entities
    const rawEntities = Array.isArray(b.entities) ? b.entities : [];
    const validRoles = new Set(['input', 'process', 'output', 'controller', 'environment', 'field', 'indicator']);
    const entities: LearningEntity[] = [];
    const seenEntityIds = new Set<string>();

    for (const ent of rawEntities) {
      if (!ent || typeof ent !== 'object') continue;
      const id = typeof ent.id === 'string' && ent.id.trim().length > 0 ? ent.id.trim() : '';
      const name = typeof ent.name === 'string' && ent.name.trim().length > 0 ? ent.name.trim() : id;
      const role = validRoles.has(ent.role) ? ent.role : 'process';

      if (id && !seenEntityIds.has(id)) {
        seenEntityIds.add(id);
        entities.push({
          id,
          name,
          role,
          semanticDescription: typeof ent.semanticDescription === 'string' ? ent.semanticDescription : name,
          physicalVisualType: ['box', 'sphere', 'cylinder', 'cone', 'torus'].includes(ent.physicalVisualType)
            ? ent.physicalVisualType
            : 'sphere',
          color: typeof ent.color === 'string' && ent.color.startsWith('#') ? ent.color : '#38bdf8',
          connectsTo: Array.isArray(ent.connectsTo)
            ? ent.connectsTo.filter((c: any) => typeof c === 'string')
            : undefined,
        });
      }
    }

    if (entities.length < 2) {
      errors.push(`Knowledge bundle must contain at least 2 entities, got ${entities.length}`);
    }

    // 3. Relationships (Must strictly connect existing entities)
    const rawRelationships = Array.isArray(b.relationships) ? b.relationships : [];
    const validRelTypes = new Set(['causes', 'flowsTo', 'transformsInto', 'dependsOn', 'contains', 'resists', 'opposes']);
    const relationships: LearningRelationship[] = [];

    for (const rel of rawRelationships) {
      if (!rel || typeof rel !== 'object') continue;
      const from = typeof rel.sourceEntityId === 'string'
        ? rel.sourceEntityId.trim()
        : typeof rel.fromEntityId === 'string'
        ? rel.fromEntityId.trim()
        : '';
      const to = typeof rel.targetEntityId === 'string'
        ? rel.targetEntityId.trim()
        : typeof rel.toEntityId === 'string'
        ? rel.toEntityId.trim()
        : '';
      const type = validRelTypes.has(rel.type) ? rel.type : 'causes';

      // Disallow self-loops and dangling pointers
      if (from && to && from !== to && seenEntityIds.has(from) && seenEntityIds.has(to)) {
        relationships.push({
          sourceEntityId: from,
          targetEntityId: to,
          type,
          description: typeof rel.description === 'string' ? rel.description : `${from} ${type} ${to}`,
          formula: typeof rel.formula === 'string' ? rel.formula : undefined,
        });
      }
    }

    // 4. Principles
    const rawPrinciples = Array.isArray(b.principles)
      ? b.principles
      : Array.isArray(b.keyPrinciples)
      ? b.keyPrinciples.map((p: any, idx: number) => ({
          id: `principle_${idx + 1}`,
          statement: typeof p === 'string' ? p : String(p),
          explanation: typeof p === 'string' ? p : String(p),
        }))
      : [];

    const principles = rawPrinciples.map((p: any, idx: number) => ({
      id: p.id || `principle_${idx + 1}`,
      statement: p.statement || p.name || String(p),
      explanation: p.explanation || p.statement || String(p),
      formula: p.formula,
      sourceId: p.sourceId,
    }));

    if (principles.length === 0) {
      errors.push('Knowledge bundle must have at least 1 key principle');
    }

    // 5. Learning Objectives
    const rawObjectives = Array.isArray(b.learningObjectives) ? b.learningObjectives : [];
    const learningObjectives: string[] = rawObjectives
      .filter((o: any) => typeof o === 'string' && o.trim().length > 0)
      .map((o: string) => o.trim());

    if (learningObjectives.length < 2) {
      errors.push(`Knowledge bundle must have at least 2 learning objectives, got ${learningObjectives.length}`);
    }

    // 6. Educational Sources
    const rawSources = Array.isArray(b.sources) ? b.sources : [];
    const sources: EducationalSource[] = [];

    for (const src of rawSources) {
      if (!src || typeof src !== 'object') continue;
      const url = typeof src.url === 'string' ? src.url : '';
      if (!SourceDiscovery.isSafeUrl(url)) {
        continue; // Drop unsafe or SSRF-violating source URLs
      }

      const license: SourceLicenseType = typeof src.license === 'string' ? src.license : 'Unknown';
      const licenseDetails = SourceLicensePolicy.getLicenseDetails(license);

      sources.push({
        id: src.id || `src_${Math.random().toString(36).slice(2, 7)}`,
        title: typeof src.title === 'string' ? src.title : 'Educational Reference',
        publisher: typeof src.publisher === 'string' ? src.publisher : 'Open Educational Resource',
        author: typeof src.author === 'string' ? src.author : undefined,
        url,
        category: src.category || 'academic_reference',
        license: licenseDetails.license,
        licenseDetails,
        authorityScore: typeof src.authorityScore === 'number' ? Math.min(1, Math.max(0, src.authorityScore)) : 0.8,
        relevanceScore: typeof src.relevanceScore === 'number' ? Math.min(1, Math.max(0, src.relevanceScore)) : 0.8,
        overallScore: typeof src.overallScore === 'number' ? Math.min(1, Math.max(0, src.overallScore)) : 0.8,
        retrievalDate: src.retrievalDate || new Date().toISOString(),
        excerpt: typeof src.excerpt === 'string' ? src.excerpt.slice(0, 500) : undefined,
        topics: Array.isArray(src.topics) ? src.topics : [topic],
        verifiedOpenAccess: Boolean(src.verifiedOpenAccess),
      });
    }

    if (sources.length === 0 && topic) {
      // Auto-attach safe discovered sources if none present
      const discovered = SourceDiscovery.discoverSources(topic, subject);
      sources.push(...discovered.slice(0, 2));
    }

    // 7. Confidence
    const confidence = typeof b.confidence === 'number'
      ? Math.max(0, Math.min(1, b.confidence))
      : 0.85;

    const sanitized: LearningKnowledgeBundle = {
      bundleId: b.bundleId || `kb_${topic.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
      topic,
      normalizedTopic: b.normalizedTopic || topic.toLowerCase().trim(),
      subject,
      domain: b.domain || `${subject} Foundations`,
      sources,
      primarySourceTitle: sources[0]?.title,
      primarySourcePublisher: sources[0]?.publisher,
      concepts: Array.isArray(b.concepts)
        ? b.concepts
        : entities.map((e) => ({
            id: e.id,
            name: e.name,
            definition: e.semanticDescription,
          })),
      principles,
      entities,
      relationships,
      processSteps: Array.isArray(b.processSteps) ? b.processSteps : [],
      misconceptions: Array.isArray(b.misconceptions) ? b.misconceptions : [],
      learningObjectives,
      suggestedManipulableVariables: Array.isArray(b.suggestedManipulableVariables)
        ? b.suggestedManipulableVariables
        : [],
      confidence,
      isSourceBacked: sources.length > 0,
      createdAt: typeof b.createdAt === 'number' ? b.createdAt : Date.now(),
    };

    return {
      valid: errors.length === 0,
      sanitized,
      errors,
    };
  }

  /**
   * Validates AI-generated pedagogical topic enrichment.
   */
  static validateTopicEnrichment(data: unknown): ValidationResult<{
    analogy: string;
    realWorldApplication: string;
    enhancedExplanation: string;
    deepDiveQuestion: string;
  }> {
    const errors: string[] = [];

    if (!data || typeof data !== 'object') {
      return { valid: false, errors: ['Enrichment data must be an object'] };
    }

    const d = data as Record<string, any>;

    const analogy = typeof d.analogy === 'string' && d.analogy.trim().length > 10 ? d.analogy.trim() : '';
    const realWorldApplication = typeof d.realWorldApplication === 'string' && d.realWorldApplication.trim().length > 10
      ? d.realWorldApplication.trim()
      : '';
    const enhancedExplanation = typeof d.enhancedExplanation === 'string' && d.enhancedExplanation.trim().length > 15
      ? d.enhancedExplanation.trim()
      : '';
    const deepDiveQuestion = typeof d.deepDiveQuestion === 'string' && d.deepDiveQuestion.trim().length > 10
      ? d.deepDiveQuestion.trim()
      : '';

    if (!analogy) errors.push('Missing or invalid analogy');
    if (!enhancedExplanation) errors.push('Missing or invalid enhanced explanation');

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return {
      valid: true,
      sanitized: {
        analogy,
        realWorldApplication: realWorldApplication || 'Fundamental to understanding scientific and engineering systems.',
        enhancedExplanation,
        deepDiveQuestion: deepDiveQuestion || 'How does adjusting the parameters influence the equilibrium?',
      },
      errors: [],
    };
  }
}
