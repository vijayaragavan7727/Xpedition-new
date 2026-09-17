/**
 * Xpedition Experience Engine — Human Heart Anatomy Domain Rules
 *
 * Implements deterministic anatomical relationships, valve/chamber connections,
 * blood-flow sequence validation, and contextual challenge verification.
 *
 * INVARIANT: This domain logic is decoupled from React, Three.js, and the Experience Orchestrator.
 */

export interface HeartStructureDefinition {
  id: string;
  name: string;
  category: 'chamber' | 'valve' | 'vessel';
  side: 'right' | 'left' | 'central';
  bloodType: 'deoxygenated' | 'oxygenated';
  shortDescription: string;
  clinicalSignificance: string;
  position3D: [number, number, number];
  colorHex: string;
}

export interface AnatomyChallenge {
  id: string;
  prompt: string;
  targetStructureId: string;
  explanation: string;
  options: Array<{ id: string; label: string; isCorrect: boolean }>;
}

export interface HeartAnatomyState {
  currentEulerDeg: [number, number, number];
  selectedStructureId?: string;
  inspectedStructures: string[];
  flowStepIndex: number;
  isFlowActive: boolean;
  flowErrors: number;
  flowCompleted: boolean;
  currentChallengeIndex: number;
  challengeAnswers: Record<string, { selectedId: string; isCorrect: boolean }>;
  isComplete: boolean;
}

/**
 * Canonical 12-step unidirectional cardiovascular blood flow sequence:
 * Vena Cava -> Right Atrium -> Tricuspid Valve -> Right Ventricle ->
 * Pulmonary Valve -> Pulmonary Artery -> Pulmonary Veins -> Left Atrium ->
 * Mitral Valve -> Left Ventricle -> Aortic Valve -> Aorta
 */
export const CANONICAL_BLOOD_FLOW_PATH: string[] = [
  'vena_cava',
  'right_atrium',
  'tricuspid_valve',
  'right_ventricle',
  'pulmonary_valve',
  'pulmonary_artery',
  'pulmonary_veins',
  'left_atrium',
  'mitral_valve',
  'left_ventricle',
  'aortic_valve',
  'aorta',
];

export interface ValveChamberRelationship {
  valveId: string;
  fromChamber: string;
  toChamber: string;
  valveType: 'atrioventricular' | 'semilunar';
}

export const VALVE_CHAMBER_RELATIONSHIPS: ValveChamberRelationship[] = [
  { valveId: 'tricuspid_valve', fromChamber: 'right_atrium', toChamber: 'right_ventricle', valveType: 'atrioventricular' },
  { valveId: 'pulmonary_valve', fromChamber: 'right_ventricle', toChamber: 'pulmonary_artery', valveType: 'semilunar' },
  { valveId: 'mitral_valve', fromChamber: 'left_atrium', toChamber: 'left_ventricle', valveType: 'atrioventricular' },
  { valveId: 'aortic_valve', fromChamber: 'left_ventricle', toChamber: 'aorta', valveType: 'semilunar' },
];

/**
 * Validates selection of a target anatomical structure.
 */
export function validateStructureSelection(
  selectedStructureId: string,
  expectedStructureId: string
): { isValid: boolean; reason: string; principle?: string } {
  if (selectedStructureId === expectedStructureId) {
    return {
      isValid: true,
      reason: 'Structure correctly identified.',
      principle: 'structure_identified',
    };
  }

  // Detect specific valve confusion (e.g. mitral vs tricuspid)
  const isMitralTricuspid =
    (selectedStructureId === 'mitral_valve' && expectedStructureId === 'tricuspid_valve') ||
    (selectedStructureId === 'tricuspid_valve' && expectedStructureId === 'mitral_valve');

  if (isMitralTricuspid) {
    return {
      isValid: false,
      reason: 'Remember: Tricuspid sits on the Right (TRI = R), Mitral sits on the Left.',
      principle: 'repeated_valve_confusion',
    };
  }

  // Detect chamber confusion (e.g. right vs left ventricle)
  const isVentricleConfusion =
    (selectedStructureId === 'left_ventricle' && expectedStructureId === 'right_ventricle') ||
    (selectedStructureId === 'right_ventricle' && expectedStructureId === 'left_ventricle');

  if (isVentricleConfusion) {
    return {
      isValid: false,
      reason: 'Check the cardiac orientation: anatomical left corresponds to the observer’s right.',
      principle: 'chamber_sidedness_confusion',
    };
  }

  return {
    isValid: false,
    reason: 'Selected structure does not match the target objective.',
    principle: 'structure_missed',
  };
}

