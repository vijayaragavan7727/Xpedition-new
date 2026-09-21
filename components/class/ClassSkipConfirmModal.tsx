'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, ArrowRight, X, FastForward, Check } from 'lucide-react';
import { ClassStageId } from '@/lib/class/types';
import { SkipReason } from '@/lib/class/skipSystem';

export interface ClassSkipConfirmModalProps {
  isOpen: boolean;
  stage: ClassStageId;
  conceptName: string;
  onConfirm: (reason: SkipReason) => void;
  onCancel: () => void;
}

const REASONS: Array<{ reason: SkipReason; label: string }> = [
  { reason: 'already_know', label: 'I already know this' },
  { reason: 'move_faster', label: 'Want to move faster' },
  { reason: 'not_now', label: 'Try later' },
];

export const ClassSkipConfirmModal: React.FC<ClassSkipConfirmModalProps> = ({
  isOpen,
  stage,
  conceptName,
  onConfirm,
  onCancel,
}) => {
  const [selectedReason, setSelectedReason] = useState<SkipReason>('already_know');

  // Handle Escape key to cancel
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const getStageTitle = () => {
    switch (stage) {
      case 'assessment':
        return 'Skip this assessment?';
      case 'challenge':
        return 'Skip this challenge?';
      case 'mission':
        return 'Skip this mission?';
      case 'predict':
        return 'Skip this prediction?';
      case 'quick_check':
        return 'Skip this check?';
      case 'interact':
        return 'Skip simulation?';
      default:
        return 'Skip this activity?';
    }
  };

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="skip-modal-title"
      aria-describedby="skip-modal-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-md p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-[#0F1629] to-[#0A0E1A] border border-white/[0.12] shadow-[0_16px_48px_rgba(0,0,0,0.6)] space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="skip-modal-title"
                className="font-sans font-bold text-base sm:text-lg text-white tracking-tight"
              >
                {getStageTitle()}
              </h2>
              <span className="font-mono text-[11px] text-slate-400">
                {conceptName}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel and keep going"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors focus-visible:ring-2 focus-visible:ring-indigo-400 outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning Notice */}
        <p
          id="skip-modal-desc"
          className="font-sans text-xs sm:text-sm text-slate-300 leading-relaxed"
        >
          You can continue to the next part of class, but Xpedition won&apos;t have evidence from this activity to update your mastery or confidence.
        </p>

        {/* Reason Selector */}
        <div className="space-y-1.5 pt-1">
          <span className="font-sans text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Reason (Optional)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
            {REASONS.map((r) => {
              const isSelected = selectedReason === r.reason;
              return (
                <button
                  key={r.reason}
                  type="button"
                  onClick={() => setSelectedReason(r.reason)}
                  className={`min-h-[36px] px-2.5 py-1.5 rounded-xl font-sans text-xs font-medium text-center transition-all outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                    isSelected
                      ? 'bg-indigo-500/25 border border-indigo-500/50 text-indigo-200'
                      : 'bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-slate-300'
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={() => onConfirm(selectedReason)}
            className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-xl border border-white/[0.12] hover:border-white/[0.25] bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white font-sans text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all focus-visible:ring-2 focus-visible:ring-indigo-400 outline-none"
          >
            <FastForward className="w-3.5 h-3.5 text-slate-400" />
            <span>Skip activity</span>
          </button>

          <button
            type="button"
            onClick={onCancel}
            autoFocus
            className="w-full sm:w-auto min-h-[44px] px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-450 hover:to-indigo-550 text-white font-sans text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all focus-visible:ring-2 focus-visible:ring-indigo-400 outline-none"
          >
            <span>Keep going</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClassSkipConfirmModal;
