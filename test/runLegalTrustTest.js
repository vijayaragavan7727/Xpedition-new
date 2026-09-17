const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const testDistDir = path.join(rootDir, '.test-dist-experience');
if (fs.existsSync(testDistDir)) {
  fs.rmSync(testDistDir, { recursive: true, force: true });
}

console.log('Compiling Phase E Legal & Trust test suite with tsc -p tsconfig.experience.json...');
try {
  execSync('npx tsc -p tsconfig.experience.json', { stdio: 'inherit', cwd: rootDir });
} catch (e) {
  console.error('Failed to compile test files:', e.message);
  process.exit(1);
}

const compiledTest = path.join(testDistDir, 'test', 'legalTrust.test.js');
console.log('Running compiled Legal & Trust test suite at ' + compiledTest + '...\n');

async function main() {
  try {
    const { runLegalTrustTests } = require(compiledTest);
    const { passed, failed } = await runLegalTrustTests();

    console.log(`\n======================================================`);
    console.log(`PHASE E LEGAL & TRUST SUMMARY: ${passed} passed, ${failed} failed`);
    console.log(`======================================================\n`);

    console.log('Cleaning up .test-dist-experience directory...');
    fs.rmSync(testDistDir, { recursive: true, force: true });

    if (failed > 0) {
      process.exit(1);
    }
    process.exit(0);
  } catch (err) {
    console.error('Error executing compiled legal & trust tests:', err);
    try {
      fs.rmSync(testDistDir, { recursive: true, force: true });
    } catch {}
    process.exit(1);
  }
}

main();
