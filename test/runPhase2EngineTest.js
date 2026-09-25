const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const rootDir = path.resolve(__dirname, '..');

let totalPassed = 0;
let totalFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    totalPassed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    totalFailed++;
  }
}

async function runPhase2EngineTests() {
  console.log('===========================================================');
  console.log('XPEDITION PHASE 2: PRODUCTION VISUAL GENERATION ENGINE');
  console.log('===========================================================\n');

  // Dynamically load compiled/source modules using tsx if needed or direct require of built files
  const {
    WorkflowRegistry,
    LocalAssetStore,
    MemoryJobStore,
    VisualGenerationEngine,
    hashPrompt,
    generateCacheKey,
    buildCacheKeyFromRequest,
    normalizePrompt,
    InvalidVisualRequestError,
    WorkflowNotFoundError,
    InvalidAssetError,
  } = require('../lib/visualGeneration');

  // ---------------------------------------------------------------------------
  // TEST MATRIX A: Request Validation
  // ---------------------------------------------------------------------------
  console.log('A. Testing Request Validation');
  const engine = new VisualGenerationEngine({ mockMode: true });

  // Valid request
  let errorCaught = null;
  try {
    engine.validateRequest({
      conceptId: 'dc_motor',
      prompt: 'schematic diagram of armature and commutator',
    });
  } catch (err) {
    errorCaught = err;
  }
  assert(!errorCaught, 'Valid minimal request passes validation');

  // Missing conceptId
  errorCaught = null;
  try {
    engine.validateRequest({
      conceptId: '',
      prompt: 'schematic diagram',
    });
  } catch (err) {
    errorCaught = err;
  }
  assert(errorCaught instanceof InvalidVisualRequestError, 'Missing conceptId is rejected');

  // Missing prompt
  errorCaught = null;
  try {
    engine.validateRequest({
      conceptId: 'dc_motor',
      prompt: '   ',
    });
  } catch (err) {
    errorCaught = err;
  }
  assert(errorCaught instanceof InvalidVisualRequestError, 'Empty prompt is rejected');

  // Invalid visualType
  errorCaught = null;
  try {
    engine.validateRequest({
      conceptId: 'dc_motor',
      prompt: 'schematic diagram',
      visualType: 'unsupported_cartoon_type',
    });
  } catch (err) {
    errorCaught = err;
  }
  assert(errorCaught instanceof InvalidVisualRequestError, 'Unsupported visualType is rejected');

  // Oversized prompt (> 2000 chars)
  errorCaught = null;
  try {
    engine.validateRequest({
      conceptId: 'dc_motor',
      prompt: 'a'.repeat(2001),
    });
  } catch (err) {
    errorCaught = err;
  }
  assert(errorCaught instanceof InvalidVisualRequestError, 'Oversized prompt (>2000 chars) is rejected');

  // ---------------------------------------------------------------------------
  // TEST MATRIX B: Workflow Registry
  // ---------------------------------------------------------------------------
  console.log('\nB. Testing Workflow Registry');
  const registry = WorkflowRegistry.getInstance();

  // Valid workflow resolves
  const wf = registry.resolve('educational_illustration');
  assert(Boolean(wf), 'Resolves "educational_illustration" workflow');
  assert(wf.workflowId === 'educational_illustration', 'Workflow ID matches');
  assert(wf.modelFamily === 'Stable Diffusion 1.5', 'Model family is declared');
  assert(wf.targetModel === 'v1-5-pruned-emaonly.safetensors', 'Target model matches');
  assert(wf.license.includes('Open RAIL-M'), 'Commercial license is recorded');

  // Alias resolution
  const wfAlias = registry.resolve('educational-illustration');
  assert(wfAlias.workflowId === 'educational_illustration', 'Resolves hyphenated alias');

  // Invalid workflow rejected
  errorCaught = null;
  try {
    registry.resolve('arbitrary_malicious_workflow_hack');
  } catch (err) {
    errorCaught = err;
  }
  assert(errorCaught instanceof WorkflowNotFoundError, 'Arbitrary/unknown workflow is safely rejected');

  // Dimension validation against workflow limits
  const validDims = registry.validateDimensions(wf, 512, 512);
  assert(validDims.width === 512 && validDims.height === 512, 'Valid dimensions accepted');

  errorCaught = null;
  try {
    registry.validateDimensions(wf, 100, 100);
  } catch (err) {
    errorCaught = err;
  }
  assert(errorCaught instanceof InvalidVisualRequestError, 'Dimensions below minimum (256) are rejected');

  errorCaught = null;
  try {
    registry.validateDimensions(wf, 500, 500); // not divisible by 64
  } catch (err) {
    errorCaught = err;
  }
  assert(errorCaught instanceof InvalidVisualRequestError, 'Dimensions not divisible by 64 are rejected');

  // ---------------------------------------------------------------------------
  // TEST MATRIX C: Prompt Hashing & Deterministic Cache Keys
  // ---------------------------------------------------------------------------
  console.log('\nC. Testing Cache Identity & Prompt Hashing');

  const p1 = 'DC Electric Motor with armature coil';
  const p2 = '  dc electric motor   with   armature coil  '; // Case & space variation
  assert(normalizePrompt(p1) === normalizePrompt(p2), 'Prompt normalization handles case and whitespace');
  assert(hashPrompt(p1) === hashPrompt(p2), 'Normalized prompts yield identical SHA-256 hash');

  const reqA = { conceptId: 'dc_motor', prompt: p1, width: 512, height: 512, requestId: 'req_111' };
  const reqB = { conceptId: 'dc_motor', prompt: p2, width: 512, height: 512, requestId: 'req_999' }; // Different requestId
  const keyInfoA = buildCacheKeyFromRequest(reqA, { workflowId: 'wf1', version: '1.0', model: 'm1' });
  const keyInfoB = buildCacheKeyFromRequest(reqB, { workflowId: 'wf1', version: '1.0', model: 'm1' });
  assert(keyInfoA.cacheKey === keyInfoB.cacheKey, 'Equivalent requests with different requestIds produce exact same cacheKey');
  assert(!keyInfoA.cacheKey.includes('req_111'), 'CacheKey strictly excludes ephemeral requestId');

  // ---------------------------------------------------------------------------
  // TEST MATRIX D: Jobs & Job Store Concurrency
  // ---------------------------------------------------------------------------
  console.log('\nD. Testing Generation Jobs & Concurrency Safety');
  const jobStore = new MemoryJobStore();

  const testJob = {
    jobId: 'job_test_001',
    requestId: 'req_test_001',
    conceptId: 'dc_motor',
    workflowId: 'educational_illustration',
    status: 'queued',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    cacheKey: 'c:dc_motor::vt:educational_illustration',
    retryCount: 0,
    maxRetries: 1,
    request: reqA,
  };

  await jobStore.createJob(testJob);
  const fetchedJob = await jobStore.getJob('job_test_001');
  assert(fetchedJob !== null && fetchedJob.jobId === 'job_test_001', 'Job created and retrieved by jobId');

  const byReq = await jobStore.findByRequestId('req_test_001');
  assert(byReq !== null && byReq.jobId === 'job_test_001', 'Job retrieved by requestId');

  // Active in-flight detection
  const activeJob = await jobStore.findActiveByCacheKey('c:dc_motor::vt:educational_illustration');
  assert(activeJob !== null && activeJob.status === 'queued', 'Active job correctly indexed by cacheKey');

  // Update status to completed -> should no longer be active in activeIndex
  await jobStore.updateJob('job_test_001', { status: 'completed' });
  const activeAfterComplete = await jobStore.findActiveByCacheKey('c:dc_motor::vt:educational_illustration');
  assert(activeAfterComplete === null, 'Completed job is automatically retired from active index');

  // ---------------------------------------------------------------------------
  // TEST MATRIX E: Asset Store & Output Validation
  // ---------------------------------------------------------------------------
  console.log('\nE. Testing Asset Store & Output Validation');
  const testStorageDir = path.join(rootDir, 'public', 'generated-visuals');
  const assetStore = new LocalAssetStore(testStorageDir);

  // Buffer validation: Empty buffer
  errorCaught = null;
  try {
    assetStore.validateImageBuffer(Buffer.alloc(0));
  } catch (err) {
    errorCaught = err;
  }
  assert(errorCaught instanceof InvalidAssetError, 'Empty buffer rejected with InvalidAssetError');

  // Buffer validation: Corrupt non-image header
  errorCaught = null;
  try {
    assetStore.validateImageBuffer(Buffer.from('THIS IS NOT A VALID PNG OR JPEG IMAGE BUFFER'));
  } catch (err) {
    errorCaught = err;
  }
  assert(errorCaught instanceof InvalidAssetError, 'Corrupt non-image buffer rejected with InvalidAssetError');

  // Valid 1x1 PNG buffer
  const validPngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  const validatedHeader = assetStore.validateImageBuffer(validPngBuffer);
  assert(validatedHeader.mimeType === 'image/png', 'Valid PNG magic bytes detected as image/png');

  // Save asset
  const savedAsset = await assetStore.saveAsset({
    conceptId: 'dc_motor',
    visualType: 'educational_illustration',
    workflowId: 'educational_illustration',
    workflowVersion: '1.0.0',
    modelFamily: 'Stable Diffusion 1.5',
    model: 'v1-5-pruned-emaonly.safetensors',
    modelLicense: 'CreativeML Open RAIL-M',
    prompt: 'DC motor schematic test',
    promptHash: hashPrompt('DC motor schematic test'),
    cacheKey: 'test_cache_key_unique_123',
    width: 512,
    height: 512,
    seed: 42,
    imageBuffer: validPngBuffer,
  });

  assert(Boolean(savedAsset.assetId), `Asset saved with stable ID: ${savedAsset.assetId}`);
  assert(savedAsset.publicUrl.startsWith('/generated-visuals/'), 'Asset public URL is properly prefixed');
  assert(savedAsset.status === 'ready', 'Asset status is ready');

  // Duplicate cache write protection
  const duplicateSave = await assetStore.saveAsset({
    conceptId: 'dc_motor',
    visualType: 'educational_illustration',
    workflowId: 'educational_illustration',
    workflowVersion: '1.0.0',
    modelFamily: 'Stable Diffusion 1.5',
    model: 'v1-5-pruned-emaonly.safetensors',
    modelLicense: 'CreativeML Open RAIL-M',
    prompt: 'DC motor schematic test',
    promptHash: hashPrompt('DC motor schematic test'),
    cacheKey: 'test_cache_key_unique_123', // identical cacheKey
    width: 512,
    height: 512,
    seed: 42,
    imageBuffer: validPngBuffer,
  });
  assert(duplicateSave.assetId === savedAsset.assetId, 'Identical cacheKey reuses existing asset ID without duplicating writes');

  // Client sanitization: filePath must be stripped
  const sanitized = LocalAssetStore.sanitizeForClient(savedAsset);
  assert(!('filePath' in sanitized), 'sanitizeForClient strictly removes internal server filePath');
  assert('publicUrl' in sanitized, 'sanitizeForClient retains publicUrl');

  // ---------------------------------------------------------------------------
  // TEST MATRIX F: Engine End-to-End Cache Lifecycle (reuse, refresh, force)
  // ---------------------------------------------------------------------------
  console.log('\nF. Testing Engine Cache Lifecycle (reuse, refresh, force)');
  const testEngine = new VisualGenerationEngine({
    mockMode: true,
    assetStore,
  });

  const uniqueConcept = `test_concept_${Date.now()}`;
  const promptText = 'magnetic lines of flux around armature';

  // 1. Initial generation (cache miss -> generated)
  const job1 = await testEngine.generateVisual({
    conceptId: uniqueConcept,
    prompt: promptText,
    cachePolicy: 'reuse',
  });
  assert(job1.status === 'completed', 'First generation completed successfully');
  assert(job1.reused === false, 'First generation marked as fresh (reused: false)');
  assert(Boolean(job1.asset), 'First generation returned asset');

  // 2. Second generation (cache hit -> reused without generation)
  const job2 = await testEngine.generateVisual({
    conceptId: uniqueConcept,
    prompt: promptText,
    cachePolicy: 'reuse',
  });
  assert(job2.status === 'completed', 'Second generation completed successfully');
  assert(job2.reused === true, 'Second generation returned existing asset with reused: true');
  assert(job2.asset.assetId === job1.asset.assetId, 'Reused asset matches original assetId');
  assert(job2.metadata.executionTimeMs === 0, 'Reused asset execution latency is 0ms');

  // 3. Refresh policy (bypasses cache)
  const job3 = await testEngine.generateVisual({
    conceptId: uniqueConcept,
    prompt: promptText,
    cachePolicy: 'refresh',
  });
  assert(job3.status === 'completed', 'Refresh policy completed');
  assert(job3.reused === false, 'Refresh policy forced generation (reused: false)');

  // 4. Step 15 Asset Resolver API
  const resolved = await testEngine.resolveExistingAsset({
    conceptId: uniqueConcept,
    visualType: 'educational_illustration',
  });
  assert(resolved !== null, 'resolveExistingAsset successfully finds existing ready asset');
  assert(resolved.conceptId === uniqueConcept, 'Resolved asset conceptId matches');

  // ---------------------------------------------------------------------------
  // TEST MATRIX G: API Routes & Security Inspection
  // ---------------------------------------------------------------------------
  console.log('\nG. Testing API Routes Security Invariants');

  const routeContent = fs.readFileSync(path.join(rootDir, 'app', 'api', 'visual-generation', 'route.ts'), 'utf8');
  assert(routeContent.includes('requireServerAuth'), 'POST /api/visual-generation requires server authentication');
  assert(routeContent.includes('LocalAssetStore.sanitizeForClient'), 'API route sanitizes asset before returning');
  assert(!routeContent.includes('8188'), 'API route does not contain hardcoded ComfyUI port');

  const dynamicJobRoute = path.join(rootDir, 'app', 'api', 'visual-generation', '[jobId]', 'route.ts');
  assert(fs.existsSync(dynamicJobRoute), 'GET /api/visual-generation/[jobId] route exists');
  const jobRouteContent = fs.readFileSync(dynamicJobRoute, 'utf8');
  assert(jobRouteContent.includes('requireServerAuth'), 'GET /api/visual-generation/[jobId] requires authentication');
  assert(!jobRouteContent.includes('filePath'), 'GET /api/visual-generation/[jobId] never returns server filePath');

  console.log('\n===========================================================');
  console.log(`PHASE 2 ENGINE TEST SUMMARY: ${totalPassed} passed, ${totalFailed} failed`);
  console.log('===========================================================\n');

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runPhase2EngineTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
