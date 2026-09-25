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
  private readonly requirementCache = new Map<string, VisualRequirement>();
  private readonly payloadCache = new Map<string, SmartBoardVisualPayload>();

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
   * Clears in-memory caches.
   */
  public clearCache(): void {
    this.requirementCache.clear();
    this.payloadCache.clear();
  }

  /**
   * Evaluates and produces a structured VisualRequirement for a learning concept.
   */
  public async evaluateVisualRequirement(
    request: VisualIntelligenceRequest
  ): Promise<VisualRequirement> {
    const stage: VisualStage = request.stage || 'explain';
    const cacheKey = `${request.conceptId}:${stage}:${request.allowGeneration ? 'gen' : 'static'}`;
    if (this.requirementCache.has(cacheKey)) {
      return this.requirementCache.get(cacheKey)!;
    }

    // 1. Evaluate Visual Need (Step 3, 13, 15)
    const needResult = await this.needEvaluator.evaluate({
      conceptId: request.conceptId,
      subject: request.subject,
      topic: request.topic,
      learningObjective: request.learningObjective,
    });

    if (!needResult.needed) {
      const notNeeded: VisualRequirement = {
        conceptId: request.conceptId,
        subject: request.subject,
        topic: request.topic,
        learningObjective: request.learningObjective,
        stage,
        visualNeeded: false,
        confidence: needResult.confidence,
        reason: needResult.reason,
      };
      this.requirementCache.set(cacheKey, notNeeded);
      return notNeeded;
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

    this.requirementCache.set(cacheKey, requirement);
    return requirement;
  }

  /**
   * Formats a clean output contract for the Smart Board (Step 17).
   */
  public formatSmartBoardPayload(requirement: VisualRequirement): SmartBoardVisualPayload {
    const payloadKey = `${requirement.conceptId}:${requirement.stage}:${requirement.visualType}:${requirement.resolvedAsset?.publicUrl || ''}`;
    if (this.payloadCache.has(payloadKey)) {
      return this.payloadCache.get(payloadKey)!;
    }

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

    const payload: SmartBoardVisualPayload = {
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

    this.payloadCache.set(payloadKey, payload);
    return payload;
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

    if (norm.includes('quadratic') || norm.includes('parabola')) {
      return {
        purpose: {
          learnerNotice: [
            'Symmetrical parabolic curve opening upward or downward',
            'Vertex turning point at (h, k)',
            'Real roots / x-intercepts',
            'Vertical axis of symmetry x = -b/(2a)',
          ],
          relationshipToEmphasize:
            'How coefficients a, b, c dictate parabola curvature, vertex coordinates, and real roots via discriminant Δ = b² - 4ac',
          keyObjects: ['Parabola Curve', 'Vertex', 'Axis of Symmetry', 'Roots / Intercepts', 'Discriminant Banner'],
          labelsRequired: true,
          interactionRequired: stage === 'interact',
        },
        contentReqs: {
          requiredElements: ['vertex', 'axis of symmetry', 'x-intercepts', 'parabola curve', 'y-intercept'],
          relationships: [
            'Axis of symmetry passes through vertex x = -b / (2a)',
            'Discriminant Δ = b² - 4ac determines root multiplicity',
          ],
          labelsRequired: true,
          verifiedFacts: ['Roots x = (-b ± √(b² - 4ac)) / (2a)', 'Vertex x = -b / (2a)'],
        },
      };
    }

    if (norm.includes('molecule') || norm.includes('bonding') || norm.includes('covalent')) {
      return {
        purpose: {
          learnerNotice: [
            'Central oxygen nucleus with two shared covalent bonds',
            'Two unbonded lone electron pairs',
            'Bent molecular geometry with 104.5° bond angle',
          ],
          relationshipToEmphasize:
            'VSEPR electron pair repulsion: lone pairs exert greater electrostatic repulsion, compressing the bond angle',
          keyObjects: ['Oxygen Atom', 'Hydrogen Atoms', 'Covalent Bond Pairs', 'Lone Electron Pairs'],
          labelsRequired: true,
          interactionRequired: stage === 'interact',
        },
        contentReqs: {
          requiredElements: ['oxygen nucleus', 'hydrogen atoms', 'covalent bond electron pairs', 'lone pairs', 'bond angle 104.5°'],
          relationships: [
            'Lone pair repulsion compresses H-O-H angle to 104.5°',
            'Electronegativity difference creates polar covalent bonds',
          ],
          labelsRequired: true,
          verifiedFacts: ['Water molecule adopts bent geometry with 104.5° bond angle'],
        },
      };
    }

    if (norm.includes('binary_search') || (norm.includes('binary') && norm.includes('search'))) {
      return {
        purpose: {
          learnerNotice: [
            'Sorted index array elements',
            'Low, Mid, and High boundary pointers',
            'Halving of active search interval at each step',
          ],
          relationshipToEmphasize:
            'Divide and conquer: comparing target with middle element cuts remaining search space in half',
          keyObjects: ['Sorted Array', 'Low Pointer', 'Mid Pointer', 'High Pointer', 'Target Value'],
          labelsRequired: true,
          interactionRequired: stage === 'interact',
        },
        contentReqs: {
          requiredElements: ['sorted array', 'low index', 'mid index', 'high index', 'target element'],
          relationships: [
            'If target < array[mid], high = mid - 1; else low = mid + 1',
            'Worst-case search space collapses in ⌈log₂ n⌉ steps',
          ],
          labelsRequired: true,
          verifiedFacts: ['Binary search operates in O(log n) time complexity on sorted arrays'],
        },
      };
    }

    if (norm.includes('revolution') || norm.includes('french')) {
      return {
        purpose: {
          learnerNotice: [
            'Estates-General assembly in May 1789',
            'Storming of the Bastille on July 14, 1789',
            'Declaration of the Rights of Man on August 26, 1789',
            'Proclamation of the First Republic in 1792',
          ],
          relationshipToEmphasize:
            'Chronological transition from absolute feudal monarchy to popular constitutional sovereignty',
          keyObjects: ['Ancien Régime', 'Bastille Fortress', 'National Assembly', 'Declaration of Rights', 'First Republic'],
          labelsRequired: true,
          interactionRequired: stage === 'interact',
        },
        contentReqs: {
          requiredElements: ['estates-general', 'bastille', 'declaration of rights of man', 'national assembly', 'republic'],
          relationships: [
            'Fiscal crisis triggered Estates-General -> popular revolt led to Bastille -> National Assembly drafted human rights',
          ],
          labelsRequired: true,
          verifiedFacts: ['Storming of the Bastille occurred July 14, 1789'],
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
