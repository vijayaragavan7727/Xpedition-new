/**
 * PHASE 4 — PRODUCTION SECURITY CLOSURE (behavioural, deterministic)
 *
 *  1. two-user ownership (sessions, request-scoped DB client, owner-only delete)
 *  2. RLS expectations (schema posture; the real-DB proof is test/phase4Rls.pg.test.ts)
 *  3. visual-generation job ownership + private assets + manifest exposure
 *  4. Canvas authorization (signed learner-bound handles, credential boundary)
 *  5. OpenMAIC hard timeout (real hanging HTTP server)
 *  6. shared-device isolation (logout, identity change, unseen sign-out)
 *  7. auth fail-closed regression
 *  8. distributed-state risk classification + shared rate limiter
 *  9. registry identity consistency
 * 10. no credential / verification claim laundering
 *
 * Run: npx tsx test/phase4ProductionSecurity.test.ts
 */

import assert from 'assert';
import fs from 'fs';
import http from 'http';
import os from 'os';
import path from 'path';
import type { AddressInfo } from 'net';

class MemoryStorage {
  private map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  key(i: number) {
    return Array.from(this.map.keys())[i] ?? null;
  }
  getItem(k: string) {
    return this.map.has(k) ? this.map.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, String(v));
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
  clear() {
    this.map.clear();
  }
  keys() {
    return Array.from(this.map.keys());
  }
}
const local = new MemoryStorage();
const session = new MemoryStorage();
const g = globalThis as unknown as Record<string, unknown>;

import { evaluateServerAuth } from '../lib/auth/serverAuth';
import { resolveAuthMode } from '../lib/auth/authMode';
import { handleIntegrationRequest, projectCanvasPayload, type ProviderLookup } from '../lib/classroom/integrations/integrationAuthorization';
import type { ClassroomProvider } from '../lib/classroom/integrations/ClassroomProvider';
import type { ClassroomAction } from '../lib/classroom/integrations/types';
import { OpenMAICProvider, OPENMAIC_DEFAULT_TIMEOUT_MS } from '../lib/classroom/integrations/OpenMAICProvider';
import { ResourceHandleSigner, integrationHandleSigner } from '../lib/security/resourceHandle';
import { UpstreamTimeoutError, boundedTimeoutMs, MAX_UPSTREAM_TIMEOUT_MS } from '../lib/security/fetchWithTimeout';
import { checkUserRateLimit } from '../lib/security/distributedRateLimit';
import { SECURITY_STATE_INVENTORY } from '../lib/security/stateInventory';
import { RedisCacheAdapter } from '../lib/cache/cacheAdapter';
import { rateLimiter } from '../lib/security/rateLimiter';
import { registerServerDbProvider, getLearnerDb } from '../lib/supabase/dbContext';
import { DistributedSessionStore, MemorySessionStore } from '../lib/classroom/ClassroomSessionStore';
import { MemoryCacheAdapter } from '../lib/cache/cacheAdapter';
import { VisualGenerationEngine } from '../lib/visualGeneration/VisualGenerationEngine';
import { MemoryJobStore } from '../lib/visualGeneration/GenerationJobStore';
import { LocalAssetStore } from '../lib/visualGeneration/AssetStore';
import { LocalStorageBackend } from '../lib/storage/storageBackend';
import { learnerAssetDir, readOwnedAsset, toClientJob, PRIVATE_URL_PREFIX } from '../lib/visualGeneration/learnerVisualGeneration';
import { shouldRequestServerSession } from '../lib/classroom/classPersistence';
import { findUnsupportedClaims } from '../lib/passport/trustLanguage';
import { resolveClassLesson } from '../lib/concepts/lessonResolver';
import { resolveLearnerRouteConcept, resolveLessonRequestIdentity } from '../lib/concepts/routeConceptResolution';
import { lookupConcept } from '../lib/concepts/conceptRegistry';

const ROOT = path.resolve(__dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8');

let passed = 0;
let failed = 0;
const failures: string[] = [];
async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    const msg = err instanceof Error ? err.message : String(err);
    failures.push(`${name}: ${msg}`);
    console.log(`  ✗ ${name}\n      ${msg}`);
  }
}

let unhandled = 0;
process.on('unhandledRejection', () => {
  unhandled++;
});

/** Records Supabase query-builder calls without a network. */
function recordingDb() {
  const calls: Array<{ table: string; op: string; args: unknown[]; filters: Array<[string, unknown]> }> = [];
  const builder = (table: string) => {
    const entry = { table, op: '', args: [] as unknown[], filters: [] as Array<[string, unknown]> };
    const chain: Record<string, unknown> = {};
    const terminal = { data: null, error: null };
    for (const op of ['upsert', 'insert', 'update', 'delete', 'select']) {
      chain[op] = (...args: unknown[]) => {
        if (!entry.op) {
          entry.op = op;
          entry.args = args;
          calls.push(entry);
        }
        return chain;
      };
    }
    chain.eq = (col: string, val: unknown) => {
      entry.filters.push([col, val]);
      return chain;
    };
    chain.order = () => chain;
    chain.limit = () => chain;
    chain.maybeSingle = async () => terminal;
    chain.then = (resolve: (v: unknown) => void) => resolve(terminal);
    return chain;
  };
  return { client: { from: builder } as unknown, calls };
}

