'use client';

import React, { useState } from 'react';
import { Layers, Bookmark, Sparkles, Filter, RotateCcw } from 'lucide-react';
import {
  FlashcardContent,
  FormulaCardContent,
  StickyNoteContent,
} from './types';
import LearningFlashcard from './LearningFlashcard';
import FormulaCard from './FormulaCard';
import StickyNote from './StickyNote';
import {
  DEMO_FLASHCARDS,
  DEMO_FORMULA_CARDS,
  DEMO_STICKY_NOTES,
} from './demoContent';

export interface PhysicalDeskCollectionProps {
  flashcards?: FlashcardContent[];
  formulaCards?: FormulaCardContent[];
  stickyNotes?: StickyNoteContent[];
  className?: string;
  initialFilter?: 'all' | 'flashcards' | 'formulas' | 'notes';
  showFilterControls?: boolean;
}

export const PhysicalDeskCollection: React.FC<PhysicalDeskCollectionProps> = ({
  flashcards = DEMO_FLASHCARDS,
  formulaCards = DEMO_FORMULA_CARDS,
  stickyNotes = DEMO_STICKY_NOTES,
  className = '',
  initialFilter = 'all',
  showFilterControls = true,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'flashcards' | 'formulas' | 'notes'>(initialFilter);
  const [cardStatusMap, setCardStatusMap] = useState<Record<string, 'KNOWN' | 'REVIEW'>>({});

  const handleMarkCard = (cardId: string, status: 'KNOWN' | 'REVIEW') => {
    setCardStatusMap((prev) => ({ ...prev, [cardId]: status }));
  };

  const showFlashcards = activeFilter === 'all' || activeFilter === 'flashcards';
  const showFormulas = activeFilter === 'all' || activeFilter === 'formulas';
  const showNotes = activeFilter === 'all' || activeFilter === 'notes';

  return (
    <div
      className={`physical-desk-surface relative rounded-3xl overflow-hidden p-4 sm:p-6 lg:p-8 select-none border border-[#6E472D]/50 shadow-[0_24px_64px_rgba(0,0,0,0.85)] ${className}`}
      style={{
        backgroundColor: '#382216',
        backgroundImage: `
          radial-gradient(ellipse at 50% 20%, rgba(255, 215, 160, 0.08) 0%, transparent 60%),
          linear-gradient(180deg, #3A2317 0%, #29180F 100%)
        `,
        boxShadow:
          '0 25px 60px -15px rgba(0,0,0,0.9), inset 0 2px 4px rgba(255,255,255,0.08), inset 0 -4px 10px rgba(0,0,0,0.6)',
      }}
    >
      {/* Woodgrain Texture Overlay */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, #000 0px, #000 1px, transparent 1px, transparent 8px)',
        }}
      />

      {/* Desk Top Bar: Xpedition Branding + Collection Title + Filter Pills */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-white/[0.08]">
        {/* Brand & Collection Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-sky-400 flex items-center justify-center shadow-lg">
            <span className="font-sans font-black text-white text-xs tracking-tighter">XP</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-sans font-black text-sm tracking-widest uppercase text-white/95">
                XPEDITION
              </span>
              <span className="text-[10px] font-mono text-amber-300/80 tracking-wider">
                • PHYSICAL STUDY DESK
              </span>
            </div>
            <p className="font-sans text-[11px] text-amber-200/60 font-medium">
              Tactile Collectible Learning Materials
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        {showFilterControls && (
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10 text-xs font-mono">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeFilter === 'all'
                  ? 'bg-amber-600/80 text-white font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              All Objects
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('flashcards')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeFilter === 'flashcards'
                  ? 'bg-amber-600/80 text-white font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Flashcards ({flashcards.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('formulas')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeFilter === 'formulas'
                  ? 'bg-amber-600/80 text-white font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Formulas ({formulaCards.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('notes')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeFilter === 'notes'
                  ? 'bg-amber-600/80 text-white font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Sticky Notes ({stickyNotes.length})
            </button>
          </div>
        )}
      </div>

      {/* Desk Surface: Physical Materials Array */}
      <div className="relative z-10 pt-6 space-y-8">
        {/* Section 1: Study Flashcards & Formula Cards */}
        {(showFlashcards || showFormulas) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold tracking-widest uppercase text-amber-200/80 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Study Cards & Scientific Formulas</span>
              </span>
              <span className="text-[11px] font-sans text-amber-100/50">
                Tap card to flip / inspect formula
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 py-2">
              {/* Flashcards */}
              {showFlashcards &&
                flashcards.map((card) => (
                  <LearningFlashcard
                    key={card.id}
                    card={{
                      ...card,
                      status: cardStatusMap[card.id] || card.status,
                    }}
                    onMarkStatus={(status) => handleMarkCard(card.id, status)}
                  />
                ))}

              {/* Formula Cards */}
              {showFormulas &&
                formulaCards.map((card) => (
                  <FormulaCard key={card.id} card={card} />
                ))}
            </div>
          </div>
        )}

        {/* Section 2: Physical Sticky Notes */}
        {showNotes && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-t border-white/[0.08] pt-4">
              <span className="font-mono text-xs font-bold tracking-widest uppercase text-amber-200/80 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Contextual Desk Notes</span>
              </span>
              <span className="text-[11px] font-sans text-amber-100/50">
                Tap note to focus
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 py-2">
              {stickyNotes.map((note) => (
                <StickyNote key={note.id} note={note} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhysicalDeskCollection;
