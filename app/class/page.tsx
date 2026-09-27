'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ClassRoute } from '@/components/classroom/ClassRoute';
import { Skeleton } from '@/components/ui';

/**
 * /class?concept=<id>&intent=<intent>
 *
 * No default concept: a missing `concept` shows the explicit unavailable state.
 * Resolution is done by the single resolver inside ClassRoute.
 */
function ClassPageContent() {
  const searchParams = useSearchParams();
  return <ClassRoute rawConceptId={searchParams.get('concept')} rawIntent={searchParams.get('intent')} backHref="/learn" />;
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
