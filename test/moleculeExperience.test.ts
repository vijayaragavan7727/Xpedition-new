/**
 * Experience Engine Milestone 4: 3D Molecule Builder Test Suite
 *
 * Validates:
 * 1. Declarative Molecule Configuration Contract
 * 2. Domain Rules (Atom validation, Valence limits, Duplicate rejection, Self-bond rejection)
 * 3. Misconception Detection (H-H disallowed bond with constructive explanation)
 * 4. Structure Matching (Incomplete vs. Complete H2O molecule)
 * 5. 3D Bond Cylinder Kinematics
 * 6. Molecular Telemetry Flow (atom selection, bond attempt, creation, rejection)
 * 7. Xira Molecular Pedagogical Advisor across all interaction states
 * 8. Learner Model Adapter integration and canonical Attempt recording
 * 9. Quest Definition & Canonical Loop Mapping
 */

import {
  validateBond,
  evaluateMoleculeStructure,
  calculateBondCylinder,
  getCanonicalBondKey,
} from '../lib/experience/domain/moleculeRules';
import {
  H2O_MOLECULE_CONFIG,
  MOLECULE_BUILDER_EXPERIENCE,
  MOLECULE_BUILDER_QUEST,
  createMoleculeExperienceResult,
} from '../lib/experience/catalog/moleculeBuilderConfig';
import { TelemetryEmitter } from '../lib/experience/telemetry/telemetryEmitter';
import { defaultXiraExperienceAdvisor } from '../lib/experience/xira/xiraExperienceAdvisor';
import { LearnerModelAdapter } from '../lib/experience/learnerModel/learnerModelAdapter';
import { MoleculeBond, XiraExperienceObservation } from '../lib/experience/types';

interface AssertionReport {
  name: string;
  passed: boolean;
  error?: string;
}

