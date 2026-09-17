/**
 * Xpedition Experience Engine — Experience #5: Programming Code Lab Configuration
 *
 * Theme: "Debug by Doing"
 * Concept: python_debugging_basics
 * Experience ID: programming_code_lab
 * Template: code
 *
 * Teaches: Accumulation vs Reassignment in Python
 */

import { ExperienceConfig, ExperienceResult, XiraExperienceObservation } from '../types';
import { ExperienceDefinition } from '../experienceDefinition';
import {
  INITIAL_PYTHON_ACCUMULATION_CHALLENGE,
  CodeLabState,
  evaluateCodeSubmission,
  validateCodeExecution,
} from '../domain/codeDebuggingRules';
import { createExperienceFeedback } from '../feedback';

export const CODE_DEBUGGING_EXPERIENCE: ExperienceConfig = {
  id: 'programming_code_lab',
  experienceType: 'CODE_DEBUGGING',
  conceptId: 'python_debugging_basics',
  conceptName: 'Python Debugging: Accumulation vs Reassignment',
  title: 'Programming Code Lab: Debug by Doing',
  subtitle: 'Diagnose and resolve the loop accumulation bug to calculate the correct list sum.',
  difficulty: 0.25,
  scene: {
    environmentType: 'lab',
    camera: {
      initialPosition: [0, 0, 5],
      lookAt: [0, 0, 0],
      fov: 45,
    },
    lighting: {
      ambientColor: '#0f172a',
      ambientIntensity: 1.0,
      directionalColor: '#38bdf8',
      directionalPosition: [0, 10, 10],
    },
  },
  challenge: {
    objective: 'Discover why the loop produces 8 instead of 20, and fix the accumulation bug.',
    instructions:
      'Run the code to inspect its output. Observe why the final total is 8 rather than 20, edit the assignment inside the loop, and run again to verify.',
    successCondition: 'Run the program so that `total` equals 20 through proper loop accumulation.',
    hints: [
      'Look at what happens to total every time the loop runs.',
      'Is total keeping the previous value, or replacing it?',
      'The operator used here controls whether the value is accumulated or replaced.',
    ],
    prediction: {
      prompt: 'Before running: What will the variable `total` equal when this loop finishes?',
      explanation:
        'In the starting code, `total = number` reassigns `total` on each iteration, leaving it equal to the last item (8).',
      options: [
        { id: 'opt_8', label: '8 (The last item in the list)', isCorrect: true },
        { id: 'opt_20', label: '20 (The sum of 2 + 4 + 6 + 8)', isCorrect: false },
        { id: 'opt_0', label: '0 (The starting initial value)', isCorrect: false },
      ],
    },
  },
  briefing: {
    title: 'The Programming Debugging Lab',
    objective:
      'Master the distinction between variable reassignment and variable accumulation inside iterative loops.',
    context:
      'A very common beginner bug is overwriting a variable inside a loop rather than accumulating values into it.',
    targetOutcome:
      'Diagnose the output mismatch, repair the loop operator, and verify the resulting sum.',
    hints: [
      'Click "Run Code" first to observe the current output.',
      'Notice the difference between `=` and `+=`.',
      'Use the hints if you get stuck.',
    ],
  },
};

export const CODE_DEBUGGING_INITIAL_STATE: CodeLabState = {
  sourceCode: INITIAL_PYTHON_ACCUMULATION_CHALLENGE.initialCode,
  lastOutput: undefined,
  runCount: 0,
  editCount: 0,
  hasRun: false,
  isCompleted: false,
  hintsUsed: 0,
  consecutiveMismatches: 0,
  independentCompletion: true,
  history: [],
};

export const CODE_DEBUGGING_DEFINITION: ExperienceDefinition<
  typeof CODE_DEBUGGING_EXPERIENCE,
  CodeLabState,
  any
> = {
  id: 'programming_code_lab',
  type: 'CODE_DEBUGGING',
  conceptId: 'python_debugging_basics',
  title: 'Programming Code Lab: Debug by Doing',
  objective: 'Fix the loop assignment so total sums all numbers to 20.',
  difficulty: 0.25,
  template: 'code',
  configuration: CODE_DEBUGGING_EXPERIENCE,
  initialState: CODE_DEBUGGING_INITIAL_STATE,
  hints: INITIAL_PYTHON_ACCUMULATION_CHALLENGE.hints,
  predictionChallenge: CODE_DEBUGGING_EXPERIENCE.challenge.prediction,
  validator: (state: CodeLabState) => {
    const evaluation = evaluateCodeSubmission(state, INITIAL_PYTHON_ACCUMULATION_CHALLENGE);
    return {
      status: evaluation.isComplete ? 'COMPLETE' : state.hasRun ? 'INVALID' : 'INCOMPLETE',
      isValid: evaluation.isComplete,
      isComplete: evaluation.isComplete,
      score: evaluation.score,
      reason: evaluation.reason,
      evidence: evaluation.evidence,
    };
  },
  feedbackGenerator: (valResult, state) => {
    if (valResult.isComplete) {
      return createExperienceFeedback(
        'SUCCESS',
        'Outstanding debugging! You identified the reassignment bug and used the accumulation operator (`+=`) to sum the list elements.',
        {
          pedagogicalInsight: 'Reflect on how this pattern applies across accumulators, counters, and filters.',
          suggestedAction: 'Reflect on variable mutation across iterations.',
        }
      );
    }
    if (state.hasRun) {
      const execResult = validateCodeExecution(state.sourceCode, INITIAL_PYTHON_ACCUMULATION_CHALLENGE);
      return createExperienceFeedback(
        'CORRECTION',
        execResult.educationalInsight,
        {
          pedagogicalInsight: 'Trace what happens to total during each loop iteration.',
          suggestedAction: 'Edit the assignment statement inside the loop body, then click Run Code.',
        }
      );
    }
    return createExperienceFeedback(
      'ENCOURAGEMENT',
      'Click "Run Code" to observe what the initial program outputs.',
      {
        pedagogicalInsight: 'Observe runtime behavior before making changes.',
        suggestedAction: 'Check whether the output matches the expected total (20).',
      }
    );
  },
};

