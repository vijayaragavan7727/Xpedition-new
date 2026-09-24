'use client';

import React from 'react';
import { XP_COLORS, ClassStageKey } from '@/lib/design-system/tokens';
import {
  Sparkles,
  BookOpen,
  Compass,
  HelpCircle,
  Play,
  Eye,
  CheckCircle2,
  Target,
  Trophy,
  Award,
  BarChart2,
  Gift,
  ArrowRight,
} from 'lucide-react';

export interface ClassStageIndicatorProps {
  currentStage: ClassStageKey;
  stageIndex?: number; // e.g. 3
  totalStages?: number; // e.g. 8
  onPrevious?: () => void;
  onNext?: () => void;
  canPrevious?: boolean;
  canNext?: boolean;
  compact?: boolean;
  className?: string;
}

const STAGE_ICONS: Record<ClassStageKey, React.ReactNode> = {
  intro: <Sparkles className="w-3.5 h-3.5" />,
  explain: <BookOpen className="w-3.5 h-3.5" />,
  explore: <Compass className="w-3.5 h-3.5" />,
  predict: <HelpCircle className="w-3.5 h-3.5" />,
  interact: <Play className="w-3.5 h-3.5" />,
  observe: <Eye className="w-3.5 h-3.5" />,
  check: <CheckCircle2 className="w-3.5 h-3.5" />,
  mission: <Target className="w-3.5 h-3.5" />,
  challenge: <Trophy className="w-3.5 h-3.5" />,
  assessment: <Award className="w-3.5 h-3.5" />,
  feedback: <BarChart2 className="w-3.5 h-3.5" />,
  reward: <Gift className="w-3.5 h-3.5" />,
  next: <ArrowRight className="w-3.5 h-3.5" />,
};

export const ClassStageIndicator: React.FC<ClassStageIndicatorProps> = ({
  currentStage,
  stageIndex = 3,
  totalStages = 8,
  onPrevious,
  onNext,
  canPrevious = true,
  canNext = true,
  compact = false,
  className = '',
}) => {
  const stageConfig = XP_COLORS.stage[currentStage] || XP_COLORS.stage.explore;
  const stageIcon = STAGE_ICONS[currentStage] || <Compass className="w-3.5 h-3.5" />;

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold border transition-all ${className}`}
        style={{
          backgroundColor: stageConfig.soft,
          borderColor: `${stageConfig.color}40`,
          color: stageConfig.color,
        }}
      >
        <span className="shrink-0">{stageIcon}</span>
        <span className="font-mono">{stageIndex}/{totalStages}</span>
        <span className="uppercase tracking-wider text-[11px]">{stageConfig.label}</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#151B1B] border border-[#263130] shadow-sm select-none ${className}`}
    >
      {/* Previous Step Button */}
      <button
        type="button"
        onClick={onPrevious}
        disabled={!canPrevious || !onPrevious}
        aria-label="Previous stage"
        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8E9693] hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:pointer-events-none transition-colors"
      >
        ‹
      </button>

      {/* Stage Badge & Step Count */}
      <div className="flex items-center gap-2 px-2">
        <span className="font-mono text-xs font-bold text-white">
          {stageIndex}/{totalStages}
        </span>
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider"
          style={{
            backgroundColor: stageConfig.soft,
            color: stageConfig.color,
            border: `1px solid ${stageConfig.color}35`,
          }}
        >
          {stageIcon}
          <span>{stageConfig.label}</span>
        </div>
      </div>

      {/* Next Step Button */}
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext || !onNext}
        aria-label="Next stage"
        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8E9693] hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:pointer-events-none transition-colors"
      >
        ›
      </button>
    </div>
  );
};

export default ClassStageIndicator;
