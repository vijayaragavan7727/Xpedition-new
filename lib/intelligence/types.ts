/**
 * Xpedition Intelligence Layer v1 — Core Types
 *
 * Defines the foundation for multi-provider orchestration, capability routing,
 * normalized learner state, and pedagogical decision making.
 */

import type { LearningAction, NextBestAction, ActionPriority } from './actions';
export * from './actions';

export type Capability =
  | 'tutor'
  | 'explain'
  | 'hint'
  | 'generateQuestion'
  | 'generateMCQ'
  | 'generateFlashcards'
  | 'evaluateAnswer'
  | 'evaluateWriting'
  | 'misconceptionCorrection'
  | 'challenge'
  | 'complexReasoning'
  | 'summarize'
  | 'translate'
  | 'mathSolve'
  | 'multimodal'
  | 'longContext'
  | 'research'
  | 'documentQA';

export type ProviderId =
  | 'groq'
  | 'tavily'
  | 'openai'
  | 'gemini'
  | 'freellmapi';

export type CostTier = 'free_tier' | 'low' | 'paid';
export type LatencyTier = 'ultra_fast' | 'fast' | 'standard' | 'extended';
export type QualityTier = 'standard' | 'high' | 'expert';

export interface ProviderPolicy {
  providerId: ProviderId;
  costTier: CostTier;
  latencyTier: LatencyTier;
  qualityTier: QualityTier;
  priority: number; // Lower number = higher priority
  supportedCapabilities: Capability[];
}

export interface ProviderHealth {
  providerId: ProviderId;
  isConfigured: boolean;
  isPaidProvider: boolean;
  envKeyPresent: boolean;
  status: 'available' | 'missing_key' | 'disabled';
  lastCheckedAt?: number;
}

/**
 * Normalized internal representation of the Learner State.
 * Derived cleanly from existing Xpedition user store data, attempt history,
 * mastery percentages, and profile preferences without duplicating calculations.
 */
export interface LearnerState {
  learnerId?: string;
  goalText: string;
  currentConceptId?: string;
  currentConceptName?: string;
  masteryPercentage: number; // 0 to 100
  recentAccuracy: number; // 0.0 to 1.0 (over last 5 attempts)
  recentMistakeCount: number;
  repeatedMistakes: boolean;
  highConfidenceWrong: number; // Count of attempts where confidence was 'known' but answer was wrong
  lowConfidenceCorrect: number; // Count of attempts where confidence was 'unsure' but answer was correct
  forgettingRisk: number; // 0.0 to 1.0 (>0.35 indicates fading concept)
  isNewLearner: boolean; // 0 attempts across entire graph or mastery < 20%
  streak: number;
  level: number;
  xp: number;
  language: 'english' | 'tanglish' | 'tamil';
  flowState: 'flow' | 'bored' | 'frustrated' | 'drifting' | 'unknown';
  weakConcepts: Array<{ id: string; name: string; mastery: number; retentionRisk: number }>;
  fadingConcepts: Array<{ id: string; name: string; mastery: number; retentionRisk: number }>;
  examDate?: string;
  daysUntilExam?: number;
  activeDocumentId?: string;
  activeDocumentTitle?: string;
  sessionContext?: {
    conceptId: string;
    conceptName: string;
    currentIndex: number;
    totalLength: number;
    inProgress: boolean;
  };
}

// Backward-compatible alias for existing context callers
export type LearnerContext = Partial<LearnerState>;

export interface IntelligenceRequest {
  id?: string;
  learnerContext?: Partial<LearnerState>;
  query?: string;
  systemPrompt?: string;
  userPrompt?: string;
  preferredCapability?: Capability;
  requiredCapability?: Capability;
  forceProvider?: ProviderId;
  multimodalAttachments?: Array<{
    type: 'image' | 'audio' | 'document';
    url?: string;
    mimeType?: string;
    base64?: string;
  }>;
  documentContext?: string;
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
  route?: string;
  metadata?: Record<string, unknown>;
}

export interface Decision {
  capability: Capability;
  primaryProvider: ProviderId;
  reason: string;
  confidence: number; // 0.0 to 1.0
  fallbackProviders: ProviderId[];
}

export interface ProviderExecutionRequest {
  capability: Capability;
  systemPrompt?: string;
  userPrompt: string;
  documentContext?: string;
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
  multimodalAttachments?: IntelligenceRequest['multimodalAttachments'];
  metadata?: Record<string, unknown>;
}

export type ProviderFailureType =
  | 'timeout'
  | 'rate_limit'
  | 'auth_or_config'
  | 'unavailable'
  | 'malformed_response'
  | 'network_error'
  | 'quota'
  | 'unknown';

