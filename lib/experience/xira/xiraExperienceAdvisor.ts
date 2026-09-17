/**
 * Xira Experience Advisor
 *
 * The intelligence companion for learning experiences.
 * Translates structured interaction telemetry and trial patterns into
 * actionable, non-judgmental pedagogical guidance.
 *
 * Core Principle:
 * Never say "Wrong answer."
 * Instead: "Notice how increasing the angle from 20° to 45° boosted your range. What happens if you go steeper to 60°?"
 */

import {
  XiraExperienceObservation,
  XiraExperienceFeedback,
  TrialRecord,
} from '../types';

export class XiraExperienceAdvisor {
  /**
   * Generates pedagogical feedback for the learner based on their current trial observation.
   */
  generateFeedback(
    observation: XiraExperienceObservation,
    latestTrial?: TrialRecord
  ): XiraExperienceFeedback {
    const { trials, predictionAccuracy, hintsRequested } = observation;

    if (!latestTrial && trials.length === 0) {
      return {
        observation: 'Ready to test your launch hypothesis.',
        pedagogicalInsight: 'Projectile motion trades off between horizontal speed and time aloft.',
        suggestedNextMove: 'Set an initial launch angle and fire to observe where the projectile lands.',
        tone: 'guiding',
        isOptimal: false,
      };
    }

    const currentTrial = latestTrial || trials[trials.length - 1];
    const angleDeg = currentTrial.angleDeg ?? 25;
    const velocity = currentTrial.velocity ?? 18;
    const targetError = currentTrial.targetError ?? 0;
    const isHit = currentTrial.isHit;
    const isPredictionCorrect = currentTrial.isPredictionCorrect;

    // 1. Success State (Target Hit!)
    if (isHit) {
      const is45Optimal = Math.abs(angleDeg - 45) <= 5;
      const insight = is45Optimal
        ? 'Spot on! At 45°, you achieved optimal horizontal and vertical balance for maximum range.'
        : `Target struck cleanly! With a velocity of ${velocity} m/s at ${angleDeg}°, your trajectory met the exact landing arc.`;

      return {
        observation: `Bullseye! The projectile landed within ${Math.abs(targetError).toFixed(1)}m of the target.`,
        pedagogicalInsight: insight,
        suggestedNextMove: 'Try varying the velocity or angle to see if an alternative trajectory can also reach the target.',
        tone: 'celebrating',
        isOptimal: true,
      };
    }

    // 2. Trajectory Pattern Analysis across multiple trials
    if (trials.length >= 2) {
      const prevTrial = trials[trials.length - 2];
      const prevAngle = prevTrial.angleDeg ?? 25;
      const prevError = prevTrial.targetError ?? 0;
      const angleChange = angleDeg - prevAngle;
      const errorChange = Math.abs(targetError) - Math.abs(prevError);

      // Case: Student increased angle from shallow (<40) towards 45 and got closer
      if (prevAngle < 40 && angleDeg > prevAngle && angleDeg <= 50) {
        const landingGain = (currentTrial.landingDistance ?? 0) - (prevTrial.landingDistance ?? 0);
        return {
          observation: `Steepening the angle from ${prevAngle}° to ${angleDeg}° increased your range by ${landingGain.toFixed(1)}m.`,
          pedagogicalInsight: 'A steeper angle gives the projectile more time in the air, allowing it to travel farther horizontally.',
          suggestedNextMove: targetError < 0
            ? 'You are getting closer! If you need a few more meters, try slightly increasing velocity.'
            : 'You slightly overshot. Try fine-tuning your angle back towards 45° or lowering velocity.',
          tone: 'guiding',
          isOptimal: false,
        };
      }

      // Case: Student exceeded 45 degrees and range decreased
      if (prevAngle <= 50 && angleDeg > 55) {
        return {
          observation: `At ${angleDeg}°, the projectile stayed aloft longer (${(currentTrial.flightTime ?? 0).toFixed(1)}s) but landed shorter (${(currentTrial.landingDistance ?? 0).toFixed(1)}m).`,
          pedagogicalInsight: 'Above 45°, the projectile shoots higher into the sky, but sacrifices the horizontal velocity needed to travel forward.',
          suggestedNextMove: 'Notice how angles symmetrically around 45° (like 30° and 60°) achieve similar distances. Try 45° for peak reach!',
          tone: 'guiding',
          isOptimal: false,
        };
      }
    }

    // 3. Single Trial Analysis (Undershooting vs Overshooting)
    if (targetError < -1.5) {
      // Landed short
      const isShallow = angleDeg < 35;
      const isSteep = angleDeg > 55;

      let insight = 'The projectile ran out of flight time before reaching the target distance.';
      let suggestion = 'Try increasing your velocity or adjusting your angle closer to 45°.';

      if (isShallow) {
        insight = `At ${angleDeg}°, horizontal speed is high, but the ball hits the ground too quickly (only ${(currentTrial.flightTime ?? 0).toFixed(1)}s in air).`;
        suggestion = 'Steepen your launch angle toward 45° to keep the projectile in the air longer.';
      } else if (isSteep) {
        insight = `At ${angleDeg}°, most of your energy goes upward. Peak height was ${(currentTrial.peakHeight ?? 0).toFixed(1)}m, but horizontal velocity was too small.`;
        suggestion = 'Lower your angle closer to 45° to redirect more energy into horizontal forward motion.';
      }

      return {
        observation: `Landed ${(Math.abs(targetError)).toFixed(1)}m short of the target.`,
        pedagogicalInsight: insight,
        suggestedNextMove: suggestion,
        tone: 'guiding',
        isOptimal: false,
      };
    }

    if (targetError > 1.5) {
      // Landed long / Overshot
      return {
        observation: `Overshot the target by ${targetError.toFixed(1)}m.`,
        pedagogicalInsight: `The projectile had more momentum than needed for ${currentTrial.targetDistance ?? 25}m.`,
        suggestedNextMove: 'Try lowering the launch velocity or choosing a steeper angle (e.g. 55°-60°) to drop it on target.',
        tone: 'guiding',
        isOptimal: false,
      };
    }

    // Near miss fallback
    return {
      observation: `Very close! You landed within ${Math.abs(targetError).toFixed(1)}m.`,
      pedagogicalInsight: 'Your current trajectory is nearly dialed in.',
      suggestedNextMove: 'A minor 2° angle adjustment or 1 m/s velocity tweak will hit dead center.',
      tone: 'encouraging',
      isOptimal: false,
    };
  }

