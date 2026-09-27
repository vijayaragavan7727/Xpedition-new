'use client';

/**
 * Explicit "lesson unavailable" state. Shown instead of silently substituting
 * a different concept's lesson when a requested concept is unknown.
 */

import React from 'react';
import Link from 'next/link';
import type { LessonUnavailableReason } from '@/lib/concepts/types';

export interface ClassLessonUnavailableProps {
  requestedConceptId: string;
  reason: LessonUnavailableReason;
}

const REASON_TEXT: Record<LessonUnavailableReason, string> = {
  empty_id: 'No concept was specified for this class.',
  invalid_id: 'The concept id in the link is not valid.',
  unknown_concept: 'This concept is not in the Xpedition curriculum yet.',
  no_class_lesson: 'This concept is available as a hands-on lab, but it does not have a Class lesson yet.',
};

export const ClassLessonUnavailable: React.FC<ClassLessonUnavailableProps> = ({ requestedConceptId, reason }) => (
  <div
    data-testid="lesson-unavailable"
    data-requested-concept={requestedConceptId}
    data-reason={reason}
    className="min-h-[100dvh] w-full bg-[#040714] text-slate-100 flex items-center justify-center p-6"
  >
    <div className="max-w-md w-full rounded-3xl border border-cyan-500/30 bg-[#060B1E]/90 p-6 space-y-3 text-center">
      <div className="text-cyan-300 font-mono text-xs uppercase tracking-widest">Lesson unavailable</div>
      <h1 className="text-xl font-black text-white">We could not open this class</h1>
      <p className="text-sm text-slate-300">{REASON_TEXT[reason]}</p>
      {requestedConceptId && (
        <p className="text-xs text-slate-500 font-mono break-all">Requested: {requestedConceptId.slice(0, 100)}</p>
      )}
      <Link
        href="/learn?tab=explore"
        className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold"
      >
        Browse available topics
      </Link>
    </div>
  </div>
);

export default ClassLessonUnavailable;
