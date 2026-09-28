'use client';

import React, { useMemo, useState } from 'react';
import {
  attention, multiHeadAttention, backpropagate, deepNetworkForward, forwardShallowNetwork,
  forwardSingleNeuron, positionalEncoding, transformerBlock, tokenPrediction, updateWeights,
  INPUTS, M3_HIDDEN_BIAS, M3_OUTPUT_BIAS, M3_OUTPUT_WEIGHTS, M3_WEIGHTS,
} from '@/lib/classroom/neuralNetwork/neuralNetworkModel';

type Mode='m1'|'m2'|'m3'|'m4'|'m5'|'m6'|'m7'|'m8'|'m9';
const TOKENS=['the','cat','sat'];
const V=[[1,0,0],[0,1,1],[0.5,1,0]];
const WQ=[[1,0,0],[0,1,0]],WK=[[1,0,0],[1,1,0]],WV=[[1,0,0],[0,1,0]];

function NetworkSvg({mode,values}:{mode:Mode;values:number[]}) {
  const counts=mode==='m1'||mode==='m2'?[2,1]:mode==='m3'||mode==='m4'?[2,3,1]:mode==='m5'?[2,3,3,3,1]:[3,3,3,1];
  const width=760,height=260,gap=170,startX=100;
  const xs=counts.map((_,i)=>startX+i*gap);
  const points=(count:number,x:number)=>Array.from({length:count},(_,i)=>({x,y:height/2+(i-(count-1)/2)*62}));
  const nodes=counts.map((c,i)=>points(c,xs[i]));
  return <svg viewBox={'0 0 '+width+' '+height} className="w-full h-full" role="img" aria-label="Deterministic neural network teaching diagram">
    <defs><radialGradient id="nnGlow"><stop offset="0%" stopColor="#67e8f9"/><stop offset="55%" stopColor="#0891b2"/><stop offset="100%" stopColor="#082f49"/></radialGradient><linearGradient id="nnEdge"><stop stopColor="#22d3ee" stopOpacity=".75"/><stop offset="100%" stopColor="#6366f1" stopOpacity=".15"/></linearGradient></defs>
    <rect x="0" y="0" width={width} height={height} rx="22" fill="#030817"/>
    {nodes.slice(0,-1).map((layer,i)=>layer.flatMap((a,ai)=>nodes[i+1].map((b,bi)=><line key={i+'-'+ai+'-'+bi} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="url(#nnEdge)" strokeWidth={1.2+Math.min(3,Math.abs(values[(i*11+ai+bi)%Math.max(1,values.length)]||.2))} opacity=".55"/>)))}
    {nodes.map((layer,i)=>layer.map((p,n)=><g key={i+'-'+n}><circle cx={p.x+10} cy={p.y+10} r="18" fill="#020617" opacity=".55"/><circle cx={p.x} cy={p.y} r="18" fill="url(#nnGlow)" stroke="#67e8f9" strokeOpacity=".65"/><text x={p.x} y={p.y+4} textAnchor="middle" fill="white" fontSize="9" fontWeight="700">{i===0?'x':i===nodes.length-1?'ŷ':'h'+(n+1)}</text></g>))}
    {nodes.map((layer,i)=><text key={'label'+i} x={layer[0].x} y="28" textAnchor="middle" fill="#94a3b8" fontSize="11">{i===0?'Input':i===nodes.length-1?'Output':'Hidden '+i}</text>)}
  </svg>;
}

