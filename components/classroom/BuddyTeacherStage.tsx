'use client';

/**
 * BuddyTeacherStage — Buddy, physically standing in the classroom.
 *
 * Buddy is the app's robot teacher (`/robot.png`, the same character used on
 * Passport, the tutor and Buddy speech). He stands on a pedestal beside the
 * Smart Board with his pointer towards it, and talks to the learner through
 * the speech bubble. There is no second floating/3D companion in the Class.
 *
 * Body language follows Buddy's lesson mood (BuddyState): teaching lean,
 * thinking tilt, supportive lean after a wrong answer, a hop on a correct
 * answer. It uses transform-only CSS animations; reduced motion is honoured
 * globally.
 *
 * Every word comes from `dialogue`, which the class runtime selects from the
 * ACTIVE lesson and the learner's evidence. This component never invents text.
 */

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { Volume2, Square } from 'lucide-react';
import { BuddyState, BUDDY_STATE_CONFIG } from '@/components/buddy/BuddyState';

export type BuddyPose = 'teach' | 'think' | 'cheer' | 'support' | 'rest';

export function buddyPoseFor(state: BuddyState): BuddyPose {
  switch (state) {
    case 'THINKING':
    case 'WAITING':
      return 'think';
    case 'CORRECT':
    case 'CELEBRATING':
    case 'COMPLETE':
      return 'cheer';
    case 'INCORRECT':
    case 'ENCOURAGING':
    case 'HINTING':
      return 'support';
    case 'IDLE':
      return 'rest';
    default:
      return 'teach';
  }
}

export interface BuddyTeacherStageProps {
  dialogue: string;
  state?: BuddyState;
  /** 'stage' = full-height Buddy beside the board; 'compact' = phone strip under the board. */
  variant?: 'stage' | 'compact';
  speakerName?: string;
  /** Kept for API compatibility; navigation lives on the Smart Board. */
  onNextAction?: () => void;
  nextActionLabel?: string;
  /** Optional trailing control (e.g. the Xira button on phones). */
  accessory?: React.ReactNode;
  className?: string;
}

/** The pedestal Buddy stands on (CSS only; reconstructed from the reference design). */
const Pedestal: React.FC<{ color: string; compact?: boolean }> = ({ color, compact }) => (
  <div data-testid="buddy-pedestal" className="relative flex flex-col items-center w-full pointer-events-none">
    <div
      className={`relative rounded-[100%] border-2 ${compact ? 'w-[88%] h-3' : 'w-[82%] max-w-[240px] h-8'}`}
      style={{
        borderColor: `${color}B3`,
        background: 'radial-gradient(ellipse at center, #1E2B55 0%, #0D1532 60%, #070B1C 100%)',
        boxShadow: `0 0 ${compact ? 10 : 24}px ${color}66, inset 0 0 12px ${color}40`,
      }}
    >
      <div className="absolute inset-[18%] rounded-[100%] border" style={{ borderColor: `${color}55` }} />
    </div>
    {!compact && (
      <div
        className="relative -mt-4 w-[76%] max-w-[222px] h-10 rounded-b-[45%] border-x border-b border-slate-600/50 flex items-end justify-center pb-1.5"
        style={{ background: 'linear-gradient(180deg, #0C1330 0%, #050814 100%)' }}
      >
        <span
          className="px-3 py-0.5 rounded-md bg-black/50 border font-mono text-[10px] font-black tracking-[0.3em]"
          style={{ color, borderColor: `${color}55`, textShadow: `0 0 8px ${color}` }}
        >
          BUDDY
        </span>
      </div>
    )}
    <div
      className={`absolute left-1/2 -translate-x-1/2 rounded-[100%] -z-10 ${compact ? '-bottom-1 w-[120%] h-4' : '-bottom-3 w-[120%] h-10'}`}
      style={{ background: `radial-gradient(ellipse at center, ${color}40 0%, transparent 70%)` }}
    />
  </div>
);

