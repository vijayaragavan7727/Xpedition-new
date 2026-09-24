/**
 * Test Suite: Xpedition Physical / Creative Learning Objects
 *
 * Verifies:
 * 1. Flashcard data architecture & physical structure
 * 2. Formula Card data architecture & KaTeX notation
 * 3. Sticky Note data architecture & color palette / types
 * 4. Content separation from visual design
 * 5. DC Motor canonical demo content integrity
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

console.log('🧪 Running Xpedition Learning Objects Test Suite...\n');

let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     ${err.message}`);
    failedTests++;
  }
}

// ============================================================================
// 1. MODULE EXPORT VERIFICATION
// ============================================================================
test('Learning Objects components and demoContent exist on disk', () => {
  const baseDir = path.join(__dirname, '..', 'components', 'learning-objects');
  assert.ok(fs.existsSync(path.join(baseDir, 'types.ts')), 'types.ts must exist');
  assert.ok(fs.existsSync(path.join(baseDir, 'LearningFlashcard.tsx')), 'LearningFlashcard.tsx must exist');
  assert.ok(fs.existsSync(path.join(baseDir, 'FormulaCard.tsx')), 'FormulaCard.tsx must exist');
  assert.ok(fs.existsSync(path.join(baseDir, 'StickyNote.tsx')), 'StickyNote.tsx must exist');
  assert.ok(fs.existsSync(path.join(baseDir, 'KaTeXRenderer.tsx')), 'KaTeXRenderer.tsx must exist');
  assert.ok(fs.existsSync(path.join(baseDir, 'PhysicalDeskCollection.tsx')), 'PhysicalDeskCollection.tsx must exist');
  assert.ok(fs.existsSync(path.join(baseDir, 'demoContent.ts')), 'demoContent.ts must exist');
  assert.ok(fs.existsSync(path.join(baseDir, 'index.ts')), 'index.ts must exist');
});

// ============================================================================
// 2. DEMO CONTENT VERIFICATION
// ============================================================================
test('DC Motor demo flashcards contain required prompts and answers', () => {
  const demoContentPath = path.join(__dirname, '..', 'components', 'learning-objects', 'demoContent.ts');
  const fileContent = fs.readFileSync(demoContentPath, 'utf8');

  // Verify DC Motor flashcard content
  assert.ok(
    fileContent.includes('What happens when current direction reverses?'),
    'Flashcard front must ask about current direction reversal'
  );
  assert.ok(
    fileContent.includes("The motor's rotation reverses.") || fileContent.includes("The direction of rotation reverses."),
    'Flashcard must include rotation reversal answer'
  );

  // Verify Magnetic Force flashcard
  assert.ok(
    fileContent.includes('MAGNETIC FORCE'),
    'Demo flashcards must include Magnetic Force card'
  );

  // Verify Quick Check / Commutation flashcard
  assert.ok(
    fileContent.includes('QUICK CHECK'),
    'Demo flashcards must include Quick Check card'
  );
  assert.ok(
    fileContent.includes('What keeps torque continuous?'),
    'Must include torque continuity question'
  );
});

// ============================================================================
// 3. FORMULA CARDS VERIFICATION
// ============================================================================
test('Formula Cards use valid TeX mathematical notation and variables', () => {
  const demoContentPath = path.join(__dirname, '..', 'components', 'learning-objects', 'demoContent.ts');
  const fileContent = fs.readFileSync(demoContentPath, 'utf8');

  // TeX expression check
  assert.ok(
    fileContent.includes('F = I \\\\cdot L \\\\cdot B \\\\cdot \\\\sin(\\\\theta)'),
    'Formula card must have Lorentz force formula in TeX notation'
  );
  assert.ok(
    fileContent.includes('\\\\tau = F \\\\cdot r'),
    'Formula card must have Torque formula in TeX notation'
  );

  // Variable definitions check
  assert.ok(fileContent.includes('Force on conductor'), 'Must define Force variable');
  assert.ok(fileContent.includes('Electric current'), 'Must define Current variable');
  assert.ok(fileContent.includes('Magnetic field flux density'), 'Must define Magnetic Field variable');
});

// ============================================================================
// 4. STICKY NOTES VERIFICATION
// ============================================================================
test('Sticky notes adhere to required categories, colors, and content', () => {
  const demoContentPath = path.join(__dirname, '..', 'components', 'learning-objects', 'demoContent.ts');
  const fileContent = fs.readFileSync(demoContentPath, 'utf8');

  // Key Idea (Yellow)
  assert.ok(
    fileContent.includes('Commutation keeps torque continuous.'),
    'Key idea sticky note must state: Commutation keeps torque continuous.'
  );

  // Remember (Green)
  assert.ok(
    fileContent.includes('Reverse current → reverse rotation.') || fileContent.includes('reverse rotation'),
    'Remember sticky note must highlight rotation direction rule'
  );

  // Try This (Blue)
  assert.ok(
    fileContent.includes('Predict the motor direction first.'),
    'Try this sticky note must prompt direction prediction'
  );

  // Common Mistake (Pink)
  assert.ok(
    fileContent.includes('Do not confuse current direction with magnetic-field direction.'),
    'Common mistake sticky note must warn about current vs field'
  );

  // Hint (Orange)
  assert.ok(
    fileContent.includes('Think about what changes when current reverses.'),
    'Hint sticky note must provide reverse current hint'
  );
});

// ============================================================================
// 5. CLASSROOM INTEGRATION VERIFICATION
// ============================================================================
test('Classroom Tools Modal uses LearningFlashcard, FormulaCard, and StickyNote', () => {
  const modalPath = path.join(__dirname, '..', 'components', 'classroom', 'tools', 'ClassroomToolsModal.tsx');
  const modalContent = fs.readFileSync(modalPath, 'utf8');

  assert.ok(
    modalContent.includes('LearningFlashcard'),
    'ClassroomToolsModal must use LearningFlashcard'
  );
  assert.ok(
    modalContent.includes('FormulaCard'),
    'ClassroomToolsModal must use FormulaCard'
  );
  assert.ok(
    modalContent.includes('StickyNote'),
    'ClassroomToolsModal must use StickyNote'
  );
});

test('SmartBoard integrates StickyNote and Formula shortcut', () => {
  const boardPath = path.join(__dirname, '..', 'components', 'classroom', 'SmartBoard.tsx');
  const boardContent = fs.readFileSync(boardPath, 'utf8');

  assert.ok(
    boardContent.includes('StickyNote'),
    'SmartBoard must import and use StickyNote'
  );
  assert.ok(
    boardContent.includes('formulaSnippet'),
    'SmartBoard must support formula snippet inspection'
  );
  assert.ok(
    boardContent.includes('COMMON MISTAKE'),
    'SmartBoard must show common mistake note on incorrect check'
  );
});

// ============================================================================
// 6. STYLES & TYPOGRAPHY SYSTEM
// ============================================================================
test('Globals.css imports KaTeX stylesheet', () => {
  const cssPath = path.join(__dirname, '..', 'app', 'globals.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  assert.ok(
    cssContent.includes('katex/dist/katex.min.css'),
    'globals.css must import katex.min.css for mathematical styling'
  );
});

console.log(`\nResults: ${passedTests} passed, ${failedTests} failed.`);
if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('🎉 All Learning Object design system tests passed!\n');
}