/**
 * Validates the next step in blood flow progression.
 */
export function validateFlowStep(
  selectedStructureId: string,
  currentStepIndex: number,
  flowPath: string[] = CANONICAL_BLOOD_FLOW_PATH
): {
  isCorrect: boolean;
  nextIndex: number;
  isComplete: boolean;
  reason: string;
  expectedStructureId: string;
} {
  const expectedStructureId = flowPath[currentStepIndex];

  if (selectedStructureId === expectedStructureId) {
    const nextIndex = currentStepIndex + 1;
    const isComplete = nextIndex >= flowPath.length;
    return {
      isCorrect: true,
      nextIndex,
      isComplete,
      expectedStructureId,
      reason: isComplete
        ? 'Full cardiac circulation circuit successfully traced!'
        : 'Correct path step followed in cardiac cycle.',
    };
  }

  return {
    isCorrect: false,
    nextIndex: currentStepIndex,
    isComplete: false,
    expectedStructureId,
    reason: `Incorrect blood flow direction. Expected ${expectedStructureId.replace(/_/g, ' ')}.`,
  };
}

/**
 * Validates an interactive challenge response.
 */
export function validateChallengeAnswer(
  challenge: AnatomyChallenge,
  selectedOptionId: string
): { isCorrect: boolean; reason: string; feedback: string } {
  const isCorrect = selectedOptionId === challenge.targetStructureId;
  return {
    isCorrect,
    reason: isCorrect ? 'Challenge answered correctly.' : 'Challenge response incorrect.',
    feedback: isCorrect ? challenge.explanation : `Incorrect. Note: ${challenge.explanation}`,
  };
}

/**
 * Evaluates holistic completion of the heart anatomy exploration.
 * Completion condition:
 * - At least 4 structures explored/inspected
 * - Completed blood flow sequence OR answered at least 2 challenges correctly.
 */
export function evaluateHeartAnatomyCompletion(state: HeartAnatomyState): {
  isComplete: boolean;
  score: number;
  reason: string;
  exploredCount: number;
  challengesPassed: number;
} {
  const exploredCount = state.inspectedStructures.length;
  const challengeResults = Object.values(state.challengeAnswers);
  const challengesPassed = challengeResults.filter((a) => a.isCorrect).length;
  const isFlowComplete = state.flowCompleted || state.flowStepIndex >= CANONICAL_BLOOD_FLOW_PATH.length;

  const isComplete = exploredCount >= 4 && (isFlowComplete || challengesPassed >= 2);

  // Score calculation: 50 base for exploration + 25 for flow + 25 for challenges
  const explorationScore = Math.min(50, exploredCount * 12.5);
  const flowScore = isFlowComplete ? 25 : Math.round((state.flowStepIndex / CANONICAL_BLOOD_FLOW_PATH.length) * 25);
  const challengeScore = Math.min(25, challengesPassed * 12.5);
  const score = Math.min(100, Math.round(explorationScore + flowScore + challengeScore));

  let reason = 'Heart exploration in progress.';
  if (isComplete) {
    reason = 'Anatomical structures, blood flow pathway, and functional challenges successfully mastered.';
  } else if (exploredCount < 4) {
    reason = `Explore and inspect at least ${4 - exploredCount} more cardiac structures.`;
  } else if (!isFlowComplete && challengesPassed < 2) {
    reason = 'Complete the blood flow circuit or answer 2 anatomical challenges to verify understanding.';
  }

  return {
    isComplete,
    score,
    reason,
    exploredCount,
    challengesPassed,
  };
}
