'use client';

import React, { useState, useEffect } from 'react';

export type TutorState = 'idle' | 'talking' | 'thinking' | 'happy';

interface TutorAvatarProps {
  state: TutorState;
  pointerAngle?: number; // Arm/pointer angle pointing at blackboard lines
}

export const TutorAvatar: React.FC<TutorAvatarProps> = ({ state, pointerAngle = -25 }) => {
  const [isBlinking, setIsBlinking] = useState<boolean>(false);

  // Idle Eye Blink logic (blinks every 4-7 seconds over ~120ms)
  useEffect(() => {
    let blinkTimer: NodeJS.Timeout;
    const scheduleBlink = () => {
      const delay = Math.floor(Math.random() * 3000) + 4000;
      blinkTimer = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 120);
        scheduleBlink();
      }, delay);
    };

    scheduleBlink();
    return () => clearTimeout(blinkTimer);
  }, []);

  const getStateVisuals = () => {
    switch (state) {
      case 'talking':
        return {
          label: 'TEACHING',
          antennaPulse: 'animate-pulse fill-cyan',
          headTransform: 'rotate-0',
        };
      case 'thinking':
        return {
          label: 'THINKING',
          antennaPulse: 'animate-pulse fill-violet',
          headTransform: 'rotate(5deg) translateY(-2px)',
        };
      case 'happy':
        return {
          label: 'EXCELLENT',
          antennaPulse: 'fill-emerald-400 scale-125',
          headTransform: 'translateY(-4px)',
        };
      case 'idle':
      default:
        return {
          label: 'CLASSROOM TUTOR',
          antennaPulse: 'fill-cyan',
          headTransform: 'rotate-0',
        };
    }
  };

  const visual = getStateVisuals();

  return (
    <div className="flex flex-col items-center shrink-0 select-none relative">
      {/* SOLID CLASSROOM ROBOT CONTAINER (STANDING ON FLOOR) */}
      <div className="relative w-28 h-36 sm:w-36 sm:h-44 flex items-center justify-center p-1 transition-all duration-300">
        <svg
          role="img"
          aria-label={`Robot Teacher in ${visual.label} state`}
          viewBox="0 0 120 140"
          className="w-full h-full transition-transform duration-300"
        >
          {/* ANTENNA & GLOWING TIP */}
          <line x1="60" y1="30" x2="60" y2="12" stroke="#00E5FF" strokeWidth="3" strokeLinecap="round" />
          <circle
            cx="60"
            cy="10"
            r="5"
            className={`${visual.antennaPulse} transition-all duration-300`}
            stroke="#00E5FF"
            strokeWidth="1.5"
          />

          {/* LEFT ARM (REST POSITION) */}
          <path
            d="M 30 84 Q 18 94 22 108"
            stroke="#00E5FF"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="22" cy="108" r="4" fill="#00E5FF" />

          {/* RIGHT ARM WITH POINTER STICK (DYNAMICALLY ROTATES TOWARD BOARD LINES) */}
          <g
            className="transition-transform duration-500 origin-[90px_84px] motion-reduce:transform-none"
            style={{ transform: `rotate(${pointerAngle}deg)` }}
          >
            {/* Upper & Forearm */}
            <path
              d="M 90 84 L 115 65"
              stroke="#00E5FF"
              strokeWidth="4.5"
              fill="none"
              strokeLinecap="round"
            />
            {/* Hand */}
            <circle cx="115" cy="65" r="4" fill="#00E5FF" />
            {/* Wooden Pointer Stick */}
            <line
              x1="115"
              y1="65"
              x2="155"
              y2="30"
              stroke="#d4a373"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Brass Tip on Pointer Stick */}
            <circle cx="155" cy="30" r="2.5" fill="#f4a261" />
          </g>

          {/* ROBOT LEGS (STANDING ON CLASSROOM FLOOR LEDGE) */}
          <rect x="42" y="112" width="10" height="20" rx="4" fill="#15102A" stroke="#00E5FF" strokeWidth="2.5" />
          <rect x="68" y="112" width="10" height="20" rx="4" fill="#15102A" stroke="#00E5FF" strokeWidth="2.5" />
          <ellipse cx="47" cy="132" rx="8" ry="4" fill="#00E5FF" />
          <ellipse cx="73" cy="132" rx="8" ry="4" fill="#00E5FF" />

          {/* BODY & CHEST DISPLAY */}
          <rect x="30" y="74" width="60" height="42" rx="12" fill="#15102A" stroke="#00E5FF" strokeWidth="3" />
          {/* Chest Core Pulse Ring */}
          <circle cx="60" cy="95" r="8" fill="#00E5FF" fillOpacity="0.2" stroke="#00E5FF" strokeWidth="2" />
          <circle cx="60" cy="95" r="4" fill="#00E5FF" className="animate-pulse" />

          {/* HEAD GROUP (TILTS/ANIMATES IN THINKING/HAPPY STATES) */}
          <g
            className="transition-transform duration-300 origin-[60px_52px] motion-reduce:transform-none"
            style={{ transform: visual.headTransform }}
          >
            {/* Head Outer Shell */}
            <rect x="20" y="28" width="80" height="50" rx="14" fill="#15102A" stroke="#00E5FF" strokeWidth="3" />
            
            {/* EYES */}
            {state === 'happy' ? (
              <g stroke="#00E5FF" strokeWidth="4" fill="none" strokeLinecap="round">
                <path d="M 32 52 Q 42 38 52 52" />
                <path d="M 68 52 Q 78 38 88 52" />
              </g>
            ) : state === 'thinking' ? (
              <g fill="#00E5FF">
                <rect x="42" y="40" width="13" height="13" rx="4" />
                <rect x="72" y="40" width="13" height="13" rx="4" />
              </g>
            ) : state === 'talking' ? (
              <g fill="#00E5FF">
                <rect x="34" y="46" width="16" height="9" rx="3" />
                <rect x="66" y="46" width="16" height="9" rx="3" />
              </g>
            ) : (
              <g
                fill="#00E5FF"
                className="transition-transform duration-100 origin-[60px_48px] motion-reduce:transform-none"
                style={{ transform: isBlinking ? 'scaleY(0.1)' : 'scaleY(1)' }}
              >
                <rect x="34" y="42" width="16" height="14" rx="4" />
                <rect x="66" y="42" width="16" height="14" rx="4" />
              </g>
            )}
          </g>
        </svg>
      </div>

      {/* STATE BADGE */}
      <span className="font-mono text-[9px] uppercase tracking-wider text-cyan font-bold mt-1 bg-[#120E22] px-2 py-0.5 rounded border border-cyan/30">
        {visual.label}
      </span>
    </div>
  );
};