export async function runMoleculeExperienceTests(): Promise<void> {
  const results: AssertionReport[] = [];

  function assert(name: string, condition: boolean, message?: string) {
    if (condition) {
      results.push({ name, passed: true });
      console.log(`  ✓ ${name}`);
    } else {
      results.push({ name, passed: false, error: message || 'Assertion failed' });
      console.error(`  ✗ ${name}: ${message || 'Assertion failed'}`);
    }
  }

  console.log('\n======================================================');
  console.log('XPEDITION EXPERIENCE ENGINE — MOLECULE BUILDER TESTS');
  console.log('======================================================\n');

  const [oxygen, hydrogen1, hydrogen2] = H2O_MOLECULE_CONFIG.atoms;

  // ----------------------------------------------------
  // SECTION 1: Declarative Molecule Configuration
  // ----------------------------------------------------
  console.log('1. Testing Declarative Molecule Configuration...');

  assert(
    'H2O_MOLECULE_CONFIG has formula H₂O and 3 atoms',
    H2O_MOLECULE_CONFIG.moleculeFormula === 'H₂O' && H2O_MOLECULE_CONFIG.atoms.length === 3
  );

  assert(
    'Oxygen has valence 2 and maxBonds 2',
    oxygen.elementSymbol === 'O' && oxygen.valence === 2 && oxygen.maxBonds === 2
  );

  assert(
    'Hydrogen atoms have valence 1 and maxBonds 1',
    hydrogen1.elementSymbol === 'H' && hydrogen1.maxBonds === 1 && hydrogen2.maxBonds === 1
  );

  assert(
    'Target bonds specify 2 bonds (o1-h1 and o1-h2)',
    H2O_MOLECULE_CONFIG.targetBonds.length === 2
  );

  assert(
    'MOLECULE_BUILDER_EXPERIENCE has experienceType MOLECULE_BUILDER',
    MOLECULE_BUILDER_EXPERIENCE.experienceType === 'MOLECULE_BUILDER'
  );

  // ----------------------------------------------------
  // SECTION 2: Domain Rules & Valence Verification
  // ----------------------------------------------------
  console.log('\n2. Testing Domain Rules & Valence Limits...');

  // A. Self-bonding
  const selfBondRes = validateBond(oxygen, oxygen, [], H2O_MOLECULE_CONFIG);
  assert(
    'Rejects self-bonding with atom_invalid_self principle',
    selfBondRes.isValid === false && selfBondRes.principle === 'bond_invalid_self'
  );

  // B. Valid O-H bond
  const validBond1 = validateBond(oxygen, hydrogen1, [], H2O_MOLECULE_CONFIG);
  assert(
    'Allows initial valid O-H covalent bond',
    validBond1.isValid === true && validBond1.principle === 'bond_valid'
  );

  // C. Duplicate bond
  const existingBond1: MoleculeBond = { id: 'o1-h1', fromAtomId: 'o1', toAtomId: 'h1' };
  const dupBondRes = validateBond(oxygen, hydrogen1, [existingBond1], H2O_MOLECULE_CONFIG);
  assert(
    'Rejects duplicate bond between already connected atoms',
    dupBondRes.isValid === false && dupBondRes.principle === 'bond_invalid_duplicate'
  );

  // D. Disallowed H-H bond in Water
  const hhBondRes = validateBond(hydrogen1, hydrogen2, [], H2O_MOLECULE_CONFIG);
  assert(
    'Rejects H-H bond with bond_invalid_hh principle and explanation',
    hhBondRes.isValid === false &&
      hhBondRes.principle === 'bond_invalid_hh' &&
      Boolean(hhBondRes.errorReason && hhBondRes.errorReason.includes('Hydrogen atoms do not bond to each other'))
  );

  // E. Hydrogen valence exceeded (Hydrogen already has 1 bond)
  const dummyAtom = { ...oxygen, id: 'o2' };
  const hExceededRes = validateBond(hydrogen1, dummyAtom, [existingBond1], H2O_MOLECULE_CONFIG);
  assert(
    'Enforces Hydrogen valence limit (max 1 bond)',
    hExceededRes.isValid === false && hExceededRes.principle === 'valence_exceeded'
  );

  // F. Oxygen valence exceeded (Oxygen already has 2 bonds)
  const existingBond2: MoleculeBond = { id: 'o1-h2', fromAtomId: 'o1', toAtomId: 'h2' };
  const oExceededRes = validateBond(oxygen, dummyAtom, [existingBond1, existingBond2], H2O_MOLECULE_CONFIG);
  assert(
    'Enforces Oxygen valence limit (max 2 bonds)',
    oExceededRes.isValid === false && oExceededRes.principle === 'valence_exceeded'
  );

  // ----------------------------------------------------
  // SECTION 3: Structure Matching (Incomplete vs Complete)
  // ----------------------------------------------------
  console.log('\n3. Testing Molecule Structure Evaluation...');

  // Zero bonds
  const evalEmpty = evaluateMoleculeStructure([], H2O_MOLECULE_CONFIG);
  assert('Zero bonds evaluated as incomplete with 2 missing bonds', evalEmpty.isComplete === false && evalEmpty.missingBondsCount === 2);

  // 1 O-H bond
  const evalPartial = evaluateMoleculeStructure([existingBond1], H2O_MOLECULE_CONFIG);
  assert('1 O-H bond evaluated as incomplete with 1 missing bond', evalPartial.isComplete === false && evalPartial.missingBondsCount === 1);

  // 2 O-H bonds (Complete H2O!)
  const evalComplete = evaluateMoleculeStructure([existingBond1, existingBond2], H2O_MOLECULE_CONFIG);
  assert(
    '2 O-H bonds successfully matches complete H₂O molecule',
    evalComplete.isComplete === true &&
      evalComplete.isTargetMatched === true &&
      evalComplete.principle === 'molecule_complete'
  );

  // ----------------------------------------------------
  // SECTION 4: 3D Bond Cylinder Kinematics
  // ----------------------------------------------------
  console.log('\n4. Testing 3D Bond Cylinder Calculation...');

  const cyl = calculateBondCylinder([0, 0, 0], [0, 2, 0]);
  assert(
    'calculateBondCylinder computes correct midpoint [0, 1, 0] and length 2.0',
    cyl.midpoint[0] === 0 && cyl.midpoint[1] === 1 && cyl.length === 2
  );

  // ----------------------------------------------------
  // SECTION 5: Molecular Telemetry Flow
  // ----------------------------------------------------
  console.log('\n5. Testing Molecular Telemetry Flow...');

  const telemetry = new TelemetryEmitter(
    MOLECULE_BUILDER_EXPERIENCE.id,
    MOLECULE_BUILDER_EXPERIENCE.conceptId,
    MOLECULE_BUILDER_EXPERIENCE.title
  );

  telemetry.emit('experience_started', { formula: 'H₂O' });
  telemetry.emit('atom_selected', { atomId: 'o1' });
  telemetry.emit('bond_attempted', { from: 'o1', to: 'h1' });
  telemetry.emit('bond_created', { bondId: 'o1-h1' });
  telemetry.emit('bond_rejected', { from: 'h1', to: 'h2', reason: 'Disallowed' });
  telemetry.emit('molecule_completed', { totalBonds: 2 });

  const events = telemetry.getEvents();
  assert('Telemetry records all 6 molecular lifecycle events', events.length === 6);
  assert('First event is experience_started', events[0].type === 'experience_started');
  assert('Bond rejected event recorded with reason', (events[4].payload as any).reason === 'Disallowed');

  const synthesized = telemetry.synthesizeObservation();
  assert('synthesizeObservation records total interactions', (synthesized.totalInteractions ?? 0) >= 6);

  // ----------------------------------------------------
  // SECTION 6: Xira Molecular Advisor
  // ----------------------------------------------------
  console.log('\n6. Testing Xira Molecular Advisor Feedback...');

  // Case A: Initial unbonded state
  const initialFeedback = defaultXiraExperienceAdvisor.generateMoleculeFeedback(synthesized, 0, false);
  assert(
    'generateMoleculeFeedback on unbonded state gives encouraging starting advice',
    initialFeedback.isOptimal === false && initialFeedback.tone === 'encouraging'
  );

  // Case B: H-H Misconception feedback
  const hhFeedback = defaultXiraExperienceAdvisor.generateMoleculeFeedback(
    synthesized,
    0,
    false,
    'Hydrogen atoms do not bond to each other in this molecule',
    'bond_invalid_hh'
  );
  assert(
    'generateMoleculeFeedback explains H-H misconception constructively',
    hhFeedback.observation.includes('Hydrogen-to-Hydrogen') &&
      hhFeedback.pedagogicalInsight.includes('Each hydrogen only has one valence electron')
  );

  // Case C: Valence capacity exceeded
  const valenceFeedback = defaultXiraExperienceAdvisor.generateMoleculeFeedback(
    synthesized,
    1,
    false,
    'Oxygen has reached its valence capacity',
    'valence_exceeded'
  );
  assert(
    'generateMoleculeFeedback explains valence capacity limits',
    valenceFeedback.observation.includes('Valence capacity reached')
  );

  // Case D: 1 bond formed
  const partialFeedback = defaultXiraExperienceAdvisor.generateMoleculeFeedback(synthesized, 1, false);
  assert(
    'generateMoleculeFeedback recognizes 1 of 2 bonds formed',
    partialFeedback.observation.includes('1 of 2') && partialFeedback.tone === 'guiding'
  );

  // Case E: Complete H2O molecule
  const completeFeedback = defaultXiraExperienceAdvisor.generateMoleculeFeedback(synthesized, 2, true);
  assert(
    'generateMoleculeFeedback celebrates completion of water molecule with octet insight',
    completeFeedback.isOptimal === true &&
      completeFeedback.tone === 'celebrating' &&
      completeFeedback.pedagogicalInsight.includes('octet')
  );

  // ----------------------------------------------------
  // SECTION 7: ExperienceResult & Learner Model
  // ----------------------------------------------------
  console.log('\n7. Testing ExperienceResult & Learner Model Integration...');

  const expResult = createMoleculeExperienceResult(
    MOLECULE_BUILDER_EXPERIENCE,
    synthesized,
    [existingBond1, existingBond2],
    true,
    1, // 1 invalid attempt overcome
    35 // seconds
  );

  assert('createMoleculeExperienceResult marks completed = true on valid H₂O', expResult.completed === true);
  assert('createMoleculeExperienceResult records molecularEvidence', Boolean(expResult.molecularEvidence?.valenceSatisfied));
  assert('createMoleculeExperienceResult records evidence signals', (expResult.evidenceSignals?.length ?? 0) >= 2);

  const evidencePayload = {
    conceptId: 'molecular_bonding',
    conceptName: 'Molecular Bonding: Water (H₂O)',
    isSuccess: true,
    accuracy: 0.9,
    trialsCount: 3,
    confidence: 'known' as const,
    timeSpentSeconds: 35,
    timestamp: Date.now(),
  };

  const { attempt, nextAction } = LearnerModelAdapter.recordExperienceOutcome(evidencePayload);
  assert('LearnerModelAdapter converts molecular evidence to canonical Attempt', Boolean(attempt && attempt.id));
  assert('Attempt conceptId matches molecular_bonding', attempt.conceptId === 'molecular_bonding');
  assert('LearnerModelAdapter produces nextAction recommendation', Boolean(nextAction && nextAction.reason));

  // ----------------------------------------------------
  // SECTION 8: Quest Definition & Canonical Loop
  // ----------------------------------------------------
  console.log('\n8. Testing Quest Definition Mapping...');

  assert(
    'MOLECULE_BUILDER_QUEST has conceptId molecular_bonding',
    MOLECULE_BUILDER_QUEST.conceptId === 'molecular_bonding'
  );

  assert(
    'MOLECULE_BUILDER_QUEST first item has experienceType MOLECULE_BUILDER',
    MOLECULE_BUILDER_QUEST.items[0].experienceType === 'MOLECULE_BUILDER'
  );

  assert(
    'MOLECULE_BUILDER_QUEST has reflection follow-up item',
    MOLECULE_BUILDER_QUEST.items[1].type === 'reflection'
  );

  // ----------------------------------------------------
  // Test Summary
  // ----------------------------------------------------
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  console.log('\n------------------------------------------------------');
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
  console.log('------------------------------------------------------\n');

  if (failedCount > 0) {
    throw new Error(`${failedCount} tests failed.`);
  }
}

// Auto-run if executed directly via Node
if (require.main === module) {
  runMoleculeExperienceTests().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
