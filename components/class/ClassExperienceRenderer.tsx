'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Enhanced2DFallback } from '@/components/experience/visualTeaching/Enhanced2DFallback';
import { H2O_MOLECULE_CONFIG } from '@/lib/experience/catalog/moleculeBuilderConfig';
import { simulateProjectile, SimulationResult } from '@/lib/experience/simulation/projectilePhysics';
import { Slider } from '@/components/ui';
import { ClassStageId } from '@/lib/class/types';

// Themed responsive experience loading skeleton with progressive feedback
const ExperienceLoadingSkeleton: React.FC<{
  title: string;
  subtitle?: string;
  onFallback?: () => void;
}> = ({ title, subtitle = 'Configuring 3D simulation canvas...', onFallback }) => (
  <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-6 bg-[#0A1024] text-center select-none space-y-4">
    <div className="relative">
      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
        <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin" />
      </div>
    </div>
    <div className="space-y-1">
      <span className="font-mono text-xs font-bold text-indigo-300 uppercase tracking-wider block">
        {title}
      </span>
      <p className="font-sans text-xs text-slate-400">{subtitle}</p>
    </div>
    {onFallback && (
      <button
        type="button"
        onClick={onFallback}
        className="text-[11px] font-mono text-slate-400 hover:text-white underline underline-offset-4 cursor-pointer pt-2 transition-colors"
      >
        3D experience taking too long? Switch to 2D view
      </button>
    )}
  </div>
);

// Dynamic 3D Scene chunks loaded on demand
const ProjectileScene3D = dynamic(
  () => import('@/components/experience/3d/ProjectileScene3D').then((m) => m.ProjectileScene3D),
  {
    ssr: false,
    loading: () => (
      <ExperienceLoadingSkeleton
        title="Projectile Simulation"
        subtitle="Configuring parabolic trajectory canvas..."
      />
    ),
  }
);

const HeartAnatomyScene3D = dynamic(
  () => import('@/components/experience/3d/HeartAnatomyScene3D').then((m) => m.HeartAnatomyScene3D),
  {
    ssr: false,
    loading: () => (
      <ExperienceLoadingSkeleton
        title="Anatomy Model"
        subtitle="Loading 3D cardiovascular chamber structures..."
      />
    ),
  }
);

const MoleculeScene3D = dynamic(
  () => import('@/components/experience/3d/MoleculeScene3D').then((m) => m.MoleculeScene3D),
  {
    ssr: false,
    loading: () => (
      <ExperienceLoadingSkeleton
        title="Molecular Bond Model"
        subtitle="Synthesizing valence orbital coordinates..."
      />
    ),
  }
);

const ObjectManipulationScene3D = dynamic(
  () => import('@/components/experience/3d/ObjectManipulationScene3D').then((m) => m.ObjectManipulationScene3D),
  {
    ssr: false,
    loading: () => (
      <ExperienceLoadingSkeleton
        title="Spatial Reasoning"
        subtitle="Generating isometric projection scene..."
      />
    ),
  }
);

export interface ClassExperienceRendererProps {
  conceptId: string;
  modality: 'FULL_3D' | 'MOTION_VISUAL' | 'INTERACTIVE_VISUAL' | 'CODE_LAB' | '2D_FALLBACK';
  currentStage: ClassStageId;
  angle: number;
  velocity: number;
  isLaunching: boolean;
  onAngleChange: (angle: number) => void;
  onVelocityChange: (velocity: number) => void;
  onLaunchComplete?: () => void;
  className?: string;
}

export const ClassExperienceRenderer: React.FC<ClassExperienceRendererProps> = ({
  conceptId,
  modality,
  currentStage,
  angle,
  velocity,
  isLaunching,
  onAngleChange,
  onVelocityChange,
  onLaunchComplete,
  className = '',
}) => {
  // Precompute simulation result for projectile physics
  const [simResult, setSimResult] = useState<SimulationResult>(() =>
    simulateProjectile({
      launchAngleDeg: angle,
      initialVelocity: velocity,
      gravity: 9.8,
      targetDistance: 45,
      targetTolerance: 1.5,
    })
  );

  useEffect(() => {
    if (conceptId === 'projectile_motion') {
      const res = simulateProjectile({
        launchAngleDeg: angle,
        initialVelocity: velocity,
        gravity: 9.8,
        targetDistance: 45,
        targetTolerance: 1.5,
      });
      setSimResult(res);
    }
  }, [conceptId, angle, velocity]);

  // Determine whether direct controls should be shown on the canvas
  const showControls =
    currentStage === 'explore' ||
    currentStage === 'interact' ||
    currentStage === 'mission' ||
    currentStage === 'challenge';

  return (
    <div
      className={`relative w-full h-full min-h-[320px] sm:min-h-[460px] lg:min-h-[520px] rounded-2xl bg-[#0A1024] border border-white/[0.08] overflow-hidden flex flex-col items-center justify-center select-none shadow-2xl ${className}`}
    >
      {/* 1. Projectile 3D Canvas */}
      {conceptId === 'projectile_motion' && (
        <div className="absolute inset-0 w-full h-full">
          <ProjectileScene3D
            launchAngleDeg={angle}
            velocity={velocity}
            targetDistance={45}
            targetTolerance={1.5}
            simResult={simResult}
            isLaunching={isLaunching}
            onLaunchComplete={onLaunchComplete}
          />
        </div>
      )}

      {/* 2. Heart Anatomy 3D Canvas */}
      {conceptId === 'human_heart_anatomy' && (
        <div className="absolute inset-0 w-full h-full">
          <HeartAnatomyScene3D
            onSelectStructure={() => {}}
            isFlowModeActive={currentStage === 'interact' || currentStage === 'mission'}
          />
        </div>
      )}

      {/* 3. Molecule Builder 3D Canvas */}
      {conceptId === 'molecular_bonding' && (
        <div className="absolute inset-0 w-full h-full">
          <MoleculeScene3D
            atoms={H2O_MOLECULE_CONFIG.atoms}
            bonds={[]}
            selectedAtomId={null}
            onSelectAtom={() => {}}
            onAttemptBond={() => {}}
          />
        </div>
      )}

      {/* 4. Object Manipulation 3D Canvas */}
      {conceptId === 'spatial_reasoning' && (
        <div className="absolute inset-0 w-full h-full">
          <ObjectManipulationScene3D />
        </div>
      )}

      {/* 5. 2D Universal Fallback */}
      {modality === '2D_FALLBACK' && (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center p-4">
          <Enhanced2DFallback
            plan={{
              topicId: conceptId,
              topicTitle: 'Concept Exploration',
              mode: '2D_FALLBACK',
              canonicalMode: '2D_FALLBACK',
              ariaLabel: 'Visual Concept Diagram',
              accessibleDescription: 'Interactive 2D concept network diagram',
              estimatedSeconds: 300,
              learningObjective: 'Master core relationships',
            } as any}
          />
        </div>
      )}

      {/* Floating Direct Control Widget (e.g. Angle 45° with minus, slider, plus) */}
      {showControls && conceptId === 'projectile_motion' && (
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 w-[90%] max-w-sm z-10">
          <Slider
            label="Launch Angle"
            value={angle}
            min={0}
            max={90}
            step={5}
            unit="°"
            disabled={isLaunching}
            onChange={onAngleChange}
          />
        </div>
      )}

      {/* Target & Telemetry Watermark Indicator */}
      {conceptId === 'projectile_motion' && (
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2 pointer-events-none">
          <div className="px-2.5 py-1 rounded-lg bg-[#0E152E]/80 backdrop-blur-md border border-white/[0.08] text-[11px] font-mono text-slate-300">
            🎯 Target: <span className="font-bold text-white">45.0m</span>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-[#0E152E]/80 backdrop-blur-md border border-white/[0.08] text-[11px] font-mono text-slate-300">
            Velocity: <span className="font-bold text-white">{velocity} m/s</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassExperienceRenderer;
