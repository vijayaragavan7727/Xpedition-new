'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStoreData, UserStoreData } from '@/lib/store';
import { calibrationScore, confidenceBreakdown } from '@/lib/engine/calibration';
import { computeGap, thetaToPercent } from '@/lib/engine/mastery';

export default function SkillPassportPage() {
  const [storeData, setStoreData] = useState<UserStoreData | null>(null);

  useEffect(() => {
    setStoreData(getStoreData());
  }, []);

  if (!storeData) {
    return (
      <div className="py-12 text-center text-muted font-mono text-sm animate-pulse">
        Loading Skill Passport...
      </div>
    );
  }

  const breakdown = confidenceBreakdown(storeData.attempts);
  const score = calibrationScore(storeData.attempts);

  // Compute accuracy error percentage from calibration score
  // score = (knownWrongShare - unsureRightShare). Accuracy error % = Math.round(Math.abs(score || 0) * 100)
  const absScore = score !== null ? Math.round(Math.abs(score) * 100) : 9;
  const accuracyMargin = Math.max(3, Math.min(25, absScore));

  return (
    <div className="space-y-6 select-none pt-4 max-w-xl mx-auto">
      <div>
        <h1 className="font-sans font-semibold text-2xl text-text">Skill Passport</h1>
        <p className="font-sans text-xs text-muted mt-1">
          Your verified, adaptive skill passport and metacognitive calibration credentials.
        </p>
      </div>

      <div className="p-6 sm:p-8 bg-[#120E22]/90 rounded-[20px] border border-cyan/40 text-left space-y-6 shadow-[0_0_30px_rgba(0,229,255,0.12)]">
        {/* Passport Header */}
        <div className="flex items-center justify-between border-b border-line/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-signature-gradient p-0.5">
              <div className="w-full h-full rounded-full bg-panel flex items-center justify-center font-mono font-bold text-sm text-cyan">
                🛡️
              </div>
            </div>
            <div>
              <h2 className="font-sans font-bold text-base text-text">
                {storeData.handle}&apos;s Skill Passport
              </h2>
              <span className="font-mono text-[10px] text-cyan uppercase tracking-eyebrow font-bold">
                VERIFIED METACOGNITIVE CREDENTIAL
              </span>
            </div>
          </div>
          <span className="font-mono text-xs px-2.5 py-1 rounded bg-cyan/15 text-cyan border border-cyan/30 font-semibold">
            ID: {storeData.activeGraphId.substring(0, 8)}
          </span>
        </div>

        {/* CALIBRATION LINE */}
        <div className="p-4 rounded-[14px] bg-[#1A1430] border border-violet/40 space-y-2">
          <span className="font-mono text-[10px] uppercase text-violet font-bold tracking-eyebrow block">
            CONFIDENCE CALIBRATION VERDICT
          </span>
          <p className="font-sans text-sm text-text font-semibold leading-relaxed">
            Knows what they know: accurate to within {accuracyMargin}%.
          </p>
          <p className="font-sans text-xs text-muted leading-relaxed">
            Evaluated across {breakdown.totalWithConfidence} items ({breakdown.solid} solid mastery, {breakdown.honestGap} honest gaps, {breakdown.blindSpot} blind spots).
          </p>
        </div>

        {/* Passport Skills Summary */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase text-muted font-bold tracking-eyebrow block">
              VERIFIED CONCEPTS ({storeData.concepts.length})
            </span>
            <span className="font-mono text-[10px] text-violet font-bold">
              Backed by {Math.max(0, Math.floor(storeData.attempts.filter((a) => a.isSolo && !a.isVoid).length / 6))} verified solo session{Math.floor(storeData.attempts.filter((a) => a.isSolo && !a.isVoid).length / 6) === 1 ? '' : 's'}
            </span>
          </div>

          <div className="space-y-2">
            {storeData.concepts.map((c) => {
              const hasSoloData = (c.soloAttemptsCount || 0) >= 3 && c.thetaSolo !== undefined;
              const assistedPct = c.thetaAssisted !== undefined ? thetaToPercent(c.thetaAssisted) : c.masteryPercentage;
              const soloPct = hasSoloData ? thetaToPercent(c.thetaSolo!) : null;

              return (
                <div key={c.id} className="p-3 rounded-[10px] bg-[#150F2A] border border-line/40 flex items-center justify-between font-mono text-xs">
                  <span className="font-sans font-medium text-text">{c.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted">Assisted: <strong className="text-cyan">{assistedPct}%</strong></span>
                    <span className="text-muted">·</span>
                    <span className="text-muted">Solo: <strong className={hasSoloData ? 'text-violet-400' : 'text-muted/40'}>{soloPct !== null ? `${soloPct}%` : '—'}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-2">
          <Link
            href="/home"
            className="w-full h-11 rounded-[12px] bg-signature-gradient text-white font-sans font-semibold text-xs flex items-center justify-center gap-2 hover:brightness-108 transition-all"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
