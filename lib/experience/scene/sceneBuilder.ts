/**
 * Universal 3D Scene System — Scene Builder
 *
 * Provides procedural, deterministic scene builders for proof topics and
 * a universal semantic scene generator for arbitrary learning topics.
 */

import { UniversalSceneDefinition } from './sceneDefinition';
import { SceneObjectDefinition } from './sceneObject';
import { SceneRelationshipDefinition } from './sceneRelationship';
import { SceneInteractionConfig } from './sceneInteraction';
import { SceneAnimationDefinition } from './sceneAnimation';
import type { LearningKnowledgeBundle } from '../../intelligence/sources';

export class UniversalSceneBuilder {
  /**
   * PROOF CASE #1: Newton's Laws of Motion & Forces
   */
  static buildNewtonsLawsScene(): UniversalSceneDefinition {
    const objects: SceneObjectDefinition[] = [
      // 1. Frictionless / adjustable track surface
      {
        id: 'track_surface',
        name: 'Track Surface',
        semanticMeaning: 'Reference frame and normal contact surface supporting the body',
        visualType: 'box',
        position: [0, -0.2, 0],
        scale: [12, 0.4, 2.5],
        color: '#1a1d2e',
        metalness: 0.8,
        roughness: 0.2,
        category: 'environment',
        educationalLabel: 'Friction Surface (μ)',
      },
      // 2. The Cart / Mass body
      {
        id: 'cart_body',
        name: 'Experimental Cart',
        semanticMeaning: 'Inertial mass body subject to Newton’s 2nd Law (F = ma)',
        visualType: 'box',
        position: [-2.5, 0.5, 0],
        scale: [1.8, 0.8, 1.2],
        color: '#00f5ff',
        metalness: 0.5,
        roughness: 0.3,
        selectable: true,
        highlightable: true,
        category: 'primary',
        educationalLabel: 'Mass Body (m)',
        educationalDescription: 'The object resisting change in its state of motion (inertia).',
        data: { mass: 5, velocity: 0, acceleration: 4 },
      },
      // Wheels
      {
        id: 'wheel_fl',
        name: 'Front Left Wheel',
        semanticMeaning: 'Rotational contact reducing friction to isolate net horizontal force',
        visualType: 'cylinder',
        position: [-1.9, 0.1, 0.65],
        scale: [0.4, 0.15, 0.4],
        rotation: [Math.PI / 2, 0, 0],
        color: '#ffb700',
        category: 'secondary',
      },
      {
        id: 'wheel_fr',
        name: 'Front Right Wheel',
        semanticMeaning: 'Rotational contact',
        visualType: 'cylinder',
        position: [-1.9, 0.1, -0.65],
        scale: [0.4, 0.15, 0.4],
        rotation: [Math.PI / 2, 0, 0],
        color: '#ffb700',
        category: 'secondary',
      },
      {
        id: 'wheel_bl',
        name: 'Back Left Wheel',
        semanticMeaning: 'Rotational contact',
        visualType: 'cylinder',
        position: [-3.1, 0.1, 0.65],
        scale: [0.4, 0.15, 0.4],
        rotation: [Math.PI / 2, 0, 0],
        color: '#ffb700',
        category: 'secondary',
      },
      {
        id: 'wheel_br',
        name: 'Back Right Wheel',
        semanticMeaning: 'Rotational contact',
        visualType: 'cylinder',
        position: [-3.1, 0.1, -0.65],
        scale: [0.4, 0.15, 0.4],
        rotation: [Math.PI / 2, 0, 0],
        color: '#ffb700',
        category: 'secondary',
      },
      // 3. Dynamic Force Vector Arrow
      {
        id: 'force_arrow',
        name: 'Applied Force Vector (F)',
        semanticMeaning: 'Net horizontal external force pulling the cart forward',
        visualType: 'arrow',
        position: [-1.5, 0.5, 0],
        scale: [1.8, 0.3, 0.3],
        color: '#ff0055',
        emissive: '#ff0055',
        emissiveIntensity: 0.6,
        selectable: true,
        highlightable: true,
        category: 'indicator',
        educationalLabel: 'Applied Force Vector F = 20 N',
        educationalDescription: 'Vector indicating magnitude and direction of applied external force.',
      },
      // 4. Acceleration Readout Indicator
      {
        id: 'acceleration_gauge',
        name: 'Acceleration Indicator (a)',
        semanticMeaning: 'Resulting rate of change of velocity: a = F / m',
        visualType: 'sphere',
        position: [-2.5, 1.4, 0],
        scale: [0.35, 0.35, 0.35],
        color: '#00ff88',
        emissive: '#00ff88',
        emissiveIntensity: 0.8,
        category: 'indicator',
        educationalLabel: 'a = 4.0 m/s²',
      },
    ];

    const relationships: SceneRelationshipDefinition[] = [
      {
        id: 'rel_force_causes_accel',
        sourceObjectId: 'force_arrow',
        targetObjectId: 'acceleration_gauge',
        type: 'causes',
        label: 'F / m = a (Newton’s 2nd Law)',
        color: '#00ff88',
        animated: true,
      },
      {
        id: 'rel_surface_supports_cart',
        sourceObjectId: 'track_surface',
        targetObjectId: 'cart_body',
        type: 'connectsTo',
        label: 'Normal Force N = mg',
        color: '#708090',
      },
    ];

    const interactions: SceneInteractionConfig[] = [
      {
        id: 'slider_force',
        parameterName: 'appliedForce',
        label: 'Applied Force (F)',
        unit: 'N',
        widgetType: 'slider',
        min: 0,
        max: 50,
        step: 5,
        defaultValue: 20,
        educationalImpact: 'Directly proportional to acceleration (F ∝ a). Doubling force doubles acceleration.',
        affectsProperties: ['force_arrow.scale.x', 'cart_body.acceleration'],
      },
      {
        id: 'slider_mass',
        parameterName: 'cartMass',
        label: 'Cart Mass (m)',
        unit: 'kg',
        widgetType: 'slider',
        min: 1,
        max: 20,
        step: 1,
        defaultValue: 5,
        educationalImpact: 'Inversely proportional to acceleration (a ∝ 1/m). Doubling mass cuts acceleration in half.',
        affectsProperties: ['cart_body.scale', 'cart_body.acceleration'],
      },
      {
        id: 'slider_friction',
        parameterName: 'frictionCoefficient',
        label: 'Friction Coefficient (μ)',
        unit: '',
        widgetType: 'slider',
        min: 0,
        max: 0.5,
        step: 0.05,
        defaultValue: 0,
        educationalImpact: 'Opposes motion: F_net = F_applied - μ * m * g',
      },
    ];

    const animations: SceneAnimationDefinition[] = [
      {
        id: 'anim_cart_accel',
        targetObjectId: 'cart_body',
        type: 'translate',
        speed: 1.0,
        axis: [1, 0, 0],
        conditionParameter: 'appliedForce',
      },
      {
        id: 'anim_accel_pulse',
        targetObjectId: 'acceleration_gauge',
        type: 'pulse',
        speed: 2.0,
        minScale: 0.9,
        maxScale: 1.15,
      },
    ];

    return {
      id: 'scene_newtons_laws',
      title: "Newton's 2nd Law: Force, Mass & Acceleration",
      topicId: 'newtons_laws',
      environmentType: 'physics_track',
      backgroundColor: '#07090e',
      camera: {
        initialPosition: [0, 3, 7],
        lookAt: [0, 0.5, 0],
        fov: 50,
        orbitControls: true,
        minDistance: 3,
        maxDistance: 15,
      },
      lighting: {
        ambientColor: '#ffffff',
        ambientIntensity: 0.6,
        directionalColor: '#00f5ff',
        directionalIntensity: 1.2,
        directionalPosition: [5, 10, 5],
      },
      objects,
      relationships,
      interactions,
      animations,
      showGroundGrid: true,
      groundGridSize: 15,
    };
  }

