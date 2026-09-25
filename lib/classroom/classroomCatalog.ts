/**
 * Canonical Classroom Catalog
 *
 * Grounded educational lesson structures for the Smart Board teaching environment.
 * Multi-subject support: Physics, Biology, Computer Science, Mathematics.
 */

import { ClassroomLesson } from '@/components/classroom/types';

export const CANONICAL_CLASSROOM_LESSONS: Record<string, ClassroomLesson> = {
  dc_motor: {
    id: 'lesson_dc_motor',
    conceptId: 'dc_motor',
    topicTitle: 'DC Electric Motor & Commutation',
    subject: 'Physics',
    gradeLevel: 'High School / Undergraduate Physics',
    estimatedMinutes: 10,
    hasFormulas: true,
    learningObjective:
      'Understand how a DC motor converts direct electrical current into continuous mechanical rotation via Lorentz force and split-ring commutation.',
    steps: [
      {
        id: 'step_1_intro',
        stepNumber: 1,
        title: 'Energy Conversion',
        subtitle: 'From Current to Motion',
        buddyDialogue:
          "Great! A DC motor converts electrical energy into mechanical energy using electromagnetic interactions. Let's explore how it works step by step.",
        buddyState: 'INTRODUCING',
        boardTitle: 'What a DC Motor Does',
        boardSummary:
          'A DC (Direct Current) electric motor converts electrical energy into mechanical energy (rotational kinetic energy) using electromagnetic interactions.',
        keyPrinciple:
          'The magnetic field exerts a force on the current-carrying coil, creating a torque that rotates the armature.',
        formulaSnippet: 'E_elec (I · V · t) ──▶ E_mech (τ · ω · t)',
        visualType: 'schematic',
        visualData: {
          highlight: 'energy_flow',
        },
        example: {
          title: 'Everyday Technology',
          description:
            'DC motors power electric cars, cordless drills, cooling fans, drones, and elevator winches.',
        },
        hintText:
          'Think of the motor as an electromagnetic lever: current goes in, and twisting force (torque) comes out.',
      },
      {
        id: 'step_2_components',
        stepNumber: 2,
        title: 'Component Discovery',
        subtitle: 'The 5 Essential Elements',
        buddyDialogue:
          'Here are the 5 core components of every DC motor. Look at the board: the permanent magnets create a magnetic field, the coil carries current, and the split-ring commutator acts as the secret switch that keeps it turning!',
        buddyState: 'EXPLAINING',
        boardTitle: 'Core Anatomy of a DC Motor',
        boardSummary:
          'A functional DC motor requires 5 interlocking physical elements to sustain electromagnetic operation.',
        keyPrinciple:
          '1. Permanent Magnets (Stator): Creates uniform magnetic field (N to S)\n2. Armature Coil (Rotor): Conducts loop current experiencing force\n3. Axle / Shaft: Delivers mechanical output torque\n4. Split-Ring Commutator: Reverses current direction every 180°\n5. Carbon Brushes: Maintains sliding electrical contact with the battery',
        visualType: 'interactive_diagram',
        visualData: {
          components: ['Magnets', 'Coil', 'Axle', 'Commutator', 'Brushes'],
        },
        example: {
          title: 'Mechanical Symbiosis',
          description:
            'Without the brushes, rotating wires would twist and snap. Carbon brushes slide smoothly over the copper ring segments.',
        },
        checkQuestion: {
          prompt: 'Which component is responsible for reversing the direction of current in the coil every half-turn?',
          options: [
            { id: 'opt_1', text: 'Permanent Stator Magnets', isCorrect: false, feedback: 'Magnets provide the static field, but do not switch current.' },
            { id: 'opt_2', text: 'Split-Ring Commutator', isCorrect: true, feedback: 'Correct! The gap in the split ring reverses polarity every 180°.' },
            { id: 'opt_3', text: 'Axle Shaft', isCorrect: false, feedback: 'The axle transfers rotational torque to the output load.' },
            { id: 'opt_4', text: 'Carbon Brushes alone', isCorrect: false, feedback: 'Brushes provide stationary electrical contact, while the split ring performs the commutation.' },
          ],
        },
        hintText: 'Look for the segmented ring that rotates with the central axle.',
      },
      {
        id: 'step_3_mechanism',
        stepNumber: 3,
        title: 'The Magnetic Force Mechanism',
        subtitle: 'Lorentz Force & Torque Generation',
        buddyDialogue:
          "Now let's look at why it actually turns. Current flows forward on the left side of the coil, and backward on the right. Using Fleming's Left-Hand Rule, the left side is pushed UP and the right side is pushed DOWN!",
        buddyState: 'EXPLAINING',
        boardTitle: 'Lorentz Force on a Current-Carrying Wire',
        boardSummary:
          'Charged particles moving perpendicular to magnetic field lines experience Lorentz Force: F = I · (L × B).',
        keyPrinciple:
          'Because current flows in opposite directions on the two parallel arms of the rectangular coil, the magnetic forces point in opposite directions (one UP, one DOWN). These equal and opposite forces form a couple that produces rotational torque (τ = 2 · F · r).',
        formulaSnippet: 'F = I · L · B · sin(θ)   |   τ = 2 · F · r',
        visualType: 'mechanism',
        visualData: {
          currentDirection: 'counter-clockwise',
          forceLeft: 'UP (+Y)',
          forceRight: 'DOWN (-Y)',
        },
        example: {
          title: "Fleming's Left-Hand Rule",
          description:
            'Thumb = Force (Thrust), First finger = Field (N to S), Second finger = Current (+ to -). Try orienting your fingers!',
        },
        hintText:
          'Opposite current directions in a uniform field produce opposite forces, generating torque.',
      },
      {
        id: 'step_4_commutation',
        stepNumber: 4,
        title: 'The Role of Commutation',
        subtitle: 'Why Continuous Rotation Requires Current Reversal',
        buddyDialogue:
          'Pay close attention here! As the coil turns past vertical, the forces would start pulling it backward. Watch the split ring: just as the coil passes vertical, the brushes swap segments, reversing the current so torque keeps driving in the SAME direction!',
        buddyState: 'THINKING',
        boardTitle: 'Why Commutation Is Required',
        boardSummary:
          'When the coil reaches the vertical position (perpendicular to magnetic field), the torque momentarily drops to zero.',
        keyPrinciple:
          'Without commutation, inertia carries the coil past vertical, but the upward and downward forces would now act to pull the coil backward! The split-ring commutator swaps the brush contacts at exactly this moment, reversing current in the coil so the force direction switches and rotation continues in the original direction.',
        formulaSnippet: 'Current Reversal at θ = 90° and θ = 270°',
        visualType: 'comparison',
        visualData: {
          withCommutator: 'Continuous 360° rotation in one direction',
          withoutCommutator: 'Oscillates around vertical and stalls',
        },
        checkQuestion: {
          prompt: 'What happens when the coil passes the vertical plane if current is NOT reversed?',
          options: [
            { id: 'c_1', text: 'The torque opposes forward motion, causing it to oscillate and stall', isCorrect: true, feedback: 'Spot on! Counter-torque acts like a magnetic brake, trapping the coil vertically.' },
            { id: 'c_2', text: 'The motor spins twice as fast', isCorrect: false, feedback: 'Incorrect: Opposing forces decelerate the rotor.' },
            { id: 'c_3', text: 'The battery runs out of charge instantly', isCorrect: false, feedback: 'Current continues flowing; the mechanical torque simply opposes rotation.' },
          ],
        },
        hintText:
          'Think of pushing a playground swing: if you push in the wrong direction on the return swing, it halts.',
      },
      {
        id: 'step_5_summary',
        stepNumber: 5,
        title: 'Putting It All Together',
        subtitle: 'Continuous DC Motor Operation',
        buddyDialogue:
          "Brilliant work! You now understand the complete DC motor principle: current plus magnetic field creates force; opposing forces create torque; and the commutator reverses current every half-turn to produce smooth, non-stop rotation!",
        buddyState: 'CELEBRATING',
        boardTitle: 'Mastery Synthesis: The DC Motor Cycle',
        boardSummary:
          'Every rotation cycle is a harmony of electricity, magnetism, and clever mechanical switching.',
        keyPrinciple:
          'DC Current ──▶ Lorentz Force (F = ILB) ──▶ Torque Couple (τ = 2Fr) ──▶ Rotor Turns ──▶ Commutator Inverts Polarity ──▶ Continuous Motion Sustained.',
        formulaSnippet: 'P_mech = τ · ω  |  Back-EMF: V_net = V_battery - E_back',
        visualType: 'formula_focus',
        example: {
          title: 'Next Step: Hands-on Lab',
          description:
            'Use the interactive controls to toggle the commutator, change field strength, and test your understanding under different loads!',
        },
        hintText:
          'Remember: Motor speed can be controlled by varying either current or magnetic field strength.',
      },
    ],
    formulas: [
      {
        id: 'f_lorentz',
        name: 'Lorentz Magnetic Force',
        formula: 'F = I · L · B · sin(θ)',
        description: 'Force exerted on a conductor of length L carrying current I inside magnetic flux density B.',
        variables: [
          { symbol: 'F', description: 'Force on wire', unit: 'Newtons (N)' },
          { symbol: 'I', description: 'Electric current', unit: 'Amperes (A)' },
          { symbol: 'L', description: 'Length of wire segment', unit: 'meters (m)' },
          { symbol: 'B', description: 'Magnetic flux density', unit: 'Tesla (T)' },
          { symbol: 'θ', description: 'Angle between wire and field lines', unit: 'degrees' },
        ],
        example: 'If I = 2 A, L = 0.1 m, B = 0.5 T, and θ = 90°: F = 2 × 0.1 × 0.5 × 1 = 0.1 N',
      },
      {
        id: 'f_torque',
        name: 'Electromagnetic Torque Couple',
        formula: 'τ = 2 · F · r = N · I · A · B · sin(α)',
        description: 'Rotational torque produced by the two parallel arms of an N-turn coil of area A.',
        variables: [
          { symbol: 'τ', description: 'Torque couple', unit: 'Newton-meters (N·m)' },
          { symbol: 'N', description: 'Number of coil turns', unit: 'turns' },
          { symbol: 'A', description: 'Loop area (length × width)', unit: 'm²' },
          { symbol: 'r', description: 'Radius from axle to wire', unit: 'meters (m)' },
        ],
        example: 'If F = 0.1 N and radius r = 0.05 m: τ = 2 × 0.1 × 0.05 = 0.01 N·m',
      },
      {
        id: 'f_back_emf',
        name: 'Back Electromotive Force (Back-EMF)',
        formula: 'V_net = V_supply - ε_back',
        description: 'As the coil spins inside the field, Faraday induction generates opposing back-EMF proportional to angular speed.',
        variables: [
          { symbol: 'V_net', description: 'Effective driving voltage', unit: 'Volts (V)' },
          { symbol: 'ε_back', description: 'Induced counter-voltage', unit: 'Volts (V)' },
        ],
        example: 'If V_supply = 12 V and ε_back = 10 V: V_net = 12 - 10 = 2 V',
      },
    ],
    flashcards: [
      {
        id: 'fc_1',
        front: 'What is a Split-Ring Commutator?',
        back: 'A segmented copper ring attached to the motor axle that reverses current direction through the coil every half-turn (180°).',
        category: 'Components',
      },
      {
        id: 'fc_2',
        front: "What is Lorentz Force in a motor?",
        back: 'The physical sideways force experienced by moving electric charges in a magnetic field: F = I·L·B·sin(θ).',
        category: 'Principles',
      },
      {
        id: 'fc_3',
        front: 'What role do Carbon Brushes play?',
        back: 'Stationary graphite contacts that conduct DC current from the battery to the rotating commutator segments with low friction.',
        category: 'Components',
      },
      {
        id: 'fc_4',
        front: 'Why would a motor stall without a commutator?',
        back: 'After passing the vertical axis, current would flow in the wrong direction, creating counter-torque that pulls the rotor backward.',
        category: 'Operation',
      },
      {
        id: 'fc_5',
        front: "How does Fleming's Left-Hand Rule apply to DC Motors?",
        back: 'Thumb = Force / Motion; First Finger = Magnetic Field (N→S); Second Finger = Current (+→-).',
        category: 'Rules',
      },
    ],
    sources: [
      {
        id: 'src_1',
        title: 'Halliday & Resnick: Fundamentals of Physics (Ch. 28: Magnetic Fields)',
        authorOrPublisher: 'Wiley Publishing',
        type: 'textbook',
        note: 'Covers Lorentz force on current-carrying loops and magnetic dipole moments.',
      },
      {
        id: 'src_2',
        title: 'MIT OpenCourseWare 8.02: Electricity and Magnetism',
        authorOrPublisher: 'Massachusetts Institute of Technology',
        url: 'https://ocw.mit.edu',
        type: 'oer',
        note: 'Lecture demonstrations of DC motor torque generation and commutator switching.',
      },
      {
        id: 'src_3',
        title: 'National Science Foundation: Electromechanical Principles',
        authorOrPublisher: 'NSF Curriculum Standards',
        type: 'curriculum',
        note: 'Foundational secondary school physics benchmark for energy conversion.',
      },
    ],
    initialNotes:
      'Key Reminders:\n• Motor turns electrical current into rotation (unlike a generator which does the reverse).\n• F = I L B gives the force on each side.\n• Commutator is the magic switch that inverts current every half-turn.\n• Without commutator = stalls at vertical!',
    questions: [
      {
        id: 'q_dcm_1',
        lessonId: 'lesson_dc_motor',
        conceptId: 'dc_motor',
        prompt: 'Which component is responsible for reversing the direction of current in the coil every half-turn (180°)?',
        type: 'multiple_choice',
        difficulty: 'EASY',
        options: [
          { id: 'opt_1', text: 'Permanent Stator Magnets', isCorrect: false, feedback: 'Magnets establish the magnetic field; they do not alter current.' },
          { id: 'opt_2', text: 'Split-Ring Commutator', isCorrect: true, feedback: 'Correct! The split ring reverses loop polarity every 180° to maintain unidirectional torque.' },
          { id: 'opt_3', text: 'Central Axle Shaft', isCorrect: false, feedback: 'The axle delivers output mechanical torque, but does not conduct or switch current.' },
          { id: 'opt_4', text: 'Carbon Brushes alone', isCorrect: false, feedback: 'Brushes provide stationary electrical contact, while the split ring switches connections.' },
        ],
        explanation: 'The split-ring commutator rotates with the axle, switching brush contacts every 180° to prevent opposing torque.',
        misconceptionTag: 'commutator_vs_brushes',
        hint: {
          id: 'hint_q1',
          conceptId: 'dc_motor',
          hints: [
            'Think about what physical part switches contact every half rotation.',
            'Look at the segmented copper ring attached to the central axle.',
            'The split-ring commutator reverses the connections between the battery and the loop.',
          ],
        },
      },
      {
        id: 'q_dcm_2',
        lessonId: 'lesson_dc_motor',
        conceptId: 'dc_motor',
        prompt: 'What happens to the rotational torque on a DC motor coil if you double the current (I) while keeping field (B) constant?',
        type: 'application',
        difficulty: 'MEDIUM',
        options: [
          { id: 'opt_t1', text: 'Torque remains unchanged', isCorrect: false, feedback: 'Torque is directly proportional to loop current.' },
          { id: 'opt_t2', text: 'Torque doubles', isCorrect: true, feedback: 'Spot on! Since τ = N·I·A·B·sin(α), doubling current doubles net torque.' },
          { id: 'opt_t3', text: 'Torque quadruples', isCorrect: false, feedback: 'Torque scales linearly with I, not quadratically.' },
          { id: 'opt_t4', text: 'Torque drops to zero', isCorrect: false, feedback: 'Higher current exerts stronger Lorentz force on the wire segments.' },
        ],
        explanation: 'According to τ = N·I·A·B·sin(α), torque is linearly proportional to electric current I.',
        misconceptionTag: 'linear_vs_quadratic_torque',
        hint: {
          id: 'hint_q2',
          conceptId: 'dc_motor',
          hints: [
            'Check the torque equation on the Formula Sheet: τ = N·I·A·B·sin(α).',
            'Notice the exponent of current (I) in the formula.',
            'Since I has power 1, doubling I directly doubles the torque couple.',
          ],
        },
      },
      {
        id: 'q_dcm_3',
        lessonId: 'lesson_dc_motor',
        conceptId: 'dc_motor',
        prompt: 'Why would a DC motor stall if the commutator were permanently welded together as a solid ring?',
        type: 'conceptual',
        difficulty: 'HARD',
        options: [
          { id: 'opt_s1', text: 'The battery would explode immediately', isCorrect: false, feedback: 'Current still flows normally through the circuit.' },
          { id: 'opt_s2', text: 'Past the vertical axis, counter-torque pulls the coil backward, causing it to oscillate and halt', isCorrect: true, feedback: 'Exactly! Without current reversal, the magnetic force opposes rotation once past 90°.' },
          { id: 'opt_s3', text: 'The magnets would lose their permanent magnetization', isCorrect: false, feedback: 'Stator magnets are independent of current direction.' },
        ],
        explanation: 'Without current inversion, forces point in the opposite rotational sense past 90°, creating a counter-torque that traps the rotor.',
        misconceptionTag: 'continuous_force_inversion',
        hint: {
          id: 'hint_q3',
          conceptId: 'dc_motor',
          hints: [
            'Think about what happens to the arm positions once the loop rotates past vertical (90°).',
            'If current keeps flowing in the same physical wire, the upward force now acts on the opposite side of the axle.',
            'The opposing torque acts like a magnetic brake, halting continuous rotation.',
          ],
        },
      },
    ],
    progressiveHints: [
      {
        id: 'ph_dcm_1',
        stepId: 'step_1_intro',
        conceptId: 'dc_motor',
        hints: [
          'Energy cannot be created or destroyed, only transformed.',
          'Electric current is electrical energy; rotation of the shaft is mechanical kinetic energy.',
          'The DC motor converts electrical power (V·I) into rotational mechanical power (τ·ω).',
        ],
      },
      {
        id: 'ph_dcm_2',
        stepId: 'step_2_components',
        conceptId: 'dc_motor',
        hints: [
          'Observe the 5 main components highlighted on the Smart Board.',
          'Notice which elements are stationary (stator magnets, carbon brushes) versus rotating (rotor coil, axle, split ring).',
          'The split-ring commutator acts as the mechanical polarity inverter that keeps torque unidirectional.',
        ],
      },
      {
        id: 'ph_dcm_3',
        stepId: 'step_3_mechanism',
        conceptId: 'dc_motor',
        hints: [
          'Apply Fleming\'s Left-Hand Rule to each side of the rectangular coil.',
          'Current flows in opposite directions on the two parallel arms inside the uniform magnetic field.',
          'Opposite current vectors produce equal and opposite Lorentz forces, creating rotational torque: τ = 2·F·r.',
        ],
      },
    ],
  },

  projectile_motion: {
    id: 'lesson_projectile_motion',
    conceptId: 'projectile_motion',
    topicTitle: 'Projectile Motion & Kinematics',
    subject: 'Physics',
    gradeLevel: 'High School / AP Physics',
    estimatedMinutes: 8,
    hasFormulas: true,
    learningObjective:
      'Predict parabolic trajectories by decoupling constant horizontal velocity from accelerated vertical gravity.',
    steps: [
      {
        id: 'step_1_proj_intro',
        stepNumber: 1,
        title: 'Two Independent Motions',
        subtitle: 'Horizontal vs Vertical',
        buddyDialogue:
          "Welcome to kinematics! The key secret to projectile motion is that horizontal and vertical motions are completely independent. Gravity only pulls downward—it doesn't affect forward speed at all!",
        buddyState: 'INTRODUCING',
        boardTitle: 'Independence of Velocity Vectors',
        boardSummary:
          'A projectile launched into the air follows a curved parabolic trajectory governed by two separate kinematic equations.',
        keyPrinciple:
          'Horizontal: Constant velocity (a_x = 0, v_x = v_0 · cos θ)\nVertical: Constant acceleration under gravity (a_y = -9.8 m/s², v_y = v_0 · sin θ - gt)',
        formulaSnippet: 'x(t) = v_0 · cos(θ) · t   |   y(t) = v_0 · sin(θ) · t - ½gt²',
        visualType: 'schematic',
        example: {
          title: 'Simultaneous Drop Experiment',
          description:
            'A bullet dropped straight down hits the flat ground at the exact same millisecond as a bullet fired horizontally from the same height!',
        },
        hintText: 'Always break the initial launch velocity into horizontal and vertical components.',
      },
      {
        id: 'step_2_proj_range',
        stepNumber: 2,
        title: 'Maximum Range at 45°',
        subtitle: 'The Optimum Launch Angle',
        buddyDialogue:
          'Why is 45° the magic angle for maximum ground distance? High angles give lots of air time but little forward speed. Low angles give speed but hit the ground too soon. 45° strikes the perfect mathematical balance!',
        buddyState: 'EXPLAINING',
        boardTitle: 'Deriving the Range Equation',
        boardSummary:
          'Horizontal distance on flat ground: R = (v_0² · sin 2θ) / g.',
        keyPrinciple:
          'The function sin(2θ) reaches its maximum possible value of 1.0 when 2θ = 90°, which means θ = 45°.',
        formulaSnippet: 'R_max = v_0² / g   (at θ = 45°)',
        visualType: 'formula_focus',
        example: {
          title: 'Complementary Angles',
          description:
            'Angles that add up to 90° (like 30° and 60°) achieve the exact same horizontal distance!',
        },
        checkQuestion: {
          prompt: 'Which launch angle achieves maximum horizontal distance on flat level ground?',
          options: [
            { id: 'p_1', text: '30°', isCorrect: false, feedback: 'Flatter arc with great speed, but hits ground too quickly.' },
            { id: 'p_2', text: '45°', isCorrect: true, feedback: 'Perfect! sin(2·45°) = sin(90°) = 1.0, maximum range.' },
            { id: 'p_3', text: '60°', isCorrect: false, feedback: 'High vertical arc with great hang-time, but too little forward speed.' },
          ],
        },
        hintText: 'Find where the trigonometric term sin(2θ) reaches its crest of 1.0.',
      },
    ],
    formulas: [
      {
        id: 'f_range',
        name: 'Horizontal Ground Range',
        formula: 'R = (v_0² · sin 2θ) / g',
        description: 'Total horizontal distance traveled over flat ground with launch and landing at same elevation.',
        variables: [
          { symbol: 'R', description: 'Horizontal range', unit: 'meters (m)' },
          { symbol: 'v_0', description: 'Initial velocity magnitude', unit: 'm/s' },
          { symbol: 'θ', description: 'Launch angle above horizontal', unit: 'degrees' },
          { symbol: 'g', description: 'Acceleration due to gravity', unit: '9.8 m/s²' },
        ],
        example: 'If v_0 = 20 m/s and θ = 45°: R = (400 × sin 90°) / 9.8 ≈ 40.8 m',
      },
      {
        id: 'f_time_flight',
        name: 'Time of Flight',
        formula: 't_flight = (2 · v_0 · sin θ) / g',
        description: 'Total duration the projectile remains airborne before touching down.',
        variables: [
          { symbol: 't_flight', description: 'Flight duration', unit: 'seconds (s)' },
          { symbol: 'v_0', description: 'Initial velocity', unit: 'm/s' },
          { symbol: 'θ', description: 'Launch angle', unit: 'degrees' },
          { symbol: 'g', description: 'Gravity', unit: '9.8 m/s²' },
        ],
        example: 'If v_0 = 20 m/s and θ = 30°: t = (2 × 20 × sin 30°) / 9.8 = 20 / 9.8 ≈ 2.04 s',
      },
    ],
    flashcards: [
      {
        id: 'fc_p1',
        front: 'What is the horizontal acceleration of a projectile in air (neglecting drag)?',
        back: 'Zero (a_x = 0 m/s²). Horizontal velocity remains constant throughout the flight.',
        category: 'Kinematics',
      },
      {
        id: 'fc_p2',
        front: 'What happens to vertical velocity at the highest point (apex)?',
        back: 'Vertical velocity momentarily drops to zero (v_y = 0 m/s), while horizontal velocity continues unchanged.',
        category: 'Vectors',
      },
    ],
    sources: [
      {
        id: 'src_p1',
        title: 'OpenStax College Physics: Two-Dimensional Kinematics',
        authorOrPublisher: 'OpenStax / Rice University',
        type: 'oer',
      },
    ],
    initialNotes:
      'Projectile Reminders:\n• x and y are independent.\n• a_x = 0, a_y = -9.8 m/s²\n• 45° maximizes range.\n• Complementary angles (30° & 60°) have matching range.',
    questions: [
      {
        id: 'q_proj_1',
        lessonId: 'lesson_projectile_motion',
        conceptId: 'projectile_motion',
        prompt: 'What is the horizontal acceleration (a_x) of an ideal projectile traveling through the air (neglecting drag)?',
        type: 'multiple_choice',
        difficulty: 'EASY',
        options: [
          { id: 'opt_pa1', text: '9.8 m/s² downward', isCorrect: false, feedback: 'Gravity only acts vertically (a_y), not horizontally.' },
          { id: 'opt_pa2', text: '0 m/s²', isCorrect: true, feedback: 'Correct! With zero horizontal net force, horizontal velocity is constant.' },
          { id: 'opt_pa3', text: 'Proportional to launch angle', isCorrect: false, feedback: 'Angle determines initial velocity components, not horizontal acceleration.' },
        ],
        explanation: 'In ideal projectile motion, gravity acts strictly downward along the y-axis, making a_x = 0.',
        misconceptionTag: 'horizontal_gravity_myth',
        hint: {
          id: 'hint_pq1',
          conceptId: 'projectile_motion',
          hints: [
            'Consider which direction gravity pulls on an airborne object.',
            'Is there any horizontal force acting on the projectile in free flight?',
            'Without air resistance, no horizontal force exists, so a_x = 0 m/s².',
          ],
        },
      },
      {
        id: 'q_proj_2',
        lessonId: 'lesson_projectile_motion',
        conceptId: 'projectile_motion',
        prompt: 'Which two complementary launch angles achieve the exact same horizontal range for the same launch speed?',
        type: 'conceptual',
        difficulty: 'MEDIUM',
        options: [
          { id: 'opt_pa4', text: '20° and 80°', isCorrect: false, feedback: 'Angles must sum to 90°.' },
          { id: 'opt_pa5', text: '30° and 60°', isCorrect: true, feedback: 'Spot on! sin(2·30°) = sin(60°) = sin(2·60°) = sin(120°) = √3/2.' },
          { id: 'opt_pa6', text: '45° and 55°', isCorrect: false, feedback: 'Sum is 100°, not complementary.' },
        ],
        explanation: 'Complementary angles (angles summing to 90°) yield the exact same value for sin(2θ).',
        misconceptionTag: 'complementary_range',
        hint: {
          id: 'hint_pq2',
          conceptId: 'projectile_motion',
          hints: [
            'Look at the range formula: R = (v_0² · sin 2θ) / g.',
            'Trigonometric identity: sin(2·(90° - θ)) = sin(180° - 2θ) = sin(2θ).',
            'Any pair that sums to 90° (like 30° and 60°) produces identical range.',
          ],
        },
      },
    ],
    progressiveHints: [
      {
        id: 'ph_proj_1',
        stepId: 'step_1_proj_intro',
        conceptId: 'projectile_motion',
        hints: [
          'Decompose the 2D vector into independent x and y components.',
          'Horizontal motion has constant speed; vertical motion has constant downward acceleration g.',
          'Time of flight is dictated entirely by vertical motion: t = 2·v_0·sin(θ) / g.',
        ],
      },
    ],
  },

  human_heart_anatomy: {
    id: 'lesson_human_heart',
    conceptId: 'human_heart_anatomy',
    topicTitle: 'Human Heart Anatomy & Dual Circulation',
    subject: 'Biology',
    gradeLevel: 'High School Biology / Pre-Med',
    estimatedMinutes: 8,
    hasFormulas: false,
    learningObjective:
      'Trace blood flow through the 4 cardiac chambers, pulmonary circuit, and systemic circulation.',
    steps: [
      {
        id: 'step_1_heart_intro',
        stepNumber: 1,
        title: 'The Dual Muscular Pump',
        subtitle: 'Pulmonary vs Systemic Circuit',
        buddyDialogue:
          "Welcome to anatomy! The human heart isn't just one pump—it's two coordinated pumps working in perfect synchronization. The right side pumps deoxygenated blood to your lungs, while the left side delivers oxygen-rich blood to your entire body!",
        buddyState: 'INTRODUCING',
        boardTitle: 'Dual-Circuit Circulatory System',
        boardSummary:
          'The human cardiovascular system relies on four chambers (Right/Left Atria and Right/Left Ventricles) to separate oxygen-poor blood from oxygenated blood.',
        keyPrinciple:
          'Right Atrium ──▶ Right Ventricle ──▶ Pulmonary Artery ──▶ Lungs (Oxygenation) ──▶ Pulmonary Vein ──▶ Left Atrium ──▶ Left Ventricle (Thick Myocardium) ──▶ Aorta ──▶ Body.',
        visualType: 'interactive_diagram',
        example: {
          title: 'Left Ventricle Thickness',
          description:
            'The left ventricle wall is ~3x thicker than the right because it must pump against systemic arterial resistance all the way to your toes!',
        },
        hintText: 'Blood always flows from Atrium (receiver) to Ventricle (pump) and out through arteries.',
      },
    ],
    flashcards: [
      {
        id: 'fc_h1',
        front: 'Which valve separates the Left Atrium and Left Ventricle?',
        back: 'The Mitral (Bicuspid) Valve. Prevents backflow during left ventricular contraction.',
        category: 'Valves',
      },
      {
        id: 'fc_h2',
        front: 'Why is the Left Ventricle wall much thicker than the Right Ventricle?',
        back: 'It must generate high hydrostatic pressure to drive systemic circulation across the entire body, whereas the right ventricle only pumps to the nearby lungs.',
        category: 'Myocardium',
      },
    ],
    sources: [
      {
        id: 'src_h1',
        title: "Gray's Anatomy for Students",
        authorOrPublisher: 'Elsevier Health Sciences',
        type: 'textbook',
      },
    ],
    initialNotes:
      'Heart Notes:\n• 4 chambers: RA, RV, LA, LV.\n• Atria receive; Ventricles pump.\n• Valves ensure strictly unidirectional flow.',
    questions: [
      {
        id: 'q_heart_1',
        lessonId: 'lesson_human_heart',
        conceptId: 'human_heart_anatomy',
        prompt: 'Why is the muscular myocardium of the Left Ventricle significantly thicker than that of the Right Ventricle?',
        type: 'conceptual',
        difficulty: 'MEDIUM',
        options: [
          { id: 'opt_h1', text: 'It holds a significantly greater volume of blood than the right ventricle', isCorrect: false, feedback: 'Both ventricles pump identical stroke volumes per beat (~70mL).' },
          { id: 'opt_h2', text: 'It must generate high systemic pressure to perfuse the entire body against peripheral resistance', isCorrect: true, feedback: 'Correct! The right ventricle only pumps to the low-resistance pulmonary circuit.' },
          { id: 'opt_h3', text: 'It stores oxygen directly within the muscular wall', isCorrect: false, feedback: 'Oxygen is carried in red blood cell hemoglobin within coronary capillaries.' },
        ],
        explanation: 'The left ventricle pumps against systemic afterload (~120 mmHg) throughout the entire body, requiring a thick muscular wall.',
        misconceptionTag: 'volume_vs_pressure_hypertrophy',
        hint: {
          id: 'hint_hq1',
          conceptId: 'human_heart_anatomy',
          hints: [
            'Compare the destination distance: lungs (adjacent) vs systemic circulation (head to toes).',
            'Consider the hydraulic resistance the heart must overcome in systemic arteries.',
            'Higher resistance requires greater contractile muscle thickness.',
          ],
        },
      },
    ],
    progressiveHints: [
      {
        id: 'ph_heart_1',
        stepId: 'step_1_heart_intro',
        conceptId: 'human_heart_anatomy',
        hints: [
          'Remember the dual circuit: pulmonary (right heart to lungs) and systemic (left heart to body).',
          'Atria receive returning blood; ventricles contract forcefully to pump blood away.',
          'Valves act as strictly one-way doors ensuring unidirectional laminar blood flow.',
        ],
      },
    ],
  },

  quadratic_equation: {
    id: 'lesson_quadratic_equation',
    conceptId: 'quadratic_equation',
    topicTitle: 'Quadratic Equations & Parabolas',
    subject: 'Mathematics',
    gradeLevel: 'High School Algebra',
    estimatedMinutes: 10,
    hasFormulas: true,
    learningObjective:
      'Analyze the geometric and algebraic properties of parabolas, vertex symmetry, and roots using the quadratic formula.',
    steps: [
      {
        id: 'step_1_quad_intro',
        stepNumber: 1,
        title: 'The Parabolic Curve',
        subtitle: 'Geometric Symmetry',
        buddyDialogue:
          "Welcome to Algebra! A quadratic function creates a smooth U-shaped curve called a parabola. Notice how it is perfectly symmetrical around its vertical axis of symmetry!",
        buddyState: 'INTRODUCING',
        boardTitle: 'Anatomy of a Parabola',
        boardSummary:
          'Standard quadratic form is y = ax² + bx + c. The coefficient "a" determines whether the parabola opens upward (a > 0) or downward (a < 0).',
        keyPrinciple:
          'Every parabola has an axis of symmetry passing through its vertex at x = -b / (2a).',
        formulaSnippet: 'y = a·x² + b·x + c',
        visualType: 'graph',
        example: {
          title: 'Everyday Parabolas',
          description: 'Satellite dishes, flashlight reflectors, suspension bridge cables, and fountain water arcs all trace parabolic trajectories.',
        },
      },
      {
        id: 'step_2_quad_vertex',
        stepNumber: 2,
        title: 'Finding the Vertex & Axis',
        subtitle: 'Maximum or Minimum Point',
        buddyDialogue:
          "The vertex is the highest or lowest turning point on the curve. Let's calculate its x-coordinate using x = -b / 2a!",
        buddyState: 'EXPLAINING',
        boardTitle: 'Vertex Coordinates (h, k)',
        boardSummary:
          'The vertex represents the global extremum of the quadratic function. When a > 0, the vertex is a minimum; when a < 0, it is a maximum.',
        keyPrinciple:
          'Evaluating f(-b / 2a) gives the exact optimal y-value (k) of the vertex.',
        formulaSnippet: 'h = -b / (2a), k = f(h)',
        visualType: 'graph',
      },
      {
        id: 'step_3_quad_roots',
        stepNumber: 3,
        title: 'Roots & Discriminant',
        subtitle: 'Where the Curve Intersects Y = 0',
        buddyDialogue:
          "The discriminant Δ = b² - 4ac tells us instantly how many times the parabola crosses the x-axis: two real roots, one repeated root, or zero real roots!",
        buddyState: 'EXPLAINING',
        boardTitle: 'The Discriminant Discriminates',
        boardSummary:
          'If Δ > 0: two distinct x-intercepts. If Δ = 0: tangent to the x-axis at one point. If Δ < 0: the curve never touches the x-axis in real space.',
        keyPrinciple:
          'Discriminant Δ = b² - 4ac dictates the nature and multiplicity of the roots.',
        formulaSnippet: 'Δ = b² - 4·a·c',
        visualType: 'graph',
      },
      {
        id: 'step_4_quad_formula',
        stepNumber: 4,
        title: 'The Universal Quadratic Formula',
        subtitle: 'Exact Analytical Solutions',
        buddyDialogue:
          "No matter how messy the equation looks, the quadratic formula always gives the exact coordinates of the roots!",
        buddyState: 'THINKING',
        boardTitle: 'Solving for Roots',
        boardSummary:
          'The quadratic formula gives both roots simultaneously by taking the plus and minus square root of the discriminant.',
        keyPrinciple:
          'Roots represent the exact x-values where f(x) = 0.',
        formulaSnippet: 'x = (-b ± √(b² - 4ac)) / (2a)',
        visualType: 'graph',
        checkQuestion: {
          id: 'q_quad_1',
          prompt: 'What happens to the roots of y = x² - 4x + 4 if we compute the discriminant?',
          options: [
            { id: 'opt_q1', text: 'Δ = 0, so there is exactly one repeated real root (x = 2)', isCorrect: true, feedback: 'Correct! (-4)² - 4(1)(4) = 16 - 16 = 0, so the vertex sits directly on the x-axis.' },
            { id: 'opt_q2', text: 'Δ > 0, so there are two distinct real roots', isCorrect: false, feedback: 'Compute b² - 4ac: 16 - 16 = 0.' },
            { id: 'opt_q3', text: 'Δ < 0, so there are no real roots', isCorrect: false, feedback: 'The discriminant equals 0, not a negative number.' },
          ],
        },
      },
      {
        id: 'step_5_quad_summary',
        stepNumber: 5,
        title: 'Mastery & Synthesis',
        subtitle: 'Connecting Geometry to Algebra',
        buddyDialogue:
          "Spectacular work! You now understand how the algebraic coefficients a, b, and c translate into the curvature, vertex, and roots of a parabola!",
        buddyState: 'CELEBRATING',
        boardTitle: 'Quadratic Synthesis',
        boardSummary:
          'Quadratic relationships appear throughout physics, machine learning loss surfaces, and structural engineering.',
        keyPrinciple:
          'Symmetry, curvature, and discriminant together completely characterize any parabolic system.',
        formulaSnippet: 'f(x) = a·(x - h)² + k',
        visualType: 'graph',
      },
    ],
  },

  molecular_bonding: {
    id: 'lesson_molecular_bonding',
    conceptId: 'molecular_bonding',
    topicTitle: 'Covalent Bonding & Molecular Geometry',
    subject: 'Chemistry',
    gradeLevel: 'High School Chemistry',
    estimatedMinutes: 8,
    hasFormulas: false,
    learningObjective:
      'Understand how valence electron sharing and VSEPR repulsion determine the 104.5° bent geometry of water.',
    steps: [
      {
        id: 'step_1_mol_intro',
        stepNumber: 1,
        title: 'Covalent Electron Sharing',
        subtitle: 'The Octet Rule',
        buddyDialogue:
          "Welcome to chemistry! Atoms form covalent bonds by sharing pairs of valence electrons to achieve stable, full electron shells.",
        buddyState: 'INTRODUCING',
        boardTitle: 'Why Atoms Share Electrons',
        boardSummary:
          'In a covalent bond, two non-metal atoms share valence electrons so both atoms can complete their outer valence shells.',
        keyPrinciple:
          'Shared electron density between two positively charged nuclei creates the attractive covalent bond.',
        visualType: 'molecular_visual',
      },
      {
        id: 'step_2_mol_vsepr',
        stepNumber: 2,
        title: 'VSEPR Theory',
        subtitle: 'Valence Shell Electron Pair Repulsion',
        buddyDialogue:
          "Electron pairs carry negative charge, so they naturally push each other as far apart as possible in 3D space!",
        buddyState: 'EXPLAINING',
        boardTitle: 'VSEPR Electron Repulsion',
        boardSummary:
          'Electrons in chemical bonds and lone pairs repel each other. Molecules adopt 3D geometries that minimize this electrostatic repulsion.',
        keyPrinciple:
          'Lone electron pairs exert stronger repulsion than shared bonding pairs.',
        visualType: 'molecular_visual',
      },
      {
        id: 'step_3_mol_h2o',
        stepNumber: 3,
        title: 'The Water Molecule (H₂O)',
        subtitle: 'The 104.5° Bent Angle',
        buddyDialogue:
          "In water, oxygen has two single bonds to hydrogen and two unshared lone pairs. The lone pairs compress the H-O-H bond angle from 109.5° down to 104.5°!",
        buddyState: 'EXPLAINING',
        boardTitle: 'Bent Geometry of H₂O',
        boardSummary:
          'Oxygen forms a tetrahedral electron geometry, but its two bulky lone pairs compress the visible molecular bond angle to 104.5°.',
        keyPrinciple:
          'Lone pair-lone pair repulsion > lone pair-bond pair repulsion > bond pair-bond pair repulsion.',
        visualType: 'molecular_visual',
      },
      {
        id: 'step_4_mol_polarity',
        stepNumber: 4,
        title: 'Molecular Dipole Moment',
        subtitle: 'Why Water is Universal Solvent',
        buddyDialogue:
          "Because oxygen pulls shared electrons much harder than hydrogen, water has a permanent dipole moment—making it the essential liquid for life!",
        buddyState: 'THINKING',
        boardTitle: 'Electronegativity & Polarity',
        boardSummary:
          'Oxygen has high electronegativity (3.44), while hydrogen is 2.20. The partial negative charge on oxygen and partial positive on hydrogen create a polar molecule.',
        keyPrinciple:
          'Asymmetric bent geometry prevents bond dipoles from canceling out.',
        visualType: 'molecular_visual',
        checkQuestion: {
          id: 'q_mol_1',
          prompt: 'Why is the bond angle in water (104.5°) smaller than the ideal tetrahedral angle (109.5°)?',
          options: [
            { id: 'opt_m1', text: 'Oxygen’s two lone pairs exert stronger repulsion, compressing the bond angle', isCorrect: true, feedback: 'Spot on! Non-bonding lone electron pairs occupy more spatial volume and repel adjacent bonds.' },
            { id: 'opt_m2', text: 'Hydrogen atoms attract each other through nuclear gravity', isCorrect: false, feedback: 'Electrostatic electron repulsion governs geometry, not gravitational forces.' },
            { id: 'opt_m3', text: 'The covalent bonds are too weak to maintain 109.5°', isCorrect: false, feedback: 'Covalent bonds in water are very strong.' },
          ],
        },
      },
      {
        id: 'step_5_mol_summary',
        stepNumber: 5,
        title: 'Molecular Mastery',
        subtitle: 'From Geometry to Life',
        buddyDialogue:
          "Brilliant! You now understand how subatomic electron repulsion creates the precise 3D shapes of molecules that govern all of biochemistry!",
        buddyState: 'CELEBRATING',
        boardTitle: 'Molecular Architecture',
        boardSummary:
          'From simple water to complex enzyme active sites, 3D molecular geometry determines every chemical interaction in the universe.',
        keyPrinciple:
          'Form dictates function in molecular chemistry.',
        visualType: 'molecular_visual',
      },
    ],
  },

  binary_search: {
    id: 'lesson_binary_search',
    conceptId: 'binary_search',
    topicTitle: 'Binary Search & Divide and Conquer',
    subject: 'Programming',
    gradeLevel: 'Computer Science',
    estimatedMinutes: 8,
    hasFormulas: true,
    learningObjective:
      'Master the logarithmic O(log n) efficiency of binary search by systematically halving the search space on sorted data.',
    steps: [
      {
        id: 'step_1_bin_intro',
        stepNumber: 1,
        title: 'The Power of Sorted Data',
        subtitle: 'Why Linear Scan is Slow',
        buddyDialogue:
          "Welcome to Algorithms! If an array of a billion elements is sorted, you don't have to check them one by one. You can find any item in just 30 comparisons!",
        buddyState: 'INTRODUCING',
        boardTitle: 'Logarithmic Search Space',
        boardSummary:
          'Linear search requires O(n) worst-case comparisons. Binary search exploits order to eliminate half the remaining candidates with each single comparison.',
        keyPrinciple:
          'Binary search requires the input dataset to be strictly sorted.',
        formulaSnippet: 'Time Complexity: O(log₂ n)',
        visualType: 'code_visual',
      },
      {
        id: 'step_2_bin_pointers',
        stepNumber: 2,
        title: 'Three Essential Pointers',
        subtitle: 'Low, Mid, and High',
        buddyDialogue:
          "Binary search maintains three indices: low at the start, high at the end, and mid right in the center: mid = low + (high - low) / 2!",
        buddyState: 'EXPLAINING',
        boardTitle: 'Pointer Mechanics',
        boardSummary:
          'By inspecting array[mid], we decide whether the target is in the left half or the right half, instantly discarding the other half.',
        keyPrinciple:
          'Use mid = low + (high - low) / 2 to avoid 32-bit integer overflow.',
        formulaSnippet: 'mid = low + ((high - low) >> 1)',
        visualType: 'code_visual',
      },
      {
        id: 'step_3_bin_decision',
        stepNumber: 3,
        title: 'The Branching Decision',
        subtitle: 'Halving the Search Range',
        buddyDialogue:
          "If target < array[mid], high becomes mid - 1. If target > array[mid], low becomes mid + 1. If equal, target is found!",
        buddyState: 'EXPLAINING',
        boardTitle: 'Binary Branching Logic',
        boardSummary:
          'If array[mid] == target: return mid. Else if target < array[mid]: search left half (high = mid - 1). Else: search right half (low = mid + 1).',
        keyPrinciple:
          'Search window size: n -> n/2 -> n/4 -> ... -> 1 in at most log₂ n steps.',
        formulaSnippet: 'k = ⌈log₂ n⌉ steps',
        visualType: 'code_visual',
      },
      {
        id: 'step_4_bin_check',
        stepNumber: 4,
        title: 'Algorithm Invariants',
        subtitle: 'Loop Termination Condition',
        buddyDialogue:
          "Let's test your algorithmic thinking! What is the exact loop condition that guarantees binary search will never loop infinitely?",
        buddyState: 'THINKING',
        boardTitle: 'Loop Invariant (low <= high)',
        boardSummary:
          'The search continues as long as low <= high. When low exceeds high, the search window has collapsed and the target does not exist in the array.',
        keyPrinciple:
          'Loop terminates when target is found or when low > high.',
        formulaSnippet: 'while (low <= high)',
        visualType: 'code_visual',
        checkQuestion: {
          id: 'q_bin_1',
          prompt: 'How many comparisons does binary search need in the worst case for an array of 1,024 sorted elements?',
          options: [
            { id: 'opt_b1', text: 'At most 10 or 11 comparisons (since 2¹⁰ = 1024)', isCorrect: true, feedback: 'Spot on! log₂(1024) = 10 steps, demonstrating the massive advantage of O(log n).' },
            { id: 'opt_b2', text: '512 comparisons', isCorrect: false, feedback: 'That would be half of linear search; binary search cuts in half every single step.' },
            { id: 'opt_b3', text: '1,024 comparisons', isCorrect: false, feedback: '1,024 is linear search worst case.' },
          ],
        },
      },
      {
        id: 'step_5_bin_summary',
        stepNumber: 5,
        title: 'Algorithmic Mastery',
        subtitle: 'Divide and Conquer Everywhere',
        buddyDialogue:
          "Outstanding! You've mastered binary search. This divide-and-conquer strategy is the foundation of database indexing, B-trees, and modern high-speed search engines!",
        buddyState: 'CELEBRATING',
        boardTitle: 'Binary Search Synthesis',
        boardSummary:
          'From Git bisect to relational database B-Trees, binary search is one of the most powerful algorithms in computer science.',
        keyPrinciple:
          'Exponentially large search spaces collapse into small logarithmic operational times.',
        formulaSnippet: 'O(log n) logarithmic scaling',
        visualType: 'code_visual',
      },
    ],
  },

  french_revolution: {
    id: 'lesson_french_revolution',
    conceptId: 'french_revolution',
    topicTitle: 'The French Revolution & Republic (1789)',
    subject: 'History/GK',
    gradeLevel: 'World History',
    estimatedMinutes: 10,
    hasFormulas: false,
    learningObjective:
      'Analyze the chronological turning points of the French Revolution from the Estates-General to the collapse of the absolute monarchy.',
    steps: [
      {
        id: 'step_1_fr_intro',
        stepNumber: 1,
        title: 'The Ancien Régime in Crisis',
        subtitle: 'Debt, Famine, and Inequality',
        buddyDialogue:
          "Welcome to World History! In 1789, France was near bankruptcy after funding the American Revolution. Decades of bad harvests and deep feudal inequalities triggered an unstoppable wave of transformation!",
        buddyState: 'INTRODUCING',
        boardTitle: 'France on the Brink (May 1789)',
        boardSummary:
          'French society was split into Three Estates: Clergy (First), Nobility (Second), and the Commoners (Third). Though representing 98% of the population, the Third Estate had almost no political power.',
        keyPrinciple:
          'Severe fiscal crisis and unfair taxation forced King Louis XVI to convene the Estates-General for the first time in 175 years.',
        visualType: 'timeline',
      },
      {
        id: 'step_2_fr_bastille',
        stepNumber: 2,
        title: 'Storming of the Bastille',
        subtitle: 'July 14, 1789',
        buddyDialogue:
          "On July 14, 1789, fear of royal military intervention pushed the citizens of Paris to storm the Bastille medieval fortress—seizing gunpowder and toppling the symbol of royal despotism!",
        buddyState: 'EXPLAINING',
        boardTitle: 'Fall of the Royal Fortress',
        boardSummary:
          'The storming of the Bastille marked the decisive entry of ordinary citizens into the revolution, forcing King Louis XVI to recognize the National Assembly.',
        keyPrinciple:
          'July 14 remains France’s national holiday (Bastille Day) celebrating popular sovereignty.',
        visualType: 'timeline',
      },
      {
        id: 'step_3_fr_rights',
        stepNumber: 3,
        title: 'Declaration of the Rights of Man',
        subtitle: 'August 26, 1789',
        buddyDialogue:
          "In August 1789, the National Assembly drafted one of the most influential political documents in human history: Declaration of the Rights of Man and of the Citizen!",
        buddyState: 'EXPLAINING',
        boardTitle: 'Liberty, Equality, Fraternity',
        boardSummary:
          'The Declaration proclaimed that all men are born free and equal in rights, abolishing feudal privileges and establishing freedom of speech, religion, and equal taxation.',
        keyPrinciple:
          'Sovereignty resided in the nation rather than in the divine right of the monarch.',
        visualType: 'timeline',
      },
      {
        id: 'step_4_fr_republic',
        stepNumber: 4,
        title: 'From Monarchy to Republic',
        subtitle: '1792–1793',
        buddyDialogue:
          "As foreign monarchies declared war on revolutionary France, the monarchy was abolished and the First French Republic was proclaimed in September 1792.",
        buddyState: 'THINKING',
        boardTitle: 'The First French Republic',
        boardSummary:
          'In 1793, King Louis XVI and Queen Marie Antoinette were executed, and the revolution entered a radical phase under Maximilien Robespierre known as the Reign of Terror.',
        keyPrinciple:
          'The revolution redefined citizenship, legal equality, and secular democratic ideals across Europe.',
        visualType: 'timeline',
        checkQuestion: {
          id: 'q_fr_1',
          prompt: 'Which famous fortress was stormed by Parisian citizens on July 14, 1789?',
          options: [
            { id: 'opt_f1', text: 'The Bastille', isCorrect: true, feedback: 'Correct! The Bastille was a state prison and weapons armory that symbolized royal tyranny.' },
            { id: 'opt_f2', text: 'The Palace of Versailles', isCorrect: false, feedback: 'Versailles was the royal palace outside Paris where the king resided.' },
            { id: 'opt_f3', text: 'The Tower of London', isCorrect: false, feedback: 'The Tower of London is in England.' },
          ],
        },
      },
      {
        id: 'step_5_fr_summary',
        stepNumber: 5,
        title: 'Revolutionary Legacy',
        subtitle: 'Birth of Modern Democracy',
        buddyDialogue:
          "Incredible historical insight! The French Revolution abolished feudalism, created the modern nation-state, and inspired democratic movements across the globe!",
        buddyState: 'CELEBRATING',
        boardTitle: 'Historical Impact',
        boardSummary:
          'The ideals of 1789—human rights, popular sovereignty, and constitutional rule of law—formed the bedrock of contemporary global democracy.',
        keyPrinciple:
          'Power derives from the consent and rights of the governed.',
        visualType: 'timeline',
      },
    ],
  },

  linear_regression: {
    id: 'lesson_linear_regression',
    conceptId: 'linear_regression',
    topicTitle: 'Linear Regression & Best Fit Line',
    subject: 'Data Science',
    gradeLevel: 'Introductory Machine Learning',
    estimatedMinutes: 10,
    hasFormulas: true,
    learningObjective:
      'Learn how Ordinary Least Squares (OLS) minimizes residual error to find the optimal trendline y = mx + c.',
    steps: [
      {
        id: 'step_1_lr_intro',
        stepNumber: 1,
        title: 'Predicting with Data',
        subtitle: 'Linear Trends in Scatter Plots',
        buddyDialogue:
          "Welcome to Data Science! If you have data points showing study hours versus exam scores, how do you draw the single best line that captures the trend? That's Linear Regression!",
        buddyState: 'INTRODUCING',
        boardTitle: 'The Trendline y = mx + c',
        boardSummary:
          'Linear regression models the relationship between an independent variable (x) and a dependent variable (y) using a straight line.',
        keyPrinciple:
          'Slope (m) indicates the rate of change; intercept (c) is the baseline value when x = 0.',
        formulaSnippet: 'y = m·x + c + ε',
        visualType: 'graph',
      },
      {
        id: 'step_2_lr_residuals',
        stepNumber: 2,
        title: 'Residuals & Prediction Errors',
        subtitle: 'Distance from Point to Line',
        buddyDialogue:
          "For every data point, the residual is the vertical distance between the actual observed value and the line's prediction: e = y_actual - y_pred!",
        buddyState: 'EXPLAINING',
        boardTitle: 'Residual Distance (e_i)',
        boardSummary:
          'Positive residuals mean the actual point is above the line; negative residuals mean it is below. The best line should balance these errors.',
        keyPrinciple:
          'Residual e_i = y_i - (m·x_i + c).',
        formulaSnippet: 'e_i = y_i - ŷ_i',
        visualType: 'graph',
      },
      {
        id: 'step_3_lr_ols',
        stepNumber: 3,
        title: 'Ordinary Least Squares (OLS)',
        subtitle: 'Minimizing the Sum of Squared Errors',
        buddyDialogue:
          "Why square the residuals? Squaring ensures positive and negative errors don't cancel each other out, and heavily penalizes large outliers!",
        buddyState: 'EXPLAINING',
        boardTitle: 'Loss Function: Loss = Σ (e_i)²',
        boardSummary:
          'Ordinary Least Squares calculates the exact slope and intercept that minimizes the total sum of squared residuals across all sample data points.',
        keyPrinciple:
          'Minimizing Σ(y_i - ŷ_i)² provides a mathematically unique closed-form solution.',
        formulaSnippet: 'Loss = Σ (y_i - ŷ_i)²',
        visualType: 'graph',
      },
      {
        id: 'step_4_lr_check',
        stepNumber: 4,
        title: 'Evaluating Fit: R² Score',
        subtitle: 'Coefficient of Determination',
        buddyDialogue:
          "How do we know if our line is actually good? The R² score measures what percentage of the variance in y is explained by our model!",
        buddyState: 'THINKING',
        boardTitle: 'The R-Squared Metric',
        boardSummary:
          'R² = 1 means the line passes through every single data point perfectly. R² = 0 means the line explains none of the variation beyond the simple average.',
        keyPrinciple:
          'R² = 1 - (SS_res / SS_tot) quantifies goodness of fit.',
        formulaSnippet: 'R² = 1 - (Σ e_i² / Σ (y_i - ȳ)²)',
        visualType: 'graph',
        checkQuestion: {
          id: 'q_lr_1',
          prompt: 'What happens to the residual sum of squares when the regression line fits the data points more closely?',
          options: [
            { id: 'opt_l1', text: 'Residual sum of squares decreases toward zero, and R² approaches 1.0', isCorrect: true, feedback: 'Correct! Better fit means smaller residuals, driving the loss function toward zero.' },
            { id: 'opt_l2', text: 'Residual sum of squares increases exponentially', isCorrect: false, feedback: 'Residuals measure error, which shrinks as fit improves.' },
            { id: 'opt_l3', text: 'Residual sum of squares remains completely unchanged', isCorrect: false, feedback: 'Residuals directly depend on how close the line is to the points.' },
          ],
        },
      },
      {
        id: 'step_5_lr_summary',
        stepNumber: 5,
        title: 'Data Science Mastery',
        subtitle: 'Foundation of Machine Learning',
        buddyDialogue:
          "Fantastic job! Linear regression and least squares optimization are the foundational building blocks of modern machine learning and neural networks!",
        buddyState: 'CELEBRATING',
        boardTitle: 'Predictive Modeling Synthesis',
        boardSummary:
          'From simple linear regression to multi-variable deep learning, minimizing squared error loss functions is at the heart of artificial intelligence.',
        keyPrinciple:
          'Predictive models learn by finding parameters that minimize loss on empirical data.',
        formulaSnippet: 'm* = Cov(X, Y) / Var(X)',
        visualType: 'graph',
      },
    ],
  },
};

