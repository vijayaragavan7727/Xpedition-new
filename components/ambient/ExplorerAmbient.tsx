import React from 'react';

/**
 * Quiet "the Xpedition world continues behind you" atmosphere for light pages
 * (Profile, Passport). Pure CSS/SVG, transform + opacity animations only, no
 * JavaScript and no state. It sits behind page content (the parent provides the
 * stacking context), never takes pointer events, and is hidden from assistive
 * technology. Under prefers-reduced-motion the global rule in globals.css stops
 * the drift, so the static atmosphere remains.
 */

type Variant = 'profile' | 'passport';

// Hand-placed (not random) so server and client render identically.
const MOTES: Array<{ left: string; top: string; size: number; delay: string; duration: string; tone: 'green' | 'gold' | 'sky' }> = [
  { left: '6%', top: '78%', size: 4, delay: '0s', duration: '26s', tone: 'green' },
  { left: '12%', top: '38%', size: 3, delay: '-9s', duration: '31s', tone: 'gold' },
  { left: '21%', top: '88%', size: 5, delay: '-17s', duration: '34s', tone: 'sky' },
  { left: '79%', top: '82%', size: 4, delay: '-4s', duration: '29s', tone: 'gold' },
  { left: '88%', top: '46%', size: 3, delay: '-12s', duration: '27s', tone: 'green' },
  { left: '94%', top: '70%', size: 5, delay: '-21s', duration: '36s', tone: 'sky' },
  { left: '71%', top: '22%', size: 3, delay: '-6s', duration: '33s', tone: 'green' },
  { left: '30%', top: '14%', size: 3, delay: '-15s', duration: '30s', tone: 'gold' },
];

const TONE: Record<'green' | 'gold' | 'sky', string> = {
  green: 'rgba(31, 122, 74, 0.42)',
  gold: 'rgba(201, 164, 92, 0.55)',
  sky: 'rgba(110, 160, 200, 0.45)',
};

export const ExplorerAmbient: React.FC<{ variant: Variant; className?: string }> = ({ variant, className = '' }) => (
  <div aria-hidden="true" className={`xp-ambient pointer-events-none select-none overflow-hidden ${className}`}>
    {/* Soft light: a white glow where the content sits, a cool sky top-right, warm land bottom-left */}
    <div
      className="absolute inset-0"
      style={{
        background:
          variant === 'passport'
            ? 'radial-gradient(ellipse 60% 55% at 50% 48%, rgba(255,255,255,0.95), rgba(255,255,255,0) 70%), radial-gradient(ellipse 45% 40% at 90% 4%, rgba(208,226,238,0.6), rgba(208,226,238,0) 70%), radial-gradient(ellipse 45% 40% at 6% 98%, rgba(236,222,190,0.55), rgba(236,222,190,0) 70%)'
            : 'radial-gradient(ellipse 55% 50% at 50% 30%, rgba(255,255,255,0.9), rgba(255,255,255,0) 70%), radial-gradient(ellipse 45% 40% at 92% 8%, rgba(214,230,222,0.65), rgba(214,230,222,0) 70%), radial-gradient(ellipse 50% 45% at 4% 96%, rgba(238,224,196,0.55), rgba(238,224,196,0) 70%)',
      }}
    />

    {/* Two slow light orbs drifting in the margins */}
    <span className="xp-ambient-orb absolute -left-24 top-[18%] w-[340px] h-[340px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(31,122,74,0.10), rgba(31,122,74,0) 65%)' }} />
    <span className="xp-ambient-orb xp-ambient-orb--late absolute -right-28 bottom-[6%] w-[380px] h-[380px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(201,164,92,0.13), rgba(201,164,92,0) 65%)' }} />

    {/* Faint map contours in the corners: the explorer's map under the page */}
    <svg className="absolute -left-10 -bottom-8 w-[420px] h-[300px] opacity-[0.16]" viewBox="0 0 420 300" fill="none">
      {[0, 1, 2, 3, 4].map((i) => (
        <path
          key={i}
          d={`M ${-20 + i * 8} ${300 - i * 34} C ${90 + i * 10} ${250 - i * 36}, ${150 + i * 14} ${300 - i * 30}, ${260 + i * 12} ${240 - i * 34} S ${400 - i * 6} ${180 - i * 30}, ${440} ${150 - i * 28}`}
          stroke="#7A6A48"
          strokeWidth="1"
        />
      ))}
    </svg>
    <svg className="absolute -right-12 -top-6 w-[380px] h-[260px] opacity-[0.13]" viewBox="0 0 380 260" fill="none">
      {[0, 1, 2, 3].map((i) => (
        <path
          key={i}
          d={`M ${400} ${20 + i * 30} C ${300 - i * 10} ${40 + i * 34}, ${250 - i * 12} ${-10 + i * 30}, ${150 - i * 10} ${40 + i * 36} S ${40} ${60 + i * 30}, ${-20} ${30 + i * 34}`}
          stroke="#4E7A68"
          strokeWidth="1"
        />
      ))}
    </svg>

    {/* A dotted journey trail with a travelling light, in the lower margin */}
    <svg className="absolute left-[2%] right-[2%] bottom-[3%] h-[120px] w-[96%] opacity-[0.28]" viewBox="0 0 1000 120" preserveAspectRatio="none" fill="none">
      <path d="M0 96 C 160 60, 260 110, 420 80 S 700 30, 860 64 S 980 90, 1000 70" stroke="#1F5A45" strokeWidth="1.4" strokeDasharray="3 9" strokeLinecap="round" />
    </svg>
    <span className="xp-ambient-trail-light absolute bottom-[3%] left-0 h-[120px] w-[180px]" />

    {/* Floating motes */}
    {MOTES.map((m, i) => (
      <span
        key={i}
        className="xp-ambient-mote absolute rounded-full"
        style={{ left: m.left, top: m.top, width: m.size, height: m.size, background: TONE[m.tone], animationDelay: m.delay, animationDuration: m.duration }}
      />
    ))}

    {variant === 'profile' && (
      /* A faint compass rose, slowly turning, in the empty upper-right area */
      <svg className="xp-ambient-compass absolute right-[4%] top-[9%] w-[132px] h-[132px] opacity-[0.12] hidden lg:block" viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="46" stroke="#1F5A45" strokeWidth="0.8" />
        <circle cx="50" cy="50" r="36" stroke="#1F5A45" strokeWidth="0.6" strokeDasharray="2 4" />
        <path d="M50 8 L56 50 L50 92 L44 50 Z" fill="#1F5A45" opacity="0.55" />
        <path d="M8 50 L50 44 L92 50 L50 56 Z" fill="#C9A45C" opacity="0.6" />
      </svg>
    )}
  </div>
);

export default ExplorerAmbient;
