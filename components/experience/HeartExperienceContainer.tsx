'use client';

/**
 * 3D Human Heart Anatomy Explorer Container
 *
 * Coordinates the interactive learning experience for Experience #4:
 * 1. 3D Anatomical Scene with raycasting selection and pulsation
 * 2. Structure Inspection card with clinical and physiological insights
 * 3. 12-step unidirectional Blood Flow Mode
 * 4. Contextual Challenge Lab
 * 5. Full telemetry emission and ExperienceResult synthesis via ExperienceOrchestrator
 */

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  HeartAnatomyScene3D,
} from './3d/HeartAnatomyScene3D';
import {
  HEART_STRUCTURES,
  HEART_CHALLENGES,
  HEART_ANATOMY_EXPERIENCE,
  createHeartExperienceResult,
} from '@/lib/experience/catalog/heartAnatomyConfig';
import {
  HeartStructureDefinition,
  CANONICAL_BLOOD_FLOW_PATH,
  validateFlowStep,
  validateChallengeAnswer,
  evaluateHeartAnatomyCompletion,
  HeartAnatomyState,
} from '@/lib/experience/domain/heartAnatomyRules';
import {
  ExperienceOrchestrator,
  HEART_ANATOMY_DEFINITION,
  ExperienceResult,
  defaultXiraExperienceAdvisor,
} from '@/lib/experience';
import {
  ArrowLeft,
  Activity,
  Award,
  HelpCircle,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Compass,
  ArrowRight,
  Droplet,
} from 'lucide-react';

interface HeartExperienceContainerProps {
  config?: any;
  onComplete: (result: ExperienceResult) => void;
  backHref?: string;
}

