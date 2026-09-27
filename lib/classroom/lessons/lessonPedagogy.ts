/**
 * Lesson-owned pedagogy for the pre-existing authored lessons.
 *
 * Before Phase 2, "Try This", common-mistake notes, Buddy feedback and Xira
 * prompts were hardcoded in shared components with DC-motor wording and shown
 * for every concept. They now live here, keyed by concept and step id, and are
 * merged into each lesson by `applyLessonPedagogy()`. Shared components render
 * lesson fields only — they never supply a subject-specific default.
 *
 * New lessons (periodic_table, polymorphism, calculus_derivatives,
 * industrial_revolution) carry these fields inline instead.
 */

import type {
  BuddyLessonScript,
  ClassroomLesson,
  XiraLessonPrompts,
} from '@/components/classroom/types';

export interface LessonPedagogy {
  category: string;
  buddyScript: BuddyLessonScript;
  xiraPrompts: XiraLessonPrompts;
  steps: Record<string, { tryThis: string; commonMistake?: string }>;
}

export const LESSON_PEDAGOGY: Record<string, LessonPedagogy> = {
  dc_motor: {
    category: 'Electromagnetism',
    buddyScript: {
      introduction: 'Welcome! Today we explore how a DC motor turns electric current into continuous rotation.',
      revisionIntroduction:
        'Revision: the DC motor. Recall energy conversion, the five components, the Lorentz force and why commutation keeps it spinning.',
      correct: 'Spot on! You nailed the electromagnetic mechanism.',
      incorrect: 'Close! Apply Fleming’s Left-Hand Rule and check the current direction in each side of the coil.',
      hint: 'Trace the current through the coil, then apply the left-hand rule.',
      transition: 'Great. Let us look at the next part of the motor.',
      completion: 'Outstanding! You can explain how current, magnetic field and commutation produce continuous rotation.',
    },
    xiraPrompts: {
      why: 'Why does a current-carrying coil feel a force in a magnetic field?',
      simpler: 'Explain how a DC motor works in the simplest possible terms.',
      example: 'Give me an everyday device that uses a DC motor and explain how.',
      hint: 'Give me a hint about the commutator without spoiling the answer.',
      deeper: 'How does back-EMF limit a DC motor’s speed?',
    },
    steps: {
      step_1_intro: { tryThis: 'Predict what happens to the direction of rotation when the current reverses.' },
      step_2_components: {
        tryThis: 'Click the component callouts on the board to inspect what each part does.',
        commonMistake: 'Carbon brushes only make sliding contact with the spinning part. On their own they never change which way the current flows.',
      },
      step_3_mechanism: {
        tryThis: 'Use Fleming’s Left-Hand Rule: thumb = force, first finger = field, second finger = current.',
      },
      step_4_commutation: {
        tryThis: 'Watch how the commutator swaps contacts exactly as the coil passes vertical.',
        commonMistake: 'It is tempting to think the coil simply keeps turning. Ask which way the torque pushes once the coil has passed the vertical and the current has NOT been switched.',
      },
      step_5_summary: { tryThis: 'Predict: will reversing the magnet polarity reverse the direction of rotation?' },
    },
  },

  projectile_motion: {
    category: 'Kinematics',
    buddyScript: {
      introduction: 'Welcome to projectile motion. Let us split one curved path into two simple, independent motions.',
      revisionIntroduction:
        'Revision: projectile motion. Recall independent components, range, time of flight and the apex, then predict a landing point.',
      correct: 'Exactly right! You separated the horizontal and vertical motion perfectly.',
      incorrect: 'Not quite. Treat horizontal and vertical motion separately. Gravity only acts vertically.',
      hint: 'Resolve the launch velocity into v₀·cos θ and v₀·sin θ first.',
      transition: 'Good. Now let us use that on the next part of the flight.',
      completion: 'Brilliant! You can predict flight time, maximum height and range for a projectile.',
    },
    xiraPrompts: {
      why: 'Why does horizontal velocity stay constant during flight?',
      simpler: 'Explain projectile motion in the simplest possible terms.',
      example: 'Give me a sports example of projectile motion.',
      hint: 'Give me a hint for finding the range.',
      deeper: 'How does air resistance change the ideal parabolic path?',
    },
    steps: {
      step_1_proj_intro: {
        tryThis: 'Set the launch angle and speed, then fire. Watch the horizontal and vertical motion separately.',
      },
      step_2_proj_range: {
        tryThis: 'Fire at 30° and then at 60° with the same speed. Compare where they land.',
        commonMistake: 'A higher launch angle does not always mean a longer range. Beyond 45°, range decreases.',
      },
      step_3_proj_time: {
        tryThis: 'Keep the speed fixed and raise the angle. Does the time in the air go up or down?',
        commonMistake: 'Horizontal speed does not change how long a projectile stays in the air. Only the vertical motion does.',
      },
      step_4_proj_apex: {
        tryThis: 'Fire the projectile and watch it at the top of its arc. Which velocity component is zero there?',
        commonMistake: 'At the apex the speed is not zero. Only the vertical component is zero.',
      },
      step_5_proj_predict: {
        tryThis: 'Predict the range for 20 m/s at 30°, then set the controls and fire to check.',
        commonMistake: 'Use sin(2θ), not sin(θ), in the range formula.',
      },
    },
  },

  human_heart_anatomy: {
    category: 'Human Physiology',
    buddyScript: {
      introduction: 'Welcome to the human heart: two pumps working side by side with every beat.',
      revisionIntroduction:
        'Revision: the heart. Recall the chambers, the valves and the double circulation, then trace the pathway yourself.',
      correct: 'Correct! You traced the circulation precisely.',
      incorrect: 'Not quite. Remember: atria receive, ventricles pump, and valves keep the flow one-way.',
      hint: 'Follow the blood: body → right side → lungs → left side → body.',
      transition: 'Good. Let us follow the blood to the next structure.',
      completion: 'Excellent! You can trace blood through both circuits and explain what each structure does.',
    },
    xiraPrompts: {
      why: 'Why does the heart need two separate circuits?',
      simpler: 'Explain how the heart pumps blood in the simplest possible terms.',
      example: 'Give me an everyday example of what happens to the heart during exercise.',
      hint: 'Give me a hint for remembering the order of the valves.',
      deeper: 'What happens electrically in the heart to coordinate each beat?',
    },
    steps: {
      step_1_heart_intro: { tryThis: 'Trace the path on the board. Which side of the heart receives blood from the body?' },
      step_2_heart_chambers: {
        tryThis: 'Identify which chambers receive blood and which pump it out.',
        commonMistake: 'Diagrams show the patient’s left and right, so the left ventricle appears on the right side of the picture.',
      },
      step_3_heart_valves: {
        tryThis: 'Name the valve blood passes through after each chamber, in order.',
        commonMistake: 'Valves do not pump blood. They open and close passively as pressure changes.',
      },
      step_4_heart_pathway: {
        tryThis: 'Starting at the vena cava, trace a single red blood cell all the way back to the body.',
        commonMistake: 'Arteries are defined by direction (away from the heart), not by oxygen level. The pulmonary arteries carry oxygen-poor blood.',
      },
      step_5_heart_synthesis: { tryThis: 'Explain why a hole in the septum would reduce the oxygen delivered to the body.' },
    },
  },

  quadratic_equation: {
    category: 'Algebra',
    buddyScript: {
      introduction: 'Welcome to quadratics. Let us connect the equation y = ax² + bx + c to the shape of its parabola.',
      revisionIntroduction:
        'Revision: quadratics. Recall the vertex, the discriminant and the quadratic formula, then check them on the graph.',
      correct: 'Correct! Your algebra and the graph agree.',
      incorrect: 'Not quite. Recompute b² − 4ac carefully, watching the signs.',
      hint: 'Write down a, b and c before substituting.',
      transition: 'Good. Let us look at the next feature of the parabola.',
      completion: 'Spectacular! You can read the vertex, roots and discriminant from any quadratic.',
    },
    xiraPrompts: {
      why: 'Why is the vertex at x = −b / (2a)?',
      simpler: 'Explain the discriminant in the simplest possible terms.',
      example: 'Give me a real-world example of a parabola.',
      hint: 'Give me a hint for computing the discriminant.',
      deeper: 'How is the quadratic formula derived by completing the square?',
    },
    steps: {
      step_1_quad_intro: { tryThis: 'Look at the parabola on the board. Where is its axis of symmetry?' },
      step_2_quad_vertex: { tryThis: 'For y = x² − 4x + 3, compute h = −b / (2a). Where is the vertex?' },
      step_3_quad_roots: { tryThis: 'Predict the number of x-intercepts of y = x² + 1 before computing Δ.' },
      step_4_quad_formula: {
        tryThis: 'Solve x² − 5x + 6 = 0 with the quadratic formula and check your roots.',
        commonMistake: 'The ± gives two roots. Dropping it loses one of the solutions.',
      },
      step_5_quad_summary: { tryThis: 'Rewrite y = x² − 4x + 3 in vertex form a·(x − h)² + k.' },
    },
  },

  molecular_bonding: {
    category: 'Chemical Bonding',
    buddyScript: {
      introduction: 'Welcome to chemical bonding. Let us see how shared electrons hold molecules together and set their shape.',
      revisionIntroduction:
        'Revision: covalent bonding and VSEPR. Recall electron sharing, repulsion, water’s bent shape and polarity.',
      correct: 'Correct! You reasoned from electron repulsion to molecular shape.',
      incorrect: 'Not quite. Count the lone pairs: they repel more strongly than bonding pairs.',
      hint: 'Count bonding pairs and lone pairs around the central atom first.',
      transition: 'Good. Let us see how that shapes the molecule.',
      completion: 'Excellent! You can connect bonding, geometry and polarity.',
    },
    xiraPrompts: {
      why: 'Why do lone pairs repel more strongly than bonding pairs?',
      simpler: 'Explain covalent bonding in the simplest possible terms.',
      example: 'Give me an everyday example of molecular shape mattering.',
      hint: 'Give me a hint for predicting a molecule’s shape.',
      deeper: 'How does hybridisation relate to VSEPR geometry?',
    },
    steps: {
      step_1_mol_intro: { tryThis: 'Look at oxygen in the water molecule. How many electron pairs are shared, and how many are lone pairs?' },
      step_2_mol_vsepr: { tryThis: 'Predict which pushes harder on neighbouring bonds: a lone pair or a bonding pair.' },
      step_3_mol_h2o: { tryThis: 'Compare water’s 104.5° angle with the ideal tetrahedral 109.5°. What causes the difference?' },
      step_4_mol_polarity: {
        tryThis: 'Use the electronegativity values to decide which atom carries the partial negative charge.',
        commonMistake: 'Polar bonds do not always make a polar molecule. Symmetric shapes such as CO₂ cancel their dipoles.',
      },
      step_5_mol_summary: { tryThis: 'Explain why water’s bent shape helps it dissolve table salt.' },
    },
  },

  binary_search: {
    category: 'Algorithms',
    buddyScript: {
      introduction: 'Welcome to binary search: find anything in sorted data by halving the search space every step.',
      revisionIntroduction:
        'Revision: binary search. Recall the sorted precondition, the three pointers, the branching rule and the loop condition.',
      correct: 'Correct! You traced the pointers exactly like the algorithm.',
      incorrect: 'Not quite. Each comparison halves the remaining range. Count the halvings.',
      hint: 'Compare the target with array[mid] and discard one half.',
      transition: 'Good. Let us move the pointers again.',
      completion: 'Great work! You can trace binary search and explain its O(log n) speed.',
    },
    xiraPrompts: {
      why: 'Why does binary search need the data to be sorted?',
      simpler: 'Explain binary search in the simplest possible terms.',
      example: 'Give me a real-world example of binary search.',
      hint: 'Give me a hint for updating low and high.',
      deeper: 'Why is binary search O(log n)?',
    },
    steps: {
      step_1_bin_intro: { tryThis: 'How many checks would linear search need for 1,000 items in the worst case? Compare that with binary search.' },
      step_2_bin_pointers: { tryThis: 'Step through the pointers on the board. Where does mid land first?' },
      step_3_bin_decision: { tryThis: 'Predict which half is discarded when the target is smaller than array[mid].' },
      step_4_bin_check: {
        tryThis: 'Double the array size. How many extra comparisons does binary search need?',
        commonMistake: 'Binary search only works on sorted data. On unsorted data it can miss the target entirely.',
      },
      step_5_bin_summary: { tryThis: 'Name one place you use binary-search thinking outside programming.' },
    },
  },

  french_revolution: {
    category: 'Revolutions & Modern History',
    buddyScript: {
      introduction: 'Welcome to the French Revolution. Let us follow how a crisis in 1789 overturned an absolute monarchy.',
      revisionIntroduction:
        'Revision: the French Revolution. Recall the Estates, the Bastille, the Declaration and the Republic, in order.',
      correct: 'Correct! Your chronology is right on target.',
      incorrect: 'Not quite. Check the date on the timeline and the event’s cause.',
      hint: 'Use the timeline order: Estates-General → Bastille → Declaration → Republic.',
      transition: 'Good. Let us move forward to the next event.',
      completion: 'Excellent! You can explain the causes, key events and legacy of the Revolution.',
    },
    xiraPrompts: {
      why: 'Why did the Third Estate break away in 1789?',
      simpler: 'Explain the French Revolution in the simplest possible terms.',
      example: 'Give me an example of an idea from 1789 in modern democracies.',
      hint: 'Give me a hint for ordering the key events.',
      deeper: 'Why did the Revolution become more radical after 1792?',
    },
    steps: {
      step_1_fr_intro: { tryThis: 'Compare the Three Estates. Which estate paid most of the taxes?' },
      step_2_fr_bastille: { tryThis: 'Explain in one sentence why the fall of a single fortress mattered politically.' },
      step_3_fr_rights: { tryThis: 'Choose one right from the Declaration and explain why it threatened the old order.' },
      step_4_fr_republic: {
        tryThis: 'Place the Estates-General, the storming of the Bastille and the First Republic in order.',
        commonMistake: 'The Bastille was a royal fortress and prison, not the king’s palace.',
      },
      step_5_fr_summary: { tryThis: 'Name one idea from 1789 that appears in modern constitutions.' },
    },
  },

  linear_regression: {
    category: 'Statistics & Machine Learning',
    buddyScript: {
      introduction: 'Welcome to linear regression: finding the straight line that best predicts y from x.',
      revisionIntroduction:
        'Revision: linear regression. Recall slope and intercept, residuals, least squares and R².',
      correct: 'Correct! You read the fit like a data scientist.',
      incorrect: 'Not quite. Think about the vertical distances between the points and the line.',
      hint: 'A residual is the actual y minus the predicted ŷ.',
      transition: 'Good. Let us measure how well the line fits.',
      completion: 'Great work! You can fit, interpret and evaluate a regression line.',
    },
    xiraPrompts: {
      why: 'Why do we square the residuals in least squares?',
      simpler: 'Explain linear regression in the simplest possible terms.',
      example: 'Give me a real-world prediction problem that linear regression can model.',
      hint: 'Give me a hint for interpreting R².',
      deeper: 'How is the least-squares slope derived?',
    },
    steps: {
      step_1_lr_intro: { tryThis: 'Estimate the slope of the trend on the board: how much does y rise when x rises by 1?' },
      step_2_lr_residuals: { tryThis: 'Pick a point above the line. Is its residual positive or negative?' },
      step_3_lr_ols: { tryThis: 'Why square residuals instead of just adding them? Think about positive and negative errors.' },
      step_4_lr_check: {
        tryThis: 'Predict: if every point sat exactly on the line, what would R² be?',
        commonMistake: 'A high R² shows a good fit, not that x causes y.',
      },
      step_5_lr_summary: { tryThis: 'Name one prediction problem that linear regression could model.' },
    },
  },
};

/**
 * Returns a new lesson object with the concept's pedagogy merged in.
 * Never pulls pedagogy from a different concept.
 */
export function applyLessonPedagogy(lesson: ClassroomLesson): ClassroomLesson {
  const pedagogy = LESSON_PEDAGOGY[lesson.conceptId];
  if (!pedagogy) return lesson;

  return {
    ...lesson,
    category: lesson.category ?? pedagogy.category,
    buddyScript: lesson.buddyScript ?? pedagogy.buddyScript,
    xiraPrompts: lesson.xiraPrompts ?? pedagogy.xiraPrompts,
    steps: lesson.steps.map((step) => {
      const extra = pedagogy.steps[step.id];
      if (!extra) return step;
      return {
        ...step,
        tryThis: step.tryThis ?? extra.tryThis,
        commonMistake: step.commonMistake ?? extra.commonMistake,
      };
    }),
  };
}
