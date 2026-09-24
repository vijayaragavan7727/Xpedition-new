'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Zap,
  HelpCircle,
  RotateCw,
  CheckCircle2,
  Bookmark,
  Sparkles,
  Layers,
} from 'lucide-react';
import { FlashcardContent, FlashcardColorTheme, FlashcardEmblem } from './types';

export interface LearningFlashcardProps {
  card: FlashcardContent;
  isFlipped?: boolean;
  onFlip?: (isFlipped: boolean) => void;
  onMarkStatus?: (status: 'KNOWN' | 'REVIEW') => void;
  className?: string;
  interactive?: boolean;
}

// Fixed color themes matching collectible study card palettes
const THEME_STYLES: Record<
  FlashcardColorTheme,
  {
    bgGradient: string;
    outerBorder: string;
    innerBorder: string;
    badgeBg: string;
    badgeText: string;
    accentGlow: string;
    backPattern: string;
  }
> = {
  navy: {
    bgGradient: 'from-[#0D4B81] via-[#0B3D6A] to-[#072B4D]',
    outerBorder: 'border-2 border-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.25)]',
    innerBorder: 'border-white/30',
    badgeBg: 'bg-[#153D73]',
    badgeText: 'text-sky-200',
    accentGlow: 'rgba(56, 189, 248, 0.2)',
    backPattern: 'radial-gradient(circle at 50% 50%, #153D73 1px, transparent 1px)',
  },
  forest: {
    bgGradient: 'from-[#1B5E3A] via-[#144E2E] to-[#0D3620]',
    outerBorder: 'border-2 border-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.25)]',
    innerBorder: 'border-white/30',
    badgeBg: 'bg-[#195636]',
    badgeText: 'text-emerald-200',
    accentGlow: 'rgba(52, 211, 153, 0.2)',
    backPattern: 'radial-gradient(circle at 50% 50%, #195636 1px, transparent 1px)',
  },
  terracotta: {
    bgGradient: 'from-[#B0411B] via-[#943414] to-[#6E240D]',
    outerBorder: 'border-2 border-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.25)]',
    innerBorder: 'border-white/30',
    badgeBg: 'bg-[#8F3B1D]',
    badgeText: 'text-amber-100',
    accentGlow: 'rgba(251, 146, 60, 0.2)',
    backPattern: 'radial-gradient(circle at 50% 50%, #8F3B1D 1px, transparent 1px)',
  },
  amber: {
    bgGradient: 'from-[#8C5D17] via-[#6B4610] to-[#472E09]',
    outerBorder: 'border-[#B87B20]',
    innerBorder: 'border-white/20',
    badgeBg: 'bg-[#7D5213]',
    badgeText: 'text-amber-200',
    accentGlow: 'rgba(245, 158, 11, 0.15)',
    backPattern: 'radial-gradient(circle at 50% 50%, #7D5213 1px, transparent 1px)',
  },
  slate: {
    bgGradient: 'from-[#253248] via-[#1B2537] to-[#121926]',
    outerBorder: 'border-[#3D5073]',
    innerBorder: 'border-white/20',
    badgeBg: 'bg-[#2B3B55]',
    badgeText: 'text-slate-200',
    accentGlow: 'rgba(148, 163, 184, 0.15)',
    backPattern: 'radial-gradient(circle at 50% 50%, #2B3B55 1px, transparent 1px)',
  },
  violet: {
    bgGradient: 'from-[#441D6C] via-[#331552] to-[#220E37]',
    outerBorder: 'border-[#682DA4]',
    innerBorder: 'border-white/20',
    badgeBg: 'bg-[#4F227D]',
    badgeText: 'text-purple-200',
    accentGlow: 'rgba(192, 132, 252, 0.15)',
    backPattern: 'radial-gradient(circle at 50% 50%, #4F227D 1px, transparent 1px)',
  },
};

const renderEmblem = (emblem?: FlashcardEmblem) => {
  switch (emblem) {
    case 'lightning':
      return <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300/30" />;
    case 'magnet':
      return <span className="text-xs leading-none">🧲</span>;
    case 'question':
      return <HelpCircle className="w-3.5 h-3.5 text-sky-300" />;
    case 'gear':
      return <span className="text-xs leading-none">⚙️</span>;
    case 'atom':
      return <span className="text-xs leading-none">⚛️</span>;
    default:
      return <Sparkles className="w-3.5 h-3.5 text-cyan-300" />;
  }
};

