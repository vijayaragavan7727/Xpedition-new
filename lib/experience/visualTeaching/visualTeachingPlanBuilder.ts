/**
 * Xpedition Visual Teaching Mode Engine v1 — Visual Teaching Plan Builder
 *
 * Declaratively constructs rich, deterministic VisualTeachingPlan objects for
 * curated topics, proof cases, and arbitrary novel topics.
 */

import { UniversalLearningTopic } from '../universalTopicTypes';
import { TeachingModeSelector } from './teachingModeSelector';
import {
  VisualTeachingPlan,
  TeachingMode,
  VisualEntity,
  VisualRelationship,
  MotionStage,
  TransformationStage,
  ExplodedComponent,
  ParameterControl,
  QuickCheckQuestion,
  DeviceCapabilities,
} from './types';

export class VisualTeachingPlanBuilder {
  /**
   * Builds an authoritative VisualTeachingPlan for a topic.
   */
  static buildPlan(
    topic: UniversalLearningTopic,
    deviceCapabilities: DeviceCapabilities = { hasWebGL: true, prefersReducedMotion: false },
    overrideMode?: TeachingMode
  ): VisualTeachingPlan {
    const planId = `vplan_${topic.topicId}_${Date.now()}`;
    const selection = TeachingModeSelector.selectMode(
      {
        normalizedTopic: topic.normalizedTopic,
        subject: topic.subject,
        domain: topic.domain,
        keyPrinciples: topic.keyPrinciples,
      },
      deviceCapabilities
    );

    const activeMode: TeachingMode = overrideMode || selection.primaryMode;
    const secondaryMode = selection.secondaryMode;
    const normalized = topic.normalizedTopic.toLowerCase();

    // 1. Newton's Laws
    if (normalized.includes('newton') || normalized.includes('f = ma') || normalized.includes('force and motion')) {
      return VisualTeachingPlanBuilder.buildNewtonsLawsPlan(planId, topic, activeMode, secondaryMode);
    }

    // 2. Photosynthesis
    if (normalized.includes('photosynthesis') || normalized.includes('chloroplast')) {
      return VisualTeachingPlanBuilder.buildPhotosynthesisPlan(planId, topic, activeMode, secondaryMode);
    }

    // 3. Electric Circuit
    if (normalized.includes('circuit') || normalized.includes('ohm')) {
      return VisualTeachingPlanBuilder.buildElectricCircuitPlan(planId, topic, activeMode, secondaryMode);
    }

    // 4. Solar System
    if (normalized.includes('solar system') || normalized.includes('planet') || normalized.includes('orbit')) {
      return VisualTeachingPlanBuilder.buildSolarSystemPlan(planId, topic, activeMode, secondaryMode);
    }

    // 5. Fractions
    if (normalized.includes('fraction') || normalized.includes('numerator')) {
      return VisualTeachingPlanBuilder.buildFractionsPlan(planId, topic, activeMode, secondaryMode);
    }

    // 6. DNA Replication
    if (normalized.includes('dna') || normalized.includes('double helix')) {
      return VisualTeachingPlanBuilder.buildDnaReplicationPlan(planId, topic, activeMode, secondaryMode);
    }

    // 7. Electric Motor
    if (normalized.includes('motor') || normalized.includes('armature') || normalized.includes('commutator')) {
      return VisualTeachingPlanBuilder.buildElectricMotorPlan(planId, topic, activeMode, secondaryMode);
    }

    // 8. Human Heart
    if (normalized.includes('heart') || normalized.includes('cardiac')) {
      return VisualTeachingPlanBuilder.buildHeartAnatomyPlan(planId, topic, activeMode, secondaryMode);
    }

    // 9. Projectile Motion
    if (normalized.includes('projectile') || normalized.includes('trajectory')) {
      return VisualTeachingPlanBuilder.buildProjectileMotionPlan(planId, topic, activeMode, secondaryMode);
    }

    // 10. Sorting Algorithms
    if (normalized.includes('sorting') || normalized.includes('bubble sort') || normalized.includes('quicksort')) {
      return VisualTeachingPlanBuilder.buildSortingAlgorithmsPlan(planId, topic, activeMode, secondaryMode);
    }

    // 11. Supply and Demand
    if (normalized.includes('supply and demand') || normalized.includes('equilibrium') || normalized.includes('price elasticity')) {
      return VisualTeachingPlanBuilder.buildSupplyDemandPlan(planId, topic, activeMode, secondaryMode);
    }

    // 12. English Grammar
    if (normalized.includes('grammar') || normalized.includes('syntax') || normalized.includes('verb') || normalized.includes('sentence')) {
      return VisualTeachingPlanBuilder.buildEnglishGrammarPlan(planId, topic, activeMode, secondaryMode);
    }

    // 13. Generic / Unknown / Novel Topic (Guaranteed Fallback)
    return VisualTeachingPlanBuilder.buildGenericFallbackPlan(planId, topic, activeMode, secondaryMode);
  }

  // --- PROOF TOPIC BUILDERS ---

