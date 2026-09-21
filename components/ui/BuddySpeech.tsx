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
    glow: string;
    badgeBg: string;
    badgeText: string;
    icon: React.ReactNode;
    label: string;
  }
> = {
  speaking: {
    border: 'border-sky-400/40',
    glow: 'rgba(56, 189, 248, 0.2)',
    badgeBg: 'bg-sky-500/15',
    badgeText: 'text-sky-300',
    icon: <Bot className="w-3.5 h-3.5" />,
    label: 'Buddy',
  },
  listening: {
    border: 'border-indigo-400/40',
    glow: 'rgba(99, 102, 241, 0.2)',
    badgeBg: 'bg-indigo-500/15',
    badgeText: 'text-indigo-300',
    icon: <Sparkles className="w-3.5 h-3.5" />,
    label: 'Listening',
  },
  observing: {
    border: 'border-teal-400/40',
    glow: 'rgba(20, 184, 166, 0.2)',
    badgeBg: 'bg-teal-500/15',
    badgeText: 'text-teal-300',
    icon: <Eye className="w-3.5 h-3.5" />,
    label: 'Observing',
  },
  thinking: {
    border: 'border-purple-400/40',
    glow: 'rgba(168, 85, 247, 0.2)',
    badgeBg: 'bg-purple-500/15',
    badgeText: 'text-purple-300',
    icon: <Brain className="w-3.5 h-3.5" />,
    label: 'Thinking...',
  },
  celebrating: {
    border: 'border-amber-400/50',
    glow: 'rgba(251, 191, 36, 0.25)',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-300',
    icon: <Sparkles className="w-3.5 h-3.5" />,
    label: 'Awesome!',
  },
  encouraging: {
    border: 'border-emerald-400/40',
    glow: 'rgba(16, 185, 129, 0.2)',
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-300',
    icon: <CheckCircle className="w-3.5 h-3.5" />,
    label: 'Keep going!',
  },
  warning: {
    border: 'border-rose-400/40',
    glow: 'rgba(244, 63, 94, 0.2)',
    badgeBg: 'bg-rose-500/15',
    badgeText: 'text-rose-300',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    label: 'Take Note',
  },
  loading: {
    border: 'border-slate-500/30',
    glow: 'rgba(148, 163, 184, 0.1)',
    badgeBg: 'bg-slate-500/15',
    badgeText: 'text-slate-300',
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
      className={`relative flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl bg-[#0E152E]/92 backdrop-blur-xl border ${currentMood.border} shadow-[0_8px_30px_rgba(0,0,0,0.55)] transition-all max-w-lg select-none ${className}`}
      style={{
        boxShadow: `0 8px 30px -4px ${currentMood.glow}`,
      }}
    >
      {/* 3D Buddy Avatar / Companion Preview */}
      <div className="relative shrink-0">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#141D3D] to-[#0A1024] border border-sky-400/30 flex items-center justify-center shadow-inner overflow-hidden">
          <BuddyScene state={buddyState} size="sm" interactive={false} />
        </div>
        {/* Active aura dot */}
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-sky-400 ring-2 ring-[#0E152E] animate-pulse" />
      </div>

      {/* Speech Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="font-sans font-bold text-xs text-white tracking-wide">
              {speakerName}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold uppercase ${currentMood.badgeBg} ${currentMood.badgeText}`}
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
              className="p-1 rounded-md text-slate-400 hover:text-sky-300 hover:bg-white/[0.06] transition-colors"
            >
              {isAudioPlaying ? (
                <Volume2 className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
              ) : (
                <VolumeX className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>

        {/* The spoken line */}
        <p className="font-sans text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
          {message}
        </p>
      </div>

      {/* Speech Bubble Tail notch pointing toward canvas/left */}
      <div
        className={`absolute -left-2 top-5 w-3 h-3 bg-[#0E152E] border-l border-b ${currentMood.border} transform rotate-45 pointer-events-none`}
      />
    </div>
  );
};

export default BuddySpeech;
