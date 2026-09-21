'use client';

import React from 'react';
import { Button } from '@/components/ui';
import { ArrowRight, BookOpen, Calculator, Bot, BarChart2 } from 'lucide-react';

export interface ClassFooterProps {
  primaryLabel: string;
  onPrimaryAction: () => void;
  isLoading?: boolean;
  canSkip?: boolean;
  skipLabel?: string;
  onSkip?: () => void;
  onOpenNotes?: () => void;
  onOpenFormula?: () => void;
  onOpenXira?: () => void;
  onOpenProgress?: () => void;
  className?: string;
}

export const ClassFooter: React.FC<ClassFooterProps> = ({
  primaryLabel,
  onPrimaryAction,
  isLoading = false,
  canSkip = false,
  skipLabel = 'Skip for now →',
  onSkip,
  onOpenNotes,
  onOpenFormula,
  onOpenXira,
  onOpenProgress,
  className = '',
}) => {
  return (
    <footer
      className={`w-full bg-[#060B18]/95 backdrop-blur-2xl border-t border-white/[0.08] px-4 py-3 sm:px-6 select-none shrink-0 z-20 ${className}`}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left / Bottom Tools: Quick access buttons for supporting tool drawers */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 sm:pb-0">
          {onOpenNotes && (
            <button
              type="button"
              onClick={onOpenNotes}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-sans font-semibold text-slate-300 hover:text-white transition-all shrink-0 active:scale-95"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Notes</span>
            </button>
          )}

          {onOpenFormula && (
            <button
              type="button"
              onClick={onOpenFormula}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-sans font-semibold text-slate-300 hover:text-white transition-all shrink-0 active:scale-95"
            >
              <Calculator className="w-3.5 h-3.5 text-indigo-400" />
              <span>Formula</span>
            </button>
          )}

          {onOpenXira && (
            <button
              type="button"
              onClick={onOpenXira}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-xs font-sans font-semibold text-indigo-300 hover:text-white transition-all shrink-0 active:scale-95"
            >
              <Bot className="w-3.5 h-3.5 text-indigo-400" />
              <span>Ask Xira</span>
            </button>
          )}

          {onOpenProgress && (
            <button
              type="button"
              onClick={onOpenProgress}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-sans font-semibold text-slate-300 hover:text-white transition-all shrink-0 active:scale-95"
            >
              <BarChart2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Progress</span>
            </button>
          )}
        </div>

        {/* Right: The Single Primary CTA (+ Optional Subtle Skip) */}
        <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
          {canSkip && onSkip && (
            <Button
              variant="skip"
              size="md"
              onClick={onSkip}
              className="shrink-0"
            >
              {skipLabel}
            </Button>
          )}

          <Button
            variant="primary"
            size="md"
            isLoading={isLoading}
            onClick={onPrimaryAction}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="w-full sm:w-auto min-w-[160px]"
          >
            {primaryLabel}
          </Button>
        </div>
      </div>
    </footer>
  );
};

export default ClassFooter;
