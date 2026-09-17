'use client';

/**
 * Dedicated route for Experience #3: 3D Molecule Builder
 * Route: /experience/molecule
 *
 * Demonstrates the reusability of the Experience Engine:
 * - Direct standalone interactive launch
 * - Real-time 3D molecular manipulation & covalent bonding
 * - Domain-specific valence rules & misconception coaching
 * - Telemetry & Xira pedagogical advice
 * - Emits evidence to canonical Learner Model
 */

import React from 'react';
import { MoleculeExperienceContainer } from '@/components/experience/MoleculeExperienceContainer';
import { MOLECULE_BUILDER_EXPERIENCE } from '@/lib/experience/catalog/moleculeBuilderConfig';

export default function MoleculeExperiencePage() {
  return (
    <div className="py-2">
      <MoleculeExperienceContainer
        config={MOLECULE_BUILDER_EXPERIENCE}
        backHref="/home"
      />
    </div>
  );
}
