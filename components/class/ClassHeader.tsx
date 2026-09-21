'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Box } from 'lucide-react';
import { Badge, ProgressBar } from '@/components/ui';
import { ClassStageId } from '@/lib/class/types';
import { XP_COLORS, ClassStageKey } from '@/lib/design-system/tokens';

export interface ClassHeaderProps {
  subject: string;
  conceptName: string;
  classNumber: number;
  totalClasses: number;
  currentStage: ClassStageId;
  stageIndex: number; // e.g. 3
  totalStages: number; // e.g. 13
  xpReward: number;
  modality?: string;
  onPreviousStage?: () => void;
  onNextStage?: () => void;
  backHref?: string;
}

import { BuddyPresence } from '@/components/buddy/BuddyPresence';
import { getBuddyStateForClassStage } from '@/components/buddy/BuddyState';

export const ClassHeader: React.FC<ClassHeaderProps> = ({
  subject,
  conceptName,
  classNumber,
  totalClasses,
  currentStage,
  stageIndex,
  totalStages,
  xpReward,
  modality = 'FULL_3D',
  onPreviousStage,
  onNextStage,
  backHref = '/learn',
}) => {
  const stageConfig = XP_COLORS.stage[currentStage as ClassStageKey] || XP_COLORS.stage.explore;
  const buddyState = getBuddyStateForClassStage(currentStage);

  return (
    <header className="w-full bg-[#060B18]/90 backdrop-blur-xl border-b border-white/[0.08] px-4 py-3 sm:px-6 select-none shrink-0 z-20">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Exit & Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={backHref}
            aria-label="Exit class"
            className="w-9 h-9 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white flex items-center justify-center transition-colors shrink-0 border border-white/[0.08]"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-sans text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
                {subject}
              </span>
              <span className="text-slate-600 text-xs">•</span>
              <span className="font-mono text-[11px] text-slate-400 font-medium">
                Class {classNumber} of {totalClasses}
              </span>
            </div>
            <h1 className="font-sans font-bold text-sm sm:text-base text-white tracking-tight truncate">
              {conceptName}
            </h1>
          </div>
        </div>

        {/* Center: Stage Step Navigator & Segmented Progress (Hidden on smallest screens) */}
        <div className="hidden md:flex flex-col items-center gap-1.5 min-w-[280px]">
          {/* Segmented Stage Capsules */}
          <div className="w-full max-w-[240px]">
            <ProgressBar
              segments={totalStages}
              currentSegment={stageIndex - 1}
              size="xs"
              variant="indigo"
            />
          </div>

          {/* Interactive Step Pill */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPreviousStage}
              disabled={stageIndex <= 1 || !onPreviousStage}
              aria-label="Previous step"
              className="text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none text-xs px-1"
            >
              ‹
            </button>

            <span className="font-mono text-xs font-bold text-slate-300">
              {stageIndex}/{totalStages}
            </span>

            <div
              className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border"
              style={{
                backgroundColor: stageConfig.soft,
                color: stageConfig.color,
                borderColor: `${stageConfig.color}40`,
              }}
            >
              {stageConfig.label}
            </div>

            <button
              type="button"
              onClick={onNextStage}
              disabled={stageIndex >= totalStages || !onNextStage}
              aria-label="Next step"
              className="text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none text-xs px-1"
            >
              ›
            </button>
          </div>
        </div>

        {/* Right: Buddy Presence, Modality & XP Badge */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="hidden lg:block">
            <BuddyPresence
              mode="compact"
              state={buddyState}
            />
          </div>

          <Badge variant="3d" size="sm" icon={<Box className="w-3 h-3 text-indigo-300" />}>
            {modality === 'FULL_3D' ? '3D' : 'Visual'}
          </Badge>

          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>+{xpReward} XP</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ClassHeader;
