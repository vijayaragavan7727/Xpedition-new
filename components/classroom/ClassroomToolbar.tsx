'use client';

import React from 'react';
import {
  BookOpen,
  HelpCircle,
  Volume2,
  Lightbulb,
  FileText,
  Calculator,
  Layers,
  Link2,
  Calendar,
} from 'lucide-react';
import { ClassroomToolType } from './types';

export interface ClassroomToolbarProps {
  activeTool: ClassroomToolType | null;
  onSelectTool: (tool: ClassroomToolType) => void;
  hasFormulas?: boolean;
  hasQuestions?: boolean;
  hasHint?: boolean;
  hasFlashcards?: boolean;
  hasSources?: boolean;
  isAudioPlaying?: boolean;
  onToggleAudio?: () => void;
  conceptProgress?: number;
  /** Checks answered correctly on the FIRST attempt (evidence, not clicks). */
  checksFirstTry?: number;
  /** Total checks in the lesson. */
  checksTotal?: number;
  className?: string;
}

export const ClassroomToolbar: React.FC<ClassroomToolbarProps> = React.memo(({
  activeTool,
  onSelectTool,
  hasFormulas = false,
  hasQuestions = true,
  hasHint = true,
  hasFlashcards = true,
  hasSources = true,
  isAudioPlaying = false,
  onToggleAudio,
  conceptProgress = 0,
  checksFirstTry = 0,
  checksTotal = 0,
  className = '',
}) => {
  const tools = React.useMemo(() => [
    {
      id: 'lesson' as ClassroomToolType,
      label: 'Lesson',
      icon: <BookOpen className="w-[18px] h-[18px] lg:w-[22px] lg:h-[22px]" />,
    },
    ...(hasQuestions
      ? [
          {
            id: 'questions' as ClassroomToolType,
            label: 'Questions',
            icon: <HelpCircle className="w-[18px] h-[18px] lg:w-[22px] lg:h-[22px]" />,
          },
        ]
      : []),
    ...(onToggleAudio
      ? [
          {
            id: 'audio' as ClassroomToolType,
            label: isAudioPlaying ? 'Mute' : 'Audio',
            icon: <Volume2 className={`w-[18px] h-[18px] lg:w-[22px] lg:h-[22px] ${isAudioPlaying ? 'text-cyan-400 animate-pulse' : ''}`} />,
            isAudioToggle: true,
          },
        ]
      : []),
    ...(hasHint
      ? [
          {
            id: 'hint' as ClassroomToolType,
            label: 'Hint',
            icon: <Lightbulb className="w-[18px] h-[18px] lg:w-[22px] lg:h-[22px]" />,
          },
        ]
      : []),
    {
      id: 'notes' as ClassroomToolType,
      label: 'Notes',
      icon: <FileText className="w-[18px] h-[18px] lg:w-[22px] lg:h-[22px]" />,
    },
    ...(hasFormulas
      ? [
          {
            id: 'formula' as ClassroomToolType,
            label: 'Formula',
            icon: <Calculator className="w-[18px] h-[18px] lg:w-[22px] lg:h-[22px]" />,
          },
        ]
      : []),
    ...(hasFlashcards
      ? [
          {
            id: 'flashcards' as ClassroomToolType,
            label: 'Cards',
            icon: <Layers className="w-[18px] h-[18px] lg:w-[22px] lg:h-[22px]" />,
          },
        ]
      : []),
    ...(hasSources
      ? [
          {
            id: 'sources' as ClassroomToolType,
            label: 'Sources',
            icon: <Link2 className="w-[18px] h-[18px] lg:w-[22px] lg:h-[22px]" />,
          },
        ]
      : []),
  ], [hasQuestions, onToggleAudio, isAudioPlaying, hasHint, hasFormulas, hasFlashcards, hasSources]);

  return (
    <div className={`relative flex items-center justify-center max-w-full min-w-0 ${className}`}>
      <nav
        aria-label="Classroom learning tools"
        className="relative flex items-center justify-start sm:justify-center gap-0.5 sm:gap-1 lg:gap-2 px-1.5 sm:px-3 lg:px-4 py-1 lg:py-1.5 rounded-2xl bg-[#0A1230]/80 border border-sky-400/20 backdrop-blur-md shadow-[0_14px_40px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.08)] overflow-x-auto select-none no-scrollbar max-w-full"
      >
        {/* Leftmost Glowing Indicator Bar (from reference) */}
        <div className="hidden sm:block w-1 h-6 rounded-full bg-gradient-to-b from-sky-400 to-cyan-500 shadow-[0_0_8px_rgba(56,189,248,0.8)] mr-1 shrink-0" />

        {tools.map((t) => {
          const isActive = activeTool === t.id || (!activeTool && t.id === 'lesson');
          return (
            <button
              key={t.id}
              type="button"
              aria-label={t.label}
              aria-pressed={t.isAudioToggle ? isAudioPlaying : isActive}
              onClick={() => {
                if (t.isAudioToggle && onToggleAudio) {
                  onToggleAudio();
                } else {
                  onSelectTool(t.id);
                }
              }}
              className={`group flex flex-col items-center justify-center gap-1 px-2 sm:px-3 lg:px-4 py-1 min-h-[46px] lg:min-h-[54px] min-w-[52px] sm:min-w-[62px] lg:min-w-[74px] rounded-xl transition-all shrink-0 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300 ${
                isActive
                  ? 'bg-sky-500/15 text-white border border-sky-400/45 shadow-[0_0_16px_rgba(56,189,248,0.35)]'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.05] border border-transparent'
              }`}
            >
              <div
                className={`transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? 'text-sky-300' : 'text-slate-300 group-hover:text-white'
                }`}
              >
                {t.icon}
              </div>
              <span
                className={`text-[10px] sm:text-[11px] lg:text-[12px] font-sans font-medium tracking-tight leading-none ${
                  isActive ? 'text-sky-200 font-semibold' : 'text-slate-300'
                }`}
              >
                {t.label}
              </span>
            </button>
          );
        })}

        {/* Progress: position in the lesson + first-try evidence (never step XP) */}
        <div data-testid="dock-progress" role="group" aria-label="Progress" className="flex items-center gap-1.5 pl-1 sm:pl-2 ml-0.5 sm:ml-1 border-l border-white/[0.08] shrink-0">
          <div className="flex flex-col items-center justify-center px-1.5 sm:px-2 py-0.5 rounded-lg bg-white/[0.03] text-center" title="Position in this lesson">
            <span className="text-[10px] sm:text-[11px] font-mono text-cyan-400 font-bold leading-none">
              {conceptProgress}%
            </span>
            <span className="text-[9px] sm:text-[10px] text-slate-400 font-sans leading-none mt-0.5">
              Lesson
            </span>
          </div>

          {checksTotal > 0 && (
            <div
              data-testid="evidence-badge"
              className="flex flex-col items-center justify-center px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-center"
              title="Checks answered correctly on the first attempt"
            >
              <span className="text-[10px] sm:text-[11px] font-mono font-bold leading-none">
                {checksFirstTry}/{checksTotal}
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-sans leading-none mt-0.5">First try</span>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
});

ClassroomToolbar.displayName = 'ClassroomToolbar';

export default ClassroomToolbar;

