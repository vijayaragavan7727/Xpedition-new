'use client';

/**
 * Xpedition Visual Teaching Mode Engine v1 — Visual Teaching Mode Container
 *
 * Master container that orchestrates canonical visual teaching modes:
 * - FULL_3D (Spatial exploration / Universal 3D scene visualizer)
 * - MOTION_VISUAL (Procedural sequential process player)
 * - INTERACTIVE_VISUAL (1-2 parameter immediate cause-and-effect canvas)
 * - EXPLODED_VISUAL (Separated component inspection and assembly)
 * - TRANSFORMATION_VISUAL (State A -> Transition -> State B)
 * - 2D_FALLBACK (Structured relational concept node network)
 *
 * Implements the canonical concise flow:
 * INTRO -> SHOW -> ONE_INTERACTION -> EXPLAIN -> QUICK_CHECK -> XIRA_FEEDBACK -> NEXT_CONCEPT
 *
 * Features:
 * - Adaptive Representation Switching on learner struggle evidence
 * - Seamless telemetry dispatching
 * - Accessible screen reader descriptions and reduced motion support
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  VisualTeachingPlan,
  TeachingMode,
  RepresentationSwitchOption,
} from '@/lib/experience/visualTeaching/types';
import { UniversalSceneDefinition } from '@/lib/experience/scene/sceneDefinition';
import { UniversalSceneVisualizer3D } from '@/components/experience/3d/UniversalSceneVisualizer3D';
import { MotionVisualPlayer } from './MotionVisualPlayer';
import { InteractiveVisualCanvas } from './InteractiveVisualCanvas';
import { ExplodedVisualView } from './ExplodedVisualView';
import { TransformationVisualView } from './TransformationVisualView';
import { Enhanced2DFallback } from './Enhanced2DFallback';
import { AdaptiveRepresentationSwitcher } from '@/lib/experience/visualTeaching/adaptiveRepresentationSwitcher';
import { TelemetryEmitter } from '@/lib/experience/telemetry/telemetryEmitter';
import {
  Sparkles,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Layers,
  RotateCcw,
  Zap,
  BookOpen,
  Volume2,
  RefreshCw,
  Eye,
  ExternalLink,
  Scale,
  X,
} from 'lucide-react';

interface VisualTeachingModeContainerProps {
  plan: VisualTeachingPlan;
  sceneDefinition?: UniversalSceneDefinition;
  onCompleteSession?: () => void;
  className?: string;
}

export const VisualTeachingModeContainer: React.FC<VisualTeachingModeContainerProps> = ({
  plan,
  sceneDefinition,
  onCompleteSession,
  className = '',
}) => {
  const router = useRouter();

  // Mode state (can dynamically switch representations)
  const [activeMode, setActiveMode] = useState<TeachingMode>(plan.mode);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Evidence tracking for adaptive representation switching
  const [incorrectAttempts, setIncorrectAttempts] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [sessionStartTime] = useState(Date.now());

  // Quick Check state
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isCheckSubmitted, setIsCheckSubmitted] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Alternative representation recommendation
  const [suggestedSwitch, setSuggestedSwitch] = useState<RepresentationSwitchOption | null>(null);

  // Flow stages: 'SHOW' | 'INTERACT' | 'EXPLAIN' | 'QUICK_CHECK' | 'COMPLETED'
  const [flowStage, setFlowStage] = useState<'SHOW' | 'INTERACT' | 'EXPLAIN' | 'QUICK_CHECK' | 'COMPLETED'>('SHOW');

  // In-Experience source attribution modal state
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);

  // Telemetry emitter instance
  const telemetry = useMemo(() => {
    return new TelemetryEmitter(plan.planId, plan.conceptId, plan.title);
  }, [plan.planId, plan.conceptId, plan.title]);

  // Telemetry: Start
  useEffect(() => {
    telemetry.emit('visual_teaching_started', {
      conceptId: plan.conceptId,
      mode: activeMode,
      title: plan.title,
    });
  }, [telemetry, plan.conceptId, activeMode, plan.title]);

  // Handle Quick Check submission
  const handleSubmitQuickCheck = () => {
    if (!selectedOptionId) return;

    const opt = plan.quickCheck.options.find((o) => o.id === selectedOptionId);
    const correct = Boolean(opt?.isCorrect);

    setIsCheckSubmitted(true);
    setIsAnswerCorrect(correct);

    if (correct) {
      telemetry.emit('visual_prediction_correct', { optionId: selectedOptionId, mode: activeMode });
      setFlowStage('COMPLETED');
    } else {
      telemetry.emit('visual_prediction_incorrect', { optionId: selectedOptionId, mode: activeMode });
      const newIncorrect = incorrectAttempts + 1;
      setIncorrectAttempts(newIncorrect);

      // Check if adaptive representation switching should be offered
      const evidence = {
        currentMode: activeMode,
        incorrectPredictionCount: newIncorrect,
        incorrectChallengeCount: 0,
        hintsUsedCount: hintsUsed,
        timeSpentSeconds: Math.round((Date.now() - sessionStartTime) / 1000),
      };

      if (AdaptiveRepresentationSwitcher.shouldOfferAlternativeRepresentation(evidence)) {
        const recommendation = AdaptiveRepresentationSwitcher.getRecommendedAlternative(activeMode, evidence);
        setSuggestedSwitch(recommendation);
      }
    }
  };

  const handleRequestHint = () => {
    setShowHint(true);
    setHintsUsed((prev) => prev + 1);
    telemetry.emit('visual_hint_requested', { mode: activeMode });
  };

  const handleSwitchRepresentation = (targetMode: TeachingMode) => {
    telemetry.emit('visual_mode_switched', { from: activeMode, to: targetMode });
    setActiveMode(targetMode);
    setSuggestedSwitch(null);
    setIsCheckSubmitted(false);
    setSelectedOptionId(null);
  };

  const handleFinish = () => {
    telemetry.emit('visual_teaching_completed', {
      mode: activeMode,
      incorrectAttempts,
      hintsUsed,
      durationSeconds: Math.round((Date.now() - sessionStartTime) / 1000),
    });

    if (onCompleteSession) {
      onCompleteSession();
    } else {
      router.push('/home');
    }
  };

  return (
    <div className={`w-full max-w-6xl flex flex-col gap-6 mx-auto ${className}`}>
      {/* 1. Header with Mode Badge & Accessibility Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950/80 border border-white/10 backdrop-blur-md">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider">
              {activeMode.replace('_', ' ')}
            </span>
            <span className="text-xs font-mono text-slate-400">
              Minimum Interaction • Maximum Understanding
            </span>
          </div>
          <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
            {plan.title}
          </h2>
        </div>

        {/* Accessibility & Mode Quick Controls */}
        <div className="flex items-center gap-2">
          {plan.sourceReferences && plan.sourceReferences.length > 0 && (
            <button
              onClick={() => setIsSourcesOpen(true)}
              className="px-3 py-1.5 rounded-xl border border-cyan-500/30 bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 transition-colors text-xs font-mono flex items-center gap-1.5 shadow-sm"
              title="View Learning Sources"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Sources</span>
              <span>({plan.sourceReferences.length})</span>
            </button>
          )}

          <button
            onClick={() => setPrefersReducedMotion(!prefersReducedMotion)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 ${
              prefersReducedMotion
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-900 text-slate-400 border border-white/10 hover:text-white'
            }`}
            title="Toggle reduced motion for accessibility"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{prefersReducedMotion ? 'Motion: Minimal' : 'Motion: Fluid'}</span>
          </button>
        </div>
      </div>

      {/* 2. Adaptive Representation Recommendation Banner (if learner struggles) */}
      {suggestedSwitch && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 to-slate-900 border border-amber-500/40 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-amber-300 font-mono">
                Alternative Representation Available
              </span>
              <p className="text-xs text-slate-300 leading-snug">
                {suggestedSwitch.reason}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleSwitchRepresentation(suggestedSwitch.targetMode)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono transition-colors shadow-lg shadow-amber-500/20"
          >
            Switch to {suggestedSwitch.targetMode.replace('_', ' ')}
          </button>
        </div>
      )}

      {/* 3. Main Visual Laboratory Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: The Visual Teaching Experience */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {activeMode === 'FULL_3D' && sceneDefinition ? (
            <UniversalSceneVisualizer3D
              sceneDefinition={sceneDefinition}
              parameterValues={{}}
              onSelectObject={() => {}}
            />
          ) : activeMode === 'MOTION_VISUAL' ? (
            <MotionVisualPlayer
              plan={plan}
              prefersReducedMotion={prefersReducedMotion}
              onStageComplete={() => {
                if (flowStage === 'SHOW') setFlowStage('EXPLAIN');
              }}
            />
          ) : activeMode === 'INTERACTIVE_VISUAL' ? (
            <InteractiveVisualCanvas
              plan={plan}
              onParameterChange={(name, val) => {
                telemetry.emit('visual_parameter_changed', { name, val });
                if (flowStage === 'SHOW') setFlowStage('EXPLAIN');
              }}
            />
          ) : activeMode === 'EXPLODED_VISUAL' ? (
            <ExplodedVisualView plan={plan} />
          ) : activeMode === 'TRANSFORMATION_VISUAL' ? (
            <TransformationVisualView plan={plan} />
          ) : (
            <Enhanced2DFallback plan={plan} />
          )}

          {/* Accessible Screen Reader Transcript / Explanation Card */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-slate-300 flex flex-col gap-1">
            <span className="font-mono text-[10px] text-cyan-400 font-bold uppercase">
              Accessible Conceptual Summary
            </span>
            <p className="leading-relaxed font-sans">
              {plan.accessibility.screenReaderSummary}
            </p>
          </div>
        </div>

        {/* Right Col: Xira Pedagogical Companion & Concise Quick Check */}
        <div className="flex flex-col gap-4">
          {/* Xira Insight Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-cyan-950/40 to-slate-950/80 border border-cyan-500/30 shadow-xl flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
                Xira Pedagogical Companion
              </span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-sans">
              {plan.learningObjective}
            </p>
          </div>

          {/* Canonical Concise Quick Check (< 30 seconds) */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-white/10 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                <span>Concept Quick Check</span>
              </div>
              {!showHint && plan.quickCheck.hint && (
                <button
                  onClick={handleRequestHint}
                  className="text-[11px] text-amber-400 hover:text-amber-300 underline underline-offset-2"
                >
                  Need a hint?
                </button>
              )}
            </div>

            <p className="text-sm font-semibold text-white leading-relaxed">
              {plan.quickCheck.prompt}
            </p>

            {/* Hint alert */}
            {showHint && plan.quickCheck.hint && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 leading-relaxed">
                💡 Hint: {plan.quickCheck.hint}
              </div>
            )}

            {/* Options */}
            <div className="flex flex-col gap-2">
              {plan.quickCheck.options.map((opt) => (
                <button
                  key={opt.id}
                  disabled={isCheckSubmitted && isAnswerCorrect}
                  onClick={() => setSelectedOptionId(opt.id)}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    selectedOptionId === opt.id
                      ? 'border-cyan-400 bg-cyan-500/15 text-white font-semibold'
                      : 'border-white/10 bg-slate-900/60 text-slate-300 hover:border-white/20'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Submit / Feedback */}
            {!isCheckSubmitted || !isAnswerCorrect ? (
              <button
                onClick={handleSubmitQuickCheck}
                disabled={!selectedOptionId}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 disabled:pointer-events-none text-slate-950 font-bold text-xs font-mono transition-colors shadow-lg shadow-cyan-500/20"
              >
                Verify Understanding
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-xs text-emerald-300 leading-relaxed flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  {plan.quickCheck.options.find((o) => o.id === selectedOptionId)?.explanation}
                </span>
              </div>
            )}

            {/* Incorrect Feedback Alert */}
            {isCheckSubmitted && !isAnswerCorrect && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 leading-relaxed">
                {plan.quickCheck.options.find((o) => o.id === selectedOptionId)?.explanation || 'Review the visual above and try again.'}
              </div>
            )}
          </div>

          {/* Final Step Completion Card */}
          {flowStage === 'COMPLETED' && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-emerald-950/40 border border-emerald-500/40 shadow-2xl flex flex-col gap-3 text-center items-center animate-in fade-in duration-300">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Concept Mastered!
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visual understanding verified and recorded.
                </p>
              </div>
              <button
                onClick={handleFinish}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider transition-colors shadow-lg shadow-emerald-500/20 mt-1"
              >
                Next Concept Quest →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* In-Experience Learning Sources Modal */}
      {isSourcesOpen && plan.sourceReferences && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-slate-950 border border-cyan-500/30 rounded-2xl p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-cyan-400">
                <BookOpen className="w-5 h-5" />
                <h3 className="text-base font-bold text-white tracking-tight">Verified Learning Sources</h3>
              </div>
              <button
                onClick={() => setIsSourcesOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This interactive visual experience is grounded in verified Open Educational Resources (OER)
              and scientific curricula. We honor open access licenses and academic attribution standards.
            </p>

            <div className="space-y-3">
              {plan.sourceReferences.map((src) => (
                <div
                  key={src.id}
                  className="p-4 rounded-xl bg-slate-900/80 border border-white/10 space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-white text-sm">{src.title}</h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase shrink-0">
                      {src.category.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-slate-400">
                    Publisher: <strong className="text-slate-200">{src.publisher}</strong>
                    {src.author && <span> • {src.author}</span>}
                  </p>

                  <div className="flex items-center gap-3 pt-1 text-[11px]">
                    <div className="flex items-center gap-1 text-slate-300">
                      <Scale className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="font-mono">{src.license}</span>
                    </div>
                    {src.url && (
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-cyan-400 hover:underline font-mono"
                      >
                        <span>Official Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {src.excerpt && (
                    <blockquote className="text-[11px] text-slate-400 italic bg-black/30 p-2.5 rounded-lg border-l-2 border-cyan-400/40">
                      &ldquo;{src.excerpt}&rdquo;
                    </blockquote>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
              <a
                href="/sources"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:underline font-mono text-[11px]"
              >
                View Full Sources & Licensing Directory →
              </a>
              <button
                onClick={() => setIsSourcesOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-colors"
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
