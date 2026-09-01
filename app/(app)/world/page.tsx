'use client';

import React, { useMemo } from 'react';
import { useWorldState } from '@/lib/hooks/world';
import { computeGameWorldData } from '@/lib/engine/gameWorldAdapter';
import IsometricVillageMap from '@/components/world/IsometricVillageMap';

export default function WorldPage() {
  const { storeData, isLoading } = useWorldState();

  const gameWorldData = useMemo(() => {
    if (!storeData) return null;
    return computeGameWorldData(storeData);
  }, [storeData]);

  if (!storeData || !gameWorldData) {
    return (
      <div className="w-full h-full min-h-screen flex items-center justify-center bg-[#0D1F12] font-mono text-xs text-emerald-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span>Entering Village Base...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[100dvh] relative select-none overflow-hidden bg-[#0D1F12]">
      <IsometricVillageMap worldData={gameWorldData} />
    </div>
  );
}
