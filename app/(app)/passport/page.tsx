'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStoreData, UserStoreData } from '@/lib/store';
import { calibrationScore, confidenceBreakdown } from '@/lib/engine/calibration';
import { thetaToPercent } from '@/lib/engine/mastery';
import PassportShareModal from '@/components/PassportShareModal';
import { PASSPORT_DISCLAIMER, PASSPORT_RECORD_BADGE } from '@/lib/passport/trustLanguage';
import { buildPassportEvidence, MASTERY_THRESHOLDS, type EvidenceLevel } from '@/lib/passport/evidenceModel';

const EVIDENCE_LEVEL_LABEL: Record<EvidenceLevel, string> = {
  none: 'No evidence yet',
  practised: 'Practised',
  assessed: 'Solo assessed',
  mastered: 'Mastered',
};
import { Card, Button, Badge, ProgressBar, StatCard } from '@/components/ui';
import {
  Share2,
  Shield,
  CheckCircle2,
  Award,
  Zap,
  AlertTriangle,
  Eye,
  User,
  ShieldCheck,
  TrendingUp,
  Brain,
  Sparkles,
} from 'lucide-react';

export default function SkillPassportPage() {
  const [storeData, setStoreData] = useState<UserStoreData | null>(null);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
  const [robotImgPath, setRobotImgPath] = useState<string>('/robot.png');

  useEffect(() => {
    setStoreData(getStoreData());
  }, []);

  if (!storeData) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 font-mono text-xs animate-pulse">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span>Loading Skill Passport...</span>
      </div>
    );
  }

  const evidence = buildPassportEvidence(storeData);
  const breakdown = confidenceBreakdown(storeData.attempts);
  const score = calibrationScore(storeData.attempts);

  const absScore = score !== null ? Math.round(Math.abs(score) * 100) : 6;
  const accuracyMargin = Math.max(3, Math.min(25, absScore));

  const soloRecordedAttempts = storeData.attempts.filter((a) => a.isSolo && !a.isVoid).length;
  const soloSessionsCount = Math.max(0, Math.floor(soloRecordedAttempts / 6));

  const passportId = storeData.activeGraphId
    ? storeData.activeGraphId.substring(0, 10).toUpperCase()
    : 'XP-CORE-01';

  const totalConcepts = storeData.concepts.length;
  const avgSoloMastery =
    totalConcepts > 0
      ? Math.round(
          storeData.concepts.reduce(
            (acc, c) =>
              acc +
              (c.thetaSolo !== undefined ? thetaToPercent(c.thetaSolo) : c.masteryPercentage || 0),
            0
          ) / totalConcepts
        )
      : 0;

  const avgAssistedMastery =
    totalConcepts > 0
      ? Math.round(
          storeData.concepts.reduce(
            (acc, c) =>
              acc +
              (c.thetaAssisted !== undefined
                ? thetaToPercent(c.thetaAssisted)
                : c.masteryPercentage || 0),
            0
          ) / totalConcepts
        )
      : 0;

  const assistanceGap = Math.max(0, avgAssistedMastery - avgSoloMastery);
  const hasEnoughSoloSessions = soloSessionsCount >= 3;

  return (
    <div className="space-y-6 select-none pt-2 max-w-2xl mx-auto pb-24 font-sans">
      {/* 1. HEADER: Learner Identity & Share Learning Record */}
      <Card variant="highlight" className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-white/[0.1] flex items-center justify-center p-1 shadow-md">
              <img
                src={robotImgPath}
                onError={() => {
                  if (robotImgPath === '/robot.png') setRobotImgPath('/images/robot.png');
                }}
                alt={storeData.handle}
                className="w-11 h-11 object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-sans font-black text-2xl text-white tracking-tight">
                  {storeData.handle}
                </h1>
                <Badge variant="indigo" size="sm">
                  {PASSPORT_RECORD_BADGE}
                </Badge>
              </div>
              <p className="font-mono text-xs text-slate-400 mt-0.5">
                Target: {storeData.goalText} • Record #{passportId}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => setIsShareOpen(true)}
            leftIcon={<Share2 className="w-4 h-4" />}
          >
            Share Passport
          </Button>
        </div>
        <p data-testid="passport-disclaimer" className="font-sans text-[11px] text-slate-400 leading-relaxed border-t border-white/[0.06] pt-3">
          {PASSPORT_DISCLAIMER}
        </p>
      </Card>

      {/* 2. CORE PERFORMANCE METRICS */}
      <section className="grid grid-cols-3 gap-3">
        <StatCard
          label="SOLO SCORE"
          value={hasEnoughSoloSessions ? `${avgSoloMastery}%` : '—'}
          subtext={hasEnoughSoloSessions ? 'Zero assistance' : 'Need 3 solo trials'}
          icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
        />
        <StatCard
          label="ASSISTED SCORE"
          value={`${avgAssistedMastery}%`}
          subtext="With AI coaching"
          icon={<Sparkles className="w-4 h-4 text-cyan-400" />}
        />
        <StatCard
          label="HELP GAP"
          value={`${assistanceGap} pts`}
          subtext="Guidance dependency"
          icon={<Brain className="w-4 h-4 text-purple-400" />}
        />
      </section>

      {/* 3. METACOGNITIVE CALIBRATION CARD (self-reported confidence vs results) */}
      <Card variant="default" className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center font-mono font-bold text-xs text-cyan-300">
              AI
            </div>
            <div>
              <h3 className="font-sans font-bold text-sm text-white">
                Metacognitive Calibration
              </h3>
              <p className="font-mono text-[11px] text-slate-400">
                Self-awareness & accuracy prediction
              </p>
            </div>
          </div>

          <Badge variant="cyan" size="sm">
            ±{accuracyMargin}% Error Margin
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-[#181C2E] border border-white/[0.06] text-center space-y-1">
            <span className="font-mono text-[10px] text-slate-400 uppercase">CALIBRATED</span>
            <span className="font-sans font-bold text-lg text-emerald-400 block">
              {breakdown.solid}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#181C2E] border border-white/[0.06] text-center space-y-1">
            <span className="font-mono text-[10px] text-slate-400 uppercase">OVERCONFIDENT</span>
            <span className="font-sans font-bold text-lg text-rose-400 block">
              {breakdown.blindSpot}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#181C2E] border border-white/[0.06] text-center space-y-1">
            <span className="font-mono text-[10px] text-slate-400 uppercase">HESITANT</span>
            <span className="font-sans font-bold text-lg text-amber-400 block">
              {breakdown.fragile}
            </span>
          </div>
        </div>
      </Card>

      {/* 4. CONCEPT MASTERY BREAKDOWN (internal estimates) */}
      <Card variant="default" className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div>
            <h3 className="font-sans font-bold text-sm text-white">Concept Mastery</h3>
            <p className="font-mono text-[11px] text-slate-400">
              {storeData.concepts.length} Concepts Tracked
            </p>
          </div>
          <Badge variant="indigo" size="sm">
            {storeData.attempts.length} Total Attempts
          </Badge>
        </div>

        <div className="space-y-3">
          {storeData.concepts.map((concept, index) => {
            const soloPct =
              concept.thetaSolo !== undefined
                ? thetaToPercent(concept.thetaSolo)
                : concept.masteryPercentage || 0;
            const assistedPct =
              concept.thetaAssisted !== undefined
                ? thetaToPercent(concept.thetaAssisted)
                : concept.masteryPercentage || 0;

            return (
              <div
                key={concept.id}
                className="p-3.5 rounded-xl bg-[#181C2E]/80 border border-white/[0.06] space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400">
                      #{index + 1}
                    </span>
                    <span className="font-sans font-bold text-sm text-white">
                      {concept.name}
                    </span>
                  </div>
                  <Badge variant={soloPct >= 80 ? 'success' : 'indigo'} size="sm">
                    {soloPct}% Solo Mastery
                  </Badge>
                </div>

                <ProgressBar
                  value={assistedPct}
                  variant="indigo"
                  size="sm"
                  label="Curriculum Progress"
                />
              </div>
            );
          })}
        </div>
      </Card>

      {/* 5. DEMONSTRATED PRACTICAL CAPABILITIES (Evidence-First Proofs) */}
      <Card variant="default" className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-sm text-white">
                Demonstrated Practical Challenges
              </h3>
              <p className="font-mono text-[11px] text-slate-400">
                Hands-on activity recorded in 3D & code labs
              </p>
            </div>
          </div>
        </div>

        {(() => {
          const demonstratedSkills: Array<{ title: string; conceptName: string; recordedAt: number }> = [];
          const canonicalSkills: Record<string, string> = {
            python_debugging_basics: 'Live Code Debugging & Variable Accumulation',
            human_heart_anatomy: '3D Hemodynamic Valve & Chamber Navigation',
            spatial_reasoning: '3D Polyhedral Multi-Axis Spatial Alignment',
            projectile_motion: 'Variable Kinematics & Launch Trajectory Simulation',
            molecular_bonding: 'Covalent Octet Rule Synthesis & Molecule Construction',
          };

          const successfulAttempts = (storeData.attempts || []).filter((a) => a.isCorrect && !a.isVoid);
          const seenConcepts = new Set<string>();

          successfulAttempts.forEach((att) => {
            if (att.conceptId && canonicalSkills[att.conceptId] && !seenConcepts.has(att.conceptId)) {
              seenConcepts.add(att.conceptId);
              demonstratedSkills.push({
                title: canonicalSkills[att.conceptId],
                conceptName: att.conceptName || att.conceptId,
                recordedAt: att.timestamp,
              });
            }
          });

          if (demonstratedSkills.length === 0) {
            return (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center space-y-2">
                <p className="font-sans text-xs text-slate-400">
                  No hands-on challenges recorded yet. Complete an interactive 3D simulation or code lab to add evidence to your learning record.
                </p>
                <Link
                  href="/learn"
                  className="inline-flex items-center gap-1 font-sans text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                >
                  <span>Explore Hands-on Labs &rarr;</span>
                </Link>
              </div>
            );
          }

          return (
            <div className="space-y-2.5">
              {demonstratedSkills.map((skill) => (
                <div
                  key={skill.title}
                  className="p-3.5 rounded-xl bg-white/[0.03] border border-emerald-500/20 flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-sans font-bold text-xs sm:text-sm text-white truncate">
                        {skill.title}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 block pl-6">
                      Recorded in {skill.conceptName} • {new Date(skill.recordedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <Badge variant="success" size="sm" className="shrink-0">
                    Demonstrated
                  </Badge>
                </div>
              ))}
            </div>
          );
        })()}
      </Card>

      {/* 6. EVIDENCE TRAIL: concept → attempts → interactions → assessment → mastery */}
      <Card variant="default" className="p-5 space-y-4" data-testid="passport-evidence">
        <div className="border-b border-white/[0.06] pb-3">
          <h3 className="font-sans font-bold text-sm text-white">Evidence Trail</h3>
          <p className="font-mono text-[11px] text-slate-400">
            Concept → attempts → hands-on interactions → solo assessment → mastery estimate
          </p>
        </div>
        {evidence.concepts.length === 0 ? (
          <p className="font-sans text-xs text-slate-400">No learning evidence recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {evidence.concepts.map((c) => (
              <div key={c.conceptId} data-evidence-concept={c.conceptId} className="p-3 rounded-xl bg-[#181C2E]/80 border border-white/[0.06] text-[11px] text-slate-300 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-sans font-bold text-sm text-white truncate">{c.title}</span>
                  <Badge variant={c.mastery.level === 'mastered' ? 'success' : 'indigo'} size="sm">
                    {EVIDENCE_LEVEL_LABEL[c.mastery.level]}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 font-mono">
                  <span>Attempts: {c.attempts.correct}/{c.attempts.total} correct</span>
                  <span>Hands-on: {c.interactions.handsOnAttempts}</span>
                  <span>
                    Solo: {c.assessment.soloAttempts > 0 ? `${c.assessment.soloCorrect}/${c.assessment.soloAttempts} (${c.assessment.soloAccuracy}%)` : 'not yet assessed'}
                  </span>
                  <span>Mastery estimate: {c.mastery.percent}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="font-sans text-[10px] text-slate-500">
          “Mastered” means a mastery estimate of at least {MASTERY_THRESHOLDS.masteredPercent}% with {MASTERY_THRESHOLDS.masteredMinSoloAttempts}+ solo attempts. Estimates are computed by Xpedition and are not externally verified.
        </p>
      </Card>

      {/* Share Modal */}
      <PassportShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        learnerName={storeData.handle || 'Learner'}
        goalText={storeData.goalText || 'Active Course'}
        soloScore={avgSoloMastery}
        assistedScore={avgAssistedMastery}
        gapMetric={assistanceGap}
        accuracyMargin={accuracyMargin}
        topConcepts={storeData.concepts.map((c) => ({
          name: c.name,
          masteryPercentage: c.masteryPercentage || 0,
        }))}
        passportId={passportId}
      />
    </div>
  );
}
