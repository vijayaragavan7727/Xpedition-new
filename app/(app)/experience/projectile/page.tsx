'use client';

import React from 'react';
import { ExperienceContainer } from '@/components/experience/ExperienceContainer';
import { PROJECTILE_MOTION_EXPERIENCE } from '@/lib/experience/catalog/projectileMotionConfig';

export default function ProjectileExperiencePage() {
  return (
    <div className="py-2">
      <ExperienceContainer
        config={PROJECTILE_MOTION_EXPERIENCE}
        backHref="/home"
      />
    </div>
  );
}
