/**
 * Pure Deterministic Molecular Bonding & Domain Rules Engine
 *
 * Implements valence verification, bond validation, disallowed bond detection,
 * and target molecule structure matching.
 *
 * 100% decoupled from Three.js and the DOM — unit-testable in Node.js.
 */

import {
  MoleculeAtomDefinition,
  MoleculeBond,
  MoleculeBuilderConfig,
} from '../types';

export interface BondValidationResult {
  isValid: boolean;
  errorReason?: string;
  principle: 'bond_valid' | 'bond_invalid_hh' | 'valence_exceeded' | 'bond_invalid_duplicate' | 'bond_invalid_self';
}

export interface MoleculeEvaluationResult {
  isComplete: boolean;
  isTargetMatched: boolean;
  statusMessage: string;
  missingBondsCount: number;
  validBondsCount: number;
  invalidBondsCount: number;
  principle: 'molecule_complete' | 'molecule_incomplete';
}

/**
 * Normalizes bond atom IDs into a canonical sorted key (e.g. "h1:o1").
 */
export function getCanonicalBondKey(idA: string, idB: string): string {
  return [idA, idB].sort().join(':');
}

/**
 * Validates whether two atoms can form a covalent bond under the current molecule rules.
 */
export function validateBond(
  atomA: MoleculeAtomDefinition,
  atomB: MoleculeAtomDefinition,
  existingBonds: MoleculeBond[],
  config: MoleculeBuilderConfig
): BondValidationResult {
  // 1. Check self-bonding
  if (atomA.id === atomB.id) {
    return {
      isValid: false,
      errorReason: 'An atom cannot form a bond with itself.',
      principle: 'bond_invalid_self',
    };
  }

  // 2. Check duplicate bond
  const proposedKey = getCanonicalBondKey(atomA.id, atomB.id);
  const alreadyExists = existingBonds.some(
    (b) => getCanonicalBondKey(b.fromAtomId, b.toAtomId) === proposedKey
  );
  if (alreadyExists) {
    return {
      isValid: false,
      errorReason: 'A covalent bond already connects these two atoms.',
      principle: 'bond_invalid_duplicate',
    };
  }

  // 3. Check valence limits
  const bondsCountA = existingBonds.filter(
    (b) => b.fromAtomId === atomA.id || b.toAtomId === atomA.id
  ).length;
  if (bondsCountA >= atomA.maxBonds) {
    return {
      isValid: false,
      errorReason: `${atomA.elementName} has reached its valence capacity of ${atomA.maxBonds} bond${atomA.maxBonds > 1 ? 's' : ''}.`,
      principle: 'valence_exceeded',
    };
  }

  const bondsCountB = existingBonds.filter(
    (b) => b.fromAtomId === atomB.id || b.toAtomId === atomB.id
  ).length;
  if (bondsCountB >= atomB.maxBonds) {
    return {
      isValid: false,
      errorReason: `${atomB.elementName} has reached its valence capacity of ${atomB.maxBonds} bond${atomB.maxBonds > 1 ? 's' : ''}.`,
      principle: 'valence_exceeded',
    };
  }

  // 4. Check disallowed bonds
  if (config.disallowedBonds) {
    const disallowed = config.disallowedBonds.find(
      (rule) =>
        (rule.fromType === atomA.elementSymbol && rule.toType === atomB.elementSymbol) ||
        (rule.fromType === atomB.elementSymbol && rule.toType === atomA.elementSymbol)
    );
    if (disallowed) {
      return {
        isValid: false,
        errorReason: disallowed.reason,
        principle: 'bond_invalid_hh',
      };
    }
  }

  // 5. Valid bond
  return {
    isValid: true,
    principle: 'bond_valid',
  };
}

/**
 * Evaluates the overall molecule against the target structure.
 */
export function evaluateMoleculeStructure(
  currentBonds: MoleculeBond[],
  config: MoleculeBuilderConfig
): MoleculeEvaluationResult {
  const targetKeys = new Set(
    config.targetBonds.map((tb) => getCanonicalBondKey(tb.fromAtomId, tb.toAtomId))
  );

  let validBondsCount = 0;
  let invalidBondsCount = 0;

  currentBonds.forEach((bond) => {
    const key = getCanonicalBondKey(bond.fromAtomId, bond.toAtomId);
    if (targetKeys.has(key)) {
      validBondsCount++;
    } else {
      invalidBondsCount++;
    }
  });

  const missingBondsCount = Math.max(0, targetKeys.size - validBondsCount);
  const isComplete = missingBondsCount === 0 && invalidBondsCount === 0;

  let statusMessage = '';
  if (isComplete) {
    statusMessage = `${config.moleculeName} (${config.moleculeFormula}) structure complete!`;
  } else if (validBondsCount > 0) {
    statusMessage = `${validBondsCount} of ${targetKeys.size} target bonds formed. ${missingBondsCount} remaining.`;
  } else {
    statusMessage = `No bonds formed yet. Connect atoms to build ${config.moleculeFormula}.`;
  }

  return {
    isComplete,
    isTargetMatched: isComplete,
    statusMessage,
    missingBondsCount,
    validBondsCount,
    invalidBondsCount,
    principle: isComplete ? 'molecule_complete' : 'molecule_incomplete',
  };
}

/**
 * Calculates 3D geometry transform for rendering a bond cylinder between two 3D atom positions.
 */
export function calculateBondCylinder(
  posA: [number, number, number],
  posB: [number, number, number]
): {
  midpoint: [number, number, number];
  length: number;
  direction: [number, number, number];
} {
  const dx = posB[0] - posA[0];
  const dy = posB[1] - posA[1];
  const dz = posB[2] - posA[2];
  const length = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;

  const midpoint: [number, number, number] = [
    (posA[0] + posB[0]) / 2,
    (posA[1] + posB[1]) / 2,
    (posA[2] + posB[2]) / 2,
  ];

  const direction: [number, number, number] = [dx / length, dy / length, dz / length];

  return { midpoint, length, direction };
}
