'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  ExperienceConfig,
  XiraExperienceFeedback,
  ChallengeStage,
} from '@/lib/experience/types';
import { simulateProjectile, SimulationResult } from '@/lib/experience/simulation/projectilePhysics';
import { TelemetryEmitter } from '@/lib/experience/telemetry/telemetryEmitter';
import { ChallengeEngine } from '@/lib/experience/challenge/challengeEngine';
import { defaultXiraExperienceAdvisor } from '@/lib/experience/xira/xiraExperienceAdvisor';
import { LearnerModelAdapter } from '@/lib/experience/learnerModel/learnerModelAdapter';
import { ProjectileScene3D } from './3d/ProjectileScene3D';
import { ExperienceControls } from './ExperienceControls';
import { PredictionCard } from './PredictionCard';
import { ObservationPanel } from './ObservationPanel';
import { XiraFeedbackBanner } from './XiraFeedbackBanner';
import { ArrowLeft, Compass, CheckCircle2, RotateCcw } from 'lucide-react';

interface ExperienceContainerProps {
  config: ExperienceConfig;
  onComplete?: (evidence: any) => void;
  backHref?: string;
}

export const ExperienceContainer: React.FC<ExperienceContainerProps> = ({
  config,
  onComplete,
  backHref = '/home',
}) => {
  // 1. Controls State
  const defaultAngle = (config.controls?.find((c) => c.id === 'angle') as any)?.defaultValue || 25;
  const defaultVelocity = (config.controls?.find((c) => c.id === 'velocity') as any)?.defaultValue || 18;

  const [launchAngleDeg, setLaunchAngleDeg] = useState<number>(defaultAngle);
  const [velocity, setVelocity] = useState<number>(defaultVelocity);
  const [isLaunching, setIsLaunching] = useState<boolean>(false);

  // 2. Challenge Engine & Telemetry Instances
  const challengeEngine = useMemo(() => new ChallengeEngine(config.challenge), [config]);
  const telemetry = useMemo(
    () => new TelemetryEmitter(config.id, config.conceptId, config.conceptName),
    [config]
  );

  // 3. Challenge Lifecycle State
  const [stage, setStage] = useState<ChallengeStage>(
    config.challenge.prediction ? 'PREDICTING' : 'CONFIGURING'
  );
  const [selectedPredictionId, setSelectedPredictionId] = useState<string | undefined>();
  const [isPredictionSubmitted, setIsPredictionSubmitted] = useState<boolean>(false);
  const [activeHint, setActiveHint] = useState<string | null>(null);

  // 4. Current Simulation Result
  const [simResult, setSimResult] = useState<SimulationResult>(() =>
    simulateProjectile({
      launchAngleDeg: defaultAngle,
      initialVelocity: defaultVelocity,
      gravity: config.simulation.gravity,
      targetDistance: config.simulation.targetDistance,
      targetTolerance: config.simulation.targetTolerance,
      launchHeight: config.simulation.launchHeight,
    })
  );

  // 5. Xira Feedback State
  const [xiraFeedback, setXiraFeedback] = useState<XiraExperienceFeedback | undefined>(() =>
    defaultXiraExperienceAdvisor.generateFeedback(telemetry.synthesizeObservation())
  );

  const [trialCount, setTrialCount] = useState<number>(0);
  const [hasSucceeded, setHasSucceeded] = useState<boolean>(false);

  // Re-calculate simulation trajectory when controls change (real-time 3D arc preview)
  useEffect(() => {
    const updated = simulateProjectile({
      launchAngleDeg,
      initialVelocity: velocity,
      gravity: config.simulation.gravity,
      targetDistance: config.simulation.targetDistance,
      targetTolerance: config.simulation.targetTolerance,
      launchHeight: config.simulation.launchHeight,
    });
    setSimResult(updated);

    telemetry.emit('control_changed', {
      launchAngleDeg,
      velocity,
      calculatedRange: updated.landingDistance,
    });
  }, [launchAngleDeg, velocity, config]);

  // Initial experience_started event
  useEffect(() => {
    telemetry.emit('experience_started', {
      conceptId: config.conceptId,
      difficulty: config.difficulty,
    });
  }, [config, telemetry]);

  // Handle Prediction Submission
  const handlePredictionSubmit = (optionId: string) => {
    challengeEngine.submitPrediction(optionId);
    setSelectedPredictionId(optionId);
    setIsPredictionSubmitted(true);
    setStage('CONFIGURING');

    telemetry.emit('prediction_submitted', {
      optionId,
    });
  };

  // Handle Fire Cannon Launch
  const handleLaunch = () => {
    if (isLaunching) return;

    challengeEngine.startLaunch();
    setIsLaunching(true);

    telemetry.emit('launch', {
      angleDeg: launchAngleDeg,
      velocity,
      targetDistance: config.simulation.targetDistance,
    });
  };

  // Handle 3D Launch Flight Completion
  const handleLaunchComplete = () => {
    setIsLaunching(false);
    const newTrialCount = trialCount + 1;
    setTrialCount(newTrialCount);

    // Evaluate in Challenge Engine
    const evalResult = challengeEngine.evaluateOutcome(simResult);
    setStage(evalResult.stage);

    // Record in Telemetry
    const recordedTrial = telemetry.recordTrial({
      angleDeg: launchAngleDeg,
      velocity,
      predictedOptionId: selectedPredictionId,
      isPredictionCorrect: evalResult.isPredictionCorrect,
      landingDistance: simResult.landingDistance,
      targetDistance: config.simulation.targetDistance,
      targetError: simResult.targetError,
      isHit: simResult.isHit,
      flightTime: simResult.flightTime,
      peakHeight: simResult.peakHeight,
    });

    // Synthesize Observation and Request Xira Feedback
    const observation = telemetry.synthesizeObservation();
    const feedback = defaultXiraExperienceAdvisor.generateFeedback(observation, recordedTrial);
    setXiraFeedback(feedback);

    if (simResult.isHit) {
      setHasSucceeded(true);

      // Emit Evidence to Learner Model & Decision Engine!
      const evidence = {
        conceptId: config.conceptId,
        conceptName: config.conceptName,
        isSuccess: true,
        accuracy: 1.0,
        trialsCount: newTrialCount,
        confidence: (evalResult.isPredictionCorrect ? 'known' : 'unsure') as 'known' | 'unsure',
        timeSpentSeconds: Math.round(newTrialCount * 12),
        timestamp: Date.now(),
      };

      LearnerModelAdapter.recordExperienceOutcome(evidence);

      if (onComplete) {
        onComplete(evidence);
      }
    }
  };

  // Handle Hint Request
  const handleRequestHint = () => {
    const hint = challengeEngine.requestHint();
    if (hint) {
      setActiveHint(hint);
      telemetry.emit('hint_requested', { hint });
    }
  };

  // Handle Reset
  const handleReset = () => {
    setLaunchAngleDeg(defaultAngle);
    setVelocity(defaultVelocity);
    telemetry.emit('retry', { attemptNumber: trialCount + 1 });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 font-sans select-none">
      {/* Header & Breadcrumb */}
      <header className="flex items-center justify-between gap-4 pt-1">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white px-2.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500/50 outline-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Command Center</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-indigo-300 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
            {config.conceptName}
          </span>
        </div>
      </header>

      {/* Experience Title & Objective */}
      <section className="space-y-1">
        <h1 className="font-sans font-bold text-2xl sm:text-3xl text-white tracking-tight flex items-center gap-2.5">
          <span>{config.title}</span>
          {hasSucceeded && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 font-mono text-xs text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Target Mastered</span>
            </span>
          )}
        </h1>
        <p className="font-sans text-xs sm:text-sm text-slate-400">
          {config.challenge.objective}
        </p>
      </section>

      {/* Main 3D Canvas Scene */}
      <section aria-label="3D Physics Simulation Field">
        <ProjectileScene3D
          launchAngleDeg={launchAngleDeg}
          velocity={velocity}
          targetDistance={config.simulation.targetDistance}
          targetTolerance={config.simulation.targetTolerance}
          simResult={simResult}
          isLaunching={isLaunching}
          onLaunchComplete={handleLaunchComplete}
        />
      </section>

      {/* Active Hint Banner */}
      {activeHint && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5 flex items-start gap-2.5 text-xs text-amber-200">
          <Compass className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>{activeHint}</span>
        </div>
      )}

      {/* Interactive Controls & Observation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Left: Challenge Prediction & Controls */}
        <div className="space-y-5">
          {config.challenge.prediction && (
            <PredictionCard
              config={config.challenge.prediction}
              onSubmit={handlePredictionSubmit}
              isSubmitted={isPredictionSubmitted}
              selectedOptionId={selectedPredictionId}
            />
          )}

          <ExperienceControls
            launchAngleDeg={launchAngleDeg}
            velocity={velocity}
            onAngleChange={setLaunchAngleDeg}
            onVelocityChange={setVelocity}
            onLaunch={handleLaunch}
            onReset={handleReset}
            onRequestHint={handleRequestHint}
            isLaunching={isLaunching}
            disabled={!isPredictionSubmitted && Boolean(config.challenge.prediction)}
          />
        </div>

        {/* Right: Telemetry Observation & Xira Feedback */}
        <div className="space-y-5">
          <ObservationPanel simResult={trialCount > 0 ? simResult : undefined} trialCount={trialCount} />
          <XiraFeedbackBanner feedback={xiraFeedback} />
        </div>
      </div>
    </div>
  );
};
