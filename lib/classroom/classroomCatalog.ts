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
};

/**
 * Retrieves the classroom lesson data for a given concept.
 * Gracefully handles synonyms like 'electric_motor' -> 'dc_motor'.
 */
export function getClassroomLesson(conceptId: string): ClassroomLesson {
  const normalized = conceptId.toLowerCase().trim();

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

  if (CANONICAL_CLASSROOM_LESSONS[normalized]) {
    return CANONICAL_CLASSROOM_LESSONS[normalized];
  }

  // Default to DC Motor pilot
  return CANONICAL_CLASSROOM_LESSONS.dc_motor;
}
