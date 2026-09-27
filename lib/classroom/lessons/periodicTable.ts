/**
 * Periodic Table — authored Chemistry lesson.
 *
 * The Smart Board visual for this lesson is the deterministic interactive
 * periodic table (components/classroom/visuals/PeriodicTableRenderer.tsx).
 * Each step sets `visualData.mode` so the board opens in the right view.
 */

import type { ClassroomLesson } from '@/components/classroom/types';

export const PERIODIC_TABLE_LESSON: ClassroomLesson = {
  id: 'lesson_periodic_table',
  conceptId: 'periodic_table',
  topicTitle: 'The Periodic Table: Organisation & Trends',
  subject: 'Chemistry',
  category: 'Inorganic Chemistry',
  gradeLevel: 'Secondary School Chemistry',
  estimatedMinutes: 10,
  hasFormulas: false,
  learningObjective:
    'Read the periodic table: use atomic number, symbols, periods and groups to locate elements, classify them as metals, nonmetals or metalloids, and predict basic periodic trends.',
  steps: [
    {
      id: 'step_1_pt_map',
      stepNumber: 1,
      stage: 'introduce',
      title: 'A Map of Every Element',
      subtitle: 'Why the Table Exists',
      buddyDialogue:
        'Welcome to the periodic table, chemistry’s map. Every box is an element, and its position tells you how it is likely to behave. Tap an element on the board to start exploring.',
      buddyState: 'INTRODUCING',
      boardTitle: 'The Periodic Table',
      boardSummary:
        'The 118 known elements are arranged in order of increasing atomic number into 7 horizontal rows (periods) and 18 vertical columns (groups).',
      keyPrinciple:
        'Elements in the same group have similar chemical properties because (for main-group elements) they have the same number of outer-shell, or valence, electrons.',
      visualType: 'interactive_diagram',
      visualData: { mode: 'overview' },
      example: {
        title: 'Mendeleev’s Prediction',
        description:
          'In 1869 Dmitri Mendeleev left gaps in his table and predicted the properties of undiscovered elements. Gallium (1875) and germanium (1886) matched his predictions closely.',
      },
      tryThis: 'Click any element on the board to see its atomic number, symbol, group and period.',
      hintText: 'Read the table like a book: left to right, then down to the next row.',
    },
    {
      id: 'step_2_pt_atomic_number',
      stepNumber: 2,
      stage: 'explain',
      title: 'Atomic Number & Symbols',
      subtitle: 'What Sets the Order',
      buddyDialogue:
        'The atomic number is the number of protons in the nucleus. It is the element’s identity card: every carbon atom has exactly 6 protons.',
      buddyState: 'EXPLAINING',
      boardTitle: 'Atomic Number Sets the Order',
      boardSummary:
        'The atomic number (Z) is the number of protons in an atom’s nucleus. Z increases by exactly one from each element to the next.',
      keyPrinciple:
        'Symbols have one or two letters, and only the first letter is a capital: C (carbon), Ca (calcium), Cl (chlorine). Some come from Latin names: Na (natrium, sodium), Fe (ferrum, iron).',
      visualType: 'interactive_diagram',
      visualData: { mode: 'numbers' },
      checkQuestion: {
        id: 'q_pt_step_protons',
        prompt: 'An atom has 11 protons in its nucleus. Which element is it?',
        options: [
          { id: 'pt_a1', text: 'Sodium (Na)', isCorrect: true, feedback: 'Correct. Z = 11 is sodium, the first element of period 3.' },
          { id: 'pt_a2', text: 'Neon (Ne)', isCorrect: false, feedback: 'Neon has 10 protons (Z = 10).' },
          { id: 'pt_a3', text: 'Magnesium (Mg)', isCorrect: false, feedback: 'Magnesium has 12 protons (Z = 12).' },
          { id: 'pt_a4', text: 'Nitrogen (N)', isCorrect: false, feedback: 'Nitrogen has 7 protons. Do not confuse the symbol N with Na.' },
        ],
      },
      tryThis: 'Find element 26 on the board. Its symbol comes from its Latin name. What is it?',
      commonMistake:
        'Atomic number counts protons only. The mass number counts protons plus neutrons.',
      hintText: 'Count along the table until you reach Z = 11. It starts a new row.',
    },
    {
      id: 'step_3_pt_periods_groups',
      stepNumber: 3,
      stage: 'show',
      title: 'Periods & Groups',
      subtitle: 'Rows and Columns',
      buddyDialogue:
        'Rows are periods and columns are groups. Lithium, sodium and potassium are all in Group 1, and they all react vigorously with water.',
      buddyState: 'EXPLAINING',
      boardTitle: 'Rows Are Periods, Columns Are Groups',
      boardSummary:
        'The period number equals the number of occupied electron shells. Elements in the same group share the same outer-shell arrangement.',
      keyPrinciple:
        'For main-group elements, the group tells you the valence electrons: Group 1 has 1, Group 2 has 2, and Groups 13–18 have 3–8. Helium, in Group 18, is the exception with 2.',
      visualType: 'interactive_diagram',
      visualData: { mode: 'periods_groups' },
      example: {
        title: 'Same Group, Similar Behaviour',
        description:
          'Fluorine, chlorine, bromine and iodine (Group 17, the halogens) each need one more electron to fill their outer shell, so they all react readily with metals to form salts.',
      },
      tryThis: 'Select sodium (Na) and chlorine (Cl). They share period 3 but sit in very different groups. Compare their valence electrons.',
      hintText: 'Period = row number. Group = column number (1–18).',
    },
    {
      id: 'step_4_pt_classes',
      stepNumber: 4,
      stage: 'interact',
      title: 'Metals, Nonmetals & Metalloids',
      subtitle: 'Three Broad Classes',
      buddyDialogue:
        'Most elements are metals. Nonmetals cluster at the top right, and the metalloids form a staircase between them. Use the filters on the board to see each class.',
      buddyState: 'ENCOURAGING',
      boardTitle: 'Metals, Nonmetals & Metalloids',
      boardSummary:
        'Metals occupy the left and centre of the table, nonmetals the upper right, and metalloids a diagonal staircase between them.',
      keyPrinciple:
        'Metals are shiny, conduct heat and electricity, and tend to lose electrons. Nonmetals are usually poor conductors and tend to gain or share electrons. Metalloids (B, Si, Ge, As, Sb, Te) have intermediate properties. Silicon is a semiconductor.',
      visualType: 'interactive_diagram',
      visualData: { mode: 'classes' },
      checkQuestion: {
        id: 'q_pt_step_nonmetals',
        prompt: 'Where are most nonmetals found on the periodic table?',
        options: [
          { id: 'pt_b1', text: 'In the upper right', isCorrect: true, feedback: 'Correct. Apart from hydrogen, the nonmetals sit to the upper right of the metalloid staircase.' },
          { id: 'pt_b2', text: 'On the far left', isCorrect: false, feedback: 'The far left holds the reactive alkali and alkaline-earth metals (hydrogen is the exception).' },
          { id: 'pt_b3', text: 'In the central block (Groups 3–12)', isCorrect: false, feedback: 'The central block holds the transition metals.' },
          { id: 'pt_b4', text: 'In the two rows below the main table', isCorrect: false, feedback: 'Those rows are the lanthanides and actinides, which are metals.' },
        ],
      },
      tryThis: 'Use the filter buttons to show only the metalloids. Trace the staircase they form.',
      commonMistake:
        'Hydrogen sits above Group 1 but it is a nonmetal, not an alkali metal.',
      hintText: 'Look to the right of the metalloid staircase.',
    },
    {
      id: 'step_5_pt_trends',
      stepNumber: 5,
      stage: 'practice',
      title: 'Periodic Trends',
      subtitle: 'Position Predicts Properties',
      buddyDialogue:
        'Here is the payoff: position predicts properties. Moving across a period, atoms get smaller and hold electrons more tightly. Moving down a group, they get bigger.',
      buddyState: 'THINKING',
      boardTitle: 'Position Predicts Properties',
      boardSummary:
        'Across a period, atomic radius generally decreases and electronegativity increases. Down a group, atomic radius increases and electronegativity decreases.',
      keyPrinciple:
        'Across a period, protons are added while electrons fill the same shell, so the stronger nuclear pull draws electrons closer. Down a group, each new shell places outer electrons farther from the nucleus. Fluorine is the most electronegative element.',
      visualType: 'interactive_diagram',
      visualData: { mode: 'trends' },
      checkQuestion: {
        id: 'q_pt_step_radius',
        prompt: 'Sodium (Na) and chlorine (Cl) are both in period 3. Which atom has the larger atomic radius?',
        options: [
          { id: 'pt_c1', text: 'Sodium', isCorrect: true, feedback: 'Correct. Radius decreases across a period, so sodium (left) is larger than chlorine (right).' },
          { id: 'pt_c2', text: 'Chlorine', isCorrect: false, feedback: 'Chlorine has more protons pulling on the same shells, so it is smaller.' },
          { id: 'pt_c3', text: 'They are the same size', isCorrect: false, feedback: 'Same number of shells, but different nuclear charge, so the sizes differ.' },
        ],
      },
      tryThis: 'Turn on the Trends view and follow the arrows for atomic radius and electronegativity.',
      commonMistake:
        'More protons across a period do not make atoms bigger. The stronger pull makes them smaller.',
      hintText: 'Same period means same number of shells. Which nucleus pulls harder?',
    },
    {
      id: 'step_6_pt_challenge',
      stepNumber: 6,
      stage: 'challenge',
      title: 'Locate the Element',
      subtitle: 'Element Location Challenge',
      buddyDialogue:
        'Challenge time! Use the period and group clues to find each element on the board. You have got this.',
      buddyState: 'CELEBRATING',
      boardTitle: 'Element Location Challenge',
      boardSummary:
        'Use period and group together as coordinates. Period 3, Group 17 points to exactly one element: chlorine.',
      keyPrinciple:
        'Position encodes identity and behaviour: row = number of shells, column = outer-shell pattern.',
      visualType: 'interactive_diagram',
      visualData: { mode: 'challenge' },
      tryThis: 'Solve the location challenges on the board. Click the element that matches each clue.',
      hintText: 'Find the row first, then move across to the column.',
    },
  ],
  questions: [
    {
      id: 'q_pt_1',
      lessonId: 'lesson_periodic_table',
      conceptId: 'periodic_table',
      prompt: 'What does the atomic number of an element tell you?',
      type: 'multiple_choice',
      difficulty: 'EASY',
      options: [
        { id: 'q_pt_1a', text: 'The number of protons in the nucleus', isCorrect: true, feedback: 'Correct. Z counts protons and identifies the element.' },
        { id: 'q_pt_1b', text: 'The number of protons plus neutrons', isCorrect: false, feedback: 'That is the mass number, not the atomic number.' },
        { id: 'q_pt_1c', text: 'The number of electron shells', isCorrect: false, feedback: 'The number of occupied shells matches the period number.' },
      ],
      explanation: 'The atomic number Z equals the number of protons. In a neutral atom it also equals the number of electrons.',
      misconceptionTag: 'atomic_number_vs_mass_number',
      hint: {
        id: 'hint_pt_1',
        conceptId: 'periodic_table',
        hints: [
          'Think about which particle defines the element.',
          'Changing neutrons makes an isotope. Changing protons makes a different element.',
          'The atomic number counts the protons.',
        ],
      },
    },
    {
      id: 'q_pt_2',
      lessonId: 'lesson_periodic_table',
      conceptId: 'periodic_table',
      prompt: 'Which element is in period 3, group 17?',
      type: 'application',
      difficulty: 'MEDIUM',
      options: [
        { id: 'q_pt_2a', text: 'Chlorine (Cl)', isCorrect: true, feedback: 'Correct. Row 3, column 17 is chlorine, a halogen.' },
        { id: 'q_pt_2b', text: 'Fluorine (F)', isCorrect: false, feedback: 'Fluorine is group 17 but period 2.' },
        { id: 'q_pt_2c', text: 'Argon (Ar)', isCorrect: false, feedback: 'Argon is period 3 but group 18.' },
        { id: 'q_pt_2d', text: 'Sulfur (S)', isCorrect: false, feedback: 'Sulfur is period 3, group 16.' },
      ],
      explanation: 'Period gives the row and group gives the column. Row 3, column 17 is chlorine.',
      misconceptionTag: 'period_vs_group',
      hint: {
        id: 'hint_pt_2',
        conceptId: 'periodic_table',
        hints: [
          'Periods are rows; groups are columns.',
          'Go to row 3 (sodium to argon), then move to column 17.',
          'The element just before the noble gas argon in period 3 is chlorine.',
        ],
      },
    },
    {
      id: 'q_pt_3',
      lessonId: 'lesson_periodic_table',
      conceptId: 'periodic_table',
      prompt: 'How does electronegativity generally change moving down Group 17 from fluorine to iodine?',
      type: 'conceptual',
      difficulty: 'HARD',
      options: [
        { id: 'q_pt_3a', text: 'It decreases', isCorrect: true, feedback: 'Correct. Outer electrons are farther from the nucleus and more shielded, so the attraction for bonding electrons weakens.' },
        { id: 'q_pt_3b', text: 'It increases', isCorrect: false, feedback: 'Electronegativity increases up a group and across a period, so fluorine is the highest.' },
        { id: 'q_pt_3c', text: 'It stays the same because they are in the same group', isCorrect: false, feedback: 'Same group means similar chemistry, not identical values.' },
      ],
      explanation: 'Down a group, added shells increase atomic radius and shielding, so electronegativity decreases. Fluorine is the most electronegative element.',
      misconceptionTag: 'group_trend_direction',
      hint: {
        id: 'hint_pt_3',
        conceptId: 'periodic_table',
        hints: [
          'What happens to atomic size as you go down a group?',
          'Bigger atoms hold bonding electrons farther from the nucleus.',
          'Weaker pull means lower electronegativity.',
        ],
      },
    },
  ],
  progressiveHints: [
    {
      id: 'ph_pt_1',
      stepId: 'step_2_pt_atomic_number',
      conceptId: 'periodic_table',
      hints: [
        'Every element has a unique number of protons.',
        'That number is printed in each box as the atomic number.',
        'Z = 11 is the first element in period 3.',
      ],
    },
    {
      id: 'ph_pt_2',
      stepId: 'step_5_pt_trends',
      conceptId: 'periodic_table',
      hints: [
        'Across a period, the number of shells stays the same.',
        'The nucleus gains protons, so it pulls harder on the electrons.',
        'Stronger pull on the same shells gives a smaller atom.',
      ],
    },
  ],
  flashcards: [
    { id: 'fc_pt_1', conceptId: 'periodic_table', front: 'What is the atomic number (Z)?', back: 'The number of protons in an atom’s nucleus. It identifies the element.', category: 'Atomic Structure' },
    { id: 'fc_pt_2', conceptId: 'periodic_table', front: 'Period vs group?', back: 'Periods are the 7 horizontal rows; groups are the 18 vertical columns.', category: 'Organisation' },
    { id: 'fc_pt_3', conceptId: 'periodic_table', front: 'Why do elements in a group behave alike?', back: 'Main-group elements in the same group have the same number of valence electrons.', category: 'Organisation' },
    { id: 'fc_pt_4', conceptId: 'periodic_table', front: 'Name the six common metalloids.', back: 'Boron, silicon, germanium, arsenic, antimony and tellurium.', category: 'Classification' },
    { id: 'fc_pt_5', conceptId: 'periodic_table', front: 'Trend in atomic radius across a period?', back: 'It decreases, because increasing nuclear charge pulls electrons in the same shell closer.', category: 'Trends' },
  ],
  sources: [
    {
      id: 'src_pt_1',
      title: 'IUPAC Periodic Table of the Elements',
      authorOrPublisher: 'International Union of Pure and Applied Chemistry',
      url: 'https://iupac.org/what-we-do/periodic-table-of-elements/',
      type: 'curriculum',
      note: 'Authoritative element names, symbols and atomic numbers.',
    },
    {
      id: 'src_pt_2',
      title: 'OpenStax Chemistry 2e, Section 2.5: The Periodic Table',
      authorOrPublisher: 'OpenStax / Rice University',
      url: 'https://openstax.org/books/chemistry-2e/pages/2-5-the-periodic-table',
      type: 'oer',
      note: 'Periods, groups, metals, nonmetals and metalloids.',
    },
    {
      id: 'src_pt_3',
      title: 'Periodic Table',
      authorOrPublisher: 'Royal Society of Chemistry',
      url: 'https://periodic-table.rsc.org/',
      type: 'oer',
      note: 'Element-by-element data and classification.',
    },
  ],
  initialNotes:
    'Periodic Table Notes:\n• Atomic number Z = number of protons.\n• Periods = rows (7). Groups = columns (18).\n• Main groups: group number ↔ valence electrons.\n• Metals left/centre, nonmetals upper right, metalloids on the staircase.\n• Across a period: radius ↓, electronegativity ↑.',
  buddyScript: {
    introduction:
      'Welcome to the periodic table, chemistry’s map. Let us learn to read it so you can find any element and predict how it behaves.',
    revisionIntroduction:
      'Revision time: the periodic table. We will quickly recall atomic number, periods, groups, classes and trends, then test yourself on the board.',
    correct: 'Exactly right. You are reading the table like a chemist.',
    incorrect: 'Not quite. Check the element’s position again. Remember: periods are rows and groups are columns.',
    hint: 'Start from the row (period), then move across to the column (group).',
    transition: 'Good. Let us use that to read the next part of the table.',
    completion: 'Brilliant! You can locate elements, classify them and predict basic trends from their position.',
  },
  xiraPrompts: {
    why: 'Why are the elements arranged in this order?',
    simpler: 'Explain periods and groups in the simplest possible terms.',
    example: 'Give me an everyday example of elements from the same group behaving alike.',
    hint: 'Give me a hint for locating an element from its period and group.',
    deeper: 'Why does atomic radius decrease across a period?',
  },
};
