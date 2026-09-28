'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  attention, multiHeadAttention, backpropagate, deepNetworkForward, forwardShallowNetwork, forwardSingleNeuron,
  positionalEncoding, transformerBlock, tokenPrediction, updateWeights, INPUTS,
  M3_HIDDEN_BIAS, M3_OUTPUT_BIAS, M3_OUTPUT_WEIGHTS, M3_WEIGHTS,
} from '@/lib/classroom/neuralNetwork/neuralNetworkModel';

type Mode = 'm1'|'m2'|'m3'|'m4'|'m5'|'m6'|'m7'|'m8'|'m9';
const TOKENS = ['the','cat','sat'];
const V = [[1,0,0],[0,1,1],[0.5,1,0]];
const WQ = [[1,0,0],[0,1,0]], WK = [[1,0,0],[1,1,0]], WV = [[1,0,0],[0,1,0]];

function mountScene(el: HTMLDivElement, mode: Mode, values: number[]) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, .1, 100);
  camera.position.set(0, .5, 10);
  const renderer = new THREE.WebGLRenderer({antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.setSize(Math.max(1,el.clientWidth),Math.max(1,el.clientHeight));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  el.appendChild(renderer.domElement);
  scene.add(new THREE.AmbientLight(0x8bdcff,1.5));
  const light = new THREE.PointLight(0x60a5fa,28,25); light.position.set(0,3,6); scene.add(light);

  const counts = mode==='m1'||mode==='m2' ? [2,1] : mode==='m3'||mode==='m4' ? [2,3,1] : mode==='m5' ? [2,3,3,3,1] : [3,3,3,1];
  const xs = counts.map((_,i)=>(i-(counts.length-1)/2)*2.25);
  const root = new THREE.Group(); scene.add(root);

  counts.forEach((count,l)=>{
    for(let n=0;n<count;n++){
      const y=(n-(count-1)/2)*1.25;
      const strength=Math.abs(values[(l*5+n)%Math.max(1,values.length)]||.3);
      const mat=new THREE.MeshStandardMaterial({color:0x38bdf8,emissive:0x075985,emissiveIntensity:.45+Math.min(1.2,strength),metalness:.2,roughness:.3});
      const mesh=new THREE.Mesh(new THREE.SphereGeometry(mode==='m1'||mode==='m2'?.3:.25,20,20),mat);
      mesh.position.set(xs[l],y,0); root.add(mesh);
    }
  });
  for(let l=0;l<counts.length-1;l++){
    for(let a=0;a<counts[l];a++) for(let b=0;b<counts[l+1];b++){
      const p1=new THREE.Vector3(xs[l],(a-(counts[l]-1)/2)*1.25,0);
      const p2=new THREE.Vector3(xs[l+1],(b-(counts[l+1]-1)/2)*1.25,0);
      const geo=new THREE.BufferGeometry().setFromPoints([p1,p2]);
      const op=.14+Math.min(.55,Math.abs(values[(l*11+a*3+b)%Math.max(1,values.length)]||.2));
      root.add(new THREE.Line(geo,new THREE.LineBasicMaterial({color:0x22d3ee,transparent:true,opacity:op})));
    }
  }
  const pulse=new THREE.Mesh(new THREE.TorusGeometry(3,.025,8,80),new THREE.MeshBasicMaterial({color:0x22d3ee,transparent:true,opacity:.18}));
  pulse.rotation.x=Math.PI/2; root.add(pulse);

  let frame=0;
  const tick=()=>{root.rotation.y+=.002;renderer.render(scene,camera);frame=requestAnimationFrame(tick);};
  tick();
  const resize=()=>{const w=Math.max(1,el.clientWidth),h=Math.max(1,el.clientHeight);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);};
  const ro=new ResizeObserver(resize);ro.observe(el);
  return ()=>{cancelAnimationFrame(frame);ro.disconnect();root.traverse((o:any)=>{o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach((m:any)=>m.dispose());else o.material?.dispose();});renderer.dispose();if(renderer.domElement.parentNode===el)el.removeChild(renderer.domElement);};
}

