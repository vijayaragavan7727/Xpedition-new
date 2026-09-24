'use client';

import React, { useState } from 'react';
import { Copy, Check, Maximize2, Sparkles } from 'lucide-react';
import { FormulaCardContent } from './types';
import KaTeXRenderer from './KaTeXRenderer';

export interface FormulaCardProps {
  card: FormulaCardContent;
  onCopy?: (formula: string) => void;
  className?: string;
  interactive?: boolean;
}

export const FormulaCard: React.FC<FormulaCardProps> = ({
  card,
  onCopy,
  className = '',
  interactive = true,
}) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const rotationAngle = card.rotation ?? 0;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(card.formulaTex);
      setCopied(true);
      onCopy?.(card.formulaTex);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={`formula-card-wrapper inline-block select-none ${className}`}
      style={{
        transform: `rotate(${rotationAngle}deg)`,
        transition: 'transform 0.25s ease-out, box-shadow 0.25s ease-out',
      }}
    >
      <div
        role="article"
        aria-label={`${card.title} Formula Card. Subject: ${card.subject}`}
        onClick={() => interactive && setIsExpanded(!isExpanded)}
        className={`relative w-[240px] sm:w-[265px] min-h-[370px] sm:min-h-[400px] p-3.5 sm:p-4 rounded-[20px] bg-[#FAF7EE] border-[1.5px] border-[#D4CBB8] text-[#1F1C18] flex flex-col justify-between overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.015] hover:shadow-[0_20px_42px_-8px_rgba(0,0,0,0.5)] focus:outline-none focus:ring-2 focus:ring-amber-500/70 ${
          isExpanded ? 'ring-2 ring-amber-600/40' : ''
        }`}
        style={{
          boxShadow:
            '0 16px 36px -8px rgba(0,0,0,0.45), 0 4px 12px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.9), inset 0 -1px 2px rgba(0,0,0,0.1)',
        }}
      >
        {/* Inner hairline printed border (Editorial index-card craftsmanship) */}
        <div className="absolute inset-1.5 rounded-[15px] border border-[#2D2A26]/15 pointer-events-none" />

        {/* Subtle physical paper grain texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 50%, #000 1px, transparent 1px)',
            backgroundSize: '4px 4px',
          }}
        />

        {/* Top Header: Subject + Card Index */}
        <div className="relative z-10">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#2D2A26]/15">
            <span className="font-serif font-black text-[11px] sm:text-xs tracking-widest uppercase text-[#3C362F]">
              {card.subject || 'PHYSICS'}
            </span>
            <span className="font-mono text-[9.5px] sm:text-[10px] font-bold tracking-wider text-[#686055] uppercase">
              {card.cardNumber || 'FORMULA CARD 01'}
            </span>
          </div>

          {/* Title */}
          <div className="flex items-center justify-between mt-2.5">
            <h3 className="font-sans font-black text-xs sm:text-[13.5px] tracking-wide uppercase text-[#14120F]">
              {card.title}
            </h3>
            <button
              type="button"
              onClick={handleCopy}
              title="Copy LaTeX formula"
              className="text-[9px] font-mono text-[#574F44] hover:text-[#1F1C18] bg-[#EFE9DC] hover:bg-[#E5DEC7] px-2 py-0.5 rounded-md border border-[#D5CABB] flex items-center gap-1 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-2.5 h-2.5 text-emerald-700" />
                  <span className="text-emerald-800 font-bold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-2.5 h-2.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Formula Rendering Box (KaTeX mathematical notation) */}
        <div className="relative z-10 my-3 py-3 px-2 rounded-xl bg-[#F2EDE1]/90 border border-[#DDD3BF] flex items-center justify-center text-center shadow-inner min-h-[64px]">
          <div className="w-full text-base sm:text-lg font-bold text-[#14120F]">
            <KaTeXRenderer math={card.formulaTex} block />
          </div>
        </div>

        {/* Variable Definitions List (Aligned letterpress list) */}
        <div className="relative z-10 flex-1 space-y-1 my-1 px-1">
          <div className="text-[10px] sm:text-[11px] font-mono text-[#3D3830] space-y-1">
            {card.variables.map((v) => (
              <div
                key={v.symbol}
                className="flex items-baseline justify-between gap-1 leading-snug border-b border-[#2D2A26]/05 pb-0.5"
              >
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-[#1A1815] min-w-[20px]">
                    <KaTeXRenderer math={v.symbol} block={false} />
                  </span>
                  <span className="text-[#6B6256] text-[10px]">—</span>
                  <span className="font-sans text-[11px] text-[#2E2A24] font-medium">
                    {v.description}
                  </span>
                </div>
                {v.unit && (
                  <span className="text-[9.5px] font-mono text-[#786E61]">
                    ({v.unit})
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Worked Example or Physical Interpretation if present */}
          {card.example && (
            <div className="mt-2 p-2 rounded-lg bg-[#EFE9DC]/70 border border-[#D8CEBC] text-[10px] font-sans text-[#3A352D] leading-relaxed">
              <span className="font-mono font-bold text-[#5C5346] uppercase mr-1">
                Note:
              </span>
              {card.example}
            </div>
          )}
        </div>

        {/* Bottom Scientific Watermark Emblem */}
        <div className="relative z-10 pt-2 border-t border-[#2D2A26]/12 flex items-center justify-center">
          <div className="flex items-center gap-1.5 text-[#5C5347] opacity-80">
            <span className="text-base leading-none">⚛</span>
            <span className="text-[9px] font-mono tracking-widest uppercase">
              XPEDITION SCIENCE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormulaCard;
