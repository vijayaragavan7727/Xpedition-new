'use client';

import React from 'react';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Award,
  AlertTriangle,
  SkipForward,
  Loader2,
  Check,
} from 'lucide-react';

export type FeedbackType =
  | 'correct'
  | 'incorrect'
  | 'hint'
  | 'tryAgain'
  | 'almostThere'
  | 'mastered'
  | 'needsReview'
  | 'skipped'
  | 'loading'
  | 'saved'
  | 'completed';

export interface FeedbackBannerProps {
  type: FeedbackType;
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const FEEDBACK_CONFIG: Record<
  FeedbackType,
  {
    icon: React.ReactNode;
    title: string;
    border: string;
    bg: string;
    text: string;
    badgeText: string;
  }
> = {
  correct: {
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    title: 'Correct!',
    border: 'border-emerald-500/35',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-300',
    badgeText: 'text-emerald-200',
  },
  incorrect: {
    icon: <XCircle className="w-4 h-4 text-rose-400" />,
    title: 'Not quite yet',
    border: 'border-rose-500/30',
    bg: 'bg-rose-500/10',
    text: 'text-rose-300',
    badgeText: 'text-rose-200',
  },
  hint: {
    icon: <HelpCircle className="w-4 h-4 text-amber-400" />,
    title: 'Concept Hint',
    border: 'border-amber-500/35',
    bg: 'bg-amber-500/10',
    text: 'text-amber-300',
    badgeText: 'text-amber-200',
  },
  tryAgain: {
    icon: <RotateCcw className="w-4 h-4 text-sky-400" />,
    title: 'Try Again',
    border: 'border-sky-500/30',
    bg: 'bg-sky-500/10',
    text: 'text-sky-300',
    badgeText: 'text-sky-200',
  },
  almostThere: {
    icon: <Sparkles className="w-4 h-4 text-amber-400" />,
    title: 'Almost there!',
    border: 'border-amber-500/35',
    bg: 'bg-amber-500/10',
    text: 'text-amber-300',
    badgeText: 'text-amber-200',
  },
  mastered: {
    icon: <Award className="w-4 h-4 text-emerald-400" />,
    title: 'Concept Mastered',
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-300',
    badgeText: 'text-emerald-200',
  },
  needsReview: {
    icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
    title: 'Needs Review',
    border: 'border-amber-500/35',
    bg: 'bg-amber-500/10',
    text: 'text-amber-300',
    badgeText: 'text-amber-200',
  },
  skipped: {
    icon: <SkipForward className="w-4 h-4 text-slate-400" />,
    title: 'Skipped for now',
    border: 'border-slate-600/30',
    bg: 'bg-slate-800/40',
    text: 'text-slate-300',
    badgeText: 'text-slate-400',
  },
  loading: {
    icon: <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />,
    title: 'Evaluating...',
    border: 'border-indigo-500/30',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-300',
    badgeText: 'text-indigo-200',
  },
  saved: {
    icon: <Check className="w-4 h-4 text-emerald-400" />,
    title: 'Progress Saved',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-300',
    badgeText: 'text-emerald-200',
  },
  completed: {
    icon: <Award className="w-4 h-4 text-amber-400" />,
    title: 'Activity Completed',
    border: 'border-amber-500/35',
    bg: 'bg-amber-500/10',
    text: 'text-amber-300',
    badgeText: 'text-amber-200',
  },
};

export const FeedbackBanner: React.FC<FeedbackBannerProps> = ({
  type,
  title,
  message,
  actionLabel,
  onAction,
  className = '',
}) => {
  const config = FEEDBACK_CONFIG[type] || FEEDBACK_CONFIG.hint;
  const displayTitle = title || config.title;

  return (
    <div
      className={`p-3.5 sm:p-4 rounded-xl ${config.bg} border ${config.border} backdrop-blur-md flex items-start gap-3 transition-all ${className}`}
    >
      <div className="mt-0.5 shrink-0">{config.icon}</div>
      <div className="flex-1 min-w-0 space-y-0.5">
        <h4 className={`font-sans font-bold text-xs sm:text-sm ${config.badgeText}`}>
          {displayTitle}
        </h4>
        <p className="font-sans text-xs text-slate-300 leading-relaxed">{message}</p>
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="shrink-0 px-2.5 py-1 text-xs font-sans font-semibold rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-white transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default FeedbackBanner;
