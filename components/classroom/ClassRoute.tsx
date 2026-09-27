'use client';

/**
 * Shared Class route body used by BOTH `/class?concept=X` and `/class/X`.
 *
 * It calls the one authoritative resolver and mounts ClassroomLayout with a key
 * of `conceptId|intent`, so every concept switch is a full, clean remount.
 */

import React, { useMemo } from 'react';
import { resolveClassLesson } from '@/lib/concepts/lessonResolver';
import { ClassroomLayout } from './ClassroomLayout';
import { ClassLessonUnavailable } from './ClassLessonUnavailable';

export interface ClassRouteProps {
  rawConceptId: string | null | undefined;
  rawIntent: string | null | undefined;
  backHref?: string;
}

export const ClassRoute: React.FC<ClassRouteProps> = ({ rawConceptId, rawIntent, backHref = '/learn' }) => {
  const resolution = useMemo(() => resolveClassLesson(rawConceptId ?? '', rawIntent ?? undefined), [rawConceptId, rawIntent]);

  if (resolution.status !== 'resolved') {
    return <ClassLessonUnavailable requestedConceptId={resolution.requestedConceptId} reason={resolution.reason} />;
  }

  return (
    <ClassroomLayout
      key={`${resolution.conceptId}|${resolution.intent}`}
      requestedConceptId={resolution.requestedConceptId}
      concept={resolution.concept}
      lesson={resolution.lesson}
      intent={resolution.intent}
      backHref={backHref}
    />
  );
};

export default ClassRoute;
