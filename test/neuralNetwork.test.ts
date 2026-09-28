import { describe, expect, it } from 'vitest';
import {
  addPositionalEncoding, attention, backpropagate, deepNetworkForward,
  forwardSingleNeuron, forwardShallowNetwork, layerNorm, multiHeadAttention,
  positionalEncoding, softmax, tokenPrediction, transformerBlock,
} from '@/lib/classroom/neuralNetwork/neuralNetworkModel';

describe('Neural Network M1-M9 deterministic engine',()=>{
  it('M1 computes the canonical neuron example',()=>{
    const r=forwardSingleNeuron();
    expect(r.weightedSum).toBeCloseTo(.68,10);
    expect(r.preActivation).toBeCloseTo(.78,10);
    expect(r.output).toBeCloseTo(.68568,4);
  });
  it('M3 produces a real 2-3-1 forward pass',()=>{
    const r=forwardShallowNetwork();
    expect(r.hidden).toHaveLength(3);
    expect(r.output).toBeGreaterThan(0);
    expect(r.output).toBeLessThan(1);
  });
  it('M4 gradients are finite and non-zero',()=>{
    const g=backpropagate([.8,.4],1);
    expect(Number.isFinite(g.loss)).toBe(true);
    expect(g.hiddenWeightGradients.flat().some(Math.abs)).toBe(true);
  });
  it('M5 depth changes the executed network',()=>{
    const shallow=deepNetworkForward(1),deep=deepNetworkForward(4);
    expect(shallow.layers).toHaveLength(2);
    expect(deep.layers).toHaveLength(5);
    expect(deep.output).not.toBe(shallow.output);
  });
  it('M6 attention weights sum to one',()=>{
    const r=attention([[1,0,0],[0,1,1],[.5,1,0]],2,[[1,0,0],[0,1,0]],[[1,0,0],[1,1,0]],[[1,0,0],[0,1,0]]);
    expect(r.weights.reduce((a,b)=>a+b,0)).toBeCloseTo(1,10);
    expect(r.output).toHaveLength(2);
  });
  it('M7 has two independent heads and positional encoding',()=>{
    const r=multiHeadAttention([[1,0,0],[0,1,1],[.5,1,0]],2);
    expect(r.heads).toHaveLength(2);
    expect(r.concatenated).toHaveLength(4);
    expect(r.projected).toHaveLength(4);
    expect(positionalEncoding(0,4)).toEqual([0,1,0,1]);
  });
  it('M8 preserves transformer stages',()=>{
    const r=transformerBlock([.2,.4,.1,.3],[.1,.2,.05,.1]);
    expect(r.attentionResidual).toHaveLength(4);
    expect(r.normalizedAttention).toHaveLength(4);
    expect(r.ffnOutput).toHaveLength(4);
    expect(r.output).toHaveLength(4);
    expect(r.output.every(Number.isFinite)).toBe(true);
  });
  it('M9 produces a normalized token distribution',()=>{
    const r=tokenPrediction([.2,.4,.1,.3]);
    expect(r.probabilities.reduce((a,b)=>a+b,0)).toBeCloseTo(1,10);
    expect(r.predictedToken).toBeTruthy();
  });
  it('layer norm has approximately zero mean',()=>{
    const r=layerNorm([1,2,3,4]);
    expect(r.reduce((a,b)=>a+b,0)).toBeCloseTo(0,8);
  });
  it('positional encoding changes with position',()=>{
    expect(addPositionalEncoding([[.2,.3],[.2,.3]])[0]).not.toEqual(addPositionalEncoding([[.2,.3],[.2,.3]])[1]);
  });
  it('softmax is deterministic and normalized',()=>{
    expect(softmax([1,2,3]).reduce((a,b)=>a+b,0)).toBeCloseTo(1,10);
  });
});