function sessionState(sessionId: string, ownerId: string) {
  return {
    sessionId,
    ownerId,
    conceptId: 'periodic_table',
    currentStage: 'INTRO',
    stageIndex: 0,
    masteryState: 'NOT_STARTED',
    masteryScore: 0,
  } as never;
}

function fakeRegistry(extra: { canvasPayload?: Record<string, unknown> } = {}) {
  const calls: ClassroomAction[] = [];
  let n = 0;
  const canvas: ClassroomProvider = {
    id: 'canvas',
    label: 'Canvas',
    status: () => ({ id: 'canvas', label: 'Canvas', status: 'configured', reason: 'CANVAS_API_TOKEN=secret', capabilities: [] }),
    initialize: async () => {},
    generateScene: async () => null,
    executeAction: async (action: ClassroomAction) => {
      calls.push(action);
      if (action.type === 'START_AI_CONVERSATION') {
        return { ok: true, provider: 'canvas', payload: { id: `conv_${++n}`, user_id: 991, course_id: 7, token: 'leak' } };
      }
      return { ok: true, provider: 'canvas', payload: extra.canvasPayload ?? { messages: [{ text: 'hello', user_id: 42, author: { id: 5, name: 'Teacher' } }] } };
    },
  } as unknown as ClassroomProvider;
  const registry: ProviderLookup = { get: (id) => (id === 'canvas' ? canvas : undefined), all: () => [canvas] };
  return { registry, calls };
}

