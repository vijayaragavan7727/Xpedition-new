'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, RotateCw, Monitor } from 'lucide-react';

export interface ClassroomOrientationPromptProps {
  onDismiss: () => void;
  backHref?: string;
}

export const ClassroomOrientationPrompt: React.FC<ClassroomOrientationPromptProps> = ({
  onDismiss,
  backHref = '/learn',
}) => {
  return (
    <div
      role="dialog"
      aria-label="Rotate device to landscape"
      className="fixed inset-0 z-50 bg-[#040714]/98 backdrop-blur-2xl flex flex-col items-center justify-between p-6 select-none animate-in fade-in duration-300"
    >
      {/* Top Bar with Exit Action */}
      <div className="w-full flex items-center justify-between max-w-md pt-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-400 to-indigo-600 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.6)]">
            <span className="font-sans font-black text-white text-xs tracking-tighter">XP</span>
          </div>
          <span className="font-sans font-black text-xs text-white tracking-widest uppercase">
            XPEDITION CLASS
          </span>
        </div>

        <Link
          href={backHref}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/[0.1] text-xs font-sans font-semibold transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit</span>
        </Link>
      </div>

      {/* Center Hero: Premium Phone Rotation Animation */}
      <div className="flex flex-col items-center text-center max-w-sm space-y-6 my-auto">
        {/* Animated Phone Graphic */}
        <div className="relative w-36 h-36 flex items-center justify-center">
          {/* Outer glowing orbital ring */}
          <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-pulse" />
          <div className="absolute inset-3 rounded-full border border-cyan-400/30 border-dashed animate-spin" style={{ animationDuration: '12s' }} />

          {/* Central Rotating Device Icon */}
          <div className="relative z-10 flex items-center justify-center animate-bounce" style={{ animationDuration: '3s' }}>
            <div className="relative w-18 h-28 rounded-2xl border-2 border-cyan-400 bg-gradient-to-b from-[#0F1C3F] to-[#070D22] shadow-[0_0_30px_rgba(6,182,212,0.5)] flex flex-col items-center justify-between p-2 transform transition-transform duration-700 hover:rotate-90">
              {/* Speaker / Camera notch */}
              <div className="w-6 h-1 rounded-full bg-cyan-400/60" />

              {/* Screen preview content icon */}
              <div className="w-full flex-1 my-1.5 rounded-lg bg-black/40 border border-cyan-500/20 flex items-center justify-center">
                <Monitor className="w-5 h-5 text-cyan-300 animate-pulse" />
              </div>

              {/* Home indicator bar */}
              <div className="w-8 h-1 rounded-full bg-cyan-400/60" />
            </div>
          </div>

          {/* Curved Arrow Rotation Vector */}
          <div className="absolute -top-1 -right-1 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }}>
            <RotateCw className="w-6 h-6 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          </div>
        </div>

        {/* Text Messaging */}
        <div className="space-y-2">
          <h2 className="font-sans font-black text-xl sm:text-2xl text-white tracking-tight">
            Turn your device sideways to continue
          </h2>
          <p className="font-sans text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">
            Buddy’s Smart Board and interactive 3D simulations are designed for widescreen landscape.
          </p>
        </div>
      </div>

      {/* Bottom Option: Continue Anyway */}
      <div className="w-full max-w-xs flex flex-col items-center pb-4">
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs font-mono text-slate-500 hover:text-cyan-300 transition-colors underline py-2 cursor-pointer"
        >
          Continue in portrait anyway
        </button>
      </div>
    </div>
  );
};

export default ClassroomOrientationPrompt;