export const NeuralNetworkTeachingRenderer: React.FC<{mode?:string;className?:string}> = ({mode='m1',className=''})=>{
  const m=(['m1','m2','m3','m4','m5','m6','m7','m8','m9'].includes(mode)?mode:'m1') as Mode;
  const [x1,setX1]=useState(.8),[x2,setX2]=useState(.4),[w1,setW1]=useState(.5),[w2,setW2]=useState(.7),[bias,setBias]=useState(.1);
  const [layers,setLayers]=useState(2),[query,setQuery]=useState(2),[ran,setRan]=useState(0);
  const [predicted,setPredicted]=useState('');
  const single=useMemo(()=>forwardSingleNeuron([x1,x2],[w1,w2],bias),[x1,x2,w1,w2,bias]);
  const shallow=useMemo(()=>forwardShallowNetwork(),[]);
  const gradients=useMemo(()=>backpropagate(INPUTS,1),[]);
  const updated=useMemo(()=>updateWeights(M3_WEIGHTS,M3_HIDDEN_BIAS,M3_OUTPUT_WEIGHTS,M3_OUTPUT_BIAS,gradients,.5),[gradients]);
  const deep=useMemo(()=>deepNetworkForward(layers),[layers]);
  const attn=useMemo(()=>attention(V,query,WQ,WK,WV),[query]);\n  const multi=useMemo(()=>multiHeadAttention(V,query),[query]);
  const pos=useMemo(()=>[0,1,2].map(i=>positionalEncoding(i,4)),[]);
  const reversedPos=useMemo(()=>[2,1,0].map(i=>positionalEncoding(i,4)),[]);
  const block=useMemo(()=>transformerBlock([.2,.4,.1,.3],[.1,.2,.05,.1]),[]);
  const prediction=useMemo(()=>tokenPrediction(block.output),[block.output]);
  const sceneRef=useRef<HTMLDivElement>(null);

  useEffect(()=>{if(!sceneRef.current)return;const vals=m==='m1'||m==='m2'?[x1,x2,w1,w2,bias,single.output]:m==='m3'||m==='m4'?[...shallow.hidden,shallow.output,...M3_OUTPUT_WEIGHTS]:m==='m5'?deep.layers.flat():m==='m6'?attn.weights.concat(attn.output):m==='m7'?multi.heads[0].weights.concat(multi.heads[1].weights,multi.projected):m==='m8'?block.output:prediction.probabilities;return mountScene(sceneRef.current,m,vals);},[m,x1,x2,w1,w2,bias,single.output,shallow,deep,attn,block,prediction.probabilities,ran,multi]);

  let title='',lines:string[]=[];
  if(m==='m1'){title='M1 · Neuron';lines=['0.8×0.5 = 0.40','0.4×0.7 = 0.28','0.40 + 0.28 + 0.10 = 0.78','sigmoid(0.78) ≈ '+single.output.toFixed(3)];}
  if(m==='m2'){title='M2 · Live neuron';lines=['x₁ '+x1.toFixed(2)+' · x₂ '+x2.toFixed(2),'w₁ '+w1.toFixed(2)+' · w₂ '+w2.toFixed(2)+' · b '+bias.toFixed(2),'output = '+single.output.toFixed(3)];}
  if(m==='m3'){title='M3 · Forward pass';lines=['Input [0.8, 0.4]','Hidden ['+shallow.hidden.map(v=>v.toFixed(3)).join(', ')+']','Output '+shallow.output.toFixed(3)];}
  if(m==='m4'){title='M4 · Backprop';lines=['prediction '+gradients.prediction.toFixed(3)+' · target 1','loss '+gradients.loss.toFixed(4),'δoutput '+gradients.outputDelta.toFixed(4),'η = 0.5','updated output bias '+updated.outputBias.toFixed(3)];}
  if(m==='m5'){title='M5 · Deep network';lines=[layers+' hidden layers','output '+deep.output.toFixed(3),'Every layer transforms the previous representation.'];}
  if(m==='m6'){title='M6 · Attention · '+TOKENS[query];lines=attn.weights.map((v,i)=>TOKENS[i]+' → '+v.toFixed(3)).concat(['output ['+attn.output.map(v=>v.toFixed(3)).join(', ')+']']);}
  if(m==='m7'){title='M7 · Heads + position';lines=['Head A weights ['+multi.heads[0].weights.map(v=>v.toFixed(3)).join(', ')+']','Head B weights ['+multi.heads[1].weights.map(v=>v.toFixed(3)).join(', ')+']','Concatenate → ['+multi.concatenated.map(v=>v.toFixed(3)).join(', ')+']','Project → ['+multi.projected.map(v=>v.toFixed(3)).join(', ')+']','Head A and Head B use separate deterministic projections','PE(0) ['+pos[0].map(v=>v.toFixed(3)).join(', ')+']','PE(1) ['+pos[1].map(v=>v.toFixed(3)).join(', ')+']','PE(2) ['+pos[2].map(v=>v.toFixed(3)).join(', ')+']','Reverse order uses the same position vectors on different tokens.'];}
  if(m==='m8'){title='M8 · Transformer block';lines=['residual ['+block.attentionResidual.map(v=>v.toFixed(3)).join(', ')+']','LayerNorm ['+block.normalizedAttention.map(v=>v.toFixed(3)).join(', ')+']','FFN ['+block.ffnOutput.map(v=>v.toFixed(3)).join(', ')+']','final norm ['+block.output.map(v=>v.toFixed(3)).join(', ')+']'];}
  if(m==='m9'){title='M9 · Token prediction';lines=prediction.probabilities.map((v,i)=>['the','cat','sat','on','mat','runs'][i]+': '+(v*100).toFixed(1)+'%').concat(['predicted token: '+prediction.predictedToken]);}

  return <div className={'w-full h-full min-h-[260px] rounded-xl border border-cyan-400/20 bg-[#030817] overflow-hidden flex flex-col '+className}>
    <div ref={sceneRef} className="relative flex-1 min-h-[220px]" aria-label="Deterministic 3D neural network visual"/>
    <div className="shrink-0 border-t border-white/10 p-3 grid lg:grid-cols-[1fr_auto] gap-3">
      <div className="rounded-xl bg-black/25 border border-white/10 p-3"><div className="text-[10px] uppercase tracking-[.18em] text-cyan-300 font-mono">{title}</div><div className="mt-2 space-y-1 text-xs text-slate-200 font-mono">{lines.map((x,i)=><div key={i}>{x}</div>)}</div></div>
      {(m==='m2'||m==='m5'||m==='m6'||m==='m9')&&<div className="rounded-xl bg-black/25 border border-white/10 p-3 space-y-2">
        {m==='m2'&&<>{[['x₁',x1,setX1,0,1],['x₂',x2,setX2,0,1],['w₁',w1,setW1,-1,1],['w₂',w2,setW2,-1,1],['bias',bias,setBias,-1,1]].map((a:any)=><label key={a[0]} className="block text-[10px] text-slate-300">{a[0]}<input className="w-full" type="range" min={a[3]} max={a[4]} step=".01" value={a[1]} onChange={e=>a[2](Number(e.target.value))}/></label>)}</>}
        {m==='m5'&&<div className="flex items-center gap-2"><button type="button" className="px-3 py-1 rounded bg-white/10" onClick={()=>setLayers(Math.max(1,layers-1))}>−</button><span>{layers} hidden layers</span><button type="button" className="px-3 py-1 rounded bg-white/10" onClick={()=>setLayers(Math.min(4,layers+1))}>+</button></div>}
        {m==='m6'&&<div className="flex gap-2">{TOKENS.map((t,i)=><button type="button" key={t} className={'px-3 py-1 rounded '+(query===i?'bg-cyan-500/30 text-cyan-100':'bg-white/10')} onClick={()=>setQuery(i)}>{t}</button>)}</div>}
        {m==='m9'&&<><button type="button" className="px-3 py-1.5 rounded bg-cyan-500/20 text-cyan-100 border border-cyan-400/30" onClick={()=>{setRan(v=>v+1);setPredicted(prediction.predictedToken)}}>Run prediction</button>{predicted&&<div className="text-xs text-emerald-300">Next token: <strong>{predicted}</strong></div>}</>}
      </div>}
    </div>
  </div>;
};
