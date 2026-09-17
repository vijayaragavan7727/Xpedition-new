const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const testDistDir = path.join(rootDir, '.test-dist-experience');
if (fs.existsSync(testDistDir)) {
  fs.rmSync(testDistDir, { recursive: true, force: true });
}

console.log('Compiling 3D Heart Anatomy Explorer test suite with tsc -p tsconfig.experience.json...');
try {
  execSync('npx tsc -p tsconfig.experience.json', { stdio: 'inherit', cwd: rootDir });
} catch (e) {
  console.error('Failed to compile test files:', e.message);
  process.exit(1);
}

const compiledTest = path.join(testDistDir, 'test', 'heartAnatomyExperience.test.js');
console.log('Running compiled test suite at ' + compiledTest + '...\n');

try {
  const { runHeartAnatomyExperienceTests } = require(compiledTest);
  runHeartAnatomyExperienceTests()
    .then(() => {
      console.log('Cleaning up .test-dist-experience directory...');
      fs.rmSync(testDistDir, { recursive: true, force: true });
      process.exit(0);
    })
    .catch((err) => {
      console.error('Test execution failed:', err);
      process.exit(1);
    });
} catch (err) {
  console.error('Error importing compiled tests:', err);
  process.exit(1);
}