  /**
   * PROOF CASE #2: Photosynthesis & Cellular Energy
   */
  static buildPhotosynthesisScene(): UniversalSceneDefinition {
    const objects: SceneObjectDefinition[] = [
      // Leaf Base Structure
      {
        id: 'leaf_structure',
        name: 'Plant Leaf Cross-Section',
        semanticMeaning: 'Mesophyll tissue containing chloroplast-rich cells',
        visualType: 'box',
        position: [0, -0.4, 0],
        scale: [7, 0.5, 4.5],
        color: '#1a4d2e',
        roughness: 0.6,
        category: 'environment',
        educationalLabel: 'Leaf Mesophyll Layer',
      },
      // Central Chloroplast Organelle
      {
        id: 'chloroplast_organelle',
        name: 'Chloroplast Organelle',
        semanticMeaning: 'Double-membraned plant organelle where photosynthesis occurs',
        visualType: 'capsule',
        position: [0, 0.6, 0],
        scale: [2.2, 1.2, 1.4],
        color: '#00ff66',
        emissive: '#00aa44',
        emissiveIntensity: 0.3,
        selectable: true,
        highlightable: true,
        category: 'primary',
        educationalLabel: 'Chloroplast (Site of Reactions)',
        educationalDescription: 'Contains thylakoids (light reactions) and stroma (Calvin cycle).',
      },
      // Incoming Sunlight Rays (Photons)
      {
        id: 'sunlight_rays',
        name: 'Solar Radiation (Photons)',
        semanticMeaning: 'Light energy absorbed by chlorophyll pigments to split H₂O',
        visualType: 'arrow',
        position: [-2.2, 2.4, 0],
        scale: [0.8, 1.8, 0.8],
        rotation: [0, 0, -Math.PI / 4],
        color: '#ffea00',
        emissive: '#ffea00',
        emissiveIntensity: 0.9,
        category: 'indicator',
        educationalLabel: 'Light Energy (hν)',
      },
      // Input Molecules: CO2 and H2O
      {
        id: 'input_co2',
        name: 'Carbon Dioxide (6 CO₂)',
        semanticMeaning: 'Inorganic carbon source absorbed from air through stomata',
        visualType: 'sphere',
        position: [-2.2, 0.6, 1.2],
        scale: [0.45, 0.45, 0.45],
        color: '#8888aa',
        category: 'secondary',
        educationalLabel: '6 CO₂ (Atmospheric Input)',
      },
      {
        id: 'input_h2o',
        name: 'Water (6 H₂O)',
        semanticMeaning: 'Electron donor transported from roots through xylem',
        visualType: 'sphere',
        position: [-2.2, 0.6, -1.2],
        scale: [0.45, 0.45, 0.45],
        color: '#00a8ff',
        category: 'secondary',
        educationalLabel: '6 H₂O (Root Absorption)',
      },
      // Output Molecules: Glucose (C6H12O6) and Oxygen (6 O2)
      {
        id: 'output_glucose',
        name: 'Glucose (C₆H₁₂O₆)',
        semanticMeaning: 'Chemical energy stored in synthesized hexose sugar bonds',
        visualType: 'box',
        position: [2.3, 0.6, 0.8],
        scale: [0.7, 0.7, 0.7],
        color: '#ffa500',
        emissive: '#ffa500',
        emissiveIntensity: 0.4,
        selectable: true,
        category: 'primary',
        educationalLabel: 'C₆H₁₂O₆ (Glucose Energy)',
      },
      {
        id: 'output_oxygen',
        name: 'Oxygen (6 O₂)',
        semanticMeaning: 'Byproduct of photolysis released back into atmosphere',
        visualType: 'sphere',
        position: [2.3, 0.6, -0.8],
        scale: [0.45, 0.45, 0.45],
        color: '#00f5ff',
        category: 'secondary',
        educationalLabel: '6 O₂ (Oxygen Byproduct)',
      },
    ];

    const relationships: SceneRelationshipDefinition[] = [
      {
        id: 'rel_sunlight_to_chloroplast',
        sourceObjectId: 'sunlight_rays',
        targetObjectId: 'chloroplast_organelle',
        type: 'flowsTo',
        label: 'Light-Dependent Reactions',
        color: '#ffea00',
        animated: true,
      },
      {
        id: 'rel_inputs_to_chloroplast',
        sourceObjectId: 'input_co2',
        targetObjectId: 'chloroplast_organelle',
        type: 'flowsTo',
        label: 'Calvin Cycle Fixation',
        color: '#8888aa',
        animated: true,
      },
      {
        id: 'rel_chloroplast_to_glucose',
        sourceObjectId: 'chloroplast_organelle',
        targetObjectId: 'output_glucose',
        type: 'transformsInto',
        label: '6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂',
        color: '#00ff66',
        animated: true,
      },
    ];

    const interactions: SceneInteractionConfig[] = [
      {
        id: 'slider_light_intensity',
        parameterName: 'lightIntensity',
        label: 'Sunlight Intensity',
        unit: '%',
        widgetType: 'slider',
        min: 0,
        max: 100,
        defaultValue: 80,
        educationalImpact: 'Provides energy for ATP and NADPH synthesis. At 0%, photosynthesis halts completely.',
      },
      {
        id: 'slider_co2_level',
        parameterName: 'co2Level',
        label: 'CO₂ Concentration',
        unit: 'ppm',
        widgetType: 'slider',
        min: 0,
        max: 1000,
        step: 50,
        defaultValue: 400,
        educationalImpact: 'Substrate for RuBisCO enzyme in carbon fixation.',
      },
      {
        id: 'slider_water_supply',
        parameterName: 'waterSupply',
        label: 'Water Availability',
        unit: '%',
        widgetType: 'slider',
        min: 0,
        max: 100,
        defaultValue: 90,
        educationalImpact: 'Source of electrons. Without water, photolysis ceases and stomata close.',
      },
    ];

    const animations: SceneAnimationDefinition[] = [
      {
        id: 'anim_chloroplast_pulse',
        targetObjectId: 'chloroplast_organelle',
        type: 'pulse',
        speed: 1.5,
        minScale: 0.96,
        maxScale: 1.04,
      },
      {
        id: 'anim_glucose_spin',
        targetObjectId: 'output_glucose',
        type: 'rotate',
        speed: 0.8,
        axis: [0, 1, 0],
      },
    ];

    return {
      id: 'scene_photosynthesis',
      title: 'Photosynthesis: Light Reactions & Calvin Cycle',
      topicId: 'photosynthesis',
      environmentType: 'biology_cell',
      backgroundColor: '#050f08',
      camera: {
        initialPosition: [0, 3.5, 6.5],
        lookAt: [0, 0.4, 0],
        fov: 50,
        orbitControls: true,
      },
      lighting: {
        ambientColor: '#ffffff',
        ambientIntensity: 0.7,
        directionalColor: '#ffea00',
        directionalIntensity: 1.5,
        directionalPosition: [-4, 8, 3],
      },
      objects,
      relationships,
      interactions,
      animations,
      showGroundGrid: true,
      groundGridSize: 12,
    };
  }