  private static buildNewtonsLawsPlan(
    planId: string,
    topic: UniversalLearningTopic,
    mode: TeachingMode,
    secondaryMode?: TeachingMode
  ): VisualTeachingPlan {
    return {
      planId,
      conceptId: 'newtons_laws_motion',
      title: "Newton's Second Law: F = ma",
      learningObjective: 'Understand how net force produces acceleration inversely proportional to mass.',
      mode,
      secondaryMode,
      entities: [
        { id: 'cart', label: 'Dynamic Cart', role: 'primary', color: '#06b6d4', initialState: { mass: 5, x: 0 } },
        { id: 'force_vector', label: 'Applied Force Vector', role: 'input', color: '#f59e0b', initialState: { magnitude: 20 } },
        { id: 'track', label: 'Frictionless Track', role: 'component', color: '#64748b' },
        { id: 'accel_gauge', label: 'Acceleration Display', role: 'output', color: '#10b981', initialState: { a: 4.0 } },
      ],
      relationships: [
        { id: 'r1', sourceEntityId: 'force_vector', targetEntityId: 'cart', type: 'causes', label: 'Accelerates', equation: 'a = F / m' },
        { id: 'r2', sourceEntityId: 'cart', targetEntityId: 'accel_gauge', type: 'proportional_to', label: 'Directly displays calculated acceleration' },
      ],
      stages: [
        { stageId: 's1', order: 1, title: 'Initial State', narrative: 'A 5 kg cart rests on a frictionless air track.', durationMs: 2000, visualState: { force: 0, mass: 5, acceleration: 0 } },
        { stageId: 's2', order: 2, title: 'Applying Force', narrative: 'Applying 20 N of horizontal force causes steady acceleration of 4.0 m/s².', durationMs: 3000, visualState: { force: 20, mass: 5, acceleration: 4.0 } },
        { stageId: 's3', order: 3, title: 'Inertia Impact', narrative: 'Doubling mass to 10 kg with the same force halves acceleration to 2.0 m/s².', durationMs: 3000, visualState: { force: 20, mass: 10, acceleration: 2.0 } },
      ],
      interactiveControls: [
        { name: 'appliedForce', label: 'Applied Force (F)', unit: 'N', min: 0, max: 50, defaultValue: 20, step: 5, widgetType: 'slider' },
        { name: 'cartMass', label: 'Cart Mass (m)', unit: 'kg', min: 1, max: 20, defaultValue: 5, step: 1, widgetType: 'slider' },
      ],
      quickCheck: {
        id: 'qc_newton',
        prompt: 'If force is kept at 30 N and mass is increased from 3 kg to 6 kg, what is the new acceleration?',
        options: [
          { id: 'o1', label: '5.0 m/s²', isCorrect: true, explanation: 'Correct! By a = F / m = 30 N / 6 kg = 5.0 m/s².' },
          { id: 'o2', label: '10.0 m/s²', isCorrect: false, explanation: 'Incorrect: that was the acceleration with 3 kg.' },
          { id: 'o3', label: '2.5 m/s²', isCorrect: false, explanation: 'Incorrect calculation.' },
        ],
        hint: 'Use Newton’s Second Law: a = F / m.',
      },
      fallbackAvailable: true,
      accessibility: {
        ariaLabel: "Interactive demonstration of Newton's second law",
        accessibleDescription: 'Adjustable force and mass controls demonstrating real-time acceleration change.',
        screenReaderSummary: 'F = ma simulation showing that acceleration equals force divided by mass.',
        reducedMotionAlternativeText: 'Static table displaying acceleration for given force and mass pairs.',
      },
      performance: { recommendedFps: 60, useWebGL: false, estimatedMemoryMb: 8 },
    };
  }

  private static buildPhotosynthesisPlan(
    planId: string,
    topic: UniversalLearningTopic,
    mode: TeachingMode,
    secondaryMode?: TeachingMode
  ): VisualTeachingPlan {
    return {
      planId,
      conceptId: 'photosynthesis_chloroplast',
      title: 'Photosynthesis Biochemical Pathway',
      learningObjective: 'Observe the sequential inputs and outputs of light-dependent reactions and Calvin cycle.',
      mode,
      secondaryMode,
      entities: [
        { id: 'sunlight', label: 'Solar Photons', role: 'input', color: '#fbbf24' },
        { id: 'water', label: 'Water (H₂O)', role: 'input', color: '#38bdf8' },
        { id: 'co2', label: 'Carbon Dioxide (CO₂)', role: 'input', color: '#94a3b8' },
        { id: 'chloroplast', label: 'Thylakoid / Stroma', role: 'primary', color: '#22c55e' },
        { id: 'glucose', label: 'Glucose (C₆H₁₂O₆)', role: 'output', color: '#f59e0b' },
        { id: 'oxygen', label: 'Oxygen (O₂)', role: 'output', color: '#a7f3d0' },
      ],
      relationships: [
        { id: 'r1', sourceEntityId: 'sunlight', targetEntityId: 'chloroplast', type: 'flows_to', label: 'Excites chlorophyll pigments' },
        { id: 'r2', sourceEntityId: 'water', targetEntityId: 'chloroplast', type: 'transforms_into', label: 'Photolysis splits into H+ and O₂' },
        { id: 'r3', sourceEntityId: 'co2', targetEntityId: 'chloroplast', type: 'transforms_into', label: 'Fixed during Calvin cycle' },
        { id: 'r4', sourceEntityId: 'chloroplast', targetEntityId: 'glucose', type: 'flows_to', label: 'Synthesizes sugar energy' },
        { id: 'r5', sourceEntityId: 'chloroplast', targetEntityId: 'oxygen', type: 'flows_to', label: 'Releases O₂ byproduct' },
      ],
      stages: [
        { stageId: 'p1', order: 1, title: 'Leaf Structure', narrative: 'Plant leaf chloroplast absorbs ambient solar photons.', durationMs: 2500, visualState: { activeEntity: 'sunlight', step: 1 } },
        { stageId: 'p2', order: 2, title: 'Water Photolysis', narrative: 'Roots transport water; thylakoids split H₂O into electrons, protons, and oxygen.', durationMs: 2500, visualState: { activeEntity: 'water', step: 2 } },
        { stageId: 'p3', order: 3, title: 'CO₂ Absorption', narrative: 'Stomata open to take in carbon dioxide from the atmosphere.', durationMs: 2500, visualState: { activeEntity: 'co2', step: 3 } },
        { stageId: 'p4', order: 4, title: 'Glucose Synthesis', narrative: 'The Calvin cycle fixes carbon to construct energetic glucose molecules.', durationMs: 2500, visualState: { activeEntity: 'glucose', step: 4 } },
        { stageId: 'p5', order: 5, title: 'Oxygen Release', narrative: 'Vital oxygen gas exits through leaf stomata into the ecosystem.', durationMs: 2500, visualState: { activeEntity: 'oxygen', step: 5 } },
      ],
      interactiveControls: [
        { name: 'lightIntensity', label: 'Light Intensity', unit: '%', min: 0, max: 100, defaultValue: 80, step: 10, widgetType: 'slider' },
        { name: 'co2Level', label: 'CO₂ Concentration', unit: 'ppm', min: 100, max: 1000, defaultValue: 400, step: 50, widgetType: 'slider' },
      ],
      quickCheck: {
        id: 'qc_photo',
        prompt: 'Which reactant directly produces oxygen byproduct during photosynthesis?',
        options: [
          { id: 'o1', label: 'Water (H₂O) through photolysis', isCorrect: true, explanation: 'Correct! Water is split in light-dependent reactions to generate O₂ gas.' },
          { id: 'o2', label: 'Carbon Dioxide (CO₂)', isCorrect: false, explanation: 'Incorrect: CO₂ oxygen ends up in glucose and water.' },
          { id: 'o3', label: 'Glucose breakdown', isCorrect: false, explanation: 'Glucose is the stored energy product, not the reactant source.' },
        ],
      },
      fallbackAvailable: true,
      accessibility: {
        ariaLabel: 'Photosynthesis sequential motion explanation',
        accessibleDescription: 'Visual progression showing sunlight, water, and CO2 converting into glucose and oxygen.',
        screenReaderSummary: 'Five-stage photosynthesis flow: Light and water entering, photolysis, CO2 fixation, glucose and oxygen generation.',
        reducedMotionAlternativeText: 'Chemical equation: 6CO₂ + 6H₂O + Light → C₆H₁₂O₆ + 6O₂ with annotated step cards.',
      },
      performance: { recommendedFps: 60, useWebGL: false, estimatedMemoryMb: 6 },
    };
  }

