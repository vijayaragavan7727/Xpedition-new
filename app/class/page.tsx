'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { UnifiedClassContainer } from '@/components/class';
import { Skeleton } from '@/components/ui';

function ClassPageContent() {
  const searchParams = useSearchParams();
  const conceptParam = searchParams.get('concept') || 'projectile_motion';

  return <UnifiedClassContainer conceptId={conceptParam} backHref="/learn" />;
}

export default function ClassPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#060B18] flex items-center justify-center p-6">
          <Skeleton variant="card" height={360} className="max-w-xl w-full" />
        </div>
      }
    >
      <ClassPageContent />
    </Suspense>
  );
}
