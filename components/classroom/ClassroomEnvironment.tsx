'use client';

/**
 * ClassroomEnvironment — the physical room the Class happens in.
 *
 * Real layered DOM/SVG (not a screenshot): back wall, a city/planet window
 * behind Buddy, ceiling light strips, wall panels and a reflective floor. The
 * repository's classroom interior render (`classroom-interior-clean.png`) is
 * reused as a low-opacity ambient layer. It is only 188 px wide, so it is used
 * for colour and depth, never as the sharp room.
 *
 * Neutral by design: nothing in the room is lesson-specific, so no concept's
 * imagery can leak into another concept's class.
 */

import React from 'react';

/** Deterministic skyline: [x, width, height] in a 0..400 × 0..300 viewBox. */
const SKYLINE: Array<[number, number, number]> = [
  [0, 34, 118], [30, 22, 150], [50, 40, 96], [88, 26, 176], [112, 36, 132], [146, 18, 206],
  [162, 44, 120], [204, 28, 162], [230, 38, 104], [266, 22, 188], [286, 46, 140], [330, 30, 170],
  [358, 42, 112],
];

function windowLights(x: number, w: number, h: number, seed: number) {
  const lights: React.ReactNode[] = [];
  const top = 300 - h;
  for (let row = top + 10; row < 290; row += 11) {
    for (let col = x + 4; col < x + w - 5; col += 7) {
      // Stable pseudo-random pattern (no Math.random: no hydration mismatch, no flicker).
      const v = ((col * 37 + row * 17 + seed * 101) % 23) / 23;
      if (v > 0.58) {
        lights.push(
          <rect key={`${col}-${row}`} x={col} y={row} width={3} height={4} fill={v > 0.86 ? '#FDE68A' : '#7DD3FC'} opacity={0.35 + v * 0.45} />
        );
      }
    }
  }
  return lights;
}

const CityWindow: React.FC = () => (
  <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 w-full h-full">
    <defs>
      <linearGradient id="xp-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#030716" />
        <stop offset="55%" stopColor="#0B1B45" />
        <stop offset="100%" stopColor="#1D3F7A" />
      </linearGradient>
      <radialGradient id="xp-planet" cx="0.5" cy="0.5" r="0.5">
        <stop offset="80%" stopColor="#0F2A5C" />
        <stop offset="96%" stopColor="#38BDF8" stopOpacity="0.85" />
        <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect width="400" height="300" fill="url(#xp-sky)" />
    {[[40, 30], [120, 18], [210, 44], [300, 22], [360, 60], [80, 70], [260, 80]].map(([x, y]) => (
      <circle key={`${x}-${y}`} cx={x} cy={y} r={0.9} fill="#E0F2FE" opacity={0.7} />
    ))}
    <circle cx="80" cy="-150" r="260" fill="url(#xp-planet)" opacity="0.9" />
    {SKYLINE.map(([x, w, h], i) => (
      <g key={x}>
        <rect x={x} y={300 - h} width={w} height={h} fill={i % 2 ? '#081028' : '#0A1433'} />
        {windowLights(x, w, h, i)}
      </g>
    ))}
    <rect y="270" width="400" height="30" fill="#38BDF8" opacity="0.08" />
  </svg>
);

const Plant: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 80 120" className={className} aria-hidden="true">
    <path d="M26 88h28l-4 30H30z" fill="#1B2440" stroke="#334155" strokeWidth="1" />
    {[
      'M40 88C30 70 18 62 8 60c10 6 18 16 26 28',
      'M40 88C38 64 30 46 22 34c6 16 10 34 12 54',
      'M40 88C44 62 52 44 62 32c-6 18-12 36-16 56',
      'M40 88C52 72 64 66 74 64c-12 6-22 14-30 24',
      'M40 88C40 60 42 40 44 22c2 20 0 44-2 66',
    ].map((d) => (
      <path key={d} d={d} fill="none" stroke="#166534" strokeWidth="5" strokeLinecap="round" opacity="0.9" />
    ))}
  </svg>
);

export interface ClassroomEnvironmentProps {
  /** Accent colour of the room lights (follows the teaching stage). */
  accent?: string;
}

