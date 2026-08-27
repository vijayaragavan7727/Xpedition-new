const https = require('https');

async function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({ status: res.statusCode });
    }).on('error', (err) => resolve({ error: err.message }));
  });
}

async function run() {
  const homeRes = await checkUrl('https://xpedition-new.vercel.app/');
  const tutorRes = await checkUrl('https://xpedition-new.vercel.app/tutor/c_1');
  console.log(`Production URL https://xpedition-new.vercel.app/ status: ${homeRes.status}`);
  console.log(`Production URL https://xpedition-new.vercel.app/tutor/c_1 status: ${tutorRes.status}`);
}

run();
