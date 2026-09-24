'use client';

import React, { useState } from 'react';
import {
  Lightbulb,
  RotateCcw,
  Target,
  AlertCircle,
  Star,
  HelpCircle,
  FileText,
  Brain,
} from 'lucide-react';
import { StickyNoteContent, StickyNoteColor, StickyNoteType } from './types';

export interface StickyNoteProps {
  note: StickyNoteContent;
  onEdit?: (content: string) => void;
  className?: string;
  interactive?: boolean;
}

// Color palettes for authentic physical sticky notes
const PALETTE_STYLES: Record<
  StickyNoteColor,
  {
    bg: string;
    border: string;
    headerText: string;
    bodyText: string;
    cornerShadow: string;
    tapeOrShadow: string;
  }
> = {
  yellow: {
    bg: 'bg-gradient-to-br from-[#FFF9A6] via-[#FEF08A] to-[#FDE047]',
    border: 'border-[#EAB308]/40',
    headerText: 'text-[#854D0E]',
    bodyText: 'text-[#422006]',
    cornerShadow: '#CA8A04',
    tapeOrShadow: 'rgba(234, 179, 8, 0.35)',
  },
  green: {
    bg: 'bg-gradient-to-br from-[#DCFCE7] via-[#BBF7D0] to-[#86EFAC]',
    border: 'border-[#22C55E]/40',
    headerText: 'text-[#166534]',
    bodyText: 'text-[#14532D]',
    cornerShadow: '#16A34A',
    tapeOrShadow: 'rgba(34, 197, 94, 0.35)',
  },
  blue: {
    bg: 'bg-gradient-to-br from-[#E0F2FE] via-[#BAE6FD] to-[#7DD3FC]',
    border: 'border-[#0EA5E9]/40',
    headerText: 'text-[#075985]',
    bodyText: 'text-[#0C4A6E]',
    cornerShadow: '#0284C7',
    tapeOrShadow: 'rgba(14, 165, 233, 0.35)',
  },
  pink: {
    bg: 'bg-gradient-to-br from-[#FFE4E6] via-[#FECDD3] to-[#FDA4AF]',
    border: 'border-[#F43F5E]/40',
    headerText: 'text-[#9F1239]',
    bodyText: 'text-[#881337]',
    cornerShadow: '#E11D48',
    tapeOrShadow: 'rgba(244, 63, 94, 0.35)',
  },
  orange: {
    bg: 'bg-gradient-to-br from-[#FFEDD5] via-[#FED7AA] to-[#FDBA74]',
    border: 'border-[#F97316]/40',
    headerText: 'text-[#9A3412]',
    bodyText: 'text-[#7C2D12]',
    cornerShadow: '#EA580C',
    tapeOrShadow: 'rgba(249, 115, 22, 0.35)',
  },
  lavender: {
    bg: 'bg-gradient-to-br from-[#F3E8FF] via-[#E9D5FF] to-[#D8B4FE]',
    border: 'border-[#A855F7]/40',
    headerText: 'text-[#6B21A8]',
    bodyText: 'text-[#581C87]',
    cornerShadow: '#9333EA',
    tapeOrShadow: 'rgba(168, 85, 247, 0.35)',
  },
};

// Default colors & titles for note types
const TYPE_CONFIG: Record<
  StickyNoteType,
  { defaultColor: StickyNoteColor; defaultTitle: string; icon: React.ReactNode }
> = {
  key_idea: {
    defaultColor: 'yellow',
    defaultTitle: 'KEY IDEA',
    icon: <Lightbulb className="w-3.5 h-3.5 stroke-[2.5]" />,
  },
  remember: {
    defaultColor: 'green',
    defaultTitle: 'REMEMBER',
    icon: <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />,
  },
  try_this: {
    defaultColor: 'blue',
    defaultTitle: 'TRY THIS',
    icon: <Target className="w-3.5 h-3.5 stroke-[2.5]" />,
  },
  common_mistake: {
    defaultColor: 'pink',
    defaultTitle: 'COMMON MISTAKE',
    icon: <AlertCircle className="w-3.5 h-3.5 stroke-[2.5]" />,
  },
  hint: {
    defaultColor: 'orange',
    defaultTitle: 'HINT',
    icon: <Star className="w-3.5 h-3.5 stroke-[2.5]" />,
  },
  question: {
    defaultColor: 'lavender',
    defaultTitle: 'QUESTION',
    icon: <HelpCircle className="w-3.5 h-3.5 stroke-[2.5]" />,
  },
  example: {
    defaultColor: 'yellow',
    defaultTitle: 'EXAMPLE',
    icon: <FileText className="w-3.5 h-3.5 stroke-[2.5]" />,
  },
  think_about_this: {
    defaultColor: 'lavender',
    defaultTitle: 'THINK ABOUT THIS',
    icon: <Brain className="w-3.5 h-3.5 stroke-[2.5]" />,
  },
};