  /**
   * PROOF CASE #3: Electric Circuits & Ohm's Law
   */
  static buildElectricCircuitsScene(): UniversalSceneDefinition {
    const objects: SceneObjectDefinition[] = [
      // Circuit Board
      {
        id: 'breadboard',
        name: 'Circuit Board',
        semanticMeaning: 'Insulating platform supporting electrical closed loop',
        visualType: 'box',
        position: [0, -0.3, 0],
        scale: [7, 0.3, 5],
        color: '#121820',
        metalness: 0.4,
        category: 'environment',
        educationalLabel: 'Closed Circuit Loop',
      },
      // DC Battery / Voltage Source
      {
        id: 'battery_source',
        name: 'DC Power Source (V)',
        semanticMeaning: 'Chemical potential difference driving electric charge through circuit',
        visualType: 'cylinder',
        position: [-2.2, 0.4, 0],
        scale: [0.7, 1.2, 0.7],
        color: '#e63946',
        metalness: 0.7,
        selectable: true,
        highlightable: true,
        category: 'primary',
        educationalLabel: 'Battery (V = 12 V)',
        educationalDescription: 'Creates an electric field establishing voltage differential.',
      },
      // Switch
      {
        id: 'circuit_switch',
        name: 'Toggle Switch',
        semanticMeaning: 'Mechanical device that opens or closes the conductive path',
        visualType: 'box',
        position: [0, 0.2, 1.8],
        scale: [0.8, 0.25, 0.4],
        color: '#457b9d',
        selectable: true,
        category: 'secondary',
        educationalLabel: 'Switch (Closed)',
      },
      // Resistor
      {
        id: 'resistor_load',
        name: 'Resistor (R)',
        semanticMeaning: 'Component dissipating energy, resisting charge flow: R = V / I',
        visualType: 'cylinder',
        position: [2.2, 0.3, 0],
        scale: [0.5, 1.0, 0.5],
        rotation: [0, 0, Math.PI / 2],
        color: '#a8dadc',
        selectable: true,
        highlightable: true,
        category: 'primary',
        educationalLabel: 'Resistor (R = 10 Ω)',
      },
      // Light Bulb / Load Indicator
      {
        id: 'light_bulb',
        name: 'Load Indicator (Lamp)',
        semanticMeaning: 'Converts electrical energy into light; glow intensity reflects current (I)',
        visualType: 'sphere',
        position: [0, 0.6, -1.8],
        scale: [0.65, 0.65, 0.65],
        color: '#ffea00',
        emissive: '#ffea00',
        emissiveIntensity: 0.9,
        selectable: true,
        category: 'indicator',
        educationalLabel: 'Lamp Glow (I = 1.2 A)',
      },
    ];

    const relationships: SceneRelationshipDefinition[] = [
      {
        id: 'rel_battery_to_bulb',
        sourceObjectId: 'battery_source',
        targetObjectId: 'light_bulb',
        type: 'flowsTo',
        label: 'Conventional Current (I = V / R)',
        color: '#ffea00',
        animated: true,
        flowSpeed: 2.0,
      },
      {
        id: 'rel_bulb_to_resistor',
        sourceObjectId: 'light_bulb',
        targetObjectId: 'resistor_load',
        type: 'connectsTo',
        color: '#00f5ff',
      },
      {
        id: 'rel_resistor_to_switch',
        sourceObjectId: 'resistor_load',
        targetObjectId: 'circuit_switch',
        type: 'connectsTo',
        color: '#00f5ff',
      },
      {
        id: 'rel_switch_to_battery',
        sourceObjectId: 'circuit_switch',
        targetObjectId: 'battery_source',
        type: 'flowsTo',
        color: '#00f5ff',
        animated: true,
      },
    ];

    const interactions: SceneInteractionConfig[] = [
      {
        id: 'slider_voltage',
        parameterName: 'voltage',
        label: 'Voltage (V)',
        unit: 'V',
        widgetType: 'slider',
        min: 1,
        max: 24,
        step: 1,
        defaultValue: 12,
        educationalImpact: 'Higher voltage exerts greater electromotive force, increasing current proportionally.',
      },
      {
        id: 'slider_resistance',
        parameterName: 'resistance',
        label: 'Resistance (R)',
        unit: 'Ω',
        widgetType: 'slider',
        min: 1,
        max: 50,
        step: 1,
        defaultValue: 10,
        educationalImpact: 'Higher resistance restricts current flow (I = V / R), dimming the bulb.',
      },
      {
        id: 'toggle_switch',
        parameterName: 'isSwitchClosed',
        label: 'Switch State',
        widgetType: 'toggle',
        defaultValue: true,
        educationalImpact: 'An open circuit has infinite resistance; current immediately drops to 0.',
      },
    ];

    const animations: SceneAnimationDefinition[] = [
      {
        id: 'anim_bulb_glow',
        targetObjectId: 'light_bulb',
        type: 'pulse',
        speed: 3.0,
        minScale: 0.95,
        maxScale: 1.05,
      },
    ];

    return {
      id: 'scene_electric_circuits',
      title: "Electric Circuits: Ohm's Law (V = I × R)",
      topicId: 'electric_circuits',
      environmentType: 'laboratory',
      backgroundColor: '#0a0d14',
      camera: {
        initialPosition: [0, 4.5, 6],
        lookAt: [0, 0.2, 0],
        fov: 50,
        orbitControls: true,
      },
      lighting: {
        ambientColor: '#ffffff',
        ambientIntensity: 0.6,
        directionalColor: '#00f5ff',
        directionalIntensity: 1.2,
        directionalPosition: [3, 8, 4],
      },
      objects,
      relationships,
      interactions,
      animations,
      showGroundGrid: true,
      groundGridSize: 10,
    };
  }

