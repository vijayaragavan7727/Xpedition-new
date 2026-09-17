/**
 * Xpedition Experience Engine v1 — Xira Educational Observation Adapter
 *
 * Translates low-level canonical telemetry events and validation results into
 * educational observations without inferring psychological or medical traits.
 * Provides deterministic mapping to Xira advice.
 */

import { ExperienceEvent } from '../events';
import { CanonicalValidationResult } from '../validation';
import { FeedbackType } from '../feedback';

export type EducationalObservationType =
  | 'target_hit'
  | 'target_not_reached'
  | 'trajectory_overshot'
  | 'trajectory_undershot'
  | 'repeated_axis_adjustment'
  | 'spatial_fine_tuning'
  | 'spatial_aligned'
  | 'bonding_rule_misunderstanding'
  | 'valence_capacity_reached'
  | 'molecule_synthesized'
  | 'structure_identified'
  | 'structure_missed'
  | 'repeated_structure_mistake'
  | 'flow_direction_error'
  | 'correct_flow_sequence'
  | 'repeated_valve_confusion'
  | 'heart_explored'
  | 'code_run'
  | 'output_mismatch'
  | 'repeated_assignment_pattern'
  | 'meaningful_code_correction'
  | 'successful_debugging'
  | 'repeated_failed_attempt'
  | 'independent_completion'
  | 'exploring_freely'
  | 'hint_dependent';

export interface EducationalObservation {
  id: string;
  experienceId: string;
  conceptId: string;
  type: EducationalObservationType;
  principle: string;
  evidence: Record<string, any>;
  summary: string;
  timestamp: number;
}

export interface XiraExperienceAdvice {
  type: FeedbackType;
  message: string;
  suggestedAction?: string;
  observation: string;
  confidence: number;
  pedagogicalInsight?: string;
}

/**
 * Deterministically analyzes events and validation history to synthesize an EducationalObservation.
 */