export const StickyNote: React.FC<StickyNoteProps> = ({
  note,
  onEdit,
  className = '',
  interactive = true,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const typeConfig = TYPE_CONFIG[note.type] || TYPE_CONFIG.key_idea;
  const colorKey = note.color || typeConfig.defaultColor;
  const palette = PALETTE_STYLES[colorKey] || PALETTE_STYLES.yellow;
  const title = note.title || typeConfig.defaultTitle;
  const rotationAngle = note.rotation ?? -1.5;

  return (
    <div
      className={`sticky-note-wrapper inline-block select-none ${className}`}
      style={{
        transform: isFocused
          ? 'rotate(0deg) scale(1.04)'
          : `rotate(${rotationAngle}deg)`,
        transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
        zIndex: isFocused ? 20 : 1,
      }}
    >
      <div
        role="article"
        aria-label={`${title} Sticky Note: ${note.content}`}
        tabIndex={interactive ? 0 : -1}
        onClick={() => interactive && setIsFocused(!isFocused)}
        onKeyDown={(e) => {
          if (interactive && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setIsFocused(!isFocused);
          }
        }}
        className={`relative w-[190px] sm:w-[210px] min-h-[175px] sm:min-h-[190px] p-4 ${palette.bg} rounded-tr-lg rounded-tl-sm rounded-bl-sm border ${palette.border} flex flex-col justify-between cursor-pointer transition-shadow duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
          isFocused ? 'shadow-[0_18px_32px_rgba(0,0,0,0.32)]' : 'shadow-[0_10px_20px_-4px_rgba(0,0,0,0.22),0_4px_8px_rgba(0,0,0,0.12)]'
        }`}
        style={{
          boxShadow: isFocused
            ? '0 18px 32px -4px rgba(0,0,0,0.32), 0 6px 12px rgba(0,0,0,0.15)'
            : '0 10px 20px -4px rgba(0,0,0,0.20), 0 4px 8px rgba(0,0,0,0.10), inset 0 -1px 2px rgba(0,0,0,0.05)',
        }}
      >
        {/* Subtle top sticky adhesive gradient strip */}
        <div className="absolute top-0 inset-x-0 h-4 bg-black/[0.03] pointer-events-none rounded-t-sm" />

        {/* Header row: Icon + Bold Uppercase Category */}
        <div className="relative z-10 flex items-center gap-1.5 pb-1 border-b border-black/[0.08]">
          <span className={palette.headerText}>{typeConfig.icon}</span>
          <span
            className={`font-sans font-black text-[11px] sm:text-[11.5px] tracking-wider uppercase ${palette.headerText}`}
          >
            {title}
          </span>
        </div>

        {/* Authentic Handwritten / Marker Typography Body */}
        <div className="relative z-10 flex-1 my-2 flex items-center justify-center text-center px-1">
          <p
            className={`font-kalam font-bold text-base sm:text-[18px] leading-snug tracking-wide ${palette.bodyText} drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]`}
            style={{
              fontFamily: 'var(--font-kalam), var(--font-caveat), cursive',
            }}
          >
            {note.content}
          </p>
        </div>

        {/* Bottom Metadata & Tap hint */}
        <div className="relative z-10 pt-1 flex items-center justify-between text-[9px] font-mono opacity-60">
          <span className={palette.headerText}>
            {note.author ? `— ${note.author}` : 'XPEDITION NOTE'}
          </span>
          <span className={palette.headerText}>
            {isFocused ? 'Tap to close' : 'Tap to focus'}
          </span>
        </div>

        {/* Realistic Physical Corner Curl (Bottom-Right) */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 right-0 w-6 h-6 pointer-events-none overflow-hidden"
        >
          {/* Ambient shadow underneath curled paper edge */}
          <div
            className="absolute bottom-0 right-0 w-6 h-6 bg-black/25 blur-[1.5px]"
            style={{
              clipPath: 'polygon(100% 0, 0 100%, 100% 100%)',
            }}
          />
          {/* Curled fold flap with subtle highlight */}
          <div
            className="absolute bottom-0 right-0 w-6 h-6 bg-white/70"
            style={{
              clipPath: 'polygon(100% 0, 0 100%, 0 0)',
              transformOrigin: 'bottom right',
              boxShadow: '-2px -2px 4px rgba(0,0,0,0.15)',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default StickyNote;