export const ClassroomEnvironment: React.FC<ClassroomEnvironmentProps> = React.memo(({ accent = '#38BDF8' }) => (
  <div data-testid="classroom-environment" aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
    {/* Back wall */}
    <div className="absolute inset-0 bg-[linear-gradient(180deg,#081027_0%,#060B1F_52%,#03060F_100%)]" />

    {/* Reused room render: ambient colour and depth only (low resolution source). */}
    <div
      className="absolute inset-0 bg-cover bg-center opacity-[0.16]"
      style={{ backgroundImage: 'url(/images/classroom/classroom-interior-clean.png)' }}
    />

    {/* Wall panels */}
    <div
      className="absolute inset-x-0 top-0 h-[78%] opacity-[0.35]"
      style={{
        backgroundImage: 'linear-gradient(90deg, rgba(148,163,184,0.10) 1px, transparent 1px)',
        backgroundSize: '180px 100%',
      }}
    />

    {/* Ceiling light strips */}
    <div className="absolute inset-x-0 top-0 h-[9%] bg-gradient-to-b from-black/60 to-transparent" />
    <div className="absolute top-[7%] left-[6%] right-[6%] h-[2px] rounded-full bg-amber-300/40 shadow-[0_0_14px_rgba(251,191,36,0.45)]" />
    <div className="absolute top-[7%] right-[4%] w-[2px] h-[58%] rounded-full bg-amber-300/25 shadow-[0_0_12px_rgba(251,191,36,0.35)] hidden lg:block" />

    {/* City window behind Buddy (desktop/tablet) */}
    <div className="hidden md:block absolute left-0 top-[10%] w-[24%] max-w-[380px] h-[60%] rounded-r-[22px] overflow-hidden border-y border-r border-slate-500/30 shadow-[inset_0_0_40px_rgba(0,0,0,0.8)]">
      <CityWindow />
      <div className="absolute inset-y-0 left-1/3 w-[3px] bg-[#0B1226]/90" />
      <div className="absolute inset-y-0 left-2/3 w-[3px] bg-[#0B1226]/90" />
      <div className="absolute inset-x-0 top-[62%] h-[3px] bg-[#0B1226]/90" />
      <div className="absolute inset-y-0 right-0 w-[3px] bg-amber-300/40 shadow-[0_0_14px_rgba(251,191,36,0.5)]" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#060B1F]/50" />
    </div>

    {/* Stage-coloured wall wash behind the Smart Board */}
    <div
      className="absolute left-1/2 -translate-x-1/2 top-[4%] w-[72%] h-[70%] opacity-60 transition-[background] duration-700"
      style={{ background: `radial-gradient(ellipse at center, ${accent}22 0%, transparent 65%)` }}
    />

    {/* Floor */}
    <div className="absolute inset-x-0 bottom-0 h-[26%] bg-gradient-to-b from-[#060B1C] to-[#02040B]" />
    <div
      className="absolute inset-x-0 bottom-0 h-[26%] opacity-[0.18]"
      style={{
        backgroundImage:
          'linear-gradient(rgba(56,189,248,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.35) 1px, transparent 1px)',
        backgroundSize: '64px 32px',
        maskImage: 'linear-gradient(to bottom, transparent, black)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent, black)',
      }}
    />
    <div className="absolute inset-x-[8%] bottom-[26%] h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />
    <div
      className="absolute left-1/2 -translate-x-1/2 bottom-[4%] w-[70%] h-[22%]"
      style={{ background: `radial-gradient(ellipse at center, ${accent}2E 0%, transparent 70%)` }}
    />

    {/* Room plants (desktop) */}
    <Plant className="hidden lg:block absolute right-[1.5%] bottom-[9%] w-16 h-24 opacity-50" />
    <Plant className="hidden xl:block absolute left-[23%] bottom-[18%] w-10 h-16 opacity-35" />

    {/* Vignette */}
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.55)_100%)]" />
  </div>
));

ClassroomEnvironment.displayName = 'ClassroomEnvironment';

export default ClassroomEnvironment;