  /**
   * Generates pedagogical feedback for 3D Spatial Manipulation experiences.
   * Guides the learner through coarse rotation, axis isolation, fine-tuning, and alignment lock.
   */
  generateSpatialFeedback(
    observation: XiraExperienceObservation,
    currentAngularErrorDeg: number,
    targetToleranceDeg: number = 15.0
  ): XiraExperienceFeedback {
    const isAligned = currentAngularErrorDeg <= targetToleranceDeg;

    // 1. Success Lock-in
    if (isAligned) {
      return {
        observation: `Harmonic lock engaged! Angular divergence is only ${currentAngularErrorDeg.toFixed(1)}° (within ${targetToleranceDeg}°).`,
        pedagogicalInsight:
          'By aligning the artifact’s normal vector with the reticle line of sight, you minimized 3D angular error.',
        suggestedNextMove:
          'Hold orientation or confirm resonance to record this spatial alignment mastery.',
        tone: 'celebrating',
        isOptimal: true,
      };
    }

    // 2. Fine-tuning proximity (< 30°)
    if (currentAngularErrorDeg <= 30.0) {
      const hasOvershot = Boolean(observation.principlesIdentified?.includes('spatial_overshot'));
      return {
        observation: `Close to harmonic lock (${currentAngularErrorDeg.toFixed(1)}° error). The Emerald Face is visible in the reticle cone.`,
        pedagogicalInsight: hasOvershot
          ? 'Fast rotation caused a slight overshoot across the reticle center. Gentle micro-rotations prevent oscillation.'
          : 'Fine-tuning requires isolating one rotational axis (Pitch or Yaw) rather than diagonal sweeping.',
        suggestedNextMove:
          'Slow down your rotation and make small micro-adjustments along a single axis to close the final degrees.',
        tone: 'guiding',
        isOptimal: false,
      };
    }

    // 3. Moderate deviation (30° - 75°)
    if (currentAngularErrorDeg <= 75.0) {
      return {
        observation: `Prism orientation is ${currentAngularErrorDeg.toFixed(1)}° off-axis.`,
        pedagogicalInsight:
          'When rotating in 3D, first sweep Yaw (horizontal) to orient the face, then adjust Pitch (vertical) for height alignment.',
        suggestedNextMove:
          'Try rotating horizontally (Yaw) until the resonant glyph glows gold, then tip it vertically (Pitch).',
        tone: 'guiding',
        isOptimal: false,
      };
    }

    // 4. Coarse search (> 75°)
    return {
      observation: `Artifact is in coarse orientation mode (${currentAngularErrorDeg.toFixed(1)}° divergence). Emerald face is turned away.`,
      pedagogicalInsight:
        'In 3D space, any orientation can be reached by decomposing into yaw and pitch rotations.',
      suggestedNextMove:
        'Click and drag horizontally across the chamber to sweep the artifact until you spot the glowing emerald face.',
      tone: 'encouraging',
      isOptimal: false,
    };
  }

