'use client';

/**
 * Learner Passport: identity → progress → skills → evidence → achievements → share.
 *
 * Everything shown is derived from the learner's own recorded activity
 * (lib/passport/passportView.ts and lib/passport/evidenceModel.ts). The Passport
 * is an internal learning record, never an externally verified credential
 * (lib/passport/trustLanguage.ts).
 */

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { getStoreData, UserStoreData } from '@/lib/store';
import { calibrationScore, confidenceBreakdown } from '@/lib/engine/calibration';
import { thetaToPercent } from '@/lib/engine/mastery';
import PassportShareModal from '@/components/PassportShareModal';
import { ExplorerAmbient } from '@/components/ambient/ExplorerAmbient';
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
  const fitRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<{ height: number; pullUp: number } | null>(null);

  useEffect(() => {
    setStoreData(getStoreData());
  }, []);

  // Screen fit: the passport fills the scroll area the app shell gives this page,
  // so the open book sits inside one viewport (pages scroll inside the book if needed).
  useLayoutEffect(() => {
    const el = fitRef.current;
    const wrap = el?.parentElement;
    const scroller = wrap?.parentElement;
    if (!el || !wrap || !scroller) return;
    const measure = () => {
      const cs = getComputedStyle(wrap);
      const padTop = parseFloat(cs.paddingTop) || 0;
      const padBottom = parseFloat(cs.paddingBottom) || 0;
      // Below md the app's fixed bottom navigation overlays the scroll area.
      const bottomNav = document.querySelector('nav[aria-label="Mobile Primary Navigation"]') as HTMLElement | null;
      const navHeight = bottomNav && getComputedStyle(bottomNav).display !== 'none' ? bottomNav.offsetHeight : 0;
      const gap = window.innerWidth >= 768 ? 20 : navHeight + 12;
      setFit({ height: Math.max(460, scroller.clientHeight - padTop - gap), pullUp: padBottom - gap });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(scroller);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [storeData]);

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
    <div
      ref={fitRef}
      data-testid="learner-passport"
      className="xp-passport-page xp-passport-fit relative max-w-[1040px] mx-auto flex flex-col font-sans select-none"
      style={fit ? { height: fit.height, marginBottom: -fit.pullUp } : undefined}
    >
      {/* Light, luminous paper-room backdrop behind the book, with the quiet
          explorer atmosphere (motes, contours, a travelling light) in the margins. */}
      <div aria-hidden className="fixed inset-0 -z-10 pointer-events-none bg-[#F6F3EC]">
        <ExplorerAmbient variant="passport" />
      </div>

      {/* Title: the passport cover and what this record is */}
      <header className="shrink-0 flex items-center gap-3 mb-2.5 md:mb-3.5">
        <div className="xp-passport-cover relative w-[30px] sm:w-[36px] aspect-[168/232] shrink-0 drop-shadow-[0_4px_8px_rgba(40,32,15,0.3)]"><span className="xp-passport-shimmer" aria-hidden="true" />
          <Image src="/images/passport/cover-front.png" alt="Xpedition passport cover" fill sizes="36px" className="object-contain" priority />
        </div>
        <div className="min-w-0 leading-tight">
          <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-[#9A7A3C]">Xpedition</p>
          <h1 className="font-black text-[19px] sm:text-[22px] text-[#2A2418] tracking-tight">Your Learning Passport</h1>
        </div>
        <p className="hidden md:block ml-auto text-[12px] text-[#6B5E48] text-right max-w-[360px]">From your own learning record: identity, progress, skills, evidence and milestones.</p>
      </header>

      <div className="flex-1 min-h-0">
        <div className="xp-passport-page-content flex-1 min-h-0"><PassportBook view={view} metrics={metrics} onShare={() => setIsShareOpen(true)} /></div>
      </div>

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
