'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { UnifiedClassContainer } from '@/components/class';
import { ClassroomLayout } from '@/components/classroom/ClassroomLayout';
import { CANONICAL_CLASSROOM_LESSONS } from '@/lib/classroom/classroomCatalog';
import { Skeleton } from '@/components/ui';

function ClassPageContent() {
  const searchParams = useSearchParams();
  const conceptParam = searchParams.get('concept') || 'dc_motor';

  const isClassroomLesson =
    conceptParam === 'dc_motor' ||
    conceptParam.includes('motor') ||
    Boolean(CANONICAL_CLASSROOM_LESSONS[conceptParam]);

  if (isClassroomLesson) {
    return <ClassroomLayout conceptId={conceptParam} backHref="/learn" />;
  }

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
