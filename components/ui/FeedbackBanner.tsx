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
    icon: <CheckCircle2 className="w-4 h-4 text-[#0B7066]" />,
    title: 'Correct!',
    border: 'border-[#17655E]',
    bg: 'bg-[#004741]/20',
    text: 'text-[#E5E0D5]',
    badgeText: 'text-white',
  },
  incorrect: {
    icon: <XCircle className="w-4 h-4 text-rose-400" />,
    title: 'Not quite yet',
    border: 'border-rose-900/50',
    bg: 'bg-rose-950/20',
    text: 'text-rose-200',
    badgeText: 'text-rose-100',
  },
  hint: {
    icon: <HelpCircle className="w-4 h-4 text-[#E5E0D5]" />,
    title: 'Concept Hint',
    border: 'border-[#263130]',
    bg: 'bg-[#151B1B]',
    text: 'text-[#E5E0D5]',
    badgeText: 'text-white',
  },
  tryAgain: {
    icon: <RotateCcw className="w-4 h-4 text-[#0B7066]" />,
    title: 'Try Again',
    border: 'border-[#17655E]',
    bg: 'bg-[#004741]/15',
    text: 'text-[#E5E0D5]',
    badgeText: 'text-white',
  },
  almostThere: {
    icon: <Sparkles className="w-4 h-4 text-[#E5E0D5]" />,
    title: 'Almost there!',
    border: 'border-[#263130]',
    bg: 'bg-[#151B1B]',
    text: 'text-[#E5E0D5]',
    badgeText: 'text-white',
  },
  mastered: {
    icon: <Award className="w-4 h-4 text-[#0B7066]" />,
    title: 'Concept Mastered',
    border: 'border-[#17655E]',
    bg: 'bg-[#004741]/25',
    text: 'text-[#E5E0D5]',
    badgeText: 'text-white',
  },
  needsReview: {
    icon: <AlertTriangle className="w-4 h-4 text-[#C29B38]" />,
    title: 'Needs Review',
    border: 'border-[#C29B38]/40',
    bg: 'bg-[#C29B38]/10',
    text: 'text-[#E5E0D5]',
    badgeText: 'text-white',
  },
  skipped: {
    icon: <SkipForward className="w-4 h-4 text-[#8E9693]" />,
    title: 'Skipped for now',
    border: 'border-[#263130]',
    bg: 'bg-[#151B1B]',
    text: 'text-[#8E9693]',
    badgeText: 'text-[#8E9693]',
  },
  loading: {
    icon: <Loader2 className="w-4 h-4 text-[#0B7066] animate-spin" />,
    title: 'Evaluating...',
    border: 'border-[#17655E]',
    bg: 'bg-[#004741]/20',
    text: 'text-[#E5E0D5]',
    badgeText: 'text-white',
  },
  saved: {
    icon: <Check className="w-4 h-4 text-[#0B7066]" />,
    title: 'Progress Saved',
    border: 'border-[#17655E]',
    bg: 'bg-[#004741]/15',
    text: 'text-[#E5E0D5]',
    badgeText: 'text-white',
  },
  completed: {
    icon: <Award className="w-4 h-4 text-[#0B7066]" />,
    title: 'Activity Completed',
    border: 'border-[#17655E]',
    bg: 'bg-[#004741]/20',
    text: 'text-[#E5E0D5]',
    badgeText: 'text-white',
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
      className={`p-3.5 sm:p-4 rounded-xl ${config.bg} border ${config.border} flex items-start gap-3 transition-colors ${className}`}
    >
      <div className="mt-0.5 shrink-0">{config.icon}</div>
      <div className="flex-1 min-w-0 space-y-0.5">
        <h4 className={`font-sans font-bold text-xs sm:text-sm ${config.badgeText}`}>
          {displayTitle}
        </h4>
        <p className="font-sans text-xs text-[#E5E0D5] leading-relaxed">{message}</p>
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="shrink-0 px-2.5 py-1 text-xs font-sans font-semibold rounded-lg bg-[#F0EDE4] hover:bg-[#E5E0D5] text-[#080B0D] transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default FeedbackBanner;
