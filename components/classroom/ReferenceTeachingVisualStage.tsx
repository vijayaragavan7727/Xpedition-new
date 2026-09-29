'use client';

import React from 'react';

const ICON_LABELS: Record<string, string> = { neural_network_teaching: 'AI', molecular_geometry: '3D', heart_anatomy: '♥', projectile_simulation: '↗', interactive_simulation: '✦', dc_motor_diagram: '⚙' };

interface ReferenceTeachingVisualStageProps {
  topicTitle: string;
  subject: string;
  stepTitle: string;
  stepNumber: number;
  totalSteps: number;
  buddyDialogue: string;
  observe?: string;
  visualKind?: string;
  howPoints?: Array<{ text: string; focus?: string }>;
  children: React.ReactNode;
}

const KIND_META: Record<string, { label: string }> = {
  neural_network_teaching: { label: 'Neural visual' },
  molecular_geometry: { label: '3D molecular model' },
  heart_anatomy: { label: 'Animated anatomy' },
  projectile_simulation: { label: 'Motion simulation' },
  interactive_simulation: { label: 'Interactive simulation' },
  dc_motor_diagram: { label: '3D mechanism' },
};

export const ReferenceTeachingVisualStage: React.FC<ReferenceTeachingVisualStageProps> = ({
  topicTitle,
  subject,
  stepTitle,
  stepNumber,
  totalSteps,
  buddyDialogue,
  observe,
  visualKind,
  howPoints = [],
  children,
}) => {
  const meta = KIND_META[visualKind ?? ''] ?? { label: 'Interactive 3D visual' };
  const iconLabel = ICON_LABELS[visualKind ?? ''] ?? '✦';

  return (
    <section
      data-testid="reference-teaching-visual-stage"
      className="relative overflow-hidden rounded-[28px] border border-indigo-100 bg-white shadow-[0_22px_70px_-28px_rgba(61,45,145,0.42)]"
    >
      <style>{`
        @keyframes xpSceneFloat {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(-1deg); }
          50% { transform: translate3d(0, -7px, 0) rotate(1deg); }
        }
        @keyframes xpScenePulse {
          0%, 100% { opacity: .35; transform: scale(.92); }
          50% { opacity: .75; transform: scale(1.05); }
        }
        @keyframes xpSceneSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes xpSceneShimmer {
          0% { transform: translateX(-120%) skewX(-18deg); }
          55%, 100% { transform: translateX(180%) skewX(-18deg); }
        }
        @keyframes xpBuddyBob {
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          50% { transform: translateY(-5px) rotate(1deg); }
        }
        .xp-scene-float { animation: xpSceneFloat 4.5s ease-in-out infinite; }
        .xp-scene-pulse { animation: xpScenePulse 2.8s ease-in-out infinite; }
        .xp-scene-spin { animation: xpSceneSpin 18s linear infinite; }
        .xp-buddy-bob { animation: xpBuddyBob 3.8s ease-in-out infinite; }
      `}</style>

      {/* Reference-style lesson header */}
      <div className="relative z-20 px-4 sm:px-6 pt-4 pb-3 bg-white border-b border-slate-100">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-semibold text-indigo-500">
              <span className="truncate">{subject}</span>
              <span className="text-slate-300">›</span>
              <span className="truncate">{topicTitle}</span>
            </div>
            <h3 className="mt-1 font-black text-xl sm:text-2xl text-[#182B8C] tracking-tight truncate">
              {stepTitle}
            </h3>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold">
              <span className="text-violet-600 text-sm">✦</span>
              {meta.label}
            </div>
            <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-600 whitespace-nowrap">
              Step {stepNumber} / {totalSteps}
            </div>
          </div>
        </div>

        <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400 transition-[width] duration-700"
            style={{ width: `${Math.max(8, (stepNumber / Math.max(totalSteps, 1)) * 100)}%` }}
          />
        </div>
      </div>

      {/* Hero visual scene */}
      <div className="relative min-h-[390px] sm:min-h-[430px] lg:min-h-[470px] overflow-hidden bg-[radial-gradient(circle_at_78%_44%,#d9f8ff_0%,#edf4ff_27%,#f7f5ff_55%,#fff_100%)]">
        {/* Scenic depth layers */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,.9)_0%,transparent_30%,rgba(89,72,190,.06)_100%)]" />
        <div className="absolute -right-24 -top-28 w-80 h-80 rounded-full bg-cyan-300/20 blur-3xl xp-scene-pulse" />
        <div className="absolute -left-24 bottom-0 w-96 h-72 rounded-full bg-violet-300/20 blur-3xl" />

        {/* Futuristic 3D platform behind the renderer */}
        <div className="absolute right-[5%] sm:right-[8%] top-[18%] w-[56%] sm:w-[52%] h-[58%] rounded-[34px] bg-gradient-to-br from-white/90 via-indigo-50/70 to-cyan-50/60 border border-white shadow-[0_30px_60px_-30px_rgba(67,56,202,.45)] [transform:perspective(900px)_rotateY(-5deg)_rotateX(2deg)]" />
        <div className="absolute right-[9%] sm:right-[12%] top-[22%] w-[48%] sm:w-[44%] h-[49%] rounded-[28px] border border-cyan-300/60 bg-slate-950/5 shadow-[inset_0_0_35px_rgba(56,189,248,.12)] overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,.18),transparent_60%)]" />
          <div className="absolute left-1/2 top-1/2 w-36 h-36 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/50 xp-scene-spin" />
          <div className="absolute left-1/2 top-1/2 w-24 h-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-violet-400/50 xp-scene-spin" style={{ animationDirection: 'reverse', animationDuration: '11s' }} />
        </div>

        {/* Actual concept visual — deterministic / interactive */}
        <div className="absolute z-10 right-[2%] sm:right-[6%] top-[13%] w-[65%] sm:w-[58%] h-[65%] flex items-center justify-center">
          <div className="w-full h-full drop-shadow-[0_20px_35px_rgba(30,41,59,.22)]">
            {children}
          </div>
        </div>

        {/* Buddy + narration bubble */}
        <div className="absolute z-20 left-[3%] sm:left-[6%] bottom-[7%] w-[46%] sm:w-[39%]">
          <div className="relative ml-1 sm:ml-3 mb-2 sm:mb-3 max-w-[300px] rounded-[22px] rounded-bl-[8px] bg-white/95 border border-indigo-100 px-4 py-3 shadow-[0_15px_35px_-18px_rgba(67,56,202,.45)]">
            <div className="absolute -bottom-2 left-8 w-4 h-4 bg-white border-r border-b border-indigo-100 rotate-45" />
            <div className="flex items-start gap-2">
              <span className="w-4 h-4 mt-0.5 text-violet-600 shrink-0 text-xs">🔊</span>
              <p className="text-[11px] sm:text-[13px] leading-[1.45] font-semibold text-[#26348F]">
                {buddyDialogue}
              </p>
            </div>
          </div>

          <div className="relative w-[145px] sm:w-[175px] h-[145px] sm:h-[175px] xp-buddy-bob">
            <div className="absolute left-1/2 bottom-1 w-28 sm:w-36 h-8 -translate-x-1/2 rounded-full bg-indigo-300/30 blur-xl" />
            <img
              src="/images/robot.png"
              alt="Buddy teaching robot"
              className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_20px_25px_rgba(30,41,59,.22)]"
            />
          </div>
        </div>

        {/* Floating 3D concept chips */}
        <div className="absolute z-30 left-[3%] sm:left-[7%] top-[9%] xp-scene-float">
          <div className="flex items-center gap-2 rounded-2xl bg-white/90 border border-violet-100 px-3 py-2 shadow-[0_14px_30px_-18px_rgba(67,56,202,.55)] [transform:perspective(500px)_rotateX(8deg)_rotateY(-8deg)]">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center shadow-lg">
              {iconLabel}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-indigo-800">Learn by seeing</span>
          </div>
        </div>

        <div className="absolute z-30 right-[5%] sm:right-[9%] top-[8%] xp-scene-float" style={{ animationDelay: '1.1s' }}>
          <div className="rounded-2xl bg-[#172A8A] text-white px-3 py-2 shadow-[0_14px_35px_-16px_rgba(23,42,138,.65)] [transform:perspective(500px)_rotateX(7deg)_rotateY(8deg)]">
            <div className="text-[9px] uppercase tracking-[.18em] text-cyan-200">Focus</div>
            <div className="text-[11px] font-bold max-w-[120px] truncate">{observe || stepTitle}</div>
          </div>
        </div>

        {/* Shimmer over the scene */}
        <div className="absolute z-40 inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" style={{ animation: 'xpSceneShimmer 5.5s ease-in-out infinite' }} />

        {/* Bottom visual controls / status */}
        <div className="absolute z-40 left-4 right-4 bottom-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/90 border border-slate-100 shadow-sm text-[10px] sm:text-xs text-slate-600 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Interactive visual active
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/90 border border-slate-100 shadow-sm text-[10px] text-slate-500">
            <span className="text-violet-600">▶</span>
            Explore the visual
            <span className="text-violet-600">→</span>
          </div>
        </div>
      </div>

      {/* Mini lesson strip — reference-inspired */}
      {howPoints.length > 0 && (
        <div className="px-4 sm:px-5 py-4 bg-white border-t border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-4 h-4 text-violet-600">💡</span>
            <span className="text-sm font-black text-[#182B8C]">What to notice</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {howPoints.slice(0, 4).map((point, index) => (
              <div
                key={`${index}-${point.text}`}
                className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-indigo-50/60 p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-[11px] font-black flex items-center justify-center shadow-md">
                    {index + 1}
                  </span>
                  <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wide">Point {index + 1}</span>
                </div>
                <p className="mt-2 text-[11px] leading-snug text-slate-600 font-medium line-clamp-3">{point.text}</p>
                <div className="absolute -right-5 -bottom-5 w-14 h-14 rounded-full bg-cyan-300/15 group-hover:scale-150 transition-transform duration-500" />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default ReferenceTeachingVisualStage;
