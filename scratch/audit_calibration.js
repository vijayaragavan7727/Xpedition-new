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
  console.log("--- Testing Calibration Generation for Human Anatomy ---");
  const res = await postJson('/api/plan', {
    pathType: 'goal',
    topic: 'human anatomy',
    language: 'english',
    dailyMinutes: 60,
    startingLevel: 'Complete beginner'
  });

  console.log("Plan API status:", res.status);
  try {
    const parsed = JSON.parse(res.body);
    console.log("Topics count:", parsed.topics ? parsed.topics.length : 0);
    if (parsed.topics) {
      console.log("Topics:", parsed.topics.map(t => t.title));
    }
  } catch (e) {
    console.log("Raw response:", res.body.substring(0, 300));
  }
}

run();
