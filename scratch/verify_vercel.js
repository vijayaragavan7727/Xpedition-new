const https = require('https');

async function checkAsset(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({ status: res.statusCode, headers: res.headers });
    }).on('error', (err) => resolve({ error: err.message }));
  });
}

async function run() {
  console.log("Checking Vercel production assets...");
  for (let i = 0; i < 10; i++) {
    const res1 = await checkAsset('https://xpedition-new.vercel.app/robot.png');
    const res2 = await checkAsset('https://xpedition-new.vercel.app/blackboard.jpg');
    console.log(`Attempt ${i + 1}: robot.png status = ${res1.status}, blackboard.jpg status = ${res2.status}`);
    if (res1.status === 200 && res2.status === 200) {
      console.log("SUCCESS! Assets are live on Vercel!");
      break;
    }
    await new Promise(r => setTimeout(r, 6000));
  }
}

run();
