'use client';

import React from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ClassRoute } from '@/components/classroom/ClassRoute';

/**
 * /class/<id>[?intent=<intent>]
 *
 * Uses exactly the same resolver and Class runtime as /class?concept=<id>.
 * (Previously this route fell back to a separate container whose catalog
 * defaulted every unknown concept to the DC motor lesson.)
 */
function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default function ConceptClassPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const rawId = typeof params?.conceptId === 'string' ? safeDecode(params.conceptId) : '';
  return <ClassRoute rawConceptId={rawId} rawIntent={searchParams?.get('intent')} backHref="/learn" />;
}
