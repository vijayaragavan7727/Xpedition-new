/**
 * Deterministic Neural Network teaching engine for Xpedition M1-M9.
 * Pure math only: no React, Three.js, randomness, or network calls.
 */
export type Vector = number[];
export type Matrix = number[][];
export const INPUTS: Vector = [0.8, 0.4];
export const SHALLOW_WEIGHTS: Vector = [0.5, 0.7];
export const SHALLOW_BIAS = 0.1;
export const sigmoid = (x:number):number => 1/(1+Math.exp(-x));
export function dot(a:Vector,b:Vector){if(a.length!==b.length)throw new Error('dot: dimension mismatch');return a.reduce((s,v,i)=>s+v*b[i],0);}
export function matVec(m:Matrix,v:Vector):Vector{return m.map(r=>dot(r,v));}
export function add(a:Vector,b:Vector):Vector{if(a.length!==b.length)throw new Error('add: dimension mismatch');return a.map((v,i)=>v+b[i]);}
export function softmax(v:Vector):Vector{const mx=Math.max(...v),e=v.map(x=>Math.exp(x-mx)),t=e.reduce((a,b)=>a+b,0);return e.map(x=>x/t);}
export function forwardSingleNeuron(inputs:Vector=INPUTS,weights:Vector=SHALLOW_WEIGHTS,bias=SHALLOW_BIAS){const contributions=inputs.map((x,i)=>x*weights[i]);const weightedSum=contributions.reduce((a,b)=>a+b,0);const preActivation=weightedSum+bias;return{contributions,weightedSum,preActivation,output:sigmoid(preActivation)};}
export const M3_WEIGHTS:Matrix=[[0.5,-0.2],[0.3,0.8],[-0.4,0.6]];
export const M3_HIDDEN_BIAS:Vector=[0.1,-0.1,0.05];
export const M3_OUTPUT_WEIGHTS:Vector=[0.7,-0.5,0.9];
export const M3_OUTPUT_BIAS=0.2;
export function forwardShallowNetwork(inputs:Vector=INPUTS,hiddenWeights:Matrix=M3_WEIGHTS,hiddenBias:Vector=M3_HIDDEN_BIAS,outputWeights:Vector=M3_OUTPUT_WEIGHTS,outputBias=M3_OUTPUT_BIAS){
 const hiddenPreActivation=add(matVec(hiddenWeights,inputs),hiddenBias);const hidden=hiddenPreActivation.map(sigmoid);const outputPreActivation=dot(outputWeights,hidden)+outputBias;return{hidden,output:sigmoid(outputPreActivation),hiddenPreActivation,outputPreActivation};
}
export function backpropagate(inputs:Vector,target:number,hiddenWeights:Matrix=M3_WEIGHTS,hiddenBias:Vector=M3_HIDDEN_BIAS,outputWeights:Vector=M3_OUTPUT_WEIGHTS,outputBias=M3_OUTPUT_BIAS){
 const f=forwardShallowNetwork(inputs,hiddenWeights,hiddenBias,outputWeights,outputBias);const error=f.output-target;const loss=.5*error*error;const outputDelta=error*f.output*(1-f.output);const outputWeightGradients=f.hidden.map(h=>outputDelta*h);const outputBiasGradient=outputDelta;const hiddenDeltas=f.hidden.map((h,j)=>outputDelta*outputWeights[j]*h*(1-h));const hiddenWeightGradients=hiddenDeltas.map(d=>inputs.map(x=>d*x));return{prediction:f.output,loss,outputDelta,outputWeightGradients,outputBiasGradient,hiddenDeltas,hiddenWeightGradients,hiddenBiasGradients:hiddenDeltas};
}
export function updateWeights(hw:Matrix,hb:Vector,ow:Vector,ob:number,g:any,eta:number){return{hiddenWeights:hw.map((r,j)=>r.map((w,i)=>w-eta*g.hiddenWeightGradients[j][i])),hiddenBias:hb.map((b,i)=>b-eta*g.hiddenBiasGradients[i]),outputWeights:ow.map((w,i)=>w-eta*g.outputWeightGradients[i]),outputBias:ob-eta*g.outputBiasGradient};}
export function deepNetworkForward(hiddenLayers:number,inputs:Vector=INPUTS){const count=Math.max(1,Math.min(4,Math.round(hiddenLayers)));let current=inputs;const layers:Vector[]=[];for(let l=0;l<count;l++){const m=Array.from({length:3},(_,n)=>Array.from({length:current.length},(_,i)=>(((n+1)*(i+2)*(l+1))%7-3)/5));const b=Array.from({length:3},(_,i)=>((i+l)%3-1)/10);current=add(matVec(m,current),b).map(sigmoid);layers.push(current);}const ow=current.map((_,i)=>i%2===0?.7:-.5);const output=sigmoid(dot(ow,current)+.2);layers.push([output]);return{layers,output};}
export interface AttentionResult{query:Vector;keys:Vector[];values:Vector[];similarities:Vector;weights:Vector;output:Vector;}
export function attention(tokens:Vector[],queryIndex:number,wQ:Matrix,wK:Matrix,wV:Matrix):AttentionResult{const q=tokens.map(x=>matVec(wQ,x)),k=tokens.map(x=>matVec(wK,x)),v=tokens.map(x=>matVec(wV,x)),query=q[queryIndex],sim=k.map(x=>dot(query,x)/Math.sqrt(Math.max(1,query.length))),weights=softmax(sim),output=v[0].map((_,d)=>v.reduce((s,x,i)=>s+weights[i]*x[d],0));return{query,keys:k,values:v,similarities:sim,weights,output};}
export function positionalEncoding(position:number,dimension:number):Vector{return Array.from({length:Math.max(1,Math.floor(dimension))},(_,i)=>{const exponent=2*Math.floor(i/2)/dimension;const angle=position/Math.pow(10000,exponent);return i%2===0?Math.sin(angle):Math.cos(angle);});}
export function addPositionalEncoding(tokens:Vector[]){return tokens.map((t,p)=>add(t,positionalEncoding(p,t.length)));}
export function layerNorm(v:Vector,epsilon=1e-5){const mean=v.reduce((a,b)=>a+b,0)/v.length,variance=v.reduce((s,x)=>s+(x-mean)**2,0)/v.length,scale=1/Math.sqrt(variance+epsilon);return v.map(x=>(x-mean)*scale);}
export function feedForward(v:Vector){const w1:Matrix=[[.8,-.2,.4,.1],[.1,.7,-.3,.5],[.3,.2,.6,-.4],[-.2,.4,.1,.9]],b1=[.1,-.1,.05,.02],w2:Matrix=[[.6,.1,.2,-.2],[-.1,.5,.3,.2],[.2,-.2,.7,.1],[.1,.3,-.1,.6]],b2=[.02,.01,-.02,.03];return add(matVec(w2,add(matVec(w1,v),b1).map(x=>Math.max(0,x))),b2);}
export function transformerBlock(v:Vector,a:Vector){const attentionResidual=add(v,a),normalizedAttention=layerNorm(attentionResidual),ffnOutput=feedForward(normalizedAttention),finalResidual=add(normalizedAttention,ffnOutput),output=layerNorm(finalResidual);return{attentionResidual,normalizedAttention,ffnOutput,finalResidual,output};}
export const TOY_VOCAB=['the','cat','sat','on','mat','runs'];
export function tokenPrediction(representation:Vector){const logits=TOY_VOCAB.map((_,i)=>representation.reduce((s,x,d)=>s+x*(((i+1)*(d+2))%5-2)/4,0)+(i===4?.35:0)),probabilities=softmax(logits),topIndex=probabilities.indexOf(Math.max(...probabilities));return{logits,probabilities,predictedToken:TOY_VOCAB[topIndex]};}


export interface MultiHeadResult {
  heads: AttentionResult[];
  concatenated: Vector;
  projected: Vector;
}
export function multiHeadAttention(tokens: Vector[], queryIndex = 2): MultiHeadResult {
  const headA = attention(tokens, queryIndex, [[1,0,0],[0,1,0]], [[1,0,0],[1,1,0]], [[1,0,0],[0,1,0]]);
  const headB = attention(tokens, queryIndex, [[0,1,0],[0,0,1]], [[0,1,0],[1,0,1]], [[0,0,1],[1,0,0]]);
  const concatenated = headA.output.concat(headB.output);
  const projection = [
    [0.7,-0.2,0.3,0.1],
    [0.1,0.6,-0.1,0.4],
    [0.2,0.1,0.5,-0.3],
    [-0.2,0.3,0.2,0.7],
  ];
  return { heads:[headA,headB], concatenated, projected:matVec(projection,concatenated) };
}