export interface ProviderExecutionResult<T = unknown> {
  data: T | null;
  text: string;
  provider: ProviderId | 'fallback';
  modelUsed?: string;
  latencyMs: number;
  approximateTokens?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  cached?: boolean;
  success: boolean;
  error?: string;
  failureType?: ProviderFailureType;
}

export interface IntelligenceTrace {
  requestId: string;
  timestamp: number;
  capability: Capability;
  selectedProvider: ProviderId;
  attemptedProviders: ProviderId[];
  fallbackUsed: boolean;
  latencyMs: number;
  success: boolean;
  error?: string;
  failureType?: ProviderFailureType;
  tokenMetadata?: ProviderExecutionResult['approximateTokens'];
}

export interface CapabilityProvider {
  readonly providerId: ProviderId;
  readonly defaultPolicy: ProviderPolicy;
  readonly isPaidProvider: boolean;
  isConfigured(): boolean;
  healthCheck(): Promise<ProviderHealth>;
  supports(capability: Capability): boolean;
  execute<T = unknown>(request: ProviderExecutionRequest): Promise<ProviderExecutionResult<T>>;
}

/**
 * Xpedition Intelligence Layer v1 — Curriculum Plan
 */
export interface CurriculumPlan {
  /** Optional identifier for the associated goal */
  goalId?: string;
  /** Deterministic version – increments only on material changes */
  version: number;
  /** ISO timestamp when the plan was generated */
  generatedAt: string;

  /** Concepts that are actively part of the learner's pathway */
  activeConceptIds: string[];
  /** Concepts deemed mastered enough to be compressed (lighter treatment) */
  compressedConceptIds: string[];
  /** Concepts that need expanded coverage due to struggle */
  expandedConceptIds: string[];
  /** Concepts blocked because a prerequisite is unmet */
  blockedConceptIds: string[];
  /** Optional / low‑priority concepts */
  optionalConceptIds: string[];
  /** Prerequisite concepts required for active concepts */
  prerequisiteConceptIds: string[];

  /** Concepts that have been removed or deferred for later */
  removedOrDeferredConceptIds: string[];

  /** Human‑readable reasons for the decisions made */
  rationale: string[];

  /** Confidence of the recomposition logic */
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface AdaptiveLoopResult {
  nextAction: NextBestAction;
  plannerResult?: CurriculumPlan;
  reasoning: string;
}

export interface Planner {
  generatePlan(input: PlannerInput): Promise<CurriculumPlan>;
}

export interface PlannerInput {
  learnerState: LearnerState;
  currentPlan?: CurriculumPlan;
  requestContext?: string;
}

// ---------------------------------------------------------------------------
// Assessment & Adaptive Experience Loop Types
// ---------------------------------------------------------------------------

export type AssessmentSignal =
  | 'KNOWLEDGE_GAP'
  | 'MISCONCEPTION'
  | 'CONFIDENCE_MISALIGNMENT'
  | 'RECALL_FAILURE'
  | 'CARELESS_ERROR'
  | 'DIFFICULTY_MISMATCH'
  | 'STRONG_MASTERY'
  | 'INSUFFICIENT_EVIDENCE';

export interface AssessmentResult {
  signal: AssessmentSignal;
  confidence: number; // 0.0 to 1.0
  reason: string;
  detectedMisconception?: string;
  evidenceSignals: string[];
  recommendedActionType?: NextBestAction['action'];
}

export interface ResolvedExperience {
  available: boolean;
  conceptId: string;
  action: NextBestAction['action'];
  experienceType?: string;
  experienceId?: string;
  questId?: string;
  title?: string;
  description?: string;
  reason: string;
}

export interface NextQuestTarget {
  available: boolean;
  questId?: string;
  conceptId: string;
  conceptName: string;
  action: NextBestAction['action'];
  experienceId?: string;
  experienceType?: string;
  title: string;
  description: string;
  buttonLabel: string;
  route: string;
  reason: string;
  fallback?: 'STANDARD_QUEST' | 'HOME' | 'REVIEW' | 'TUTOR';
  isExperiential: boolean;
}

export interface AdaptiveExperienceLoopResult {
  conceptId: string;
  conceptName: string;
  updatedLearnerState: LearnerState;
  assessment: AssessmentResult;
  decision: NextBestAction;
  nextExperience: ResolvedExperience;
  nextQuest: NextQuestTarget;
  reason: string;
  evidence: {
    rawExperienceResult: any;
    runsCount: number;
    hintsUsed: number;
    isIndependent: boolean;
    finalSuccess: boolean;
    correctionCount?: number;
    detectedBug?: string;
  };
  xiraGuidance: string;
  evaluatedAt: number;
}

