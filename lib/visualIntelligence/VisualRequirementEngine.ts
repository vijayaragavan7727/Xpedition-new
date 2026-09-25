/**
 * Visual Requirement Engine (Step 2, 5, 6, 12, 17, 21)
 *
 * Master orchestrator for Xpedition's Visual Intelligence Engine.
 *
 * Responsibilities:
 * 1. Evaluates visual necessity (VisualNeedEvaluator)
 * 2. Determines pedagogical purpose & accuracy requirements
 * 3. Resolves representation type and safe fallbacks (VisualTypeResolver)
 * 4. Extracts grounded curriculum facts (CANONICAL_CLASSROOM_LESSONS)
 * 5. Queries existing assets to prevent duplicate generation (VisualAssetResolver)
 * 6. Converts unfulfilled requirements into Phase 2 generation plans (PromptPlanner)
 * 7. Fulfills generation requests through Phase 2 VisualGenerationEngine when requested
 * 8. Formats clean presentation payloads for the classroom Smart Board
 */

import {
  VisualRequirement,
  VisualIntelligenceRequest,
  SmartBoardVisualPayload,
  PedagogicalPurpose,
  ContentRequirements,
  RepresentationType,
  AccuracyLevel,
  VisualStage,
} from './types';
import { IVisualNeedEvaluator, RuleBasedVisualNeedEvaluator } from './VisualNeedEvaluator';
import { VisualTypeResolver } from './VisualTypeResolver';
import { IVisualAssetResolver, VisualAssetResolver } from './VisualAssetResolver';
import { PromptPlanner } from './PromptPlanner';
import { assetStore, IAssetStore } from '../visualGeneration/AssetStore';
import { VisualGenerationEngine } from '../visualGeneration/VisualGenerationEngine';
import { CANONICAL_CLASSROOM_LESSONS } from '../classroom/classroomCatalog';

export interface VisualRequirementEngineOptions {
  needEvaluator?: IVisualNeedEvaluator;
  typeResolver?: VisualTypeResolver;
  assetResolver?: IVisualAssetResolver;
  promptPlanner?: PromptPlanner;
  generationEngine?: VisualGenerationEngine;
  assetStore?: IAssetStore;
}

export class VisualRequirementEngine {
  private static instance: VisualRequirementEngine;

  private readonly needEvaluator: IVisualNeedEvaluator;
  private readonly typeResolver: VisualTypeResolver;
  private readonly assetResolver: IVisualAssetResolver;
  private readonly promptPlanner: PromptPlanner;
  private readonly generationEngine: VisualGenerationEngine;

  constructor(options: VisualRequirementEngineOptions = {}) {
    const store = options.assetStore || assetStore;
    this.needEvaluator = options.needEvaluator || new RuleBasedVisualNeedEvaluator();
    this.typeResolver = options.typeResolver || new VisualTypeResolver();
    this.assetResolver = options.assetResolver || new VisualAssetResolver(store);
    this.promptPlanner = options.promptPlanner || new PromptPlanner();
    this.generationEngine = options.generationEngine || VisualGenerationEngine.getInstance({ assetStore: store });
  }

  public static getInstance(options?: VisualRequirementEngineOptions): VisualRequirementEngine {
    if (!VisualRequirementEngine.instance || options) {
      VisualRequirementEngine.instance = new VisualRequirementEngine(options);
    }
    return VisualRequirementEngine.instance;
  }

