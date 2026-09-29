'use client';

import React, { useState } from 'react';

type Mode = 'm1' | 'm2' | 'm3' | 'm4' | 'm5' | 'm6' | 'm7' | 'm8' | 'm9' | 'm10';

const TOPICS = [
  ['m1', 'M1 · ONE NEURON', 'Inputs → weights → bias → activation'],
  ['m2', 'M2 · ACTIVATION FUNCTIONS', 'Shape the signal into a useful output'],
  ['m3', 'M3 · FORWARD PROPAGATION', 'Move information through the network'],
  ['m4', 'M4 · LOSS FUNCTION', 'Measure prediction error'],
  ['m5', 'M5 · BACKPROPAGATION', 'Send gradients backward'],
  ['m6', 'M6 · GRADIENT DESCENT', 'Update parameters to reduce loss'],
  ['m7', 'M7 · TOKENS & EMBEDDINGS', 'Turn language into vectors'],
  ['m8', 'M8 · SELF-ATTENTION', 'Connect useful context'],
  ['m9', 'M9 · MULTI-HEAD ATTENTION', 'Learn different relationships'],
  ['m10', 'M10 · TRANSFORMER BLOCK', 'Refine contextual representations'],
] as const;

const REFERENCE_VISUALS: Record<Mode, { src: string; alt: string }> = {
  m1: { src: '/images/neural-network/step-01-one-neuron.png', alt: 'One Neuron exact reference visual' },
  m2: { src: '/images/neural-network/step-02-activation-functions.jpeg', alt: 'Activation Functions exact reference visual' },
  m3: { src: '/images/neural-network/step-03-forward-propagation.png', alt: 'Forward Propagation exact reference visual' },
  m4: { src: '/images/neural-network/step-04-loss-function.jpeg', alt: 'Loss Function exact reference visual' },
  m5: { src: '/images/neural-network/step-05-backpropagation.png', alt: 'Backpropagation exact reference visual' },
  m6: { src: '/images/neural-network/step-06-gradient-descent.png', alt: 'Gradient Descent exact reference visual' },
  m7: { src: '/images/neural-network/step-07-tokens-embeddings.jpeg', alt: 'Tokens and Embeddings exact reference visual' },
  m8: { src: '/images/neural-network/step-08-self-attention.jpeg', alt: 'Self-Attention exact reference visual' },
  m9: { src: '/images/neural-network/step-09-multi-head-attention.png', alt: 'Multi-Head Attention exact reference visual' },
  m10: { src: '/images/neural-network/step-10-transformer-block.png', alt: 'Transformer Block exact reference visual' },
};

function clampMode(raw: string): Mode {
  return (TOPICS.some((x) => x[0] === raw) ? raw : 'm1') as Mode;
}

function ReferenceVisual({ mode, onExplore }: { mode: Mode; onExplore: () => void }) {
  const visual = REFERENCE_VISUALS[mode];
  const index = TOPICS.findIndex((x) => x[0] === mode);

  return (
    <div className="relative overflow-hidden rounded-[26px] border border-cyan-300/30 bg-[#020714] shadow-[0_24px_70px_rgba(0,0,0,.55)]">
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-[#020714]/35 via-transparent to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 -left-1/3 z-20 w-1/3 skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[pulse_3s_ease-in-out_infinite]" />
      <img
        src={visual.src}
        alt={visual.alt}
        className="block h-auto max-h-[min(58vh,640px)] w-full object-contain transition-transform duration-700 hover:scale-[1.015]"
        draggable={false}
      />
      <div className="absolute left-3 top-3 z-30 rounded-xl border border-cyan-300/30 bg-[#020714]/75 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[.16em] text-cyan-100 backdrop-blur-xl">
        Exact reference visual · {index + 1}/10
      </div>
      <button
        type="button"
        onClick={onExplore}
        className="absolute bottom-3 right-3 z-30 rounded-xl border border-white/20 bg-[#020714]/80 px-3 py-2 text-[9px] font-black text-white backdrop-blur-xl transition hover:bg-[#020714] cursor-pointer"
      >
        Explore the visual →
      </button>
    </div>
  );
}

export default function NeuralNetworkClassroomScene({
  mode = 'm1',
  className = '',
}: {
  mode?: string;
  className?: string;
}) {
  const m = clampMode(mode);
  const [expanded, setExpanded] = useState(false);
  const idx = TOPICS.findIndex((x) => x[0] === m);
  const topic = TOPICS[idx];

  return (
    <div className={'relative h-full min-h-[430px] w-full overflow-hidden rounded-[28px] border border-cyan-300/35 bg-[#020714] text-white shadow-[0_30px_90px_-30px_rgba(14,165,233,.75)] ' + className}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_30%,rgba(34,211,238,.14),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(124,58,237,.15),transparent_34%)]" />
      <div className="relative z-10 mx-auto flex h-full w-full max-w-[1100px] flex-col p-3 sm:p-5">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[8px] font-black uppercase tracking-[.24em] text-cyan-300">{topic[1]}</div>
            <h3 className="mt-1 truncate text-sm font-black sm:text-xl">{topic[2]}</h3>
          </div>
          <div className="shrink-0 rounded-xl border border-white/15 bg-white/[.05] px-2.5 py-1.5 text-right">
            <div className="text-[7px] text-slate-500">PATH</div>
            <div className="font-mono text-[10px] text-cyan-100">{idx + 1} / 10</div>
          </div>
        </div>
        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-violet-500 via-indigo-400 to-cyan-300 transition-[width] duration-700" style={{ width: ((idx + 1) / 10) * 100 + '%' }} />
        </div>

        <div className="min-h-0 flex-1">
          <ReferenceVisual mode={m} onExplore={() => setExpanded(true)} />
        </div>
      </div>

      {expanded && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#01030a]/90 p-4 backdrop-blur-xl" onClick={() => setExpanded(false)}>
          <div className="relative max-h-[94dvh] max-w-[94vw] overflow-hidden rounded-[28px] border border-cyan-300/35 bg-[#020714] shadow-[0_30px_120px_rgba(0,0,0,.85)]" onClick={(e) => e.stopPropagation()}>
            <img src={REFERENCE_VISUALS[m].src} alt={REFERENCE_VISUALS[m].alt} className="block max-h-[88dvh] max-w-[92vw] object-contain" draggable={false} />
            <button type="button" onClick={() => setExpanded(false)} className="absolute right-3 top-3 rounded-xl border border-white/20 bg-[#020714]/80 px-3 py-2 text-xs font-bold text-white backdrop-blur-xl cursor-pointer">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
