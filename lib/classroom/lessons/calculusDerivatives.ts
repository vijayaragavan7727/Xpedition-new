/**
 * Calculus: Derivatives — authored Mathematics lesson.
 *
 * Smart Board visual: deterministic derivative graph of
 *   f(x) = 0.4x³ − 1.2x,  f′(x) = 1.2x² − 1.2
 * with a movable tangent point (GraphRenderer, derivative variant).
 * All worked numbers below are computed from that same function.
 */

import type { ClassroomLesson } from '@/components/classroom/types';

export const CALCULUS_DERIVATIVES_LESSON: ClassroomLesson = {
  id: 'lesson_calculus_derivatives',
  conceptId: 'calculus_derivatives',
  topicTitle: 'Derivatives: Rates of Change & Tangents',
  subject: 'Mathematics',
  category: 'Differential Calculus',
  gradeLevel: 'Senior Secondary / First-Year Calculus',
  estimatedMinutes: 11,
  hasFormulas: true,
  learningObjective:
    'Interpret the derivative as the slope of the tangent line and as an instantaneous rate of change, compute simple derivatives with the power rule, and apply them to motion.',
  steps: [
    {
      id: 'step_1_calc_function',
      stepNumber: 1,
      stage: 'introduce',
      title: 'Functions Change',
      subtitle: 'Rising, Falling, Flat',
      buddyDialogue:
        'Calculus is the mathematics of change. The curve on the board is f(x) = 0.4x³ − 1.2x. Let us find out how fast it changes at every point.',
      buddyState: 'INTRODUCING',
      boardTitle: 'How Fast Does f(x) Change?',
      boardSummary:
        'A function assigns each input x exactly one output f(x). The board shows f(x) = 0.4x³ − 1.2x.',
      keyPrinciple:
        'Where the curve rises, f(x) increases as x increases. Where it falls, f(x) decreases. Calculus measures exactly how fast.',
      formulaSnippet: 'f(x) = 0.4x³ − 1.2x',
      visualType: 'graph',
      tryThis: 'Move the tangent point along the curve. Where is the curve rising, falling or flat?',
      hintText: 'Read the curve from left to right, like a hill walk.',
    },
    {
      id: 'step_2_calc_average',
      stepNumber: 2,
      stage: 'explain',
      title: 'Average Rate of Change',
      subtitle: 'Slope of a Secant Line',
      buddyDialogue:
        'Between two points on the curve, the average rate of change is rise over run: the slope of the straight line joining them, called a secant.',
      buddyState: 'EXPLAINING',
      boardTitle: 'Average Rate = Rise ÷ Run',
      boardSummary:
        'Between x = a and x = b, the average rate of change is [f(b) − f(a)] ÷ (b − a), the slope of the secant line.',
      keyPrinciple:
        'Example: f(1) = 0.4 − 1.2 = −0.8 and f(2) = 0.4·8 − 1.2·2 = 0.8, so the average rate of change on [1, 2] is (0.8 − (−0.8)) ÷ (2 − 1) = 1.6.',
      formulaSnippet: '[f(b) − f(a)] / (b − a)',
      visualType: 'graph',
      checkQuestion: {
        id: 'q_calc_step_average',
        prompt: 'For f(x) = 0.4x³ − 1.2x, what is the average rate of change from x = 0 to x = 2?',
        options: [
          { id: 'calc_a1', text: '0.4', isCorrect: true, feedback: 'Correct. (0.8 − 0) ÷ (2 − 0) = 0.4.' },
          { id: 'calc_a2', text: '0.8', isCorrect: false, feedback: '0.8 is the change in f(x). You still need to divide by the change in x, which is 2.' },
          { id: 'calc_a3', text: '2', isCorrect: false, feedback: '2 is the change in x (the run), not the rate.' },
          { id: 'calc_a4', text: '−1.2', isCorrect: false, feedback: '−1.2 is the tangent slope at x = 0, not the average over [0, 2].' },
        ],
      },
      tryThis: 'Compute f(2) yourself, check it against the curve on the board, then find the rise over run on [0, 2].',
      commonMistake:
        'Always divide the change in output by the change in input. The change in f(x) alone is not a rate.',
      hintText: 'Rate = (change in f) ÷ (change in x).',
    },
    {
      id: 'step_3_calc_tangent',
      stepNumber: 3,
      stage: 'show',
      title: 'From Secant to Tangent',
      subtitle: 'Shrinking the Interval',
      buddyDialogue:
        'Now slide the second point closer and closer to the first. The secant turns into the tangent line, which just touches the curve at one point.',
      buddyState: 'EXPLAINING',
      boardTitle: 'The Tangent Line',
      boardSummary:
        'As the interval shrinks toward zero width, the secant line approaches the tangent line at x = a.',
      keyPrinciple:
        'The slope of the tangent at x = a is the instantaneous rate of change there. This limit is the derivative f′(a).',
      formulaSnippet: "f′(a) = lim(h→0) [f(a + h) − f(a)] / h",
      visualType: 'graph',
      tryThis: 'Place the tangent point at x = 1.5 and then x = −1.5. Is the tangent steeper there or near x = 0?',
      hintText: 'Steeper tangent means a larger rate of change.',
    },
    {
      id: 'step_4_calc_derivative',
      stepNumber: 4,
      stage: 'interact',
      title: 'The Derivative Function',
      subtitle: 'Slope at Every Point',
      buddyDialogue:
        'The derivative gives the tangent slope at every x. With the power rule, f′(x) = 1.2x² − 1.2. Try the tangent at x = 1 and x = −1. What do you notice?',
      buddyState: 'THINKING',
      boardTitle: "f′(x) = 1.2x² − 1.2",
      boardSummary:
        'Power rule: d/dx(xⁿ) = n·xⁿ⁻¹. So d/dx(0.4x³) = 1.2x² and d/dx(−1.2x) = −1.2, giving f′(x) = 1.2x² − 1.2.',
      keyPrinciple:
        'f′(x) > 0 means the curve is rising; f′(x) < 0 means it is falling; f′(x) = 0 means a flat tangent. Here that happens at x = −1 (a local maximum) and x = 1 (a local minimum).',
      formulaSnippet: 'd/dx(xⁿ) = n·xⁿ⁻¹',
      visualType: 'graph',
      checkQuestion: {
        id: 'q_calc_step_slope0',
        prompt: 'Using f′(x) = 1.2x² − 1.2, what is the slope of the tangent at x = 0?',
        options: [
          { id: 'calc_b1', text: '−1.2', isCorrect: true, feedback: 'Correct. f′(0) = 1.2·0 − 1.2 = −1.2, so the curve is falling at x = 0.' },
          { id: 'calc_b2', text: '0', isCorrect: false, feedback: 'f(0) = 0 is the height of the curve, not its slope.' },
          { id: 'calc_b3', text: '1.2', isCorrect: false, feedback: 'Check the sign of the constant term in f′(x) before you substitute x = 0.' },
          { id: 'calc_b4', text: 'Undefined', isCorrect: false, feedback: 'This polynomial is smooth, so its derivative exists at every x.' },
        ],
      },
      tryThis: 'Set the tangent point to x = 1 and then x = −1. What happens to the tangent line?',
      commonMistake:
        'The derivative at a point is a slope, not the height f(x) of the curve at that point.',
      hintText: 'Substitute x = 0 into f′(x), not into f(x).',
    },
    {
      id: 'step_5_calc_application',
      stepNumber: 5,
      stage: 'practice',
      title: 'Rates in the Real World',
      subtitle: 'Velocity as a Derivative',
      buddyDialogue:
        'Derivatives are everywhere. If s(t) is position, then s′(t) is velocity. Let us apply it to a ball thrown upward.',
      buddyState: 'THINKING',
      boardTitle: 'Derivative = Instantaneous Rate',
      boardSummary:
        'If s(t) gives position in metres after t seconds, then s′(t) is the velocity in metres per second.',
      keyPrinciple:
        'A derivative’s units are output units per input unit. Example: s(t) = 5t² gives s′(t) = 10t, so at t = 3 s the velocity is 30 m/s.',
      formulaSnippet: 'v(t) = s′(t)',
      visualType: 'graph',
      checkQuestion: {
        id: 'q_calc_step_velocity',
        prompt: 'A ball’s height is h(t) = 20t − 5t² metres. What is its vertical velocity at t = 1 s?',
        options: [
          { id: 'calc_c1', text: '10 m/s', isCorrect: true, feedback: 'Correct. h′(t) = 20 − 10t, so h′(1) = 10 m/s.' },
          { id: 'calc_c2', text: '15 m/s', isCorrect: false, feedback: '15 is h(1), the height in metres, not the velocity.' },
          { id: 'calc_c3', text: '20 m/s', isCorrect: false, feedback: '20 m/s is the launch velocity at t = 0.' },
          { id: 'calc_c4', text: '0 m/s', isCorrect: false, feedback: 'The velocity is zero at t = 2 s, the top of the flight.' },
        ],
      },
      tryThis: 'Find when the ball reaches its highest point by solving h′(t) = 0.',
      commonMistake:
        'Do not substitute into h(t) when asked for velocity. Differentiate first, then substitute.',
      hintText: 'Differentiate h(t) with the power rule, then put t = 1.',
    },
  ],
  formulas: [
    {
      id: 'f_calc_avg',
      name: 'Average Rate of Change',
      formula: '[f(b) − f(a)] / (b − a)',
      description: 'Slope of the secant line between x = a and x = b.',
      variables: [
        { symbol: 'a, b', description: 'Interval endpoints' },
        { symbol: 'f(a), f(b)', description: 'Function values at the endpoints' },
      ],
      example: 'f(x) = 0.4x³ − 1.2x on [0, 2]: (0.8 − 0) / 2 = 0.4',
    },
    {
      id: 'f_calc_limit',
      name: 'Definition of the Derivative',
      formula: "f′(a) = lim(h→0) [f(a + h) − f(a)] / h",
      description: 'Instantaneous rate of change: the limit of secant slopes as the interval shrinks to zero.',
      variables: [
        { symbol: 'h', description: 'Width of the interval, shrinking to 0' },
        { symbol: "f′(a)", description: 'Slope of the tangent at x = a' },
      ],
    },
    {
      id: 'f_calc_power',
      name: 'Power Rule',
      formula: 'd/dx(xⁿ) = n·xⁿ⁻¹',
      description: 'Differentiate a power of x by multiplying by the exponent and reducing the exponent by one.',
      variables: [
        { symbol: 'n', description: 'Exponent (any real number)' },
      ],
      example: 'd/dx(0.4x³) = 0.4·3x² = 1.2x²',
    },
  ],
  questions: [
    {
      id: 'q_calc_1',
      lessonId: 'lesson_calculus_derivatives',
      conceptId: 'calculus_derivatives',
      prompt: 'Geometrically, what does f′(a) represent?',
      type: 'multiple_choice',
      difficulty: 'EASY',
      options: [
        { id: 'q_calc_1a', text: 'The slope of the tangent line at x = a', isCorrect: true, feedback: 'Correct.' },
        { id: 'q_calc_1b', text: 'The height of the curve at x = a', isCorrect: false, feedback: 'That is f(a), not f′(a).' },
        { id: 'q_calc_1c', text: 'The area under the curve up to x = a', isCorrect: false, feedback: 'Area under a curve is found with integration, not differentiation.' },
      ],
      explanation: 'The derivative at a point is the slope of the tangent line: the instantaneous rate of change.',
      misconceptionTag: 'slope_vs_value',
      hint: {
        id: 'hint_calc_1',
        conceptId: 'calculus_derivatives',
        hints: ['Think of the line that just touches the curve.', 'The derivative measures steepness.', 'f′(a) is the tangent slope.'],
      },
    },
    {
      id: 'q_calc_2',
      lessonId: 'lesson_calculus_derivatives',
      conceptId: 'calculus_derivatives',
      prompt: 'What is the derivative of g(x) = 3x² + 5x?',
      type: 'application',
      difficulty: 'MEDIUM',
      options: [
        { id: 'q_calc_2a', text: '6x + 5', isCorrect: true, feedback: 'Correct. d/dx(3x²) = 6x and d/dx(5x) = 5.' },
        { id: 'q_calc_2b', text: '3x + 5', isCorrect: false, feedback: 'Multiply by the exponent: 3·2 = 6.' },
        { id: 'q_calc_2c', text: '6x² + 5', isCorrect: false, feedback: 'Reduce the exponent by one: x² becomes x.' },
        { id: 'q_calc_2d', text: '6x', isCorrect: false, feedback: 'Do not drop the 5x term. Its derivative is 5.' },
      ],
      explanation: 'Apply the power rule term by term: 3x² → 6x, 5x → 5.',
      misconceptionTag: 'power_rule_exponent',
      hint: {
        id: 'hint_calc_2',
        conceptId: 'calculus_derivatives',
        hints: ['Differentiate each term separately.', 'd/dx(xⁿ) = n·xⁿ⁻¹.', '3x² → 6x and 5x → 5.'],
      },
    },
    {
      id: 'q_calc_3',
      lessonId: 'lesson_calculus_derivatives',
      conceptId: 'calculus_derivatives',
      prompt: 'On an interval where f′(x) < 0, the graph of f is…',
      type: 'conceptual',
      difficulty: 'MEDIUM',
      options: [
        { id: 'q_calc_3a', text: 'Decreasing', isCorrect: true, feedback: 'Correct. A negative slope means f falls as x increases.' },
        { id: 'q_calc_3b', text: 'Increasing', isCorrect: false, feedback: 'Increasing requires a positive derivative.' },
        { id: 'q_calc_3c', text: 'Below the x-axis', isCorrect: false, feedback: 'The sign of f′ describes direction, not whether f itself is negative.' },
      ],
      explanation: 'The sign of the derivative gives the direction of change: negative means decreasing.',
      misconceptionTag: 'sign_of_derivative_vs_function',
      hint: {
        id: 'hint_calc_3',
        conceptId: 'calculus_derivatives',
        hints: ['f′ tells you about slope.', 'A negative slope goes downhill.', 'The function is decreasing.'],
      },
    },
  ],
  flashcards: [
    { id: 'fc_calc_1', conceptId: 'calculus_derivatives', front: 'Average rate of change', back: '[f(b) − f(a)] / (b − a): the slope of the secant line.', category: 'Rates' },
    { id: 'fc_calc_2', conceptId: 'calculus_derivatives', front: 'Derivative f′(a)', back: 'Slope of the tangent at x = a; the instantaneous rate of change.', category: 'Definition' },
    { id: 'fc_calc_3', conceptId: 'calculus_derivatives', front: 'Power rule', back: 'd/dx(xⁿ) = n·xⁿ⁻¹', category: 'Rules' },
    { id: 'fc_calc_4', conceptId: 'calculus_derivatives', front: 'f′(x) = 0 means…', back: 'A horizontal tangent: a possible local maximum or minimum.', category: 'Interpretation' },
  ],
  sources: [
    {
      id: 'src_calc_1',
      title: 'OpenStax Calculus Volume 1, Section 3.1: Defining the Derivative',
      authorOrPublisher: 'OpenStax / Rice University',
      url: 'https://openstax.org/books/calculus-volume-1/pages/3-1-defining-the-derivative',
      type: 'oer',
    },
    {
      id: 'src_calc_2',
      title: 'OpenStax Calculus Volume 1, Section 3.3: Differentiation Rules',
      authorOrPublisher: 'OpenStax / Rice University',
      url: 'https://openstax.org/books/calculus-volume-1/pages/3-3-differentiation-rules',
      type: 'oer',
    },
  ],
  initialNotes:
    'Derivative Notes:\n• Average rate = [f(b) − f(a)] / (b − a).\n• Derivative = tangent slope = instantaneous rate.\n• Power rule: d/dx(xⁿ) = n·xⁿ⁻¹.\n• f′ > 0 rising, f′ < 0 falling, f′ = 0 flat.',
  buddyScript: {
    introduction: 'Welcome to derivatives, the mathematics of change. We will go from average rates to the exact slope at a single point.',
    revisionIntroduction:
      'Revision: derivatives. Recall secant vs tangent, the power rule and what the sign of f′ tells you, then practise on the graph.',
    correct: 'Correct! Your rate-of-change reasoning is solid.',
    incorrect: 'Not quite. Check whether you used the slope (the derivative) or the height of the curve.',
    hint: 'Differentiate first, then substitute the x-value.',
    transition: 'Good. Now let us shrink that interval.',
    completion: 'Excellent! You can interpret, compute and apply derivatives as rates of change.',
  },
  xiraPrompts: {
    why: 'Why is the tangent slope the limit of secant slopes?',
    simpler: 'Explain a derivative in the simplest possible terms.',
    example: 'Give me a real-world example of a derivative as a rate of change.',
    hint: 'Give me a hint for using the power rule.',
    deeper: 'Why does f′(x) = 0 not always mean a maximum or minimum?',
  },
};