  private static buildElectricCircuitPlan(
    planId: string,
    topic: UniversalLearningTopic,
    mode: TeachingMode,
    secondaryMode?: TeachingMode
  ): VisualTeachingPlan {
    return {
      planId,
      conceptId: 'electric_circuits_ohms_law',
      title: "Electric Circuit & Ohm's Law: I = V / R",
      learningObjective: 'Observe how voltage and resistance interact to control current and bulb illumination.',
      mode,
      secondaryMode,
      entities: [
        { id: 'battery', label: 'DC Voltage Source', role: 'input', color: '#ef4444' },
        { id: 'resistor', label: 'Load Resistor', role: 'component', color: '#6366f1' },
        { id: 'bulb', label: 'Incandescent Lamp', role: 'output', color: '#fbbf24' },
        { id: 'ammeter', label: 'Current Meter', role: 'indicator', color: '#10b981' },
      ],
      relationships: [
        { id: 'r1', sourceEntityId: 'battery', targetEntityId: 'resistor', type: 'flows_to', label: 'Provides electromotive potential (V)' },
        { id: 'r2', sourceEntityId: 'resistor', targetEntityId: 'bulb', type: 'proportional_to', label: 'Impedes charge carrier flow: I = V / R' },
      ],
      stages: [
        { stageId: 'c1', order: 1, title: 'Closed Loop', narrative: 'Electrons flow continuously through the closed conductor loop.', durationMs: 2500, visualState: { current: 1.2 } },
        { stageId: 'c2', order: 2, title: 'Voltage Increase', narrative: 'Increasing battery potential increases electron flow and bulb brilliance.', durationMs: 2500, visualState: { current: 2.4 } },
      ],
      interactiveControls: [
        { name: 'voltage', label: 'Battery Voltage (V)', unit: 'V', min: 1, max: 24, defaultValue: 12, step: 1, widgetType: 'slider' },
        { name: 'resistance', label: 'Resistance (R)', unit: 'Ω', min: 2, max: 30, defaultValue: 10, step: 1, widgetType: 'slider' },
      ],
      quickCheck: {
        id: 'qc_ohm',
        prompt: 'If resistance is doubled while voltage remains constant, what happens to the electric current?',
        options: [
          { id: 'o1', label: 'Current is halved (I = V / R)', isCorrect: true, explanation: 'Correct! Current is inversely proportional to resistance.' },
          { id: 'o2', label: 'Current doubles', isCorrect: false, explanation: 'Incorrect: increasing resistance restricts current.' },
          { id: 'o3', label: 'Current remains constant', isCorrect: false, explanation: 'Incorrect.' },
        ],
      },
      fallbackAvailable: true,
      accessibility: {
        ariaLabel: "Ohm's Law circuit simulator",
        accessibleDescription: 'Adjustable voltage and resistance sliders showing current in amperes and bulb brightness.',
        screenReaderSummary: 'Circuit model where current equals voltage divided by resistance.',
        reducedMotionAlternativeText: 'Ohm’s law table and static circuit schematic.',
      },
      performance: { recommendedFps: 60, useWebGL: false, estimatedMemoryMb: 6 },
    };
  }

