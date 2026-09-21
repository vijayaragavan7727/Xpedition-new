'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Volume2, VolumeX, X, Sparkles } from 'lucide-react';
import { BuddyState, BUDDY_STATE_CONFIG } from './BuddyState';
import { XP_COLORS } from '@/lib/design-system/tokens';

const BuddyScene = dynamic(
  () => import('./BuddyScene').then((m) => m.BuddyScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-16 h-16 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
        <Sparkles className="w-4 h-4 animate-pulse" />
      </div>
    ),
  }
);

export interface BuddyPresenceProps {
  state?: BuddyState;
  message?: string;
  speakerName?: string;
  mode?: 'full' | 'compact' | 'floating' | 'banner';
  size?: 'sm' | 'md' | 'lg';
  isAudioPlaying?: boolean;
  onToggleAudio?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const BuddyPresence: React.FC<BuddyPresenceProps> = ({
  state = 'IDLE',
  message,
  speakerName = 'Buddy',
  mode = 'full',
  size = 'md',
  isAudioPlaying = false,
  onToggleAudio,
  onDismiss,
  className = '',
}) => {
  const config = BUDDY_STATE_CONFIG[state] || BUDDY_STATE_CONFIG.IDLE;

  // =========================================================================
  // 1. COMPACT / PILL MODE (Mobile friendly & minimal header/toolbar presence)
  // =========================================================================
  if (mode === 'compact') {
    return (
      <aside
        role="complementary"
        aria-label={`${speakerName} companion`}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0A1024]/90 border border-white/[0.08] backdrop-blur-md shadow-lg transition-all ${className}`}
        style={{
          boxShadow: `0 0 14px ${config.glowColor}`,
          borderColor: `${config.visorColor}40`,
        }}
      >
        <BuddyScene state={state} size="sm" interactive={false} />
        {message && (
          <p
            aria-live="polite"
            className="text-xs font-sans text-slate-200 max-w-[200px] truncate"
          >
            {message}
          </p>
        )}
      </aside>
    );
  }

  // =========================================================================
  // 2. BANNER MODE (Onboarding step introduction / clean horizontal band)
  // =========================================================================
  if (mode === 'banner') {
    return (
      <section
        role="region"
        aria-label={`${speakerName} introduction`}
        className={`w-full p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#0E152E] via-[#0A1024] to-[#0E152E] border border-sky-500/25 flex flex-col sm:flex-row items-center gap-4 shadow-xl backdrop-blur-md transition-all ${className}`}
        style={{
          boxShadow: `0 4px 24px -4px ${config.glowColor}`,
        }}
      >
        <div className="shrink-0 flex items-center justify-center">
          <BuddyScene state={state} size="md" />
        </div>
        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="font-mono text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              {speakerName}
            </span>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium"
              style={{
                backgroundColor: `${config.visorColor}20`,
                color: config.visorColor,
              }}
            >
              {config.label}
            </span>
          </div>
          {message && (
            <p
              aria-live="polite"
              className="text-xs sm:text-sm text-slate-200 font-sans leading-relaxed"
            >
              {message}
            </p>
          )}
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss Buddy introduction"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors self-start cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </section>
    );
  }

  // =========================================================================
  // 3. FULL MODE (Classroom standard: 3D model + Contextual Speech Bubble)
  // =========================================================================
  return (
    <aside
      role="complementary"
      aria-label={`${speakerName} Companion`}
      className={`relative flex flex-col sm:flex-row items-center sm:items-start gap-3 p-3.5 rounded-2xl bg-[#0B1126]/90 border transition-all duration-300 backdrop-blur-md select-none ${className}`}
      style={{
        borderColor: `${config.visorColor}40`,
        boxShadow: `0 8px 32px -4px ${config.glowColor}`,
      }}
    >
      {/* 3D Buddy Character */}
      <div className="shrink-0 flex items-center justify-center">
        <BuddyScene state={state} size={size} />
      </div>

      {/* Speech Content & Controls */}
      <div className="flex-1 min-w-0 space-y-1.5 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1">
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: config.visorColor }}
              />
              {speakerName}
            </span>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium"
              style={{
                backgroundColor: `${config.visorColor}20`,
                color: config.visorColor,
              }}
            >
              {config.label}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {onToggleAudio && (
              <button
                type="button"
                onClick={onToggleAudio}
                aria-label={isAudioPlaying ? `Mute ${speakerName}` : `Listen to ${speakerName}`}
                className={`p-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                  isAudioPlaying
                    ? 'text-sky-400 bg-sky-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
                }`}
              >
                {isAudioPlaying ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
            )}
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                aria-label={`Dismiss ${speakerName}`}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {message && (
          <p
            aria-live="polite"
            className="text-xs sm:text-sm text-slate-200 font-sans leading-relaxed"
          >
            {message}
          </p>
        )}
      </div>
    </aside>
  );
};

export default BuddyPresence;
