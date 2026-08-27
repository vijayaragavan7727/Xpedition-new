const http = require('http');

async function postJson(path, payload) {
  return new Promise((resolve) => {
    const data = JSON.stringify(payload);
    const req = http.request(`http://localhost:3002${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', (err) => resolve({ error: err.message }));
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log("--- Testing AI Goal Generation for 'human anatomy' ---");
  const goalRes = await postJson('/api/goal', { goal: "human anatomy" });
  console.log("Goal API status:", goalRes.status);
  try {
    const parsed = JSON.parse(goalRes.body);
    console.log("Concepts count:", parsed.concepts ? parsed.concepts.length : 0);
    if (parsed.concepts) {
      console.log("Concept names:", parsed.concepts.map(c => c.name));
    }
  } catch (e) {
    console.log("Raw response:", goalRes.body.substring(0, 300));
  }
}

run();