  private static buildSolarSystemPlan(
    planId: string,
    topic: UniversalLearningTopic,
    mode: TeachingMode,
    secondaryMode?: TeachingMode
  ): VisualTeachingPlan {
    return {
      planId,
      conceptId: 'solar_system_orbits',
      title: 'Solar System Planetary Orbits',
      learningObjective: 'Inspect Keplerian planetary motion where inner planets orbit faster than outer planets.',
      mode,
      secondaryMode,
      entities: [
        { id: 'sun', label: 'The Sun', role: 'primary', color: '#f59e0b', geometryType: 'sphere' },
        { id: 'mercury', label: 'Mercury', role: 'component', color: '#94a3b8', geometryType: 'sphere' },
        { id: 'earth', label: 'Earth', role: 'component', color: '#38bdf8', geometryType: 'sphere' },
        { id: 'jupiter', label: 'Jupiter', role: 'component', color: '#d97706', geometryType: 'sphere' },
      ],
      relationships: [
        { id: 'r1', sourceEntityId: 'sun', targetEntityId: 'earth', type: 'causes', label: 'Gravitational attraction sustains orbital curvature' },
      ],
      stages: [
        { stageId: 's1', order: 1, title: 'Central Gravitational Mass', narrative: 'The massive Sun anchors all planetary orbits.', durationMs: 3000, visualState: { focus: 'sun' } },
        { stageId: 's2', order: 2, title: 'Inner vs Outer Orbits', narrative: 'Mercury orbits in 88 days; Jupiter requires 12 Earth years.', durationMs: 3000, visualState: { focus: 'all' } },
      ],
      interactiveControls: [
        { name: 'simulationSpeed', label: 'Orbital Speed Multiplier', unit: 'x', min: 1, max: 10, defaultValue: 2, step: 1, widgetType: 'slider' },
      ],
      quickCheck: {
        id: 'qc_solar',
        prompt: 'Why do planets closer to the Sun travel at higher orbital velocities?',
        options: [
          { id: 'o1', label: 'Stronger solar gravity requires higher speed to maintain orbit', isCorrect: true, explanation: 'Correct! By Kepler’s 3rd Law and Newton’s gravity (v ≈ √(GM/r)).' },
          { id: 'o2', label: 'Inner planets are hotter so they have more energy', isCorrect: false, explanation: 'Orbital mechanics is governed by gravity and distance, not surface temperature.' },
          { id: 'o3', label: 'Outer planets have too much atmosphere drag', isCorrect: false, explanation: 'Space is a vacuum.' },
        ],
      },
      fallbackAvailable: true,
      accessibility: {
        ariaLabel: '3D Solar system planetary orbits',
        accessibleDescription: 'Interactive 3D model displaying orbits of Mercury, Earth, and Jupiter around the Sun.',
        screenReaderSummary: 'Planetary orbital mechanics model demonstrating Kepler’s third law.',
        reducedMotionAlternativeText: 'Static orbital diagram with planetary distance and period table.',
      },
      performance: { recommendedFps: 60, useWebGL: true, estimatedMemoryMb: 24 },
    };
  }

  private static buildFractionsPlan(
    planId: string,
    topic: UniversalLearningTopic,
    mode: TeachingMode,
    secondaryMode?: TeachingMode
  ): VisualTeachingPlan {
    return {
      planId,
      conceptId: 'fractions_rational_parts',
      title: 'Visual Fractions & Proportions',
      learningObjective: 'Visually understand numerator as selected pieces and denominator as total equal partitions.',
      mode,
      secondaryMode,
      entities: [
        { id: 'whole_bar', label: 'Unit Whole Bar', role: 'primary', color: '#0ea5e9' },
        { id: 'selected_partitions', label: 'Numerator Slices', role: 'indicator', color: '#10b981' },
      ],
      relationships: [
        { id: 'r1', sourceEntityId: 'selected_partitions', targetEntityId: 'whole_bar', type: 'proportional_to', label: 'Value = Numerator / Denominator' },
      ],
      stages: [
        { stageId: 'f1', order: 1, title: 'Partitioning', narrative: 'The denominator splits the unit bar into equal segments.', durationMs: 2500, visualState: { num: 3, den: 4 } },
      ],
      interactiveControls: [
        { name: 'numerator', label: 'Numerator (parts chosen)', min: 1, max: 12, defaultValue: 3, step: 1, widgetType: 'slider' },
        { name: 'denominator', label: 'Denominator (total parts)', min: 1, max: 12, defaultValue: 4, step: 1, widgetType: 'slider' },
      ],
      quickCheck: {
        id: 'qc_fraction',
        prompt: 'Which fraction is equivalent to 3/4?',
        options: [
          { id: 'o1', label: '6/8', isCorrect: true, explanation: 'Correct! 3/4 × 2/2 = 6/8.' },
          { id: 'o2', label: '3/8', isCorrect: false, explanation: '3/8 is half of 3/4.' },
          { id: 'o3', label: '4/3', isCorrect: false, explanation: '4/3 is greater than 1.' },
        ],
      },
      fallbackAvailable: true,
      accessibility: {
        ariaLabel: 'Interactive fraction visualizer',
        accessibleDescription: 'Visual fraction bar partitioning based on numerator and denominator sliders.',
        screenReaderSummary: 'Fraction demonstration displaying proportional shaded area for selected numerator and denominator.',
        reducedMotionAlternativeText: 'Textual fraction ratio and decimal equivalence table.',
      },
      performance: { recommendedFps: 60, useWebGL: false, estimatedMemoryMb: 5 },
    };
  }

