'use client';

/**
 * Xpedition Experience Engine — Programming Code Lab Container
 * Experience #5: "Debug by Doing"
 *
 * Interactive Code Lab for learning programming concepts through active debugging.
 * Supports read -> run -> observe -> edit -> verify -> reflect cycle.
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  INITIAL_PYTHON_ACCUMULATION_CHALLENGE,
  CodeLabState,
  validateCodeExecution,
  evaluateCodeSubmission,
} from '@/lib/experience/domain/codeDebuggingRules';
import {
  CODE_DEBUGGING_EXPERIENCE,
  createCodeExperienceResult,
} from '@/lib/experience/catalog/codeDebuggingConfig';
import {
  ExperienceResult,
  TelemetryEmitter,
  defaultXiraExperienceAdvisor,
  XiraExperienceObservation,
} from '@/lib/experience';
import {
  Play,
  RotateCcw,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  Terminal,
  Code2,
  ArrowRight,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';

interface CodeExperienceContainerProps {
  config?: any;
  onComplete: (result: ExperienceResult) => void;
  backHref?: string;
}

export const CodeExperienceContainer: React.FC<CodeExperienceContainerProps> = ({
  config = CODE_DEBUGGING_EXPERIENCE,
  onComplete,
  backHref = '/home',
}) => {
  const challenge = INITIAL_PYTHON_ACCUMULATION_CHALLENGE;

  // Local state
  const [sourceCode, setSourceCode] = useState<string>(challenge.initialCode);
  const [lastOutput, setLastOutput] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState<boolean>(false);
  const [runCount, setRunCount] = useState<number>(0);
  const [editCount, setEditCount] = useState<number>(0);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [activeHintIndex, setActiveHintIndex] = useState<number>(-1);
  const [consecutiveMismatches, setConsecutiveMismatches] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [lastRunResult, setLastRunResult] = useState<any>(null);
  const [history, setHistory] = useState<
    Array<{ timestamp: number; code: string; output: string; isCorrect: boolean }>
  >([]);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Canonical Telemetry Emitter
  const telemetry = useMemo(
    () => new TelemetryEmitter(config.id || 'programming_code_lab', challenge.conceptId, config.conceptName),
    [config.id, challenge.conceptId, config.conceptName]
  );

  useEffect(() => {
    telemetry.emit('code_experience_started', {
      conceptId: challenge.conceptId,
      language: challenge.language,
      challengeId: challenge.id,
    });
  }, [telemetry, challenge]);

  // Code state object
  const currentState: CodeLabState = useMemo(() => {
    const isAccumulation = /total\s*(\+=|=.*total.*\+)/.test(sourceCode);
    return {
      sourceCode,
      lastOutput: lastOutput ?? undefined,
      runCount,
      editCount,
      hasRun,
      isCompleted: lastRunResult?.isCorrect ?? false,
      hintsUsed,
      consecutiveMismatches,
      detectedBug: lastRunResult?.detectedBug,
      correctionPattern: isAccumulation ? 'accumulation_operator' : undefined,
      independentCompletion: hintsUsed === 0 && runCount <= 3,
      history,
    };
  }, [sourceCode, lastOutput, runCount, editCount, hasRun, lastRunResult, hintsUsed, consecutiveMismatches, history]);

  // Xira guidance synthesis
  const xiraObservation: XiraExperienceObservation = useMemo(() => {
    const isCorrect = lastRunResult?.isCorrect ?? false;
    let detectedPrinciple: any = 'exploring';
    if (isCorrect) detectedPrinciple = 'code_debugged_successfully';
    else if (lastRunResult?.detectedBug === 'reassignment') detectedPrinciple = 'reassignment_bug_detected';
    else if (consecutiveMismatches >= 2) detectedPrinciple = 'repeated_assignment_pattern';
    else if (hasRun) detectedPrinciple = 'code_output_mismatch';

    return {
      experienceId: config.id,
      conceptId: challenge.conceptId,
      conceptName: config.conceptName,
      totalAttempts: 1,
      successfulAttempts: isCorrect ? 1 : 0,
      totalTrials: runCount,
      successfulTrials: isCorrect ? 1 : 0,
      totalInteractions: editCount + runCount + hintsUsed,
      hasSucceeded: isCorrect,
      predictionAccuracy: isCorrect ? 1.0 : 0.0,
      trials: [],
      angleHistory: [],
      velocityHistory: [],
      errorHistory: [],
      hintsRequested: hintsUsed,
      patternSummary: isCorrect ? 'Accumulation bug fixed' : 'Debugging loop output mismatch',
      detectedPrinciple,
    };
  }, [config, challenge, lastRunResult, consecutiveMismatches, hasRun, runCount, editCount, hintsUsed]);

  const xiraFeedback = useMemo(() => {
    return defaultXiraExperienceAdvisor.generateCodeFeedback(xiraObservation, {
      hasRun,
      output: lastOutput ?? undefined,
      expectedOutput: challenge.expectedOutput,
      isSuccess: lastRunResult?.isCorrect ?? false,
      consecutiveMismatches,
      detectedBug: lastRunResult?.detectedBug,
      correctionPattern: currentState.correctionPattern,
      hintsUsed,
    });
  }, [xiraObservation, hasRun, lastOutput, challenge.expectedOutput, lastRunResult, consecutiveMismatches, currentState.correctionPattern, hintsUsed]);

  // Handlers
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSourceCode(e.target.value);
    setEditCount((prev) => prev + 1);
    telemetry.emit('code_edited', { editLength: e.target.value.length });
  };

  const handleRunCode = useCallback(() => {
    setIsRunning(true);
    setHasRun(true);
    const newRunCount = runCount + 1;
    setRunCount(newRunCount);

    const result = validateCodeExecution(sourceCode, challenge);
    setLastOutput(result.output);
    setLastRunResult(result);

    const newHistory = [
      ...history,
      {
        timestamp: Date.now(),
        code: sourceCode,
        output: result.output,
        isCorrect: result.isCorrect,
      },
    ];
    setHistory(newHistory);

    if (result.isCorrect) {
      setConsecutiveMismatches(0);
      telemetry.emit('code_validation_passed', {
        output: result.output,
        expectedOutput: challenge.expectedOutput,
        runs: newRunCount,
      });
    } else {
      setConsecutiveMismatches((prev) => prev + 1);
      telemetry.emit('code_validation_failed', {
        output: result.output,
        expectedOutput: challenge.expectedOutput,
        detectedBug: result.detectedBug,
      });
    }

    telemetry.emit('code_run', {
      output: result.output,
      isCorrect: result.isCorrect,
      runCount: newRunCount,
    });

    telemetry.emit('output_observed', {
      output: result.output,
      expected: challenge.expectedOutput,
      matches: result.isCorrect,
    });

    setTimeout(() => setIsRunning(false), 200);
  }, [runCount, sourceCode, challenge, history, telemetry]);

  const handleResetCode = () => {
    setSourceCode(challenge.initialCode);
    setLastOutput(null);
    setHasRun(false);
    setLastRunResult(null);
    setConsecutiveMismatches(0);
    telemetry.emit('code_reset', { challengeId: challenge.id });
  };

  const handleRequestHint = () => {
    const nextIndex = Math.min(challenge.hints.length - 1, activeHintIndex + 1);
    setActiveHintIndex(nextIndex);
    const newHintsCount = Math.max(hintsUsed, nextIndex + 1);
    setHintsUsed(newHintsCount);
    telemetry.emit('hint_requested', { hintIndex: nextIndex, hintText: challenge.hints[nextIndex] });
  };

  const handleSubmit = () => {
    if (!lastRunResult?.isCorrect) return;

    const timeSpentSeconds = Math.max(5, Math.round((Date.now() - startTimeRef.current) / 1000));
    telemetry.emit('code_submitted', {
      sourceCode,
      runs: runCount,
      hintsUsed,
      timeSpentSeconds,
    });
    telemetry.emit('code_experience_completed', {
      isSuccess: true,
      timeSpentSeconds,
    });

    const result = createCodeExperienceResult(config, xiraObservation, currentState, timeSpentSeconds);
    onComplete(result);
  };

  // Keyboard shortcut Ctrl+Enter to Run
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRunCode();
    }
    // Tab key support in code textarea
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = sourceCode.substring(0, start) + '    ' + sourceCode.substring(end);
      setSourceCode(newValue);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
      }, 0);
    }
  };

  const codeLines = useMemo(() => sourceCode.split('\n'), [sourceCode]);

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto w-full space-y-4 font-sans select-none text-slate-100 pb-8">
      {/* 1. Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-4 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg">
        <div className="flex items-center gap-3">
          <Link
            href={backHref}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all text-xs font-mono flex items-center gap-1.5"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Code2 className="w-5 h-5 text-sky-400" />
                <span>Programming Code Lab</span>
              </h1>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40">
                Python 3.x
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">{challenge.objective}</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-white/5">
            Runs: <strong className="text-white">{runCount}</strong>
          </span>
          <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-white/5">
            Edits: <strong className="text-white">{editCount}</strong>
          </span>
        </div>
      </div>

      {/* 2. Main Lab Layout (Editor + Terminal) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Code Editor Panel */}
        <div className="lg:col-span-7 flex flex-col bg-slate-950 rounded-2xl border border-white/10 shadow-2xl overflow-hidden min-h-[380px]">
          {/* Editor Tab Bar */}
          <div className="h-10 px-4 bg-slate-900 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
              <span className="ml-2 text-xs font-mono text-slate-300 font-medium">accumulate_sum.py</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Ctrl+Enter to Run</span>
          </div>

          {/* Line Numbers + Textarea Container */}
          <div className="flex flex-1 relative font-mono text-xs sm:text-sm leading-relaxed p-2 bg-[#0B0F19]">
            {/* Line numbers gutter */}
            <div className="w-9 select-none text-slate-600 text-right pr-3 pt-2 font-mono text-xs border-r border-white/5 shrink-0">
              {codeLines.map((_, i) => (
                <div key={i} className="leading-6">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Editable code textarea */}
            <textarea
              ref={textareaRef}
              value={sourceCode}
              onChange={handleCodeChange}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              className="flex-1 w-full bg-transparent text-slate-200 resize-none outline-none font-mono text-xs sm:text-sm leading-6 pl-3 pt-2 focus:ring-0 select-text overflow-y-auto"
              rows={Math.max(8, codeLines.length)}
              aria-label="Python code editor"
            />
          </div>

          {/* Editor Action Bar */}
          <div className="p-3 bg-slate-900/90 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRunCode}
                disabled={isRunning}
                className="h-10 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-500/20 transition-all cursor-pointer disabled:opacity-50"
                aria-label="Run Python code"
              >
                <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? 'animate-spin' : ''}`} />
                <span>{isRunning ? 'Running...' : 'Run Code'}</span>
              </button>

              <button
                type="button"
                onClick={handleResetCode}
                className="h-10 px-3 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-slate-400 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-all border border-white/5 cursor-pointer"
                aria-label="Reset challenge code"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRequestHint}
                disabled={hintsUsed >= challenge.hints.length}
                className="h-10 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                aria-label="Request hint from Xira"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>
                  Hint {hintsUsed > 0 ? `(${hintsUsed}/${challenge.hints.length})` : ''}
                </span>
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!lastRunResult?.isCorrect}
                className={`h-10 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  lastRunResult?.isCorrect
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 animate-pulse'
                    : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
                }`}
                aria-label="Submit verified solution"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Submit</span>
              </button>
            </div>
          </div>
        </div>

        {/* Output & Xira Observation Panel */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          {/* Terminal Panel */}
          <div className="bg-slate-950 rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col flex-1 min-h-[220px]">
            {/* Terminal Header */}
            <div className="h-10 px-4 bg-slate-900 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Output Console</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="text-slate-400">Target:</span>
                <span className="px-1.5 py-0.5 rounded bg-white/5 text-emerald-400 font-bold">
                  {challenge.expectedOutput}
                </span>
              </div>
            </div>

            {/* Terminal Output Area */}
            <div className="p-4 flex-1 font-mono text-xs leading-relaxed flex flex-col justify-between space-y-3 bg-[#080B12]">
              <div>
                <span className="text-slate-500">$ python3 accumulate_sum.py</span>
                {lastOutput !== null ? (
                  <div className="mt-2 text-sm">
                    <span className="text-slate-500 select-none mr-2">&gt;</span>
                    <span
                      className={`font-bold ${
                        lastRunResult?.isCorrect ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {lastOutput}
                    </span>
                  </div>
                ) : (
                  <p className="mt-2 text-slate-500 italic">No output yet. Click &quot;Run Code&quot; above.</p>
                )}
              </div>

              {/* Status Comparison Banner */}
              {lastOutput !== null && (
                <div
                  className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                    lastRunResult?.isCorrect
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {lastRunResult?.isCorrect ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold">
                      {lastRunResult?.isCorrect
                        ? 'Expected Output Reached (20)'
                        : `Output Mismatch (Got ${lastOutput}, Expected 20)`}
                    </div>
                    <p className="text-[11px] opacity-90 mt-0.5">
                      {lastRunResult?.educationalInsight}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Progressive Hint Box */}
          {activeHintIndex >= 0 && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5 animate-fadeIn">
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-amber-400 block">
                  Hint {activeHintIndex + 1} of {challenge.hints.length}
                </span>
                <p className="mt-0.5 leading-relaxed">{challenge.hints[activeHintIndex]}</p>
              </div>
            </div>
          )}

          {/* Xira Pedagogical Companion Box */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 shadow-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-purple-300">
                  Xira Debugging Guide
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                {xiraFeedback.tone}
              </span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              {xiraFeedback.observation}
            </p>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-[11px] text-slate-400">
              <strong className="text-slate-300">Pedagogical Insight: </strong>
              {xiraFeedback.pedagogicalInsight}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
