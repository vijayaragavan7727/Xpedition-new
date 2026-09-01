'use client';

import React, { useMemo } from 'react';
import { useWorldState } from '@/lib/hooks/world';
import { computeGameWorldData } from '@/lib/engine/gameWorldAdapter';
import LivingWorldMap from '@/components/world/LivingWorldMap';

export default function WorldPage() {
  const { storeData, isLoading } = useWorldState();

  const gameWorldData = useMemo(() => {
    if (!storeData) return null;
    return computeGameWorldData(storeData);
  }, [storeData]);

  if (!storeData || !gameWorldData) {
    return (
      <div className="w-full h-full min-h-screen flex items-center justify-center bg-[#102416] font-mono text-xs text-emerald-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span>Opening Learning Territory...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-screen relative select-none overflow-x-hidden bg-[#102416]">
      <LivingWorldMap worldData={gameWorldData} />
    </div>
  );
}
