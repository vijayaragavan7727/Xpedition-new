const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const testDistDir = path.join(rootDir, '.test-dist');
if (fs.existsSync(testDistDir)) {
  fs.rmSync(testDistDir, { recursive: true, force: true });
}

console.log('Compiling test suite with tsc -p tsconfig.test.json...');
try {
  execSync('npx tsc -p tsconfig.test.json', { stdio: 'inherit', cwd: rootDir });
} catch (e) {
  console.error('Failed to compile test files:', e.message);
  process.exit(1);
}

const compiledTest = path.join(testDistDir, 'test', 'intelligence.test.js');
console.log('Running compiled test suite at ' + compiledTest + '...');

try {
  const { runAllTests } = require(compiledTest);
  runAllTests()
    .then(() => {
      console.log('Cleaning up .test-dist directory...');
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