  /**
   * PROOF CASE #4: Solar System & Planetary Orbits
   */
  static buildSolarSystemScene(): UniversalSceneDefinition {
    const objects: SceneObjectDefinition[] = [
      // The Sun
      {
        id: 'sun_central',
        name: 'The Sun (Sol)',
        semanticMeaning: 'Central star comprising 99.86% of solar system mass; gravitational anchor',
        visualType: 'sphere',
        position: [0, 0, 0],
        scale: [1.6, 1.6, 1.6],
        color: '#ffaa00',
        emissive: '#ff7700',
        emissiveIntensity: 1.0,
        selectable: true,
        highlightable: true,
        category: 'primary',
        educationalLabel: 'Sun (Gravitational Center)',
      },
      // Mercury
      {
        id: 'planet_mercury',
        name: 'Mercury',
        semanticMeaning: 'Innermost planet: highest orbital velocity (47.4 km/s), 88-day orbital period',
        visualType: 'sphere',
        position: [2.1, 0, 0],
        scale: [0.22, 0.22, 0.22],
        color: '#9e9e9e',
        selectable: true,
        category: 'secondary',
        educationalLabel: 'Mercury (T = 88 days)',
      },
      // Venus
      {
        id: 'planet_venus',
        name: 'Venus',
        semanticMeaning: 'Dense atmosphere, retrograde rotation, 225-day orbital period',
        visualType: 'sphere',
        position: [3.0, 0, 0],
        scale: [0.35, 0.35, 0.35],
        color: '#e0a96d',
        selectable: true,
        category: 'secondary',
        educationalLabel: 'Venus (T = 225 days)',
      },
      // Earth
      {
        id: 'planet_earth',
        name: 'Earth',
        semanticMeaning: 'Reference orbit (1 AU), liquid water, 365.25-day period',
        visualType: 'sphere',
        position: [4.0, 0, 0],
        scale: [0.38, 0.38, 0.38],
        color: '#00a8ff',
        emissive: '#003366',
        emissiveIntensity: 0.3,
        selectable: true,
        highlightable: true,
        category: 'primary',
        educationalLabel: 'Earth (1 AU, T = 365 days)',
      },
      // Mars
      {
        id: 'planet_mars',
        name: 'Mars',
        semanticMeaning: 'Outer terrestrial planet: 1.52 AU, 687-day orbital period',
        visualType: 'sphere',
        position: [5.2, 0, 0],
        scale: [0.28, 0.28, 0.28],
        color: '#d64527',
        selectable: true,
        category: 'secondary',
        educationalLabel: 'Mars (1.52 AU, T = 687 days)',
      },
      // Jupiter
      {
        id: 'planet_jupiter',
        name: 'Jupiter',
        semanticMeaning: 'Gas giant: 5.2 AU, 11.86 Earth years period; Kepler’s 3rd Law (T² ∝ a³)',
        visualType: 'sphere',
        position: [6.8, 0, 0],
        scale: [0.75, 0.75, 0.75],
        color: '#d4a373',
        selectable: true,
        category: 'secondary',
        educationalLabel: 'Jupiter (5.2 AU, T = 12 years)',
      },
    ];

    const relationships: SceneRelationshipDefinition[] = [
      {
        id: 'rel_gravity_mercury',
        sourceObjectId: 'sun_central',
        targetObjectId: 'planet_mercury',
        type: 'causes',
        label: 'Gravitational Attractor (F = GMm/r²)',
        color: '#ffaa00',
      },
      {
        id: 'rel_gravity_earth',
        sourceObjectId: 'sun_central',
        targetObjectId: 'planet_earth',
        type: 'causes',
        label: 'Orbital Resonance',
        color: '#00a8ff',
      },
    ];

    const interactions: SceneInteractionConfig[] = [
      {
        id: 'slider_orbit_speed',
        parameterName: 'simulationSpeed',
        label: 'Orbit Time Scale',
        unit: 'x',
        widgetType: 'slider',
        min: 0.5,
        max: 5.0,
        step: 0.5,
        defaultValue: 1.0,
        educationalImpact: 'Accelerates elapsed orbital time to demonstrate relative Keplerian periods.',
      },
      {
        id: 'select_focus_planet',
        parameterName: 'focusedPlanet',
        label: 'Focus Celestial Body',
        widgetType: 'select',
        options: [
          { value: 'all', label: 'Entire System View' },
          { value: 'planet_mercury', label: 'Mercury' },
          { value: 'planet_earth', label: 'Earth' },
          { value: 'planet_mars', label: 'Mars' },
          { value: 'planet_jupiter', label: 'Jupiter' },
        ],
        defaultValue: 'all',
        educationalImpact: 'Centers camera on selected body to inspect orbital characteristics.',
      },
    ];

    const animations: SceneAnimationDefinition[] = [
      {
        id: 'anim_orbit_mercury',
        targetObjectId: 'planet_mercury',
        type: 'orbit',
        speed: 4.15,
        radius: 2.1,
        center: [0, 0, 0],
      },
      {
        id: 'anim_orbit_earth',
        targetObjectId: 'planet_earth',
        type: 'orbit',
        speed: 1.0,
        radius: 4.0,
        center: [0, 0, 0],
      },
      {
        id: 'anim_orbit_mars',
        targetObjectId: 'planet_mars',
        type: 'orbit',
        speed: 0.53,
        radius: 5.2,
        center: [0, 0, 0],
      },
    ];

    return {
      id: 'scene_solar_system',
      title: 'Solar System: Keplerian Orbital Mechanics',
      topicId: 'solar_system',
      environmentType: 'deep_space',
      backgroundColor: '#020308',
      camera: {
        initialPosition: [0, 8, 12],
        lookAt: [0, 0, 0],
        fov: 55,
        orbitControls: true,
        maxDistance: 30,
      },
      lighting: {
        ambientColor: '#334466',
        ambientIntensity: 0.4,
        directionalColor: '#ffea88',
        directionalIntensity: 2.0,
        directionalPosition: [0, 2, 0],
      },
      objects,
      relationships,
      interactions,
      animations,
      showGroundGrid: false,
    };
  }