  private static buildDnaReplicationPlan(
    planId: string,
    topic: UniversalLearningTopic,
    mode: TeachingMode,
    secondaryMode?: TeachingMode
  ): VisualTeachingPlan {
    return {
      planId,
      conceptId: 'dna_replication_mechanics',
      title: 'DNA Semi-Conservative Replication',
      learningObjective: 'Understand how DNA unzips and complementary bases (A-T, C-G) synthesize two identical helices.',
      mode,
      secondaryMode,
      entities: [
        { id: 'parent_helix', label: 'Parent Double Helix', role: 'primary', color: '#06b6d4' },
        { id: 'helicase', label: 'Helicase Enzyme', role: 'catalyst', color: '#f59e0b' },
        { id: 'free_bases', label: 'Free Nucleotides (A, T, C, G)', role: 'input', color: '#a855f7' },
        { id: 'daughter_strands', label: 'Two Duplicated Helices', role: 'output', color: '#10b981' },
      ],
      relationships: [
        { id: 'r1', sourceEntityId: 'helicase', targetEntityId: 'parent_helix', type: 'transforms_into', label: 'Breaks hydrogen bonds unzipping the helix' },
        { id: 'r2', sourceEntityId: 'free_bases', targetEntityId: 'daughter_strands', type: 'attaches_to', label: 'A pairs with T, C pairs with G' },
      ],
      stages: [
        { stageId: 'd1', order: 1, title: 'Intact Helix', narrative: 'Double-stranded DNA molecule is tightly bound by hydrogen bonds.', durationMs: 2500, visualState: { unzipped: 0 } },
        { stageId: 'd2', order: 2, title: 'Helicase Unzipping', narrative: 'Helicase enzyme unwinds the strands, exposing template nucleotides.', durationMs: 3000, visualState: { unzipped: 50 } },
        { stageId: 'd3', order: 3, title: 'Base Pairing', narrative: 'DNA polymerase attaches complementary bases: Adenine to Thymine, Cytosine to Guanine.', durationMs: 3000, visualState: { unzipped: 100 } },
      ],
      transformationStages: [
        { stageId: 't1', title: 'State A: Single Double Helix', stateLabel: 'Original DNA Strand', description: 'Intact double helix containing genetic code.', stateData: { helices: 1 }, keyTransformationMechanism: 'Thermal & hydrogen stability' },
        { stageId: 't2', title: 'Transformation: Unzipping & Assembly', stateLabel: 'Replication Fork', description: 'Helicase unwinds strands; DNA polymerase attaches complementary bases.', stateData: { helices: 1.5 }, keyTransformationMechanism: 'Semi-conservative complementary base pairing' },
        { stageId: 't3', title: 'State B: Two Duplicated Helices', stateLabel: 'Identical Daughter Molecules', description: 'Two identical double helices, each containing one original and one newly synthesized strand.', stateData: { helices: 2 }, keyTransformationMechanism: 'Complete replication' },
      ],
      interactiveControls: [
        { name: 'replicationProgress', label: 'Replication Progress', unit: '%', min: 0, max: 100, defaultValue: 50, step: 10, widgetType: 'slider' },
      ],
      quickCheck: {
        id: 'qc_dna',
        prompt: 'In DNA replication, what base pairs complementarily with Guanine (G)?',
        options: [
          { id: 'o1', label: 'Cytosine (C)', isCorrect: true, explanation: 'Correct! Guanine always pairs with Cytosine via three hydrogen bonds.' },
          { id: 'o2', label: 'Adenine (A)', isCorrect: false, explanation: 'Adenine pairs with Thymine.' },
          { id: 'o3', label: 'Uracil (U)', isCorrect: false, explanation: 'Uracil is found in RNA, not DNA.' },
        ],
      },
      fallbackAvailable: true,
      accessibility: {
        ariaLabel: 'DNA semi-conservative replication animation',
        accessibleDescription: 'Three-stage transformation showing unwinding double helix and complementary base pairing.',
        screenReaderSummary: 'DNA replication model demonstrating semi-conservative replication and base pairing rules.',
        reducedMotionAlternativeText: 'Static three-step diagram: 1. Parent strand, 2. Replication fork, 3. Two daughter helices.',
      },
      performance: { recommendedFps: 60, useWebGL: false, estimatedMemoryMb: 10 },
    };
  }

  private static buildElectricMotorPlan(
    planId: string,
    topic: UniversalLearningTopic,
    mode: TeachingMode,
    secondaryMode?: TeachingMode
  ): VisualTeachingPlan {
    return {
      planId,
      conceptId: 'electric_motor',
      title: 'DC Electric Motor: Exploded View & Operation',
      learningObjective: 'Inspect each component of an electric motor and understand how commutation sustains continuous rotation.',
      mode,
      secondaryMode,
      entities: [
        { id: 'magnets', label: 'Permanent Stator Magnets', role: 'primary', color: '#ef4444' },
        { id: 'armature', label: 'Coil Armature / Rotor', role: 'component', color: '#f59e0b' },
        { id: 'commutator', label: 'Split-Ring Commutator', role: 'component', color: '#06b6d4' },
        { id: 'brushes', label: 'Carbon Brushes', role: 'component', color: '#64748b' },
        { id: 'shaft', label: 'Drive Shaft', role: 'output', color: '#94a3b8' },
      ],
      relationships: [
        { id: 'r1', sourceEntityId: 'magnets', targetEntityId: 'armature', type: 'causes', label: 'Lorentz force generates torque (τ = 2·F·r)' },
        { id: 'r2', sourceEntityId: 'commutator', targetEntityId: 'armature', type: 'proportional_to', label: 'Inverts current direction every 180°' },
      ],
      stages: [
        { stageId: 'm1', order: 1, title: 'Assembled System', narrative: 'The motor converts electrical energy into mechanical torque.', durationMs: 2500, visualState: { exploded: false } },
        { stageId: 'm2', order: 2, title: 'Exploded Component View', narrative: 'Separating components reveals magnets, commutator rings, and armature wiring.', durationMs: 3000, visualState: { exploded: true } },
      ],
      explodedComponents: [
        { id: 'magnets', name: 'Stator Magnets (N / S)', functionDescription: 'Provides uniform transverse magnetic field B.', color: '#ef4444', separatedOffset: { x: -80, y: 0 }, assembledPosition: { x: -20, y: 0 } },
        { id: 'armature', name: 'Armature Rotor Coil', functionDescription: 'Carries current loop that experiences Lorentz force torque.', color: '#f59e0b', separatedOffset: { x: 0, y: -50 }, assembledPosition: { x: 0, y: 0 } },
        { id: 'commutator', name: 'Split-Ring Commutator', functionDescription: 'Reverses coil current every half-turn to keep torque in one direction.', color: '#06b6d4', separatedOffset: { x: 50, y: 0 }, assembledPosition: { x: 15, y: 0 } },
        { id: 'brushes', name: 'Carbon Contact Brushes', functionDescription: 'Transfers DC power from stationary circuit to rotating rings.', color: '#64748b', separatedOffset: { x: 80, y: 30 }, assembledPosition: { x: 25, y: 0 } },
      ],
      interactiveControls: [
        { name: 'separationDistance', label: 'Component Separation', unit: '%', min: 0, max: 100, defaultValue: 60, step: 10, widgetType: 'slider' },
        { name: 'currentFlow', label: 'Coil Current', unit: 'A', min: 0, max: 10, defaultValue: 5, step: 1, widgetType: 'slider' },
      ],
      quickCheck: {
        id: 'qc_motor',
        prompt: 'What critical issue would occur in a DC motor without a split-ring commutator?',
        options: [
          { id: 'o1', label: 'The coil would stall after 90° and merely oscillate', isCorrect: true, explanation: 'Correct! Without commutation reversing the current, torque direction opposes continued rotation after half a turn.' },
          { id: 'o2', label: 'The permanent magnets would lose their magnetism', isCorrect: false, explanation: 'Stator magnets are unaffected.' },
          { id: 'o3', label: 'The motor would rotate at double speed', isCorrect: false, explanation: 'It would stop rotating entirely.' },
        ],
      },
      fallbackAvailable: true,
      accessibility: {
        ariaLabel: 'Exploded view of DC electric motor',
        accessibleDescription: 'Interactive exploded diagram isolating stator magnets, armature coil, split-ring commutator, and carbon brushes.',
        screenReaderSummary: 'DC motor exploded breakdown detailing the electrical and magnetic purpose of each part.',
        reducedMotionAlternativeText: 'Static labelled schematic of DC motor components.',
      },
      performance: { recommendedFps: 60, useWebGL: false, estimatedMemoryMb: 12 },
    };
  }

