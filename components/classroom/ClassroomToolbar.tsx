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
  className?: string;
}

export const ClassroomToolbar: React.FC<ClassroomToolbarProps> = ({
  activeTool,
  onSelectTool,
  hasFormulas = false,
  hasQuestions = true,
  hasHint = true,
  hasFlashcards = true,
  hasSources = true,
  isAudioPlaying = false,
  onToggleAudio,
  className = '',
}) => {
  const tools: {
    id: ClassroomToolType;
    label: string;
    icon: React.ReactNode;
    isAudioToggle?: boolean;
  }[] = [
    {
      id: 'lesson',
      label: 'Lesson',
      icon: <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    ...(hasQuestions
      ? [
          {
            id: 'questions' as ClassroomToolType,
            label: 'Questions',
            icon: <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />,
          },
        ]
      : []),
    {
      id: 'audio',
      label: 'Audio',
      icon: (
        <Volume2
          className={`w-4 h-4 sm:w-5 sm:h-5 ${
            isAudioPlaying ? 'animate-pulse text-sky-400' : ''
          }`}
        />
      ),
      isAudioToggle: true,
    },
    ...(hasHint
      ? [
          {
            id: 'hint' as ClassroomToolType,
            label: 'Hint',
            icon: <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />,
          },
        ]
      : []),
    {
      id: 'notes',
      label: 'Notes',
      icon: <FileText className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    ...(hasFormulas
      ? [
          {
            id: 'formula' as ClassroomToolType,
            label: 'Formula',
            icon: (
              <span className="font-serif font-bold text-base sm:text-lg leading-none">
                ∑
              </span>
            ),
          },
        ]
      : []),
    ...(hasFlashcards
      ? [
          {
            id: 'flashcards' as ClassroomToolType,
            label: 'Flashcards',
            icon: <Layers className="w-4 h-4 sm:w-5 sm:h-5" />,
          },
        ]
      : []),
    ...(hasSources
      ? [
          {
            id: 'sources' as ClassroomToolType,
            label: 'Sources',
            icon: <Link2 className="w-4 h-4 sm:w-5 sm:h-5" />,
          },
        ]
      : []),
  ];

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <nav
        aria-label="Classroom learning tools"
        className="relative flex items-center justify-start sm:justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-[#090F24]/95 border border-sky-500/25 backdrop-blur-2xl shadow-[0_10px_32px_rgba(0,0,0,0.8),0_0_20px_rgba(14,165,233,0.15)] overflow-x-auto select-none no-scrollbar max-w-full"
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
              onClick={() => {
                if (t.isAudioToggle && onToggleAudio) {
                  onToggleAudio();
                } else {
                  onSelectTool(t.id);
                }
              }}
              className={`group flex flex-col items-center justify-center gap-0.5 px-2.5 sm:px-3.5 py-1 min-h-[44px] min-w-[50px] sm:min-w-[62px] rounded-xl transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-b from-sky-600/50 to-blue-700/60 text-white border border-sky-400/50 shadow-[0_0_14px_rgba(14,165,233,0.35)]'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.05] border border-transparent'
              }`}
            >
              <div
                className={`transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                {t.icon}
              </div>
              <span
                className={`text-[9.5px] sm:text-[10.5px] font-sans font-medium tracking-tight leading-none ${
                  isActive ? 'text-white font-semibold' : 'text-slate-400'
                }`}
              >
                {t.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default ClassroomToolbar;