  /**
   * PROOF CASE #5: Fractions & Part-to-Whole Reasoning
   */
  static buildFractionsScene(): UniversalSceneDefinition {
    const objects: SceneObjectDefinition[] = [
      // Base Platform
      {
        id: 'math_slate',
        name: 'Mathematical Slate',
        semanticMeaning: 'Geometric representation frame for unit wholes',
        visualType: 'box',
        position: [0, -0.3, 0],
        scale: [6, 0.3, 4],
        color: '#131924',
        category: 'environment',
      },
      // Fraction Disc 1: Left (e.g. 3/4)
      {
        id: 'fraction_disc_whole',
        name: 'Whole Unit Disc (1.0)',
        semanticMeaning: 'The reference unit partitioned into equal fractional segments',
        visualType: 'cylinder',
        position: [-1.6, 0.4, 0],
        scale: [1.4, 0.3, 1.4],
        color: '#00f5ff',
        metalness: 0.3,
        selectable: true,
        highlightable: true,
        category: 'primary',
        educationalLabel: 'Numerator / Denominator (e.g. 3/4)',
        educationalDescription: 'The denominator defines part size; the numerator counts parts taken.',
      },
      // Equivalent Comparison Disc 2: Right (e.g. 6/8)
      {
        id: 'fraction_disc_equiv',
        name: 'Equivalent Fraction Disc',
        semanticMeaning: 'Proves equivalence: 3/4 = 6/8 = 75%',
        visualType: 'cylinder',
        position: [1.6, 0.4, 0],
        scale: [1.4, 0.3, 1.4],
        color: '#ffb700',
        metalness: 0.3,
        selectable: true,
        highlightable: true,
        category: 'primary',
        educationalLabel: 'Equivalent Partition (6/8)',
      },
      // Fraction Bar Visualizer
      {
        id: 'fraction_bar_indicator',
        name: 'Linear Magnitude Bar',
        semanticMeaning: 'Linear number line projection showing 0.0 to 1.0 continuum',
        visualType: 'box',
        position: [0, 0.3, 1.4],
        scale: [3.8, 0.2, 0.4],
        color: '#00ff88',
        emissive: '#00ff88',
        emissiveIntensity: 0.4,
        category: 'indicator',
        educationalLabel: 'Number Line Value: 0.75 (75%)',
      },
    ];

    const relationships: SceneRelationshipDefinition[] = [
      {
        id: 'rel_equiv_fractions',
        sourceObjectId: 'fraction_disc_whole',
        targetObjectId: 'fraction_disc_equiv',
        type: 'transformsInto',
        label: 'Multiply numerator and denominator by 2',
        color: '#00ff88',
        animated: true,
      },
    ];

    const interactions: SceneInteractionConfig[] = [
      {
        id: 'slider_denominator',
        parameterName: 'denominator',
        label: 'Denominator (Total Equal Parts)',
        widgetType: 'slider',
        min: 1,
        max: 12,
        step: 1,
        defaultValue: 4,
        educationalImpact: 'Defines how many equal parts the whole is divided into.',
      },
      {
        id: 'slider_numerator',
        parameterName: 'numerator',
        label: 'Numerator (Selected Parts)',
        widgetType: 'slider',
        min: 0,
        max: 12,
        step: 1,
        defaultValue: 3,
        educationalImpact: 'Selects the quantity of equal parts being represented.',
      },
    ];

    const animations: SceneAnimationDefinition[] = [
      {
        id: 'anim_bar_pulse',
        targetObjectId: 'fraction_bar_indicator',
        type: 'pulse',
        speed: 1.2,
        minScale: 0.98,
        maxScale: 1.02,
      },
    ];

    return {
      id: 'scene_fractions',
      title: 'Fractions: Part-to-Whole & Equivalence',
      topicId: 'fractions',
      environmentType: 'abstract_math',
      backgroundColor: '#0a0d16',
      camera: {
        initialPosition: [0, 4.5, 5],
        lookAt: [0, 0.2, 0],
        fov: 50,
        orbitControls: true,
      },
      lighting: {
        ambientColor: '#ffffff',
        ambientIntensity: 0.7,
        directionalColor: '#00f5ff',
        directionalIntensity: 1.4,
        directionalPosition: [2, 6, 3],
      },
      objects,
      relationships,
      interactions,
      animations,
      showGroundGrid: true,
      groundGridSize: 8,
    };
  }

