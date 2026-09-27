const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const files = [
  'lib/classroom/integrations/types.ts',
  'lib/classroom/integrations/ClassroomProvider.ts',
  'lib/classroom/integrations/OpenMAICProvider.ts',
  'lib/classroom/integrations/LiveGenieProvider.ts',
  'lib/classroom/integrations/CanvasProvider.ts',
  'lib/classroom/integrations/MiroProvider.ts',
  'lib/classroom/integrations/ClassroomIntegrationRegistry.ts',
  'app/api/classroom/integrations/route.ts',
  'docs/classroom-integrations.md',
];

let passed = 0;
for (const file of files) {
  assert(fs.existsSync(path.join(root, file)), `Missing ${file}`);
  passed += 1;
}

const openmaic = read('lib/classroom/integrations/OpenMAICProvider.ts');
assert(openmaic.includes('XPEDITION_OPENMAIC_BRIDGE_URL'), 'OpenMAIC must use explicit bridge configuration.');
assert(openmaic.includes('/scene'), 'OpenMAIC scene bridge contract missing.');
assert(openmaic.includes('/action'), 'OpenMAIC action bridge contract missing.');
assert(!openmaic.includes('@openmaic/dsl'), 'Do not hard-import OpenMAIC SDK into the core app.');
passed += 4;

const livegenie = read('lib/classroom/integrations/LiveGenieProvider.ts');
assert(livegenie.includes('official API/SDK contract'), 'LiveGenie must not assume undocumented APIs.');
assert(livegenie.includes('return null'), 'LiveGenie must have a safe inactive fallback.');
passed += 2;

const canvas = read('lib/classroom/integrations/CanvasProvider.ts');
assert(canvas.includes('/ai_experiences/'), 'Canvas AI Experiences endpoint missing.');
assert(canvas.includes('/conversations'), 'Canvas AI Conversations endpoint missing.');
assert(canvas.includes('Authorization'), 'Canvas token must be server-side.');
passed += 3;

const miro = read('lib/classroom/integrations/MiroProvider.ts');
assert(miro.includes('NEXT_PUBLIC_MIRO_EMBED_URL'), 'Miro embed configuration missing.');
assert(miro.includes('OPEN_WORKSPACE'), 'Miro workspace action missing.');
passed += 2;

const runtime = read('lib/classroom/integrations/classroomIntegrationRuntime.ts');
assert(runtime.includes("requestExternalTeachingScene"), 'Classroom runtime must request external teaching scenes through the adapter.');
assert(runtime.includes("/api/classroom/integrations"), 'Classroom runtime must use the internal integration route.');
passed += 2;

const smartBoard = read('components/classroom/SmartBoard.tsx');
// Phase 1/2: external payloads are identity-gated upstream and may only supply optional artwork.
assert(smartBoard.includes('artworkUrl'), 'Smart Board must accept identity-checked optional artwork without changing its layout.');
passed += 1;

const layout = read('components/classroom/ClassroomLayout.tsx');
// Phase 1/2: that PNG is a screenshot of the DC-motor class (baked-in motor text, a second
// robot and duplicate dock labels) and was shown behind EVERY concept. It must not be the backdrop.
assert(!layout.includes('classroom-master-reference.png'), 'Class backdrop must not reuse the baked DC-motor reference screenshot.');
assert(layout.includes('ClassroomToolbar'), 'Existing Class toolbar must remain.');
passed += 2;

console.log(`Classroom integration test: ${passed} assertions passed`);
