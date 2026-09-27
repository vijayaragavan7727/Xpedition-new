'use client';

/**
 * PassportBook — the learner's Passport as an open passport book.
 *
 *   Spread 1:  Learner Identity  |  My Expeditions (subject stamps) + Learning Evidence
 *   Spread 2:  Skill Evidence    |  Milestones + Applied Learning + Calibration
 *
 * Desktop shows two pages side by side; phones show one page at a time. Every
 * number comes from `PassportView` (lib/passport/passportView.ts), built from the
 * learner's own recorded activity. Stamps, icons, milestone stamps, the cover and
 * the paper texture are the prepared Passport assets (public/images/passport);
 * their sample text was removed and real values are written in its place.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Compass, Globe2, Share2, X, Lock, Flag } from 'lucide-react';
import type { PassportView, SubjectStamp } from '@/lib/passport/passportView';
import type { ConceptEvidence, EvidenceLevel } from '@/lib/passport/evidenceModel';
import { MASTERY_THRESHOLDS } from '@/lib/passport/evidenceModel';
import { PASSPORT_DISCLAIMER, PASSPORT_RECORD_BADGE } from '@/lib/passport/trustLanguage';

export interface PassportSkillMetrics {
  soloScore: number | null;
  assistedScore: number;
  helpGap: number;
  calibration: { solid: number; blindSpot: number; fragile: number };
  /** Hands-on challenges with a correct answer recorded (first per concept). */
  demonstrated: Array<{ title: string; conceptName: string; recordedAt: number }>;
}

export interface PassportBookProps {
  view: PassportView;
  metrics: PassportSkillMetrics;
  onShare: () => void;
}

const INK = '#2A2418';
const MUTED = '#6B5E48';
const GREEN = '#1F5A45';

const LEVEL_LABEL: Record<EvidenceLevel, string> = {
  none: 'No evidence yet',
  practised: 'Practised',
  assessed: 'Solo assessed',
  mastered: 'Mastered',
};

const STAMP_STATE_LABEL: Record<SubjectStamp['state'], string> = {
  mastered: 'Mastered',
  in_progress: 'In progress',
  not_started: 'Not started',
};

const PAGE_TITLES = ['Learner Identity', 'My Expeditions', 'Skill Evidence', 'Milestones'];

function formatDate(ts: number | null): string | null {
  if (!ts) return null;
  return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Deterministic bar pattern from the passport number (decorative, not a real barcode). */
function barPattern(id: string): number[] {
  const bars: number[] = [];
  for (let i = 0; i < 38; i++) bars.push(1 + ((id.charCodeAt(i % id.length) * (i + 7)) % 3));
  return bars;
}

// ---------------------------------------------------------------------------
// Pieces (paper-document style: rules and figures, not dashboard cards)
// ---------------------------------------------------------------------------

const RULE = '#CDBE9E';

const PageTitle: React.FC<{ title: string; note: string }> = ({ title, note }) => (
  <div className="mb-2.5 max-[399px]:mb-2">
    <h2 className="font-sans font-black text-[13.5px] sm:text-[14px] tracking-[0.14em] uppercase leading-tight" style={{ color: INK }}>
      {title}
    </h2>
    <p className="text-[11.5px] leading-snug" style={{ color: MUTED }}>
      {note}
    </p>
  </div>
);

const SectionLabel: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => (
  <h3 id={id} className="font-sans font-black text-[11.5px] tracking-[0.14em] uppercase mb-1.5" style={{ color: INK }}>
    {children}
  </h3>
);

const Bar: React.FC<{ value: number; color?: string; label: string }> = ({ value, color = GREEN, label }) => (
  <div role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} className="h-1.5 rounded-full bg-[#DDD2BB] overflow-hidden">
    <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
  </div>
);

const ProgressRing: React.FC<{ value: number }> = ({ value }) => {
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative w-[64px] h-[64px] shrink-0" role="img" aria-label={`Journey progress ${value}%`}>
      <svg viewBox="0 0 76 76" className="w-full h-full -rotate-90">
        <circle cx="38" cy="38" r={r} fill="none" stroke="#DDD2BB" strokeWidth="7" />
        {value > 0 && (
          <circle cx="38" cy="38" r={r} fill="none" stroke={GREEN} strokeWidth="7" strokeLinecap="round" strokeDasharray={`${(value / 100) * c} ${c}`} />
        )}
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-black text-[14px]" style={{ color: INK }}>
        {value}%
      </span>
    </div>
  );
};