  /**
   * PROOF CASE #7: Direct Current (DC) Electric Motor
   *
   * Real, physical, meaningful electromagnetic simulation:
   * Stator permanent magnets, armature coil loop, central axle, split-ring commutator,
   * carbon brushes, DC battery, magnetic flux lines, and Lorentz force torque vectors.
   */
  static buildElectricMotorScene(): UniversalSceneDefinition {
    const objects: SceneObjectDefinition[] = [
      // 1. Structural base platform
      {
        id: 'stator_base',
        name: 'Stator Chassis',
        semanticMeaning: 'Structural frame mounting permanent magnets and bearing blocks',
        visualType: 'box',
        position: [0, -0.2, 0],
        scale: [7.5, 0.4, 5.0],
        color: '#131622',
        metalness: 0.8,
        roughness: 0.3,
        category: 'environment',
        educationalLabel: 'Chassis Platform',
      },
      // 2. North Permanent Magnet (Stator N - Red)
      {
        id: 'magnet_north',
        name: 'Permanent Magnet (North Pole)',
        semanticMeaning: 'Static magnetic field source emitting B-field flux lines',
        visualType: 'box',
        position: [-2.4, 0.9, 0],
        scale: [1.2, 1.8, 2.4],
        color: '#ff3344',
        metalness: 0.6,
        roughness: 0.2,
        selectable: true,
        highlightable: true,
        category: 'primary',
        educationalLabel: 'Stator Magnet (N)',
        educationalDescription: 'The stationary North pole establishes uniform horizontal magnetic flux (B) toward the South pole.',
      },
      // 3. South Permanent Magnet (Stator S - Blue)
      {
        id: 'magnet_south',
        name: 'Permanent Magnet (South Pole)',
        semanticMeaning: 'Static magnetic sink receiving B-field flux lines',
        visualType: 'box',
        position: [2.4, 0.9, 0],
        scale: [1.2, 1.8, 2.4],
        color: '#2979ff',
        metalness: 0.6,
        roughness: 0.2,
        selectable: true,
        highlightable: true,
        category: 'primary',
        educationalLabel: 'Stator Magnet (S)',
        educationalDescription: 'The stationary South pole terminates the magnetic flux lines across the armature air gap.',
      },
      // 4. Central Rotor Axle Shaft
      {
        id: 'rotor_shaft',
        name: 'Rotor Shaft (Axle)',
        semanticMeaning: 'Mechanical axis of rotation transmitting mechanical torque',
        visualType: 'cylinder',
        position: [0, 0.9, 0],
        scale: [0.12, 4.4, 0.12],
        rotation: [Math.PI / 2, 0, 0],
        color: '#9aa0b4',
        metalness: 0.9,
        roughness: 0.1,
        selectable: true,
        category: 'secondary',
        educationalLabel: 'Drive Shaft (Output τ)',
        educationalDescription: 'Transfers generated mechanical torque (τ = r × F) to external load.',
      },
      // 5. Conductive Armature Coil (Rotating Wire Loop)
      {
        id: 'armature_coil',
        name: 'Armature Coil (Rotor Loop)',
        semanticMeaning: 'Conductive wire loop experiencing Lorentz force (F = I·L × B)',
        visualType: 'box',
        position: [0, 0.9, 0],
        scale: [2.4, 0.08, 1.8],
        color: '#ffb700',
        metalness: 0.7,
        roughness: 0.2,
        selectable: true,
        highlightable: true,
        category: 'primary',
        educationalLabel: 'Armature Coil (I)',
        educationalDescription: 'When electric current flows perpendicular to magnetic field B, opposite sides experience opposite Lorentz forces, producing net rotational torque.',
        data: { currentA: 5.0, fieldB: 1.0, torqueNm: 0.85, rpm: 1200 },
      },
      // 6. Split-Ring Commutator
      {
        id: 'split_ring_commutator',
        name: 'Split-Ring Commutator',
        semanticMeaning: 'Mechanical rotary electrical switch reversing current each half-turn',
        visualType: 'cylinder',
        position: [0, 0.9, 1.5],
        scale: [0.35, 0.35, 0.35],
        rotation: [Math.PI / 2, 0, 0],
        color: '#e07a2a',
        metalness: 0.8,
        roughness: 0.3,
        selectable: true,
        highlightable: true,
        category: 'secondary',
        educationalLabel: 'Split-Ring Commutator',
        educationalDescription: 'Reverses the direction of electric current in the coil every half rotation to ensure torque remains continuous in one direction.',
      },
      // 7. Positive Carbon Brush Contact
      {
        id: 'brush_positive',
        name: 'Carbon Brush (+)',
        semanticMeaning: 'Stationary electrical contact providing positive DC current',
        visualType: 'box',
        position: [-0.3, 0.9, 1.5],
        scale: [0.12, 0.18, 0.25],
        color: '#2c2f38',
        metalness: 0.5,
        roughness: 0.6,
        category: 'secondary',
        educationalLabel: 'Positive Brush (+)',
      },
      // 8. Negative Carbon Brush Contact
      {
        id: 'brush_negative',
        name: 'Carbon Brush (-)',
        semanticMeaning: 'Stationary electrical contact returning DC current',
        visualType: 'box',
        position: [0.3, 0.9, 1.5],
        scale: [0.12, 0.18, 0.25],
        color: '#2c2f38',
        metalness: 0.5,
        roughness: 0.6,
        category: 'secondary',
        educationalLabel: 'Negative Brush (-)',
      },
      // 9. DC Power Supply / Battery
      {
        id: 'dc_battery',
        name: 'DC Voltage Supply (12V)',
        semanticMeaning: 'Electromotive force source driving current through brushes',
        visualType: 'box',
        position: [0, 0.25, 2.3],
        scale: [1.6, 0.5, 0.9],
        color: '#f4511e',
        metalness: 0.4,
        roughness: 0.4,
        selectable: true,
        highlightable: true,
        category: 'secondary',
        educationalLabel: 'DC Voltage Source (V)',
        educationalDescription: 'Provides electrical potential difference driving current I = V / R through the armature.',
      },
      // 10. Magnetic Field Lines (Cyan horizontal flux)
      {
        id: 'field_line_1',
        name: 'Magnetic Field Vector (B)',
        semanticMeaning: 'Vector field lines indicating direction of magnetic induction',
        visualType: 'cylinder',
        position: [0, 1.4, 0],
        scale: [0.04, 3.6, 0.04],
        rotation: [0, 0, Math.PI / 2],
        color: '#00f5ff',
        transparent: true,
        opacity: 0.65,
        category: 'secondary',
        educationalLabel: 'Magnetic Field (B)',
      },
      {
        id: 'field_line_2',
        name: 'Magnetic Field Vector (B)',
        semanticMeaning: 'Center magnetic flux line',
        visualType: 'cylinder',
        position: [0, 0.9, 0],
        scale: [0.04, 3.6, 0.04],
        rotation: [0, 0, Math.PI / 2],
        color: '#00f5ff',
        transparent: true,
        opacity: 0.65,
        category: 'secondary',
        educationalLabel: 'Magnetic Field (B)',
      },
      {
        id: 'field_line_3',
        name: 'Magnetic Field Vector (B)',
        semanticMeaning: 'Lower magnetic flux line',
        visualType: 'cylinder',
        position: [0, 0.4, 0],
        scale: [0.04, 3.6, 0.04],
        rotation: [0, 0, Math.PI / 2],
        color: '#00f5ff',
        transparent: true,
        opacity: 0.65,
        category: 'secondary',
        educationalLabel: 'Magnetic Field (B)',
      },
      // 11. Upward Lorentz Force Vector (Left wire arm)
      {
        id: 'lorentz_vector_up',
        name: 'Lorentz Force F = I(L × B)',
        semanticMeaning: 'Upward electromagnetic force on left coil arm',
        visualType: 'cylinder',
        position: [-1.1, 1.35, 0],
        scale: [0.08, 0.7, 0.08],
        color: '#00e676',
        category: 'secondary',
        educationalLabel: 'Upward Force (F)',
        educationalDescription: 'Right-Hand Rule: current forward + field right = upward force.',
      },
      // 12. Downward Lorentz Force Vector (Right wire arm)
      {
        id: 'lorentz_vector_down',
        name: 'Lorentz Force F = -I(L × B)',
        semanticMeaning: 'Downward electromagnetic force on right coil arm',
        visualType: 'cylinder',
        position: [1.1, 0.45, 0],
        scale: [0.08, 0.7, 0.08],
        color: '#e040fb',
        category: 'secondary',
        educationalLabel: 'Downward Force (F)',
        educationalDescription: 'Right-Hand Rule: current backward + field right = downward force.',
      },
    ];

    const relationships: SceneRelationshipDefinition[] = [
      {
        id: 'rel_magnetic_flux',
        sourceObjectId: 'magnet_north',
        targetObjectId: 'magnet_south',
        type: 'causes',
        label: 'Uniform B-Field (N → S)',
        color: '#00f5ff',
        animated: true,
        flowSpeed: 1.2,
      },
      {
        id: 'rel_current_in',
        sourceObjectId: 'dc_battery',
        targetObjectId: 'armature_coil',
        type: 'flowsTo',
        label: 'DC Current (I)',
        color: '#ffb700',
        animated: true,
        flowSpeed: 2.0,
      },
      {
        id: 'rel_commutation',
        sourceObjectId: 'split_ring_commutator',
        targetObjectId: 'armature_coil',
        type: 'transformsInto',
        label: 'Polarity Inversion Every 180°',
        color: '#e07a2a',
        animated: false,
      },
      {
        id: 'rel_torque_output',
        sourceObjectId: 'armature_coil',
        targetObjectId: 'rotor_shaft',
        type: 'causes',
        label: 'Torque Couple (τ = 2 × F × r)',
        color: '#00e676',
        animated: true,
        flowSpeed: 2.5,
      },
    ];

    const interactions: SceneInteractionConfig[] = [
      {
        id: 'param_motor_current',
        parameterName: 'armatureCurrent',
        label: 'Electric Current (Amperes)',
        widgetType: 'slider',
        min: 0,
        max: 10,
        step: 0.5,
        defaultValue: 5.0,
        educationalImpact: 'Directly increases Lorentz force magnitude (F = I·L·B) and rotational speed.',
      },
      {
        id: 'param_magnetic_b',
        parameterName: 'magneticFieldStrength',
        label: 'Magnetic Field Strength (Tesla)',
        widgetType: 'slider',
        min: 0.2,
        max: 2.0,
        step: 0.1,
        defaultValue: 1.0,
        educationalImpact: 'Modulates magnetic flux density. Stronger fields produce higher torque at same current.',
      },
      {
        id: 'param_commutator_active',
        parameterName: 'commutatorEnabled',
        label: 'Split-Ring Commutator',
        widgetType: 'toggle',
        defaultValue: true,
        educationalImpact: 'If disabled, coil aligns vertically and stalls because current direction fails to reverse.',
      },
      {
        id: 'param_mechanical_load',
        parameterName: 'mechanicalLoad',
        label: 'Mechanical Load / Resistance',
        widgetType: 'slider',
        min: 0,
        max: 100,
        step: 5,
        defaultValue: 20,
        educationalImpact: 'Simulates mechanical resistance. Demonstrates back-EMF and torque equilibrium.',
      },
    ];

    const animations: SceneAnimationDefinition[] = [
      {
        id: 'anim_armature_spin',
        targetObjectId: 'armature_coil',
        type: 'rotate',
        speed: 2.5,
      },
      {
        id: 'anim_shaft_spin',
        targetObjectId: 'rotor_shaft',
        type: 'rotate',
        speed: 2.5,
      },
      {
        id: 'anim_commutator_spin',
        targetObjectId: 'split_ring_commutator',
        type: 'rotate',
        speed: 2.5,
      },
      {
        id: 'anim_flux_pulse',
        targetObjectId: 'field_line_2',
        type: 'pulse',
        speed: 1.4,
        minScale: 0.95,
        maxScale: 1.05,
      },
    ];

    return {
      id: 'scene_electric_motor',
      title: 'DC Electric Motor: Electromagnetic Torque & Commutation',
      topicId: 'electric_motor',
      environmentType: 'laboratory',
      backgroundColor: '#0a0d18',
      camera: {
        initialPosition: [0, 4.2, 6.2],
        lookAt: [0, 0.9, 0],
        fov: 50,
        orbitControls: true,
      },
      lighting: {
        ambientColor: '#ffffff',
        ambientIntensity: 0.75,
        directionalColor: '#00f5ff',
        directionalIntensity: 1.4,
        directionalPosition: [3, 8, 4],
      },
      objects,
      relationships,
      interactions,
      animations,
      showGroundGrid: true,
      groundGridSize: 10,
    };
  }