export const BuddyTeacherStage: React.FC<BuddyTeacherStageProps> = React.memo(({
  dialogue,
  state = 'EXPLAINING',
  variant = 'stage',
  speakerName = 'Buddy',
  accessory,
  className = '',
}) => {
  const [speaking, setSpeaking] = useState(false);
  const config = BUDDY_STATE_CONFIG[state] || BUDDY_STATE_CONFIG.EXPLAINING;
  const color = config.visorColor;
  const pose = buddyPoseFor(state);
  const compact = variant === 'compact';

  const toggleSpeech = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (speaking) {
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(dialogue);
    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [dialogue, speaking]);

  // New line from Buddy: stop reading the old one.
  useEffect(() => {
    setSpeaking(false);
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, [dialogue]);

  const bubble = (
    <div
      data-testid="buddy-speech"
      role="status"
      aria-live="polite"
      className={`relative rounded-2xl border bg-[#081130]/90 backdrop-blur-md text-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.6)] ${
        compact ? 'flex-1 min-w-0 self-stretch flex flex-col p-2.5' : 'w-full max-w-[300px] p-3 shrink-0 self-end lg:mr-[-6px]'
      }`}
      style={{ borderColor: `${color}66`, boxShadow: `0 10px 30px rgba(0,0,0,0.6), 0 0 22px -6px ${color}` }}
    >
      <div className="flex items-center gap-2 mb-1">
        <button
          type="button"
          onClick={toggleSpeech}
          aria-label={speaking ? 'Stop Buddy speaking' : 'Listen to Buddy speak'}
          aria-pressed={speaking}
          className="w-7 h-7 rounded-lg flex items-center justify-center border focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 cursor-pointer"
          style={{ background: `${color}22`, borderColor: `${color}55`, color }}
        >
          {speaking ? <Square className="w-3 h-3" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
        <span className="font-sans text-xs font-bold text-white">{speakerName}</span>
        <span data-testid="buddy-mood" className="text-[10px] font-mono uppercase tracking-wide truncate" style={{ color }}>
          {config.label}
        </span>
      </div>
      <p
        data-testid="buddy-dialogue"
        className={`font-sans text-slate-100 leading-relaxed ${
          compact ? 'text-[12px] overflow-y-auto min-h-0 flex-1 pr-1' : 'text-[13px] max-h-[34vh] overflow-y-auto pr-1'
        }`}
      >
        {dialogue}
      </p>
      {/* Tail towards Buddy's head */}
      <span
        aria-hidden="true"
        className={`absolute w-3 h-3 rotate-45 bg-[#081130] ${
          compact ? '-left-1.5 top-6 border-l border-b' : '-bottom-1.5 left-[34%] border-r border-b'
        }`}
        style={{ borderColor: `${color}66` }}
      />
    </div>
  );

  const figure = (
    <div
      data-testid="buddy-figure"
      className={`relative flex flex-col items-center justify-end ${compact ? 'w-[72px] shrink-0 self-stretch' : 'w-full h-[min(440px,54vh)] min-h-[220px] shrink'}`}
    >
      <div className={`relative z-10 w-full flex justify-center items-end min-h-0 flex-1 ${compact ? '-mb-1.5' : '-mb-5'}`}>
        <div data-pose={pose} className="xp-buddy-pose relative h-full w-full flex items-end justify-center">
          <Image
            src="/robot.png"
            alt={`${speakerName}, the robot teacher, pointing at the Smart Board`}
            width={1024}
            height={1536}
            priority
            sizes={compact ? '72px' : '(max-width: 1440px) 280px, 340px'}
            className={`w-auto h-full object-contain object-bottom select-none ${compact ? 'max-h-[92px]' : 'max-h-[440px]'}`}
            style={{ filter: `drop-shadow(0 10px 18px rgba(0,0,0,0.75)) drop-shadow(0 0 16px ${color}40)` }}
            draggable={false}
          />
        </div>
      </div>
      <Pedestal color={color} compact={compact} />
    </div>
  );

  return (
    <div
      data-testid="buddy-stage"
      data-buddy-state={state}
      data-buddy-pose={pose}
      data-variant={variant}
      className={`relative select-none min-h-0 ${
        compact ? 'flex items-stretch gap-2.5 w-full h-full' : 'h-full w-full flex flex-col items-center justify-end gap-3 pb-2'
      } ${className}`}
    >
      {compact ? (
        <>
          {figure}
          {bubble}
          {accessory}
        </>
      ) : (
        <>
          {bubble}
          {figure}
        </>
      )}
    </div>
  );
});

BuddyTeacherStage.displayName = 'BuddyTeacherStage';

export default BuddyTeacherStage;
