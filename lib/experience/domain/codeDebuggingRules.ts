/**
 * Xpedition Experience Engine — Programming Code Lab Domain Rules
 *
 * Domain-specific deterministic code execution simulator and validator.
 * Provides safe, sandboxed, deterministic validation for programming challenges
 * without invoking arbitrary code execution (NO eval, NO exec, NO child_process).
 *
 * Concepts supported:
 * - Accumulation vs Reassignment (Python)
 * - Loop accumulation pattern detection
 * - State tracking, bug detection, and evidence synthesis
 */

import { CodeEvidence } from '../types';

export interface CodeChallengeDefinition {
  id: string;
  title: string;
  conceptId: string;
  language: 'python';
  initialCode: string;
  expectedOutput: string;
  targetConcept: string;
  objective: string;
  numbersList: number[];
  hints: string[];
}

export interface CodeExecutionResult {
  output: string;
  isCorrect: boolean;
  status: 'success' | 'output_mismatch' | 'syntax_warning' | 'bypassed_loop';
  detectedBug?: 'reassignment' | 'hardcoded_bypass' | 'unmodified_initial' | 'unknown';
  detectedCorrection?: 'accumulation_augmented' | 'accumulation_expanded';
  educationalInsight: string;
  lineError?: number;
}

export interface CodeLabState {
  sourceCode: string;
  lastOutput?: string;
  runCount: number;
  editCount: number;
  hasRun: boolean;
  isCompleted: boolean;
  hintsUsed: number;
  consecutiveMismatches: number;
  detectedBug?: string;
  correctionPattern?: string;
  independentCompletion: boolean;
  history: Array<{
    timestamp: number;
    code: string;
    output: string;
    isCorrect: boolean;
  }>;
}

export const INITIAL_PYTHON_ACCUMULATION_CHALLENGE: CodeChallengeDefinition = {
  id: 'py_accumulation_01',
  title: 'Accumulation vs Reassignment',
  conceptId: 'python_debugging_basics',
  language: 'python',
  initialCode: `numbers = [2, 4, 6, 8]

total = 0

for number in numbers:
    total = number

print(total)`,
  expectedOutput: '20',
  targetConcept: 'accumulation_vs_reassignment',
  objective: 'Fix the accumulation bug inside the loop so that total correctly sums all numbers to 20.',
  numbersList: [2, 4, 6, 8],
  hints: [
    'Look at what happens to total every time the loop runs.',
    'Is total keeping the previous value, or replacing it?',
    'The operator used here controls whether the value is accumulated or replaced.',
  ],
};

/**
 * Deterministic Safe Validator for the Accumulation Challenge.
 * Completely immune to code injection / arbitrary execution.
 */