export const HeartExperienceContainer: React.FC<HeartExperienceContainerProps> = ({
  onComplete,
  backHref = '/home',
}) => {
  // 1. Orchestrator Instance
  const orchestrator = useMemo(
    () => new ExperienceOrchestrator(HEART_ANATOMY_DEFINITION),
    []
  );

  // 2. Local Interactive State
  const [activeTab, setActiveTab] = useState<'explore' | 'flow' | 'challenge'>('explore');
  const [selectedStructure, setSelectedStructure] = useState<HeartStructureDefinition | null>(
    HEART_STRUCTURES[0]
  );
  const [inspectedStructures, setInspectedStructures] = useState<Set<string>>(
    new Set(['vena_cava'])
  );

  // Blood Flow Mode State
  const [isFlowActive, setIsFlowActive] = useState<boolean>(false);
  const [flowStepIndex, setFlowStepIndex] = useState<number>(0);
  const [flowErrors, setFlowErrors] = useState<number>(0);
  const [flowCompleted, setFlowCompleted] = useState<boolean>(false);

  // Challenge Mode State
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState<number>(0);
  const [selectedChallengeOption, setSelectedChallengeOption] = useState<string | null>(null);
  const [challengeAnswers, setChallengeAnswers] = useState<
    Record<string, { selectedId: string; isCorrect: boolean }>
  >({});
  const [challengeFeedback, setChallengeFeedback] = useState<string | null>(null);

  // Xira Advisor State
  const [activeHint, setActiveHint] = useState<string | null>(null);
  const [advisorMessage, setAdvisorMessage] = useState<{
    text: string;
    insight: string;
    action: string;
  }>({
    text: 'Welcome to the Human Heart Anatomy Explorer.',
    insight: 'Rotate the 3D heart and select any chamber or valve to inspect its function.',
    action: 'Select a structure to explore its physiological role.',
  });

  // Current domain state snapshot
  const currentState: HeartAnatomyState = useMemo(() => {
    const inspected = Array.from(inspectedStructures);
    const evaluation = evaluateHeartAnatomyCompletion({
      currentEulerDeg: [0, 0, 0],
      selectedStructureId: selectedStructure?.id,
      inspectedStructures: inspected,
      flowStepIndex,
      isFlowActive,
      flowErrors,
      flowCompleted,
      currentChallengeIndex,
      challengeAnswers,
      isComplete: false,
    });

    return {
      currentEulerDeg: [0, 0, 0],
      selectedStructureId: selectedStructure?.id,
      inspectedStructures: inspected,
      flowStepIndex,
      isFlowActive,
      flowErrors,
      flowCompleted,
      currentChallengeIndex,
      challengeAnswers,
      isComplete: evaluation.isComplete,
    };
  }, [
    selectedStructure,
    inspectedStructures,
    flowStepIndex,
    isFlowActive,
    flowErrors,
    flowCompleted,
    currentChallengeIndex,
    challengeAnswers,
  ]);

  // Handle Structure Selection from 3D Scene
  const handleSelectStructure = useCallback(
    (structure: HeartStructureDefinition) => {
      setSelectedStructure(structure);
      setInspectedStructures((prev) => new Set([...prev, structure.id]));

      // Record telemetry via orchestrator
      orchestrator.recordEvent('structure_selected', {
        structureId: structure.id,
        category: structure.category,
        bloodType: structure.bloodType,
      });

      // Flow step tracking if in flow mode
      if (isFlowActive) {
        const stepResult = validateFlowStep(structure.id, flowStepIndex);
        if (stepResult.isCorrect) {
          orchestrator.recordEvent('flow_step_completed', {
            stepIndex: flowStepIndex,
            structureId: structure.id,
          });
          setFlowStepIndex(stepResult.nextIndex);
          if (stepResult.isComplete) {
            setFlowCompleted(true);
            orchestrator.recordEvent('flow_started', { success: true });
          }
        } else {
          setFlowErrors((prev) => prev + 1);
          orchestrator.recordEvent('flow_error', {
            stepIndex: flowStepIndex,
            selectedStructureId: structure.id,
            expectedStructureId: stepResult.expectedStructureId,
          });
        }
      }

      // Update Xira Advisor feedback
      const obs = {
        experienceId: HEART_ANATOMY_EXPERIENCE.id,
        conceptId: HEART_ANATOMY_EXPERIENCE.conceptId,
        conceptName: HEART_ANATOMY_EXPERIENCE.conceptName,
        totalAttempts: 1,
        successfulAttempts: 1,
        hasSucceeded: true,
        predictionAccuracy: 1.0,
        trials: [],
        angleHistory: [],
        velocityHistory: [],
        errorHistory: [],
        hintsRequested: 0,
        patternSummary: `Inspected ${structure.name}`,
        detectedPrinciple: 'active_anatomical_inspection' as any,
      };

      const xira = defaultXiraExperienceAdvisor.generateHeartFeedback(obs, {
        exploredCount: inspectedStructures.size + 1,
        isFlowComplete: flowCompleted,
        flowErrors,
        challengesCorrect: Object.values(challengeAnswers).filter((a) => a.isCorrect).length,
      });

      setAdvisorMessage({
        text: xira.observation,
        insight: xira.pedagogicalInsight,
        action: xira.suggestedNextMove,
      });
    },
    [flowStepIndex, isFlowActive, inspectedStructures, flowCompleted, flowErrors, challengeAnswers, orchestrator]
  );

  // Handle Blood Flow Step Next Button
  const handleAdvanceFlowStep = () => {
    if (flowStepIndex < CANONICAL_BLOOD_FLOW_PATH.length) {
      const targetId = CANONICAL_BLOOD_FLOW_PATH[flowStepIndex];
      const matched = HEART_STRUCTURES.find((s) => s.id === targetId);
      if (matched) {
        handleSelectStructure(matched);
      }
    }
  };

  // Handle Challenge Option Selection
  const handleAnswerChallenge = (optionId: string) => {
    setSelectedChallengeOption(optionId);
    const challenge = HEART_CHALLENGES[currentChallengeIndex];
    const result = validateChallengeAnswer(challenge, optionId);

    setChallengeAnswers((prev) => ({
      ...prev,
      [challenge.id]: { selectedId: optionId, isCorrect: result.isCorrect },
    }));

    orchestrator.recordEvent(
      result.isCorrect ? 'challenge_correct' : 'challenge_incorrect',
      {
        challengeId: challenge.id,
        selectedOptionId: optionId,
        targetStructureId: challenge.targetStructureId,
      }
    );

    setChallengeFeedback(result.feedback);

    // Update Xira Advisor
    const isValveMistake =
      (optionId === 'mitral_valve' && challenge.targetStructureId === 'tricuspid_valve') ||
      (optionId === 'tricuspid_valve' && challenge.targetStructureId === 'mitral_valve');

    const xira = defaultXiraExperienceAdvisor.generateHeartFeedback(
      {
        experienceId: HEART_ANATOMY_EXPERIENCE.id,
        conceptId: HEART_ANATOMY_EXPERIENCE.conceptId,
        conceptName: HEART_ANATOMY_EXPERIENCE.conceptName,
        totalAttempts: 1,
        successfulAttempts: result.isCorrect ? 1 : 0,
        hasSucceeded: result.isCorrect,
        predictionAccuracy: 1.0,
        trials: [],
        angleHistory: [],
        velocityHistory: [],
        errorHistory: [],
        hintsRequested: 0,
        patternSummary: 'Challenge answered',
        detectedPrinciple: isValveMistake ? ('repeated_valve_confusion' as any) : ('structure_identified' as any),
      },
      {
        exploredCount: inspectedStructures.size,
        isFlowComplete: flowCompleted,
        flowErrors,
        challengesCorrect: Object.values(challengeAnswers).filter((a) => a.isCorrect).length + (result.isCorrect ? 1 : 0),
        lastMistakePrinciple: isValveMistake ? 'repeated_valve_confusion' : undefined,
      }
    );

    setAdvisorMessage({
      text: xira.observation,
      insight: xira.pedagogicalInsight,
      action: xira.suggestedNextMove,
    });
  };

  // Handle Hint Request
  const handleRequestHint = () => {
    const feedback = orchestrator.requestHint();
    setActiveHint(feedback.message);
  };

  // Handle Reset Experience
  const handleReset = () => {
    orchestrator.reset();
    setInspectedStructures(new Set(['vena_cava']));
    setSelectedStructure(HEART_STRUCTURES[0]);
    setIsFlowActive(false);
    setFlowStepIndex(0);
    setFlowErrors(0);
    setFlowCompleted(false);
    setChallengeAnswers({});
    setSelectedChallengeOption(null);
    setChallengeFeedback(null);
    setActiveHint(null);
  };

  // Handle Completion Commit
  const handleCompleteExperience = () => {
    const observation = {
      experienceId: HEART_ANATOMY_EXPERIENCE.id,
      conceptId: HEART_ANATOMY_EXPERIENCE.conceptId,
      conceptName: HEART_ANATOMY_EXPERIENCE.conceptName,
      totalAttempts: 1,
      successfulAttempts: currentState.isComplete ? 1 : 0,
      hasSucceeded: currentState.isComplete,
      predictionAccuracy: 1.0,
      trials: [],
      angleHistory: [],
      velocityHistory: [],
      errorHistory: [],
      hintsRequested: 0,
      patternSummary: 'Completed heart anatomy lab',
      detectedPrinciple: 'mastered' as const,
    };

    const finalResult = createHeartExperienceResult(
      HEART_ANATOMY_EXPERIENCE,
      observation,
      currentState,
      50
    );

    orchestrator.complete();
    onComplete(finalResult);
  };

  const currentChallenge = HEART_CHALLENGES[currentChallengeIndex];
  const answeredCount = Object.keys(challengeAnswers).length;
  const correctCount = Object.values(challengeAnswers).filter((a) => a.isCorrect).length;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 select-none font-sans pb-8">
      {/* Top Header & Context Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-panel/70 backdrop-blur-xl border border-line/60 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <Link
            href={backHref}
            className="w-9 h-9 rounded-xl bg-white/5 border border-line flex items-center justify-center text-muted hover:text-text hover:bg-white/10 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-sans font-bold text-base sm:text-lg text-text">
                Human Heart Anatomy Explorer
              </h1>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 font-semibold">
                3D ANATOMY
              </span>
            </div>
            <p className="font-sans text-xs text-muted">
              Inspect chambers, valves, and systemic/pulmonary circulation.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleRequestHint}
            className="h-9 px-3 rounded-xl bg-white/5 border border-line/60 text-muted hover:text-text text-xs flex items-center gap-1.5 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Hint</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="h-9 px-3 rounded-xl bg-white/5 border border-line/60 text-muted hover:text-text text-xs flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={handleCompleteExperience}
            className="h-9 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-400 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-rose-950/40 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Complete Lab</span>
          </button>
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex items-center gap-2 p-1 bg-black/40 border border-line/40 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => {
            setActiveTab('explore');
            setIsFlowActive(false);
          }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
            activeTab === 'explore'
              ? 'bg-rose-500 text-white shadow-md'
              : 'text-muted hover:text-text'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Explore & Inspect</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('flow');
            setIsFlowActive(true);
          }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
            activeTab === 'flow'
              ? 'bg-cyan-500 text-white shadow-md'
              : 'text-muted hover:text-text'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Blood Flow Circuit ({flowStepIndex}/12)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('challenge');
            setIsFlowActive(false);
          }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
            activeTab === 'challenge'
              ? 'bg-indigo-500 text-white shadow-md'
              : 'text-muted hover:text-text'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Challenge Lab ({correctCount}/4)</span>
        </button>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left / Center 3D Heart Canvas (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <HeartAnatomyScene3D
            selectedStructureId={selectedStructure?.id}
            onSelectStructure={handleSelectStructure}
            isFlowModeActive={isFlowActive}
            currentFlowStepIndex={flowStepIndex}
          />

          {/* Quick Structure Selector Carousel */}
          <div className="bg-panel/40 border border-line/40 rounded-xl p-2.5 overflow-x-auto">
            <div className="flex items-center gap-1.5 min-w-max">
              {HEART_STRUCTURES.map((s) => {
                const isSelected = selectedStructure?.id === s.id;
                const isInspected = inspectedStructures.has(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectStructure(s)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-sans flex items-center gap-1.5 border transition-all ${
                      isSelected
                        ? 'bg-white/15 border-rose-400 text-white font-semibold'
                        : isInspected
                        ? 'bg-white/5 border-line/50 text-slate-300'
                        : 'bg-transparent border-transparent text-muted hover:text-text'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: s.colorHex }}
                    />
                    <span>{s.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Info & Interaction Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* TAB 1: Explore & Inspect */}
          {activeTab === 'explore' && selectedStructure && (
            <div className="bg-panel/80 border border-line/70 rounded-2xl p-5 space-y-4 shadow-xl text-left">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: selectedStructure.colorHex }}
                    />
                    <h2 className="font-sans font-bold text-base text-text">
                      {selectedStructure.name}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-white/5 border border-line/60 text-muted">
                      {selectedStructure.category}
                    </span>
                    <span
                      className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded border ${
                        selectedStructure.bloodType === 'oxygenated'
                          ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                          : 'bg-blue-500/15 border-blue-500/30 text-blue-300'
                      }`}
                    >
                      {selectedStructure.bloodType} blood
                    </span>
                  </div>
                </div>

                <span className="font-mono text-[11px] text-muted">
                  {inspectedStructures.size}/12 explored
                </span>
              </div>

              {/* Function / Description */}
              <div className="space-y-2">
                <h3 className="font-mono text-[11px] uppercase tracking-wider text-muted font-semibold">
                  Function & Anatomy
                </h3>
                <p className="font-sans text-xs text-slate-300 leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-line/30">
                  {selectedStructure.shortDescription}
                </p>
              </div>

              {/* Clinical / Physiological Significance */}
              <div className="space-y-2">
                <h3 className="font-mono text-[11px] uppercase tracking-wider text-cyan-400 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  <span>Clinical Insight</span>
                </h3>
                <p className="font-sans text-xs text-slate-300 leading-relaxed bg-cyan-950/20 p-3 rounded-xl border border-cyan-500/20">
                  {selectedStructure.clinicalSignificance}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Blood Flow Circuit Mode */}
          {activeTab === 'flow' && (
            <div className="bg-panel/80 border border-cyan-500/30 rounded-2xl p-5 space-y-4 shadow-xl text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <h2 className="font-sans font-bold text-sm text-text">
                    Blood Flow Sequence
                  </h2>
                </div>
                <span className="font-mono text-xs text-cyan-300 font-semibold">
                  Step {flowStepIndex + 1} of 12
                </span>
              </div>

              <p className="font-sans text-xs text-slate-300">
                Trace the 12-step path of systemic and pulmonary circulation. Click the structure on the 3D heart or use Step Next.
              </p>

              {/* Current Target in Flow */}
              <div className="p-3.5 bg-cyan-950/30 border border-cyan-500/40 rounded-xl space-y-2">
                <span className="font-mono text-[10px] uppercase text-cyan-400 font-semibold block">
                  CURRENT PATHWAY TARGET
                </span>
                <p className="font-sans font-bold text-sm text-white capitalize">
                  {CANONICAL_BLOOD_FLOW_PATH[flowStepIndex]?.replace(/_/g, ' ') || 'Complete!'}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleAdvanceFlowStep}
                    disabled={flowCompleted}
                    className="w-full h-9 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-ink font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <span>{flowCompleted ? 'Circuit Mastered' : 'Locate & Advance'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Sequence Progress Dots */}
              <div className="flex items-center justify-between gap-1 pt-2">
                {CANONICAL_BLOOD_FLOW_PATH.map((step, idx) => (
                  <div
                    key={step}
                    className={`h-2 flex-1 rounded-full transition-all ${
                      idx < flowStepIndex
                        ? 'bg-cyan-400'
                        : idx === flowStepIndex
                        ? 'bg-cyan-300 animate-pulse ring-2 ring-cyan-500/50'
                        : 'bg-white/10'
                    }`}
                    title={`${idx + 1}. ${step.replace(/_/g, ' ')}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Challenge Lab */}
          {activeTab === 'challenge' && currentChallenge && (
            <div className="bg-panel/80 border border-indigo-500/30 rounded-2xl p-5 space-y-4 shadow-xl text-left">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-indigo-400 font-semibold">
                  CHALLENGE {currentChallengeIndex + 1} OF {HEART_CHALLENGES.length}
                </span>
                <span className="font-mono text-xs text-muted">
                  Score: {correctCount}/{answeredCount}
                </span>
              </div>

              <h2 className="font-sans font-semibold text-sm text-white">
                {currentChallenge.prompt}
              </h2>

              {/* Options */}
              <div className="space-y-2">
                {currentChallenge.options.map((opt) => {
                  const isSelected = selectedChallengeOption === opt.id;
                  const isAnswered = Boolean(challengeAnswers[currentChallenge.id]);
                  const isCorrectOpt = opt.id === currentChallenge.targetStructureId;

                  let btnStyle = 'bg-white/5 border-line/60 text-slate-200 hover:bg-white/10';
                  if (isAnswered) {
                    if (isCorrectOpt) {
                      btnStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold';
                    } else if (isSelected) {
                      btnStyle = 'bg-rose-500/20 border-rose-500 text-rose-300';
                    }
                  }

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => handleAnswerChallenge(opt.id)}
                      className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border text-xs text-left transition-all flex items-center justify-between ${btnStyle}`}
                    >
                      <span>{opt.label}</span>
                      {isAnswered && isCorrectOpt && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Feedback Alert */}
              {challengeFeedback && (
                <div className="p-3 bg-white/5 border border-line/60 rounded-xl text-xs text-slate-300 space-y-2">
                  <p>{challengeFeedback}</p>
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedChallengeOption(null);
                        setChallengeFeedback(null);
                        setCurrentChallengeIndex((prev) =>
                          (prev + 1) % HEART_CHALLENGES.length
                        );
                      }}
                      className="px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-semibold flex items-center gap-1.5"
                    >
                      <span>Next Challenge</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Active Hint Alert */}
          {activeHint && (
            <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-left flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <p className="font-sans text-xs text-cyan-200">{activeHint}</p>
            </div>
          )}

          {/* Xira Pedagogical Companion Box */}
          <div className="bg-gradient-to-br from-[#121626] to-[#0d101d] border border-line/60 rounded-2xl p-4 text-left space-y-2 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <span className="font-mono text-xs uppercase tracking-wider text-cyan-400 font-bold">
                XIRA CARDIAC ADVISOR
              </span>
            </div>

            <p className="font-sans text-xs font-semibold text-white">
              {advisorMessage.text}
            </p>
            <p className="font-sans text-xs text-slate-400 leading-relaxed">
              {advisorMessage.insight}
            </p>
            <div className="pt-1 text-[11px] font-mono text-cyan-300/90 flex items-center gap-1.5">
              <span>Next Move:</span>
              <span className="text-white">{advisorMessage.action}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
