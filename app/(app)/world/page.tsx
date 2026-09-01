'use client';

import React from 'react';
import { useWorldState } from '@/lib/hooks/world';
import { TopDownGameWorld } from '@/components/game/TopDownGameWorld';

export default function WorldPage() {
  const { storeData, isLoading } = useWorldState();

  if (!storeData && isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#1B381A] font-mono text-xs text-amber-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <span className="font-bold tracking-wide">Loading World Terrain...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative select-none overflow-hidden bg-[#1B381A]">
      <TopDownGameWorld storeData={storeData} />
    </div>
  );
}
