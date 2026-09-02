const fs = require('fs');
const { PNG } = require('pngjs');

const data = fs.readFileSync('public/world/xpedition-world-assets.png');
const png = PNG.sync.read(data);

console.log(`Image Size: ${png.width} x ${png.height}`);

// Grid coordinates for 1536 x 1024 asset sheet (approx 4x3 or 6x4 layout)
// Let's sample key regions
const cols = 4;
const rows = 3;
const cellW = Math.floor(png.width / cols);
const cellH = Math.floor(png.height / rows);

console.log(`Grid cell size: ${cellW} x ${cellH}`);

const regions = {
  // Row 0: Major Buildings (Learning Camp, Skill Lab, Project Workshop, Challenge Arena)
  'buildings/learning-camp.png': { x: 40, y: 30, w: 320, h: 280 },
  'buildings/skill-lab.png': { x: 400, y: 30, w: 320, h: 280 },
  'buildings/project-workshop.png': { x: 770, y: 30, w: 340, h: 280 },
  'buildings/challenge-arena.png': { x: 1140, y: 30, w: 350, h: 280 },

  // Row 1: Career Academy, Reward Vault, Quarry, Lumber Yard
  'buildings/career-academy.png': { x: 40, y: 340, w: 330, h: 300 },
  'buildings/reward-vault.png': { x: 410, y: 340, w: 310, h: 300 },
  'buildings/quarry.png': { x: 770, y: 340, w: 330, h: 300 },
  'buildings/lumber-yard.png': { x: 1140, y: 340, w: 350, h: 300 },

  // Row 2: Characters, Trees, Props, Effects
  'characters/learner.png': { x: 50, y: 700, w: 140, h: 180 },
  'characters/builder.png': { x: 210, y: 700, w: 140, h: 180 },
  'characters/miner.png': { x: 370, y: 700, w: 140, h: 180 },
  'characters/trainer.png': { x: 530, y: 700, w: 140, h: 180 },
  'characters/mentor.png': { x: 690, y: 700, w: 140, h: 180 },

  'props/campfire.png': { x: 860, y: 700, w: 130, h: 130 },
  'props/tree-pine.png': { x: 1010, y: 680, w: 150, h: 200 },
  'props/tree-oak.png': { x: 1180, y: 680, w: 160, h: 200 },
  'props/stone-pile.png': { x: 1360, y: 710, w: 140, h: 120 },
  'props/logs.png': { x: 860, y: 850, w: 140, h: 110 },
  'props/crates.png': { x: 1020, y: 880, w: 140, h: 100 },
  'terrain/flowers.png': { x: 1190, y: 890, w: 130, h: 90 },
  'effects/quest-beacon.png': { x: 1350, y: 850, w: 140, h: 140 },
};

function extractRegion(srcPng, region) {
  const dst = new PNG({ width: region.w, height: region.h });
  for (let y = 0; y < region.h; y++) {
    for (let x = 0; x < region.w; x++) {
      const srcX = Math.min(srcPng.width - 1, Math.max(0, region.x + x));
      const srcY = Math.min(srcPng.height - 1, Math.max(0, region.y + y));
      const srcIdx = (srcPng.width * srcY + srcX) << 2;
      const dstIdx = (region.w * y + x) << 2;

      dst.data[dstIdx] = srcPng.data[srcIdx];
      dst.data[dstIdx + 1] = srcPng.data[srcIdx + 1];
      dst.data[dstIdx + 2] = srcPng.data[srcIdx + 2];
      dst.data[dstIdx + 3] = srcPng.data[srcIdx + 3];
    }
  }
  return dst;
}

for (const [relPath, region] of Object.entries(regions)) {
  const targetPath = `public/world/${relPath}`;
  const dir = targetPath.substring(0, targetPath.lastIndexOf('/'));
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const spritePng = extractRegion(png, region);
  const buffer = PNG.sync.write(spritePng);
  fs.writeFileSync(targetPath, buffer);
  console.log(`Saved ${targetPath} (${region.w}x${region.h})`);
}

console.log('All individual sprite assets extracted successfully!');