/**
 * Retrieves the classroom lesson data for a given concept.
 * Gracefully handles synonyms and generates dynamic structured lessons for curriculum catalog topics.
 */
export function getClassroomLesson(conceptId: string): ClassroomLesson {
  const normalized = conceptId.toLowerCase().trim();

  // 1. Direct match in canonical dictionary
  if (CANONICAL_CLASSROOM_LESSONS[normalized]) {
    return CANONICAL_CLASSROOM_LESSONS[normalized];
  }

  // 2. Academic synonyms and alias matching
  if (normalized.includes('motor') || normalized.includes('electric') || normalized.includes('commutation')) {
    return CANONICAL_CLASSROOM_LESSONS.dc_motor;
  }
  if (normalized.includes('projectile') || normalized.includes('kinematic')) {
    return CANONICAL_CLASSROOM_LESSONS.projectile_motion;
  }
  if (
    normalized.includes('heart') ||
    normalized.includes('cardio') ||
    normalized.includes('cardiac') ||
    normalized.includes('anatomy')
  ) {
    return CANONICAL_CLASSROOM_LESSONS.human_heart_anatomy;
  }
  if (normalized.includes('quadratic') || normalized.includes('parabola')) {
    return CANONICAL_CLASSROOM_LESSONS.quadratic_equation;
  }
  if (normalized.includes('molecule') || normalized.includes('bonding') || normalized.includes('covalent')) {
    return CANONICAL_CLASSROOM_LESSONS.molecular_bonding;
  }
  if (normalized.includes('binary_search') || normalized.includes('search') || normalized.includes('algorithm')) {
    return CANONICAL_CLASSROOM_LESSONS.binary_search;
  }
  if (normalized.includes('revolution') || normalized.includes('french') || normalized.includes('bastille')) {
    return CANONICAL_CLASSROOM_LESSONS.french_revolution;
  }
  if (normalized.includes('regression') || normalized.includes('scatter') || normalized.includes('least_squares')) {
    return CANONICAL_CLASSROOM_LESSONS.linear_regression;
  }

  // 3. Dynamic synthesis for any recognized curriculum topic
  const humanTitle = normalized
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return {
    id: `lesson_${normalized}`,
    conceptId: normalized,
    topicTitle: humanTitle,
    subject: 'General Science',
    gradeLevel: 'Foundational Curriculum',
    estimatedMinutes: 8,
    hasFormulas: false,
    learningObjective: `Master the foundational scientific and analytical principles of ${humanTitle}.`,
    steps: [
      {
        id: `step_1_${normalized}_intro`,
        stepNumber: 1,
        title: `Introduction to ${humanTitle}`,
        subtitle: 'Core Foundations',
        buddyDialogue: `Welcome to class! Today we explore ${humanTitle}. Let's examine how this fundamental concept works step by step.`,
        buddyState: 'INTRODUCING',
        boardTitle: `Overview: ${humanTitle}`,
        boardSummary: `Foundational study of ${humanTitle} and its governing mechanisms in academic study.`,
        keyPrinciple: `Understanding the essential relationships that define ${humanTitle}.`,
        visualType: 'scientific_diagram',
      },
      {
        id: `step_2_${normalized}_explain`,
        stepNumber: 2,
        title: 'Core Mechanisms',
        subtitle: 'Structural Breakdown',
        buddyDialogue: `Let's break down the key parts that make ${humanTitle} work in practice!`,
        buddyState: 'EXPLAINING',
        boardTitle: `Structural Mechanics: ${humanTitle}`,
        boardSummary: `Detailed analysis of structural components, governing inputs, and observable outputs.`,
        keyPrinciple: `Every element plays a specific role in maintaining equilibrium.`,
        visualType: 'scientific_diagram',
      },
      {
        id: `step_3_${normalized}_demonstrate`,
        stepNumber: 3,
        title: 'Active Demonstration',
        subtitle: 'Observable Dynamics',
        buddyDialogue: `Observe how variables shift and interact under changing experimental conditions!`,
        buddyState: 'EXPLAINING',
        boardTitle: `Operational Dynamics`,
        boardSummary: `Observing the functional transformation in real time.`,
        keyPrinciple: `Causes lead predictably to observable physical effects.`,
        visualType: 'scientific_diagram',
      },
      {
        id: `step_4_${normalized}_interact`,
        stepNumber: 4,
        title: 'Active Check',
        subtitle: 'Testing Your Understanding',
        buddyDialogue: `Think carefully about how this principle applies to real-world scenarios!`,
        buddyState: 'THINKING',
        boardTitle: 'Knowledge Check',
        boardSummary: `Apply the core principle to verify your intuition.`,
        keyPrinciple: `Verifying foundational understanding before advanced synthesis.`,
        visualType: 'scientific_diagram',
        checkQuestion: {
          id: `q_${normalized}_1`,
          prompt: `Which principle is most critical to understanding ${humanTitle}?`,
          options: [
            { id: 'opt_syn_1', text: `Conservation and structural relationships govern ${humanTitle}`, isCorrect: true, feedback: 'Correct! Systematic principles govern every physical and mathematical model.' },
            { id: 'opt_syn_2', text: 'Outcomes happen completely at random without underlying rules', isCorrect: false, feedback: 'Natural systems adhere to strict physical and analytical laws.' },
          ],
        },
      },
      {
        id: `step_5_${normalized}_summary`,
        stepNumber: 5,
        title: 'Synthesis & Mastery',
        subtitle: 'Key Takeaways',
        buddyDialogue: `Outstanding effort! You now have a firm grasp of ${humanTitle}!`,
        buddyState: 'CELEBRATING',
        boardTitle: 'Summary of Key Principles',
        boardSummary: `Reviewing the essential concepts and real-world implications of ${humanTitle}.`,
        keyPrinciple: `Mastery builds cumulative intuition for more complex explorations.`,
        visualType: 'scientific_diagram',
      },
    ],
  };
}
