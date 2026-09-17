'use client';

/**
 * Object Experience Container
 *
 * Dedicated container for 3D Object Manipulation experiences.
 * Connects the 3D spatial scene to the single unified Experience Engine telemetry,
 * real-time Xira spatial guidance, and the canonical Learner Model evidence pipeline.
 *
 * Architecture:
 * 3D Scene (Three.js) -> Spatial Math -> TelemetryEmitter -> Xira Advisor -> LearnerModelAdapter -> ExperienceResult
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  ExperienceConfig,
  ExperienceResult,
  XiraExperienceFeedback,
} from '@/lib/experience/types';
import {
  OBJECT_MANIPULATION_EXPERIENCE,
  createSpatialExperienceResult,
} from '@/lib/experience/catalog/objectManipulationConfig';
import {
  calculateAngularDistance,
  analyzeRotationTrajectory,
} from '@/lib/experience/simulation/spatialMath';
import { TelemetryEmitter } from '@/lib/experience/telemetry/telemetryEmitter';
import { defaultXiraExperienceAdvisor } from '@/lib/experience/xira/xiraExperienceAdvisor';
import { LearnerModelAdapter } from '@/lib/experience/learnerModel/learnerModelAdapter';
import { ObjectManipulationScene3D } from './3d/ObjectManipulationScene3D';
import { XiraFeedbackBanner } from './XiraFeedbackBanner';
import { ArrowLeft, Compass, CheckCircle2, Rotate3d, Award, Sparkles } from 'lucide-react';

interface ObjectExperienceContainerProps {
  config?: ExperienceConfig;
  onComplete?: (result: ExperienceResult) => void;
  backHref?: string;
}

export const ObjectExperienceContainer: React.FC<ObjectExperienceContainerProps> = ({
  config = OBJECT_MANIPULATION_EXPERIENCE,
  onComplete,
  backHref = '/home',
}) => {
  const spatialConfig = config.spatial || {
    objectType: 'prism',
    initialEulerDeg: [65, -110, 25],
    targetEulerDeg: [0, 0, 0],
    toleranceDeg: 15.0,
    targetFaceName: 'Emerald Resonant Face',
  };

  const startTimeRef = useRef<number>(Date.now());
  const trajectoryHistoryRef = useRef<Array<[number, number, number]>>([spatialConfig.initialEulerDeg]);

  // Current rotation state
  const [currentEuler, setCurrentEuler] = useState<[number, number, number]>(
    spatialConfig.initialEulerDeg
  );
  const [angularError, setAngularError] = useState<number>(() =>
    calculateAngularDistance(spatialConfig.initialEulerDeg, spatialConfig.targetEulerDeg)
  );

  // Success and lock states
  const [isResonanceLocked, setIsResonanceLocked] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [activeHint, setActiveHint] = useState<string | null>(null);

  // Telemetry emitter instance
  const telemetry = useMemo(
    () => new TelemetryEmitter(config.id, config.conceptId, config.title),
    [config]
  );

  // Xira advisor feedback state
  const [xiraFeedback, setXiraFeedback] = useState<XiraExperienceFeedback>(() =>
    defaultXiraExperienceAdvisor.generateSpatialFeedback(
      telemetry.synthesizeObservation(),
      calculateAngularDistance(spatialConfig.initialEulerDeg, spatialConfig.targetEulerDeg),
      spatialConfig.toleranceDeg
    )
  );

  // Emit experience started on mount
  useEffect(() => {
    telemetry.emit('experience_started', {
      conceptId: config.conceptId,
      experienceType: 'OBJECT_MANIPULATION',
      initialEulerDeg: spatialConfig.initialEulerDeg,
      targetEulerDeg: spatialConfig.targetEulerDeg,
      toleranceDeg: spatialConfig.toleranceDeg,
    });
  }, [config, spatialConfig, telemetry]);

  // Handle live rotation change from Three.js scene
  const handleRotationChange = useCallback(
    (newEuler: [number, number, number], errorDeg: number) => {
      setCurrentEuler(newEuler);
      setAngularError(errorDeg);

      // Add to trajectory history
      trajectoryHistoryRef.current.push(newEuler);

      // Check alignment criteria
      const aligned = errorDeg <= spatialConfig.toleranceDeg;
      setIsResonanceLocked(aligned);

      // Emit rotation telemetry
      telemetry.emit('rotation_changed', {
        eulerDeg: newEuler,
        angularDistanceDeg: errorDeg,
        isAligned: aligned,
      });

      // Analyze trajectory principles (overshoot, fine-tuning, coarse)
      const trajectoryAnalysis = analyzeRotationTrajectory(
        trajectoryHistoryRef.current,
        spatialConfig.targetEulerDeg,
        spatialConfig.toleranceDeg
      );

      // Synthesize observation & update Xira feedback
      const observation = telemetry.synthesizeObservation();
      observation.principlesIdentified = [
        ...new Set([...(observation.principlesIdentified || []), ...trajectoryAnalysis.principles]),
      ];

      const feedback = defaultXiraExperienceAdvisor.generateSpatialFeedback(
        observation,
        errorDeg,
        spatialConfig.toleranceDeg
      );
      setXiraFeedback(feedback);
    },
    [spatialConfig, telemetry]
  );

  // Handle alignment trigger when reticle enters tolerance
  const handleAlignSuccess = useCallback(
    (euler: [number, number, number], error: number) => {
      setIsResonanceLocked(true);
      telemetry.emit('target_checked', {
        eulerDeg: euler,
        angularDistanceDeg: error,
        toleranceDeg: spatialConfig.toleranceDeg,
        success: true,
      });
    },
    [spatialConfig, telemetry]
  );

  // Handle Hint Request
  const handleRequestHint = () => {
    const hints = config.briefing?.hints || config.challenge?.hints || [];
    const randomHint = hints[Math.floor(Math.random() * (hints.length || 1))] || 'Try adjusting one axis at a time.';
    setActiveHint(randomHint);
    telemetry.emit('hint_requested', { hint: randomHint });
  };

  // Complete and commit alignment evidence
  const handleConfirmMastery = () => {
    if (angularError > spatialConfig.toleranceDeg && !isResonanceLocked) return;

    setIsCompleted(true);
    const timeSpentSeconds = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));

    // Emit telemetry
    telemetry.emit('task_completed', {
      finalEulerDeg: currentEuler,
      finalErrorDeg: angularError,
      timeSpentSeconds,
    });

    // Synthesize final observation
    const observation = telemetry.synthesizeObservation();
    const finalResult = createSpatialExperienceResult(
      config,
      observation,
      angularError,
      timeSpentSeconds
    );

    // Commit outcome to Learner Model & Decision Engine
    LearnerModelAdapter.recordExperienceOutcome({
      conceptId: config.conceptId,
      conceptName: config.title,
      isSuccess: true,
      accuracy: Math.max(0.7, 1 - angularError / 180),
      trialsCount: Math.max(1, trajectoryHistoryRef.current.length),
      confidence: angularError < 5 ? 'known' : 'unsure',
      timeSpentSeconds,
      timestamp: Date.now(),
    });

    if (onComplete) {
      onComplete(finalResult);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 font-sans select-none">
      {/* Header & Breadcrumbs */}
      <header className="flex items-center justify-between gap-4 pt-1">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white px-2.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500/50 outline-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Command Center</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-300 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
            <Rotate3d className="w-3 h-3" />
            <span>3D Spatial Engine</span>
          </span>
        </div>
      </header>

      {/* Experience Title & Objective */}
      <section className="space-y-1">
        <h1 className="font-sans font-bold text-2xl sm:text-3xl text-white tracking-tight flex items-center gap-2.5">
          <span>{config.title}</span>
          {isCompleted && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 font-mono text-xs text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Harmonic Lock Mastered</span>
            </span>
          )}
        </h1>
        <p className="font-sans text-xs sm:text-sm text-slate-400">
          {config.briefing?.objective || config.challenge?.objective}
        </p>
      </section>

      {/* Main 3D Object Manipulation Canvas */}
      <section aria-label="3D Spatial Artifact Chamber">
        <ObjectManipulationScene3D
          initialEulerDeg={spatialConfig.initialEulerDeg}
          targetEulerDeg={spatialConfig.targetEulerDeg}
          toleranceDeg={spatialConfig.toleranceDeg}
          onRotationChange={handleRotationChange}
          onAlignSuccess={handleAlignSuccess}
          disabled={isCompleted}
        />
      </section>

      {/* Active Hint Banner */}
      {activeHint && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5 flex items-start gap-2.5 text-xs text-amber-200">
          <Compass className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>{activeHint}</span>
        </div>
      )}

      {/* Real-time Xira Feedback Banner */}
      {xiraFeedback && <XiraFeedbackBanner feedback={xiraFeedback} />}

      {/* Challenge Status and Confirmation Action Panel */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isResonanceLocked
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_15px_#10b981]'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {isResonanceLocked ? <Sparkles className="w-5 h-5" /> : <Rotate3d className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-sm font-semibold text-white flex items-center gap-2">
              <span>{isResonanceLocked ? 'Resonant Orientation Aligned!' : 'Align Emerald Face'}</span>
              <span className="font-mono text-xs text-slate-400">
                ({angularError.toFixed(1)}° / &lt;{spatialConfig.toleranceDeg}°)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {isResonanceLocked
                ? 'The artifact is channeled into harmonic lock. Confirm alignment to record mastery.'
                : 'Rotate the prism so the glowing emerald face faces forward inside the reticle.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {!isCompleted && (
            <button
              onClick={handleRequestHint}
              className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs border border-slate-700 transition flex items-center justify-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Hint</span>
            </button>
          )}

          <button
            onClick={handleConfirmMastery}
            disabled={!isResonanceLocked || isCompleted}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition shadow-lg ${
              isCompleted
                ? 'bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 cursor-default'
                : isResonanceLocked
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/25 border border-emerald-400/50 cursor-pointer animate-pulse'
                : 'bg-slate-800/80 text-slate-500 border border-slate-700/50 cursor-not-allowed'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>{isCompleted ? 'Resonance Mastered' : 'Confirm Resonance Lock'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