export const CODE_DEBUGGING_QUEST = {
  id: 'quest_python_debugging_01',
  conceptId: 'python_debugging_basics',
  conceptName: 'Python Debugging: Accumulation vs Reassignment',
  prompt: 'In a loop calculating a running sum, what is the difference between `total = number` and `total += number`?',
  options: [
    '`total = number` replaces the previous value, while `total += number` adds to the running sum',
    '`total = number` adds the numbers together, while `total += number` sets total to 0',
    'Both statements perform the exact same mathematical operation in Python',
    '`total += number` is a syntax error in Python loops',
  ],
  correctIndex: 0,
  explanation:
    'Simple assignment (`=`) replaces the previous variable value with the current number. Augmented assignment (`+=`) adds the current number to the accumulated total.',
  difficulty: 0.25,
  experienceType: 'CODE_DEBUGGING',
  experienceId: 'programming_code_lab',
  objective: 'Diagnose and fix the loop accumulation bug in the interactive Code Lab.',
  briefing:
    'Step into the Code Lab. You will read, run, debug, and repair an accumulation loop through hands-on interaction.',
  items: [
    {
      id: 'item_code_debugging_exp',
      type: 'interactive_simulation',
      title: 'Interactive Code Lab: Debug by Doing',
      description: 'Run the program, diagnose the output mismatch, and fix the loop accumulation bug.',
      concept: 'python_debugging_basics',
      points: 100,
      experienceType: 'CODE_DEBUGGING',
      experienceConfig: CODE_DEBUGGING_EXPERIENCE,
    },
    {
      id: 'item_code_reflection',
      type: 'reflection',
      title: 'Programming Logic Debrief',
      description: 'Reflect on variable state mutations across loop iterations.',
      concept: 'python_debugging_basics',
      points: 50,
      question:
        'What caused the initial code output to be 8 instead of 20, and what would happen if a 5th number (e.g. 10) were added to the list?',
    },
  ],
  experienceConfig: CODE_DEBUGGING_EXPERIENCE,
};

/**
 * Creates canonical ExperienceResult for the Programming Code Lab.
 */
export function createCodeExperienceResult(
  config: ExperienceConfig,
  observation: XiraExperienceObservation,
  state: CodeLabState,
  timeSpentSeconds: number = 40
): ExperienceResult {
  const evaluation = evaluateCodeSubmission(state);
  const isComplete = evaluation.isComplete;

  const evidenceSignals: string[] = [];
  if (isComplete) {
    evidenceSignals.push('Successfully resolved accumulation vs reassignment bug');
  }
  if (state.independentCompletion) {
    evidenceSignals.push('Diagnosed and corrected bug independently without hints');
  } else if (state.hintsUsed > 0) {
    evidenceSignals.push(`Utilized ${state.hintsUsed} progressive conceptual hints`);
  }
  if (state.runCount > 1) {
    evidenceSignals.push(`Iterative debugging cycle verified across ${state.runCount} execution runs`);
  }

  return {
    experienceId: config.id,
    conceptId: config.conceptId,
    conceptName: config.conceptName,
    attempts: 1,
    successfulAttempts: isComplete ? 1 : 0,
    completed: isComplete,
    score: evaluation.score,
    trialsCount: state.runCount,
    totalInteractions: state.editCount + state.runCount + state.hintsUsed,
    timeSpentSeconds,
    timestamp: Date.now(),
    xiraObservation: observation,
    codeEvidence: evaluation.evidence,
    summaryFeedback: isComplete
      ? `Bug resolved! You corrected \`total = number\` to accumulation and verified the output 20 across ${state.runCount} runs.`
      : `Debugging in progress: ${state.runCount} runs executed. Focus on the assignment operator inside the loop.`,
    nextActionRecommendation: isComplete
      ? 'Advance to loop counters, conditional filters, and list comprehensions.'
      : 'Review how augmented assignment (`+=`) retains previous loop values.',
    evidenceSignals,
  };
}
