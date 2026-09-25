import fs from 'fs';
import path from 'path';
import { visualGenerationEngine, LocalAssetStore } from '../lib/visualGeneration';

async function main() {
  console.log('===========================================================');
  console.log('XPEDITION PHASE 2 REAL INTEGRATION TEST: COMFYUI + CACHE');
  console.log('===========================================================\n');

  console.log('1. Checking ComfyUI Engine Connectivity...');
  const isHealthy = await visualGenerationEngine.isEngineHealthy();
  console.log('   Engine Connectivity Status:', isHealthy ? 'ONLINE (200 OK)' : 'OFFLINE');

  if (!isHealthy) {
    console.error('ERROR: Local ComfyUI is not reachable on http://127.0.0.1:8188');
    process.exit(1);
  }

  const dcMotorRequest = {
    conceptId: 'dc_motor',
    subject: 'physics',
    visualType: 'educational_illustration' as const,
    prompt:
      'educational textbook diagram of a DC electric motor with armature coil, permanent magnet north and south poles, split ring commutator, and carbon brushes, clear lines, high educational clarity',
    negativePrompt:
      'blurry, distorted, low quality, photorealistic photograph, messy, illegible text, dark shadows',
    width: 512,
    height: 512,
    steps: 12,
    cachePolicy: 'reuse' as const,
  };

  console.log('\n2. Executing Request 1 (Initial Generation / Manifest Resolution)...');
  const start1 = Date.now();
  const job1 = await visualGenerationEngine.generateVisual(dcMotorRequest);
  const time1 = Date.now() - start1;

  console.log(`   Job 1 Result:`);
  console.log('   - Job ID:', job1.jobId);
  console.log('   - Status:', job1.status);
  console.log('   - Reused from Cache:', job1.reused ? 'YES' : 'NO (Freshly generated)');
  console.log('   - Asset ID:', job1.asset?.assetId || job1.outputAssetId);
  console.log('   - Public URL:', job1.asset?.publicUrl || job1.output?.url);
  console.log('   - Response Latency:', `${time1} ms`);
  console.log('   - Execution Time in Engine:', `${job1.metadata?.executionTimeMs} ms`);

  // Verify physical asset on disk
  const diskPath = path.join(process.cwd(), 'public', job1.asset ? job1.asset.publicUrl.replace(/^\//, '') : job1.output!.url.replace(/^\//, ''));
  if (!fs.existsSync(diskPath)) {
    console.error(`ERROR: Physical image file does not exist on disk at ${diskPath}`);
    process.exit(1);
  }
  const fileStat = fs.statSync(diskPath);
  console.log(`   - Verified Physical Asset: ${diskPath} (${(fileStat.size / 1024).toFixed(1)} KB)`);

  console.log('\n3. Executing Request 2 (Identical Request -> Cache Reuse Verification)...');
  const start2 = Date.now();
  const job2 = await visualGenerationEngine.generateVisual(dcMotorRequest);
  const time2 = Date.now() - start2;

  console.log(`   Job 2 Result:`);
  console.log('   - Job ID:', job2.jobId);
  console.log('   - Status:', job2.status);
  console.log('   - Reused from Cache:', job2.reused ? 'YES (VERIFIED)' : 'NO (FAILED)');
  console.log('   - Asset ID:', job2.asset?.assetId);
  console.log('   - Public URL:', job2.asset?.publicUrl);
  console.log('   - Response Latency:', `${time2} ms (Instant retrieval without re-diffusion)`);
  console.log('   - Execution Time in Engine:', `${job2.metadata?.executionTimeMs} ms`);

  if (!job2.reused) {
    console.error('ERROR: Request 2 was expected to be reused from cache, but triggered a new generation!');
    process.exit(1);
  }

  if (job1.asset && job2.asset && job1.asset.assetId !== job2.asset.assetId) {
    console.error('ERROR: Asset IDs between Job 1 and Job 2 do not match!');
    process.exit(1);
  }

  console.log('\n4. Executing Step 15 Asset Resolver API...');
  const resolvedAsset = await visualGenerationEngine.resolveExistingAsset({
    conceptId: 'dc_motor',
    visualType: 'educational_illustration',
  });

  if (!resolvedAsset) {
    console.error('ERROR: Asset Resolver failed to resolve existing ready asset for dc_motor');
    process.exit(1);
  }
  console.log('   - Resolved Asset ID:', resolvedAsset.assetId);
  console.log('   - Resolved Public URL:', resolvedAsset.publicUrl);
  console.log('   - Model Provenance:', resolvedAsset.provenance.model);

  console.log('\n5. Verifying Client Sanitization...');
  const sanitized = LocalAssetStore.sanitizeForClient(resolvedAsset);
  if ('filePath' in sanitized) {
    console.error('ERROR: Sensitive server filePath was leaked in sanitized asset!');
    process.exit(1);
  }
  console.log('   - Internal filePath successfully stripped from client contract.');

  console.log('\n===========================================================');
  console.log('PHASE 2 REAL INTEGRATION & CACHE REUSE VERIFICATION PASSED!');
  console.log('===========================================================\n');
}

main().catch((err) => {
  console.error('Fatal error during integration test:', err);
  process.exit(1);
});
