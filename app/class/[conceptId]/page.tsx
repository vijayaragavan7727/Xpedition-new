'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { UnifiedClassContainer } from '@/components/class';
import { ClassroomLayout } from '@/components/classroom/ClassroomLayout';
import { CANONICAL_CLASSROOM_LESSONS } from '@/lib/classroom/classroomCatalog';

export default function ConceptClassPage() {
  const params = useParams();
  const conceptId = (params?.conceptId as string) || 'dc_motor';

  const isClassroomLesson =
    conceptId === 'dc_motor' ||
    conceptId.includes('motor') ||
    Boolean(CANONICAL_CLASSROOM_LESSONS[conceptId]);

  if (isClassroomLesson) {
    return <ClassroomLayout conceptId={conceptId} backHref="/learn" />;
  }

  return <UnifiedClassContainer conceptId={conceptId} backHref="/learn" />;
}
