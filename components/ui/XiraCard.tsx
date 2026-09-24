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
    icon: <Brain className="w-4 h-4 text-[#0B7066]" />,
    title: 'Xira Suggests',
    border: 'border-[#17655E]',
    badgeBg: 'bg-[#004741]/30',
    badgeText: 'text-[#E5E0D5]',
  },
  hint: {
    icon: <Lightbulb className="w-4 h-4 text-[#E5E0D5]" />,
    title: 'Xira Hint',
    border: 'border-[#263130]',
    badgeBg: 'bg-[#1B2221]',
    badgeText: 'text-[#E5E0D5]',
  },
  explanation: {
    icon: <Sparkles className="w-4 h-4 text-[#0B7066]" />,
    title: 'Xira Concept Breakdown',
    border: 'border-[#17655E]',
    badgeBg: 'bg-[#075C55]/30',
    badgeText: 'text-white',
  },
  observation: {
    icon: <Compass className="w-4 h-4 text-[#0B7066]" />,
    title: 'Xira Observed',
    border: 'border-[#17655E]',
    badgeBg: 'bg-[#004741]/30',
    badgeText: 'text-[#E5E0D5]',
  },
  feedback: {
    icon: <Sparkles className="w-4 h-4 text-[#0B7066]" />,
    title: 'Xira Assessment Feedback',
    border: 'border-[#17655E]',
    badgeBg: 'bg-[#004741]/40',
    badgeText: 'text-white',
  },
  intervention: {
    icon: <AlertCircle className="w-4 h-4 text-rose-400" />,
    title: 'Need a hand?',
    border: 'border-[#A83232]/50',
    badgeBg: 'bg-[#A83232]/20',
    badgeText: 'text-rose-200',
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
      className={`relative p-4 sm:p-5 rounded-xl bg-[#151B1B] border ${currentConfig.border} shadow-sm space-y-3 transition-colors ${className}`}
    >
      {/* Header with Icon, Title, and Dismiss */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#080B0D] border border-[#263130] flex items-center justify-center shrink-0">
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
            className="p-1 rounded-lg text-[#8E9693] hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Message Body */}
      <p className="font-sans text-xs sm:text-sm text-[#E5E0D5] leading-relaxed font-normal">
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
