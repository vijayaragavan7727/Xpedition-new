'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { ArrowRight, BrainCircuit, CheckCircle2, GitBranch, Maximize2, Play, RotateCcw, X, Zap } from 'lucide-react';

type Mode =
  | 'm1' | 'm2' | 'm3' | 'm4' | 'm5' | 'm6'
  | 'm7' | 'm8' | 'm9' | 'm10' | 'm11' | 'q1';

const TOPICS = [
  ['m1','M1 · ONE NEURON','Inputs → weights → bias → activation'],
  ['m2','M2 · ACTIVATION FUNCTIONS','Turn a weighted signal into a useful output'],
  ['m3','M3 · FORWARD PROPAGATION','Move information through layers'],
  ['m4','M4 · LOSS FUNCTION','Measure prediction error'],
  ['m5','M5 · BACKPROPAGATION','Send the error signal backward'],
  ['m6','M6 · GRADIENT DESCENT','Update parameters to reduce loss'],
  ['m7','M7 · DEEP NETWORKS','Stack representations into richer features'],
  ['m8','M8 · TOKENS & EMBEDDINGS','Turn language into vectors'],
  ['m9','M9 · SELF-ATTENTION','Let each token use context'],
  ['m10','M10 · MULTI-HEAD + POSITION','Relationships plus token order'],
  ['m11','M11 · TRANSFORMER BLOCK','Attention → residual → norm → FFN'],
  ['q1','FINAL · DECISION CHECK','Your answer chooses the next neural-network path'],
] as const;

function clampMode(raw: string): Mode {
  const found = TOPICS.some((x) => x[0] === raw);
  return (found ? raw : 'm1') as Mode;
}

const glow =
  'shadow-[0_0_18px_rgba(34,211,238,.65),0_0_42px_rgba(99,102,241,.25)]';

function Node({ label, tone = 'cyan', small = false }: { label: string; tone?: 'cyan'|'violet'|'green'|'amber'|'pink'; small?: boolean }) {
  const cls = {
    cyan: 'from-cyan-100 via-cyan-400 to-blue-700',
    violet: 'from-fuchsia-100 via-violet-400 to-indigo-700',
    green: 'from-emerald-100 via-emerald-400 to-teal-700',
    amber: 'from-amber-100 via-amber-300 to-orange-600',
    pink: 'from-pink-100 via-fuchsia-400 to-purple-700',
  }[tone];
  return (
    <div className={(small ? 'h-7 w-7 text-[7px]' : 'h-9 w-9 sm:h-11 sm:w-11 text-[9px]') + ' rounded-full bg-gradient-to-br ' + cls + ' border-2 border-white/75 shadow-[0_0_20px_rgba(56,189,248,.55)] flex items-center justify-center font-black text-slate-950 animate-pulse'}>
      {label}
    </div>
  );
}

function Wire({active = true, vertical = false }: { active?: boolean; vertical?: boolean }) {
  return <div className={(vertical ? 'w-px h-7' : 'h-px w-full') + ' ' + (active ? 'bg-gradient-to-r from-cyan-300 via-violet-300 to-emerald-300 shadow-[0_0_10px_rgba(34,211,238,.8)]' : 'bg-white/10')} />;
}

function HoloCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={'relative overflow-hidden rounded-[26px] border border-cyan-300/40 bg-[#030918]/90 p-4 sm:p-5 backdrop-blur-xl shadow-[0_24px_70px_-35px_rgba(14,165,233,.85),inset_0_0_35px_rgba(99,102,241,.13)] ' + className}>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,.09),transparent_24%,transparent_74%,rgba(34,211,238,.08))]" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function Network({ deep = false }: { deep?: boolean }) {
  const layers = deep ? [2,3,4,3,2,1] : [2,3,1];
  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-3">
      {layers.map((count, li) => (
        <React.Fragment key={li}>
          <div className="flex flex-col gap-1.5 sm:gap-2.5">
            {Array.from({ length: count }, (_, i) => (
              <Node key={i} label={li === 0 ? 'x' : li === layers.length - 1 ? 'ŷ' : 'h' + (i + 1)} tone={li === layers.length - 1 ? 'green' : li % 2 ? 'violet' : 'cyan'} small={count > 3} />
            ))}
          </div>
          {li < layers.length - 1 && (
            <div className="w-5 sm:w-9 space-y-2">
              {Array.from({ length: Math.min(4, Math.max(2, count)) }, (_, i) => <Wire key={i} />)}
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function TopicHeader({ kicker, title, subtitle }: { kicker: string; title: string; subtitle: string }) {
  return (
    <div className="mb-4 sm:mb-5">
      <div className="text-[8px] sm:text-[9px] font-black uppercase tracking-[.22em] text-cyan-300">{kicker}</div>
      <h4 className="mt-1 text-lg sm:text-2xl font-black tracking-tight">{title}</h4>
      <p className="mt-1 text-[9px] sm:text-[11px] text-slate-400">{subtitle}</p>
    </div>
  );
}

function SideSteps({ current }: { current: number }) {
  const items = ['Forward pass','Calculate loss','Backpropagate','Update weights'];
  return (
    <div className="rounded-2xl border border-indigo-300/25 bg-indigo-500/10 p-3 sm:p-4">
      <div className="text-[8px] uppercase tracking-[.2em] text-indigo-200 font-black mb-2">How networks learn</div>
      <div className="space-y-1.5">
        {items.map((x, i) => (
          <div key={x} className={'flex items-center gap-2 rounded-xl border px-2.5 py-2 ' + (i === current ? 'border-cyan-300/50 bg-cyan-400/15' : 'border-white/10 bg-white/[.03]')}>
            <span className="h-6 w-6 rounded-full bg-gradient-to-br from-violet-400 to-blue-600 flex items-center justify-center text-[9px] font-black">{i + 1}</span>
            <div><div className="text-[9px] font-bold">{x}</div><div className="text-[8px] text-slate-500">{i === 0 ? 'Make a prediction' : i === 1 ? 'Measure the error' : i === 2 ? 'Find gradients' : 'Improve over time'}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NeuralHologram({ deep = false }: { deep?: boolean }) {
  return (
    <div className={"relative rounded-[24px] border border-cyan-300/55 bg-[#020814]/85 p-4 sm:p-5 " + glow}>
      <div className="absolute inset-0 rounded-[24px] bg-[radial-gradient(circle_at_center,rgba(14,165,233,.22),transparent_60%)]" />
      <div className="relative">
        <div className="text-center text-sm sm:text-xl font-black text-cyan-50">Neural Network</div>
        <div className="mt-4"><Network deep={deep} /></div>
        <div className="mt-4 rounded-xl border border-cyan-300/25 bg-cyan-400/[.05] p-2 text-center text-[8px] sm:text-[10px] text-cyan-100">Multiple layers transform representations until the output can support a prediction.</div>
      </div>
    </div>
  );
}

function DecisionTree({ selected, setSelected }: { selected: string | null; setSelected: (v: string) => void }) {
  const branches = [
    ['A','I want more neuron mechanics','Neuron mechanics + activations'],
    ['B','I want more learning / training','Loss + gradients + optimization'],
    ['C','I want language models','Attention + transformer internals'],
  ];
  return (
    <HoloCard>
      <div className="flex items-center justify-between gap-2">
        <div><div className="text-[8px] uppercase tracking-[.22em] text-fuchsia-300 font-black">FINAL · DECISION TREE</div><h4 className="text-lg sm:text-2xl font-black">Choose your next neural-network path</h4></div>
        <GitBranch className="h-6 w-6 text-cyan-300" />
      </div>
      <div className="mt-4 mx-auto max-w-3xl">
        <div className="mx-auto w-fit rounded-2xl border border-violet-300/45 bg-violet-500/15 px-4 py-2 text-center text-[10px] sm:text-xs font-black">What do you want to explore next?</div>
        <div className="mx-auto h-6 w-px bg-cyan-300/60" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {branches.map(([id, title, sub]) => (
            <button key={id} type="button" onClick={() => setSelected(id)} className={'relative text-left rounded-2xl border p-3 transition-all cursor-pointer ' + (selected === id ? 'border-emerald-300 bg-emerald-400/15 shadow-[0_0_28px_rgba(52,211,153,.25)]' : 'border-white/10 bg-white/[.04] hover:border-cyan-300/40 hover:bg-cyan-400/[.06]')}>
              <div className="text-[8px] uppercase tracking-widest text-cyan-200">Path {id}</div>
              <div className="mt-1 text-[10px] sm:text-xs font-bold text-white">{title}</div>
              <div className="mt-2 text-[8px] text-slate-500">{sub}</div>
              {selected === id && <CheckCircle2 className="absolute right-2 top-2 h-4 w-4 text-emerald-300" />}
            </button>
          ))}
        </div>
        <div className="mt-3 text-center text-[8px] text-slate-500">Your final class answer is recorded separately; this tree previews the route that can follow your mastery.</div>
      </div>
    </HoloCard>
  );
}

function SceneContent({ mode }: { mode: Mode }) {
  const [running, setRunning] = useState(false);
  const [selectedToken, setSelectedToken] = useState('cat');
  const [selected, setSelected] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  if (mode === 'q1') return <DecisionTree selected={selected} setSelected={setSelected} />;

  if (mode === 'm1') return <HoloCard><TopicHeader kicker="M1 · ONE NEURON" title="Watch One Neuron Calculate" subtitle="A tiny deterministic model: inputs × weights + bias → activation → output" /><div className="flex items-center justify-center gap-2 sm:gap-4"><div className="space-y-3"><Node label="x₁" /><Node label="x₂" /></div><div className="w-7 sm:w-12 space-y-3"><Wire /><Wire /></div><div className="rounded-2xl border border-violet-300/45 bg-violet-500/10 p-3 sm:p-4 text-center"><div className="text-[8px] uppercase tracking-widest text-violet-200">weighted sum</div><div className="mt-2 text-2xl sm:text-3xl font-black">0.78</div><div className="mt-1 text-[8px] text-slate-500">0.8×0.5 + 0.4×0.7 + 0.1</div></div><ArrowRight className="h-5 w-5 text-cyan-300" /><Node label="ŷ" tone="green" /></div><div className="mt-4 grid grid-cols-3 gap-2"><div className="rounded-xl bg-white/5 p-2 text-center text-[8px]">Input<br/><b>0.8 · 0.4</b></div><div className="rounded-xl bg-white/5 p-2 text-center text-[8px]">Weights<br/><b>0.5 · 0.7</b></div><div className="rounded-xl bg-white/5 p-2 text-center text-[8px]">Output<br/><b>0.686</b></div></div></HoloCard>;

  if (mode === 'm2') return <HoloCard><TopicHeader kicker="M2 · ACTIVATION FUNCTIONS" title="From Raw Signal to Useful Signal" subtitle="Three functions shape the same pre-activation in different ways." /><div className="grid grid-cols-3 gap-2 sm:gap-4">{[['Sigmoid','0 → 1'],['ReLU','max(0,z)'],['Tanh','−1 → +1']].map(([name, formula]) => <div key={name} className="rounded-2xl border border-white/10 bg-white/[.04] p-3"><div className="text-[10px] font-bold">{name}</div><div className="relative mt-3 h-20 overflow-hidden rounded-xl bg-black/30"><div className="absolute left-3 right-3 top-1/2 h-1 rounded-full bg-gradient-to-r from-cyan-300 via-violet-300 to-emerald-300 shadow-[0_0_15px_rgba(34,211,238,.7)]" /><div className="absolute left-1/2 top-2 bottom-2 w-px bg-white/10" /></div><div className="mt-2 text-[8px] text-slate-500">{formula}</div></div>)}</div></HoloCard>;

  if (mode === 'm3') return <HoloCard><TopicHeader kicker="M3 · FORWARD PROPAGATION" title="Follow the Signal Through a Network" subtitle="The output of one layer becomes the input to the next." /><NeuralHologram /><button type="button" onClick={() => setRunning(v => !v)} className="mx-auto mt-4 block rounded-xl border border-cyan-300/35 bg-cyan-400/10 px-4 py-2 text-[10px] font-black text-cyan-100 cursor-pointer">{running ? 'Forward pass running…' : 'Run forward pass'} <Play className="ml-1 inline h-3 w-3" /></button></HoloCard>;

  if (mode === 'm4') return <HoloCard><TopicHeader kicker="M4 · LOSS FUNCTION" title="Prediction vs Target" subtitle="Loss turns an incorrect prediction into a measurable learning signal." /><div className="grid grid-cols-2 gap-3"><div className="rounded-2xl border border-white/10 bg-white/[.04] p-3"><div className="text-[8px] text-slate-500">Prediction ŷ</div><div className="mt-2 h-4 rounded-full bg-white/10 overflow-hidden"><div className="h-full w-[68%] rounded-full bg-gradient-to-r from-cyan-300 to-blue-500" /></div><div className="mt-2 text-right font-mono text-xs">68%</div></div><div className="rounded-2xl border border-white/10 bg-white/[.04] p-3"><div className="text-[8px] text-slate-500">Target y</div><div className="mt-2 h-4 rounded-full bg-white/10 overflow-hidden"><div className="h-full w-full rounded-full bg-gradient-to-r from-emerald-300 to-teal-500" /></div><div className="mt-2 text-right font-mono text-xs">100%</div></div></div><div className="mt-4 rounded-2xl border border-amber-300/25 bg-amber-400/[.06] p-4 text-center"><div className="text-[8px] uppercase tracking-widest text-amber-200">loss</div><div className="text-3xl font-black">0.1024</div><div className="text-[8px] text-slate-500">(1 − 0.68)²</div></div></HoloCard>;

  if (mode === 'm5') return <HoloCard><TopicHeader kicker="M5 · BACKPROPAGATION" title="The Error Travels Backward" subtitle="Gradients tell each parameter how the loss changes when that parameter moves." /><div className="flex items-center justify-center gap-1 sm:gap-3"><Network /><ArrowRight className="h-5 w-5 rotate-180 text-amber-300" /><div className="rounded-xl border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-[9px] font-bold text-amber-100">gradient signal</div></div><div className="mt-4 grid grid-cols-3 gap-2"><div className="rounded-xl bg-white/5 p-2 text-center text-[8px]">Loss</div><div className="rounded-xl bg-white/5 p-2 text-center text-[8px]">∂L/∂w</div><div className="rounded-xl bg-white/5 p-2 text-center text-[8px]">Updated w</div></div></HoloCard>;

  if (mode === 'm6') return <HoloCard><TopicHeader kicker="M6 · GRADIENT DESCENT" title="Step Down the Loss Landscape" subtitle="Each update moves parameters in the direction that reduces the current loss." /><div className="relative mx-auto h-44 max-w-2xl overflow-hidden rounded-2xl border border-emerald-300/20 bg-[radial-gradient(ellipse_at_center,#123b43,#020714_70%)]"><div className="absolute left-[8%] top-[28%] h-36 w-[84%] rounded-[50%] border border-cyan-300/20 [transform:perspective(500px)_rotateX(62deg)]" /><div className="absolute left-[48%] top-[53%] h-5 w-5 animate-pulse rounded-full bg-amber-300 shadow-[0_0_25px_rgba(251,191,36,.9)]" /><div className="absolute right-4 top-4 text-[8px] text-slate-500">high loss</div><div className="absolute left-1/2 bottom-4 text-[8px] text-emerald-300">lower loss</div></div><div className="mt-3 text-center font-mono text-xs sm:text-sm text-emerald-100">θ ← θ − η · ∂L/∂θ</div><button type="button" onClick={() => setRunning(v => !v)} className="mx-auto mt-3 block rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-[10px] cursor-pointer">{running ? 'Optimizing…' : 'Run update'} <Zap className="ml-1 inline h-3 w-3" /></button></HoloCard>;

  if (mode === 'm7') return <HoloCard><TopicHeader kicker="M7 · DEEP NETWORKS" title="Why Depth Matters" subtitle="More layers create successive transformations of the representation." /><NeuralHologram deep /><div className="mt-3 text-center text-[8px] text-slate-500">simple patterns → compositions → richer representations → prediction</div></HoloCard>;

  if (mode === 'm8') return <HoloCard><TopicHeader kicker="M8 · TOKENS & EMBEDDINGS" title="From Words to Vectors" subtitle="A language model starts by mapping tokens into numerical representations." /><div className="grid grid-cols-3 gap-2">{['the','cat','sat'].map((t, i) => <button type="button" key={t} onClick={() => setSelectedToken(t)} className={'rounded-2xl border p-3 cursor-pointer transition-all ' + (selectedToken === t ? 'border-cyan-300 bg-cyan-400/15 ' + glow : 'border-white/10 bg-white/[.04]')}><div className="text-sm font-black">{t}</div><div className="mt-2 flex justify-center gap-1">{[0,1,2].map(n => <span key={n} className="h-2 w-2 rounded-full bg-gradient-to-br from-cyan-300 to-violet-500" />)}</div><div className="mt-2 text-[8px] text-slate-500">{selectedToken === t ? 'vector selected' : 'select token'}</div></button>)}</div><div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-400/[.04] p-3 text-center text-[9px]">Embedding({selectedToken}) = [0.{selectedToken.length}2, 0.7{selectedToken.length}, 0.31]</div></HoloCard>;

  if (mode === 'm9') return <HoloCard><TopicHeader kicker="M9 · SELF-ATTENTION" title="Watch Attention Connect Tokens" subtitle="A query compares with keys, then uses the resulting weights to mix values." /><div className="grid grid-cols-3 gap-2">{['the','cat','sat'].map(t => <button type="button" key={t} onClick={() => setSelectedToken(t)} className={'rounded-2xl border p-3 cursor-pointer ' + (selectedToken === t ? 'border-cyan-300 bg-cyan-400/15' : 'border-white/10 bg-white/[.04]')}><div className="text-sm font-black">{t}</div><div className="mt-2 text-[8px] text-slate-500">{selectedToken === t ? 'query selected' : 'select query'}</div></button>)}</div><div className="mt-4 flex items-center justify-center gap-3"><Node label="Q" tone="cyan" /><ArrowRight className="h-4 w-4 text-cyan-300" /><Node label="K" tone="violet" /><ArrowRight className="h-4 w-4 text-violet-300" /><Node label="V" tone="green" /></div><div className="mt-3 rounded-2xl border border-cyan-300/20 bg-black/20 p-3 text-center text-[9px]">Query <b className="text-cyan-200">{selectedToken}</b> compares with every key and produces attention weights.</div></HoloCard>;

  if (mode === 'm10') return <HoloCard><TopicHeader kicker="M10 · MULTI-HEAD + POSITION" title="Two Relationship Views + Token Order" subtitle="Different heads can focus on different relationships while position preserves order." /><div className="grid grid-cols-2 gap-3"><div className="rounded-2xl border border-violet-300/25 bg-violet-500/[.05] p-3"><div className="text-[9px] font-black text-violet-200">HEAD A</div><div className="mt-3 grid grid-cols-3 gap-1.5">{['80%','15%','5%'].map(x => <div key={x} className="rounded-lg bg-violet-400/10 p-2 text-center text-[8px]">{x}</div>)}</div></div><div className="rounded-2xl border border-cyan-300/25 bg-cyan-500/[.05] p-3"><div className="text-[9px] font-black text-cyan-200">HEAD B</div><div className="mt-3 grid grid-cols-3 gap-1.5">{['20%','55%','25%'].map(x => <div key={x} className="rounded-lg bg-cyan-400/10 p-2 text-center text-[8px]">{x}</div>)}</div></div></div><div className="mt-4 flex items-center justify-between rounded-2xl border border-amber-300/20 bg-amber-400/[.05] p-3"><span className="text-[8px] text-amber-100">Positional encoding</span><div className="flex gap-1">{[0,1,2,3].map(i => <button type="button" key={i} onClick={() => setStep(i)} className={'h-7 w-7 rounded-lg text-[8px] cursor-pointer ' + (step === i ? 'bg-amber-300 text-slate-950' : 'bg-white/10')}>{i}</button>)}</div><span className="font-mono text-[8px] text-amber-200">PE({step})</span></div></HoloCard>;

  return <HoloCard><TopicHeader kicker="M11 · TRANSFORMER BLOCK" title="Inside One Transformer Block" subtitle="Attention mixes context; residuals preserve the stream; normalization stabilizes it; FFN refines each position." /><div className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-center">{['Attention','Residual','Norm','FFN','Norm'].map((x, i) => <React.Fragment key={x}>{i > 0 && <ArrowRight className="hidden sm:block h-4 w-4 text-cyan-300" />}<div className="rounded-2xl border border-cyan-300/25 bg-cyan-400/[.05] p-3 text-center"><div className="text-[8px] font-black">{x}</div><div className="mx-auto mt-3 h-7 w-7 rounded-full bg-gradient-to-br from-cyan-200 to-indigo-600 shadow-[0_0_18px_rgba(34,211,238,.6)]" /></div></React.Fragment>)}</div><div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-3 text-center text-[8px] text-slate-400">Context → stable residual stream → refined representation → next-token scores.</div></HoloCard>;
}

function ExplorerOverlay({ mode, onClose }: { mode: Mode; onClose: () => void }) {
  const topic = TOPICS.find((x) => x[0] === mode) ?? TOPICS[0];
  return (
    <div className="absolute inset-2 sm:inset-4 z-[80] rounded-[28px] border border-cyan-300/45 bg-[#020714]/96 backdrop-blur-2xl shadow-[0_30px_120px_rgba(0,0,0,.85)] overflow-auto">
      <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-white/10 bg-[#030918]/95 px-4 py-3">
        <div><div className="text-[8px] uppercase tracking-[.22em] text-cyan-300">3D VISUAL EXPLORER</div><div className="text-sm sm:text-lg font-black">{topic[1]}</div></div>
        <button type="button" onClick={onClose} aria-label="Close visual explorer" className="h-9 w-9 rounded-xl border border-white/15 bg-white/5 flex items-center justify-center cursor-pointer hover:bg-white/10"><X className="h-4 w-4" /></button>
      </div>
      <div className="grid lg:grid-cols-[1.5fr_.8fr] gap-4 p-4 sm:p-6">
        <div className="min-h-[360px] rounded-[26px] border border-cyan-300/25 bg-[radial-gradient(circle_at_center,rgba(29,78,216,.25),transparent_50%),linear-gradient(180deg,#061536,#01050f)] p-4 sm:p-6 flex items-center justify-center [transform:perspective(1200px)_rotateX(2deg)]">
          <SceneContent mode={mode} />
        </div>
        <div className="space-y-3">
          <SideSteps current={Math.min(3, Math.max(0, TOPICS.findIndex((x) => x[0] === mode)))} />
          <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4"><div className="text-[9px] font-black uppercase tracking-widest text-cyan-200">Explore mode</div><p className="mt-2 text-[10px] leading-relaxed text-slate-400">Rotate through the concept visually, inspect the glowing network, then close the explorer to continue the lesson.</p></div>
        </div>
      </div>
    </div>
  );
}

export default function NeuralNetworkClassroomScene({ mode = 'm1', className = '' }: { mode?: string; className?: string }) {
  const m = clampMode(mode);
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [decision, setDecision] = useState<string | null>(null);
  const idx = Math.max(0, TOPICS.findIndex((x) => x[0] === m));
  const topic = TOPICS[idx] ?? TOPICS[0];
  const progress = ((idx + 1) / TOPICS.length) * 100;

  const roomStyle = useMemo(() => ({
    backgroundImage:
      "linear-gradient(180deg, rgba(2,8,20,.18), rgba(1,4,12,.72)), radial-gradient(circle at 16% 48%, rgba(56,189,248,.18), transparent 28%), radial-gradient(circle at 76% 24%, rgba(124,58,237,.20), transparent 35%), url('/images/classroom/classroom-interior-clean.png')",
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }), []);

  return (
    <div className={'relative h-full min-h-[560px] w-full overflow-hidden rounded-[28px] border border-cyan-300/35 bg-[#020714] text-white shadow-[0_30px_90px_-30px_rgba(14,165,233,.75)] ' + className} style={roomStyle}>
      <style>{`
        @keyframes xpScan{0%{transform:translateX(-120%)}55%,100%{transform:translateX(180%)}}
        @keyframes xpFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes xpPulse{0%,100%{opacity:.55}50%{opacity:1}}
        .xp-scan{animation:xpScan 5.5s ease-in-out infinite}.xp-float{animation:xpFloat 4s ease-in-out infinite}.xp-pulse{animation:xpPulse 2.8s ease-in-out infinite}
      `}</style>

      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/10 via-slate-950/20 to-slate-950/80" />
      <div className="absolute left-[8%] right-[8%] bottom-[6%] h-16 rounded-[50%] bg-[#0a1224]/85 border border-cyan-300/20 shadow-[0_22px_55px_rgba(0,0,0,.65)] [transform:perspective(900px)_rotateX(58deg)]" />
      <div className="absolute left-1/2 bottom-[8%] h-3 w-[52%] -translate-x-1/2 rounded-full bg-cyan-300/20 blur-md" />
      <div className="absolute right-[12%] bottom-[12%] hidden md:block h-20 w-28 rounded-xl border border-white/10 bg-slate-900/75 shadow-2xl [transform:perspective(600px)_rotateY(-12deg)_rotateX(5deg)]">
        <div className="m-2 h-10 rounded-lg border border-cyan-300/20 bg-[radial-gradient(circle_at_50%_40%,rgba(34,211,238,.28),transparent_58%),#020814]">
          <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-cyan-300/40" />
          <div className="mx-auto mt-1.5 h-5 w-16 rounded-full border border-violet-300/30" />
        </div>
        <div className="mx-auto h-1 w-20 rounded-full bg-slate-700" />
      </div>
            <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(56,189,248,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,.12)_1px,transparent_1px)] [background-size:46px_46px] [transform:perspective(900px)_rotateX(62deg)_translateY(28%)]" />
      <div className="absolute -left-16 top-1/3 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="absolute left-1/2 bottom-8 h-20 w-[72%] -translate-x-1/2 rounded-[50%] border border-cyan-300/25 bg-cyan-400/[.04] shadow-[0_0_80px_rgba(34,211,238,.15)]" />
      <div className="absolute inset-x-0 top-0 h-1/3 overflow-hidden"><div className="xp-scan absolute -left-1/3 top-0 h-full w-1/3 bg-gradient-to-r from-transparent via-cyan-300/10 to-transparent skew-x-[-18deg]" /></div>

      <div className="absolute left-3 top-3 z-30 flex items-center gap-2 rounded-xl border border-cyan-300/25 bg-black/50 px-2.5 py-1.5 backdrop-blur-xl">
        <BrainCircuit className="h-4 w-4 text-cyan-300" />
        <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[.18em] text-cyan-100">Neural Networks</span>
        <span className="rounded bg-emerald-400/10 px-1.5 py-0.5 text-[7px] text-emerald-200">REAL-WORLD 3D LAB</span>
      </div>

      <div className="absolute left-3 top-[15%] z-30 hidden lg:block w-48 xl:w-56 xp-float">
        <div className="rounded-[22px] border border-cyan-300/30 bg-black/55 p-3 backdrop-blur-xl shadow-[0_18px_45px_rgba(0,0,0,.4)]">
          <div className="flex items-center gap-2">
            <Image src="/images/classroom/buddy-teacher-exact.png" alt="Buddy" width={62} height={62} className="object-contain drop-shadow-[0_0_15px_rgba(34,211,238,.4)]" />
            <div><div className="text-[10px] font-black text-cyan-200">Buddy</div><div className="text-[8px] text-emerald-300">TEACHING LIVE</div></div>
          </div>
          <p className="mt-2 text-[9px] leading-relaxed text-slate-200">Follow the glowing model. Watch the calculation, then predict what changes when the parameters move.</p>
        </div>
      </div>

      <div className="absolute right-3 top-[12%] z-30 hidden xl:block w-44">
        <div className="rounded-[22px] border border-violet-300/25 bg-black/50 p-3 backdrop-blur-xl">
          <div className="text-[8px] uppercase tracking-[.18em] text-violet-200 font-black mb-2">Focus</div>
          {TOPICS.slice(Math.max(0, idx - 1), Math.min(TOPICS.length, idx + 2)).map((x) => <div key={x[0]} className={'mb-1 rounded-lg px-2 py-1.5 text-[8px] ' + (x[0] === m ? 'border border-cyan-300/25 bg-cyan-400/15 text-cyan-100' : 'bg-white/5 text-slate-500')}>{x[1]}</div>)}
        </div>
      </div>

      <div className="relative z-10 flex min-h-[560px] items-center justify-center p-3 pt-12 sm:p-5 sm:pt-10">
        <div className="w-full max-w-[960px]">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div><div className="text-[8px] uppercase tracking-[.24em] text-cyan-300 font-black">{topic[1]}</div><h3 className="mt-1 text-sm sm:text-xl font-black">{topic[2]}</h3></div>
            <div className="rounded-xl border border-white/15 bg-white/[.05] px-2.5 py-1.5 text-right"><div className="text-[7px] text-slate-500">PATH</div><div className="font-mono text-[10px] text-cyan-100">{idx + 1} / {TOPICS.length}</div></div>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-3"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 via-indigo-400 to-cyan-300 transition-[width] duration-700" style={{ width: progress + '%' }} /></div>
          <div className="relative min-h-[430px]">{m === 'q1' && <div className="absolute inset-0 flex items-center justify-center"><DecisionTree selected={decision} setSelected={setDecision} /></div>}{m !== 'q1' && <SceneContent mode={m} />}</div>
        </div>
      </div>

      <div className="absolute bottom-3 left-3 z-40 flex items-center gap-2 rounded-xl border border-emerald-300/25 bg-black/55 px-3 py-1.5 text-[8px] text-emerald-100 backdrop-blur-xl"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />Interactive 3D visual active</div>
      <button type="button" aria-expanded={explorerOpen} onClick={() => setExplorerOpen(true)} className="absolute bottom-3 right-3 z-40 rounded-xl border border-cyan-300/35 bg-white/90 px-3.5 py-2 text-[9px] font-black text-indigo-900 shadow-[0_10px_25px_rgba(0,0,0,.25)] cursor-pointer hover:bg-white transition-all"><Maximize2 className="mr-1 inline h-3 w-3" /> Explore the visual <ArrowRight className="ml-1 inline h-3 w-3" /></button>

      {explorerOpen && <ExplorerOverlay mode={m} onClose={() => setExplorerOpen(false)} />}
    </div>
  );
}
