const fs = require('fs');
const path = require('path');
const { getProductionConfig, resetProductionConfig } = require('../lib/config/productionConfig');
const { MemoryCacheAdapter, RedisCacheAdapter } = require('../lib/cache/cacheAdapter');
const { LocalStorageBackend, SupabaseStorageBackend } = require('../lib/storage/storageBackend');
const { ComfyUICircuitBreaker } = require('../lib/visualGeneration/ComfyUICircuitBreaker');
const {
  SlidingWindowRateLimiter,
  getClientRateLimitKey,
  createRateLimitExceededResponse,
  applyRateLimitHeaders,
} = require('../lib/security/rateLimiter');
const { ProductionLogger, sanitizeLogContext } = require('../lib/observability/productionLogger');
const { MemorySessionStore, DistributedSessionStore } = require('../lib/classroom/ClassroomSessionStore');
const { getClassroomLesson } = require('../lib/classroom/classroomCatalog');

const rootDir = path.resolve(__dirname, '..');

let totalPassed = 0;
let totalFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    totalPassed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    totalFailed++;
  }
}

async function runPhase5Tests() {
  console.log('===========================================================');
  console.log('XPEDITION PHASE 5: PRODUCTION HARDENING & RELEASE READINESS');
  console.log('===========================================================\n');

  // ---------------------------------------------------------------------------
  // GROUP A: Production Configuration & Environment Safety
  // ---------------------------------------------------------------------------
  console.log('A. Testing Production Configuration & Safe Defaults');
  resetProductionConfig();
  const config = getProductionConfig();

  assert(config !== null && typeof config === 'object', 'Production config object initializes safely');
  assert(typeof config.comfyUI.timeoutMs === 'number' && config.comfyUI.timeoutMs > 0, 'ComfyUI timeout is a valid positive number');
  assert(config.cache.provider === 'memory' || config.cache.provider === 'redis', 'Cache provider is valid');
  assert(config.storage.provider === 'local' || config.storage.provider === 'supabase' || config.storage.provider === 's3', 'Storage provider is valid');
  assert(config.rateLimit.enabled === true, 'Rate limit is enabled by default');
  assert(config.rateLimit.visualGenerationMaxPerMin > 0, 'Visual generation rate limit threshold is positive');
  assert(config.rateLimit.classroomSessionMaxPerMin > 0, 'Classroom session rate limit threshold is positive');
  assert(typeof config.observability.logLevel === 'string', 'Observability log level is defined');

  // ---------------------------------------------------------------------------
  // GROUP B: Distributed Cache Abstraction
  // ---------------------------------------------------------------------------
  console.log('\nB. Testing Distributed Cache Abstraction');
  const cache = new MemoryCacheAdapter(100);

  await cache.set('test:key1', { hello: 'world' });
  const val1 = await cache.get('test:key1');
  assert(val1 && val1.hello === 'world', 'MemoryCacheAdapter sets and retrieves complex objects');

  assert(await cache.has('test:key1') === true, 'has() returns true for present key');
  assert(await cache.has('test:nonexistent') === false, 'has() returns false for missing key');

  await cache.delete('test:key1');
  assert(await cache.get('test:key1') === null, 'delete() removes key cleanly');

  // TTL expiration check
  await cache.set('test:ttl', 'expiring', 1); // 1 second TTL
  assert(await cache.get('test:ttl') === 'expiring', 'Value present immediately within TTL');
  await new Promise((r) => setTimeout(r, 1100));
  assert(await cache.get('test:ttl') === null, 'Value expires and returns null after TTL elapses');

  await cache.set('test:k1', 1);
  await cache.set('test:k2', 2);
  await cache.clear();
  assert(await cache.has('test:k1') === false && cache.size() === 0, 'clear() empties cache');

  // Redis fallback check
  const redisAdapter = new RedisCacheAdapter(null);
  await redisAdapter.set('fallback:key', 'safe_value');
  const fallbackVal = await redisAdapter.get('fallback:key');
  assert(fallbackVal === 'safe_value', 'RedisCacheAdapter falls back seamlessly to memory when URL is null');

  // ---------------------------------------------------------------------------
  // GROUP C: Production Asset Storage Abstraction
  // ---------------------------------------------------------------------------
  console.log('\nC. Testing Production Asset Storage Abstraction');
  const testStorageDir = path.join(rootDir, 'public', 'generated-visuals', '.test_storage');
  const storage = new LocalStorageBackend(testStorageDir, '/test-visuals');

  const testBuffer = Buffer.from('test_image_payload_bytes_png');
  const uploadRes = await storage.upload('test_asset.png', testBuffer, 'image/png');

  assert(uploadRes.publicUrl.startsWith('/test-visuals/test_asset.png'), 'upload() generates valid public URL');
  assert(!uploadRes.publicUrl.includes(rootDir), 'publicUrl strictly excludes server filesystem paths');
  assert(await storage.exists(uploadRes.storagePath) === true, 'exists() returns true for uploaded asset');

  const retrievedBuffer = await storage.getBuffer(uploadRes.storagePath);
  assert(retrievedBuffer && retrievedBuffer.toString() === testBuffer.toString(), 'getBuffer() retrieves exact binary');

  const deleted = await storage.delete(uploadRes.storagePath);
  assert(deleted === true, 'delete() cleans up storage file');
  assert(await storage.exists(uploadRes.storagePath) === false, 'File no longer exists after delete');

  // Clean up test dir
  try {
    if (fs.existsSync(testStorageDir)) {
      fs.rmdirSync(testStorageDir);
    }
  } catch {}

  const supabaseStorage = new SupabaseStorageBackend('test-bucket');
  assert(typeof supabaseStorage.getProviderName() === 'string', 'Supabase storage backend exports provider name');

  // ---------------------------------------------------------------------------
  // GROUP D: ComfyUI Circuit Breaker & Reliability
  // ---------------------------------------------------------------------------
  console.log('\nD. Testing ComfyUI Circuit Breaker & Reliability');
  const breaker = new ComfyUICircuitBreaker({
    failureThreshold: 3,
    resetTimeoutMs: 200, // fast reset for test
    probeSuccessThreshold: 1,
  });

  assert(breaker.getState() === 'CLOSED', 'Breaker initializes in CLOSED state');
  assert(breaker.canExecute() === true, 'canExecute() returns true in CLOSED state');

  breaker.recordFailure();
  breaker.recordFailure();
  assert(breaker.getState() === 'CLOSED', 'Circuit remains CLOSED under failure threshold');

  breaker.recordFailure(); // 3rd failure trips circuit
  assert(breaker.getState() === 'OPEN', 'Circuit trips to OPEN after reaching threshold');
  assert(breaker.canExecute() === false, 'canExecute() returns false when OPEN');

  const status = breaker.getStatus();
  assert(status.consecutiveFailures === 3, 'getStatus reflects consecutive failure count');
  assert(typeof status.lastFailureTime === 'number', 'getStatus reflects lastFailureTime');

  // Wait for reset timeout to test HALF_OPEN transition
  await new Promise((r) => setTimeout(r, 250));
  assert(breaker.canExecute() === true, 'canExecute() allows probe after resetTimeoutMs');
  assert(breaker.getState() === 'HALF_OPEN', 'Circuit transitions to HALF_OPEN after timeout');

  breaker.recordSuccess();
  assert(breaker.getState() === 'CLOSED', 'Successful probe resets circuit back to CLOSED');

  breaker.recordFailure();
  breaker.reset();
  assert(breaker.getState() === 'CLOSED' && breaker.canExecute() === true, 'reset() explicitly restores CLOSED state');

  // ---------------------------------------------------------------------------
  // GROUP E: Sliding Window Rate Limiter
  // ---------------------------------------------------------------------------
  console.log('\nE. Testing Sliding Window Rate Limiter');
  const limiter = new SlidingWindowRateLimiter({
    maxRequests: 3,
    windowMs: 1000,
  });

  const res1 = await limiter.checkLimit('user:123');
  assert(res1.allowed === true && res1.remaining === 2, 'Request 1 allowed with 2 remaining');

  const res2 = await limiter.checkLimit('user:123');
  assert(res2.allowed === true && res2.remaining === 1, 'Request 2 allowed with 1 remaining');

  const res3 = await limiter.checkLimit('user:123');
  assert(res3.allowed === true && res3.remaining === 0, 'Request 3 allowed with 0 remaining');

  const res4 = await limiter.checkLimit('user:123');
  assert(res4.allowed === false && res4.remaining === 0, 'Request 4 rejected (allowed: false)');
  assert(res4.retryAfterSeconds >= 1, 'retryAfterSeconds indicates positive wait time');

  // Isolated key for other user
  const otherUserRes = await limiter.checkLimit('user:456');
  assert(otherUserRes.allowed === true, 'Different user key has independent rate limit budget');

  const mockReq = {
    headers: {
      get: (h) => (h === 'x-forwarded-for' ? '203.0.113.19, 10.0.0.1' : null),
    },
  };
  const ipKey = getClientRateLimitKey(mockReq, undefined, 'api-test');
  assert(ipKey === 'ip:203.0.113.19:api-test', 'getClientRateLimitKey parses forwarded client IP cleanly');

  const userKey = getClientRateLimitKey(mockReq, 'usr_abc', 'api-test');
  assert(userKey === 'user:usr_abc:api-test', 'getClientRateLimitKey prioritizes userId over IP');

  const exceededResp = createRateLimitExceededResponse(res4);
  assert(exceededResp.status === 429, 'createRateLimitExceededResponse returns HTTP 429');

  // ---------------------------------------------------------------------------
  // GROUP F: Production Logger & PII/Secret Redaction
  // ---------------------------------------------------------------------------
  console.log('\nF. Testing Production Logger & PII/Secret Redaction');
  const testLogger = new ProductionLogger(50);

  const rawContext = {
    userId: 'learner_1',
    password: 'super_secret_password',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token',
    authorization: 'Bearer secret_bearer_token',
    apiKey: 'sk-1234567890abcdef',
    concept: 'dc_motor',
    score: 85,
  };

  const sanitized = sanitizeLogContext(rawContext);
  assert(sanitized.password === '[REDACTED]', 'password context field is redacted');
  assert(sanitized.token === '[REDACTED]', 'token context field is redacted');
  assert(sanitized.authorization === '[REDACTED]', 'authorization context field is redacted');
  assert(sanitized.apiKey === '[REDACTED]', 'apiKey context field is redacted');
  assert(sanitized.concept === 'dc_motor', 'Educational concept metadata is preserved');
  assert(sanitized.score === 85, 'Learner performance metric is preserved');

  testLogger.info('Test info message', rawContext);
  const recentLogs = testLogger.getRecentLogs();
  assert(recentLogs.length === 1, 'Logger writes entry into buffer');
  assert(recentLogs[0].level === 'info', 'Log entry level is info');
  assert(recentLogs[0].context.password === '[REDACTED]', 'Buffer entry context is redacted');

  testLogger.error('Test error message', new Error('Database connection failed'), { token: 'secret' });
  assert(testLogger.getRecentLogs().length === 2, 'Error message logged successfully');

  // ---------------------------------------------------------------------------
  // GROUP G: Distributed Classroom Session Store
  // ---------------------------------------------------------------------------
  console.log('\nG. Testing Distributed Classroom Session Store');
  const memStore = new MemorySessionStore();

  const mockSession = {
    sessionId: 'sess_test_101',
    conceptId: 'dc_motor',
    lessonId: 'dc-motor-and-commutation',
    currentStage: 'INTRODUCE',
    stageIndex: 0,
    stageStartedAt: Date.now(),
    completedStages: [],
    interactionState: { hasInteracted: false, interactionsCount: 0 },
    questionState: { isSubmitted: false },
    masteryScore: 0,
    masteryState: { currentLevel: 'NOT_STARTED', score: 0 },
    isVisualLoading: false,
    nextRecommendedConceptId: 'projectile_motion',
  };

  await memStore.saveSession(mockSession, 'user_dev_1');
  const loaded = await memStore.getSession('sess_test_101');
  assert(loaded && loaded.conceptId === 'dc_motor', 'MemorySessionStore saves and retrieves session');

  const userSessions = await memStore.listUserSessions('user_dev_1');
  assert(userSessions.length === 1 && userSessions[0].sessionId === 'sess_test_101', 'listUserSessions returns user sessions');

  await memStore.deleteSession('sess_test_101');
  assert(await memStore.getSession('sess_test_101') === null, 'deleteSession removes session');

  const distStore = new DistributedSessionStore();
  assert(distStore !== null, 'DistributedSessionStore instantiates cleanly');

  // ---------------------------------------------------------------------------
  // GROUP H: Health Check & Readiness Endpoint Contract
  // ---------------------------------------------------------------------------
  console.log('\nH. Testing Health Check & Readiness Endpoint Contract');
  const healthRoutePath = path.join(rootDir, 'app', 'api', 'health', 'route.ts');
  assert(fs.existsSync(healthRoutePath), 'Health route app/api/health/route.ts exists');

  const healthContent = fs.readFileSync(healthRoutePath, 'utf8');
  assert(healthContent.includes('export async function GET'), 'Health route exports GET handler');
  assert(healthContent.includes('uptimeSeconds'), 'Health route includes uptimeSeconds in contract');
  assert(healthContent.includes('services'), 'Health route includes services breakdown');
  assert(healthContent.includes('database') && healthContent.includes('cache') && healthContent.includes('storage') && healthContent.includes('visualEngine'), 'Health route reports on all 4 core subsystems');
  assert(healthContent.includes('no-store'), 'Health response sets no-store Cache-Control header');
  assert(!healthContent.includes(':8188'), 'Health route strictly avoids exposing internal port 8188');

  // ---------------------------------------------------------------------------
  // GROUP I: Database DDL & RLS Validation (supabase/schema.sql)
  // ---------------------------------------------------------------------------
  console.log('\nI. Testing Database DDL & RLS Validation (supabase/schema.sql)');
  const schemaPath = path.join(rootDir, 'supabase', 'schema.sql');
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');

  assert(schemaContent.includes('CREATE TABLE IF NOT EXISTS public.classroom_sessions'), 'schema.sql contains classroom_sessions table DDL');
  assert(schemaContent.includes('CREATE TABLE IF NOT EXISTS public.classroom_telemetry'), 'schema.sql contains classroom_telemetry table DDL');
  assert(schemaContent.includes('CREATE TABLE IF NOT EXISTS public.educational_assets'), 'schema.sql contains educational_assets table DDL');
  assert(schemaContent.includes('CREATE TABLE IF NOT EXISTS public.generation_jobs'), 'schema.sql contains generation_jobs table DDL');

  assert(schemaContent.includes('ALTER TABLE public.classroom_sessions ENABLE ROW LEVEL SECURITY;'), 'classroom_sessions has RLS enabled');
  assert(schemaContent.includes('ALTER TABLE public.classroom_telemetry ENABLE ROW LEVEL SECURITY;'), 'classroom_telemetry has RLS enabled');
  assert(schemaContent.includes('ALTER TABLE public.educational_assets ENABLE ROW LEVEL SECURITY;'), 'educational_assets has RLS enabled');
  assert(schemaContent.includes('ALTER TABLE public.generation_jobs ENABLE ROW LEVEL SECURITY;'), 'generation_jobs has RLS enabled');

  assert(schemaContent.includes('CREATE POLICY "Users can manage own classroom sessions"'), 'classroom_sessions enforces user isolation policy');
  assert(schemaContent.includes('CREATE POLICY "Anyone can view ready educational assets"'), 'educational_assets allows public view for ready assets');

  // ---------------------------------------------------------------------------
  // GROUP J: API Hardening & Security Invariants
  // ---------------------------------------------------------------------------
  console.log('\nJ. Testing API Hardening & Security Invariants');
  const visGenRoutePath = path.join(rootDir, 'app', 'api', 'visual-generation', 'route.ts');
  const visGenContent = fs.readFileSync(visGenRoutePath, 'utf8');

  assert(visGenContent.includes('requireServerAuth'), 'POST /api/visual-generation requires server authentication');
  assert(visGenContent.includes('rateLimiter.checkLimit'), 'POST /api/visual-generation enforces rate limiting');
  assert(visGenContent.includes('createRateLimitExceededResponse'), 'POST /api/visual-generation returns 429 when rate limited');
  assert(visGenContent.includes('applyRateLimitHeaders'), 'POST /api/visual-generation sets rate limit headers');
  assert(visGenContent.includes('LocalAssetStore.sanitizeForClient'), 'POST /api/visual-generation sanitizes asset server paths');

  const classSessionRoutePath = path.join(rootDir, 'app', 'api', 'classroom', 'session', 'route.ts');
  const classSessionContent = fs.readFileSync(classSessionRoutePath, 'utf8');

  assert(classSessionContent.includes('requireServerAuth'), 'POST /api/classroom/session requires server authentication');
  assert(classSessionContent.includes('rateLimiter.checkLimit'), 'POST /api/classroom/session enforces rate limiting');
  assert(classSessionContent.includes('createRateLimitExceededResponse'), 'POST /api/classroom/session returns 429 when rate limited');
  assert(classSessionContent.includes('applyRateLimitHeaders'), 'POST /api/classroom/session sets rate limit headers');

  // ---------------------------------------------------------------------------
  // GROUP K: Phase 1-4 Regression Protection
  // ---------------------------------------------------------------------------
  console.log('\nK. Testing Phase 1-4 Regression Protection');
  const lesson = getClassroomLesson('dc_motor');
  assert(lesson.conceptId === 'dc_motor', 'Canonical DC motor lesson is intact');
  assert(lesson.topicTitle.includes('DC') && lesson.topicTitle.includes('Motor'), 'Lesson title matches DC Motor');

  const heartLesson = getClassroomLesson('cardiac');
  assert(heartLesson.conceptId === 'human_heart_anatomy', 'Cardiac synonym resolves cleanly');

  const envExamplePath = path.join(rootDir, '.env.example');
  const envContent = fs.readFileSync(envExamplePath, 'utf8');
  assert(envContent.includes('CACHE_PROVIDER'), '.env.example documents CACHE_PROVIDER');
  assert(envContent.includes('STORAGE_PROVIDER'), '.env.example documents STORAGE_PROVIDER');
  assert(envContent.includes('RATE_LIMIT_ENABLED'), '.env.example documents RATE_LIMIT_ENABLED');

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n===========================================================');
  console.log(`PHASE 5 HARDENING TEST SUMMARY: ${totalPassed} passed, ${totalFailed} failed`);
  console.log('===========================================================\n');

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runPhase5Tests().catch((err) => {
  console.error('Fatal error during Phase 5 hardening tests:', err);
  process.exit(1);
});
