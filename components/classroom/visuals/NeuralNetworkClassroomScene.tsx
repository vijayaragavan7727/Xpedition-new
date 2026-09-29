'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ArrowRight, BrainCircuit, CheckCircle2, GitBranch, Play, Target, Zap } from 'lucide-react';

type Mode = 'm1'|'m2'|'m3'|'m4'|'m5'|'m6'|'m7'|'m8'|'m9'|'m10'|'q1'|'q2';

const TOPICS: Array<[Mode,string,string]> = [
  ['m1','M1 · One Neuron','Input → weighted sum → activation'],
  ['m2','M2 · Activation Functions','Shape the signal'],
  ['m3','M3 · Forward Propagation','Move information through layers'],
  ['m4','M4 · Loss Functions','Measure prediction error'],
  ['m5','M5 · Backpropagation','Send the error backward'],
  ['m6','M6 · Gradient Descent','Tune parameters'],
  ['m7','M7 · Deep Networks','Stack learned representations'],
  ['m8','M8 · Self-Attention','Let tokens use context'],
  ['m9','M9 · Heads + Position','Relationships + token order'],
  ['m10','M10 · Transformer Block','Attention + residual + FFN'],
  ['q1','Q1 · Decision Check','Connect what you learned'],
  ['q2','Q2 · Mastery Path','Choose the next neural-network idea'],
];

const clampMode = (raw: string): Mode => {
  const m = raw.toLowerCase() as Mode;
  return TOPICS.some(x => x[0] === m) ? m : 'm1';
};

function Node({label,tone='cyan'}:{label:string;tone?:'cyan'|'violet'|'green'|'amber'}) {
  const bg = tone==='cyan' ? 'from-cyan-200 via-cyan-400 to-blue-600 shadow-cyan-400/60' :
    tone==='violet' ? 'from-fuchsia-200 via-violet-400 to-indigo-600 shadow-violet-400/60' :
    tone==='green' ? 'from-emerald-200 via-emerald-400 to-teal-600 shadow-emerald-400/60' :
    'from-amber-100 via-amber-300 to-orange-500 shadow-amber-300/60';
  return <div className={'h-9 w-9 sm:h-11 sm:w-11 rounded-full bg-gradient-to-br '+bg+' border-2 border-white/70 shadow-[0_0_20px] flex items-center justify-center text-[9px] font-black text-slate-950 animate-pulse'}>{label}</div>;
}

function Holo({children}:{children:React.ReactNode}) {
  return <div className="relative overflow-hidden rounded-3xl border border-cyan-300/40 bg-slate-950/80 p-4 sm:p-6 backdrop-blur-xl shadow-[0_0_45px_rgba(14,165,233,.18),inset_0_0_35px_rgba(99,102,241,.12)]">
    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,.09),transparent_25%,transparent_75%,rgba(34,211,238,.07))]" />{children}
  </div>;
}

function Network({deep=false,reverse=false}:{deep?:boolean;reverse?:boolean}) {
  const layers = deep ? [2,3,4,3,1] : [2,3,1];
  return <div className={'flex items-center justify-center gap-2 sm:gap-4 '+(reverse?'flex-row-reverse':'')}>
    {layers.map((count,li)=><React.Fragment key={li}>
      <div className="flex flex-col gap-2 sm:gap-3">{Array.from({length:count},(_,i)=><Node key={i} label={li===0?'x':li===layers.length-1?'ŷ':'h'+(i+1)} tone={li===layers.length-1?'green':li%2?'violet':'cyan'}/>)}</div>
      {li<layers.length-1 && <div className="w-7 sm:w-12 space-y-3">{Array.from({length:Math.max(2,count)},(_,i)=><div key={i} className="h-px bg-gradient-to-r from-cyan-300 via-violet-300 to-emerald-300 shadow-[0_0_10px_rgba(34,211,238,.8)]"/>)}</div>}
    </React.Fragment>)}
  </div>;
}

function Header({title,kicker}:{title:string;kicker:string}) {
  return <div className="mb-5"><div className="text-[9px] font-bold uppercase tracking-[.2em] text-cyan-300">{kicker}</div><h4 className="mt-1 text-xl font-black sm:text-2xl">{title}</h4></div>;
}

