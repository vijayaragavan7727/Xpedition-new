/**
 * Xpedition Universal Teaching Engine v1 — Topic Experience Composer
 *
 * Composes a full pedagogical TeachingExperiencePlan from a UniversalLearningTopic.
 * Implements the authoritative decision hierarchy:
 * 1. Existing specialized experience
 * 2. Curated 3D Proof Experience
 * 3. Generic procedural 3D scene
 * 4. Interactive diagram / simulation fallback
 * 5. Structured visual lesson & practice challenge
 */

import {
  UniversalLearningTopic,
  TeachingExperiencePlan,
  TeachingStep,
  FallbackTeachingPlan,
  UniversalExperienceFamily,
} from './universalTopicTypes';
import { UniversalSceneBuilder } from './scene/sceneBuilder';
import { UniversalSceneDefinition } from './scene/sceneDefinition';
import { experienceRegistry } from './experienceRegistry';
import { VisualTeachingPlanBuilder } from './visualTeaching/visualTeachingPlanBuilder';

export class TopicExperienceComposer {
  /**
   * Composes a complete pedagogical TeachingExperiencePlan.
   */
  static composeTeachingPlan(
    topic: UniversalLearningTopic,
    learnerState?: any
  ): TeachingExperiencePlan {
    const planId = `plan_${topic.topicId}_${Date.now()}`;
    const primaryObjective = topic.learningObjectives[0] || `Master the principles of ${topic.rawUserTopic}`;

    // 1. Check if specialized experience exists in ExperienceRegistry
    const isSpecialized =
      Boolean(topic.recommendedExperienceType && experienceRegistry.hasExperience(topic.recommendedExperienceType as string)) ||
      Boolean(topic.conceptIds.some((id) => experienceRegistry.hasExperience(id)));

    if (isSpecialized) {
      return TopicExperienceComposer.composeSpecializedPlan(planId, topic, primaryObjective);
    }

    // 2. Check for Curated 3D Proof Scenes
    const normalized = topic.normalizedTopic;
    let sceneDef: UniversalSceneDefinition | undefined;
    let predictionChallenge: any;
    let challengeQuestion: string = `Apply ${topic.rawUserTopic} to solve the target challenge.`;
    let challengeOptions: any[] = [];

    if (normalized.includes('newton') || normalized.includes('force and motion') || normalized.includes('f = ma')) {
      sceneDef = UniversalSceneBuilder.buildNewtonsLawsScene();
      predictionChallenge = {
        prompt: 'If you double the cart’s mass from 5 kg to 10 kg while keeping the applied force at 20 N, what will happen to acceleration?',
        explanation: 'According to Newton’s 2nd Law (a = F / m), acceleration is inversely proportional to mass. Doubling mass cuts acceleration in half (from 4.0 m/s² down to 2.0 m/s²).',
        options: [
          { id: 'opt_double', label: 'Acceleration doubles to 8.0 m/s²', isCorrect: false },
          { id: 'opt_half', label: 'Acceleration is halved to 2.0 m/s²', isCorrect: true },
          { id: 'opt_same', label: 'Acceleration remains unchanged at 4.0 m/s²', isCorrect: false },
          { id: 'opt_zero', label: 'Acceleration drops immediately to 0', isCorrect: false },
        ],
      };
      challengeQuestion = 'What applied force is required to accelerate a 10 kg mass at 3.5 m/s² on a frictionless surface?';
      challengeOptions = [
        { id: 'c1', text: '10 N', isCorrect: false, explanation: 'Incorrect: F = m × a = 10 × 3.5 = 35 N.' },
        { id: 'c2', text: '35 N', isCorrect: true, explanation: 'Correct! By Newton’s 2nd Law, F = m × a = 10 kg × 3.5 m/s² = 35 N.' },
        { id: 'c3', text: '28.5 N', isCorrect: false, explanation: 'Incorrect calculation.' },
        { id: 'c4', text: '3.5 N', isCorrect: false, explanation: 'That is the acceleration, not the force.' },
      ];
    } else if (normalized.includes('photosynthesis') || normalized.includes('chloroplast')) {
      sceneDef = UniversalSceneBuilder.buildPhotosynthesisScene();
      predictionChallenge = {
        prompt: 'What happens to the rate of glucose synthesis if sunlight intensity drops to 0% at night?',
        explanation: 'Without photon energy, the light-dependent reactions cease, halting production of ATP and NADPH required by the Calvin cycle.',
        options: [
          { id: 'opt_no_light', label: 'Glucose production halts completely', isCorrect: true },
          { id: 'opt_faster', label: 'Glucose production accelerates using residual heat', isCorrect: false },
          { id: 'opt_co2_comp', label: 'Increased CO₂ intake compensates for lack of light', isCorrect: false },
        ],
      };
      challengeQuestion = 'Which molecule acts as the primary source of electrons and oxygen byproduct in photosynthesis?';
      challengeOptions = [
        { id: 'c1', text: 'Carbon Dioxide (CO₂)', isCorrect: false, explanation: 'CO₂ provides carbon and oxygen for glucose, but water is split for electrons.' },
        { id: 'c2', text: 'Water (H₂O)', isCorrect: true, explanation: 'Correct! Photolysis splits H₂O molecules into electrons, protons (H⁺), and oxygen gas (O₂).' },
        { id: 'c3', text: 'Glucose (C₆H₁₂O₆)', isCorrect: false, explanation: 'Glucose is the output product.' },
      ];
    } else if (normalized.includes('circuit') || normalized.includes('ohm')) {
      sceneDef = UniversalSceneBuilder.buildElectricCircuitsScene();
      predictionChallenge = {
        prompt: 'If you double the circuit resistance from 10 Ω to 20 Ω while maintaining a constant 12 V battery, what happens to the electric current?',
        explanation: 'By Ohm’s Law (I = V / R), current is inversely proportional to resistance. Doubling resistance cuts current in half (from 1.2 A to 0.6 A).',
        options: [
          { id: 'opt_half_curr', label: 'Current is halved to 0.6 A and bulb dims', isCorrect: true },
          { id: 'opt_double_curr', label: 'Current doubles to 2.4 A and bulb brightens', isCorrect: false },
          { id: 'opt_same_curr', label: 'Current remains constant at 1.2 A', isCorrect: false },
        ],
      };
      challengeQuestion = 'What voltage is required to push a current of 2.5 A through a 16 Ω resistor?';
      challengeOptions = [
        { id: 'c1', text: '6.4 V', isCorrect: false, explanation: 'Incorrect: V = I × R, not R / I.' },
        { id: 'c2', text: '40 V', isCorrect: true, explanation: 'Correct! V = I × R = 2.5 A × 16 Ω = 40 V.' },
        { id: 'c3', text: '18.5 V', isCorrect: false, explanation: 'Incorrect addition.' },
      ];
    } else if (normalized.includes('solar system') || normalized.includes('planet') || normalized.includes('orbit')) {
      sceneDef = UniversalSceneBuilder.buildSolarSystemScene();
      predictionChallenge = {
        prompt: 'Why does Mercury complete an orbit in only 88 Earth days while Mars requires 687 days?',
        explanation: 'Kepler’s 3rd Law states that the square of orbital period is proportional to the cube of semi-major axis (T² ∝ a³). Closer planets experience stronger solar gravity and travel shorter circumferences.',
        options: [
          { id: 'opt_kepler', label: 'Stronger gravity and shorter distance yield higher speed and shorter period', isCorrect: true },
          { id: 'opt_mass', label: 'Mercury has less mass, so it moves faster', isCorrect: false },
          { id: 'opt_sun_rot', label: 'The Sun’s rotation drags Mercury faster', isCorrect: false },
        ],
      };
      challengeQuestion = 'Which statement best describes planetary orbital velocity according to Kepler’s laws?';
      challengeOptions = [
        { id: 'c1', text: 'All planets travel at the exact same orbital speed regardless of distance.', isCorrect: false, explanation: 'Incorrect.' },
        { id: 'c2', text: 'Planets closer to the Sun travel significantly faster than outer planets.', isCorrect: true, explanation: 'Correct! Orbital velocity v ≈ √(GM/r) decreases with orbital radius.' },
        { id: 'c3', text: 'Outer planets orbit faster because they have greater mass.', isCorrect: false, explanation: 'Incorrect.' },
      ];
    } else if (normalized.includes('fraction') || normalized.includes('numerator')) {
      sceneDef = UniversalSceneBuilder.buildFractionsScene();
      predictionChallenge = {
        prompt: 'If you have the fraction 3/4 and multiply both the numerator and denominator by 2, what fraction do you produce?',
        explanation: 'Multiplying both numerator and denominator by the same non-zero number produces an equivalent fraction: 3/4 × 2/2 = 6/8.',
        options: [
          { id: 'opt_6_8', label: '6/8 (an equivalent fraction of equal value)', isCorrect: true },
          { id: 'opt_6_4', label: '6/4 (twice as large)', isCorrect: false },
          { id: 'opt_3_8', label: '3/8 (half as large)', isCorrect: false },
        ],
      };
      challengeQuestion = 'Which of the following fractions is equivalent to 2/3?';
      challengeOptions = [
        { id: 'c1', text: '4/6', isCorrect: true, explanation: 'Correct! 2/3 × 2/2 = 4/6.' },
        { id: 'c2', text: '3/4', isCorrect: false, explanation: 'Incorrect: 3/4 = 0.75, whereas 2/3 ≈ 0.67.' },
        { id: 'c3', text: '4/9', isCorrect: false, explanation: 'Incorrect.' },
      ];
    } else if (
      normalized.includes('electric motor') ||
      normalized.includes('dc motor') ||
      normalized.includes('motor') ||
      normalized.includes('armature') ||
      normalized.includes('commutator')
    ) {
      sceneDef = UniversalSceneBuilder.buildElectricMotorScene();
      predictionChallenge = {
        prompt: 'If you double the electric current flowing through the armature coil while keeping magnetic field strength constant, what happens to the output rotational torque?',
        explanation: 'The Lorentz force on a current-carrying wire is F = I·L·B. Because torque τ = 2·F·r is directly proportional to current, doubling current doubles the electromagnetic torque.',
        options: [
          { id: 'opt_double_torque', label: 'Rotational torque doubles and speed increases', isCorrect: true },
          { id: 'opt_half_torque', label: 'Rotational torque is cut in half due to back-EMF', isCorrect: false },
          { id: 'opt_stall', label: 'The motor stalls due to magnetic saturation', isCorrect: false },
        ],
      };
      challengeQuestion = 'What is the primary role of the split-ring commutator in a DC electric motor?';
      challengeOptions = [
        { id: 'c1', text: 'To increase the magnetic field strength of the permanent magnets.', isCorrect: false, explanation: 'Magnets provide the field; the commutator is on the rotor circuit.' },
        { id: 'c2', text: 'To reverse the direction of current in the coil every half-turn so rotation continues in one direction.', isCorrect: true, explanation: 'Correct! Without commutation, the torque would reverse every 180° and the coil would oscillate and stall vertically.' },
        { id: 'c3', text: 'To convert alternating current into direct current for the battery.', isCorrect: false, explanation: 'A battery already supplies direct current.' },
      ];
    } else {
      // 3. Fallback: Procedural Universal 3D Scene grounded in KnowledgeBundle
      sceneDef = UniversalSceneBuilder.buildUniversalSemanticScene(
        topic.rawUserTopic,
        topic.keyPrinciples,
        topic.subject,
        topic.knowledgeBundle
      );
      predictionChallenge = {
        prompt: `How does modifying the core variable affect the observable outcome in ${topic.rawUserTopic}?`,
        explanation: `In ${topic.subject}, systems respond dynamically to changes in governing parameters.`,
        options: [
          { id: 'opt_prop', label: 'It creates a proportional, observable change in system behavior', isCorrect: true },
          { id: 'opt_none', label: 'It has zero effect on the system', isCorrect: false },
          { id: 'opt_rand', label: 'It causes unpredictable, chaotic oscillations', isCorrect: false },
        ],
      };
      challengeQuestion = `Which principle is fundamental to understanding ${topic.rawUserTopic}?`;
      challengeOptions = [
        { id: 'c1', text: topic.keyPrinciples[0] || 'System equilibrium', isCorrect: true, explanation: 'Correct! This represents the central foundation of the topic.' },
        { id: 'c2', text: 'Arbitrary randomness', isCorrect: false, explanation: 'Scientific principles follow deterministic rules.' },
        { id: 'c3', text: 'Constant static state', isCorrect: false, explanation: 'Most natural systems are dynamic.' },
      ];
    }

    // Compose 9-stage progressive pedagogical teaching steps
    const teachingSteps: TeachingStep[] = [
      {
        stepId: 'step_intro',
        type: 'INTRODUCE',
        title: `Welcome to ${topic.rawUserTopic}`,
        instruction: `Explore the interactive model. Notice how the components represent the core principles of ${topic.subject}.`,
        educationalPrinciple: topic.keyPrinciples[0] || 'Foundational Structure',
      },
      {
        stepId: 'step_explore',
        type: 'EXPLORE',
        title: 'Inspect Key Components',
        instruction: 'Rotate and zoom the 3D scene. Click on highlighted components to reveal their scientific function.',
        educationalPrinciple: 'Spatial & Structural Literacy',
        highlightObjectIds: sceneDef.objects.filter((o) => o.selectable).map((o) => o.id),
      },
      {
        stepId: 'step_predict',
        type: 'PREDICT',
        title: 'Make a Scientific Prediction',
        instruction: 'Before adjusting the experimental variables, formulate a hypothesis about what will happen.',
        educationalPrinciple: 'Hypothesis Formation & Causality',
      },
      {
        stepId: 'step_experiment',
        type: 'EXPERIMENT',
        title: 'Test Your Hypothesis',
        instruction: 'Manipulate the control sliders to adjust experimental parameters. Observe the real-time response.',
        educationalPrinciple: 'Variable Isolation & Empirical Testing',
        requiredInteraction: sceneDef.interactions[0]?.parameterName,
      },
      {
        stepId: 'step_observe',
        type: 'OBSERVE',
        title: 'Analyze Observations',
        instruction: 'Examine the telemetry gauges and visual indicators. Compare what occurred with your initial prediction.',
        educationalPrinciple: 'Evidence Synthesis',
      },
      {
        stepId: 'step_explain',
        type: 'EXPLAIN',
        title: 'Xira Conceptual Breakdown',
        instruction: 'Review the underlying scientific mechanism with Xira. Connect the observed behavior to the core law.',
        educationalPrinciple: 'Theoretical Grounding',
      },
      {
        stepId: 'step_challenge',
        type: 'CHALLENGE',
        title: 'Application Challenge',
        instruction: 'Apply what you just demonstrated to solve a practical scientific problem.',
        educationalPrinciple: 'Mastery Transfer',
      },
      {
        stepId: 'step_assess',
        type: 'ASSESS',
        title: 'Evidence & Calibration',
        instruction: 'Evaluating your experimental trials, predictions, and answers against the learning objectives.',
        educationalPrinciple: 'Calibrated Mastery',
      },
      {
        stepId: 'step_complete',
        type: 'COMPLETE',
        title: 'Experience Complete',
        instruction: `Outstanding work! You have verified the principles of ${topic.rawUserTopic}. Ready for the next learning quest.`,
        educationalPrinciple: 'Curriculum Progression',
      },
    ];

    const fallbackPlan: FallbackTeachingPlan = {
      type: topic.fallbackExperience,
      title: `${topic.rawUserTopic}: Concept Breakdown`,
      summary: primaryObjective,
      principles: topic.keyPrinciples,
      diagramElements: sceneDef.objects.map((o) => ({
        id: o.id,
        label: o.name,
        type: o.category === 'indicator' ? 'metric' : 'node',
        description: o.educationalDescription || o.semanticMeaning,
      })),
      interactiveCheck: {
        question: challengeQuestion,
        options: challengeOptions,
      },
    };

    return {
      planId,
      topic,
      objective: primaryObjective,
      experienceFamily: (topic.recommendedExperienceType as UniversalExperienceFamily) || 'SIMULATION',
      experienceType: topic.recommendedExperienceType,
      experienceId: sceneDef.id,
      isSpecializedExperience: false,
      sceneDefinition: sceneDef,
      visualTeachingPlan: VisualTeachingPlanBuilder.buildPlan(topic),
      teachingSteps,
      interactions: sceneDef.interactions,
      challenge: {
        objective: primaryObjective,
        instructions: 'Experiment with variables and confirm the underlying scientific law.',
        successCondition: 'Verify target relationship through prediction and empirical demonstration.',
        hints: [
          `Focus on how ${sceneDef.interactions[0]?.label || 'the main parameter'} directly modifies system output.`,
          'Change one variable at a time to isolate its effect.',
          `Remember that in ${topic.subject}, systems obey strict conservation and proportionality laws.`,
        ],
        prediction: predictionChallenge,
      },
      predictionChallenge,
      assessmentCriteria: {
        targetMetric: sceneDef.interactions[0]?.parameterName,
        successCondition: 'Experimental demonstration + correct prediction or challenge answer',
        misconceptionChecks: [
          {
            triggerCondition: 'inverted_proportionality_assumption',
            diagnosis: 'Learner assumed direct proportionality when relationship was inverse.',
            remediation: 'Observe that as denominator or opposing resistance grows, the quotient decreases.',
          },
        ],
      },
      fallbackPlan,
      sources: topic.sources,
      knowledgeBundle: topic.knowledgeBundle,
    };
  }

