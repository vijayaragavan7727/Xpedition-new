'use client';

/**
 * Molecule Experience Container
 *
 * Dedicated container for Experience #3: 3D Molecule Builder.
 * Connects 3D molecular manipulation, domain-specific chemistry rules,
 * structured telemetry, Xira pedagogical coaching, and canonical Learner Model evidence.
 *
 * Architecture:
 * 3D Scene -> Domain Rules -> TelemetryEmitter -> Xira Advisor -> LearnerModelAdapter -> ExperienceResult
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  ExperienceConfig,
  ExperienceResult,
  MoleculeBond,
  XiraExperienceFeedback,
  ChallengeStage,
} from '@/lib/experience/types';
import {
  MOLECULE_BUILDER_EXPERIENCE,
  H2O_MOLECULE_CONFIG,
  createMoleculeExperienceResult,
} from '@/lib/experience/catalog/moleculeBuilderConfig';
import {
  validateBond,
  evaluateMoleculeStructure,
} from '@/lib/experience/domain/moleculeRules';
import { TelemetryEmitter } from '@/lib/experience/telemetry/telemetryEmitter';
import { defaultXiraExperienceAdvisor } from '@/lib/experience/xira/xiraExperienceAdvisor';
import { LearnerModelAdapter } from '@/lib/experience/learnerModel/learnerModelAdapter';
import { MoleculeScene3D } from './3d/MoleculeScene3D';
import { XiraFeedbackBanner } from './XiraFeedbackBanner';
import { ArrowLeft, Compass, CheckCircle2, FlaskConical, Award, Trash2, Atom, Sparkles } from 'lucide-react';

interface MoleculeExperienceContainerProps {
  config?: ExperienceConfig;
  onComplete?: (result: ExperienceResult) => void;
  backHref?: string;
}

export const MoleculeExperienceContainer: React.FC<MoleculeExperienceContainerProps> = ({
  config = MOLECULE_BUILDER_EXPERIENCE,
  onComplete,
  backHref = '/home',
}) => {
  const moleculeConfig = config.molecule || H2O_MOLECULE_CONFIG;
  const startTimeRef = useRef<number>(Date.now());

  // State
  const [bonds, setBonds] = useState<MoleculeBond[]>([]);
  const [selectedAtomId, setSelectedAtomId] = useState<string | null>(null);
  const [invalidAttemptsCount, setInvalidAttemptsCount] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [activeHint, setActiveHint] = useState<string | null>(null);
  const [stage, setStage] = useState<ChallengeStage>(
    moleculeConfig.prediction ? 'PREDICTING' : 'BUILDING'
  );
  const [selectedPredictionId, setSelectedPredictionId] = useState<string | undefined>();

  // Telemetry emitter instance
  const telemetry = useMemo(
    () => new TelemetryEmitter(config.id, config.conceptId, config.title),
    [config]
  );

  // Xira advisor feedback state
  const [xiraFeedback, setXiraFeedback] = useState<XiraExperienceFeedback>(() =>
    defaultXiraExperienceAdvisor.generateMoleculeFeedback(
      telemetry.synthesizeObservation(),
      0,
      false
    )
  );

  // Emit experience_started on mount
  useEffect(() => {
    telemetry.emit('experience_started', {
      conceptId: config.conceptId,
      experienceType: 'MOLECULE_BUILDER',
      moleculeFormula: moleculeConfig.moleculeFormula,
      atomsCount: moleculeConfig.atoms.length,
    });
  }, [config, moleculeConfig, telemetry]);

  // Handle Atom Selection
  const handleSelectAtom = (atomId: string) => {
    setSelectedAtomId(atomId || null);
    if (atomId) {
      telemetry.emit('atom_selected', { atomId });
    }
  };

  // Handle Bond Creation Attempt
  const handleAttemptBond = (atomAId: string, atomBId: string) => {
    const atomA = moleculeConfig.atoms.find((a) => a.id === atomAId);
    const atomB = moleculeConfig.atoms.find((a) => a.id === atomBId);
    if (!atomA || !atomB) return;

    telemetry.emit('bond_attempted', { from: atomAId, to: atomBId });

    // Validate under domain rules
    const validation = validateBond(atomA, atomB, bonds, moleculeConfig);

    if (validation.isValid) {
      const newBond: MoleculeBond = {
        id: `${atomAId}-${atomBId}`,
        fromAtomId: atomAId,
        toAtomId: atomBId,
        bondOrder: 1,
      };
      const nextBonds = [...bonds, newBond];
      setBonds(nextBonds);
      setSelectedAtomId(null);

      telemetry.emit('bond_created', {
        bondId: newBond.id,
        from: atomAId,
        to: atomBId,
        totalBonds: nextBonds.length,
      });

      // Check overall structure
      const evaluation = evaluateMoleculeStructure(nextBonds, moleculeConfig);
      const observation = telemetry.synthesizeObservation();
      observation.principlesIdentified = [
        ...new Set([...(observation.principlesIdentified || []), evaluation.principle]),
      ];

      if (evaluation.isComplete) {
        telemetry.emit('molecule_completed', {
          totalBonds: nextBonds.length,
          invalidAttemptsCount,
        });
      }

      const feedback = defaultXiraExperienceAdvisor.generateMoleculeFeedback(
        observation,
        nextBonds.length,
        evaluation.isComplete
      );
      setXiraFeedback(feedback);
    } else {
      // Invalid bond rejection
      const nextInvalidCount = invalidAttemptsCount + 1;
      setInvalidAttemptsCount(nextInvalidCount);
      setSelectedAtomId(null);

      telemetry.emit('bond_rejected', {
        from: atomAId,
        to: atomBId,
        reason: validation.errorReason,
        principle: validation.principle,
      });

      const observation = telemetry.synthesizeObservation();
      observation.principlesIdentified = [
        ...new Set([...(observation.principlesIdentified || []), validation.principle]),
      ];

      const feedback = defaultXiraExperienceAdvisor.generateMoleculeFeedback(
        observation,
        bonds.length,
        false,
        validation.errorReason,
        validation.principle
      );
      setXiraFeedback(feedback);
    }
  };

  // Remove individual bond
  const handleRemoveBond = (bondId: string) => {
    const nextBonds = bonds.filter((b) => b.id !== bondId);
    setBonds(nextBonds);
    telemetry.emit('bond_removed', { bondId, remainingCount: nextBonds.length });

    const evaluation = evaluateMoleculeStructure(nextBonds, moleculeConfig);
    const observation = telemetry.synthesizeObservation();
    const feedback = defaultXiraExperienceAdvisor.generateMoleculeFeedback(
      observation,
      nextBonds.length,
      evaluation.isComplete
    );
    setXiraFeedback(feedback);
  };

  // Reset all bonds
  const handleResetBonds = () => {
    setBonds([]);
    setSelectedAtomId(null);
    telemetry.emit('retry', { previousBondsCount: bonds.length });

    const observation = telemetry.synthesizeObservation();
    const feedback = defaultXiraExperienceAdvisor.generateMoleculeFeedback(observation, 0, false);
    setXiraFeedback(feedback);
  };

  // Handle Hint Request
  const handleRequestHint = () => {
    const hints = config.challenge.hints;
    const randomHint = hints[Math.floor(Math.random() * hints.length)];
    setActiveHint(randomHint);
    telemetry.emit('hint_requested', { hint: randomHint });
  };

  // Check structure status
  const evaluation = evaluateMoleculeStructure(bonds, moleculeConfig);

  // Complete and commit evidence
  const handleConfirmMastery = () => {
    if (!evaluation.isComplete) return;

    setIsCompleted(true);
    const timeSpentSeconds = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));

    // Synthesize final observation
    const observation = telemetry.synthesizeObservation();
    const finalResult = createMoleculeExperienceResult(
      config,
      observation,
      bonds,
      true,
      invalidAttemptsCount,
      timeSpentSeconds
    );

    // Commit outcome to Learner Model & Decision Engine
    LearnerModelAdapter.recordExperienceOutcome({
      conceptId: config.conceptId,
      conceptName: config.title,
      isSuccess: true,
      accuracy: invalidAttemptsCount === 0 ? 1.0 : Math.max(0.7, 1 - invalidAttemptsCount * 0.1),
      trialsCount: bonds.length + invalidAttemptsCount,
      confidence: invalidAttemptsCount === 0 ? 'known' : 'unsure',
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
          <span className="font-mono text-[10px] uppercase tracking-wider text-cyan-300 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center gap-1">
            <FlaskConical className="w-3 h-3" />
            <span>3D Molecular Lab</span>
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
              <span>Water (H₂O) Synthesized</span>
            </span>
          )}
        </h1>
        <p className="font-sans text-xs sm:text-sm text-slate-400">
          {config.challenge.objective}
        </p>
      </section>

      {/* Optional Prediction Card Stage */}
      {stage === 'PREDICTING' && moleculeConfig.prediction && (
        <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-indigo-300 uppercase tracking-wider">
            <Atom className="w-4 h-4" />
            <span>Pre-Lab Hypothesis</span>
          </div>
          <h2 className="text-base font-semibold text-white">
            {moleculeConfig.prediction.prompt}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {moleculeConfig.prediction.options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  setSelectedPredictionId(opt.id);
                  setStage('BUILDING');
                  telemetry.emit('prediction_submitted', {
                    optionId: opt.id,
                    isCorrect: opt.isCorrect,
                  });
                }}
                className="p-3 rounded-xl bg-slate-900/80 hover:bg-indigo-600/20 border border-slate-800 hover:border-indigo-500/40 text-left text-xs font-medium text-slate-200 transition"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main 3D Molecule Canvas */}
      <section aria-label="3D Molecular Bonding Workspace">
        <MoleculeScene3D
          atoms={moleculeConfig.atoms}
          bonds={bonds}
          selectedAtomId={selectedAtomId}
          onSelectAtom={handleSelectAtom}
          onAttemptBond={handleAttemptBond}
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

      {/* Active Bonds & Verification Action Panel */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              evaluation.isComplete
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_15px_#10b981]'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {evaluation.isComplete ? <Sparkles className="w-5 h-5" /> : <FlaskConical className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-sm font-semibold text-white flex items-center gap-2">
              <span>{evaluation.isComplete ? 'Target Molecule Complete!' : 'Forming H₂O Bonds'}</span>
              <span className="font-mono text-xs text-cyan-300">
                ({bonds.length} / 2 covalent bonds)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {evaluation.isComplete
                ? 'Oxygen is covalently bonded to two hydrogen atoms. Confirm to record mastery.'
                : 'Click Oxygen, then click each Hydrogen atom to form the two O–H bonds.'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {bonds.length > 0 && !isCompleted && (
            <button
              onClick={handleResetBonds}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs border border-slate-700 transition flex items-center justify-center gap-1.5"
              title="Reset all bonds"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset</span>
            </button>
          )}

          {!isCompleted && (
            <button
              onClick={handleRequestHint}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs border border-slate-700 transition flex items-center justify-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Hint</span>
            </button>
          )}

          <button
            onClick={handleConfirmMastery}
            disabled={!evaluation.isComplete || isCompleted}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition shadow-lg ${
              isCompleted
                ? 'bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 cursor-default'
                : evaluation.isComplete
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/25 border border-emerald-400/50 cursor-pointer animate-pulse'
                : 'bg-slate-800/80 text-slate-500 border border-slate-700/50 cursor-not-allowed'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>{isCompleted ? 'Molecule Mastered' : 'Confirm H₂O Structure'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