/** A row of figures separated by thin rules, like entries printed in a passport. */
const Figures: React.FC<{ items: Array<{ label: string; value: React.ReactNode; note?: string; color?: string }> }> = ({ items }) => (
  <dl className="grid border-y" style={{ borderColor: RULE, gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
    {items.map((it, i) => (
      <div key={it.label} className={`px-1.5 py-1.5 max-[399px]:py-1 text-center ${i ? 'border-l' : ''}`} style={{ borderColor: RULE }}>
        <dt className="text-[10.5px] uppercase tracking-[0.06em] leading-tight" style={{ color: MUTED }}>{it.label}</dt>
        <dd className="font-black text-[16px] leading-tight mt-0.5" style={{ color: it.color ?? INK }}>{it.value}</dd>
        {it.note && <dd className="text-[10.5px] leading-tight" style={{ color: MUTED }}>{it.note}</dd>}
      </div>
    ))}
  </dl>
);

const Stamp: React.FC<{ stamp: SubjectStamp; onOpen: (s: SubjectStamp) => void }> = ({ stamp, onOpen }) => {
  const notStarted = stamp.state === 'not_started';
  const conceptsLabel = `${stamp.concepts.length} concept${stamp.concepts.length === 1 ? '' : 's'}`;
  // Short enough to fit the stamp's blank area; full detail is in the stamp dialog.
  const line2 = notStarted ? null : stamp.bestMastery !== null && stamp.bestMastery > 0 ? `${stamp.bestMastery}%` : conceptsLabel;
  return (
    <button
      type="button"
      data-stamp={stamp.slug}
      data-stamp-state={stamp.state}
      onClick={() => onOpen(stamp)}
      aria-label={`${stamp.subject}: ${STAMP_STATE_LABEL[stamp.state]}${notStarted ? '' : `, ${conceptsLabel}${stamp.bestMastery !== null ? `, best mastery ${stamp.bestMastery}%` : ''}`}. Open details.`}
      className="group relative w-full max-w-[104px] md:[@media(max-height:820px)]:max-w-[84px] mx-auto flex flex-col items-center cursor-pointer rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F5A45] transition-transform hover:-translate-y-0.5"
    >
      <span className="relative block w-full aspect-[94/120]">
        <Image
          src={stamp.stampSrc}
          alt=""
          fill
          sizes="104px"
          className={`object-contain select-none ${notStarted ? 'grayscale opacity-45' : ''}`}
          style={stamp.state === 'in_progress' ? { opacity: 0.9 } : undefined}
        />
        {/* Real values written into the stamp's blank area (room for it from sm up) */}
        <span className="hidden sm:flex absolute left-[14%] right-[14%] top-[57%] bottom-[14%] flex-col items-center justify-center text-center leading-tight">
          <span className="text-[10.5px] font-bold" style={{ color: notStarted ? MUTED : stamp.color }}>
            {STAMP_STATE_LABEL[stamp.state]}
          </span>
          {line2 && (
            <span className="text-[11px] font-black" style={{ color: INK }}>
              {line2}
            </span>
          )}
        </span>
        {stamp.state === 'mastered' && (
          <span aria-hidden="true" className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#1F5A45] text-[#F4ECDC] text-[11px] font-black flex items-center justify-center shadow">
            ✓
          </span>
        )}
      </span>
      {/* Phones: the same values as a caption under the stamp, so nothing overlaps the artwork */}
      <span className="sm:hidden mt-0.5 text-center leading-[1.15]">
        <span className="block text-[10px] font-bold whitespace-nowrap" style={{ color: notStarted ? MUTED : stamp.color }}>
          {STAMP_STATE_LABEL[stamp.state]}
        </span>
        {line2 && (
          <span className="block text-[10.5px] font-black" style={{ color: INK }}>
            {line2}
          </span>
        )}
      </span>
    </button>
  );
};

const EVIDENCE_ITEMS: Array<{ key: keyof PassportView['totals'] | 'xp'; label: string; icon: string }> = [
  { key: 'conceptsLearned', label: 'Concepts learned', icon: 'concept-learned' },
  { key: 'interactive', label: 'Interactive activity', icon: 'interactive' },
  { key: 'practice', label: 'Practice answers', icon: 'practice' },
  { key: 'assessment', label: 'Solo assessment', icon: 'assessment' },
  { key: 'mastered', label: 'Mastery achieved', icon: 'mastery' },
  { key: 'xp', label: 'XP earned', icon: 'xp' },
];

const EvidenceStrip: React.FC<{ view: PassportView }> = ({ view }) => (
  <section aria-labelledby="learning-evidence-heading" className="mt-3 pt-2.5 md:[@media(max-height:820px)]:mt-2 md:[@media(max-height:820px)]:pt-2 max-[399px]:mt-2.5 border-t" style={{ borderColor: RULE }}>
    <SectionLabel id="learning-evidence-heading">Learning Evidence</SectionLabel>
    <ul data-testid="evidence-strip" className="grid grid-cols-6 gap-x-1">
      {EVIDENCE_ITEMS.map((item) => {
        const value = item.key === 'xp' ? view.xp : view.totals[item.key];
        return (
          <li key={item.key} data-evidence-item={item.key} className="flex flex-col items-center text-center min-w-0">
            <Image src={`/images/passport/icon-${item.icon}.png`} alt="" width={40} height={40} className="w-7 h-7 sm:w-8 sm:h-8" />
            <span className="font-black text-[14px] leading-none mt-1" style={{ color: INK }}>
              {value}
            </span>
            <span className="text-[10px] sm:text-[10.5px] leading-tight mt-0.5" style={{ color: MUTED }}>
              {item.label}
            </span>
          </li>
        );
      })}
    </ul>
  </section>
);

const ConceptRow: React.FC<{ c: ConceptEvidence }> = ({ c }) => (
  <li data-evidence-concept={c.conceptId} className="py-2 max-[399px]:py-1.5 border-b border-[#D6C9AE]/80 last:border-b-0">
    <div className="flex items-center justify-between gap-2">
      <span className="font-bold text-[13px] truncate" style={{ color: INK }}>
        {c.title}
      </span>
      <span
        className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
          c.mastery.level === 'mastered' ? 'bg-[#1F5A45] text-[#F4ECDC] border-[#1F5A45]' : 'bg-transparent text-[#1F5A45] border-[#1F5A45]/40'
        }`}
      >
        {LEVEL_LABEL[c.mastery.level]}
      </span>
    </div>
    {c.identitySource === 'attempt_record' ? (
      // Answered, but not a concept in the learner's goal graph: no mastery estimate exists.
      <p className="mt-1 text-[11.5px] italic" style={{ color: MUTED }}>
        No mastery estimate: not part of your current goal.
      </p>
    ) : (
      <div className="mt-1 max-[399px]:mt-0.5 flex items-center gap-2">
        <div className="flex-1">
          <Bar value={c.mastery.percent} label={`${c.title} mastery estimate`} />
        </div>
        <span className="text-[12px] font-bold w-10 text-right" style={{ color: INK }}>
          {c.mastery.percent}%
        </span>
      </div>
    )}
    <p className="mt-0.5 text-[11.5px] flex flex-wrap gap-x-3 gap-y-0" style={{ color: MUTED }}>
      <span>
        Answers: {c.attempts.correct}/{c.attempts.total} correct
      </span>
      <span>
        Solo: {c.assessment.soloAttempts > 0 ? `${c.assessment.soloCorrect}/${c.assessment.soloAttempts} (${c.assessment.soloAccuracy}%)` : 'not yet assessed'}
      </span>
      {c.interactions.handsOnAttempts > 0 && c.interactions.activity && (
        <span>
          Hands-on: {c.interactions.activity} ({c.interactions.handsOnAttempts})
        </span>
      )}
    </p>
  </li>
);

// ---------------------------------------------------------------------------
// Stamp detail
// ---------------------------------------------------------------------------

const StampDetail: React.FC<{ stamp: SubjectStamp; onClose: () => void }> = ({ stamp, onClose }) => {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  // Portal to <body>: the app shell's bottom navigation must not cover the dialog.
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="stamp-detail-title"
        data-testid="stamp-detail"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md max-h-[85dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-[#CDBE9E] p-5 shadow-2xl"
        style={{ backgroundColor: '#F4ECDC', backgroundImage: 'url(/images/passport/texture.png)', backgroundSize: 'cover' }}
      >
        <div className="flex items-start gap-3">
          <div className="relative w-14 aspect-[94/120] shrink-0">
            <Image src={stamp.stampSrc} alt="" fill sizes="56px" className={`object-contain ${stamp.state === 'not_started' ? 'grayscale opacity-50' : ''}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="stamp-detail-title" className="font-black text-lg" style={{ color: INK }}>
              {stamp.subject}
            </h3>
            <span
              className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold text-white"
              style={{ background: stamp.state === 'not_started' ? '#8C7F68' : stamp.color }}
            >
              {STAMP_STATE_LABEL[stamp.state]}
            </span>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close stamp details"
            className="w-9 h-9 rounded-full border border-[#CDBE9E] flex items-center justify-center hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1F5A45]"
            style={{ color: INK }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {stamp.concepts.length === 0 ? (
          <div className="mt-4 space-y-3 text-[13px]" style={{ color: MUTED }}>
            <p>No learning evidence in {stamp.subject} yet. Complete a class or a quest in this subject to earn this stamp.</p>
            <Link href="/learn?tab=explore" className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1F5A45] text-[#F4ECDC] text-[13px] font-semibold">
              <Flag className="w-4 h-4" /> Find a {stamp.subject} concept
            </Link>
          </div>
        ) : (
          <>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-[#FBF6EA] border border-[#D6C9AE] py-2">
                <dt className="text-[11px]" style={{ color: MUTED }}>Concepts</dt>
                <dd className="font-black text-base" style={{ color: INK }}>{stamp.concepts.length}</dd>
              </div>
              <div className="rounded-xl bg-[#FBF6EA] border border-[#D6C9AE] py-2">
                <dt className="text-[11px]" style={{ color: MUTED }}>Mastered</dt>
                <dd className="font-black text-base" style={{ color: INK }}>{stamp.masteredCount}</dd>
              </div>
              <div className="rounded-xl bg-[#FBF6EA] border border-[#D6C9AE] py-2">
                <dt className="text-[11px]" style={{ color: MUTED }}>Last evidence</dt>
                <dd className="font-bold text-[12px] pt-1" style={{ color: INK }}>{formatDate(stamp.lastEvidenceAt) ?? '—'}</dd>
              </div>
            </dl>
            <ul className="mt-3">
              {stamp.concepts.map((c) => (
                <ConceptRow key={c.conceptId} c={c} />
              ))}
            </ul>
          </>
        )}
        <p className="mt-4 text-[11px]" style={{ color: MUTED }}>
          Mastered = mastery estimate {MASTERY_THRESHOLDS.masteredPercent}%+ with {MASTERY_THRESHOLDS.masteredMinSoloAttempts}+ solo attempts. Computed by Xpedition from your own answers; not externally verified.
        </p>
      </div>
    </div>,
    document.body
  );
};

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

const IdentityPage: React.FC<{ view: PassportView; onShare: () => void }> = ({ view, onShare }) => {
  const bars = useMemo(() => barPattern(view.passportNo), [view.passportNo]);
  return (
    <div data-testid="passport-identity">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5" style={{ color: GREEN }}>
          <Compass className="w-5 h-5" aria-hidden="true" />
          <span className="font-black tracking-[0.2em] text-[13px]">XPEDITION</span>
        </div>
        <span className="hidden min-[420px]:flex items-center gap-1.5 text-[10.5px] font-bold tracking-[0.14em] uppercase" style={{ color: INK }}>
          Learner Passport <Globe2 className="w-3.5 h-3.5" aria-hidden="true" />
        </span>
      </div>
      <PageTitle title="Learner Identity" note="Learning record of an Xpedition learner" />

      <div className="flex gap-3.5 items-start">
        <div className="relative w-[88px] h-[108px] sm:w-[98px] sm:h-[120px] shrink-0 rounded-lg overflow-hidden border-[3px] border-[#FBF6EA] shadow-[0_3px_10px_rgba(60,40,10,0.22)] bg-gradient-to-b from-[#9CC7E6] to-[#CFE5C4]">
          <Image src={view.avatarSrc} alt={`${view.learnerName}'s explorer avatar`} fill sizes="98px" className="object-cover object-top scale-[1.9] origin-top" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10.5px] uppercase tracking-[0.08em]" style={{ color: MUTED }}>Name</p>
          <h1 data-testid="passport-name" className="font-black text-[18px] sm:text-[19px] leading-tight truncate" style={{ color: INK }}>
            {view.learnerName}
          </h1>
          <div className="mt-1.5 flex items-center gap-3">
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-[10.5px] uppercase tracking-[0.08em]" style={{ color: MUTED }}>Explorer level</p>
              <p data-testid="passport-level" className="font-black text-[14px] leading-none" style={{ color: INK }}>
                Level {view.level}
              </p>
              <Bar value={view.levelProgressPercent} label="Progress to next level" />
              <p className="text-[11px] leading-tight" style={{ color: MUTED }}>
                <span data-testid="passport-xp" className="font-bold" style={{ color: INK }}>{view.xp} XP</span>
                {' '}· {view.xpToNextLevel} XP to level {view.level + 1}
              </p>
            </div>
            {view.journeyProgress !== null && (
              <div className="hidden min-[400px]:flex flex-col items-center">
                <ProgressRing value={view.journeyProgress} />
                <span className="text-[10px] mt-0.5 whitespace-nowrap" style={{ color: MUTED }}>Journey progress</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <Figures
          items={[
            { label: 'Practised', value: view.totals.conceptsLearned, note: 'concepts' },
            { label: 'Mastered', value: view.totals.mastered, note: 'concepts' },
            { label: 'Streak', value: `${view.streak}`, note: view.streak === 1 ? 'day' : 'days' },
          ]}
        />
      </div>

      {view.goalText && (
        <p className="mt-2 text-[12px] truncate" style={{ color: MUTED }} title={view.goalText}>
          <span className="font-semibold" style={{ color: INK }}>Current goal: </span>
          {view.goalText}
        </p>
      )}

      <div className="mt-2.5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10.5px] uppercase tracking-[0.08em]" style={{ color: MUTED }}>Passport no.</p>
          <p data-testid="passport-no" className="font-mono font-bold text-[12px] truncate" style={{ color: INK }}>
            {view.passportNo}
          </p>
          <div aria-hidden="true" className="mt-1 flex items-end gap-[2px] h-5 opacity-80">
            {bars.map((w, i) => (
              <span key={i} className="h-full bg-[#2A2418]" style={{ width: w }} />
            ))}
          </div>
        </div>
        <div className="w-[70px] h-[70px] shrink-0 rounded-full border-[2.5px] border-[#3E7B8C]/65 flex flex-col items-center justify-center text-center rotate-[-8deg] text-[#3E7B8C]">
          <span className="text-[7.5px] font-black tracking-[0.18em]">XPEDITION</span>
          <span className="text-[9px] font-black leading-tight px-1">{PASSPORT_RECORD_BADGE.toUpperCase()}</span>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        <button
          type="button"
          onClick={onShare}
          className="inline-flex items-center gap-2 min-h-[40px] px-3.5 rounded-xl bg-[#1F5A45] hover:bg-[#184A39] text-[#F4ECDC] text-[13px] font-bold shadow-[0_4px_12px_rgba(31,90,69,0.25)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F5A45]"
        >
          <Share2 className="w-4 h-4" /> Share Passport
        </button>
        <span className="font-caveat text-[17px]" style={{ color: MUTED }}>
          Small steps, real evidence.
        </span>
      </div>
      <p data-testid="passport-disclaimer" className="mt-2 text-[10.5px] leading-snug" style={{ color: MUTED }}>
        {PASSPORT_DISCLAIMER}
      </p>
    </div>
  );
};

const ExpeditionsPage: React.FC<{ view: PassportView; onOpen: (s: SubjectStamp) => void }> = ({ view, onOpen }) => (
  <div data-testid="passport-expeditions">
    <PageTitle title="My Expeditions" note="Subject stamps earned from your learning evidence" />
    <div data-testid="stamp-grid" className="grid grid-cols-4 gap-x-2 sm:gap-x-3 gap-y-2.5 md:[@media(max-height:820px)]:gap-y-1.5">
      {view.subjects.map((s) => (
        <Stamp key={s.slug} stamp={s} onOpen={onOpen} />
      ))}
    </div>
    {view.otherConcepts.length > 0 && (
      <p className="mt-2 text-[11.5px]" style={{ color: MUTED }}>
        + {view.otherConcepts.length} concept{view.otherConcepts.length === 1 ? '' : 's'} from your own goal, listed under Skill Evidence.
      </p>
    )}
    <EvidenceStrip view={view} />
    {view.isNewLearner && (
      <div data-testid="passport-empty" className="mt-3 pt-2.5 md:[@media(max-height:820px)]:mt-2 md:[@media(max-height:820px)]:pt-2 border-t border-dashed text-[12px]" style={{ borderColor: RULE, color: MUTED }}>
        <p>
          <span className="font-semibold" style={{ color: INK }}>Ready for its first stamp. </span>
          Answer questions in a Class or a quest: every answer, activity and assessment is recorded here.
        </p>
        <Link href="/learn?tab=explore" className="mt-2 inline-flex items-center gap-1.5 min-h-[38px] px-3 rounded-xl bg-[#1F5A45] text-[#F4ECDC] text-[12.5px] font-semibold">
          <Flag className="w-4 h-4" /> Start an expedition
        </Link>
      </div>
    )}
  </div>
);

const SkillsPage: React.FC<{ view: PassportView; metrics: PassportSkillMetrics }> = ({ view, metrics }) => (
  <div data-testid="passport-evidence">
    <PageTitle title="Skill Evidence" note="Answers, solo assessment, hands-on work and mastery estimate per concept" />
    <Figures
      items={[
        { label: 'Solo score', value: metrics.soloScore !== null ? `${metrics.soloScore}%` : '—', note: metrics.soloScore !== null ? 'no assistance' : 'needs 3 solo sessions' },
        { label: 'Assisted', value: `${metrics.assistedScore}%`, note: 'with AI coaching' },
        { label: 'Help gap', value: `${metrics.helpGap} pts`, note: 'assisted − solo' },
      ]}
    />
    {view.evidence.length === 0 ? (
      <p className="mt-2 text-[12.5px]" style={{ color: MUTED }}>No learning evidence recorded yet.</p>
    ) : (
      <ul className="mt-1">
        {view.evidence.map((c) => (
          <ConceptRow key={c.conceptId} c={c} />
        ))}
      </ul>
    )}
    <p className="mt-2 max-[399px]:mt-1.5 text-[10.5px] leading-snug" style={{ color: MUTED }}>
      “Mastered” means a mastery estimate of at least {MASTERY_THRESHOLDS.masteredPercent}% with {MASTERY_THRESHOLDS.masteredMinSoloAttempts}+ solo attempts. Estimates are computed by Xpedition and are not externally verified.
    </p>
  </div>
);

const MilestonesPage: React.FC<{ view: PassportView; metrics: PassportSkillMetrics }> = ({ view, metrics }) => (
  <div data-testid="passport-milestones">
    <PageTitle title="Milestones" note="Earned from your record; locked ones show what earns them" />
    <ul className="grid grid-cols-2 min-[400px]:grid-cols-4 gap-x-2 gap-y-2 max-[399px]:gap-y-1">
      {view.milestones.map((m) => (
        <li key={m.id} data-milestone={m.id} data-earned={m.earned ? 'true' : 'false'} className="flex flex-col items-center text-center min-w-0">
          <div className="relative w-[46px] min-[400px]:w-[64px] sm:w-[70px] aspect-[82/112]">
            <Image
              src={m.earned ? m.asset : '/images/passport/milestone-future-explorer.png'}
              alt=""
              fill
              sizes="70px"
              className={`object-contain ${m.earned ? 'drop-shadow-[0_2px_4px_rgba(60,40,10,0.18)]' : 'opacity-60'}`}
            />
            {m.earned && m.detail && (m.id === 'level_up' || m.id === 'streak') && (
              <span className="absolute left-[16%] right-[16%] bottom-[14%] h-[16%] flex items-center justify-center text-[8.5px] font-black leading-none text-center" style={{ color: m.id === 'streak' ? '#1D6FB8' : '#C07A12' }}>
                {m.id === 'level_up' ? `LEVEL ${view.level}` : `${view.streak} DAYS`}
              </span>
            )}
          </div>
          <span className="mt-1 font-bold text-[11.5px] leading-tight" style={{ color: INK }}>
            {m.title}
          </span>
          <span className="text-[10.5px] leading-tight" style={{ color: MUTED }}>
            {m.earned ? m.detail : (
              <span className="inline-flex items-start gap-1">
                <Lock className="w-3 h-3 mt-px shrink-0" aria-hidden="true" />
                {m.requirement}
              </span>
            )}
          </span>
        </li>
      ))}
    </ul>

    <p className="mt-2.5 pt-2 max-[399px]:mt-1.5 max-[399px]:pt-1.5 border-t border-dashed flex items-center gap-2 text-[12px]" style={{ borderColor: RULE, color: MUTED }}>
      <Image src="/images/passport/icon-xp.png" alt="" width={40} height={40} className="w-6 h-6" />
      <span>
        <span className="font-bold" style={{ color: INK }}>Next milestone: </span>
        {view.xpToNextLevel} XP to reach level {view.level + 1}.
      </span>
    </p>

    <section className="mt-2.5 pt-2 max-[399px]:mt-1.5 max-[399px]:pt-1.5 border-t" style={{ borderColor: RULE }} aria-labelledby="applied-heading">
      <SectionLabel id="applied-heading">Applied Learning</SectionLabel>
      {metrics.demonstrated.length === 0 ? (
        <p className="text-[12px]" style={{ color: MUTED }}>
          No hands-on challenge recorded yet. Complete an interactive simulation or code lab to add applied evidence.
        </p>
      ) : (
        <ul className="space-y-1">
          {metrics.demonstrated.map((d) => (
            <li key={d.title} className="flex items-start gap-2 text-[12px] min-w-0">
              <Image src="/images/passport/icon-challenge.png" alt="" width={40} height={40} className="w-5 h-5 shrink-0 mt-px" />
              <span className="min-w-0 line-clamp-2 leading-snug">
                <span className="font-bold" style={{ color: INK }}>{d.title}</span>
                <span style={{ color: MUTED }}> · {d.conceptName}, {formatDate(d.recordedAt)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>

    <section className="mt-2.5 pt-2 max-[399px]:mt-1.5 max-[399px]:pt-1.5 border-t" style={{ borderColor: RULE }} aria-labelledby="calibration-heading">
      <SectionLabel id="calibration-heading">Confidence Calibration</SectionLabel>
      <Figures
        items={[
          { label: 'Calibrated', value: metrics.calibration.solid, color: '#1F7A4A' },
          { label: 'Overconfident', value: metrics.calibration.blindSpot, color: '#C0262D' },
          { label: 'Hesitant', value: metrics.calibration.fragile, color: '#B7791F' },
        ]}
      />
    </section>
  </div>
);

// ---------------------------------------------------------------------------
// Book
// ---------------------------------------------------------------------------

export const PassportBook: React.FC<PassportBookProps> = ({ view, metrics, onShare }) => {
  const [page, setPage] = useState(0);
  const [openStamp, setOpenStamp] = useState<SubjectStamp | null>(null);
  const pageCount = PAGE_TITLES.length;
  // Two pages per spread from md up; one page at a time on phones.
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // Turning a page starts the new page at its top (pages scroll on their own if needed).
  const pageRefs = useRef<Array<HTMLElement | null>>([]);
  useEffect(() => {
    pageRefs.current.forEach((el) => el?.scrollTo({ top: 0 }));
  }, [page]);

  const step = useCallback((dir: 1 | -1) => {
    setPage((p) => {
      if (wide) {
        const spread = Math.floor(p / 2) + dir;
        return Math.max(0, Math.min(pageCount / 2 - 1, spread)) * 2;
      }
      return Math.max(0, Math.min(pageCount - 1, p + dir));
    });
  }, [pageCount, wide]);

  const pages = [
    <IdentityPage key="identity" view={view} onShare={onShare} />,
    <ExpeditionsPage key="expeditions" view={view} onOpen={setOpenStamp} />,
    <SkillsPage key="skills" view={view} metrics={metrics} />,
    <MilestonesPage key="milestones" view={view} metrics={metrics} />,
  ];
  const spread = Math.floor(page / 2);

  return (
    <div data-testid="passport-book" data-page={page} className="relative flex flex-col min-h-0 h-full">
      {/* Leather cover: a physical passport resting on a soft, lit surface */}
      <div className="relative flex-1 min-h-0 rounded-[22px] md:rounded-[26px] p-[6px] md:p-[9px] bg-[linear-gradient(160deg,#1E4C3D_0%,#143A2D_55%,#0F2E23_100%)] shadow-[0_28px_50px_-24px_rgba(40,32,15,0.55),0_10px_24px_-12px_rgba(40,32,15,0.35),0_0_0_1px_rgba(10,32,25,0.6)]">
        <div className="h-full rounded-[17px] md:rounded-[20px] border border-dashed border-[#C9A45C]/45 p-[3px]">
          <div className="relative h-full grid grid-cols-1 md:grid-cols-2 rounded-[14px] md:rounded-[17px] overflow-hidden">
            {pages.map((node, i) => {
              const onMobile = i === page;
              const onDesktop = Math.floor(i / 2) === spread;
              const isLeft = i % 2 === 0;
              return (
                <section
                  key={PAGE_TITLES[i]}
                  ref={(el) => {
                    pageRefs.current[i] = el;
                  }}
                  aria-label={PAGE_TITLES[i]}
                  data-passport-page={i + 1}
                  className={`${onMobile ? 'flex' : 'hidden'} ${onDesktop ? 'md:flex' : 'md:hidden'} passport-page flex-col relative min-w-0 h-full overflow-y-auto overscroll-contain px-4 pt-3.5 pb-1.5 max-[399px]:pt-3 max-[399px]:pb-1 sm:px-5 md:px-6 md:pt-5`}
                  style={{
                    backgroundColor: '#F4ECDA',
                    backgroundImage: `${isLeft ? 'linear-gradient(90deg, rgba(0,0,0,0) 90%, rgba(90,60,20,0.16) 100%)' : 'linear-gradient(90deg, rgba(90,60,20,0.18) 0%, rgba(0,0,0,0) 9%)'}, linear-gradient(rgba(250,245,233,0.45), rgba(250,245,233,0.45)), url(/images/passport/texture.png)`,
                    backgroundSize: '100% 100%, 100% 100%, cover',
                    backgroundAttachment: 'local',
                  }}
                >
                  {node}
                  <span aria-hidden="true" className="mt-auto pt-1.5 self-center shrink-0 text-[10px] leading-none font-mono" style={{ color: MUTED }}>
                    {i + 1}
                  </span>
                </section>
              );
            })}
            {/* Spine */}
            <span aria-hidden="true" className="hidden md:block pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-6 bg-[linear-gradient(90deg,rgba(80,55,20,0)_0%,rgba(80,55,20,0.14)_50%,rgba(80,55,20,0)_100%)]" />
          </div>
        </div>
      </div>

      {/* Page navigation (always within reach, below the book) */}
      <nav aria-label="Passport pages" className="shrink-0 mt-2.5 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={page === 0}
          aria-label="Previous page"
          className="w-10 h-10 rounded-full bg-[#1F5A45] text-[#F4ECDC] flex items-center justify-center shadow-[0_4px_12px_rgba(31,90,69,0.25)] disabled:opacity-30 disabled:shadow-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F5A45]"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span data-testid="passport-page-label" className="min-w-[112px] text-center text-[13px] font-semibold text-[#3A3326]">
          <span className="md:hidden">{PAGE_TITLES[page]} · {page + 1}/{pageCount}</span>
          <span className="hidden md:inline">Pages {spread * 2 + 1}–{spread * 2 + 2} of {pageCount}</span>
        </span>
        <span aria-hidden="true" className="flex gap-1.5">
          {Array.from({ length: pageCount }, (_, i) => (
            <span key={i} className={`w-2 h-2 rounded-full ${wide ? (Math.floor(i / 2) === spread ? 'bg-[#1F5A45]' : 'bg-[#1F5A45]/20') : i === page ? 'bg-[#1F5A45]' : 'bg-[#1F5A45]/20'}`} />
          ))}
        </span>
        <button
          type="button"
          onClick={() => step(1)}
          disabled={wide ? spread >= pageCount / 2 - 1 : page >= pageCount - 1}
          aria-label="Next page"
          className="w-10 h-10 rounded-full bg-[#1F5A45] text-[#F4ECDC] flex items-center justify-center shadow-[0_4px_12px_rgba(31,90,69,0.25)] disabled:opacity-30 disabled:shadow-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F5A45]"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </nav>

      {openStamp && <StampDetail stamp={openStamp} onClose={() => setOpenStamp(null)} />}
    </div>
  );
};

export default PassportBook;
