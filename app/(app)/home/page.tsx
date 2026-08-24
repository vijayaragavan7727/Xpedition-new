'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStoreData, calculateStreak, selectNextTarget, UserStoreData, Attempt } from '@/lib/store';
import { FeedbackSheet } from '@/components/FeedbackSheet';

export default function HomePage() {
  const [storeData, setStoreData] = useState<UserStoreData | null>(null);

  useEffect(() => {
    setStoreData(getStoreData());
  }, []);

  if (!storeData) {
    return <div className="py-12 text-center text-muted font-mono text-sm animate-pulse">Loading dashboard...</div>;
  }

  const streak = calculateStreak(storeData.attempts);
  const fadingConcepts = storeData.concepts.filter((c) => c.retentionRisk > 0.35);
  const hasSkillGraph = storeData.concepts.length > 0;

  // Single Source of Truth computation for Next Target
  const target = selectNextTarget(storeData);

  // Context greeting line logic
  let contextLine = storeData.goalText || 'Master adaptive learning graphs.';
  if (streak >= 3) {
    contextLine = `${streak} days running. Don't break it now.`;
  } else if (fadingConcepts.length > 0) {
    contextLine = `${fadingConcepts.length} ${fadingConcepts.length === 1 ? 'concept is' : 'concepts are'} starting to fade.`;
  }

  const formatRelativeTime = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const recentAttempts: Attempt[] = storeData.attempts.slice(-3).reverse();

  return (
    <div className="space-y-6 select-none relative">
      {/* GREETING */}
      <section className="pt-2 pb-1">
        <h1 className="font-sans font-medium text-[21px] text-text">
          Welcome back, {storeData.handle}.
        </h1>
        <p className="font-sans font-normal text-[13px] text-muted mt-1">
          {contextLine}
        </p>
      </section>

      {/* CONTINUE CARD */}
      <section className="card-glass-neon p-6 rounded-[16px]">
        {hasSkillGraph ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-mono text-[11px] tracking-eyebrow uppercase text-muted font-bold">
                {target.inProgress ? 'RESUME QUEST SESSION' : 'NEXT RECOMMENDED TARGET'}
              </span>
              <span className="font-mono text-[11px] text-cyan font-medium">
                {target.inProgress
                  ? `${target.currentIndex} of ${target.totalLength} done (${target.itemsRemaining} remaining)`
                  : `${target.masteryPercentage}% mastery / ${target.itemsRemaining} items next`}
              </span>
            </div>

            {/* Last completed banner if present */}
            {!target.inProgress && target.lastCompletedConceptName && (
              <div className="bg-success/15 border border-success/30 px-3 py-1.5 rounded-[8px] font-mono text-xs text-success flex items-center gap-2">
                <span>✓</span>
                <span>{target.lastCompletedConceptName} completed! Next topic below:</span>
              </div>
            )}

            <div>
              <h2 className="font-sans font-semibold text-[17px] text-text mb-2 flex items-center gap-2 flex-wrap">
                <span>{target.conceptName}</span>
                {target.inProgress && (
                  <span className="font-mono text-[9px] uppercase px-2 py-0.5 rounded bg-cyan/15 text-cyan font-bold border border-cyan/30">
                    {target.currentIndex} of {target.totalLength} done
                  </span>
                )}
              </h2>

              <div className="h-2.5 w-full bg-raised/80 rounded-full overflow-hidden p-0.5 border border-line/40">
                <div
                  className="h-full bg-signature-gradient rounded-full transition-all duration-500"
                  style={{
                    width: target.inProgress
                      ? `${(target.currentIndex / target.totalLength) * 100}%`
                      : `${target.masteryPercentage}%`,
                  }}
                />
              </div>
              <p className="font-mono text-[11px] text-muted mt-1.5">{target.reason}</p>
            </div>

            <div className="space-y-2 pt-1">
              <Link
                href={`/quest?concept=${encodeURIComponent(target.conceptId)}`}
                className="w-full h-[46px] rounded-[10px] bg-signature-gradient text-white font-sans font-semibold text-[15px] flex items-center justify-center gap-2 hover:brightness-108 hover:shadow-[0_8px_30px_-6px_rgba(168,85,247,0.55)] active:translate-y-[1px] transition-all cursor-pointer"
              >
                <span>{target.inProgress ? `Resume quest (Item ${target.currentIndex + 1} of ${target.totalLength})` : 'Continue quest'}</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center space-y-3">
            <h2 className="font-sans font-semibold text-lg text-text">No active course graph</h2>
            <p className="font-sans text-xs text-muted">Set up your learning goal or syllabus to start.</p>
            <Link
              href="/onboarding"
              className="inline-flex h-[42px] px-6 rounded-[10px] bg-signature-gradient text-white font-sans font-semibold text-xs items-center gap-2"
            >
              Start Onboarding →
            </Link>
          </div>
        )}
      </section>

      {/* RECENT ATTEMPTS AUDIT */}
      <section className="bg-raised/40 border border-line/50 rounded-[16px] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-eyebrow uppercase text-muted font-bold">
            RECENT ACTIVITY
          </span>
          <Link href="/history" className="font-mono text-xs text-cyan hover:underline">
            View history →
          </Link>
        </div>

        {recentAttempts.length > 0 ? (
          <div className="space-y-2">
            {recentAttempts.map((att) => (
              <div
                key={att.id}
                className="flex items-center justify-between p-2.5 rounded-[10px] bg-panel/60 border border-line/30 text-xs font-sans"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className={`w-2 h-2 rounded-full ${att.isCorrect ? 'bg-success' : 'bg-danger'}`} />
                  <span className="text-text font-medium truncate">{att.conceptName}</span>
                </div>
                <span className="font-mono text-[10px] text-muted shrink-0">
                  {formatRelativeTime(att.timestamp)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs font-sans text-muted py-2">No attempts recorded yet. Complete a quest to start your log.</div>
        )}
      </section>

      {/* FEEDBACK & REPORT FOOTER */}
      <section className="flex justify-end pt-2 pb-6">
        <FeedbackSheet />
      </section>
    </div>
  );
}
