'use client';

import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWorldState } from '@/lib/hooks/world';
import { computeGameWorldData } from '@/lib/engine/gameWorldAdapter';
import { IsometricLearningBase } from '@/components/game/IsometricLearningBase';
import { Layers, Box } from 'lucide-react';

// Dynamic WebGL Game Canvas with SSR disabled
const GameCanvas = dynamic(() => import('@/components/world3d/GameCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#0A071B] font-mono text-xs text-[#00F0FF]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-[#00F0FF] border-t-transparent rounded-full animate-spin" />
        <span>Loading XPedition 3D World...</span>
      </div>
    </div>
  ),
});

export default function WorldPage() {
  const { storeData, isLoading } = useWorldState();
  const [viewMode, setViewMode] = useState<'isometric' | '3d'>('isometric');

  const gameWorldData = useMemo(() => {
    if (!storeData) return null;
    return computeGameWorldData(storeData);
  }, [storeData]);

  if (!storeData) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#0A071B] font-mono text-xs text-[#00F0FF]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#00F0FF] border-t-transparent rounded-full animate-spin" />
          <span>Synchronizing Realm Data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative select-none overflow-hidden bg-[#0A071B] flex flex-col">
      {/* Perspective Toggle Switch (Isometric Base vs 3D Realm) */}
      <div className="absolute top-24 left-3 sm:left-4 z-40 flex items-center gap-1 bg-[#100B24]/90 backdrop-blur-md p-1 rounded-2xl border border-white/15 shadow-xl">
        <button
          onClick={() => setViewMode('isometric')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
            viewMode === 'isometric'
              ? 'bg-[#00F0FF] text-black shadow-[0_0_12px_rgba(0,240,255,0.6)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Base Map</span>
        </button>

        <button
          onClick={() => setViewMode('3d')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
            viewMode === '3d'
              ? 'bg-[#A855F7] text-white shadow-[0_0_12px_rgba(168,85,247,0.6)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          <span>3D Realm</span>
        </button>
      </div>

      {/* Main Base View / 3D Canvas */}
      <div className="flex-1 w-full h-full overflow-hidden">
        {viewMode === 'isometric' ? (
          <IsometricLearningBase storeData={storeData} />
        ) : (
          gameWorldData && <GameCanvas worldData={gameWorldData} />
        )}
      </div>
    </div>
  );
}
