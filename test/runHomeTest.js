const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const testDistDir = path.join(rootDir, '.test-dist-experience');
if (fs.existsSync(testDistDir)) {
  fs.rmSync(testDistDir, { recursive: true, force: true });
}

console.log('Compiling Home test suite with tsc -p tsconfig.experience.json...');
try {
  execSync('npx tsc -p tsconfig.experience.json', { stdio: 'inherit', cwd: rootDir });
} catch (e) {
  console.error('Failed to compile test files:', e.message);
  process.exit(1);
}

const compiledTest = path.join(testDistDir, 'test', 'home.test.js');
console.log('Running compiled Home test suite at ' + compiledTest + '...\n');

try {
  const { runHomeTests } = require(compiledTest);
  const { passed, failed } = runHomeTests();

  console.log('Cleaning up .test-dist-experience directory...');
  fs.rmSync(testDistDir, { recursive: true, force: true });

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
} catch (err) {
  console.error('Error executing compiled home tests:', err);
  process.exit(1);
}
