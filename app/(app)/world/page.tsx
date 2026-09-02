'use client';

import React, { useMemo } from 'react';
import { useWorldState } from '@/lib/hooks/world';
import { computeGameWorldData } from '@/lib/engine/gameWorldAdapter';
import LivingStrategyWorld from '@/components/world/LivingStrategyWorld';

export default function WorldPage() {
  const { storeData, isLoading } = useWorldState();

  const gameWorldData = useMemo(() => {
    if (!storeData) return null;
    return computeGameWorldData(storeData);
  }, [storeData]);

  if (!storeData || !gameWorldData) {
    return (
      <div className="w-full h-full min-h-screen flex items-center justify-center bg-[#09110B] font-mono text-xs text-amber-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <span>Entering Strategy Game World...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[100dvh] relative select-none overflow-hidden bg-[#09110B]">
      <LivingStrategyWorld worldData={gameWorldData} />
    </div>
  );
}
