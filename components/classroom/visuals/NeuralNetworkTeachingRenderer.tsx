'use client';

import React from 'react';
import NeuralNetworkClassroomScene from './NeuralNetworkClassroomScene';

export const NeuralNetworkTeachingRenderer: React.FC<{ mode?: string; className?: string }> = ({ mode = 'm1', className = '' }) => (
  <NeuralNetworkClassroomScene mode={mode} className={className} />
);

export default NeuralNetworkTeachingRenderer;