function Stats({items}:{items:string[]}) {
  return <div className="mt-5 grid grid-cols-3 gap-2">{items.map(x=><div key={x} className="rounded-xl border border-white/10 bg-white/5 p-2 text-center text-[9px] text-slate-300">{x}</div>)}</div>;
}

function DecisionTree({final}:{final:boolean}) {
  const [choice,setChoice]=useState<string|null>(null);
  const options = final ? ['Neuron mechanics + activations','Attention + transformer internals','Loss + gradients + optimization'] : ['I can trace a forward pass','I can explain backpropagation','I can connect attention to transformers'];
  return <Holo>
    <div className="mb-5 flex items-center justify-between"><div><div className="text-[9px] uppercase tracking-[.2em] text-fuchsia-300">{final?'Q2 · MASTERY PATH':'Q1 · DECISION CHECK'}</div><h4 className="text-xl font-black sm:text-2xl">Decision Tree · {final?'Choose Your Next Path':'Connect the Ideas'}</h4></div><GitBranch className="h-7 w-7 text-cyan-300"/></div>
    <div className="mx-auto max-w-4xl rounded-2xl border border-cyan-300/25 bg-black/25 p-4">
      <div className="mx-auto w-fit rounded-xl border border-violet-300/40 bg-violet-500/15 px-4 py-2 text-center text-xs font-bold">{final?'What should come next?':'What do you understand best?'}</div>
      <div className="mx-auto h-7 w-px bg-cyan-300/60"/>
      <div className="grid grid-cols-3 gap-2 sm:gap-4">{options.map((option,i)=><button key={option} type="button" onClick={()=>setChoice(option)} className={'relative rounded-2xl border p-3 text-left transition-all '+(choice===option?'border-emerald-300 bg-emerald-400/10 shadow-[0_0_25px_rgba(52,211,153,.25)]':'border-white/10 bg-white/5 hover:border-cyan-300/40')}>
        <div className="text-[9px] font-bold uppercase tracking-widest text-cyan-200">Path {i+1}</div><div className="mt-1 text-xs font-bold text-white">{option}</div><div className="mt-3 text-[9px] text-slate-400">{choice===option?'Selected · route signal ready':'Tap to select'}</div>{choice===option&&<CheckCircle2 className="absolute right-2 top-2 h-4 w-4 text-emerald-300"/>}
      </button>)}</div>
      <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-400"><Target className="h-3 w-3 text-amber-300"/> Your answer becomes the next learning route.</div>
    </div>
  </Holo>;
}

