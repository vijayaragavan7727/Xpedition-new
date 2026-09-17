const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const testDistDir = path.join(rootDir, '.test-dist-experience');
if (fs.existsSync(testDistDir)) {
  fs.rmSync(testDistDir, { recursive: true, force: true });
}

console.log('Compiling Source Intelligence test suite with tsc -p tsconfig.experience.json...');
try {
  execSync('npx tsc -p tsconfig.experience.json', { stdio: 'inherit', cwd: rootDir });
} catch (e) {
  console.error('Failed to compile test files:', e.message);
  process.exit(1);
}

const compiledTest = path.join(testDistDir, 'test', 'sourceIntelligence.test.js');
console.log('Running compiled Source Intelligence test suite at ' + compiledTest + '...\n');

try {
  const { runSourceIntelligenceTests } = require(compiledTest);
  const { passed, failed } = runSourceIntelligenceTests();

  console.log('Cleaning up .test-dist-experience directory...');
  fs.rmSync(testDistDir, { recursive: true, force: true });

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
} catch (err) {
  console.error('Error executing compiled source intelligence tests:', err);
  process.exit(1);
}
