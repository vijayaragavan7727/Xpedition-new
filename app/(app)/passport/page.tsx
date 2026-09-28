'use client';

/**
 * Learner Passport: identity → progress → skills → evidence → achievements → share.
 *
 * Everything shown is derived from the learner's own recorded activity
 * (lib/passport/passportView.ts and lib/passport/evidenceModel.ts). The Passport
 * is an internal learning record, never an externally verified credential
 * (lib/passport/trustLanguage.ts).
 */

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { getStoreData, UserStoreData } from '@/lib/store';
import { calibrationScore, confidenceBreakdown } from '@/lib/engine/calibration';
import { thetaToPercent } from '@/lib/engine/mastery';
import PassportShareModal from '@/components/PassportShareModal';
import { PassportBook, type PassportSkillMetrics } from '@/components/passport/PassportBook';
import { buildPassportView } from '@/lib/passport/passportView';
import { HANDS_ON_CONCEPTS } from '@/lib/passport/evidenceModel';

/** Practical challenges that a correct hands-on answer demonstrates (first per concept). */
const DEMONSTRATED_CHALLENGES: Record<string, string> = {
  python_debugging_basics: 'Live Code Debugging & Variable Accumulation',
  human_heart_anatomy: '3D Hemodynamic Valve & Chamber Navigation',
  spatial_reasoning: '3D Polyhedral Multi-Axis Spatial Alignment',
  projectile_motion: 'Variable Kinematics & Launch Trajectory Simulation',
  molecular_bonding: 'Covalent Octet Rule Synthesis & Molecule Construction',
};

function skillMetrics(store: UserStoreData): PassportSkillMetrics & { accuracyMargin: number; soloAverage: number } {
  const concepts = store.concepts;
  const n = concepts.length;
  const solo = n
    ? Math.round(concepts.reduce((acc, c) => acc + (c.thetaSolo !== undefined ? thetaToPercent(c.thetaSolo) : c.masteryPercentage || 0), 0) / n)
    : 0;
  const assisted = n
    ? Math.round(concepts.reduce((acc, c) => acc + (c.thetaAssisted !== undefined ? thetaToPercent(c.thetaAssisted) : c.masteryPercentage || 0), 0) / n)
    : 0;
  const soloRecorded = store.attempts.filter((a) => a.isSolo && !a.isVoid).length;
  const hasEnoughSolo = Math.floor(soloRecorded / 6) >= 3;
  const score = calibrationScore(store.attempts);
  const accuracyMargin = Math.max(3, Math.min(25, score !== null ? Math.round(Math.abs(score) * 100) : 6));

  const seen = new Set<string>();
  const demonstrated: PassportSkillMetrics['demonstrated'] = [];
  for (const a of store.attempts) {
    if (!a.isCorrect || a.isVoid || !a.conceptId || seen.has(a.conceptId)) continue;
    const title = DEMONSTRATED_CHALLENGES[a.conceptId];
    if (!title || !HANDS_ON_CONCEPTS[a.conceptId]) continue;
    seen.add(a.conceptId);
    demonstrated.push({ title, conceptName: a.conceptName || a.conceptId, recordedAt: a.timestamp });
  }

  return {
    soloScore: hasEnoughSolo ? solo : null,
    assistedScore: assisted,
    helpGap: Math.max(0, assisted - solo),
    calibration: confidenceBreakdown(store.attempts),
    demonstrated,
    accuracyMargin,
    soloAverage: solo,
  };
}

export default function LearnerPassportPage() {
  const [storeData, setStoreData] = useState<UserStoreData | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);

  useEffect(() => {
    setStoreData(getStoreData());
  }, []);

  const view = useMemo(() => (storeData ? buildPassportView(storeData) : null), [storeData]);
  const metrics = useMemo(() => (storeData ? skillMetrics(storeData) : null), [storeData]);

  if (!storeData || !view || !metrics) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 text-sm">
        <div className="w-8 h-8 border-2 border-[#C9A45C] border-t-transparent rounded-full animate-spin" />
        <span>Opening your passport…</span>
      </div>
    );
  }

  return (
    <div data-testid="learner-passport" className="max-w-[1040px] mx-auto pt-2 pb-24 lg:pb-10 font-sans select-none">
      {/* Title: the passport cover and what this record is */}
      <header className="flex items-center gap-4 mb-5">
        <div className="relative w-[52px] sm:w-[64px] aspect-[168/232] shrink-0 drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]">
          <Image src="/images/passport/cover-front.png" alt="Xpedition passport cover" fill sizes="64px" className="object-contain" priority />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#C9A45C]">Xpedition</p>
          <h1 className="font-black text-2xl sm:text-3xl text-white tracking-tight">Your Learning Passport</h1>
          <p className="text-[13px] text-slate-300">Identity · progress · skills · evidence · milestones, from your own learning record.</p>
        </div>
      </header>

      <PassportBook view={view} metrics={metrics} onShare={() => setIsShareOpen(true)} />

      {/* Portal to <body> so the app shell's navigation never covers the dialog. */}
      {isShareOpen && createPortal(
      <PassportShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        learnerName={view.learnerName}
        goalText={storeData.goalText || 'Active Course'}
        soloScore={metrics.soloAverage}
        assistedScore={metrics.assistedScore}
        gapMetric={metrics.helpGap}
        accuracyMargin={metrics.accuracyMargin}
        topConcepts={storeData.concepts.map((c) => ({ name: c.name, masteryPercentage: c.masteryPercentage || 0 }))}
        passportId={view.passportNo}
      />,
      document.body
      )}
    </div>
  );
}
