const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const testDistDir = path.join(rootDir, '.test-dist-experience');
if (fs.existsSync(testDistDir)) {
  fs.rmSync(testDistDir, { recursive: true, force: true });
}

console.log('Compiling Universal Teaching Engine test suite with tsc -p tsconfig.experience.json...');
try {
  execSync('npx tsc -p tsconfig.experience.json', { stdio: 'inherit', cwd: rootDir });
} catch (e) {
  console.error('Failed to compile test files:', e.message);
  process.exit(1);
}

const compiledTest = path.join(testDistDir, 'test', 'universalTeaching.test.js');
console.log('Running compiled Universal Teaching test suite at ' + compiledTest + '...\n');

try {
  const { runUniversalTeachingTests } = require(compiledTest);
  const { passed, failed } = runUniversalTeachingTests();

  console.log('Cleaning up .test-dist-experience directory...');
  fs.rmSync(testDistDir, { recursive: true, force: true });

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
} catch (err) {
  console.error('Error executing compiled universal teaching tests:', err);
  process.exit(1);
}
