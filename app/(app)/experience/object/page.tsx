'use client';

/**
 * Dedicated route for Experience #2: 3D Object Manipulation
 * Route: /experience/object
 *
 * Demonstrates the reusability of the Experience Engine:
 * - Direct standalone interactive launch
 * - Real-time spatial manipulation & 3D orientation matching
 * - Live telemetry & Xira guidance
 * - Connects directly to Learner Model
 */

import React from 'react';
import { ObjectExperienceContainer } from '@/components/experience/ObjectExperienceContainer';
import { OBJECT_MANIPULATION_EXPERIENCE } from '@/lib/experience/catalog/objectManipulationConfig';

export default function ObjectExperiencePage() {
  return (
    <div className="py-2">
      <ObjectExperienceContainer
        config={OBJECT_MANIPULATION_EXPERIENCE}
        backHref="/home"
      />
    </div>
  );
}