export const LearningFlashcard: React.FC<LearningFlashcardProps> = ({
  card,
  isFlipped: controlledFlipped,
  onFlip,
  onMarkStatus,
  className = '',
  interactive = true,
}) => {
  const [internalFlipped, setInternalFlipped] = useState(false);
  const isFlipped = controlledFlipped !== undefined ? controlledFlipped : internalFlipped;

  const themeKey = card.colorTheme || 'navy';
  const theme = THEME_STYLES[themeKey] || THEME_STYLES.navy;
  const rotationAngle = card.rotation ?? 0;

  const handleToggleFlip = () => {
    if (!interactive) return;
    const next = !isFlipped;
    setInternalFlipped(next);
    onFlip?.(next);
  };

  return (
    <div
      className={`learning-flashcard-wrapper group relative inline-block select-none ${className}`}
      style={{
        perspective: '1200px',
        transform: `rotate(${rotationAngle}deg)`,
        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      {/* Outer Card Body with 3D Flip */}
      <div
        role="button"
        tabIndex={interactive ? 0 : -1}
        aria-label={`${card.title} Flashcard. ${isFlipped ? 'Answer side' : 'Question side'}. Tap to flip.`}
        onClick={handleToggleFlip}
        onKeyDown={(e) => {
          if (interactive && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            handleToggleFlip();
          }
        }}
        className={`relative w-[240px] sm:w-[265px] h-[370px] sm:h-[400px] cursor-pointer transition-transform duration-500 rounded-[20px] focus:outline-none focus:ring-2 focus:ring-cyan-400/80 ${
          isFlipped ? '[transform:rotateY(180deg)]' : '[transform:rotateY(0deg)]'
        }`}
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        {/* ===================================================================
            FRONT FACE (Tactile Study / Collectible Card Front)
           =================================================================== */}
        <div
          className={`absolute inset-0 w-full h-full rounded-[20px] bg-gradient-to-b ${theme.bgGradient} border-[1.5px] ${theme.outerBorder} p-3 flex flex-col justify-between overflow-hidden shadow-[0_18px_36px_-6px_rgba(0,0,0,0.7),0_6px_16px_rgba(0,0,0,0.4)] [backface-visibility:hidden]`}
          style={{
            boxShadow:
              '0 18px 36px -6px rgba(0,0,0,0.7), 0 4px 12px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.22), inset 0 -2px 3px rgba(0,0,0,0.5)',
          }}
        >
          {/* Inner hairline printed border (Physical cardstock design) */}
          <div
            className={`absolute inset-1.5 rounded-[15px] border ${theme.innerBorder} pointer-events-none`}
          />

          {/* Card Top Row: Emblem Pill + Title + Number */}
          <div className="relative z-10 flex items-center justify-between pt-1 px-1">
            {/* Emblem Pill */}
            <div
              className={`w-6 h-6 rounded-full ${theme.badgeBg} border border-white/20 flex items-center justify-center shadow-inner`}
            >
              {renderEmblem(card.emblem)}
            </div>

            {/* Title */}
            <h3 className="font-sans font-black text-xs sm:text-[13px] tracking-wider uppercase text-white/95 truncate px-2 text-center drop-shadow-sm">
              {card.title}
            </h3>

            {/* Card Sequence Number */}
            <span className="font-mono text-xs font-black tracking-widest text-white/70">
              {card.cardNumber || '01'}
            </span>
          </div>

          {/* Central 3D Illustration Area */}
          <div className="relative z-10 flex-1 my-2 flex items-center justify-center overflow-hidden">
            {card.illustrationUrl ? (
              <div className="relative w-full h-full max-h-[145px] sm:max-h-[160px] flex items-center justify-center p-1">
                <Image
                  src={card.illustrationUrl}
                  alt={card.illustrationAlt || card.title}
                  width={200}
                  height={150}
                  className="max-h-full object-contain filter drop-shadow-[0_10px_18px_rgba(0,0,0,0.65)] transform hover:scale-105 transition-transform duration-300"
                />
              </div>
            ) : (
              /* Fallback tactile 3D emblem representation */
              <div className="w-24 h-24 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center shadow-inner">
                <div className="w-16 h-16 rounded-full bg-white/[0.08] flex items-center justify-center text-3xl">
                  {renderEmblem(card.emblem)}
                </div>
              </div>
            )}
          </div>

          {/* Dotted Divider Rule */}
          <div className="relative z-10 w-full border-b border-dotted border-white/30 my-0.5" />

          {/* Question Text */}
          <div className="relative z-10 px-1 py-1 text-center min-h-[46px] flex items-center justify-center">
            <p className="font-sans text-xs sm:text-[12.5px] font-semibold text-white/95 leading-snug drop-shadow-sm">
              {card.front.question}
            </p>
          </div>

          {/* Bottom Physical Parchment / Answer Cutout Badge */}
          <div className="relative z-10 w-full mt-1">
            <div
              className="w-full bg-[#FAF5EB] rounded-xl px-2.5 py-1.5 border border-[#E2D8C3] shadow-[0_4px_8px_rgba(0,0,0,0.25)] flex flex-col justify-center text-left"
              style={{
                boxShadow:
                  '0 3px 6px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.8)',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] font-bold tracking-widest uppercase text-slate-500">
                  ANSWER
                </span>
                <span className="text-[9px] font-mono text-slate-400 flex items-center gap-0.5">
                  <RotateCw className="w-2.5 h-2.5" />
                  <span>Tap to flip</span>
                </span>
              </div>
              <p className="font-sans text-[11px] sm:text-[11.5px] font-bold text-slate-900 leading-snug truncate mt-0.5">
                {card.front.answerPreview || card.back.answer}
              </p>
            </div>
          </div>
        </div>

        {/* ===================================================================
            BACK FACE (Collectible Card Back + Deep Explanation)
           =================================================================== */}
        <div
          className={`absolute inset-0 w-full h-full rounded-[20px] bg-gradient-to-b ${theme.bgGradient} border-[1.5px] ${theme.outerBorder} p-3 flex flex-col justify-between overflow-hidden shadow-[0_18px_36px_-6px_rgba(0,0,0,0.7),0_6px_16px_rgba(0,0,0,0.4)] [transform:rotateY(180deg)] [backface-visibility:hidden]`}
          style={{
            boxShadow:
              '0 18px 36px -6px rgba(0,0,0,0.7), 0 4px 12px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.22), inset 0 -2px 3px rgba(0,0,0,0.5)',
          }}
        >
          {/* Inner hairline printed border */}
          <div
            className={`absolute inset-1.5 rounded-[15px] border ${theme.innerBorder} pointer-events-none`}
          />

          {/* Subtle patterned watermark background */}
          <div
            className="absolute inset-2 opacity-5 pointer-events-none rounded-[14px]"
            style={{
              backgroundImage: theme.backPattern,
              backgroundSize: '12px 12px',
            }}
          />

          {/* Top Row: Back Badge + Title + Sequence */}
          <div className="relative z-10 flex items-center justify-between pt-1 px-1">
            <span className="font-mono text-[10px] font-bold tracking-widest uppercase text-white/70">
              {card.cardNumber ? `CARD ${card.cardNumber}` : 'EXPLANATION'}
            </span>
            <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-white/90">
              {card.title}
            </span>
            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white/70 text-xs">
              ✓
            </span>
          </div>

          {/* Primary Answer Section */}
          <div className="relative z-10 my-auto py-2 space-y-2">
            <div className="bg-[#FAF5EB] rounded-xl p-2.5 border border-[#E2D8C3] shadow-[0_3px_6px_rgba(0,0,0,0.2)]">
              <span className="font-mono text-[9px] font-bold tracking-widest uppercase text-slate-500 block mb-0.5">
                CORRECT ANSWER
              </span>
              <p className="font-sans text-xs sm:text-[13px] font-bold text-slate-900 leading-snug">
                {card.back.answer}
              </p>
            </div>

            {/* In-depth Conceptual Breakdown */}
            {card.back.explanation && (
              <div className="p-2 rounded-xl bg-black/25 border border-white/10 text-left">
                <span className="font-mono text-[9px] font-semibold text-cyan-300 block mb-1 uppercase tracking-wider">
                  Physical Mechanism
                </span>
                <p className="font-sans text-[11px] text-slate-200 leading-relaxed">
                  {card.back.explanation}
                </p>
              </div>
            )}

            {/* Key Takeaway Bullet if present */}
            {card.back.keyTakeaway && (
              <div className="px-2 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-left flex items-start gap-1.5">
                <span className="text-amber-400 text-xs leading-none mt-0.5">★</span>
                <p className="font-sans text-[10px] text-amber-200/90 leading-tight font-medium">
                  {card.back.keyTakeaway}
                </p>
              </div>
            )}
          </div>

          {/* Action Row: Flip Back + Mastery Marking */}
          <div className="relative z-10 pt-1 border-t border-white/15 flex items-center justify-between gap-1 text-[10px] font-mono">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleFlip();
              }}
              className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 flex items-center gap-1 transition-colors"
            >
              <RotateCw className="w-3 h-3" />
              <span>Flip Back</span>
            </button>

            {onMarkStatus && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkStatus('REVIEW');
                  }}
                  className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 flex items-center gap-1 transition-colors"
                  title="Mark for Review"
                >
                  <Bookmark className="w-3 h-3" />
                  <span>Review</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkStatus('KNOWN');
                  }}
                  className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 flex items-center gap-1 transition-colors"
                  title="Mark as Known"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Known</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningFlashcard;