  private static buildHeartAnatomyPlan(
    planId: string,
    topic: UniversalLearningTopic,
    mode: TeachingMode,
    secondaryMode?: TeachingMode
  ): VisualTeachingPlan {
    return {
      planId,
      conceptId: 'human_heart_anatomy',
      title: 'Human Heart Anatomy & Blood Circulation',
      learningObjective: 'Explore the 4 cardiac chambers, 4 one-way valves, and systemic vs pulmonary circulation.',
      mode,
      secondaryMode,
      entities: [
        { id: 'right_atrium', label: 'Right Atrium', role: 'component', color: '#3b82f6' },
        { id: 'right_ventricle', label: 'Right Ventricle', role: 'component', color: '#1d4ed8' },
        { id: 'left_atrium', label: 'Left Atrium', role: 'component', color: '#ef4444' },
        { id: 'left_ventricle', label: 'Left Ventricle', role: 'component', color: '#b91c1c' },
        { id: 'aorta', label: 'Systemic Aorta', role: 'output', color: '#f87171' },
      ],
      relationships: [
        { id: 'r1', sourceEntityId: 'right_ventricle', targetEntityId: 'left_atrium', type: 'flows_to', label: 'Pulmonary circulation (lungs oxygenation)' },
        { id: 'r2', sourceEntityId: 'left_ventricle', targetEntityId: 'aorta', type: 'flows_to', label: 'Systemic high-pressure distribution' },
      ],
      stages: [
        { stageId: 'h1', order: 1, title: 'Right Heart (Deoxygenated)', narrative: 'Blood arrives from vena cava into the right atrium and ventricle.', durationMs: 2500, visualState: { flow: 'pulmonary' } },
        { stageId: 'h2', order: 2, title: 'Left Heart (Oxygenated)', narrative: 'Oxygenated blood returns from lungs and is pumped via the aorta to the body.', durationMs: 2500, visualState: { flow: 'systemic' } },
      ],
      interactiveControls: [
        { name: 'heartRateBpm', label: 'Heart Rate', unit: 'BPM', min: 40, max: 140, defaultValue: 72, step: 2, widgetType: 'slider' },
      ],
      quickCheck: {
        id: 'qc_heart',
        prompt: 'Which cardiac chamber has the thickest muscular wall to pump blood throughout the entire body?',
        options: [
          { id: 'o1', label: 'Left Ventricle', isCorrect: true, explanation: 'Correct! The left ventricle must overcome high systemic resistance to deliver oxygenated blood to the body.' },
          { id: 'o2', label: 'Right Atrium', isCorrect: false, explanation: 'The right atrium merely receives venous blood.' },
          { id: 'o3', label: 'Right Ventricle', isCorrect: false, explanation: 'The right ventricle only pumps low-pressure blood to the adjacent lungs.' },
        ],
      },
      fallbackAvailable: true,
      accessibility: {
        ariaLabel: '3D cardiovascular heart anatomy explorer',
        accessibleDescription: 'Interactive 3D model of heart chambers and valve mechanics.',
        screenReaderSummary: 'Heart anatomy explorer showing four chambers, valves, and pulmonary vs systemic circulation.',
        reducedMotionAlternativeText: 'Cardiovascular flow chart with chamber descriptions.',
      },
      performance: { recommendedFps: 60, useWebGL: true, estimatedMemoryMb: 28 },
    };
  }

  private static buildProjectileMotionPlan(
    planId: string,
    topic: UniversalLearningTopic,
    mode: TeachingMode,
    secondaryMode?: TeachingMode
  ): VisualTeachingPlan {
    return {
      planId,
      conceptId: 'projectile_motion',
      title: 'Projectile Motion & Parabolic Trajectory',
      learningObjective: 'Observe how horizontal velocity and vertical gravitational acceleration create a parabolic path.',
      mode,
      secondaryMode,
      entities: [
        { id: 'cannon', label: 'Launch Cannon', role: 'primary', color: '#64748b' },
        { id: 'projectile', label: 'Sphere Projectile', role: 'component', color: '#06b6d4' },
        { id: 'trajectory_arc', label: 'Parabolic Arc', role: 'indicator', color: '#f59e0b' },
      ],
      relationships: [
        { id: 'r1', sourceEntityId: 'cannon', targetEntityId: 'projectile', type: 'causes', label: 'Initial launch velocity at angle θ' },
      ],
      stages: [
        { stageId: 'pr1', order: 1, title: 'Launch Trajectory', narrative: 'Projectile travels forward at constant vx while gravity accelerates vy downward.', durationMs: 2500, visualState: { angle: 45, velocity: 25 } },
      ],
      interactiveControls: [
        { name: 'launchAngle', label: 'Launch Angle', unit: '°', min: 10, max: 80, defaultValue: 45, step: 5, widgetType: 'slider' },
        { name: 'initialVelocity', label: 'Initial Velocity', unit: 'm/s', min: 5, max: 40, defaultValue: 20, step: 1, widgetType: 'slider' },
      ],
      quickCheck: {
        id: 'qc_proj',
        prompt: 'On level ground with no air drag, which launch angle achieves maximum horizontal range?',
        options: [
          { id: 'o1', label: '45°', isCorrect: true, explanation: 'Correct! Range R = (v² sin(2θ)) / g is maximized when sin(2θ) = 1 (θ = 45°).' },
          { id: 'o2', label: '60°', isCorrect: false, explanation: '60° gives higher altitude but less horizontal range.' },
          { id: 'o3', label: '30°', isCorrect: false, explanation: '30° gives less flight time.' },
        ],
      },
      fallbackAvailable: true,
      accessibility: {
        ariaLabel: 'Projectile motion trajectory simulation',
        accessibleDescription: 'Interactive 3D projectile simulator with launch angle and velocity controls.',
        screenReaderSummary: 'Kinematic simulation demonstrating parabolic trajectory governed by gravity.',
        reducedMotionAlternativeText: 'Kinematics formulas and trajectory coordinate table.',
      },
      performance: { recommendedFps: 60, useWebGL: true, estimatedMemoryMb: 20 },
    };
  }

