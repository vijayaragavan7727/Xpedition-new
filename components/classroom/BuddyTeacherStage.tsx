'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Volume2, VolumeX, Sparkles, Bot, ArrowRight, Eye, RefreshCw } from 'lucide-react';
import { BuddyState, BUDDY_STATE_CONFIG } from '@/components/buddy/BuddyState';

const BuddyScene = dynamic(
  () => import('@/components/buddy/BuddyScene').then((m) => m.BuddyScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-24 h-24 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
        <Sparkles className="w-6 h-6 animate-pulse" />
      </div>
    ),
  }
);

export interface BuddyTeacherStageProps {
  dialogue: string;
  state?: BuddyState;
  onNextAction?: () => void;
  nextActionLabel?: string;
  speakerName?: string;
  className?: string;
}

export const BuddyTeacherStage: React.FC<BuddyTeacherStageProps> = ({
  dialogue,
  state = 'EXPLAINING',
  onNextAction,
  nextActionLabel,
  speakerName = 'Buddy',
  className = '',
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [use3DView, setUse3DView] = useState(false);
  const config = BUDDY_STATE_CONFIG[state] || BUDDY_STATE_CONFIG.EXPLAINING;

  // Speak dialogue using browser SpeechSynthesis
  const toggleAudio = useCallback(() => {
    if (typeof window === 'undefined') return;

    if (isPlayingAudio) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingAudio(false);
      return;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(dialogue);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      setIsPlayingAudio(true);
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('Speech synthesis not supported in this environment.');
    }
  }, [dialogue, isPlayingAudio]);

  // Clean up audio on unmount or dialogue change
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [dialogue]);

  return (
    <div className={`relative h-full w-full flex flex-col items-center justify-end select-none min-h-0 overflow-hidden ${className}`}>
      {/* =====================================================================
          1. BUDDY'S FLOATING TEACHER SPEECH BALLOON (Directly above Buddy)
         ===================================================================== */}
      <div className="w-full max-w-[280px] sm:max-w-[320px] mb-1.5 z-20 relative shrink-0">
        <div
          className="relative p-2.5 sm:p-3 rounded-2xl bg-[#090F26]/95 border border-sky-400/35 text-slate-100 shadow-[0_8px_24px_rgba(0,0,0,0.7)] backdrop-blur-xl"
          style={{
            boxShadow: `0 6px 24px -4px ${config.glowColor}`,
          }}
        >
          {/* Audio speech icon & Header */}
          <div className="flex items-center justify-between gap-1.5 mb-1 pb-1 border-b border-white/[0.06]">
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-sky-300">
              <button
                type="button"
                onClick={toggleAudio}
                aria-label="Listen to Buddy speak"
                className="p-1 rounded-md bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 transition-colors cursor-pointer"
                title="Listen to Buddy speak"
              >
                <Volume2 className={`w-3.5 h-3.5 ${isPlayingAudio ? 'animate-pulse text-cyan-300' : ''}`} />
              </button>
              <span>{speakerName}</span>
              <span
                className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase"
                style={{
                  backgroundColor: `${config.visorColor}25`,
                  color: config.visorColor,
                  border: `1px solid ${config.visorColor}40`,
                }}
              >
                {config.label}
              </span>
            </div>

            {/* Toggle 3D scene vs Production Render */}
            <button
              type="button"
              onClick={() => setUse3DView(!use3DView)}
              className="text-[10px] font-mono text-slate-400 hover:text-sky-300 transition-colors flex items-center gap-1 cursor-pointer"
              title="Toggle 3D interactive mode"
            >
              <Eye className="w-3 h-3" />
              <span>{use3DView ? 'Artwork' : '3D'}</span>
            </button>
          </div>

          {/* Dialogue Text */}
          <p className="font-sans text-[11px] sm:text-xs leading-relaxed text-slate-200 font-medium">
            {dialogue}
          </p>

          {/* Speech balloon tail pointing down towards Buddy */}
          <div className="absolute -bottom-1.5 left-12 w-3 h-3 bg-[#090F26] border-r border-b border-sky-400/35 rotate-45 transform shadow-md" />
        </div>
      </div>

      {/* =====================================================================
          2. PHYSICAL BUDDY TEACHER & COMPACT PEDESTAL (Never Clipped)
         ===================================================================== */}
      <div className="relative w-full flex-1 min-h-0 flex flex-col items-center justify-end overflow-hidden pb-1">
        {/* Ambient Floor Glow */}
        <div
          className="absolute bottom-4 w-48 sm:w-56 h-16 rounded-[100%] blur-xl pointer-events-none opacity-50"
          style={{
            background: `radial-gradient(circle, ${config.visorColor}40 0%, rgba(14,165,233,0.15) 50%, transparent 70%)`,
          }}
        />

        {/* Buddy Body: Production Asset or 3D Scene */}
        <div className="relative z-10 flex-1 min-h-0 w-full flex items-end justify-center transition-transform duration-300">
          {use3DView ? (
            <div className="h-full max-h-[44vh] w-full flex items-center justify-center">
              <BuddyScene state={state} size="lg" interactive={true} />
            </div>
          ) : (
            <div className="relative h-full max-h-[44vh] w-full max-w-[240px] sm:max-w-[280px] flex items-end justify-center">
              <Image
                src="/robot.png"
                alt="Buddy - AI Robot Teacher"
                width={360}
                height={500}
                priority
                className="w-auto h-full max-h-[44vh] object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.8)] filter brightness-105 contrast-105 transform -rotate-1 hover:scale-105 transition-all duration-300"
                style={{
                  filter:
                    state === 'CORRECT' || state === 'CELEBRATING'
                      ? 'drop-shadow(0 0 20px rgba(16,185,129,0.5))'
                      : state === 'INCORRECT'
                      ? 'drop-shadow(0 0 20px rgba(245,158,11,0.5))'
                      : 'drop-shadow(0 0 25px rgba(6,182,212,0.4))',
                }}
              />
            </div>
          )}
        </div>

        {/* Holographic Circular Pedestal Dais (Compact & Viewport-Safe) */}
        <div className="relative z-0 -mt-5 flex flex-col items-center shrink-0">
          {/* Upper Stage Glowing Ring */}
          <div className="relative w-44 sm:w-52 h-8 sm:h-9 rounded-[100%] bg-gradient-to-b from-[#18244D] via-[#0E1530] to-[#080D20] border-2 border-cyan-400/60 shadow-[0_0_24px_rgba(6,182,212,0.4)] flex items-center justify-center">
            <div className="w-[88%] h-[80%] rounded-[100%] border border-cyan-300/40 shadow-inner flex items-center justify-center">
              <div className="w-[75%] h-[70%] rounded-[100%] bg-cyan-400/15 blur-[1px]" />
            </div>
          </div>

          {/* Pedestal Base with 'BUDDY' Nameplate */}
          <div className="relative -mt-3.5 w-40 sm:w-48 h-5 sm:h-6 rounded-b-xl bg-gradient-to-b from-[#0B1126] to-[#040712] border border-cyan-500/30 flex items-center justify-center shadow-lg">
            <span className="font-mono text-[9px] sm:text-[10px] font-black tracking-[0.25em] text-cyan-300 uppercase drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]">
              BUDDY
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuddyTeacherStage;
