/**
 * Smart Board teaching content: the THEORY each lesson step teaches.
 *
 * The Class used to show a large visual with a one-line summary, so the board
 * read like a visual demo rather than a lesson. Each step now carries a short,
 * structured explanation the visual supports:
 *
 *   why       why this step matters (1–2 sentences)
 *   points    core idea, 3–5 concise points
 *   how       how it works, step by step; each point names the visual part it
 *             explains (`focus` = a `data-part` token drawn by that concept's
 *             renderer) and, optionally, what Buddy says about it
 *   observe   what to look at in the visual
 *   takeaway  one-line summary
 *   formulaIds  lesson formulas explained on this step (with variables)
 *
 * Content is written for THIS concept only and is consistent with the lesson's
 * authored summary, key principle, hints and checks: it reorganises what the
 * lesson teaches and adds only the concise explanation needed to understand it.
 * On predict-first steps the board keeps this hidden until the first attempt
 * (see selectBoardView), so the theory never answers the prediction for the learner.
 */

import type { ClassroomLesson, StepTeaching } from '@/components/classroom/types';

export interface LessonTeaching {
  definition: string;
  steps: Record<string, StepTeaching>;
}

export const LESSON_TEACHING: Record<string, LessonTeaching> = {
  // ---------------------------------------------------------------------------
  dc_motor: {
    definition:
      'A DC motor turns electrical energy into rotation: a magnetic field pushes on a current-carrying coil, and a commutator keeps that push turning the coil the same way.',
    steps: {
      step_1_intro: {
        why: 'Electric cars, drills, fans and drones all rely on this conversion. Once you see how a magnet pushes on a coil, every one of them makes sense.',
        observe: 'The copper coil sits between the north and south poles. Green arrows are the forces on the coil.',
        points: [
          'Input: electrical energy from a DC supply (the voltage V drives a current I).',
          'Output: mechanical energy, a turning shaft with torque τ and angular speed ω.',
          'The link is magnetism: a magnetic field pushes on a wire that carries a current.',
          'A motor is built so that those pushes turn the coil instead of just moving it sideways.',
        ],
        how: [
          { text: 'Electrical energy enters from the DC supply through the brushes.', focus: 'brushes', buddy: 'Follow the red and blue supply leads: this is where electrical energy enters the motor.' },
          { text: 'Current flows through the copper coil.', focus: 'coil', buddy: 'Now look at the copper coil. The yellow I arrows show the current flowing round it.' },
          { text: 'The magnets make a magnetic field from N to S across the coil.', focus: 'field', buddy: 'The dashed cyan lines are the magnetic field, running from the north pole to the south pole.' },
          { text: 'The field pushes on the current-carrying sides of the coil: one side up, the other down.', focus: 'force', buddy: 'See the green arrows: the field pushes one side of the coil up and the other side down.' },
          { text: 'Opposite pushes on opposite sides twist the coil. That twist is torque, so the coil turns.', focus: 'torque', buddy: 'Two opposite pushes on opposite sides make a twist. That twist, the torque, is what turns the motor.' },
        ],
        takeaway: 'Electrical energy in, rotation out: the magnetic force on a current-carrying coil does the conversion.',
      },
      step_2_components: {
        why: 'Every DC motor, from a toy to an electric car, is built from the same five parts. Knowing what each part does lets you explain any motor.',
        observe: 'Click each labelled part on the diagram to inspect it.',
        points: [
          'Two parts stay still: the magnets and the brushes.',
          'Three parts rotate together: the coil, the axle and the commutator.',
          'Current reaches the rotating coil through the sliding contact between the brushes and the commutator.',
        ],
        how: [
          { text: 'Permanent magnets (stator): fixed in place, they make the magnetic field from N to S.', focus: 'magnets' },
          { text: 'Armature coil (rotor): the copper loop that carries current and is pushed by the field.', focus: 'coil' },
          { text: 'Axle (shaft): turns with the coil and delivers the rotation to a load.', focus: 'axle' },
          { text: 'Split-ring commutator: two copper half-rings on the axle that swap the coil’s connections every half turn.', focus: 'commutator' },
          { text: 'Carbon brushes: stay still and press on the commutator, feeding current into the spinning coil.', focus: 'brushes' },
        ],
        takeaway: 'The magnets make the field, the coil carries the current, and the commutator and brushes keep the current flowing the right way as the coil turns.',
      },
      step_3_mechanism: {
        why: 'This push is what makes every motor turn. It also tells you which way a motor spins and how strongly.',
        observe: 'Compare the yellow current arrows on the two sides of the coil with the green force arrows.',
        points: [
          'A wire carrying a current in a magnetic field feels a force, F = B·I·L. It is largest when the wire is at right angles to the field.',
          'Current flows one way along one long side of the coil and the opposite way along the other.',
          'So the two forces are opposite: one side is pushed up, the other down.',
          'Two equal, opposite forces on either side of the axle form a couple, which produces a torque τ = 2·F·r.',
        ],
        how: [
          { text: 'Field: B runs from N to S across the coil.', focus: 'field', buddy: 'Start with the field: it runs straight across from north to south.' },
          { text: 'Current: I flows in opposite directions in the two long sides of the coil.', focus: 'current', buddy: 'Now the current: down one side of the coil, up the other.' },
          { text: 'Force: Fleming’s left-hand rule gives F₁ up on one side and F₂ down on the other.', focus: 'force', buddy: 'Use your left hand: first finger along the field, second finger along the current. Your thumb shows the force.' },
          { text: 'Torque: the up–down pair turns the coil about the axle.', focus: 'torque', buddy: 'One side up, one side down: together they turn the coil around the axle.' },
        ],
        takeaway: 'Opposite currents in a field give opposite forces, and opposite forces either side of an axle give torque.',
        formulaIds: ['f_lorentz', 'f_torque'],
      },
      step_4_commutation: {
        why: 'Without this trick a DC motor could not keep turning in one direction. The commutator is what turns a single push into continuous rotation.',
        observe: 'Watch the gap in the split ring pass the brushes as the coil passes the vertical.',
        points: [
          'The torque is largest when the coil lies flat, parallel to the field, and drops to zero when the coil is vertical.',
          'The coil’s momentum carries it just past the vertical position.',
          'At that moment the split ring swaps which brush touches which end of the coil, so the current in the coil reverses.',
          'Reversed current means reversed forces, so the twist keeps acting in the original direction.',
        ],
        how: [
          { text: 'Coil flat: the forces are furthest from the axle, so the torque is largest.', focus: 'torque' },
          { text: 'Coil vertical: the forces line up with the axle, so the torque is zero.', focus: 'force' },
          { text: 'Just past vertical: the gap in the split ring passes the brushes.', focus: 'commutator', buddy: 'Watch the gap in the split ring: it passes the brushes just as the coil goes past vertical.' },
          { text: 'The current in the coil reverses, and rotation continues the same way.', focus: 'coil' },
        ],
        takeaway: 'The commutator reverses the coil current every half turn so the torque always turns the coil the same way.',
      },
      step_5_summary: {
        why: 'Putting the pieces in order lets you explain any DC motor from start to finish.',
        observe: 'Step through the cycle below; each step lights up the part of the motor involved.',
        points: [
          'More current, a stronger magnetic field or more turns of wire all give more torque.',
          'Reversing the current direction reverses the direction of spin.',
          'A spinning coil also generates a back-EMF that opposes the supply voltage, which limits the motor’s top speed.',
        ],
        how: [
          { text: 'Electrical energy enters from the DC supply through the brushes.', focus: 'brushes' },
          { text: 'Current flows through the coil.', focus: 'coil' },
          { text: 'The magnetic field crosses the current-carrying sides of the coil.', focus: 'field' },
          { text: 'A force acts on each side of the coil (F = B·I·L).', focus: 'force' },
          { text: 'The opposite forces create torque about the axle.', focus: 'torque' },
          { text: 'The armature (coil and axle) rotates.', focus: 'axle' },
          { text: 'Every half turn the commutator reverses the current in the coil.', focus: 'commutator' },
          { text: 'The torque keeps one direction, so the rotation continues.', focus: 'torque' },
        ],
        takeaway: 'Current → force → torque → rotation, with the commutator reversing the current every half turn to keep it going.',
        formulaIds: ['f_torque', 'f_back_emf'],
      },
    },
  },

  // ---------------------------------------------------------------------------
  projectile_motion: {
    definition:
      'A projectile moves sideways at a constant speed while gravity changes its vertical speed, so its path is a parabola.',
    steps: {
      step_1_proj_intro: {
        why: 'Thrown balls, long jumpers, water jets and fireworks all follow this path. Splitting the motion into two parts makes it predictable.',
        observe: 'At the launch point the velocity v₀ splits into a horizontal part vₓ and a vertical part v_y.',
        points: [
          'The launch velocity v₀ at angle θ splits into vₓ = v₀·cos θ and v_y = v₀·sin θ.',
          'Horizontally no force acts (ignoring air resistance), so vₓ stays constant.',
          'Vertically, gravity accelerates the projectile downwards at g ≈ 9.8 m/s², so v_y changes every second.',
          'The two motions happen at the same time without affecting each other. Together they trace a parabola.',
        ],
        how: [
          { text: 'Launch: the projectile leaves at speed v₀ and angle θ.', focus: 'launch', buddy: 'Look at the launcher: the projectile leaves at speed v₀, tilted at angle θ.' },
          { text: 'Split: v₀ becomes vₓ (sideways) and v_y (upwards).', focus: 'components', buddy: 'Split that launch velocity into a sideways arrow and an upward arrow.' },
          { text: 'Rising: gravity slows v_y until it is zero at the top.', focus: 'apex' },
          { text: 'Falling: gravity speeds it up downwards until it lands.', focus: 'trajectory' },
          { text: 'Throughout, vₓ never changes, so the projectile covers equal horizontal distances every second.', focus: 'vx' },
        ],
        takeaway: 'Treat the two directions separately: constant velocity sideways, constant acceleration downwards.',
      },
      step_2_proj_range: {
        why: 'Athletes, engineers and game designers all need to know how far something will travel before it lands.',
        observe: 'Change the angle and watch where the projectile lands on the distance scale.',
        points: [
          'The range R is the horizontal distance to where the projectile lands on level ground.',
          'Range = horizontal speed × time in the air (R = vₓ · t).',
          'Steep angles give a long flight but a small vₓ; low angles give a large vₓ but a short flight.',
          'Together this gives R = v₀²·sin 2θ / g, which is largest when 2θ = 90°, so θ = 45°.',
        ],
        how: [
          { text: 'Low angle: fast sideways, but it lands quickly.', focus: 'range' },
          { text: 'High angle: a long time in the air, but slow sideways.', focus: 'trajectory' },
          { text: '45°: the best balance between the two on level ground.', focus: 'range' },
        ],
        takeaway: 'On level ground (no air resistance) 45° gives the greatest range, and angles that add up to 90° land at the same spot.',
        formulaIds: ['f_range'],
      },
      step_3_proj_time: {
        why: 'How long a projectile stays in the air decides how far it can go and when it lands.',
        observe: 'Raise the angle at a fixed speed and watch the flight time readout.',
        points: [
          'The time in the air is set by the vertical motion only.',
          'On level ground the rise and the fall take equal time, so t = 2·v₀·sin θ / g.',
          'Horizontal speed does not change the flight time. It only changes how far the projectile goes in that time.',
        ],
        how: [
          { text: 'The vertical launch speed v_y = v₀·sin θ sets how long it rises.', focus: 'vy' },
          { text: 'Gravity brings v_y to zero at the apex: that is half the flight time.', focus: 'apex' },
          { text: 'It takes the same time to fall back to the launch height.', focus: 'trajectory' },
        ],
        takeaway: 'Flight time depends on the vertical launch speed and g, never on the horizontal speed.',
        formulaIds: ['f_time_flight'],
      },
      step_4_proj_apex: {
        why: 'The top of the arc gives the maximum height and splits the flight into two equal halves.',
        observe: 'Fire and watch the projectile at the top of its arc.',
        points: [
          'At the apex the vertical velocity is zero for an instant.',
          'The horizontal velocity v₀·cos θ is unchanged, so the projectile is still moving sideways.',
          'Maximum height H = (v₀·sin θ)² / (2g).',
          'On level ground the apex comes at half the flight time, halfway along the range.',
        ],
        how: [
          { text: 'Apex: v_y has fallen to zero, so the projectile stops rising.', focus: 'apex' },
          { text: 'vₓ is still v₀·cos θ, carrying it forward.', focus: 'vx' },
        ],
        takeaway: 'At the top v_y = 0, but vₓ is unchanged.',
        formulaIds: ['f_max_height'],
      },
      step_5_proj_predict: {
        why: 'Prediction is the real test: calculate first, then check it with the simulation.',
        observe: 'Set the angle and speed, predict the range, then fire to check.',
        points: [
          'Step 1: find the flight time from the vertical motion, t = 2·v₀·sin θ / g.',
          'Step 2: multiply by the constant horizontal speed, R = v₀·cos θ · t.',
          'Both steps together give R = v₀²·sin 2θ / g.',
          'Worked example: 20 m/s at 30° gives R = 400 × sin 60° / 9.8 ≈ 35.3 m.',
        ],
        takeaway: 'Split the motion, get the time from the vertical motion, then use the horizontal speed for the distance.',
        formulaIds: ['f_range', 'f_time_flight'],
      },
    },
  },

  // ---------------------------------------------------------------------------
  human_heart_anatomy: {
    definition:
      'The heart is a four-chamber double pump: its right side sends blood to the lungs and its left side sends blood around the body.',
    steps: {
      step_1_heart_intro: {
        why: 'Every cell needs oxygen. The heart keeps oxygen-poor and oxygen-rich blood apart and sends each where it needs to go.',
        observe: 'Blue chambers hold oxygen-poor blood and red chambers oxygen-rich blood. The heart’s right side is drawn on the left, as if you face the person.',
        points: [
          'Four chambers: two atria on top receive blood; two ventricles below pump it out.',
          'The right side handles oxygen-poor blood coming back from the body.',
          'The left side handles oxygen-rich blood coming back from the lungs.',
          'A wall called the septum keeps the two sides apart.',
        ],
        how: [
          { text: 'Body → right atrium → right ventricle.', focus: 'right', buddy: 'Blood from the body arrives on the right side of the heart, drawn on the left here.' },
          { text: 'Right ventricle → lungs, where blood picks up oxygen.', focus: 'pulmonary', buddy: 'The right ventricle sends it up to the lungs to pick up oxygen.' },
          { text: 'Lungs → left atrium → left ventricle.', focus: 'left', buddy: 'Oxygen-rich blood returns to the left side of the heart.' },
          { text: 'Left ventricle → the whole body.', focus: 'systemic', buddy: 'And the left ventricle pumps it out to the whole body.' },
        ],
        takeaway: 'Two pumps side by side: the right side pumps to the lungs, the left side to the body.',
      },
      step_2_heart_chambers: {
        why: 'Knowing what each chamber does is the key to following blood through the heart.',
        observe: 'Match each chamber on the diagram to its job.',
        points: [
          'Atria (top) are receiving chambers with thin walls.',
          'Ventricles (bottom) are pumping chambers with thick, muscular walls.',
          'The left ventricle has the thickest wall, because it pumps blood around the whole body.',
        ],
        how: [
          { text: 'Right atrium: receives oxygen-poor blood from the body.', focus: 'RA' },
          { text: 'Right ventricle: pumps it to the lungs.', focus: 'RV' },
          { text: 'Left atrium: receives oxygen-rich blood from the lungs.', focus: 'LA' },
          { text: 'Left ventricle: pumps it to the body.', focus: 'LV' },
        ],
        takeaway: 'Atria receive, ventricles pump; the right side pumps to the lungs, the left side to the body.',
      },
      step_3_heart_valves: {
        why: 'The heart only works if blood moves one way. Valves are its one-way doors.',
        observe: 'Find the four valves: two between the atria and ventricles, two at the exits.',
        points: [
          'Between each atrium and its ventricle: the tricuspid valve (right) and the mitral valve (left).',
          'At the exits: the pulmonary valve (right ventricle → pulmonary artery) and the aortic valve (left ventricle → aorta).',
          'Valves open when blood is pushed forward and close when it starts to flow back.',
          'The “lub-dub” sounds of a heartbeat are valves closing.',
        ],
        how: [{ text: 'Every valve sits where blood leaves a chamber, so blood can only move forward.', focus: 'valves' }],
        takeaway: 'Four valves keep flow one way: tricuspid, pulmonary, mitral, aortic.',
      },
      step_4_heart_pathway: {
        why: 'Tracing one red blood cell shows the whole double circulation as a single loop.',
        observe: 'Click the chambers in the order the blood visits them.',
        points: [
          'Veins bring blood to the heart; arteries carry it away.',
          'The pulmonary artery carries oxygen-poor blood to the lungs, and the pulmonary veins bring oxygen-rich blood back.',
          'A red blood cell passes through the heart twice on one full trip round the body.',
        ],
        how: [
          { text: 'Venae cavae → right atrium.', focus: 'RA' },
          { text: 'Right atrium → right ventricle (tricuspid valve).', focus: 'RV' },
          { text: 'Right ventricle → pulmonary artery → lungs.', focus: 'LUNGS' },
          { text: 'Pulmonary veins → left atrium.', focus: 'LA' },
          { text: 'Left atrium → left ventricle (mitral valve).', focus: 'LV' },
          { text: 'Left ventricle → aorta → body.', focus: 'BODY' },
        ],
        takeaway: 'Body → right heart → lungs → left heart → body.',
      },
      step_5_heart_synthesis: {
        why: 'Two separate circuits let the body receive fully oxygenated blood at high pressure.',
        observe: 'Follow the upper loop (lungs) and the lower loop (body).',
        points: [
          'Pulmonary circuit: right ventricle → lungs → left atrium. Short, low pressure.',
          'Systemic circuit: left ventricle → body → right atrium. Long, high pressure.',
          'Both ventricles contract at the same time in every heartbeat.',
          'The septum stops oxygen-rich and oxygen-poor blood from mixing.',
        ],
        how: [
          { text: 'Pulmonary circuit: heart ↔ lungs.', focus: 'pulmonary' },
          { text: 'Systemic circuit: heart ↔ body.', focus: 'systemic' },
        ],
        takeaway: 'Double circulation: the pulmonary and systemic circuits run one after the other through a single heart.',
      },
    },
  },

  // ---------------------------------------------------------------------------
  periodic_table: {
    definition:
      'The periodic table lists every element in order of atomic number, arranged so that elements with similar properties line up in the same column.',
    steps: {
      step_1_pt_map: {
        why: 'It is chemistry’s map: an element’s position tells you how its atoms are built and how it tends to behave.',
        observe: 'Rows run left to right; columns run top to bottom. Click any element to inspect it.',
        points: [
          '118 elements, in order of atomic number (the number of protons).',
          '7 horizontal rows called periods and 18 vertical columns called groups.',
          'Elements in the same group have similar chemical properties.',
          'For main-group elements that is because they have the same number of outer-shell (valence) electrons.',
        ],
        takeaway: 'Position = structure: an element’s row and column tell you about its electrons.',
      },
      step_2_pt_atomic_number: {
        why: 'The atomic number is an element’s identity: change it and you have a different element.',
        observe: 'Each box shows the atomic number above the symbol.',
        points: [
          'Atomic number Z = the number of protons in the nucleus.',
          'Z identifies the element: every atom with 6 protons is carbon.',
          'Z increases by exactly one from each element to the next.',
          'Symbols have one or two letters, and only the first is a capital: C, Ca, Cl.',
          'Some symbols come from Latin names, for example K for potassium (kalium).',
        ],
        takeaway: 'Count the protons and you know the element.',
      },
      step_3_pt_periods_groups: {
        why: 'Periods and groups turn the table into coordinates that describe an atom’s electrons.',
        observe: 'Compare an element’s row with its column.',
        points: [
          'Period number = the number of occupied electron shells.',
          'Same group = same outer-shell arrangement.',
          'Main groups: Group 1 has 1 valence electron, Group 2 has 2, and Groups 13–18 have 3–8.',
          'Helium, in Group 18, is the exception with 2.',
        ],
        takeaway: 'Row = number of shells; column = number of outer electrons (main groups).',
      },
      step_4_pt_classes: {
        why: 'Whether an element is a metal, nonmetal or metalloid predicts how it conducts and how it reacts.',
        observe: 'Use the filter buttons to show one class at a time.',
        points: [
          'Metals are shiny, conduct heat and electricity, and tend to lose electrons. Most elements are metals.',
          'Nonmetals are usually poor conductors and tend to gain or share electrons.',
          'Metalloids (B, Si, Ge, As, Sb, Te) have in-between properties. Silicon is a semiconductor.',
        ],
        takeaway: 'Properties follow position: metals, metalloids and nonmetals each occupy their own region of the table.',
      },
      step_5_pt_trends: {
        why: 'Trends let you predict an element’s size and reactivity from its position alone.',
        observe: 'Turn on the Trends view and follow the arrows.',
        points: [
          'Across a period (left → right) atomic radius generally decreases.',
          'Why: protons are added but electrons stay in the same shell, so the nucleus pulls them closer.',
          'Down a group atomic radius increases, because each row adds a new shell.',
          'Electronegativity does the opposite: it increases across a period and decreases down a group.',
          'Fluorine is the most electronegative element.',
        ],
        takeaway: 'Across: smaller and more electronegative. Down: bigger and less electronegative.',
      },
      step_6_pt_challenge: {
        why: 'Locating elements from clues shows you can read the table like a map.',
        observe: 'Solve three location clues on the board.',
        points: [
          'Period and group work like map coordinates.',
          'Period 2, Group 17 points to exactly one element: fluorine.',
          'Solve three clues on the board to complete the challenge.',
        ],
        takeaway: 'Row = number of shells, column = outer-shell pattern; together they pinpoint one element.',
      },
    },
  },

  // ---------------------------------------------------------------------------
  polymorphism: {
    definition:
      'Polymorphism lets one piece of code call the same method on different kinds of objects, with each object running its own version.',
    steps: {
      step_1_poly_intro: {
        why: 'It lets you add new kinds of objects without rewriting the code that uses them.',
        observe: 'The left panel is the shared contract; the right panel is the class of the selected object.',
        points: [
          'Code is written against a shared contract: an interface or base class.',
          'Different classes fulfil that contract in their own way.',
          'The same call, shape.area(), runs a different body depending on the object.',
        ],
        how: [
          { text: 'The Shape interface promises an area(): number method.', focus: 'interface', buddy: 'Start on the left: the Shape interface promises that every shape has area().' },
          { text: 'Circle, Rectangle and Triangle each implement area().', focus: 'implementations', buddy: 'On the right is one class that keeps that promise in its own way.' },
          { text: 'At runtime the chosen object’s own area() runs.', focus: 'dispatch', buddy: 'Pick an object and press Run: its own area() is the one that runs.' },
        ],
        takeaway: 'One call, many behaviours: the object decides which code runs.',
      },
      step_2_poly_contract: {
        why: 'A contract lets different parts of a program work together without knowing each other’s details.',
        observe: 'Read the Shape interface and the totalArea() function that uses it.',
        points: [
          'An interface lists method signatures without bodies.',
          '`interface Shape { area(): number }` promises that every shape can report its area as a number.',
          'Code that uses shapes depends only on that promise: “program to an interface, not an implementation”.',
        ],
        how: [
          { text: 'The interface declares area(), with no body.', focus: 'interface' },
          { text: 'totalArea() only calls area(), so it works for any Shape.', focus: 'interface' },
        ],
        takeaway: 'An interface defines what an object can do, not how it does it.',
      },
      step_3_poly_implementations: {
        why: 'Each class knows its own shape best, so each writes its own area().',
        observe: 'Switch between the objects and compare the three area() bodies.',
        points: [
          'Each class writes its own area() body: π·r², w·h or ½·b·h.',
          'The name, parameters and return type must match the interface exactly.',
          'Only the body, the “how”, differs between the classes.',
        ],
        how: [{ text: 'Same method heading, different body in each class.', focus: 'implementations' }],
        takeaway: 'Same signature, different bodies.',
      },
      step_4_poly_dispatch: {
        why: 'Dynamic dispatch is how the program knows which area() to run when it only sees “a Shape”.',
        observe: 'Select an object, predict its output, then press Run.',
        points: [
          'The declared type (Shape) decides which methods you are allowed to call.',
          'The runtime type, the actual object, decides which implementation runs.',
          'The choice is made while the program runs: that is dynamic dispatch.',
        ],
        how: [
          { text: 'Declared type: the variable is typed as Shape.', focus: 'interface' },
          { text: 'Runtime type: the object stored in it is, for example, a Rectangle.', focus: 'dispatch' },
          { text: 'So Rectangle’s area() is the one that runs.', focus: 'implementations' },
        ],
        takeaway: 'Declared type = what you may call; runtime type = what actually runs.',
      },
      step_5_poly_extension: {
        why: 'Real programs keep growing. Polymorphism lets them grow without breaking what already works.',
        observe: 'totalArea() adds up every shape in the list without knowing their classes.',
        points: [
          'totalArea() loops over the shapes and calls area() on each one.',
          'A new class that implements Shape works with totalArea() unchanged.',
          'This is the open/closed principle: open for extension, closed for modification.',
        ],
        how: [{ text: 'The loop only relies on the Shape contract.', focus: 'interface' }],
        takeaway: 'Add behaviour by adding classes, not by editing code that already works.',
      },
    },
  },

  // ---------------------------------------------------------------------------
  calculus_derivatives: {
    definition:
      'A derivative measures how fast a function’s output changes as its input changes: the slope of the tangent at a point.',
    steps: {
      step_1_calc_function: {
        why: 'Speed, growth, cooling and cost all change. Derivatives measure exactly how fast they change.',
        observe: 'Move the tangent point along the curve and watch its slope.',
        points: [
          'A function gives exactly one output f(x) for each input x. Here f(x) = 0.4x³ − 1.2x.',
          'Where the curve rises from left to right, f is increasing; where it falls, f is decreasing.',
          'Where the curve is momentarily flat, f is neither increasing nor decreasing.',
          'Calculus turns “how steep is it here?” into a number.',
        ],
        how: [
          { text: 'The blue curve is f(x) = 0.4x³ − 1.2x.', focus: 'curve', buddy: 'The blue curve is our function. Follow it from left to right.' },
          { text: 'The orange line is the tangent: it shows how steep the curve is at the orange point.', focus: 'tangent', buddy: 'The orange tangent line shows how steep the curve is at one point.' },
        ],
        takeaway: 'The steepness of the curve tells you how fast the output is changing.',
      },
      step_2_calc_average: {
        why: 'Before measuring change at a single point, you measure it between two points.',
        observe: 'The green secant line joins the curve at x = 1 and x = 2.',
        points: [
          'Average rate of change from x = a to x = b: [f(b) − f(a)] ÷ (b − a).',
          'It is the slope of the secant line joining the two points on the curve.',
          'Example on [1, 2]: f(1) = −0.8 and f(2) = 0.8, so the average rate is 1.6 ÷ 1 = 1.6.',
        ],
        how: [
          { text: 'Pick two points on the curve: x = 1 and x = 2.', focus: 'secant' },
          { text: 'Join them with a straight line: the secant.', focus: 'secant' },
          { text: 'Its slope, rise ÷ run, is the average rate of change.', focus: 'secant' },
        ],
        takeaway: 'Average rate of change = rise ÷ run between two points.',
        formulaIds: ['f_calc_avg'],
      },
      step_3_calc_tangent: {
        why: 'The average over an interval hides what happens at one exact moment. The tangent shows it.',
        observe: 'Compare the secant between x = 1 and x = 2 with the tangent at the orange point.',
        points: [
          'Move the second point closer and closer to the first: the secant turns into the tangent.',
          'The tangent touches the curve at one point and matches its steepness there.',
          'Its slope is the instantaneous rate of change, the derivative f′(a).',
        ],
        how: [
          { text: 'A secant uses two points.', focus: 'secant' },
          { text: 'Shrink the gap to zero and it becomes the tangent at one point.', focus: 'tangent' },
        ],
        takeaway: 'The derivative at a point is the slope of the tangent there.',
        formulaIds: ['f_calc_limit'],
      },
      step_4_calc_derivative: {
        why: 'The derivative function gives the slope at every point at once, without drawing a single tangent.',
        observe: 'Set the tangent point to x = −1 and x = 1 and look at the tangent.',
        points: [
          'Power rule: d/dx(xⁿ) = n·xⁿ⁻¹, and constant multipliers stay in front.',
          'd/dx(0.4x³) = 1.2x² and d/dx(−1.2x) = −1.2, so f′(x) = 1.2x² − 1.2.',
          'f′(x) > 0: the curve is rising. f′(x) < 0: falling. f′(x) = 0: flat tangent.',
          'Here f′(x) = 0 at x = −1 (a local maximum) and at x = 1 (a local minimum).',
        ],
        how: [
          { text: 'Read the tangent slope at the orange point.', focus: 'tangent' },
          { text: 'Compare it with f′(x) = 1.2x² − 1.2 at the same x.', focus: 'point' },
        ],
        takeaway: 'The derivative function gives the tangent slope at every x.',
        formulaIds: ['f_calc_power'],
      },
      step_5_calc_application: {
        why: 'Derivatives are rates in the real world: velocity, growth rate, marginal cost.',
        observe: 'Think of the curve as position against time: its slope is the velocity.',
        points: [
          'If s(t) is position, then s′(t) is velocity.',
          'A derivative’s units are output units per input unit, for example metres per second.',
          'Example: s(t) = 5t² gives s′(t) = 10t, so at t = 3 s the velocity is 30 m/s.',
          'A thrown ball is at its highest point when its vertical velocity is zero: h′(t) = 0.',
        ],
        takeaway: 'A derivative is a rate: how many units of output per unit of input, at that instant.',
      },
    },
  },

  // ---------------------------------------------------------------------------
  industrial_revolution: {
    definition:
      'The Industrial Revolution (about 1760–1840) moved production from hand tools and home workshops to powered machines in factories, beginning in Britain.',
    steps: {
      step_1_ir_intro: {
        why: 'It changed how almost everything is made, and where and how most people live and work.',
        observe: 'Read the timeline from left to right; the highlighted milestones are the first steps.',
        points: [
          'Before: goods were made by hand, at home or in small workshops, using muscle, water or wind power.',
          'After: machines in factories, increasingly powered by coal-burning steam engines.',
          'It began in Britain around 1760, then spread to Europe and North America.',
        ],
        how: [
          { text: '1712: Newcomen’s engine pumps water out of mines.', focus: 'newcomen', buddy: 'The story starts in the mines: Newcomen’s engine pumped water out so miners could dig deeper.' },
          { text: 'c. 1764: the spinning jenny lets one worker spin many threads at once.', focus: 'jenny' },
          { text: '1769: Watt’s separate condenser makes steam engines far more efficient.', focus: 'watt' },
        ],
        takeaway: 'From hand tools at home to powered machines in factories.',
      },
      step_2_ir_why_britain: {
        why: 'The revolution did not start everywhere at once. Britain had an unusual combination of advantages.',
        observe: 'Look at what the earliest steam milestones were built to do.',
        points: [
          'Resources: large deposits of coal and iron.',
          'Money: capital from overseas trade to invest in machines and factories.',
          'People: a growing population, while more efficient farming freed workers for the towns.',
          'Transport and markets: rivers, canals and ports, plus colonial markets.',
          'Ideas: a culture of practical invention.',
        ],
        takeaway: 'Resources, money, workers, transport and inventors came together in Britain first.',
      },
      step_3_ir_mechanisation: {
        why: 'Textiles were the first industry to be transformed, and they show how mechanisation works.',
        observe: 'Follow the textile milestones on the timeline.',
        points: [
          'Mechanisation means machines doing work that people did by hand.',
          'Spinning and weaving cloth were mechanised first.',
          'Water power drove the first factories; efficient steam power later freed them from rivers.',
        ],
        how: [
          { text: 'Spinning jenny (c. 1764): one worker spins many threads at once.', focus: 'jenny' },
          { text: 'Watt’s condenser (1769): efficient steam engines.', focus: 'watt' },
          { text: 'Cromford Mill (1771): Arkwright’s water-powered spinning factory.', focus: 'cromford' },
          { text: 'Power loom (1785): machines weave the cloth as well.', focus: 'loom' },
        ],
        takeaway: 'Machines took over spinning and weaving, and steam freed factories from riversides.',
      },
      step_4_ir_transport: {
        why: 'Factories needed coal in and goods out. Railways connected mines, factories, ports and cities.',
        observe: 'Put the steam milestones in order on the board.',
        points: [
          'Steam engines were put on rails to haul coal and goods.',
          'Railways moved coal, goods and people faster and more cheaply than canals and roads.',
          'Factories drew workers from the countryside, so towns such as Manchester grew fast, often with crowded housing and poor sanitation.',
        ],
        how: [
          { text: 'Stockton & Darlington: the first public railway to use steam locomotives.', focus: 'stockton' },
          { text: 'Liverpool & Manchester: the first inter-city steam railway.', focus: 'lmr' },
        ],
        takeaway: 'Railways tied the industrial economy together, and industrial towns grew rapidly.',
      },
      step_5_ir_effects: {
        why: 'Industrialisation made some people richer and some lives harder. Judging it means weighing both.',
        observe: 'Find the reform milestone on the timeline.',
        points: [
          'Gains: output rose, goods became cheaper and, over the long run, living standards improved.',
          'Costs: long hours, dangerous machines and low pay, with children working in the mills.',
          'Cities grew faster than housing and sanitation could keep up.',
          'Reform: Britain’s Factory Act of 1833 limited children’s working hours in textile mills and appointed inspectors.',
        ],
        how: [{ text: 'Factory Act (1833): the state begins to regulate factory work.', focus: 'factory_act' }],
        takeaway: 'Industrialisation brought both prosperity and hardship, and the hardship led to reform.',
      },
      step_6_ir_legacy: {
        why: 'The first industrial revolution set up the modern world of mass production.',
        observe: 'The last milestone opens the second industrial wave.',
        points: [
          'A second industrial revolution began around 1870.',
          'Cheap steel from the Bessemer process (1856) supported railways, bridges and ships.',
          'Chemicals, electricity and oil created new industries.',
          'Its effects still shape where people live, how they work and how economies grow.',
        ],
        how: [{ text: 'Bessemer process (1856): cheap mass-produced steel.', focus: 'bessemer' }],
        takeaway: 'Steam and textiles led into a second wave of steel, chemicals and electricity.',
      },
    },
  },
};

/** Merges the lesson's teaching content into its steps (never across concepts). */
export function applyLessonTeaching(lesson: ClassroomLesson): ClassroomLesson {
  const teaching = LESSON_TEACHING[lesson.conceptId];
  if (!teaching) return lesson;
  return {
    ...lesson,
    definition: lesson.definition ?? teaching.definition,
    steps: lesson.steps.map((step) => {
      const teach = teaching.steps[step.id];
      return teach && !step.teach ? { ...step, teach } : step;
    }),
  };
}