async function main() {
  console.log('==========================================================');
  console.log('PHASE 4 — PRODUCTION SECURITY CLOSURE');
  console.log('==========================================================');

  // =========================================================================
  console.log('\n1. Two-user ownership & request-scoped database access');
  // =========================================================================
  await test('1.1 Server code never gets the anon singleton: only a registered request-scoped client', () => {
    registerServerDbProvider(null);
    assert.strictEqual(getLearnerDb(), null, 'no provider → no DB (never the anon browser client)');
    for (const f of ['lib/classroom/ClassroomSessionStore.ts', 'lib/persistence/supabasePersistence.ts']) {
      const src = read(f);
      assert.ok(!/import\s*\{[^}]*\bsupabase\b[^}]*\}\s*from\s*'\.\.\/supabase'/.test(src), `${f} must not import the anon singleton`);
      assert.ok(src.includes('getLearnerDb'), `${f} uses the learner DB context`);
    }
    // Every API route that uses shared persistence registers the request-scoped client.
    for (const f of [
      'app/api/classroom/session/route.ts',
      'app/api/user/state/route.ts',
      'app/api/user/attempt/route.ts',
      'app/api/user/memory/route.ts',
      'app/api/user/export/route.ts',
      'app/api/user/delete/route.ts',
    ]) {
      assert.ok(read(f).includes("import '@/lib/supabase/serverDb'"), `${f} registers serverDb`);
    }
  });

  await test('1.2 No service-role key is used anywhere in app/, lib/, components/ or middleware', () => {
    const hits: string[] = [];
    const walk = (dir: string) => {
      for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
        const rel = path.join(dir, e.name);
        if (e.isDirectory()) walk(rel);
        else if (/\.(ts|tsx|js)$/.test(e.name) && /SUPABASE_SERVICE_ROLE_KEY|serviceRoleKey/.test(fs.readFileSync(path.join(ROOT, rel), 'utf8'))) hits.push(rel);
      }
    };
    ['app', 'lib', 'components'].forEach(walk);
    if (/SUPABASE_SERVICE_ROLE_KEY|serviceRoleKey/.test(read('middleware.ts'))) hits.push('middleware.ts');
    assert.deepStrictEqual(hits, []);
  });

  await test('1.3 Session persistence writes through the learner client with user_id; delete is owner-only', async () => {
    MemorySessionStore.getInstance().clear();
    const db = recordingDb();
    const store = new DistributedSessionStore(new MemoryCacheAdapter(), () => db.client as never);
    await store.saveSession(sessionState('sess_A', 'user-a'), 'user-a');
    const upsert = db.calls.find((c) => c.op === 'upsert');
    assert.ok(upsert, 'upsert issued');
    assert.strictEqual((upsert!.args[0] as { user_id: string }).user_id, 'user-a');

    assert.strictEqual(await store.getSession('sess_A', 'user-b'), null, 'B cannot read A\'s session');
    assert.strictEqual(await store.deleteSession('sess_A', 'user-b'), false, 'B cannot delete A\'s session');
    assert.ok((await store.getSession('sess_A', 'user-a')) !== null, 'A still has it');
    assert.ok(!db.calls.some((c) => c.op === 'delete'), 'no DB delete was attempted for B');

    assert.strictEqual(await store.deleteSession('sess_A', 'user-a'), true);
    const del = db.calls.find((c) => c.op === 'delete');
    assert.deepStrictEqual(del!.filters, [['session_id', 'sess_A'], ['user_id', 'user-a']], 'DB delete filtered by owner');
  });

  // =========================================================================
  console.log('\n2. RLS expectations (schema posture)');
  // =========================================================================
  const schema = read('supabase/schema.sql');
  await test('2.1 Every CREATE TABLE in public has ENABLE ROW LEVEL SECURITY', () => {
    const tables = Array.from(schema.matchAll(/CREATE TABLE IF NOT EXISTS public\.(\w+)/g)).map((m) => m[1]);
    const missing = tables.filter((t) => !new RegExp(`ALTER TABLE public\\.${t} ENABLE ROW LEVEL SECURITY`).test(schema));
    assert.deepStrictEqual(missing, []);
  });
  await test('2.2 Learner goal skills are not publicly readable; telemetry cannot be attributed to another learner', () => {
    assert.ok(!/CREATE POLICY "Allow public read for skills"/.test(schema));
    const telemetry = schema.slice(schema.indexOf('CREATE POLICY "Users can insert own classroom telemetry"'));
    assert.ok(/FOR INSERT WITH CHECK \(auth\.uid\(\) = user_id\);/.test(telemetry.slice(0, 400)));
    assert.ok(!/auth\.uid\(\) = user_id OR auth\.role\(\) = 'authenticated'/.test(schema));
  });
  await test('2.3 Shared limiter function is SECURITY DEFINER, keyed by auth.uid(), not executable by anon; hits table has no policies', () => {
    assert.ok(/FUNCTION public\.xp_rate_limit_hit[\s\S]*SECURITY DEFINER[\s\S]*v_uid UUID := auth\.uid\(\)/.test(schema));
    assert.ok(/REVOKE ALL ON FUNCTION public\.xp_rate_limit_hit\(TEXT, INT, INT\) FROM anon;/.test(schema));
    assert.ok(!/CREATE POLICY [^\n]* ON public\.rate_limit_hits/.test(schema));
  });

  // =========================================================================
  console.log('\n3. Visual-generation job ownership & private assets');
  // =========================================================================
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xp-learner-visuals-'));
  const jobStore = new MemoryJobStore();
  const engine = new VisualGenerationEngine({
    assetStore: new LocalAssetStore(tmpDir, new LocalStorageBackend(tmpDir, PRIVATE_URL_PREFIX)),
    jobStore,
    mockMode: true,
  });
  const request = { conceptId: 'periodic_table', prompt: 'Periodic table trends poster for A only', visualType: 'diagram' as const };
  const jobA = await engine.generateVisual({ ...request }, { ownerId: 'user-a' });

  await test('3.1 Job is owned; B gets null for A\'s job id (status/result/metadata), A gets it', async () => {
    assert.strictEqual(jobA.ownerId, 'user-a');
    assert.strictEqual(await engine.getJobForOwner(jobA.jobId, 'user-b'), null);
    assert.ok(await engine.getJobForOwner(jobA.jobId, 'user-a'));
    assert.strictEqual(await engine.getJobForOwner(jobA.jobId, ''), null);
  });
  await test('3.2 Client projection carries no prompt, request, metadata, cache key, storage path or static URL', () => {
    const client = toClientJob(jobA) as Record<string, unknown>;
    const json = JSON.stringify(client);
    for (const forbidden of ['prompt', 'Periodic table trends poster', 'cacheKey', 'filePath', 'publicUrl', 'metadata', 'request', tmpDir, '/generated-visuals/', PRIVATE_URL_PREFIX]) {
      assert.ok(!json.includes(forbidden), `client job leaks ${forbidden}: ${json}`);
    }
    assert.strictEqual(client.assetUrl, `/api/visual-generation/${jobA.jobId}/asset`);
  });
  await test('3.3 Asset bytes only for the owner; B\'s cross-user job-id attack returns nothing', async () => {
    assert.strictEqual(await readOwnedAsset(jobA.jobId, 'user-b', engine, tmpDir), null);
    const mine = await readOwnedAsset(jobA.jobId, 'user-a', engine, tmpDir);
    assert.ok(mine && mine.buffer.length > 0 && mine.mimeType === 'image/png');
  });
  await test('3.4 Identical request by B never joins or reuses A\'s job/output; A\'s repeat creates a new owned job', async () => {
    const jobB = await engine.generateVisual({ ...request }, { ownerId: 'user-b' });
    assert.notStrictEqual(jobB.jobId, jobA.jobId);
    assert.notStrictEqual(jobB.asset?.assetId, jobA.asset?.assetId, 'separate private asset per owner');
    const again = await engine.generateVisual({ ...request }, { ownerId: 'user-a' });
    assert.notStrictEqual(again.jobId, jobA.jobId);
    assert.strictEqual(again.reused, true);
    assert.strictEqual(await engine.getJobForOwner(again.jobId, 'user-b'), null);
    assert.ok(await engine.getJobForOwner(again.jobId, 'user-a'));
  });
  await test('3.5 Tampered job storage path outside the private dir is refused (no traversal)', async () => {
    const tampered = { ...jobA, jobId: 'job_tampered', asset: { ...jobA.asset!, filePath: path.join(ROOT, 'package.json') } };
    await jobStore.createJob(tampered);
    assert.strictEqual(await readOwnedAsset('job_tampered', 'user-a', engine, tmpDir), null);
  });
  await test('3.6 Private learner storage can never be configured inside public/', () => {
    assert.throws(() => learnerAssetDir({ XPEDITION_PRIVATE_ASSET_DIR: path.join(process.cwd(), 'public', 'x') }));
    assert.ok(!learnerAssetDir({}).startsWith(path.join(process.cwd(), 'public')));
  });
  await test('3.7 Routes: every job read is owner-checked; responses use the client projection; asset route exists', () => {
    const post = read('app/api/visual-generation/route.ts');
    const byId = read('app/api/visual-generation/[jobId]/route.ts');
    const asset = read('app/api/visual-generation/[jobId]/asset/route.ts');
    assert.ok(post.includes('generateVisual(genRequest, { ownerId: user.id })'));
    assert.ok(post.includes('getJobForOwner(jobId, user.id)') && byId.includes('getJobForOwner(jobId, user.id)'));
    assert.ok(!/\.getJob\(/.test(post) && !/\.getJob\(/.test(byId), 'no un-owned getJob in routes');
    for (const src of [post, byId]) {
      assert.ok(src.includes('toClientJob('));
      assert.ok(!/publicUrl|metadata: result|sanitizeForClient/.test(src), 'no raw asset/metadata in responses');
    }
    assert.ok(asset.includes('readOwnedAsset(') && asset.includes('requireServerAuth'));
    assert.ok(asset.includes("'Cache-Control': 'private, no-store'"));
  });
  await test('3.8 The internal asset manifest is not served publicly (middleware 404)', async () => {
    const { middleware } = await import('../middleware');
    const { NextRequest } = await import('next/server');
    const res = await middleware(new NextRequest('http://localhost/generated-visuals/assets-manifest.json'));
    assert.strictEqual(res.status, 404);
  });

  // =========================================================================
  console.log('\n4. Canvas credential boundary & authorization');
  // =========================================================================
  const signer = new ResourceHandleSigner('phase4-test-secret-0123456789abcdef0123');
  await test('4.1 START returns only a learner-bound handle (no raw id, no Canvas user/course ids, no token)', async () => {
    const { registry } = fakeRegistry();
    const res = await handleIntegrationRequest({ method: 'POST', user: { id: 'alice' }, registry, handles: signer, body: { provider: 'canvas', action: 'execute_action', providerAction: { type: 'START_AI_CONVERSATION' } } });
    assert.strictEqual(res.status, 200);
    const payload = (res.body.result as { payload: Record<string, unknown> }).payload;
    assert.deepStrictEqual(Object.keys(payload), ['conversationHandle']);
    assert.ok(!JSON.stringify(res.body).includes('leak') && !JSON.stringify(res.body).includes('conv_1'));
  });
  await test('4.2 POST requires a valid handle bound to the caller: forged, other-learner, raw id, re-targeted provider, expired → 404', async () => {
    const { registry, calls } = fakeRegistry();
    const handle = signer.sign({ provider: 'canvas', resourceId: 'conv_9', userId: 'alice' });
    const post = (user: string, conversationHandle: unknown, extra: Record<string, unknown> = {}) =>
      handleIntegrationRequest({ method: 'POST', user: { id: user }, registry, handles: signer, body: { provider: 'canvas', action: 'execute_action', providerAction: { type: 'POST_AI_MESSAGE', payload: { conversationHandle, message: 'hi', ...extra } } } });
    const forged = handle.slice(0, -2) + (handle.endsWith('AA') ? 'BB' : 'AA');
    const otherSigner = new ResourceHandleSigner('another-secret-0123456789abcdef0123456789');
    const expired = signer.sign({ provider: 'canvas', resourceId: 'conv_9', userId: 'alice' }, Date.now() - 13 * 3600 * 1000);
    const wrongProvider = signer.sign({ provider: 'miro', resourceId: 'conv_9', userId: 'alice' });
    for (const [who, h] of [
      ['bob', handle],
      ['alice', forged],
      ['alice', 'conv_9'],
      ['alice', otherSigner.sign({ provider: 'canvas', resourceId: 'conv_9', userId: 'alice' })],
      ['alice', expired],
      ['alice', wrongProvider],
      ['alice', undefined],
    ] as const) {
      const r = await post(who, h);
      assert.strictEqual(r.status, 404, `${who} with ${String(h).slice(0, 12)}…`);
    }
    // Client-supplied Canvas ids / user ids / claims are ignored even alongside a valid handle.
    const ok = await post('alice', handle, { conversationId: 'conv_victim', userId: 'bob', canvasUserId: 1 });
    assert.strictEqual(ok.status, 200);
    const sent = calls[calls.length - 1];
    assert.deepStrictEqual(sent.payload, { conversationId: 'conv_9', message: 'hi' });
  });
  await test('4.3 Canvas response bodies are projected: user/author/course identifiers never reach the browser', () => {
    const projected = projectCanvasPayload({ messages: [{ text: 'hello', user_id: 42, author: { id: 5 } }], course_id: 7, sis_user_id: 'x', token: 't' });
    assert.deepStrictEqual(projected, { messages: [{ text: 'hello' }] });
  });
  await test('4.4 Production without a signing secret: Canvas conversation actions fail closed (503)', async () => {
    assert.strictEqual(integrationHandleSigner({ NODE_ENV: 'production' }), null);
    assert.ok(integrationHandleSigner({ NODE_ENV: 'production', XPEDITION_INTEGRATION_SIGNING_SECRET: 'x'.repeat(40) }));
    assert.strictEqual(integrationHandleSigner({ NODE_ENV: 'production', XPEDITION_INTEGRATION_SIGNING_SECRET: 'short' }), null);
    const { registry, calls } = fakeRegistry();
    const res = await handleIntegrationRequest({ method: 'POST', user: { id: 'alice' }, registry, handles: null, body: { provider: 'canvas', action: 'execute_action', providerAction: { type: 'START_AI_CONVERSATION' } } });
    assert.strictEqual(res.status, 503);
    assert.strictEqual(calls.length, 0, 'Canvas never called');
  });
  await test('4.5 School token stays server-side: only in the Authorization header; never NEXT_PUBLIC; status hides reasons', async () => {
    const src = read('lib/classroom/integrations/CanvasProvider.ts');
    assert.ok(/Authorization: `Bearer \$\{this\.token\}`/.test(src));
    assert.ok(!/NEXT_PUBLIC_CANVAS/.test(src) && !/NEXT_PUBLIC_CANVAS/.test(read('.env.example')));
    assert.ok(src.includes('Xpedition learner identity is NOT equivalent to a per-user Canvas identity'));
    const { registry } = fakeRegistry();
    const get = await handleIntegrationRequest({ method: 'GET', user: { id: 'a' }, registry, handles: null });
    assert.ok(!JSON.stringify(get.body).includes('CANVAS_API_TOKEN'));
    const anon = await handleIntegrationRequest({ method: 'POST', user: null, registry, handles: signer, body: { provider: 'canvas', action: 'execute_action', providerAction: { type: 'START_AI_CONVERSATION' } } });
    assert.strictEqual(anon.status, 401);
  });

  // =========================================================================
  console.log('\n5. OpenMAIC hard server-side timeout');
  // =========================================================================
  const sockets = new Set<import('net').Socket>();
  let aborted = 0;
  const hanging = http.createServer((req, res) => {
    req.on('close', () => {
      if (!res.writableEnded) aborted++;
    });
    if (req.url === '/stall-body/scene') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.write('{"title":"partial');
      return; // never ends the body
    }
    // '/hang/scene': never responds at all
  });
  hanging.on('connection', (s) => sockets.add(s));
  await new Promise<void>((r) => hanging.listen(0, '127.0.0.1', () => r()));
  const port = (hanging.address() as AddressInfo).port;
  const sceneRequest = { conceptId: 'periodic_table', stepIndex: 0 } as never;

  await test('5.1 Default and configured timeouts are bounded', () => {
    assert.ok(OPENMAIC_DEFAULT_TIMEOUT_MS > 0 && OPENMAIC_DEFAULT_TIMEOUT_MS < 3000, 'finishes before the Class client deadline');
    assert.strictEqual(boundedTimeoutMs('999999', 1000), MAX_UPSTREAM_TIMEOUT_MS);
    assert.strictEqual(boundedTimeoutMs('nonsense', 1234), 1234);
    assert.strictEqual(new OpenMAICProvider({ bridgeUrl: 'http://x', timeoutMs: 10 ** 9 }).timeoutMs, MAX_UPSTREAM_TIMEOUT_MS);
  });
  await test('5.2 Bridge that never responds: request aborted at the deadline with UpstreamTimeoutError', async () => {
    const provider = new OpenMAICProvider({ bridgeUrl: `http://127.0.0.1:${port}/hang`, timeoutMs: 300 });
    const t0 = Date.now();
    await assert.rejects(provider.generateScene(sceneRequest), (e: unknown) => e instanceof UpstreamTimeoutError);
    const elapsed = Date.now() - t0;
    assert.ok(elapsed >= 280 && elapsed < 1500, `terminated in ${elapsed} ms`);
  });
  await test('5.3 Bridge that stalls mid-body is also aborted (deadline covers the body)', async () => {
    const provider = new OpenMAICProvider({ bridgeUrl: `http://127.0.0.1:${port}/stall-body`, timeoutMs: 300 });
    const t0 = Date.now();
    await assert.rejects(provider.generateScene(sceneRequest), (e: unknown) => e instanceof UpstreamTimeoutError);
    assert.ok(Date.now() - t0 < 1500);
    await new Promise((r) => setTimeout(r, 100));
    assert.ok(aborted >= 2, `upstream connections were closed (${aborted})`);
  });
  await test('5.4 Handler maps the timeout to a deterministic 504; Class client falls back to native visuals (null)', async () => {
    const provider = new OpenMAICProvider({ bridgeUrl: `http://127.0.0.1:${port}/hang`, timeoutMs: 250 });
    const registry: ProviderLookup = { get: (id) => (id === 'openmaic' ? provider : undefined), all: () => [provider] };
    const res = await handleIntegrationRequest({ method: 'POST', user: { id: 'a' }, registry, handles: null, body: { provider: 'openmaic', action: 'generate_scene', context: { conceptId: 'periodic_table', stepIndex: 2 } } });
    assert.deepStrictEqual([res.status, res.body.code], [504, 'PROVIDER_TIMEOUT']);
    assert.ok(!JSON.stringify(res.body).includes(String(port)), 'no upstream detail leaked');

    const runtime = await import('../lib/classroom/integrations/classroomIntegrationRuntime');
    const lesson = (resolveClassLesson('periodic_table') as { lesson: { steps: unknown[] } }).lesson as never;
    const realFetch = globalThis.fetch;
    let fetchCalls = 0;
    globalThis.fetch = (async (_url: unknown, init?: { method?: string }) =>
      ++fetchCalls && init?.method === 'GET'
        ? new Response(JSON.stringify({ providers: [{ id: 'openmaic', status: 'configured' }] }), { status: 200 })
        : new Response(JSON.stringify({ success: false, code: 'PROVIDER_TIMEOUT' }), { status: 504 })) as typeof fetch;
    try {
      runtime.__resetIntegrationStatusCache();
      runtime.__setIntegrationEligibilityForTests(async () => true); // an authenticated learner
      const steps = (lesson as { steps: unknown[] }).steps;
      const results = [];
      for (let i = 0; i < steps.length; i++) {
        results.push(await runtime.requestExternalTeachingScene({ lesson, step: steps[i] as never, stepIndex: i }));
      }
      assert.ok(results.every((r) => r === null), 'every step falls back to the deterministic visual');
      assert.ok(fetchCalls > 1, 'scene requests were actually attempted and answered 504');

      // A guest never calls the auth-gated integration endpoints at all.
      runtime.__resetIntegrationStatusCache();
      runtime.__setIntegrationEligibilityForTests(async () => false);
      const before = fetchCalls;
      for (let i = 0; i < steps.length; i++) await runtime.requestExternalTeachingScene({ lesson, step: steps[i] as never, stepIndex: i });
      assert.strictEqual(fetchCalls, before, 'guest: zero integration requests');
    } finally {
      globalThis.fetch = realFetch;
      runtime.__resetIntegrationStatusCache();
      runtime.__setIntegrationEligibilityForTests(null);
    }
  });
  await test('5.5 No unhandled promise rejections from aborted bridge calls', async () => {
    await new Promise((r) => setTimeout(r, 200));
    assert.strictEqual(unhandled, 0);
  });
  sockets.forEach((s) => s.destroy());
  await new Promise<void>((r) => hanging.close(() => r()));

  // =========================================================================
  console.log('\n6. Shared-device isolation (non-World learner storage)');
  // =========================================================================
  g.localStorage = local;
  g.sessionStorage = session;
  g.window = globalThis;
  const store = await import('../lib/store');
  const ls = await import('../lib/security/learnerStorage');
  const learnerSnapshot = (handle: string) => ({ ...store.getStoreData(), handle });

  await test('6.1 A creates state → logout via auth reconciliation (setActiveStoreUser(null)) → A\'s local data is gone', () => {
    local.clear();
    session.clear();
    ls.__resetLearnerStorageMemoryForTests();
    store.setActiveStoreUser('alice');
    store.saveStoreData(learnerSnapshot('Alice'));
    ls.writeLearnerItem('xpedition_notes_periodic_table', 'Alice private note');
    ls.writeLearnerItem('xpedition_feedback', 'Alice feedback draft');
    assert.ok(local.keys().some((k) => k.includes('alice')));
    store.setActiveStoreUser(null); // AuthIdentitySync on SIGNED_OUT / expired session
    assert.deepStrictEqual(local.keys().filter((k) => k.includes('alice')), []);
  });
  await test('6.2 Sign-out this tab never saw (A\'s keys remain, pointer lost) → B signs in → A\'s keys purged', () => {
    local.clear();
    ls.__resetLearnerStorageMemoryForTests();
    local.setItem('xpedition_user_alice', JSON.stringify(learnerSnapshot('Alice')));
    local.setItem('xpedition_notes_periodic_table__u_alice', 'Alice private note');
    local.setItem('xpedition_user_state_alice', '{"handle":"Alice"}');
    store.setActiveStoreUser('bob');
    assert.deepStrictEqual(local.keys().filter((k) => k.includes('alice')), []);
    assert.strictEqual(ls.readLearnerItem('xpedition_notes_periodic_table'), null);
    assert.notStrictEqual(store.getStoreData().handle, 'Alice');
  });
  await test('6.3 The current learner\'s own data survives a same-identity refresh; guest data is memory-only', () => {
    store.saveStoreData(learnerSnapshot('Bob'));
    ls.writeLearnerItem('xpedition_notes_periodic_table', 'Bob note');
    store.setActiveStoreUser('bob'); // same identity (reload)
    assert.strictEqual(store.getStoreData().handle, 'Bob');
    assert.strictEqual(ls.readLearnerItem('xpedition_notes_periodic_table'), 'Bob note');
    store.setActiveStoreUser(null);
    const before = local.keys().length;
    assert.strictEqual(ls.writeLearnerItem('xpedition_notes_periodic_table', 'guest note'), false, 'guest write is not persisted');
    store.saveStoreData(learnerSnapshot('Guest'));
    assert.strictEqual(local.keys().length, before, 'guest wrote nothing to localStorage');
    assert.ok(!local.keys().some((k) => k.includes('bob')), 'Bob purged at logout');
  });
  await test('6.4 Guest Class never requests a server session; a real learner session does', async () => {
    const noSession = { getSession: async () => ({ data: { session: null } }) };
    const withSession = { getSession: async () => ({ data: { session: { user: { id: 'u1' } } } }) };
    assert.strictEqual(await shouldRequestServerSession('unavailable', withSession), false);
    assert.strictEqual(await shouldRequestServerSession('supabase', noSession), false);
    assert.strictEqual(await shouldRequestServerSession('supabase', null), false);
    assert.strictEqual(await shouldRequestServerSession('supabase', withSession), true);
    assert.strictEqual(await shouldRequestServerSession('dev_local', null), true);
    const modal = read('components/classroom/tools/ClassroomToolsModal.tsx');
    assert.ok(modal.includes("'Guest: kept for this visit only (not saved)'"), 'guest notes never claim "Saved"');
  });

  // =========================================================================
  console.log('\n7. Auth fail-closed regression');
  // =========================================================================
  await test('7.1 Production without Supabase: no learner, 503, getUser never called; bypass flag ignored', async () => {
    let called = 0;
    const getUser = async () => {
      called++;
      return { data: { user: { id: 'x' } }, error: null };
    };
    for (const env of [{ NODE_ENV: 'production' }, { NODE_ENV: 'production', NEXT_PUBLIC_XPEDITION_DEV_AUTH_BYPASS: '1' }, { NODE_ENV: 'test', NEXT_PUBLIC_XPEDITION_DEV_AUTH_BYPASS: '1' }]) {
      const r = await evaluateServerAuth(env, getUser as never);
      assert.deepStrictEqual([r.status, r.user], [503, null], JSON.stringify(env));
    }
    assert.strictEqual(called, 0);
  });
  await test('7.2 Dev bypass only with NODE_ENV=development AND the explicit flag', () => {
    assert.strictEqual(resolveAuthMode({ NODE_ENV: 'development' }), 'unavailable');
    assert.strictEqual(resolveAuthMode({ NODE_ENV: 'development', NEXT_PUBLIC_XPEDITION_DEV_AUTH_BYPASS: 'true' }), 'unavailable');
    assert.strictEqual(resolveAuthMode({ NODE_ENV: 'development', NEXT_PUBLIC_XPEDITION_DEV_AUTH_BYPASS: '1' }), 'dev_local');
  });
  await test('7.3 Every learner-data API route requires auth before touching data', () => {
    for (const f of ['app/api/visual-generation/route.ts', 'app/api/visual-generation/[jobId]/route.ts', 'app/api/visual-generation/[jobId]/asset/route.ts', 'app/api/classroom/session/route.ts', 'app/api/classroom/integrations/route.ts']) {
      assert.ok(read(f).includes('requireServerAuth'), f);
    }
  });

  // =========================================================================
  console.log('\n8. Distributed-state classification & shared rate limiting');
  // =========================================================================
  await test('8.1 Every security-relevant in-memory store is classified and its module exists', () => {
    const allowed = new Set(['safe_process_local', 'unsafe_in_memory_prod', 'requires_shared_store']);
    for (const e of SECURITY_STATE_INVENTORY) {
      assert.ok(allowed.has(e.classification), e.id);
      assert.ok(fs.existsSync(path.join(ROOT, e.module)), e.module);
      assert.ok(e.productionBoundary.length > 20, e.id);
    }
    const ids = SECURITY_STATE_INVENTORY.map((e) => e.id);
    for (const required of ['rate_limit_buckets', 'canvas_conversation_ownership', 'classroom_session_cache', 'visual_generation_jobs', 'cache_adapter']) {
      assert.ok(ids.includes(required), required);
    }
  });
  await test('8.2 The REDIS_URL placeholder no longer claims to be distributed', () => {
    assert.strictEqual(new RedisCacheAdapter('redis://example.invalid:6379').distributed, false);
    assert.ok(!read('lib/cache/cacheAdapter.ts').includes('this.isConnected = true'));
  });
  await test('8.3 Shared limiter: uses the Postgres RPC when available; falls back or fails closed by policy', async () => {
    const rpcCalls: unknown[] = [];
    const db = { rpc: async (fn: string, args: unknown) => (rpcCalls.push([fn, args]), { data: [{ allowed: false, hits: 5, reset_at: new Date(Date.now() + 30000).toISOString() }], error: null }) };
    const shared = await checkUserRateLimit({ userId: 'u1', bucket: 'visual-generation', maxRequests: 5, windowMs: 60000, db: db as never });
    assert.deepStrictEqual([shared.backend, shared.allowed], ['supabase_shared', false]);
    assert.deepStrictEqual(rpcCalls[0], ['xp_rate_limit_hit', { p_bucket: 'visual-generation', p_window_seconds: 60, p_max: 5 }]);

    const broken = { rpc: async () => ({ data: null, error: { message: 'function missing' } }) };
    rateLimiter.reset();
    const fallback = await checkUserRateLimit({ userId: 'u1', bucket: 'visual-generation', maxRequests: 5, windowMs: 60000, db: broken as never, env: {} });
    assert.deepStrictEqual([fallback.backend, fallback.allowed], ['process_local', true]);
    const strict = await checkUserRateLimit({ userId: 'u1', bucket: 'visual-generation', maxRequests: 5, windowMs: 60000, db: broken as never, env: { XPEDITION_RATE_LIMIT_REQUIRE_SHARED: '1' } });
    assert.deepStrictEqual([strict.backend, strict.allowed], ['shared_required_unavailable', false]);
    await assert.rejects(checkUserRateLimit({ userId: 'u1', bucket: 'Bad Bucket!', maxRequests: 1, windowMs: 1000, db: null }));
  });
  await test('8.4 Sensitive learner routes use the shared per-learner limiter', () => {
    for (const f of ['app/api/classroom/session/route.ts', 'app/api/classroom/integrations/route.ts', 'app/api/visual-generation/route.ts']) {
      const src = read(f);
      assert.ok(src.includes('checkUserRateLimit({'), f);
      assert.ok(!src.includes('rateLimiter.checkLimit'), `${f} no longer uses the process-only limiter`);
    }
  });

  // =========================================================================
  console.log('\n9. Registry identity consistency');
  // =========================================================================
  await test('9.1 Canonical ids resolve identically across Class, /learn|/tutor adapters and /api/lesson', () => {
    for (const id of ['periodic_table', 'industrial_revolution', 'binary_search', 'dc_motor', 'polymorphism']) {
      const cls = resolveClassLesson(id);
      const route = resolveLearnerRouteConcept(id, null);
      const api = resolveLessonRequestIdentity({ conceptId: id, conceptName: 'IGNORED' });
      assert.strictEqual(cls.status, 'resolved', id);
      assert.strictEqual(route.status, 'canonical', id);
      assert.ok(api.ok, id);
      const expected = lookupConcept(id)!.concept.id;
      assert.deepStrictEqual([(cls as { conceptId: string }).conceptId, (route as { conceptId: string }).conceptId, (api as { conceptId: string }).conceptId], [expected, expected, expected]);
    }
  });
  await test('9.2 Look-alikes and unknowns never resolve to another concept', () => {
    for (const [raw, forbidden] of [['research_methods', 'binary_search'], ['evolution', 'industrial_revolution'], ['unknown_topic', 'dc_motor']] as const) {
      const cls = resolveClassLesson(raw);
      const route = resolveLearnerRouteConcept(raw, null);
      assert.strictEqual(cls.status, 'unavailable', raw);
      assert.strictEqual(route.status, 'unavailable', raw);
      assert.ok(!JSON.stringify([cls, route]).includes(`"conceptId":"${forbidden}"`));
    }
  });

  // =========================================================================
  console.log('\n10. No credential / verification claim laundering');
  // =========================================================================
  await test('10.1 Phase 4 docs make no unsupported credential claims and do not claim production readiness', () => {
    const doc = read('docs/phase-4-production-security.md');
    assert.deepStrictEqual(findUnsupportedClaims(doc.replace(/^.*UNSUPPORTED_CREDENTIAL_CLAIMS.*$/gm, '')), []);
    assert.ok(/not production-ready/i.test(doc), 'doc states the system is not production-ready');
    assert.ok(!/\bis production[- ]ready\b/i.test(doc.replace(/not production-ready/gi, '')));
  });
  await test('10.2 Hosted-Supabase verification is only claimed from a real run (live test never fakes)', () => {
    const live = read('test/phase4SupabaseLive.test.ts');
    assert.ok(live.includes('BLOCKED: missing'), 'prints BLOCKED without credentials');
    assert.ok(!/service_role|SERVICE_ROLE_KEY/.test(live), 'no service-role key');
    const doc = read('docs/phase-4-production-security.md');
    if (!process.env.XP_TEST_USER_A_EMAIL) {
      assert.ok(/hosted Supabase[^\n]*(BLOCKED|not run|blocked)/i.test(doc), 'doc says the hosted run is blocked');
    }
  });
  await test('10.3 Canvas identity limitation is stated, not hidden', () => {
    const doc = read('docs/phase-4-production-security.md');
    assert.ok(doc.includes('Xpedition learner identity is not equivalent to a per-user Canvas identity.'));
  });

  fs.rmSync(tmpDir, { recursive: true, force: true });

  console.log('\n==========================================================');
  console.log(`PHASE 4 PRODUCTION SECURITY SUMMARY: ${passed} passed, ${failed} failed`);
  console.log('==========================================================');
  if (failed > 0) {
    failures.forEach((f) => console.log(` - ${f}`));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