  /**
   * Evaluates and produces a structured VisualRequirement for a learning concept.
   */
  public async evaluateVisualRequirement(
    request: VisualIntelligenceRequest
  ): Promise<VisualRequirement> {
    const stage: VisualStage = request.stage || 'explain';

    // 1. Evaluate Visual Need (Step 3, 13, 15)
    const needResult = await this.needEvaluator.evaluate({
      conceptId: request.conceptId,
      subject: request.subject,
      topic: request.topic,
      learningObjective: request.learningObjective,
    });

    if (!needResult.needed) {
      return {
        conceptId: request.conceptId,
        subject: request.subject,
        topic: request.topic,
        learningObjective: request.learningObjective,
        stage,
        visualNeeded: false,
        confidence: needResult.confidence,
        reason: needResult.reason,
      };
    }

    // 2. Resolve Representation Type & Safe Fallback (Step 4, 7, 8)
    const typeResolution = this.typeResolver.resolve({
      conceptId: request.conceptId,
      subject: request.subject,
      topic: request.topic,
      learningObjective: request.learningObjective,
      stage,
    });

    // 3. Ground Content Requirements & Pedagogical Purpose (Step 5, 6, 7)
    const canonicalLesson = CANONICAL_CLASSROOM_LESSONS[request.conceptId];
    const { purpose, contentReqs } = this.derivePedagogicalRequirements(
      request.conceptId,
      typeResolution.visualType,
      typeResolution.accuracyLevel,
      stage,
      canonicalLesson
    );

    // 4. Query Existing Asset Candidates (Step 9)
    const existingCandidates = await this.assetResolver.findCandidates(request.conceptId);
    const existingAsset = await this.assetResolver.resolveExistingAsset(
      request.conceptId,
      typeResolution.visualType
    );

    // 5. Construct Visual Requirement
    const requirement: VisualRequirement = {
      conceptId: request.conceptId,
      subject: request.subject || canonicalLesson?.subject,
      topic: request.topic || canonicalLesson?.topicTitle,
      learningObjective: request.learningObjective || canonicalLesson?.learningObjective,
      stage,
      visualNeeded: true,
      confidence: needResult.confidence,
      reason: needResult.reason,
      visualType: typeResolution.visualType,
      accuracyLevel: typeResolution.accuracyLevel,
      pedagogicalPurpose: purpose,
      contentRequirements: contentReqs,
      existingAssetCandidates: existingCandidates,
      fallbackRepresentation: typeResolution.fallbackRepresentation,
      resolvedAsset: existingAsset || undefined,
      isFromExistingAsset: Boolean(existingAsset),
    };

    // 6. Plan Phase 2 Generation Payload (Step 10, 11)
    const planned = this.promptPlanner.planGeneration(requirement);
    requirement.generationRequirement = {
      prompt: planned.request.prompt,
      negativePrompt: planned.request.negativePrompt,
      workflowId: planned.request.workflowId || 'educational_illustration',
      width: planned.request.width || 512,
      height: planned.request.height || 512,
      cachePolicy: request.cachePolicy || 'reuse',
    };

    // 7. If existing asset not found AND generation is allowed, fulfill through Phase 2 Engine
    if (!requirement.resolvedAsset && request.allowGeneration) {
      const generatedJob = await this.generationEngine.generateVisual(planned.request);
      if (generatedJob.asset) {
        requirement.resolvedAsset = generatedJob.asset;
        requirement.isFromExistingAsset = generatedJob.reused;
      }
    }

    return requirement;
  }

  /**
   * Formats a clean output contract for the Smart Board (Step 17).
   */
  public formatSmartBoardPayload(requirement: VisualRequirement): SmartBoardVisualPayload {
    const isInteractive =
      requirement.visualType === 'interactive_simulation' ||
      requirement.stage === 'interact';

    const hotspots: Array<{ id: string; label: string; description: string }> = [];
    if (requirement.contentRequirements?.requiredElements) {
      requirement.contentRequirements.requiredElements.slice(0, 5).forEach((elem, idx) => {
        hotspots.push({
          id: `hotspot_${idx + 1}`,
          label: elem,
          description: `Key structural component: ${elem}`,
        });
      });
    }

    return {
      type: 'visual_requirement',
      visualType: requirement.visualType || 'educational_illustration',
      assetUrl: requirement.resolvedAsset?.publicUrl,
      title: requirement.topic || requirement.conceptId.replace(/_/g, ' ').toUpperCase(),
      purpose:
        requirement.pedagogicalPurpose?.relationshipToEmphasize ||
        requirement.reason ||
        'Educational visualization to anchor understanding',
      interaction: {
        isInteractive,
        hotspots: hotspots.length > 0 ? hotspots : undefined,
        controls: isInteractive ? ['reset', 'parameter_slider', 'view_toggle'] : undefined,
      },
      metadata: {
        stage: requirement.stage,
        accuracyLevel: requirement.accuracyLevel,
        isFromExistingAsset: requirement.isFromExistingAsset,
        conceptId: requirement.conceptId,
      },
    };
  }