function SceneContent({m}:{m:Mode}) {
  const [running,setRunning]=useState(false);
  const [depth,setDepth]=useState(3);
  const [token,setToken]=useState('cat');
  const [position,setPosition]=useState(1);

  if(m==='q1') return <DecisionTree final={false}/>;
  if(m==='q2') return <DecisionTree final/>;

  if(m==='m1') return <Holo><Header title="Watch One Neuron Calculate" kicker="M1 · ONE NEURON"/><div className="flex items-center justify-center gap-2 sm:gap-5"><div className="space-y-3"><Node label="x₁"/><Node label="x₂"/></div><div className="space-y-3 w-8 sm:w-14"><Wire/><Wire/></div><div className="rounded-2xl border border-violet-300/40 bg-violet-500/10 p-4 text-center"><div className="text-[9px] uppercase tracking-widest text-violet-200">weighted sum</div><div className="mt-2 text-2xl font-black">0.78</div><div className="mt-1 text-[9px] text-slate-400">0.8×0.5 + 0.4×0.7 + 0.1</div></div><ArrowRight className="h-5 w-5 text-cyan-300"/><Node label="ŷ" tone="green"/></div><Stats items={['Inputs 0.8 · 0.4','Weights 0.5 · 0.7','Output 0.686']}/></Holo>;

  if(m==='m2') return <Holo><Header title="From Raw Signal to Useful Signal" kicker="M2 · ACTIVATION FUNCTIONS"/><div className="grid grid-cols-3 gap-2 sm:gap-4">{[['Sigmoid','0 → 1'],['ReLU','max(0,z)'],['Tanh','−1 → +1']].map(([name,formula])=><div key={name} className="rounded-2xl border border-white/10 bg-white/5 p-3"><div className="text-xs font-bold">{name}</div><div className="relative mt-5 h-24 overflow-hidden rounded-xl bg-black/30"><div className="absolute left-3 right-3 top-1/2 h-1 rounded-full bg-gradient-to-r from-cyan-300 via-violet-300 to-emerald-300 shadow-[0_0_15px]"/><div className="absolute left-1/2 top-3 bottom-3 w-px bg-white/10"/></div><div className="mt-2 text-[9px] text-slate-400">{formula}</div></div>)}</div></Holo>;

  if(m==='m3') return <Holo><Header title="Follow the Signal Through a Network" kicker="M3 · FORWARD PROPAGATION"/><Network/><button type="button" onClick={()=>setRunning(v=>!v)} className="mx-auto mt-5 block rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-xs font-bold text-cyan-100">{running?'Forward pass running':'Run forward pass'} <Play className="ml-1 inline h-3 w-3"/></button></Holo>;

  if(m==='m4') return <Holo><Header title="Prediction vs Target" kicker="M4 · LOSS FUNCTION"/><div className="grid grid-cols-2 gap-3"><Bar label="Prediction ŷ" value="68%" good={false}/><Bar label="Target y" value="100%" good/></div><div className="mt-5 rounded-2xl border border-amber-300/25 bg-amber-400/5 p-4 text-center"><div className="text-[9px] uppercase tracking-widest text-amber-200">loss</div><div className="text-3xl font-black">0.1024</div><div className="text-[9px] text-slate-400">(1 − 0.68)²</div></div></Holo>;

  if(m==='m5') return <Holo><Header title="The Error Travels Backward" kicker="M5 · BACKPROPAGATION"/><Network reverse/><Stats items={['Loss','Gradients','Updated weights']}/></Holo>;

  if(m==='m6') return <Holo><Header title="Step Down the Loss Landscape" kicker="M6 · GRADIENT DESCENT"/><div className="relative mx-auto h-48 max-w-2xl overflow-hidden rounded-2xl border border-emerald-300/20 bg-[radial-gradient(ellipse_at_center,#123b43,#020714_70%)]"><div className="absolute left-[10%] top-[30%] h-36 w-[80%] rounded-[50%] border border-cyan-300/20 [transform:perspective(500px)_rotateX(62deg)]"/><div className="absolute left-[48%] top-[54%] h-5 w-5 animate-pulse rounded-full bg-amber-300 shadow-[0_0_25px_rgba(251,191,36,.9)]"/><div className="absolute right-5 top-5 text-[9px] text-slate-500">high loss</div><div className="absolute left-1/2 bottom-5 text-[9px] text-emerald-300">lower loss</div></div><div className="mt-4 text-center font-mono text-sm text-emerald-100">θ ← θ − η · ∂L/∂θ</div><button type="button" onClick={()=>setRunning(v=>!v)} className="mx-auto mt-3 block rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-xs text-emerald-100">{running?'Optimizing…':'Run update'} <Zap className="ml-1 inline h-3 w-3"/></button></Holo>;

  if(m==='m7') return <Holo><Header title="Why Depth Matters" kicker="M7 · DEEP NETWORKS"/><div className="flex items-center justify-between gap-3"><div className="text-[10px] text-slate-400">{depth} hidden layers</div><div className="flex gap-1"><button type="button" onClick={()=>setDepth(Math.max(1,depth-1))} className="rounded-lg bg-white/10 px-2">−</button><button type="button" onClick={()=>setDepth(Math.min(5,depth+1))} className="rounded-lg bg-white/10 px-2">+</button></div></div><div className="mt-3"><Network deep/></div><div className="mt-4 text-center text-[9px] text-slate-400">simple patterns → compositions → richer representations → output</div></Holo>;

  if(m==='m8') return <Holo><Header title="Watch Attention Connect Tokens" kicker="M8 · SELF-ATTENTION"/><div className="grid grid-cols-3 gap-2">{['the','cat','sat'].map(t=><button type="button" key={t} onClick={()=>setToken(t)} className={'rounded-2xl border p-3 '+(token===t?'border-cyan-300 bg-cyan-400/15':'border-white/10 bg-white/5')}><div className="text-sm font-black">{t}</div><div className="mt-2 text-[9px] text-slate-400">{token===t?'query selected':'select query'}</div></button>)}</div><div className="mt-5 h-20 rounded-2xl border border-cyan-300/20 bg-black/20 p-4 text-center text-[10px] text-slate-300">Query <strong className="text-cyan-200">{token}</strong> compares with keys and mixes the matching values.</div></Holo>;

  if(m==='m9') return <Holo><Header title="Two Relationship Views + Token Order" kicker="M9 · MULTI-HEAD + POSITION"/><div className="grid grid-cols-2 gap-3"><div className="rounded-2xl border border-violet-300/25 bg-violet-500/5 p-4"><div className="text-xs font-bold text-violet-200">Head A</div><div className="mt-3 grid grid-cols-3 gap-2">{['80%','15%','5%'].map(x=><div key={x} className="rounded-lg bg-violet-400/10 p-2 text-center text-[9px]">{x}</div>)}</div></div><div className="rounded-2xl border border-cyan-300/25 bg-cyan-500/5 p-4"><div className="text-xs font-bold text-cyan-200">Head B</div><div className="mt-3 grid grid-cols-3 gap-2">{['20%','55%','25%'].map(x=><div key={x} className="rounded-lg bg-cyan-400/10 p-2 text-center text-[9px]">{x}</div>)}</div></div></div><div className="mt-4 flex items-center justify-between rounded-2xl border border-amber-300/20 bg-amber-400/5 p-3"><span className="text-[9px] text-amber-100">Positional encoding</span><div className="flex gap-1">{[0,1,2,3].map(i=><button type="button" key={i} onClick={()=>setPosition(i)} className={'h-7 w-7 rounded-lg text-[9px] '+(position===i?'bg-amber-300 text-slate-950':'bg-white/10')}>{i}</button>)}</div><span className="font-mono text-[9px] text-amber-200">PE({position})</span></div></Holo>;

  return <Holo><Header title="Inside One Transformer Block" kicker="M10 · TRANSFORMER BLOCK"/><div className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-center">{['Attention','Residual','Norm','FFN','Norm'].map((x,i)=><React.Fragment key={x}>{i>0&&<ArrowRight className="hidden sm:block h-4 w-4 text-cyan-300"/>}<div className="rounded-2xl border border-cyan-300/25 bg-cyan-400/5 p-3 text-center"><div className="text-[9px] font-bold">{x}</div><div className="mx-auto mt-3 h-7 w-7 rounded-full bg-gradient-to-br from-cyan-200 to-indigo-600 shadow-[0_0_18px_rgba(34,211,238,.6)]"/></div></React.Fragment>)}</div><div className="mt-5 rounded-xl border border-white/10 bg-black/25 p-3 text-center text-[9px] text-slate-400">Attention mixes context · residuals preserve the stream · normalization stabilizes values · FFN refines each position.</div></Holo>;
}

