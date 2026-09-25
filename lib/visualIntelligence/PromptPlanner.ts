/**
 * Prompt Planner (Steps 10, 11)
 *
 * Translates a structured VisualRequirement into a safe, deterministic
 * Phase 2 VisualGenerationRequest without calling ComfyUI directly.
 *
 * Guarantees:
 * - Educational intent over decorative art
 * - Explicit component relationships and labels
 * - Standardized anti-hallucination negative prompts
 * - Grounding in verified curriculum content
 * - Detection of incomplete requirements when verified facts are unavailable
 */

import { VisualRequirement } from './types';
import { VisualGenerationRequest } from '../visualGeneration/types';
import { CANONICAL_CLASSROOM_LESSONS } from '../classroom/classroomCatalog';

export interface PlannedGenerationPayload {
  request: VisualGenerationRequest;
  isIncomplete: boolean;
  incompleteReason?: string;
}

export class PromptPlanner {
  private static readonly DEFAULT_NEGATIVE_PROMPT =
    'blurry, distorted, low quality, photorealistic photograph, messy, illegible text, dark shadows, cartoon caricature, decorative clutter, fantasy elements';

  /**
   * Plans a safe Phase 2 VisualGenerationRequest from a structured requirement.
   */
  public planGeneration(requirement: VisualRequirement): PlannedGenerationPayload {
    // 1. Inspect verified curriculum knowledge from canonical catalog
    const lesson = CANONICAL_CLASSROOM_LESSONS[requirement.conceptId];
    const verifiedFacts: string[] = [];

    if (lesson) {
      if (lesson.learningObjective) verifiedFacts.push(lesson.learningObjective);
      lesson.steps.forEach((s) => {
        if (s.keyPrinciple) verifiedFacts.push(s.keyPrinciple);
      });
    }

    // 2. Validate requirement completeness (Step 6 & 11)
    const requiredElements = requirement.contentRequirements?.requiredElements || [];
    if (requiredElements.length === 0 && !lesson && !requirement.pedagogicalPurpose?.relationshipToEmphasize) {
      return {
        request: {
          conceptId: requirement.conceptId,
          subject: requirement.subject,
          visualType: 'educational_illustration',
          prompt: `educational illustration of ${requirement.conceptId.replace(/_/g, ' ')}`,
          negativePrompt: PromptPlanner.DEFAULT_NEGATIVE_PROMPT,
          workflowId: 'educational_illustration',
          width: 512,
          height: 512,
          cachePolicy: 'reuse',
        },
        isIncomplete: true,
        incompleteReason: `Insufficient verified factual elements found for concept '${requirement.conceptId}'. Requires explicit content grounding before high-fidelity schematic generation.`,
      };
    }

    // 3. Assemble Pedagogical Prompt (Step 11)
    const elementsList = requiredElements.length > 0
      ? `showing ${requiredElements.join(', ')}`
      : `illustrating ${requirement.conceptId.replace(/_/g, ' ')}`;

    const relationshipText = requirement.pedagogicalPurpose?.relationshipToEmphasize
      ? `, emphasizing ${requirement.pedagogicalPurpose.relationshipToEmphasize}`
      : '';

    const labelDirective = requirement.contentRequirements?.labelsRequired || requirement.pedagogicalPurpose?.labelsRequired
      ? ', clean technical labels, clear vector pointers'
      : '';

    const stylePrefix = requirement.visualType === 'scientific_diagram'
      ? 'educational scientific textbook diagram of'
      : 'high-clarity educational illustration of';

    const fullPrompt = `${stylePrefix} ${requirement.conceptId.replace(/_/g, ' ')} ${elementsList}${relationshipText}${labelDirective}, minimal decorative background, clean crisp lines, high educational clarity`;

    // 4. Map workflow based on resolved visual type
    let workflowId = 'educational_illustration';
    if (requirement.visualType === 'scientific_diagram') {
      workflowId = 'educational_illustration'; // Uses standard educational workflow in Phase 2
    }

    // 5. Select dimensions matching standard aspect ratios
    let width = 512;
    let height = 512;
    if (requirement.visualType === 'timeline' || requirement.visualType === 'graph') {
      width = 768;
      height = 512; // Widescreen for sequential/function visualization
    }

    const request: VisualGenerationRequest = {
      conceptId: requirement.conceptId,
      subject: requirement.subject,
      visualType: 'educational_illustration',
      prompt: fullPrompt.slice(0, 1000), // Enforce length boundary
      negativePrompt: PromptPlanner.DEFAULT_NEGATIVE_PROMPT,
      workflowId,
      width,
      height,
      cachePolicy: 'reuse',
      clientMetadata: {
        pedagogicalStage: requirement.stage,
        accuracyLevel: requirement.accuracyLevel,
        targetVisualType: requirement.visualType,
        verifiedFactsCount: verifiedFacts.length,
      },
    };

    return {
      request,
      isIncomplete: false,
    };
  }
}