  /**
   * UNIVERSAL PROCEDURAL GENERATOR 2.0:
   * Builds an authentic educational 3D semantic graph for ANY arbitrary topic,
   * grounded in the KnowledgeBundle entities, processes, and relationships.
   */
  static buildUniversalSemanticScene(
    topicName: string,
    keyPrinciples: string[],
    subject: string,
    bundle?: LearningKnowledgeBundle
  ): UniversalSceneDefinition {
    const safeTopic = topicName || 'General Topic';
    const principles = keyPrinciples && keyPrinciples.length > 0
      ? keyPrinciples
      : ['Fundamental Structure', 'Core Process', 'Observed Outcome'];

    // If a rich LearningKnowledgeBundle is available with entities and processes, build a real semantic process graph
    if (bundle && bundle.entities && bundle.entities.length >= 2) {
      return UniversalSceneBuilder.buildKnowledgeBundleSemanticScene(safeTopic, subject, bundle);
    }

    // Default radial principle model for baseline topics
    const objects: SceneObjectDefinition[] = [
      // Core Center Topic Object
      {
        id: 'core_concept_hub',
        name: safeTopic,
        semanticMeaning: `Central conceptual pillar of ${safeTopic}`,
        visualType: 'sphere',
        position: [0, 0.8, 0],
        scale: [1.3, 1.3, 1.3],
        color: '#00f5ff',
        emissive: '#0099cc',
        emissiveIntensity: 0.5,
        selectable: true,
        highlightable: true,
        category: 'primary',
        educationalLabel: `${safeTopic} (Core Principle)`,
        educationalDescription: `Primary learning focus: understand how this core mechanism governs ${subject}.`,
      },
    ];

    const relationships: SceneRelationshipDefinition[] = [];
    const radius = 2.8;

    // Distribute principle nodes symmetrically around the hub
    principles.forEach((principle, index) => {
      const angle = (index / principles.length) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const nodeId = `principle_node_${index + 1}`;

      const colors = ['#ffb700', '#00ff88', '#ff0055', '#a8dadc', '#e63946'];
      const color = colors[index % colors.length];

      objects.push({
        id: nodeId,
        name: principle,
        semanticMeaning: `Component principle: ${principle}`,
        visualType: index % 2 === 0 ? 'box' : 'cylinder',
        position: [x, 0.6, z],
        scale: [0.8, 0.8, 0.8],
        color,
        selectable: true,
        highlightable: true,
        category: 'secondary',
        educationalLabel: `${index + 1}. ${principle}`,
        educationalDescription: `Key mechanism demonstrating ${principle} in action.`,
      });

      relationships.push({
        id: `rel_hub_${nodeId}`,
        sourceObjectId: 'core_concept_hub',
        targetObjectId: nodeId,
        type: index === 0 ? 'causes' : index === 1 ? 'flowsTo' : 'dependsOn',
        label: `${safeTopic} → ${principle}`,
        color,
        animated: true,
        flowSpeed: 1.5,
      });
    });

    const interactions: SceneInteractionConfig[] = [
      {
        id: 'param_intensity',
        parameterName: 'interactionIntensity',
        label: 'Concept Influence Factor',
        widgetType: 'slider',
        min: 0,
        max: 100,
        defaultValue: 50,
        educationalImpact: `Modulates the relative intensity of interactions within ${safeTopic}.`,
      },
      {
        id: 'param_isolated_principle',
        parameterName: 'isolatedPrinciple',
        label: 'Inspect Specific Component',
        widgetType: 'select',
        options: [
          { value: 'all', label: 'All Components' },
          ...principles.map((p, i) => ({ value: `principle_node_${i + 1}`, label: p })),
        ],
        defaultValue: 'all',
        educationalImpact: 'Isolates and highlights individual structural components for deep inspection.',
      },
    ];

    const animations: SceneAnimationDefinition[] = [
      {
        id: 'anim_hub_pulse',
        targetObjectId: 'core_concept_hub',
        type: 'pulse',
        speed: 1.2,
        minScale: 0.95,
        maxScale: 1.05,
      },
      {
        id: 'anim_orbit_nodes',
        targetObjectId: 'principle_node_1',
        type: 'orbit',
        speed: 0.3,
        radius,
        center: [0, 0.6, 0],
      },
    ];

    return {
      id: `scene_${safeTopic.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      title: `${safeTopic}: Interactive Conceptual Model`,
      topicId: safeTopic.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      environmentType: 'noir_grid',
      backgroundColor: '#07090e',
      camera: {
        initialPosition: [0, 5, 7.5],
        lookAt: [0, 0.5, 0],
        fov: 50,
        orbitControls: true,
      },
      lighting: {
        ambientColor: '#ffffff',
        ambientIntensity: 0.7,
        directionalColor: '#00f5ff',
        directionalIntensity: 1.3,
        directionalPosition: [3, 8, 4],
      },
      objects,
      relationships,
      interactions,
      animations,
      showGroundGrid: true,
      groundGridSize: 12,
    };
  }

  /**
   * Builds a structured semantic process 3D scene from a verified LearningKnowledgeBundle.
   * Renders input entities on the left, processing / core transformers in the center,
   * and output entities on the right, connected by directional causal and flow relationships.
   */
  private static buildKnowledgeBundleSemanticScene(
    safeTopic: string,
    subject: string,
    bundle: LearningKnowledgeBundle
  ): UniversalSceneDefinition {
    const objects: SceneObjectDefinition[] = [];
    const relationships: SceneRelationshipDefinition[] = [];
    const animations: SceneAnimationDefinition[] = [];

    // Categorize entities by role
    const inputs = bundle.entities.filter((e) => e.role === 'input');
    const outputs = bundle.entities.filter((e) => e.role === 'output');
    const cores = bundle.entities.filter((e) => e.role === 'process' || e.role === 'field' || e.role === 'indicator');
    const others = bundle.entities.filter(
      (e) => !inputs.includes(e) && !outputs.includes(e) && !cores.includes(e)
    );

    // If cores empty, pick the first entity as core
    if (cores.length === 0 && bundle.entities.length > 0) {
      cores.push(bundle.entities[0]);
    }

    // 1. Layout inputs (Left column X = -2.8)
    inputs.forEach((entity, idx) => {
      const z = (idx - (inputs.length - 1) / 2) * 1.5;
      objects.push({
        id: entity.id,
        name: entity.name,
        semanticMeaning: entity.semanticDescription,
        visualType: 'box',
        position: [-2.8, 0.8, z],
        scale: [0.9, 0.9, 0.9],
        color: '#ffb700',
        metalness: 0.5,
        roughness: 0.3,
        selectable: true,
        highlightable: true,
        category: 'secondary',
        educationalLabel: `${entity.name} (Input)`,
        educationalDescription: entity.semanticDescription,
      });
    });

    // 2. Layout cores / transformations (Center column X = 0)
    cores.forEach((entity, idx) => {
      const z = (idx - (cores.length - 1) / 2) * 1.8;
      objects.push({
        id: entity.id,
        name: entity.name,
        semanticMeaning: entity.semanticDescription,
        visualType: 'sphere',
        position: [0, 0.9, z],
        scale: [1.4, 1.4, 1.4],
        color: '#00f5ff',
        emissive: '#0088cc',
        emissiveIntensity: 0.4,
        selectable: true,
        highlightable: true,
        category: 'primary',
        educationalLabel: `${entity.name} (Mechanism)`,
        educationalDescription: entity.semanticDescription,
      });

      animations.push({
        id: `anim_pulse_${entity.id}`,
        targetObjectId: entity.id,
        type: 'pulse',
        speed: 1.2,
        minScale: 0.96,
        maxScale: 1.04,
      });
    });

    // 3. Layout outputs (Right column X = 2.8)
    outputs.forEach((entity, idx) => {
      const z = (idx - (outputs.length - 1) / 2) * 1.5;
      objects.push({
        id: entity.id,
        name: entity.name,
        semanticMeaning: entity.semanticDescription,
        visualType: 'box',
        position: [2.8, 0.8, z],
        scale: [0.9, 0.9, 0.9],
        color: '#00ff88',
        metalness: 0.4,
        roughness: 0.3,
        selectable: true,
        highlightable: true,
        category: 'secondary',
        educationalLabel: `${entity.name} (Output)`,
        educationalDescription: entity.semanticDescription,
      });
    });

    // 4. Layout any remaining components (Z-axis offset)
    others.forEach((entity, idx) => {
      const x = (idx - (others.length - 1) / 2) * 1.8;
      objects.push({
        id: entity.id,
        name: entity.name,
        semanticMeaning: entity.semanticDescription,
        visualType: 'cylinder',
        position: [x, 0.6, -2.4],
        scale: [0.7, 0.7, 0.7],
        color: '#e040fb',
        selectable: true,
        category: 'secondary',
        educationalLabel: `${entity.name}`,
        educationalDescription: entity.semanticDescription,
      });
    });

    // 5. Connect relationships from KnowledgeBundle
    if (bundle.relationships && bundle.relationships.length > 0) {
      bundle.relationships.forEach((rel, idx) => {
        const hasSource = objects.some((o) => o.id === rel.sourceEntityId);
        const hasTarget = objects.some((o) => o.id === rel.targetEntityId);
        if (hasSource && hasTarget) {
          const relType = (rel.type === 'resists' || rel.type === 'opposes') ? 'dependsOn' : (rel.type as any);
          relationships.push({
            id: `rel_kb_${idx}_${rel.sourceEntityId}`,
            sourceObjectId: rel.sourceEntityId,
            targetObjectId: rel.targetEntityId,
            type: relType,
            label: rel.description || `${rel.sourceEntityId} → ${rel.targetEntityId}`,
            color: rel.type === 'flowsTo' ? '#ffcc00' : rel.type === 'transformsInto' ? '#00ff88' : '#00f5ff',
            animated: true,
            flowSpeed: 1.8,
          });
        }
      });
    }

    // If no relationships existed, link inputs to center and center to outputs
    if (relationships.length === 0 && cores.length > 0) {
      const primaryCore = cores[0];
      inputs.forEach((input) => {
        relationships.push({
          id: `rel_${input.id}_${primaryCore.id}`,
          sourceObjectId: input.id,
          targetObjectId: primaryCore.id,
          type: 'flowsTo',
          label: `${input.name} feeds into ${primaryCore.name}`,
          color: '#ffcc00',
          animated: true,
          flowSpeed: 1.6,
        });
      });
      outputs.forEach((output) => {
        relationships.push({
          id: `rel_${primaryCore.id}_${output.id}`,
          sourceObjectId: primaryCore.id,
          targetObjectId: output.id,
          type: 'transformsInto',
          label: `${primaryCore.name} produces ${output.name}`,
          color: '#00ff88',
          animated: true,
          flowSpeed: 1.6,
        });
      });
    }

    // 6. Build interactions from suggested manipulable variables or defaults
    const interactions: SceneInteractionConfig[] = [];
    if (bundle.suggestedManipulableVariables && bundle.suggestedManipulableVariables.length > 0) {
      bundle.suggestedManipulableVariables.forEach((iv) => {
        interactions.push({
          id: `param_${iv.name}`,
          parameterName: iv.name,
          label: `${iv.label || iv.name} (${iv.unit || 'factor'})`,
          widgetType: 'slider',
          min: iv.min ?? 0,
          max: iv.max ?? 100,
          defaultValue: iv.defaultValue ?? 50,
          educationalImpact: iv.educationalImpact,
        });
      });
    } else {
      interactions.push({
        id: 'param_activity_rate',
        parameterName: 'activityRate',
        label: 'Process Activity Rate',
        widgetType: 'slider',
        min: 0,
        max: 100,
        defaultValue: 50,
        educationalImpact: `Modulates the execution rate of the ${safeTopic} mechanism.`,
      });
    }

    return {
      id: `scene_${safeTopic.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      title: `${safeTopic}: Source-Backed Semantic System`,
      topicId: safeTopic.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      environmentType: subject === 'Biology' ? 'biology_cell' : subject === 'Physics' ? 'laboratory' : 'noir_grid',
      backgroundColor: '#07090e',
      camera: {
        initialPosition: [0, 5, 7.5],
        lookAt: [0, 0.8, 0],
        fov: 50,
        orbitControls: true,
      },
      lighting: {
        ambientColor: '#ffffff',
        ambientIntensity: 0.75,
        directionalColor: '#00f5ff',
        directionalIntensity: 1.35,
        directionalPosition: [3, 8, 4],
      },
      objects,
      relationships,
      interactions,
      animations,
      showGroundGrid: true,
      groundGridSize: 12,
    };
  }
}