function Wire(){return <div className="h-px bg-gradient-to-r from-cyan-300 via-violet-300 to-emerald-300 shadow-[0_0_10px_rgba(34,211,238,.8)]"/>;}
function Bar({label,value,good}:{label:string;value:string;good?:boolean}){return <div className="rounded-2xl border border-white/10 bg-white/5 p-3"><div className="text-[9px] text-slate-400">{label}</div><div className="mt-3 h-4 overflow-hidden rounded-full bg-white/10"><div className={'h-full rounded-full '+(good?'w-full bg-gradient-to-r from-emerald-300 to-teal-500':'w-[68%] bg-gradient-to-r from-cyan-300 to-blue-500')}/></div><div className="mt-2 text-right font-mono text-xs text-cyan-100">{value}</div></div>}

export default function NeuralNetworkClassroomScene({mode='m1',className=''}:{mode?:string;className?:string}) {
  const m=clampMode(mode);
  const idx=TOPICS.findIndex(x=>x[0]===m);
  const topic=TOPICS[idx] || TOPICS[0];
  return <div className={'relative h-full w-full overflow-hidden rounded-[28px] border border-cyan-300/30 bg-[#020714] text-white shadow-[0_30px_80px_-35px_rgba(14,165,233,.75)] '+className}>
    <style>{'@keyframes xpScan{0%{transform:translateX(-120%)}55%,100%{transform:translateX(170%)}}@keyframes xpFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}.xp-scan{animation:xpScan 5.5s ease-in-out infinite}.xp-float{animation:xpFloat 4s ease-in-out infinite}'}</style>
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_34%,rgba(29,78,216,.42),transparent_38%),radial-gradient(circle_at_90%_12%,rgba(34,211,238,.2),transparent_28%),linear-gradient(180deg,#07142f,#020714_68%,#01030a)]"/>
    <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(56,189,248,.13)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,.13)_1px,transparent_1px)] [background-size:48px_48px] [transform:perspective(700px)_rotateX(62deg)_translateY(28%)]"/>
    <div className="absolute left-1/2 bottom-6 h-16 w-[82%] -translate-x-1/2 rounded-[50%] border border-cyan-300/30 bg-cyan-400/5 shadow-[0_0_70px_rgba(34,211,238,.12)]"/>
    <div className="absolute inset-x-0 top-0 h-1/3 overflow-hidden"><div className="xp-scan absolute -left-1/3 top-0 h-full w-1/3 bg-gradient-to-r from-transparent via-cyan-300/10 to-transparent skew-x-[-18deg]"/></div>
    <div className="absolute left-3 top-3 z-20 flex items-center gap-2 rounded-xl border border-cyan-300/25 bg-black/45 px-2.5 py-1.5 backdrop-blur"><BrainCircuit className="h-4 w-4 text-cyan-300"/><span className="text-[9px] font-bold uppercase tracking-[.18em] text-cyan-100">Neural Networks</span><span className="rounded bg-white/10 px-1.5 py-0.5 text-[8px]">INTERACTIVE 3D</span></div>
    <div className="absolute left-3 top-[18%] z-20 hidden w-44 lg:block xp-float"><div className="rounded-2xl border border-cyan-300/25 bg-black/55 p-3 backdrop-blur"><div className="flex items-center gap-2"><Image src="/images/robot.png" alt="Buddy" width={40} height={40} className="object-contain"/><div><div className="text-[10px] font-black text-cyan-200">Buddy</div><div className="text-[8px] text-emerald-300">TEACHING LIVE</div></div></div><p className="mt-2 text-[9px] leading-relaxed text-slate-200">Follow the glowing path. Predict first, then test the idea.</p></div></div>
    <div className="absolute right-3 top-[16%] z-20 hidden w-40 xl:block"><div className="rounded-2xl border border-violet-300/20 bg-black/45 p-3 backdrop-blur"><div className="mb-2 text-[8px] font-bold uppercase tracking-[.18em] text-violet-200">Focus</div>{TOPICS.slice(Math.max(0,idx-1),Math.min(TOPICS.length,idx+2)).map(x=><div key={x[0]} className={'mb-1 rounded-lg px-2 py-1.5 text-[8px] '+(x[0]===m?'border border-cyan-300/20 bg-cyan-400/15 text-cyan-100':'bg-white/5 text-slate-400')}>{x[1]}</div>)}</div></div>
    <div className="relative z-10 flex min-h-[430px] items-center justify-center p-3 pt-10 sm:min-h-[500px] sm:p-6 sm:pt-8"><div className="w-full max-w-[900px]"><div className="mb-3 flex items-center justify-between gap-3"><div><div className="text-[9px] uppercase tracking-[.22em] text-cyan-300">{topic[1]}</div><h3 className="mt-1 text-base font-black sm:text-xl">{topic[2]}</h3></div><div className="rounded-xl border border-white/15 bg-white/5 px-2.5 py-1.5 text-right"><div className="text-[8px] text-slate-500">PATH</div><div className="font-mono text-[10px] text-cyan-100">{idx+1} / {TOPICS.length}</div></div></div><SceneContent m={m}/></div></div>
    <div className="absolute bottom-2 left-3 z-30 flex items-center gap-2 rounded-xl border border-emerald-300/25 bg-black/50 px-3 py-1.5 text-[9px] text-emerald-100 backdrop-blur"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400"/>Interactive visual active</div>
    <div className="absolute bottom-2 right-3 z-30 rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-[9px] text-white/75 backdrop-blur">{m.startsWith('q')?'Decision tree':'Explore the visual'} <ArrowRight className="ml-1 inline h-3 w-3"/></div>
  </div>;
}
