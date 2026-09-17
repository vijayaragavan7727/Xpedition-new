const http = require('http');

const routes = [
  { path: '/', expected: [200, 307, 308] },
  { path: '/login', expected: [200] },
  { path: '/privacy', expected: [200] },
  { path: '/terms', expected: [200] },
  { path: '/ai-transparency', expected: [200] },
  { path: '/disclaimer', expected: [200] },
  { path: '/sources', expected: [200] },
  { path: '/trust', expected: [200] },
  { path: '/teach', expected: [200] },
  { path: '/learn', expected: [200] },
  { path: '/world', expected: [200] },
  { path: '/home', expected: [200, 307, 308] },
  { path: '/quest', expected: [200, 307, 308] },
  { path: '/experience/projectile', expected: [200] },
  { path: '/experience/object', expected: [200] },
  { path: '/experience/molecule', expected: [200] },
  { path: '/experience/heart', expected: [200] },
  { path: '/experience/code', expected: [200] },
  { path: '/api/user/state', expected: [401], method: 'GET' },
  { path: '/api/user/attempt', expected: [401], method: 'POST' },
  { path: '/api/user/memory', expected: [401], method: 'GET' },
  { path: '/api/user/export', expected: [401], method: 'GET' },
  { path: '/api/user/delete', expected: [401], method: 'POST' },
];

async function checkRoute(route) {
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path: route.path,
        method: route.method || 'GET',
        headers: { 'User-Agent': 'Xpedition-Route-Verifier' },
      },
      (res) => {
        const isOk = route.expected.includes(res.statusCode);
        console.log(`  ${isOk ? '✓' : '✗'} ${route.path} -> HTTP ${res.statusCode} (Expected: ${route.expected.join(', ')})`);
        resolve({ path: route.path, status: res.statusCode, ok: isOk });
      }
    );

    req.on('error', (err) => {
      console.error(`  ✗ ${route.path} -> Error: ${err.message}`);
      resolve({ path: route.path, status: 0, ok: false, error: err.message });
    });

    req.end();
  });
}

async function run() {
  console.log('Testing live production server routes at http://localhost:3000...\n');
  let allOk = true;
  for (const r of routes) {
    const result = await checkRoute(r);
    if (!result.ok) allOk = false;
  }

  console.log('\nResult:', allOk ? 'ALL 23 LIVE ROUTES VERIFIED SUCCESSFULLY' : 'SOME ROUTES FAILED');
  process.exit(allOk ? 0 : 1);
}

run();
