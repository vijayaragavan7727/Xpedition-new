'use client';

import React from 'react';
import { Volume2, VolumeX, Sparkles, Bot, AlertTriangle, CheckCircle, Brain, Eye } from 'lucide-react';
import { BuddyScene } from '@/components/buddy/BuddyScene';
import { BuddyState } from '@/components/buddy/BuddyState';

export type BuddyMood =
  | 'speaking'
  | 'listening'
  | 'observing'
  | 'thinking'
  | 'celebrating'
  | 'encouraging'
  | 'warning'
  | 'loading';

export interface BuddySpeechProps {
  message: string;
  mood?: BuddyMood;
  speakerName?: string;
  avatarSrc?: string;
  isAudioPlaying?: boolean;
  onToggleAudio?: () => void;
  onDismiss?: () => void;
  className?: string;
}

function moodToBuddyState(mood: BuddyMood): BuddyState {
  switch (mood) {
    case 'speaking':
      return 'EXPLAINING';
    case 'thinking':
      return 'THINKING';
    case 'celebrating':
      return 'CELEBRATING';
    case 'encouraging':
      return 'ENCOURAGING';
    case 'warning':
      return 'INCORRECT';
    case 'listening':
    case 'loading':
      return 'WAITING';
    case 'observing':
    default:
      return 'IDLE';
  }
}

const MOOD_CONFIG: Record<
  BuddyMood,
  {
    border: string;
    badgeBg: string;
    badgeText: string;
    icon: React.ReactNode;
    label: string;
  }
> = {
  speaking: {
    border: 'border-[#17655E]',
    badgeBg: 'bg-[#004741]/40',
    badgeText: 'text-[#E5E0D5]',
    icon: <Bot className="w-3.5 h-3.5" />,
    label: 'Buddy',
  },
  listening: {
    border: 'border-[#17655E]',
    badgeBg: 'bg-[#075C55]/30',
    badgeText: 'text-[#E5E0D5]',
    icon: <Sparkles className="w-3.5 h-3.5" />,
    label: 'Listening',
  },
  observing: {
    border: 'border-[#17655E]',
    badgeBg: 'bg-[#004741]/30',
    badgeText: 'text-[#E5E0D5]',
    icon: <Eye className="w-3.5 h-3.5" />,
    label: 'Observing',
  },
  thinking: {
    border: 'border-[#263130]',
    badgeBg: 'bg-[#1B2221]',
    badgeText: 'text-[#E5E0D5]',
    icon: <Brain className="w-3.5 h-3.5" />,
    label: 'Thinking...',
  },
  celebrating: {
    border: 'border-[#17655E]',
    badgeBg: 'bg-[#004741]/40',
    badgeText: 'text-white',
    icon: <Sparkles className="w-3.5 h-3.5" />,
    label: 'Awesome!',
  },
  encouraging: {
    border: 'border-[#17655E]',
    badgeBg: 'bg-[#075C55]/30',
    badgeText: 'text-[#E5E0D5]',
    icon: <CheckCircle className="w-3.5 h-3.5" />,
    label: 'Keep going!',
  },
  warning: {
    border: 'border-[#A83232]/50',
    badgeBg: 'bg-[#A83232]/20',
    badgeText: 'text-rose-200',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    label: 'Take Note',
  },
  loading: {
    border: 'border-[#263130]',
    badgeBg: 'bg-[#1B2221]',
    badgeText: 'text-[#8E9693]',
    icon: <Bot className="w-3.5 h-3.5 animate-spin" />,
    label: 'Loading',
  },
};

export const BuddySpeech: React.FC<BuddySpeechProps> = ({
  message,
  mood = 'speaking',
  speakerName = 'Buddy',
  avatarSrc = '/robot.png',
  isAudioPlaying,
  onToggleAudio,
  onDismiss,
  className = '',
}) => {
  const currentMood = MOOD_CONFIG[mood] || MOOD_CONFIG.speaking;
  const buddyState = moodToBuddyState(mood);

  return (
    <div
      className={`relative flex items-start gap-3 p-3.5 sm:p-4 rounded-xl bg-[#151B1B] border ${currentMood.border} shadow-[0_4px_16px_rgba(0,0,0,0.5)] transition-colors max-w-lg select-none ${className}`}
    >
      {/* 3D Buddy Avatar / Companion Preview */}
      <div className="relative shrink-0">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-[10px] bg-[#080B0D] border border-[#263130] flex items-center justify-center overflow-hidden">
          <BuddyScene state={buddyState} size="sm" interactive={false} />
        </div>
        {/* Active aura dot */}
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#0B7066]" />
      </div>

      {/* Speech Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="font-sans font-bold text-xs text-white tracking-wide">
              {speakerName}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${currentMood.badgeBg} ${currentMood.badgeText}`}
            >
              {currentMood.icon}
              {currentMood.label}
            </span>
          </div>

          {/* Audio voice toggle if supported */}
          {onToggleAudio && (
            <button
              type="button"
              onClick={onToggleAudio}
              aria-label={isAudioPlaying ? 'Mute Buddy' : 'Listen to Buddy'}
              className="p-1 rounded-md text-[#8E9693] hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              {isAudioPlaying ? (
                <Volume2 className="w-3.5 h-3.5 text-[#0B7066] animate-pulse" />
              ) : (
                <VolumeX className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>

        {/* The spoken line */}
        <p className="font-sans text-xs sm:text-sm text-[#E5E0D5] leading-relaxed font-normal">
          {message}
        </p>
      </div>

      {/* Speech Bubble Tail notch pointing toward canvas/left */}
      <div
        className={`absolute -left-2 top-5 w-3 h-3 bg-[#151B1B] border-l border-b ${currentMood.border} transform rotate-45 pointer-events-none`}
      />
    </div>
  );
};

export default BuddySpeech;