export function validateCodeExecution(
  sourceCode: string,
  challenge: CodeChallengeDefinition = INITIAL_PYTHON_ACCUMULATION_CHALLENGE
): CodeExecutionResult {
  const normalized = sourceCode.trim();

  if (!normalized) {
    return {
      output: '',
      isCorrect: false,
      status: 'syntax_warning',
      detectedBug: 'unknown',
      educationalInsight: 'The code editor is empty. Enter Python code to run.',
    };
  }

  // Extract lines and clean comments
  const rawLines = normalized.split('\n');
  const codeLines = rawLines.map((l) => l.replace(/#.*$/, '').trimEnd());

  // Check for presence of print statement
  const printLine = codeLines.find((l) => l.trim().startsWith('print('));
  if (!printLine) {
    return {
      output: '',
      isCorrect: false,
      status: 'syntax_warning',
      detectedBug: 'unknown',
      educationalInsight: 'No print() statement detected to output the result.',
    };
  }

  // Check if learner hardcoded print(20) or total = 20 outside loop
  const hasHardcodedTotal = codeLines.some(
    (l) => /^\s*total\s*=\s*20\s*$/.test(l) || /^\s*print\(\s*20\s*\)/.test(l)
  );
  if (hasHardcodedTotal) {
    return {
      output: '20',
      isCorrect: false,
      status: 'bypassed_loop',
      detectedBug: 'hardcoded_bypass',
      educationalInsight:
        'Avoid hardcoding 20. The loop should calculate the sum dynamically from the numbers list.',
    };
  }

  // Check for loop presence
  const loopIndex = codeLines.findIndex((l) => /for\s+\w+\s+in\s+\w+\s*:/.test(l));
  if (loopIndex === -1) {
    return {
      output: '',
      isCorrect: false,
      status: 'syntax_warning',
      detectedBug: 'unknown',
      educationalInsight: 'Expected a `for ... in ...:` loop to iterate through the numbers.',
    };
  }

  // Find statements indented inside the loop
  const loopIndentMatch = rawLines[loopIndex].match(/^(\s*)/);
  const baseIndent = loopIndentMatch ? loopIndentMatch[1].length : 0;

  const loopBodyLines: string[] = [];
  for (let i = loopIndex + 1; i < rawLines.length; i++) {
    const raw = rawLines[i];
    if (!raw.trim()) continue;
    const indentMatch = raw.match(/^(\s*)/);
    const lineIndent = indentMatch ? indentMatch[1].length : 0;
    if (lineIndent > baseIndent) {
      loopBodyLines.push(raw.trim());
    } else {
      break;
    }
  }

  if (loopBodyLines.length === 0) {
    return {
      output: '',
      isCorrect: false,
      status: 'syntax_warning',
      detectedBug: 'unknown',
      educationalInsight: 'Indentation error: Expected an indented block under the for loop.',
    };
  }

  // Parse numbers from definition or source
  const numbers = challenge.numbersList;
  const loopBody = loopBodyLines.join('\n');

  // Case A: Correct Accumulation via augmented operator (total += number)
  const hasAugmentedAccumulation = /total\s*\+=\s*number/.test(loopBody);
  if (hasAugmentedAccumulation) {
    const total = numbers.reduce((acc, n) => acc + n, 0);
    return {
      output: String(total),
      isCorrect: true,
      status: 'success',
      detectedCorrection: 'accumulation_augmented',
      educationalInsight:
        'Success! `total += number` adds each element to the running sum, accumulating to 20.',
    };
  }

  // Case B: Correct Accumulation via expanded operator (total = total + number or number + total)
  const hasExpandedAccumulation =
    /total\s*=\s*total\s*\+\s*number/.test(loopBody) ||
    /total\s*=\s*number\s*\+\s*total/.test(loopBody);
  if (hasExpandedAccumulation) {
    const total = numbers.reduce((acc, n) => acc + n, 0);
    return {
      output: String(total),
      isCorrect: true,
      status: 'success',
      detectedCorrection: 'accumulation_expanded',
      educationalInsight:
        'Success! `total = total + number` retains the accumulated sum across all iterations.',
    };
  }

  // Case C: Bug Pattern — Simple Reassignment (total = number)
  const hasReassignment = /total\s*=\s*number/.test(loopBody);
  if (hasReassignment) {
    // Simulates the loop: last element wins
    const lastNum = numbers[numbers.length - 1];
    return {
      output: String(lastNum),
      isCorrect: false,
      status: 'output_mismatch',
      detectedBug: 'reassignment',
      educationalInsight:
        `Notice the result is ${lastNum}. \`total = number\` replaces the previous value on each iteration instead of adding to it.`,
    };
  }

  // Case D: Other operators (e.g. subtraction or multiplication)
  if (/total\s*-=\s*number/.test(loopBody)) {
    const val = numbers.reduce((acc, n) => acc - n, 0);
    return {
      output: String(val),
      isCorrect: false,
      status: 'output_mismatch',
      detectedBug: 'unknown',
      educationalInsight: 'The `-=` operator subtracts values rather than summing them.',
    };
  }

  if (/total\s*\*=\s*number/.test(loopBody)) {
    return {
      output: '0',
      isCorrect: false,
      status: 'output_mismatch',
      detectedBug: 'unknown',
      educationalInsight: 'Multiplying by total (initially 0) results in 0.',
    };
  }

  // Fallback safe simulation
  return {
    output: '8',
    isCorrect: false,
    status: 'output_mismatch',
    detectedBug: 'unknown',
    educationalInsight:
      'The loop body does not accumulate numbers into `total`. Look at the assignment inside the loop.',
  };
}

/**
 * Evaluates completion and synthesizes canonical evidence.
 */
export function evaluateCodeSubmission(
  state: CodeLabState,
  challenge: CodeChallengeDefinition = INITIAL_PYTHON_ACCUMULATION_CHALLENGE
): {
  isComplete: boolean;
  score: number;
  reason: string;
  evidence: CodeEvidence;
} {
  const lastResult = validateCodeExecution(state.sourceCode, challenge);
  const isComplete = lastResult.isCorrect && state.hasRun;

  const independent = state.hintsUsed === 0 && state.runCount <= 3;
  const score = isComplete ? (independent ? 100 : Math.max(70, 95 - state.hintsUsed * 10)) : 25;

  const evidence: CodeEvidence = {
    runs: state.runCount,
    edits: state.editCount,
    outputAttempts: state.history.length,
    validationAttempts: state.history.length,
    hintsUsed: state.hintsUsed,
    correctionCount: state.history.filter((h) => h.isCorrect).length,
    detectedBug: state.detectedBug || (isComplete ? undefined : 'reassignment'),
    correctionPattern: state.correctionPattern || (isComplete ? 'accumulation_operator' : undefined),
    independentCompletion: independent,
    finalSuccess: isComplete,
  };

  const reason = isComplete
    ? 'Accumulation bug diagnosed and resolved: code correctly produces 20 through running sum.'
    : `Code execution output does not match expected result (${challenge.expectedOutput}).`;

  return {
    isComplete,
    score,
    reason,
    evidence,
  };
}