  /**
   * Grounding helper constructing pedagogical purpose and verified content requirements.
   */
  private derivePedagogicalRequirements(
    conceptId: string,
    visualType: RepresentationType,
    accuracy: AccuracyLevel,
    stage: VisualStage,
    lesson?: (typeof CANONICAL_CLASSROOM_LESSONS)[string]
  ): { purpose: PedagogicalPurpose; contentReqs: ContentRequirements } {
    const norm = conceptId.toLowerCase();

    // Special grounding for canonical pilot concepts
    if (norm.includes('motor')) {
      return {
        purpose: {
          learnerNotice: [
            'Direction of magnetic field lines from North pole to South pole',
            'Current loop flowing in opposite directions along parallel armature sides',
            'Equal and opposite Lorentz forces creating net rotational torque',
            'Split-ring commutator switching brush polarity every 180 degrees',
          ],
          relationshipToEmphasize:
            'Lorentz force interaction between magnetic field (B) and loop current (I) producing rotational torque (tau)',
          keyObjects: ['North Pole', 'South Pole', 'Armature Coil', 'Split-Ring Commutator', 'Carbon Brushes'],
          antiHallucinationGuidelines: [
            'Do not omit the commutator gap',
            'Do not reverse current vector without corresponding brush contact',
          ],
          labelsRequired: true,
          interactionRequired: stage === 'interact',
        },
        contentReqs: {
          requiredElements: [
            'permanent stator magnets',
            'armature copper coil',
            'split-ring commutator',
            'carbon brushes',
            'central rotation axle',
          ],
          relationships: [
            'Current through coil creates Lorentz force inside stator magnetic field',
            'Commutator inverts current direction every 180 degrees to sustain continuous torque',
          ],
          labelsRequired: true,
          verifiedFacts: [
            'Lorentz Force F = I · (L × B)',
            'Torque tau = 2 · F · r',
            'Commutator maintains unidirectional torque by reversing current every half turn',
          ],
        },
      };
    }

    if (norm.includes('projectile')) {
      return {
        purpose: {
          learnerNotice: [
            'Constant horizontal velocity vector (zero horizontal acceleration)',
            'Accelerated vertical velocity vector pointing downward under gravity',
            'Parabolic path of flight',
          ],
          relationshipToEmphasize:
            'Independence of horizontal and vertical velocity components under uniform gravitational acceleration',
          keyObjects: ['Launch Point', 'Trajectory Arc', 'Apex Point', 'Impact Ground', 'Velocity Vectors'],
          labelsRequired: true,
          interactionRequired: true,
        },
        contentReqs: {
          requiredElements: ['launch angle theta', 'horizontal vector vx', 'vertical vector vy', 'gravitational vector g'],
          relationships: [
            'vx remains constant throughout flight: ax = 0',
            'vy decreases by g*t until reaching 0 at maximum height',
          ],
          labelsRequired: true,
          verifiedFacts: ['x(t) = v0 * cos(theta) * t', 'y(t) = v0 * sin(theta) * t - 0.5 * g * t^2'],
        },
      };
    }

    if (norm.includes('heart') || norm.includes('cardio')) {
      return {
        purpose: {
          learnerNotice: [
            'Four internal chambers: Right/Left Atria and Right/Left Ventricles',
            'Dual circulatory separation: Pulmonary circuit vs Systemic circuit',
            'Significantly thicker myocardium in Left Ventricle compared to Right Ventricle',
          ],
          relationshipToEmphasize:
            'Pressure difference: Left ventricle requires thick myocardium to pump against systemic arterial resistance across the entire body',
          keyObjects: ['Right Atrium', 'Right Ventricle', 'Left Atrium', 'Left Ventricle', 'Aorta', 'Pulmonary Artery'],
          labelsRequired: true,
          interactionRequired: stage === 'interact',
        },
        contentReqs: {
          requiredElements: ['right atrium', 'right ventricle', 'left atrium', 'left ventricle', 'mitral valve', 'aorta'],
          relationships: [
            'Deoxygenated blood flows from body -> right heart -> lungs for gas exchange',
            'Oxygenated blood flows from lungs -> left heart -> systemic circulation',
          ],
          labelsRequired: true,
          verifiedFacts: ['Left ventricle myocardium is 3x thicker than right ventricle'],
        },
      };
    }

    // Generic synthesis from canonical lesson if available
    if (lesson) {
      const elements = lesson.steps.map((s) => s.title);
      return {
        purpose: {
          learnerNotice: elements,
          relationshipToEmphasize: lesson.learningObjective,
          keyObjects: elements,
          labelsRequired: true,
          interactionRequired: stage === 'interact',
        },
        contentReqs: {
          requiredElements: elements,
          relationships: [lesson.learningObjective],
          labelsRequired: true,
          verifiedFacts: [lesson.learningObjective],
        },
      };
    }

    // Default general synthesis
    return {
      purpose: {
        learnerNotice: [`Key spatial/structural features of ${conceptId}`],
        relationshipToEmphasize: `Core principles underlying ${conceptId.replace(/_/g, ' ')}`,
        keyObjects: [conceptId.replace(/_/g, ' ')],
        labelsRequired: accuracy === 'technical' || accuracy === 'scientific',
        interactionRequired: stage === 'interact',
      },
      contentReqs: {
        requiredElements: [conceptId.replace(/_/g, ' ')],
        relationships: [`Primary functional relationships of ${conceptId}`],
        labelsRequired: true,
      },
    };
  }
}

export const visualRequirementEngine = VisualRequirementEngine.getInstance();