  /**
   * Generates pedagogical feedback for Molecular Bonding experiences.
   * Explains valence concepts, addresses bonding misconceptions (e.g. H-H),
   * and celebrates successful molecular completion without being overly pedantic.
   */
  generateMoleculeFeedback(
    observation: XiraExperienceObservation,
    bondsCount: number,
    isComplete: boolean,
    lastRejectionReason?: string,
    lastPrinciple?: string
  ): XiraExperienceFeedback {
    // 1. Success completion
    if (isComplete) {
      return {
        observation: 'Water (H₂O) molecular structure complete! Both O–H covalent bonds are formed.',
        pedagogicalInsight:
          'Oxygen has 6 valence electrons and shares electrons with two hydrogen atoms to complete its octet.',
        suggestedNextMove:
          'Confirm molecular structure to record your mastery in chemical bonding.',
        tone: 'celebrating',
        isOptimal: true,
      };
    }

    // 2. Specific Misconception: H-H bond attempted
    if (
      lastPrinciple === 'bond_invalid_hh' ||
      lastRejectionReason?.includes('Hydrogen atoms do not bond to each other')
    ) {
      return {
        observation: 'Hydrogen-to-Hydrogen bond attempted.',
        pedagogicalInsight:
          'Each hydrogen only has one valence electron and can only form one bond. In water, both hydrogens must connect directly to oxygen.',
        suggestedNextMove:
          'Try connecting the hydrogen atom to the central oxygen atom instead.',
        tone: 'guiding',
        isOptimal: false,
      };
    }

    // 3. Valence capacity exceeded
    if (lastPrinciple === 'valence_exceeded' || lastRejectionReason?.includes('valence capacity')) {
      return {
        observation: 'Valence capacity reached on selected atom.',
        pedagogicalInsight:
          'Atoms have a strict limit on covalent bonds based on available valence shell vacancies.',
        suggestedNextMove:
          'Disconnect an existing bond if you wish to attach a different atom.',
        tone: 'guiding',
        isOptimal: false,
      };
    }

    // 4. One bond formed (partial progress)
    if (bondsCount === 1) {
      return {
        observation: '1 of 2 covalent bonds formed (O–H).',
        pedagogicalInsight:
          'Oxygen has satisfied 1 valence vacancy, but still needs 1 more electron partner to complete its outer shell.',
        suggestedNextMove:
          'Connect the second hydrogen atom to oxygen to complete the H₂O molecule.',
        tone: 'guiding',
        isOptimal: false,
      };
    }

    // 5. Initial / Unbonded state
    return {
      observation: 'Ready to build water (H₂O). Atoms are placed in the reaction chamber.',
      pedagogicalInsight:
        'Oxygen needs 2 covalent bonds, while each hydrogen needs 1 covalent bond.',
      suggestedNextMove:
        'Select the oxygen atom, then select a hydrogen atom to form the first covalent bond.',
      tone: 'encouraging',
      isOptimal: false,
    };
  }