export const NeuralNetworkTeachingRenderer:React.FC<{mode?:string;className?:string}> = ({mode='m1',className=''})=>{
 const m=(['m1','m2','m3','m4','m5','m6','m7','m8','m9'].includes(mode)?mode:'m1') as Mode;
 const [x1,setX1]=useState(.8),[x2,setX2]=useState(.4),[w1,setW1]=useState(.5),[w2,setW2]=useState(.7),[bias,setBias]=useState(.1);
 const [layers,setLayers]=useState(2),[query,setQuery]=useState(2),[predicted,setPredicted]=useState('');
 const single=useMemo(()=>forwardSingleNeuron([x1,x2],[w1,w2],bias),[x1,x2,w1,w2,bias]);
 const shallow=useMemo(()=>forwardShallowNetwork(),[]);
 const gradients=useMemo(()=>backpropagate(INPUTS,1),[]);
 const updated=useMemo(()=>updateWeights(M3_WEIGHTS,M3_HIDDEN_BIAS,M3_OUTPUT_WEIGHTS,M3_OUTPUT_BIAS,gradients,.5),[gradients]);
 const deep=useMemo(()=>deepNetworkForward(layers),[layers]);
 const attn=useMemo(()=>attention(V,query,WQ,WK,WV),[query]);
 const multi=useMemo(()=>multiHeadAttention(V,query),[query]);
 const pos=useMemo(()=>[0,1,2].map(i=>positionalEncoding(i,4)),[]);
 const block=useMemo(()=>transformerBlock([.2,.4,.1,.3],[.1,.2,.05,.1]),[]);
 const prediction=useMemo(()=>tokenPrediction(block.output),[block.output]);
 const values=m==='m1'||m==='m2'?[x1,x2,w1,w2,bias,single.output]:m==='m3'||m==='m4'?[...shallow.hidden,shallow.output,...M3_OUTPUT_WEIGHTS]:m==='m5'?deep.layers.flat():m==='m6'?attn.weights.concat(attn.output):m==='m7'?multi.heads[0].weights.concat(multi.heads[1].weights,multi.projected):m==='m8'?block.output:prediction.probabilities;
 let title='',lines:string[]=[];
 if(m==='m1'){title='M1 · One neuron';lines=['0.8×0.5 = 0.40','0.4×0.7 = 0.28','0.40 + 0.28 + 0.10 = 0.78','sigmoid(0.78) ≈ '+single.output.toFixed(3)];}
 if(m==='m2'){title='M2 · Live parameters';lines=['x₁ '+x1.toFixed(2)+' · x₂ '+x2.toFixed(2),'w₁ '+w1.toFixed(2)+' · w₂ '+w2.toFixed(2)+' · b '+bias.toFixed(2),'output = '+single.output.toFixed(3)];}
 if(m==='m3'){title='M3 · Forward pass';lines=['Input [0.8, 0.4]','Hidden ['+shallow.hidden.map(v=>v.toFixed(3)).join(', ')+']','Output '+shallow.output.toFixed(3)];}
 if(m==='m4'){title='M4 · Backpropagation';lines=['prediction '+gradients.prediction.toFixed(3)+' · target 1','loss '+gradients.loss.toFixed(4),'δoutput '+gradients.outputDelta.toFixed(4),'η = 0.5','updated output bias '+updated.outputBias.toFixed(3)];}
 if(m==='m5'){title='M5 · Deep learning';lines=[layers+' hidden layers','output '+deep.output.toFixed(3),'Each layer transforms the previous representation.'];}
 if(m==='m6'){title='M6 · Attention · '+TOKENS[query];lines=attn.weights.map((v,i)=>TOKENS[i]+' → '+v.toFixed(3)).concat(['output ['+attn.output.map(v=>v.toFixed(3)).join(', ')+']']);}
 if(m==='m7'){title='M7 · Two heads + position';lines=['Head A ['+multi.heads[0].weights.map(v=>v.toFixed(3)).join(', ')+']','Head B ['+multi.heads[1].weights.map(v=>v.toFixed(3)).join(', ')+']','Concatenate → ['+multi.concatenated.map(v=>v.toFixed(3)).join(', ')+']','Project → ['+multi.projected.map(v=>v.toFixed(3)).join(', ')+']','PE(0) ['+pos[0].map(v=>v.toFixed(3)).join(', ')+']','PE(1) ['+pos[1].map(v=>v.toFixed(3)).join(', ')+']'];}
 if(m==='m8'){title='M8 · Transformer block';lines=['residual ['+block.attentionResidual.map(v=>v.toFixed(3)).join(', ')+']','LayerNorm ['+block.normalizedAttention.map(v=>v.toFixed(3)).join(', ')+']','FFN ['+block.ffnOutput.map(v=>v.toFixed(3)).join(', ')+']','final norm ['+block.output.map(v=>v.toFixed(3)).join(', ')+']'];}
 if(m==='m9'){title='M9 · Next-token prediction';lines=prediction.probabilities.map((v,i)=>['the','cat','sat','on','mat','runs'][i]+': '+(v*100).toFixed(1)+'%').concat(['predicted token: '+prediction.predictedToken]);}
 return <div className={'w-full h-full min-h-[260px] rounded-xl border border-cyan-400/20 bg-[#030817] overflow-hidden flex flex-col '+className}>
   <div className="relative flex-1 min-h-[220px] p-2"><NetworkSvg mode={m} values={values}/></div>
   <div className="shrink-0 border-t border-white/10 p-3 grid lg:grid-cols-[1fr_auto] gap-3">
     <div className="rounded-xl bg-black/25 border border-white/10 p-3"><div className="text-[10px] uppercase tracking-[.18em] text-cyan-300 font-mono">{title}</div><div className="mt-2 space-y-1 text-xs text-slate-200 font-mono">{lines.map((x,i)=><div key={i}>{x}</div>)}</div></div>
     {(m==='m2'||m==='m5'||m==='m6'||m==='m9')&&<div className="rounded-xl bg-black/25 border border-white/10 p-3 space-y-2">
       {m==='m2'&&<>{[['x₁',x1,setX1,0,1],['x₂',x2,setX2,0,1],['w₁',w1,setW1,-1,1],['w₂',w2,setW2,-1,1],['bias',bias,setBias,-1,1]].map((a:any)=><label key={a[0]} className="block text-[10px] text-slate-300">{a[0]}<input className="w-full" type="range" min={a[3]} max={a[4]} step=".01" value={a[1]} onChange={e=>a[2](Number(e.target.value))}/></label>)}</>}
       {m==='m5'&&<div className="flex items-center gap-2"><button type="button" className="px-3 py-1 rounded bg-white/10" onClick={()=>setLayers(Math.max(1,layers-1))}>−</button><span>{layers} hidden layers</span><button type="button" className="px-3 py-1 rounded bg-white/10" onClick={()=>setLayers(Math.min(4,layers+1))}>+</button></div>}
       {m==='m6'&&<div className="flex gap-2">{TOKENS.map((t,i)=><button type="button" key={t} className={'px-3 py-1 rounded '+(query===i?'bg-cyan-500/30 text-cyan-100':'bg-white/10')} onClick={()=>setQuery(i)}>{t}</button>)}</div>}
       {m==='m9'&&<><button type="button" className="px-3 py-1.5 rounded bg-cyan-500/20 text-cyan-100 border border-cyan-400/30" onClick={()=>setPredicted(prediction.predictedToken)}>Run prediction</button>{predicted&&<div className="text-xs text-emerald-300">Next token: <strong>{predicted}</strong></div>}</>}
     </div>}
   </div>
 </div>;
};
