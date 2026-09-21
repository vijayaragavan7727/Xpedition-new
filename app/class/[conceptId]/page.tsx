'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { UnifiedClassContainer } from '@/components/class';

export default function ConceptClassPage() {
  const params = useParams();
  const conceptId = (params?.conceptId as string) || 'projectile_motion';

  return <UnifiedClassContainer conceptId={conceptId} backHref="/learn" />;
}