  /**
   * Generates pedagogical feedback for 3D Heart Anatomy experiences.
   * Guides the learner through chamber inspection, valve mechanics, blood flow tracing, and structural challenges.
   */
  generateHeartFeedback(
    observation: XiraExperienceObservation,
    state: {
      exploredCount: number;
      isFlowComplete: boolean;
      flowErrors: number;
      challengesCorrect: number;
      lastMistakePrinciple?: string;
    }
  ): XiraExperienceFeedback {
    if (state.lastMistakePrinciple === 'repeated_valve_confusion') {
      return {
        observation: 'Confused atrioventricular valves.',
        pedagogicalInsight: 'Try tracing blood flow from atria into ventricles. The Tricuspid valve is on the Right side, while the Mitral valve is on the Left.',
        suggestedNextMove: 'Locate the right atrium and observe the 3-leaflet tricuspid valve leading to the right ventricle.',
        tone: 'guiding',
        isOptimal: false,
      };
    }

    if (state.isFlowComplete) {
      return {
        observation: 'Full 12-step cardiovascular blood flow circuit traced successfully!',
        pedagogicalInsight: 'Double circulation separates low-pressure pulmonary gas exchange from high-pressure systemic oxygen delivery.',
        suggestedNextMove: 'Test your knowledge on the contextual challenges or inspect individual valve mechanics.',
        tone: 'celebrating',
        isOptimal: true,
      };
    }

    if (state.challengesCorrect >= 2) {
      return {
        observation: `Solved ${state.challengesCorrect} anatomical challenges correctly!`,
        pedagogicalInsight: 'You clearly understand the functional distinction between systemic ventricles and atrioventricular valves.',
        suggestedNextMove: 'Explore remaining vessels or confirm your mastery debrief.',
        tone: 'celebrating',
        isOptimal: true,
      };
    }

    if (state.exploredCount >= 4) {
      return {
        observation: `You have examined ${state.exploredCount} anatomical structures.`,
        pedagogicalInsight: 'Notice how chamber wall thickness mirrors workload: the left ventricle is 3x thicker than the right.',
        suggestedNextMove: 'Engage Blood Flow mode to see how deoxygenated and oxygenated blood travel through these structures.',
        tone: 'encouraging',
        isOptimal: false,
      };
    }

    return {
      observation: 'Welcome to the Human Heart Anatomy Explorer.',
      pedagogicalInsight: 'The heart maintains continuous dual circulation through 4 chambers and 4 unidirectional valves.',
      suggestedNextMove: 'Rotate the 3D heart and select any chamber or valve to begin your inspection.',
      tone: 'encouraging',
      isOptimal: false,
    };
  }

  /**
   * Generates pedagogical feedback for Programming Code Lab experiences.
   * Guides the learner through code execution, output analysis, bug identification, and iterative correction.
   */
  generateCodeFeedback(
    observation: XiraExperienceObservation,
    state: {
      hasRun: boolean;
      output?: string;
      expectedOutput: string;
      isSuccess: boolean;
      consecutiveMismatches: number;
      detectedBug?: string;
      correctionPattern?: string;
      hintsUsed: number;
    }
  ): XiraExperienceFeedback {
    // 1. Success state
    if (state.isSuccess) {
      return {
        observation: 'You found the bug and verified the result.',
        pedagogicalInsight: 'You correctly distinguished replacing a value from accumulating values across loop iterations.',
        suggestedNextMove: 'Reflect on how augmented assignment (`+=`) applies to list accumulators, counters, and filters.',
        tone: 'celebrating',
        isOptimal: true,
      };
    }

    // 2. Meaningful correction made but not yet run or verified
    if (state.correctionPattern === 'accumulation_operator' && !state.isSuccess) {
      return {
        observation: 'You changed the way total is updated.',
        pedagogicalInsight: 'Run it again and check whether the output now reflects all four numbers.',
        suggestedNextMove: 'Click "Run Code" to verify whether the accumulated sum equals 20.',
        tone: 'encouraging',
        isOptimal: false,
      };
    }

    // 3. Repeated assignment bug
    if (state.consecutiveMismatches >= 2 || state.detectedBug === 'reassignment') {
      return {
        observation: 'Notice that each loop iteration gives total a new value.',
        pedagogicalInsight: 'What happens to the value from the previous iteration when using simple assignment (`=`)?',
        suggestedNextMove: 'Change the assignment so each number is added onto total rather than replacing it.',
        tone: 'guiding',
        isOptimal: false,
      };
    }

    // 4. Initial output mismatch after first run
    if (state.hasRun && state.output !== state.expectedOutput) {
      return {
        observation: 'The code ran, but the result is different from the target.',
        pedagogicalInsight: 'Trace what happens to total during each loop iteration. The final output is 8 instead of 20.',
        suggestedNextMove: 'Inspect line 6 inside the for-loop: does it accumulate numbers or replace the previous value?',
        tone: 'guiding',
        isOptimal: false,
      };
    }

    // 5. Default starting state
    return {
      observation: 'Welcome to the Programming Code Lab.',
      pedagogicalInsight: 'Programmers learn best by reading code, running it to observe behavior, and testing corrections.',
      suggestedNextMove: 'Click "Run Code" to execute the current program and inspect its output.',
      tone: 'encouraging',
      isOptimal: false,
    };
  }