  /**
   * Generates a plan for existing specialized experiences.
   */
  private static composeSpecializedPlan(
    planId: string,
    topic: UniversalLearningTopic,
    primaryObjective: string
  ): TeachingExperiencePlan {
    const teachingSteps: TeachingStep[] = [
      {
        stepId: 'step_intro',
        type: 'INTRODUCE',
        title: `Welcome to ${topic.rawUserTopic}`,
        instruction: `Engage with the specialized interactive laboratory designed for ${topic.rawUserTopic}.`,
        educationalPrinciple: topic.keyPrinciples[0] || 'Core Mechanics',
      },
      {
        stepId: 'step_predict',
        type: 'PREDICT',
        title: 'Predict Outcome',
        instruction: 'Predict the experimental result before launching the simulation.',
        educationalPrinciple: 'Pedagogical Prediction',
      },
      {
        stepId: 'step_experiment',
        type: 'EXPERIMENT',
        title: 'Perform Challenge',
        instruction: 'Manipulate controls and achieve the target objective.',
        educationalPrinciple: 'Active Problem Solving',
      },
      {
        stepId: 'step_complete',
        type: 'COMPLETE',
        title: 'Mastery Attained',
        instruction: 'Review telemetry evidence and progress to the next quest.',
        educationalPrinciple: 'Learning Progression',
      },
    ];

    const fallbackPlan: FallbackTeachingPlan = {
      type: topic.fallbackExperience,
      title: `${topic.rawUserTopic} Specialized Laboratory`,
      summary: primaryObjective,
      principles: topic.keyPrinciples,
      interactiveCheck: {
        question: `What is the core target outcome of ${topic.rawUserTopic}?`,
        options: [
          { id: 'o1', text: primaryObjective, isCorrect: true, explanation: 'Correct target outcome.' },
          { id: 'o2', text: 'Passive memorization without interaction', isCorrect: false, explanation: 'Incorrect.' },
        ],
      },
    };

    return {
      planId,
      topic,
      objective: primaryObjective,
      experienceFamily: (topic.recommendedExperienceType as UniversalExperienceFamily) || 'SIMULATION',
      experienceType: topic.recommendedExperienceType,
      experienceId: `exp_${topic.topicId}`,
      isSpecializedExperience: true,
      visualTeachingPlan: VisualTeachingPlanBuilder.buildPlan(topic),
      teachingSteps,
      interactions: [],
      challenge: {
        objective: primaryObjective,
        instructions: 'Complete the interactive challenge in the specialized laboratory.',
        successCondition: 'Achieve passing telemetry score.',
        hints: ['Follow on-screen guidance and inspect feedback.'],
      },
      assessmentCriteria: {
        successCondition: 'Score >= 70 in specialized laboratory',
        misconceptionChecks: [],
      },
      fallbackPlan,
      sources: topic.sources,
      knowledgeBundle: topic.knowledgeBundle,
    };
  }
}
