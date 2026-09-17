'use client';

/**
 * Universal Teaching Experience Container
 *
 * Drives the progressive 9-stage teaching session flow:
 * INTRODUCE → EXPLORE → PREDICT → EXPERIMENT → OBSERVE → EXPLAIN → CHALLENGE → ASSESS → COMPLETE
 *
 * Integrates:
 * - Declarative 3D Scene Visualizer
 * - Real-time Parameter Sliders & Toggles
 * - Prediction Hypothesis Validator
 * - Xira Live Observation Advisor
 * - Canonical Learner Model & Adaptive Loop
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  TeachingExperiencePlan,
  UniversalTeachingSessionState,
  TeachingStep,
} from '@/lib/experience/universalTopicTypes';
import { SceneObjectDefinition } from '@/lib/experience/scene/sceneDefinition';
import { UniversalSceneVisualizer3D } from './3d/UniversalSceneVisualizer3D';
import { UniversalFallbackVisualizer } from './UniversalFallbackVisualizer';
import { VisualTeachingModeContainer } from './visualTeaching/VisualTeachingModeContainer';
import { TelemetryEmitter } from '@/lib/experience/telemetry/telemetryEmitter';
import { LearnerModelAdapter } from '@/lib/experience/learnerModel/learnerModelAdapter';
import { defaultXiraExperienceAdvisor } from '@/lib/experience/xira/xiraExperienceAdvisor';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Compass,
  Zap,
  Sliders,
  Play,
  Award,
  ChevronRight,
  Activity,
  Layers,
  BookOpen,
  ExternalLink,
  ShieldCheck,
  Scale,
  X,
} from 'lucide-react';

interface UniversalTeachingContainerProps {
  plan: TeachingExperiencePlan;
  onComplete?: (sessionState: UniversalTeachingSessionState) => void;
  className?: string;
}

export const UniversalTeachingContainer: React.FC<UniversalTeachingContainerProps> = ({
  plan,
  onComplete,
  className = '',
}) => {
  const router = useRouter();

  // 1. Session State
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [parameterValues, setParameterValues] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    plan.interactions.forEach((inter) => {
      initial[inter.parameterName] = inter.defaultValue;
    });
    return initial;
  });

  const [selectedObjectId, setSelectedObjectId] = useState<string | undefined>(undefined);
  const [selectedPredictionOption, setSelectedPredictionOption] = useState<string | null>(null);
  const [isPredictionSubmitted, setIsPredictionSubmitted] = useState(false);
  const [selectedChallengeOption, setSelectedChallengeOption] = useState<string | null>(null);
  const [isChallengeSubmitted, setIsChallengeSubmitted] = useState(false);
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);
  const [interactionCount, setInteractionCount] = useState(0);
  const [sessionStartTime] = useState(Date.now());
  const [xiraMessage, setXiraMessage] = useState<string>(
    `Welcome! Today we are learning by doing: ${plan.topic.rawUserTopic}. Follow each step to master the principle.`
  );
  const [viewMode, setViewMode] = useState<'visual_mode' | 'deep_lab'>(
    plan.visualTeachingPlan ? 'visual_mode' : 'deep_lab'
  );

  const sources = useMemo(() => {
    return plan.sources || plan.topic.sources || [];
  }, [plan.sources, plan.topic.sources]);

  const currentStep: TeachingStep = useMemo(() => {
    return plan.teachingSteps[currentStepIndex] || plan.teachingSteps[0];
  }, [plan.teachingSteps, currentStepIndex]);

  // Telemetry instance
  const telemetry = useMemo(() => {
    return new TelemetryEmitter(plan.planId, plan.topic.topicId, plan.topic.rawUserTopic);
  }, [plan.planId, plan.topic.topicId, plan.topic.rawUserTopic]);

  // Telemetry: Start
  useEffect(() => {
    telemetry.emit('experience_started', {
      topicId: plan.topic.topicId,
      experienceType: plan.experienceType,
      difficulty: plan.topic.difficulty,
    });
  }, [telemetry, plan.topic.topicId, plan.experienceType, plan.topic.difficulty]);

  // Stage Guidance synchronization
  useEffect(() => {
    const stepGuidance = defaultXiraExperienceAdvisor.generateUniversalTeachingStageGuidance(
      currentStep.type,
      plan.topic.rawUserTopic,
      {
        sourceTitle: sources[0]?.title,
      }
    );
    setXiraMessage(stepGuidance || currentStep.instruction);
  }, [currentStepIndex, currentStep, plan.topic.rawUserTopic, sources]);

  // Parameter change handler
  const handleParameterChange = useCallback(
    (name: string, value: any) => {
      setParameterValues((prev) => ({ ...prev, [name]: value }));
      setInteractionCount((prev) => prev + 1);

      telemetry.emit('control_changed', {
        controlId: name,
        value,
        step: currentStep.type,
      });

      // Contextual Xira observation
      if (plan.topic.topicId === 'newtons_laws_motion' || plan.planId.includes('newton')) {
        if (name === 'appliedForce') {
          const mass = parameterValues.cartMass || 5;
          const a = Number(value) / Number(mass);
          setXiraMessage(`Applied Force set to ${value} N. Resulting acceleration is ${a.toFixed(1)} m/s² (F = ma).`);
        } else if (name === 'cartMass') {
          const f = parameterValues.appliedForce || 20;
          const a = Number(f) / Number(value);
          setXiraMessage(`Mass increased to ${value} kg. More inertia means less acceleration: ${a.toFixed(1)} m/s².`);
        }
      } else if (plan.topic.topicId === 'photosynthesis_chloroplast' || plan.planId.includes('photo')) {
        if (name === 'lightIntensity') {
          setXiraMessage(`Light intensity at ${value}%. Notice how photon influx drives photolysis and ATP generation.`);
        }
      } else if (plan.topic.topicId === 'electric_circuits_ohms_law' || plan.planId.includes('circuit')) {
        if (name === 'resistance') {
          const v = parameterValues.voltage || 12;
          const i = Number(v) / Number(value);
          setXiraMessage(`Resistance set to ${value} Ω. Current decreases to ${i.toFixed(2)} A by Ohm's Law.`);
        }
      } else if (plan.topic.topicId === 'electric_motor' || plan.planId.includes('motor')) {
        if (name === 'armatureCurrent') {
          const b = parameterValues.magneticFieldStrength || 1.0;
          const torque = (Number(value) * Number(b) * 0.17).toFixed(2);
          setXiraMessage(`Armature current set to ${value} A. Lorentz torque couple increases to ${torque} N·m (τ = 2·I·L·B·r).`);
        } else if (name === 'magneticFieldStrength') {
          const i = parameterValues.armatureCurrent || 5.0;
          const torque = (Number(value) * Number(i) * 0.17).toFixed(2);
          setXiraMessage(`Magnetic field strength set to ${value} T. Higher flux density increases generated torque: ${torque} N·m.`);
        } else if (name === 'commutatorEnabled') {
          if (!value) {
            setXiraMessage(`Commutator disabled! The coil stalls perpendicular to the field because current direction fails to reverse.`);
          } else {
            setXiraMessage(`Split-ring commutator enabled! Current reverses every 180° so torque remains unidirectional.`);
          }
        }
      }
    },
    [telemetry, currentStep.type, plan.topic.topicId, plan.planId, parameterValues]
  );

  // Object selection in 3D scene
  const handleSelectObject = useCallback(
    (obj: SceneObjectDefinition) => {
      setSelectedObjectId(obj.id);
      telemetry.emit('object_selected', {
        objectId: obj.id,
        name: obj.name,
      });
      setXiraMessage(`Inspecting: ${obj.educationalLabel || obj.name}. ${obj.educationalDescription || obj.semanticMeaning}`);
    },
    [telemetry]
  );

  // Submit Prediction
  const handleSubmitPrediction = () => {
    if (!selectedPredictionOption || !plan.predictionChallenge) return;
    setIsPredictionSubmitted(true);

    const chosen = plan.predictionChallenge.options.find((o) => o.id === selectedPredictionOption);
    const isCorrect = Boolean(chosen?.isCorrect);

    telemetry.emit('prediction_submitted', {
      optionId: selectedPredictionOption,
      isCorrect,
    });

    if (isCorrect) {
      setXiraMessage(`Spot on prediction! ${plan.predictionChallenge.explanation}`);
    } else {
      setXiraMessage(`Interesting hypothesis! Let's experiment to verify: ${plan.predictionChallenge.explanation}`);
    }
  };

  // Submit Challenge Answer
  const handleSubmitChallenge = () => {
    if (!selectedChallengeOption) return;
    setIsChallengeSubmitted(true);

    const chosen = plan.fallbackPlan.interactiveCheck.options.find((o) => o.id === selectedChallengeOption);
    const isCorrect = Boolean(chosen?.isCorrect);

    telemetry.emit('challenge_answered', {
      optionId: selectedChallengeOption,
      isCorrect,
    });

    if (isCorrect) {
      setXiraMessage(`Brilliant work! ${chosen?.explanation || 'Target concept mastered!'}`);
    } else {
      setXiraMessage(`Review required: ${chosen?.explanation || 'Check the fundamental relationship.'}`);
    }
  };

  // Complete Session & Update Learner Model
  const handleCompleteSession = () => {
    const timeSpent = Math.round((Date.now() - sessionStartTime) / 1000);
    const isSuccess = isChallengeSubmitted
      ? Boolean(plan.fallbackPlan.interactiveCheck.options.find((o) => o.id === selectedChallengeOption)?.isCorrect)
      : true;

    telemetry.emit('experience_completed', {
      completed: true,
      timeSpentSeconds: timeSpent,
      interactionCount,
    });

    // Authoritative update to canonical store & BKT theta
    LearnerModelAdapter.recordExperienceOutcome({
      conceptId: plan.topic.conceptIds[0] || plan.topic.topicId,
      conceptName: plan.topic.rawUserTopic,
      isSuccess,
      accuracy: isSuccess ? 1.0 : 0.5,
      trialsCount: Math.max(1, interactionCount),
      confidence: isSuccess ? 'known' : 'unsure',
      timeSpentSeconds: timeSpent,
      timestamp: Date.now(),
    });

    const finalState: UniversalTeachingSessionState = {
      sessionId: plan.planId,
      plan,
      currentStepIndex,
      currentStep,
      interactionCount,
      parameterValues,
      selectedObjectId,
      predictionSubmitted: isPredictionSubmitted && selectedPredictionOption
        ? {
            optionId: selectedPredictionOption,
            isCorrect: Boolean(plan.predictionChallenge?.options.find((o) => o.id === selectedPredictionOption)?.isCorrect),
            explanation: plan.predictionChallenge?.explanation || '',
          }
        : undefined,
      observedOutcomes: [],
      xiraObservations: [],
      isCompleted: true,
      score: isSuccess ? 100 : 60,
      timeSpentSeconds: timeSpent,
    };

    if (onComplete) {
      onComplete(finalState);
    } else {
      router.push('/session-summary');
    }
  };

  const nextStep = () => {
    if (currentStepIndex < plan.teachingSteps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleCompleteSession();
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  if (viewMode === 'visual_mode' && plan.visualTeachingPlan) {
    return (
      <div className={`w-full max-w-6xl mx-auto flex flex-col gap-4 ${className}`}>
        <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-slate-950/60 border border-white/5 text-xs">
          <span className="text-slate-400 font-mono">
            Teaching Strategy: <strong className="text-cyan-400 font-semibold">Visual Teaching Mode Engine v1</strong> (~30s to 2min)
          </span>
          {plan.sceneDefinition && (
            <button
              onClick={() => setViewMode('deep_lab')}
              className="text-cyan-400 hover:text-cyan-300 font-mono text-[11px] underline underline-offset-2 transition-colors"
            >
              Switch to 9-Stage Deep 3D Lab →
            </button>
          )}
        </div>
        <VisualTeachingModeContainer
          plan={plan.visualTeachingPlan}
          sceneDefinition={plan.sceneDefinition}
          onCompleteSession={handleCompleteSession}
        />
      </div>
    );
  }

  return (
    <div className={`w-full max-w-6xl mx-auto flex flex-col gap-6 ${className}`}>
      {/* Visual Mode Quick Return Banner */}
      {plan.visualTeachingPlan && (
        <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-slate-950/60 border border-white/5 text-xs">
          <span className="text-slate-400 font-mono">
            Current View: <strong className="text-amber-400 font-semibold">9-Stage Deep 3D Laboratory</strong>
          </span>
          <button
            onClick={() => setViewMode('visual_mode')}
            className="text-cyan-400 hover:text-cyan-300 font-mono text-[11px] underline underline-offset-2 transition-colors"
          >
            ← Return to Fast Visual Teaching Mode
          </button>
        </div>
      )}
      {/* 1. Header Progress Bar & Step Tracker */}
      <div className="flex flex-col gap-2 bg-slate-950/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-xs font-semibold">
              STEP {currentStepIndex + 1} OF {plan.teachingSteps.length}
            </span>
            <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
              {currentStep.title}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {sources.length > 0 && (
              <button
                onClick={() => setIsSourcesOpen(!isSourcesOpen)}
                className="px-3 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 transition-colors text-xs font-mono flex items-center gap-1.5 shadow-sm"
                title="View Verified Educational Sources"
              >
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Sources</span> ({sources.length})
              </button>
            )}
            <button
              onClick={prevStep}
              disabled={currentStepIndex === 0}
              className="px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors text-xs font-mono flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              onClick={nextStep}
              className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1 shadow-lg shadow-cyan-500/20 transition-colors"
            >
              {currentStepIndex === plan.teachingSteps.length - 1 ? 'Finish' : 'Next Step'}{' '}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300 rounded-full"
            style={{ width: `${((currentStepIndex + 1) / plan.teachingSteps.length) * 100}%` }}
          />
        </div>

        {/* Step Instruction */}
        <p className="text-sm text-slate-300 mt-1 leading-relaxed">
          {currentStep.instruction}
        </p>
      </div>

      {/* 2. Main Teaching Workspace: 3D Scene / Diagram + Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: The Visual Laboratory */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {plan.sceneDefinition ? (
            <UniversalSceneVisualizer3D
              sceneDefinition={plan.sceneDefinition}
              parameterValues={parameterValues}
              selectedObjectId={selectedObjectId}
              onSelectObject={handleSelectObject}
            />
          ) : (
            <UniversalFallbackVisualizer
              fallbackPlan={plan.fallbackPlan}
              parameterValues={parameterValues}
              onParameterChange={handleParameterChange}
            />
          )}

          {/* Interactive Controls Strip */}
          {plan.interactions.length > 0 && (
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-white/10 shadow-xl flex flex-col gap-4">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                <Sliders className="w-4 h-4" />
                <span>Experimental Variables</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {plan.interactions.map((inter) => (
                  <div key={inter.id} className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-900/60 border border-white/5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">{inter.label}</span>
                      <span className="font-mono text-cyan-400 font-bold">
                        {parameterValues[inter.parameterName] ?? inter.defaultValue} {inter.unit || ''}
                      </span>
                    </div>

                    {inter.widgetType === 'slider' && (
                      <input
                        type="range"
                        min={inter.min ?? 0}
                        max={inter.max ?? 100}
                        step={inter.step ?? 1}
                        value={parameterValues[inter.parameterName] ?? inter.defaultValue}
                        onChange={(e) => handleParameterChange(inter.parameterName, Number(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                      />
                    )}

                    {inter.widgetType === 'toggle' && (
                      <button
                        onClick={() =>
                          handleParameterChange(
                            inter.parameterName,
                            !(parameterValues[inter.parameterName] ?? inter.defaultValue)
                          )
                        }
                        className={`mt-1 py-1.5 px-3 rounded-lg text-xs font-mono font-bold transition-colors ${
                          parameterValues[inter.parameterName] ?? inter.defaultValue
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        }`}
                      >
                        {parameterValues[inter.parameterName] ?? inter.defaultValue ? 'STATE: CLOSED (ACTIVE)' : 'STATE: OPEN (INACTIVE)'}
                      </button>
                    )}

                    {inter.widgetType === 'select' && inter.options && (
                      <select
                        value={parameterValues[inter.parameterName] ?? inter.defaultValue}
                        onChange={(e) => handleParameterChange(inter.parameterName, e.target.value)}
                        className="mt-1 bg-slate-800 border border-white/10 rounded-lg text-xs text-slate-200 p-1.5 font-mono focus:outline-none focus:border-cyan-500"
                      >
                        {inter.options.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}

                    <span className="text-[11px] text-slate-400 leading-tight mt-1">
                      {inter.educationalImpact}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Xira Observation & Pedagogical Challenges */}
        <div className="flex flex-col gap-4">
          {/* Xira Pedagogical Companion Box */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-cyan-950/40 to-slate-950/80 border border-cyan-500/30 shadow-xl flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
                Xira Educational Advisor
              </span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-sans">
              {xiraMessage}
            </p>
            {sources.length > 0 && (
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 font-mono text-[10px] text-cyan-400/90 truncate max-w-[180px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">
                    Basis: {sources[0].publisher || sources[0].title}
                  </span>
                </span>
                <button
                  onClick={() => setIsSourcesOpen(true)}
                  className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 underline underline-offset-2 shrink-0"
                >
                  View sources
                </button>
              </div>
            )}
          </div>

          {/* Current Step Challenge / Prediction Card */}
          {currentStep.type === 'PREDICT' && plan.predictionChallenge && (
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-amber-500/30 shadow-xl flex flex-col gap-4">
              <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">
                <HelpCircle className="w-4 h-4" />
                <span>Prediction Hypothesis</span>
              </div>
              <p className="text-sm font-semibold text-white leading-relaxed">
                {plan.predictionChallenge.prompt}
              </p>

              <div className="flex flex-col gap-2">
                {plan.predictionChallenge.options.map((opt) => (
                  <button
                    key={opt.id}
                    disabled={isPredictionSubmitted}
                    onClick={() => setSelectedPredictionOption(opt.id)}
                    className={`p-3 rounded-xl border text-left text-xs transition-all ${
                      selectedPredictionOption === opt.id
                        ? 'border-cyan-400 bg-cyan-500/10 text-white font-semibold'
                        : 'border-white/10 bg-slate-900/60 text-slate-300 hover:border-white/20'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {!isPredictionSubmitted ? (
                <button
                  onClick={handleSubmitPrediction}
                  disabled={!selectedPredictionOption}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:pointer-events-none text-slate-950 font-bold text-xs font-mono transition-colors shadow-lg"
                >
                  Verify Hypothesis
                </button>
              ) : (
                <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-slate-300 leading-relaxed">
                  {plan.predictionChallenge.explanation}
                </div>
              )}
            </div>
          )}

          {/* Practice Challenge Card */}
          {currentStep.type === 'CHALLENGE' && (
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-emerald-500/30 shadow-xl flex flex-col gap-4">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
                <Award className="w-4 h-4" />
                <span>Concept Challenge</span>
              </div>
              <p className="text-sm font-semibold text-white leading-relaxed">
                {plan.fallbackPlan.interactiveCheck.question}
              </p>

              <div className="flex flex-col gap-2">
                {plan.fallbackPlan.interactiveCheck.options.map((opt) => (
                  <button
                    key={opt.id}
                    disabled={isChallengeSubmitted}
                    onClick={() => setSelectedChallengeOption(opt.id)}
                    className={`p-3 rounded-xl border text-left text-xs transition-all ${
                      selectedChallengeOption === opt.id
                        ? 'border-emerald-400 bg-emerald-500/10 text-white font-semibold'
                        : 'border-white/10 bg-slate-900/60 text-slate-300 hover:border-white/20'
                    }`}
                  >
                    {opt.text}
                  </button>
                ))}
              </div>

              {!isChallengeSubmitted ? (
                <button
                  onClick={handleSubmitChallenge}
                  disabled={!selectedChallengeOption}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:pointer-events-none text-slate-950 font-bold text-xs font-mono transition-colors shadow-lg"
                >
                  Submit Answer
                </button>
              ) : (
                <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-slate-300 leading-relaxed">
                  {plan.fallbackPlan.interactiveCheck.options.find((o) => o.id === selectedChallengeOption)?.explanation}
                </div>
              )}
            </div>
          )}

          {/* Final Step Completion Card */}
          {currentStep.type === 'COMPLETE' && (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-950 to-emerald-950/40 border border-emerald-500/40 shadow-2xl flex flex-col gap-4 text-center items-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {plan.topic.rawUserTopic} Mastered!
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Evidence recorded to your verified mastery passport.
                </p>
              </div>
              <div className="w-full p-3 rounded-xl bg-slate-900/80 border border-white/5 flex items-center justify-around text-xs font-mono">
                <div>
                  <span className="text-slate-400 block">Trials</span>
                  <span className="text-white font-bold">{interactionCount}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">XP Earned</span>
                  <span className="text-cyan-400 font-bold">+120 XP</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Mastery Delta</span>
                  <span className="text-emerald-400 font-bold">+15%</span>
                </div>
              </div>
              <button
                onClick={handleCompleteSession}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider transition-colors shadow-lg shadow-emerald-500/20"
              >
                Complete & Return to Command Center
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Learning Sources Drawer / Modal */}
      {isSourcesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl p-6 flex flex-col gap-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Learning Sources & Evidence
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Authoritative, license-aware references grounded for this lesson
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSourcesOpen(false)}
                className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {sources.map((src, idx) => (
                <div
                  key={src.id || idx}
                  className="p-4 rounded-xl bg-slate-950/60 border border-white/10 flex flex-col gap-2.5 hover:border-cyan-500/30 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-sm text-white flex items-center gap-1.5">
                      {src.title}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                      {src.category.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span>
                      Publisher: <strong className="text-slate-200">{src.publisher}</strong>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Scale className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-300">{src.license}</span>
                    </span>
                    <span>•</span>
                    <span>
                      Score: <strong className="text-cyan-400 font-mono">{Math.round(src.authorityScore * 100)}%</strong>
                    </span>
                  </div>

                  {src.licenseDetails?.usageGuideline && (
                    <p className="text-[11px] text-slate-400 italic bg-white/5 p-2 rounded-lg border border-white/5">
                      Attribution: {src.licenseDetails.usageGuideline}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-500 font-mono">
                      Transformation: {src.licenseDetails?.derivativeWorksAllowed ? 'Permitted for simulation' : 'Reference only'}
                    </span>
                    {src.url && src.url.startsWith('http') && (
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        <span>Open Source</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>Verified license compliance • Zero wholesale copying</span>
              <button
                onClick={() => setIsSourcesOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs font-mono transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