  private static buildSortingAlgorithmsPlan(
    planId: string,
    topic: UniversalLearningTopic,
    mode: TeachingMode,
    secondaryMode?: TeachingMode
  ): VisualTeachingPlan {
    return {
      planId,
      conceptId: 'sorting_algorithms_visual',
      title: 'Sorting Algorithms: Comparisons & Swaps',
      learningObjective: 'Visualize step-by-step element comparisons and swaps to understand O(n²) vs O(n log n) efficiency.',
      mode,
      secondaryMode,
      entities: [
        { id: 'array_bars', label: 'Array Element Bars', role: 'primary', color: '#38bdf8' },
        { id: 'comparison_pointer', label: 'Comparison Pointer', role: 'indicator', color: '#f59e0b' },
      ],
      relationships: [
        { id: 'r1', sourceEntityId: 'comparison_pointer', targetEntityId: 'array_bars', type: 'causes', label: 'Compares adjacent items and swaps if out of order' },
      ],
      stages: [
        { stageId: 'sort1', order: 1, title: 'Unsorted Array', narrative: 'Randomly distributed bar heights represent unsorted numbers.', durationMs: 2000, visualState: { step: 0 } },
        { stageId: 'sort2', order: 2, title: 'Pairwise Comparisons', narrative: 'Adjacent elements are evaluated in sequence.', durationMs: 2500, visualState: { step: 1 } },
        { stageId: 'sort3', order: 3, title: 'Sorted Partition', narrative: 'The largest remaining values settle into final positions.', durationMs: 2500, visualState: { step: 2 } },
      ],
      interactiveControls: [
        { name: 'stepSpeed', label: 'Step Speed', unit: 'x', min: 1, max: 5, defaultValue: 2, step: 1, widgetType: 'slider' },
      ],
      quickCheck: {
        id: 'qc_sort',
        prompt: 'In standard Bubble Sort on an array of N elements, what is the worst-case number of comparisons?',
        options: [
          { id: 'o1', label: 'O(N²)', isCorrect: true, explanation: 'Correct! Bubble sort compares every adjacent pair across N passes.' },
          { id: 'o2', label: 'O(N log N)', isCorrect: false, explanation: 'That is the complexity of Merge Sort or Quick Sort.' },
          { id: 'o3', label: 'O(N)', isCorrect: false, explanation: 'O(N) is only possible on an already sorted array.' },
        ],
      },
      fallbackAvailable: true,
      accessibility: {
        ariaLabel: 'Sorting algorithm visual comparison',
        accessibleDescription: 'Sequential bar visualization demonstrating comparisons and swaps.',
        screenReaderSummary: 'Visual sorting demonstration illustrating comparative swaps across an array.',
        reducedMotionAlternativeText: 'Textual step-by-step array trace.',
      },
      performance: { recommendedFps: 60, useWebGL: false, estimatedMemoryMb: 6 },
    };
  }

  private static buildSupplyDemandPlan(
    planId: string,
    topic: UniversalLearningTopic,
    mode: TeachingMode,
    secondaryMode?: TeachingMode
  ): VisualTeachingPlan {
    return {
      planId,
      conceptId: 'supply_demand_equilibrium',
      title: 'Supply and Demand: Market Equilibrium',
      learningObjective: 'Observe how the intersection of supply and demand curves establishes clearing price and quantity.',
      mode,
      secondaryMode,
      entities: [
        { id: 'demand_curve', label: 'Demand Curve (Downward)', role: 'primary', color: '#38bdf8' },
        { id: 'supply_curve', label: 'Supply Curve (Upward)', role: 'primary', color: '#10b981' },
        { id: 'equilibrium_point', label: 'Equilibrium (P*, Q*)', role: 'indicator', color: '#f59e0b' },
      ],
      relationships: [
        { id: 'r1', sourceEntityId: 'demand_curve', targetEntityId: 'equilibrium_point', type: 'proportional_to', label: 'Intersection determines market clearing price' },
      ],
      stages: [
        { stageId: 'sd1', order: 1, title: 'Equilibrium State', narrative: 'Where supply equals demand, markets clear without surplus or shortage.', durationMs: 2500, visualState: { shift: 0 } },
      ],
      interactiveControls: [
        { name: 'demandShift', label: 'Demand Level', unit: '', min: -30, max: 30, defaultValue: 0, step: 5, widgetType: 'slider' },
        { name: 'supplyShift', label: 'Supply Level', unit: '', min: -30, max: 30, defaultValue: 0, step: 5, widgetType: 'slider' },
      ],
      quickCheck: {
        id: 'qc_econ',
        prompt: 'If consumer demand increases while supply remains constant, what happens to the equilibrium price?',
        options: [
          { id: 'o1', label: 'Price increases', isCorrect: true, explanation: 'Correct! An outward shift in demand bids prices up along the supply curve.' },
          { id: 'o2', label: 'Price decreases', isCorrect: false, explanation: 'Incorrect: increased demand puts upward pressure on price.' },
          { id: 'o3', label: 'Price stays identical', isCorrect: false, explanation: 'Incorrect.' },
        ],
      },
      fallbackAvailable: true,
      accessibility: {
        ariaLabel: 'Supply and demand curve visualizer',
        accessibleDescription: 'Interactive economic coordinate plane showing demand and supply curve intersection.',
        screenReaderSummary: 'Microeconomics model showing market equilibrium determined by supply and demand.',
        reducedMotionAlternativeText: 'Supply and demand table with price and quantity values.',
      },
      performance: { recommendedFps: 60, useWebGL: false, estimatedMemoryMb: 5 },
    };
  }

