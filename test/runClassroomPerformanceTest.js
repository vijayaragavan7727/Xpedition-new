/**
 * Xpedition Classroom Performance & Stability Regression Suite
 *
 * Verifies:
 * 1. No repeated visual resolution (VisualRequirementEngine caches by concept/stage)
 * 2. VisualRequirementEngine formatSmartBoardPayload caches output payloads
 * 3. SmartBoardVisualRenderer uses GPU-accelerated CSS animations instead of React setInterval loops
 * 4. ProjectileSimulationRenderer properly cleans up requestAnimationFrame on unmount
 * 5. BuddyScene properly manages and cancels requestAnimationFrame on unmount
 * 6. ClassroomLayout does not apply expensive full-viewport CSS filters (contrast/brightness)
 * 7. ClassroomLayout replaces 64px Gaussian blur-3xl spotlight with hardware-accelerated radial-gradient
 * 8. ClassroomLayout guards against duplicate /api/classroom/session creation via conceptId ref & AbortController
 * 9. Core classroom components (SmartBoard, SmartBoardVisualRenderer, BuddyTeacherStage, ClassroomXiraAssistant, ClassroomToolbar) are React.memo protected
 * 10. SmartBoard fallback payload and callback handlers are properly memoized
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('XPEDITION CLASSROOM PERFORMANCE REGRESSION SUITE');
console.log('====================================================\n');

let passedTests = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${err.message}`);
    process.exit(1);
  }
}

// 1. VisualRequirementEngine caching
test('1. VisualRequirementEngine caches visual requirements across identical stage requests', () => {
  const vrePath = path.join(__dirname, '../lib/visualIntelligence/VisualRequirementEngine.ts');
  const content = fs.readFileSync(vrePath, 'utf8');
  assert(content.includes('requirementCache = new Map'), 'VisualRequirementEngine must declare requirementCache');
  assert(content.includes('this.requirementCache.has(cacheKey)'), 'VisualRequirementEngine must check requirementCache before re-evaluating');
  assert(content.includes('this.requirementCache.set(cacheKey,'), 'VisualRequirementEngine must save to requirementCache');
});

// 2. formatSmartBoardPayload caching
test('2. formatSmartBoardPayload memoizes output contract payloads', () => {
  const vrePath = path.join(__dirname, '../lib/visualIntelligence/VisualRequirementEngine.ts');
  const content = fs.readFileSync(vrePath, 'utf8');
  assert(content.includes('payloadCache = new Map'), 'VisualRequirementEngine must declare payloadCache');
  assert(content.includes('this.payloadCache.has(payloadKey)'), 'formatSmartBoardPayload must check payloadCache');
  assert(content.includes('this.payloadCache.set(payloadKey,'), 'formatSmartBoardPayload must save to payloadCache');
});

// 3. DC Motor pure GPU animation without React setInterval loop
test('3. DCMotorScientificRenderer uses GPU keyframe animation instead of React setInterval re-render loops', () => {
  const sbPath = path.join(__dirname, '../components/classroom/SmartBoardVisualRenderer.tsx');
  const content = fs.readFileSync(sbPath, 'utf8');
  assert(!content.includes('setInterval(') || content.indexOf('setInterval(') === -1, 'DCMotor must not use setInterval for continuous rotation');
  assert(content.includes('@keyframes xpeditionCoilRock'), 'DCMotor must define hardware-accelerated CSS keyframes');
  assert(content.includes('willChange: isRotating ? \'transform\' : \'auto\'') || content.includes('willChange'), 'DCMotor must hint GPU layer compositor with willChange');
});

// 4. ProjectileSimulationRenderer RAF cleanup
test('4. ProjectileSimulationRenderer cleans up animation loops on unmount', () => {
  const sbPath = path.join(__dirname, '../components/classroom/SmartBoardVisualRenderer.tsx');
  const content = fs.readFileSync(sbPath, 'utf8');
  assert(content.includes('cancelAnimationFrame(animRef.current)'), 'ProjectileSimulationRenderer must cancel animation frame on unmount');
});

// 5. BuddyScene RAF cleanup and devicePixelRatio cap
test('5. BuddyScene caps devicePixelRatio and cleans up WebGL resources', () => {
  const buddyPath = path.join(__dirname, '../components/buddy/BuddyScene.tsx');
  const content = fs.readFileSync(buddyPath, 'utf8');
  assert(content.includes('Math.min(window.devicePixelRatio || 1, 2)'), 'BuddyScene must cap pixel ratio at 2 to prevent GPU thrashing');
  assert(content.includes('cancelAnimationFrame(animationFrameId)'), 'BuddyScene must cancel requestAnimationFrame on unmount');
  assert(content.includes('disposeThreeScene(scene, renderer)'), 'BuddyScene must dispose WebGL resources');
});

// 6. ClassroomLayout eliminates full-viewport CSS filters
test('6. ClassroomLayout eliminates full-viewport CSS filters on background image', () => {
  const layoutPath = path.join(__dirname, '../components/classroom/ClassroomLayout.tsx');
  const content = fs.readFileSync(layoutPath, 'utf8');
  assert(!content.includes('filter contrast-[1.03] brightness-[1.02]'), 'ClassroomLayout must remove full-viewport filter contrast/brightness');
});

// 7. ClassroomLayout replaces 64px Gaussian blur spotlight with hardware-accelerated radial gradient
test('7. ClassroomLayout replaces 64px Gaussian blur with hardware-accelerated radial-gradient', () => {
  const layoutPath = path.join(__dirname, '../components/classroom/ClassroomLayout.tsx');
  const content = fs.readFileSync(layoutPath, 'utf8');
  assert(!content.includes('w-[900px] h-[350px] bg-gradient-to-b from-sky-400/15 via-indigo-500/5 to-transparent blur-3xl'), 'ClassroomLayout must not use blur-3xl spotlight');
  assert(content.includes('radial-gradient('), 'ClassroomLayout must use radial-gradient spotlight');
});

// 8. ClassroomLayout deduplicates /api/classroom/session
test('8. ClassroomLayout guards against duplicate session creation and cancels in-flight requests on unmount', () => {
  const layoutPath = path.join(__dirname, '../components/classroom/ClassroomLayout.tsx');
  const content = fs.readFileSync(layoutPath, 'utf8');
  assert(content.includes('initializedConceptRef'), 'ClassroomLayout must track initializedConceptRef');
  assert(content.includes('controller.abort()'), 'ClassroomLayout must abort fetch on unmount');
});

// 9. Core classroom components wrapped in React.memo
test('9. Core classroom components and sub-renderers are React.memo protected', () => {
  const files = [
    'components/classroom/SmartBoard.tsx',
    'components/classroom/SmartBoardVisualRenderer.tsx',
    'components/classroom/BuddyTeacherStage.tsx',
    'components/classroom/ClassroomXiraAssistant.tsx',
    'components/classroom/ClassroomToolbar.tsx',
  ];
  for (const f of files) {
    const fullPath = path.join(__dirname, '..', f);
    const text = fs.readFileSync(fullPath, 'utf8');
    assert(text.includes('React.memo('), `${f} must be wrapped in React.memo`);
    assert(text.includes('.displayName ='), `${f} must have displayName configured`);
  }
});

// 10. SmartBoard fallback payload and callback handlers are properly memoized
test('10. SmartBoard memoizes fallback payload and handlers with useMemo and useCallback', () => {
  const sbPath = path.join(__dirname, '../components/classroom/SmartBoard.tsx');
  const content = fs.readFileSync(sbPath, 'utf8');
  assert(content.includes('fallbackPayload = React.useMemo') || content.includes('fallbackPayload = useMemo'), 'SmartBoard must memoize fallbackPayload');
  assert(content.includes('handleToggleRotation = useCallback('), 'SmartBoard must memoize handleToggleRotation');
  assert(content.includes('handleHotspotClick = useCallback('), 'SmartBoard must memoize handleHotspotClick');
});

console.log(`\n====================================================`);
console.log(`ALL ${passedTests} / 10 PERFORMANCE REGRESSION TESTS PASSED!`);
console.log(`====================================================\n`);