  /**
   * Generates supportive pedagogical guidance for the resolved Next Best Action.
   * Explains the deterministic intelligence decision to the learner without overriding it.
   */
  generateAdaptiveNextStepGuidance(
    action: string,
    signal: string,
    conceptName: string,
    reason?: string
  ): string {
    switch (action) {
      case 'CORRECT_MISCONCEPTION':
        return `Xira observed: You encountered a subtle misconception while working through ${conceptName}. Let's take a targeted remediation to clarify the difference before moving forward.`;
      case 'HARDER_CHALLENGE':
        return `Xira observed: Outstanding job on ${conceptName}! You demonstrated clean, independent problem-solving. Let's level up with an advanced challenge.`;
      case 'SPACED_REVIEW':
        return `Xira observed: Great progress! ${conceptName} is entering a retention decay window. A quick spaced refresher will lock it in long-term.`;
      case 'CONFIDENCE_REINFORCEMENT':
        return `Xira observed: You reached the right answer on ${conceptName}, but flagged uncertainty. Let's reinforce your intuition so you feel 100% confident.`;
      case 'PRACTICE_CONCEPT':
      case 'LEARN_CONCEPT':
      default:
        return reason || `Xira observed: Regular hands-on practice builds lasting intuition. Let's keep your momentum going in ${conceptName}.`;
    }
  }

  /**
   * Provides 100% deterministic pedagogical guidance for all 9 Universal Teaching stages.
   * Guarantees student always receives meaningful guidance even if AI services are completely offline.
   */
  generateUniversalTeachingStageGuidance(
    stage: 'INTRODUCE' | 'EXPLORE' | 'PREDICT' | 'EXPERIMENT' | 'OBSERVE' | 'EXPLAIN' | 'CHALLENGE' | 'ASSESS' | 'COMPLETE' | string,
    topicName: string,
    context?: {
      lastParameterChanged?: string;
      parameterValue?: number;
      isPredictionCorrect?: boolean;
      isChallengeCorrect?: boolean;
      sourceTitle?: string;
    }
  ): string {
    const basis = context?.sourceTitle ? ` (Learning basis: ${context.sourceTitle})` : '';

    switch (stage) {
      case 'INTRODUCE':
        return `Welcome to the interactive exploration of ${topicName}. Notice the key entities in the scene and how they establish the foundational system.${basis}`;

      case 'EXPLORE':
        return `Click and inspect the individual components of ${topicName}. Notice their roles and the connections linking inputs to outcomes.${basis}`;

      case 'PREDICT':
        return `Before modifying variables, form a hypothesis about how the governing constraints affect ${topicName}.${basis}`;

      case 'EXPERIMENT':
        if (context?.lastParameterChanged) {
          return `You just adjusted ${context.lastParameterChanged}${context.parameterValue !== undefined ? ` to ${context.parameterValue}` : ''} in ${topicName}. Watch the resulting change across the system.${basis}`;
        }
        return `Vary the interactive sliders to test boundary conditions and discover the governing relationships of ${topicName}.${basis}`;

      case 'OBSERVE':
        return `Observe the directional flow and transformation occurring in ${topicName}. Notice which variables amplify or suppress the reaction.${basis}`;

      case 'EXPLAIN':
        return `The core mechanism of ${topicName} links the physical inputs directly to the observed outcomes through dynamic equilibrium.${basis}`;

      case 'CHALLENGE':
        if (context?.isChallengeCorrect !== undefined) {
          return context.isChallengeCorrect
            ? `Spot on! Your analysis of ${topicName} matches the underlying physical and conceptual principles.${basis}`
            : `Review required: Consider how the primary inputs constrain the output of ${topicName}.${basis}`;
        }
        return `Apply what you discovered in the simulation to solve this conceptual verification challenge on ${topicName}.${basis}`;

      case 'ASSESS':
        return `Review your experimental trials and confirm your understanding of the principles governing ${topicName}.${basis}`;

      case 'COMPLETE':
      default:
        return `Excellent exploration of ${topicName}! You've demonstrated hands-on mastery of the core mechanism.${basis}`;
    }
  }
}

export const defaultXiraExperienceAdvisor = new XiraExperienceAdvisor();

