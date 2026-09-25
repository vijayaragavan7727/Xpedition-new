// Comprehensive Production Verification Suite (Phases 23-26)
const BASE_URL = 'https://xpedition-new.vercel.app';

async function runVerification() {
  console.log('====================================================');
  console.log('XPEDITION PRODUCTION VERIFICATION SUITE');
  console.log(`Target: ${BASE_URL}`);
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message, details = '') {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message} ${details ? '- ' + details : ''}`);
      failed++;
    }
  }

  // 1. Health Endpoint
  console.log('\n--- 1. Health Endpoint Verification (Phase 23) ---');
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert(res.status === 200, `/api/health returns 200 OK (got ${res.status})`);
    
    // Security headers on health
    assert(res.headers.get('x-content-type-options') === 'nosniff', 'X-Content-Type-Options: nosniff present');
    assert(res.headers.has('strict-transport-security'), 'Strict-Transport-Security present');
    
    const body = await res.json();
    assert(body.status === 'healthy' || body.status === 'degraded', `Health status is healthy/degraded (got ${body.status})`);
    const svcs = body.services || body.checks;
    assert(svcs !== undefined, 'Health services/checks object present');
    assert(svcs.database !== undefined, 'Database check present');
    assert(svcs.cache !== undefined, 'Cache check present');
    assert(svcs.storage !== undefined, 'Storage check present');
    assert(svcs.visualEngine !== undefined, 'Visual engine check present');
    
    // Verify no secret leak
    const bodyStr = JSON.stringify(body);
    assert(!bodyStr.includes('service_role'), 'No service_role secret in health output');
    assert(!bodyStr.includes('supabase_key'), 'No Supabase key in health output');
    assert(!bodyStr.includes('localhost'), 'No internal localhost references in health response');
    console.log('  Health check body:', JSON.stringify(body, null, 2));
  } catch (err) {
    assert(false, '/api/health endpoint reachable', err.message);
  }

  // 2. Production Smoke Test: Pages (Phase 23)
  console.log('\n--- 2. Production Page Route Smoke Tests (Phase 23) ---');
  const pages = [
    { path: '/', expectedStatuses: [200, 307, 308] },
    { path: '/login', expectedStatuses: [200] },
    { path: '/home', expectedStatuses: [200, 307, 308] },
    { path: '/learn', expectedStatuses: [200, 307, 308] },
    { path: '/class', expectedStatuses: [200, 307, 308] }
  ];

  for (const page of pages) {
    try {
      const res = await fetch(`${BASE_URL}${page.path}`, { redirect: 'manual' });
      const statusOk = page.expectedStatuses.includes(res.status);
      assert(statusOk, `Route ${page.path} responded with valid status (${res.status})`);
      
      // Header inspection
      const xFrame = res.headers.get('x-frame-options');
      const csp = res.headers.get('content-security-policy');
      assert(xFrame === 'DENY' || xFrame === 'SAMEORIGIN' || (csp && csp.includes('frame-ancestors')), `Route ${page.path} has frame protection`);
    } catch (err) {
      assert(false, `Route ${page.path} request succeeded`, err.message);
    }
  }

  // 3. Production Auth & Authorization (Phase 24)
  console.log('\n--- 3. Production Auth Denial on Protected Endpoints (Phase 24) ---');
  const protectedEndpoints = [
    { method: 'POST', path: '/api/classroom/session', body: { conceptId: 'c1' } },
    { method: 'POST', path: '/api/visual-generation', body: { conceptId: 'c1', prompt: 'test' } },
    { method: 'POST', path: '/api/visual-intelligence', body: { conceptId: 'c1', stage: 'INTRODUCE' } },
    { method: 'POST', path: '/api/chat', body: { message: 'hello' } }
  ];

  for (const ep of protectedEndpoints) {
    try {
      const res = await fetch(`${BASE_URL}${ep.path}`, {
        method: ep.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ep.body)
      });
      // Unauthenticated access must be rejected with 401 or 403 or redirect
      const isDenied = res.status === 401 || res.status === 403;
      assert(isDenied, `Unauthenticated request to ${ep.path} denied (got HTTP ${res.status})`);
      
      const resText = await res.text();
      assert(!resText.includes('stack'), `${ep.path} error does not leak stack trace`);
      assert(!resText.includes('SELECT'), `${ep.path} error does not leak SQL`);
    } catch (err) {
      assert(false, `Protected endpoint ${ep.path} tested`, err.message);
    }
  }

  // 4. Malformed Input & Security Validation (Phase 24)
  console.log('\n--- 4. Malformed / Oversized / Attack Payload Tests (Phase 24) ---');
  try {
    // Malformed JSON
    const resMalformed = await fetch(`${BASE_URL}/api/visual-generation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ not valid json '
    });
    assert(resMalformed.status === 400 || resMalformed.status === 401, `Malformed JSON rejected with 400/401 (got ${resMalformed.status})`);
  } catch (err) {
    assert(false, 'Malformed JSON test', err.message);
  }

  try {
    // SQL injection pattern in parameter
    const resSql = await fetch(`${BASE_URL}/api/classroom/session?id=1'%20OR%20'1'='1`, {
      method: 'GET'
    });
    assert(resSql.status === 401 || resSql.status === 400 || resSql.status === 404 || resSql.status === 405, `SQL injection in query rejected/safe (got ${resSql.status})`);
  } catch (err) {
    assert(false, 'SQL injection probe test', err.message);
  }

  // 5. Classroom & Visual Assets Verification (Phases 25-26)
  console.log('\n--- 5. Visual Asset Delivery Verification (Phases 25-26) ---');
  try {
    // Check manifest accessibility
    const manifestRes = await fetch(`${BASE_URL}/generated-visuals/assets-manifest.json`);
    assert(manifestRes.status === 200, `Visual assets manifest is accessible at /generated-visuals/assets-manifest.json (got ${manifestRes.status})`);
    if (manifestRes.status === 200) {
      const manifest = await manifestRes.json();
      const assetsList = Array.isArray(manifest) ? manifest : (manifest.assets || []);
      assert(assetsList.length > 0, `Manifest contains valid assets list (found ${assetsList.length} assets)`);
      
      // Test one static visual asset delivery
      if (assetsList.length > 0) {
        const testAsset = assetsList.find(a => a.conceptId === 'dc_motor') || assetsList[0];
        const assetUrl = `${BASE_URL}${testAsset.publicUrl}`;
        const assetRes = await fetch(assetUrl);
        assert(assetRes.status === 200, `Cached visual asset ${testAsset.publicUrl} delivers 200 OK`);
        assert(assetRes.headers.get('content-type')?.includes('image'), `Asset content-type is image (got ${assetRes.headers.get('content-type')})`);
      }
    }
  } catch (err) {
    assert(false, 'Visual asset delivery test', err.message);
  }

  // Summary
  console.log('\n====================================================');
  console.log(`PRODUCTION VERIFICATION COMPLETE: ${passed} passed, ${failed} failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runVerification();