  private static buildEnglishGrammarPlan(
    planId: string,
    topic: UniversalLearningTopic,
    mode: TeachingMode,
    secondaryMode?: TeachingMode
  ): VisualTeachingPlan {
    return {
      planId,
      conceptId: 'english_grammar_syntax',
      title: 'English Sentence Structure: Subject, Verb, Object',
      learningObjective: 'Inspect clause architecture and understand syntactic relationships between subject, predicate, and direct object.',
      mode,
      secondaryMode,
      entities: [
        { id: 'subject_node', label: 'Subject (Agent)', role: 'input', color: '#38bdf8' },
        { id: 'verb_node', label: 'Predicate Verb (Action)', role: 'primary', color: '#f59e0b' },
        { id: 'object_node', label: 'Direct Object (Recipient)', role: 'output', color: '#10b981' },
      ],
      relationships: [
        { id: 'r1', sourceEntityId: 'subject_node', targetEntityId: 'verb_node', type: 'causes', label: 'Performs action' },
        { id: 'r2', sourceEntityId: 'verb_node', targetEntityId: 'object_node', type: 'flows_to', label: 'Acts upon' },
      ],
      stages: [
        { stageId: 'g1', order: 1, title: 'Simple Sentence', narrative: 'The subject performs an action directly received by the object.', durationMs: 2500, visualState: { voice: 'active' } },
      ],
      interactiveControls: [
        { name: 'voiceMode', label: 'Sentence Voice (0: Active, 1: Passive)', min: 0, max: 1, defaultValue: 0, step: 1, widgetType: 'slider' },
      ],
      quickCheck: {
        id: 'qc_gram',
        prompt: 'In the sentence "The scientist observed the reaction", what role does "the reaction" play?',
        options: [
          { id: 'o1', label: 'Direct Object', isCorrect: true, explanation: 'Correct! The reaction receives the action of observing.' },
          { id: 'o2', label: 'Subject', isCorrect: false, explanation: 'The scientist is the subject performing the action.' },
          { id: 'o3', label: 'Predicate Verb', isCorrect: false, explanation: '"Observed" is the verb.' },
        ],
      },
      fallbackAvailable: true,
      accessibility: {
        ariaLabel: 'Syntactic grammar sentence tree visualizer',
        accessibleDescription: 'Interactive diagram mapping grammatical roles in sentence construction.',
        screenReaderSummary: 'Syntactic breakdown of subject, verb, and object relationships.',
        reducedMotionAlternativeText: 'Grammatical parsing table with parts of speech.',
      },
      performance: { recommendedFps: 60, useWebGL: false, estimatedMemoryMb: 5 },
    };
  }

  private static buildGenericFallbackPlan(
    planId: string,
    topic: UniversalLearningTopic,
    mode: TeachingMode,
    secondaryMode?: TeachingMode
  ): VisualTeachingPlan {
    const raw = topic.rawUserTopic;
    return {
      planId,
      conceptId: topic.topicId,
      title: `${raw}: Essential Concept Framework`,
      learningObjective: topic.learningObjectives[0] || `Understand the governing mechanism of ${raw}.`,
      mode: '2D_FALLBACK',
      secondaryMode: 'INTERACTIVE_VISUAL',
      entities: [
        { id: 'input_node', label: 'Primary Inputs & Conditions', role: 'input', color: '#38bdf8' },
        { id: 'core_node', label: `${raw} Mechanism`, role: 'primary', color: '#f59e0b' },
        { id: 'output_node', label: 'Observable Outcomes & Equilibrium', role: 'output', color: '#10b981' },
      ],
      relationships: [
        { id: 'r1', sourceEntityId: 'input_node', targetEntityId: 'core_node', type: 'causes', label: 'Drives mechanism' },
        { id: 'r2', sourceEntityId: 'core_node', targetEntityId: 'output_node', type: 'flows_to', label: 'Produces measurable effect' },
      ],
      stages: [
        { stageId: 'gen1', order: 1, title: 'Concept Identification', narrative: `Examine the foundational principles governing ${raw}.`, durationMs: 2500, visualState: { step: 1 } },
        { stageId: 'gen2', order: 2, title: 'Relational Causality', narrative: `Changes in governing parameters produce proportional shifts in outcome.`, durationMs: 2500, visualState: { step: 2 } },
      ],
      interactiveControls: [
        { name: 'intensity', label: 'System Variable Intensity', min: 1, max: 10, defaultValue: 5, step: 1, widgetType: 'slider' },
      ],
      quickCheck: {
        id: `qc_${topic.topicId}`,
        prompt: `Which principle is fundamental to understanding ${raw}?`,
        options: [
          { id: 'o1', label: topic.keyPrinciples[0] || 'Dynamic equilibrium and causal relationships', isCorrect: true, explanation: 'Correct! This forms the scientific foundation of the concept.' },
          { id: 'o2', label: 'Unchecked random behavior', isCorrect: false, explanation: 'Concepts operate under deterministic natural or logical laws.' },
          { id: 'o3', label: 'Isolated static state with zero interactions', isCorrect: false, explanation: 'Natural systems interact dynamically.' },
        ],
      },
      fallbackAvailable: true,
      accessibility: {
        ariaLabel: `Accessible visual framework for ${raw}`,
        accessibleDescription: `Structured relational node network for ${raw}.`,
        screenReaderSummary: `Structured concept breakdown covering inputs, core mechanism, and outcomes for ${raw}.`,
        reducedMotionAlternativeText: `Annotated summary of principles for ${raw}.`,
      },
      performance: { recommendedFps: 60, useWebGL: false, estimatedMemoryMb: 5 },
    };
  }
}
