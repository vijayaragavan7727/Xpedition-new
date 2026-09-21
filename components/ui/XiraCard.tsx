'use client';

import React from 'react';
import { Sparkles, Brain, X, ArrowRight, Lightbulb, Compass, AlertCircle } from 'lucide-react';
import Button from './Button';

export type XiraCardType =
  | 'suggestion'
  | 'hint'
  | 'explanation'
  | 'observation'
  | 'feedback'
  | 'intervention';

export interface XiraCardProps {
  title?: string;
  message: string;
  type?: XiraCardType;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  className?: string;
}

const TYPE_CONFIG: Record<
  XiraCardType,
  {
    icon: React.ReactNode;
    title: string;
    border: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  suggestion: {
    icon: <Brain className="w-4 h-4 text-indigo-400" />,
    title: 'Xira Suggests',
    border: 'border-indigo-500/35',
    badgeBg: 'bg-indigo-500/15',
    badgeText: 'text-indigo-300',
  },
  hint: {
    icon: <Lightbulb className="w-4 h-4 text-amber-400" />,
    title: 'Xira Hint',
    border: 'border-amber-500/35',
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-300',
  },
  explanation: {
    icon: <Sparkles className="w-4 h-4 text-sky-400" />,
    title: 'Xira Concept Breakdown',
    border: 'border-sky-500/35',
    badgeBg: 'bg-sky-500/15',
    badgeText: 'text-sky-300',
  },
  observation: {
    icon: <Compass className="w-4 h-4 text-teal-400" />,
    title: 'Xira Observed',
    border: 'border-teal-500/35',
    badgeBg: 'bg-teal-500/15',
    badgeText: 'text-teal-300',
  },
  feedback: {
    icon: <Sparkles className="w-4 h-4 text-purple-400" />,
    title: 'Xira Assessment Feedback',
    border: 'border-purple-500/35',
    badgeBg: 'bg-purple-500/15',
    badgeText: 'text-purple-300',
  },
  intervention: {
    icon: <AlertCircle className="w-4 h-4 text-rose-400" />,
    title: 'Need a hand?',
    border: 'border-rose-500/35',
    badgeBg: 'bg-rose-500/15',
    badgeText: 'text-rose-300',
  },
};

export const XiraCard: React.FC<XiraCardProps> = ({
  title,
  message,
  type = 'suggestion',
  actionLabel = 'Go to Class →',
  onAction,
  onDismiss,
  className = '',
}) => {
  const currentConfig = TYPE_CONFIG[type] || TYPE_CONFIG.suggestion;
  const displayTitle = title || currentConfig.title;

  return (
    <div
      className={`relative p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#0E152E]/95 to-[#141D3D]/95 backdrop-blur-xl border ${currentConfig.border} shadow-[0_8px_24px_rgba(99,102,241,0.18)] space-y-3 transition-all ${className}`}
    >
      {/* Header with Icon, Title, and Dismiss */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0">
            {currentConfig.icon}
          </div>
          <span className="font-sans font-bold text-xs sm:text-sm text-white tracking-tight">
            {displayTitle}
          </span>
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss suggestion"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Message Body */}
      <p className="font-sans text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
        {message}
      </p>

      {/* Action CTA */}
      {onAction && (
        <div className="flex justify-end pt-1">
          <Button
            variant="primary"
            size="sm"
            onClick={onAction}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

export default XiraCard;
