// Script to poll production /api/health and report headers and body
async function check() {
  const url = 'https://xpedition-new.vercel.app/api/health';
  console.log(`Checking ${url}...`);
  try {
    const res = await fetch(url);
    console.log(`Status: ${res.status}`);
    console.log(`Vercel ID: ${res.headers.get('x-vercel-id')}`);
    console.log(`Matched Path: ${res.headers.get('x-matched-path')}`);
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      console.log('JSON Response:', JSON.stringify(json, null, 2));
      return { ok: true, status: res.status, json };
    } catch {
      console.log('Text Response (first 200 chars):', text.slice(0, 200));
      return { ok: false, status: res.status, text };
    }
  } catch (err) {
    console.error('Fetch error:', err.message);
    return { ok: false, error: err.message };
  }
}

async function loop() {
  for (let i = 0; i < 12; i++) {
    const res = await check();
    if (res.ok && res.status === 200) {
      console.log('Production /api/health is LIVE and returned 200 OK!');
      process.exit(0);
    }
    console.log(`Attempt ${i + 1}/12: Waiting 15s for deployment build to finish...`);
    await new Promise(r => setTimeout(r, 15000));
  }
  console.log('Timed out waiting for production 200 OK.');
  process.exit(1);
}

loop();