export function adaptTelemetryToObservation(
  events: ExperienceEvent[],
  validationHistory: CanonicalValidationResult[],
  conceptId: string,
  experienceId: string
): EducationalObservation {
  const latestValidation = validationHistory[validationHistory.length - 1];
  const validationCount = validationHistory.length;
  const hintEvents = events.filter((e) => e.type === 'hint_requested');
  const id = `obs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  // 1. Concept: Projectile Motion
  if (conceptId === 'projectile_motion' || experienceId.includes('projectile')) {
    if (latestValidation?.isComplete) {
      return {
        id,
        experienceId,
        conceptId,
        type: 'target_hit',
        principle: 'optimal_angle_velocity_harmony',
        summary: 'Target struck cleanly within distance tolerance.',
        evidence: latestValidation.evidence || {},
        timestamp: Date.now(),
      };
    }

    const err = latestValidation?.evidence?.targetError ?? 0;
    if (validationCount >= 2 && Math.abs(err) > 5) {
      return {
        id,
        experienceId,
        conceptId,
        type: 'target_not_reached',
        principle: 'trajectory_range_divergence',
        summary: 'Repeated launch attempts diverged from the 25m target.',
        evidence: { attempts: validationCount, targetError: err },
        timestamp: Date.now(),
      };
    }

    return {
      id,
      experienceId,
      conceptId,
      type: err < 0 ? 'trajectory_undershot' : 'trajectory_overshot',
      principle: 'horizontal_speed_vs_hang_time',
      summary: err < 0 ? 'Projectile landed short of target.' : 'Projectile overshot target.',
      evidence: { targetError: err },
      timestamp: Date.now(),
    };
  }

  // 2. Concept: Spatial Reasoning (Object Manipulation)
  if (conceptId === 'spatial_reasoning' || experienceId.includes('spatial')) {
    if (latestValidation?.isComplete) {
      return {
        id,
        experienceId,
        conceptId,
        type: 'spatial_aligned',
        principle: 'orthogonal_orientation_lock',
        summary: 'Prism aligned with target reticle within 15° tolerance.',
        evidence: latestValidation.evidence || {},
        timestamp: Date.now(),
      };
    }

    const rotationEvents = events.filter((e) => e.type === 'rotation_changed' || e.type === 'interaction_changed');
    if (rotationEvents.length > 5) {
      return {
        id,
        experienceId,
        conceptId,
        type: 'repeated_axis_adjustment',
        principle: 'multi_axis_decomposition',
        summary: 'Multiple iterative rotational adjustments observed across axes.',
        evidence: { rotationEventCount: rotationEvents.length },
        timestamp: Date.now(),
      };
    }

    return {
      id,
      experienceId,
      conceptId,
      type: 'spatial_fine_tuning',
      principle: 'angular_proximity_convergence',
      summary: 'Adjusting prism towards reticle alignment cone.',
      evidence: latestValidation?.evidence || {},
      timestamp: Date.now(),
    };
  }

  // 3. Concept: Molecular Bonding (Molecule Builder)
  if (conceptId === 'molecular_bonding' || experienceId.includes('molecule')) {
    if (latestValidation?.isComplete) {
      return {
        id,
        experienceId,
        conceptId,
        type: 'molecule_synthesized',
        principle: 'covalent_octet_satisfaction',
        summary: 'Valid H₂O molecular structure synthesized with stable covalent bonds.',
        evidence: latestValidation.evidence || {},
        timestamp: Date.now(),
      };
    }

    const bondRejections = events.filter((e) => e.type === 'bond_rejected');
    if (bondRejections.length > 0) {
      const lastRejection = bondRejections[bondRejections.length - 1];
      const isHH = lastRejection.payload?.reason?.includes('H-H') || lastRejection.payload?.principle === 'bond_invalid_hh';
      return {
        id,
        experienceId,
        conceptId,
        type: isHH ? 'bonding_rule_misunderstanding' : 'valence_capacity_reached',
        principle: isHH ? 'hydrogen_single_valence' : 'octet_valence_limit',
        summary: isHH
          ? 'Attempted covalent bond between two hydrogen atoms instead of oxygen.'
          : 'Attempted to exceed maximum valence bonding capacity.',
        evidence: lastRejection.payload || {},
        timestamp: Date.now(),
      };
    }
  }

  // 4. Concept: Human Heart Anatomy (Heart Anatomy Explorer)
  if (conceptId === 'human_heart_anatomy' || experienceId.includes('heart')) {
    if (latestValidation?.isComplete) {
      return {
        id,
        experienceId,
        conceptId,
        type: 'correct_flow_sequence',
        principle: 'double_circulation_mechanics',
        summary: 'Cardiovascular chambers, valves, and systemic/pulmonary circulation mastered.',
        evidence: latestValidation.evidence || {},
        timestamp: Date.now(),
      };
    }

    const flowErrors = events.filter((e) => e.type === 'flow_error');
    if (flowErrors.length > 0) {
      const lastError = flowErrors[flowErrors.length - 1];
      return {
        id,
        experienceId,
        conceptId,
        type: 'flow_direction_error',
        principle: 'unidirectional_valvular_flow',
        summary: 'Traced blood flow in non-physiological retrograde direction.',
        evidence: lastError.payload || {},
        timestamp: Date.now(),
      };
    }

    const challengeIncorrect = events.filter((e) => e.type === 'challenge_incorrect');
    if (challengeIncorrect.length > 0) {
      const lastIncorrect = challengeIncorrect[challengeIncorrect.length - 1];
      const selected = lastIncorrect.payload?.selectedOptionId;
      const target = lastIncorrect.payload?.targetStructureId;
      const isValveMistake =
        (selected === 'mitral_valve' && target === 'tricuspid_valve') ||
        (selected === 'tricuspid_valve' && target === 'mitral_valve');

      return {
        id,
        experienceId,
        conceptId,
        type: isValveMistake ? 'repeated_valve_confusion' : 'structure_missed',
        principle: isValveMistake ? 'atrioventricular_valve_sidedness' : 'cardiac_chamber_morphology',
        summary: isValveMistake
          ? 'Confused Tricuspid (right) and Mitral (left) atrioventricular valves.'
          : 'Contextual anatomical structure misidentified.',
        evidence: lastIncorrect.payload || {},
        timestamp: Date.now(),
      };
    }

    const structureSelections = events.filter((e) => e.type === 'structure_selected' || e.type === 'structure_inspected');
    if (structureSelections.length >= 4) {
      return {
        id,
        experienceId,
        conceptId,
        type: 'heart_explored',
        principle: 'active_anatomical_inspection',
        summary: `Inspected ${structureSelections.length} cardiac structures across left and right sides.`,
        evidence: { inspectionCount: structureSelections.length },
        timestamp: Date.now(),
      };
    }
  }

  // Code Debugging Experience (Experience #5)
  const codePassEvents = events.filter((e) => e.type === 'code_validation_passed');
  const codeFailEvents = events.filter((e) => e.type === 'code_validation_failed');
  const codeRuns = events.filter((e) => e.type === 'code_run');
  const codeEdits = events.filter((e) => e.type === 'code_edited');

  if (codePassEvents.length > 0) {
    const isIndependent = hintEvents.length === 0 && codeRuns.length <= 3;
    return {
      id,
      experienceId,
      conceptId,
      type: isIndependent ? 'independent_completion' : 'successful_debugging',
      principle: 'accumulation_vs_reassignment',
      summary: isIndependent
        ? 'Learner diagnosed and corrected the loop accumulation bug independently.'
        : 'Learner successfully debugged and verified the accumulation sum.',
      evidence: { runs: codeRuns.length, edits: codeEdits.length, hintsUsed: hintEvents.length },
      timestamp: Date.now(),
    };
  }

  if (codeFailEvents.length > 0) {
    const lastFail = codeFailEvents[codeFailEvents.length - 1];
    const isReassignment = lastFail.payload?.detectedBug === 'reassignment' || lastFail.payload?.output === '8';

    if (isReassignment && codeFailEvents.length >= 2) {
      return {
        id,
        experienceId,
        conceptId,
        type: 'repeated_assignment_pattern',
        principle: 'variable_reassignment_in_loop',
        summary: 'Learner repeatedly kept the simple assignment operator inside the loop.',
        evidence: lastFail.payload || {},
        timestamp: Date.now(),
      };
    }

    return {
      id,
      experienceId,
      conceptId,
      type: 'output_mismatch',
      principle: 'loop_accumulator_state',
      summary: `Code executed, but output (${lastFail.payload?.output ?? 'mismatch'}) diverged from expected (20).`,
      evidence: lastFail.payload || {},
      timestamp: Date.now(),
    };
  }

  if (codeEdits.length > 0 && codeRuns.length > 0) {
    return {
      id,
      experienceId,
      conceptId,
      type: 'code_run',
      principle: 'read_run_inspect_cycle',
      summary: 'Learner edited and ran the program in the debug cycle.',
      evidence: { runs: codeRuns.length, edits: codeEdits.length },
      timestamp: Date.now(),
    };
  }

  // Generic fallback
  if (hintEvents.length >= 2) {
    return {
      id,
      experienceId,
      conceptId,
      type: 'hint_dependent',
      principle: 'scaffolded_learning',
      summary: 'Learner relied on multi-step progressive scaffolding hints.',
      evidence: { hintsUsed: hintEvents.length },
      timestamp: Date.now(),
    };
  }

  return {
    id,
    experienceId,
    conceptId,
    type: 'exploring_freely',
    principle: 'active_parameter_exploration',
    summary: 'Learner is actively exploring the parameter and interaction space.',
    evidence: { interactionCount: events.length },
    timestamp: Date.now(),
  };
}

/**
 * Converts an EducationalObservation into standard Xira advice.
 */
export function adaptObservationToAdvice(observation: EducationalObservation): XiraExperienceAdvice {
  switch (observation.type) {
    case 'successful_debugging':
    case 'independent_completion':
      return {
        type: 'SUCCESS',
        observation: observation.summary,
        message: 'You found the bug and verified the result. You correctly distinguished replacing a value from accumulating values.',
        suggestedAction: 'Advance to the next challenge or reflect on accumulator patterns.',
        confidence: 0.98,
        pedagogicalInsight: `Principle demonstrated: ${observation.principle}`,
      };

    case 'output_mismatch':
      return {
        type: 'CORRECTION',
        observation: observation.summary,
        message: 'The code ran, but the result is different from the target. Trace what happens to total during each loop iteration.',
        suggestedAction: 'Check the loop body: is total adding each number or replacing the previous value?',
        confidence: 0.9,
        pedagogicalInsight: 'Notice how simple assignment (`=`) discards the prior iteration state.',
      };

    case 'repeated_assignment_pattern':
      return {
        type: 'CORRECTION',
        observation: observation.summary,
        message: 'Notice that each loop iteration gives total a new value. What happens to the value from the previous iteration?',
        suggestedAction: 'Use an accumulation operator (`+=`) to keep adding to the existing total.',
        confidence: 0.92,
        pedagogicalInsight: 'Augmented assignment preserves the accumulated sum across iterations.',
      };

    case 'meaningful_code_correction':
      return {
        type: 'ENCOURAGEMENT',
        observation: observation.summary,
        message: 'You changed the way total is updated. Run it again and check whether the output now reflects all four numbers.',
        suggestedAction: 'Click "Run Code" to verify your new output.',
        confidence: 0.88,
        pedagogicalInsight: 'Iterative hypothesis testing validates algorithmic logic.',
      };

    case 'code_run':
      return {
        type: 'ENCOURAGEMENT',
        observation: observation.summary,
        message: 'Code executed. Compare the output terminal with the expected output.',
        suggestedAction: 'If the output differs from 20, inspect the loop body assignment.',
        confidence: 0.85,
        pedagogicalInsight: 'Active inspection of runtime output drives discovery.',
      };

    case 'target_hit':
    case 'spatial_aligned':
    case 'molecule_synthesized':
    case 'correct_flow_sequence':
      return {
        type: 'SUCCESS',
        observation: observation.summary,
        message: 'Goal achieved! You mastered the underlying structural principle.',
        suggestedAction: 'Advance to the next concept or explore deeper challenge variations.',
        confidence: 0.95,
        pedagogicalInsight: `Principle demonstrated: ${observation.principle}`,
      };

    case 'structure_identified':
      return {
        type: 'SUCCESS',
        observation: observation.summary,
        message: 'Accurately identified! That anatomical structure plays a vital role in cardiac mechanics.',
        suggestedAction: 'Observe connected chambers or vessels to follow blood flow.',
        confidence: 0.9,
        pedagogicalInsight: `Principle demonstrated: ${observation.principle}`,
      };

    case 'repeated_valve_confusion':
      return {
        type: 'CORRECTION',
        observation: observation.summary,
        message: 'Try tracing the blood flow from atria to ventricles. The Tricuspid valve is on the Right (TRI = Right), while the Mitral valve is on the Left.',
        suggestedAction: 'Remember: Tricuspid sits on the venous right side, Mitral on the high-pressure left side.',
        confidence: 0.9,
        pedagogicalInsight: 'Atrioventricular valve sidedness correlates with dual pulmonary/systemic circuits.',
      };

    case 'flow_direction_error':
      return {
        type: 'CORRECTION',
        observation: observation.summary,
        message: 'Blood flow in the heart is strictly unidirectional: from atria through atrioventricular valves to ventricles, then out semilunar valves.',
        suggestedAction: 'Trace from vena cava -> right atrium -> tricuspid -> right ventricle -> pulmonary circulation.',
        confidence: 0.9,
        pedagogicalInsight: 'Cardiac valves ensure forward movement and prevent systolic regurgitation.',
      };

    case 'structure_missed':
      return {
        type: 'CORRECTION',
        observation: observation.summary,
        message: 'Notice the anatomical features: left ventricle has the thickest muscle wall for systemic pressure, while right ventricle pumps to nearby lungs.',
        suggestedAction: 'Rotate the heart in 3D to compare wall thickness and vessel connections.',
        confidence: 0.85,
        pedagogicalInsight: 'Structure correlates directly with physiological workload.',
      };

    case 'heart_explored':
      return {
        type: 'ENCOURAGEMENT',
        observation: observation.summary,
        message: 'Great exploration! You have inspected multiple chambers and vessels.',
        suggestedAction: 'Engage the Blood Flow pathway to see how they work together.',
        confidence: 0.85,
        pedagogicalInsight: 'Active 3D spatial inspection reinforces structural spatial memory.',
      };

    case 'target_not_reached':
      return {
        type: 'CORRECTION',
        observation: observation.summary,
        message: 'Notice how your landing distance responds to launch angle. Try comparing 30° vs 45° vs 60°.',
        suggestedAction: 'Isolate launch angle while keeping speed steady.',
        confidence: 0.85,
        pedagogicalInsight: 'At fixed velocity, range peaks symmetrically around 45° on level ground.',
      };

    case 'trajectory_undershot':
      return {
        type: 'CORRECTION',
        observation: observation.summary,
        message: 'The projectile landed short. Increase angle or velocity for greater distance.',
        suggestedAction: 'Increase launch angle towards 45° to gain hang time.',
        confidence: 0.85,
        pedagogicalInsight: 'Shallow angles produce high horizontal velocity but insufficient airtime.',
      };

    case 'trajectory_overshot':
      return {
        type: 'CORRECTION',
        observation: observation.summary,
        message: 'The projectile flew past the target. Try reducing velocity or steepening the angle.',
        suggestedAction: 'Step angle up to 60°+ or decrease initial velocity.',
        confidence: 0.85,
        pedagogicalInsight: 'Steeper angles trade horizontal reach for vertical hang time.',
      };

    case 'repeated_axis_adjustment':
      return {
        type: 'HINT',
        observation: observation.summary,
        message: 'Try isolating one axis at a time: adjust yaw first to face front, then pitch to level.',
        suggestedAction: 'Use the precision axis controls to dial in one rotation angle at a time.',
        confidence: 0.9,
        pedagogicalInsight: 'Orthogonal decomposition reduces 3D search space from cubic to linear.',
      };

    case 'bonding_rule_misunderstanding':
      return {
        type: 'CORRECTION',
        observation: observation.summary,
        message: 'Hydrogen has only 1 valence electron and can form only one bond. In H₂O, both hydrogens bond to oxygen.',
        suggestedAction: 'Connect each hydrogen atom directly to the central oxygen atom.',
        confidence: 0.95,
        pedagogicalInsight: 'Hydrogen cannot form bridge bonds; oxygen acts as the central electron acceptor.',
      };

    case 'valence_capacity_reached':
      return {
        type: 'CORRECTION',
        observation: observation.summary,
        message: 'This atom has already filled its available valence slots.',
        suggestedAction: 'Select an atom with open valence capacity or remove an existing bond.',
        confidence: 0.9,
        pedagogicalInsight: 'Valence represents the maximum covalent electron pairs an atom can share.',
      };

    case 'hint_dependent':
      return {
        type: 'ENCOURAGEMENT',
        observation: observation.summary,
        message: 'Good use of hints. Now try executing the final step independently.',
        suggestedAction: 'Test your solution with confidence.',
        confidence: 0.8,
        pedagogicalInsight: 'Gradual scaffolding removal builds self-efficacy.',
      };

    default:
      return {
        type: 'ENCOURAGEMENT',
        observation: observation.summary,
        message: 'Active exploration is key. Observe how each interaction alters the system.',
        suggestedAction: 'Make an adjustment and validate to test your hypothesis.',
        confidence: 0.75,
        pedagogicalInsight: 'Experiential feedback drives conceptual intuition.',
      };
  }
}
