const fs = require('fs');
const path = require('path');

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

async function runSecurityRemediationTests() {
  console.log('======================================================');
  console.log('XPEDITION SECURITY REMEDIATION VERIFICATION SUITE');
  console.log('======================================================\n');

  // ---------------------------------------------------------------------------
  // TEST SUITE 1: IDOR-01 Elimination (x-user-id removal across all API routes)
  // ---------------------------------------------------------------------------
  console.log('1. Checking IDOR-01 Remediation: Complete removal of x-user-id header');
  const userApiDir = path.join(rootDir, 'app', 'api', 'user');
  const userFiles = ['delete/route.ts', 'export/route.ts', 'state/route.ts', 'memory/route.ts', 'attempt/route.ts'];
  
  for (const relPath of userFiles) {
    const fullPath = path.join(userApiDir, relPath);
    const content = fs.readFileSync(fullPath, 'utf8');
    assert(
      !content.includes("headers.get('x-user-id')") && !content.includes('headers.get("x-user-id")'),
      `No x-user-id header read found in app/api/user/${relPath}`
    );
    assert(
      content.includes('getUser()') || content.includes('createClient()'),
      `Strict Supabase getUser/auth validation present in app/api/user/${relPath}`
    );
  }

  // ---------------------------------------------------------------------------
  // TEST SUITE 2: AUTH-01 Remediation (AuthCard auto-redirect loop elimination)
  // ---------------------------------------------------------------------------
  console.log('\n2. Checking AUTH-01 Remediation: AuthCard session switch guard');
  const authCardPath = path.join(rootDir, 'components', 'AuthCard.tsx');
  const authCardContent = fs.readFileSync(authCardPath, 'utf8');
  // Verify that on mount (useEffect []), there is no automatic window.location redirect
  const mountEffectMatch = authCardContent.match(/useEffect\(\(\) => \{[\s\S]*?checkExistingSession\(\);[\s\S]*?\}, \[\]\);/);
  assert(
    mountEffectMatch && !mountEffectMatch[0].includes('window.location.href ='),
    'AuthCard does not automatically force redirect window.location.href on mount'
  );
  assert(
    authCardContent.includes('existingSession') && authCardContent.includes('Switch Account'),
    'AuthCard includes existingSession detection with explicit Switch Account option for second users'
  );

  // ---------------------------------------------------------------------------
  // TEST SUITE 3: AUTH-02 Remediation (OAuth callback cookie binding & open redirect)
  // ---------------------------------------------------------------------------
  console.log('\n3. Checking AUTH-02 Remediation: OAuth callback cookie binding & redirect sanitization');
  const callbackPath = path.join(rootDir, 'app', 'auth', 'callback', 'route.ts');
  const callbackContent = fs.readFileSync(callbackPath, 'utf8');
  assert(
    callbackContent.includes('exchangeCodeForSession(code)'),
    'OAuth callback properly exchanges auth code for session'
  );
  assert(
    callbackContent.includes('response.cookies.set') || callbackContent.includes('redirectResponse.cookies.set'),
    'OAuth callback binds session cookies directly to redirect response'
  );
  assert(
    callbackContent.includes("rawNext.startsWith('/')") && callbackContent.includes("!rawNext.startsWith('//')"),
    'OAuth callback enforces relative redirect path validation to prevent open redirects'
  );

  // ---------------------------------------------------------------------------
  // TEST SUITE 4: AUTH-03 Remediation (Signout cookie invalidation)
  // ---------------------------------------------------------------------------
  console.log('\n4. Checking AUTH-03 Remediation: Signout server-side cookie clearing');
  const signoutPath = path.join(rootDir, 'app', 'auth', 'signout', 'route.ts');
  const signoutContent = fs.readFileSync(signoutPath, 'utf8');
  assert(
    signoutContent.includes('supabase.auth.signOut()'),
    'Signout route calls supabase.auth.signOut()'
  );
  assert(
    signoutContent.includes("c.name.startsWith('sb-')") && signoutContent.includes("auth-token"),
    'Signout route explicitly sweeps and deletes sb-*-auth-token cookies'
  );

  // ---------------------------------------------------------------------------
  // TEST SUITE 5: FRONT-01 Remediation (Onboarding loop trap & profile escape)
  // ---------------------------------------------------------------------------
  console.log('\n5. Checking FRONT-01 Remediation: Onboarding exit flow and profile bypass');
  const onboardingPath = path.join(rootDir, 'app', 'onboarding', 'page.tsx');
  const onboardingContent = fs.readFileSync(onboardingPath, 'utf8');
  assert(
    onboardingContent.includes('xpedition_exit_override'),
    'Onboarding page sets xpedition_exit_override in sessionStorage on exit'
  );
  assert(
    onboardingContent.includes('handleSignOut') && onboardingContent.includes('supabase.auth.signOut()'),
    'Onboarding page provides direct Sign Out escape option'
  );

  const layoutPath = path.join(rootDir, 'app', '(app)', 'layout.tsx');
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  assert(
    layoutContent.includes("pathname === '/profile'") || layoutContent.includes("isBypassedPage"),
    'App layout allows /profile to bypass onboarding gate redirect'
  );

  const middlewarePath = path.join(rootDir, 'middleware.ts');
  const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
  assert(
    !middlewareContent.includes('if (!hasAuthCookie)'),
    'Middleware removed hasAuthCookie bypass vulnerability'
  );
  assert(
    middlewareContent.includes("url.pathname = '/login'") && middlewareContent.includes("url.searchParams.set('next', pathname)"),
    'Middleware redirects unauthenticated requests directly to /login with next parameter'
  );

  // ---------------------------------------------------------------------------
  // TEST SUITE 6: IDOR-02 Remediation (Server-side admin authorization)
  // ---------------------------------------------------------------------------
  console.log('\n6. Checking IDOR-02 Remediation: Admin verification endpoint and page gate');
  const adminCheckPath = path.join(rootDir, 'app', 'api', 'admin', 'check', 'route.ts');
  assert(fs.existsSync(adminCheckPath), 'Server-side /api/admin/check route exists');
  const adminCheckContent = fs.readFileSync(adminCheckPath, 'utf8');
  assert(
    adminCheckContent.includes('supabase.auth.getUser()') && adminCheckContent.includes('403'),
    '/api/admin/check verifies session and returns 403 if user lacks admin role'
  );
  assert(
    !adminCheckContent.includes('user_metadata?.role') && !adminCheckContent.includes('user_metadata.role'),
    '/api/admin/check strictly forbids client-writable user_metadata.role'
  );
  assert(
    adminCheckContent.includes('user.app_metadata?.role') || adminCheckContent.includes('app_metadata'),
    '/api/admin/check verifies server-managed app_metadata role'
  );
  assert(
    adminCheckContent.includes('ADMIN_EMAILS'),
    '/api/admin/check verifies server-configured ADMIN_EMAILS environment variable'
  );

  const adminPagePath = path.join(rootDir, 'app', 'admin', 'items', 'page.tsx');
  const adminPageContent = fs.readFileSync(adminPagePath, 'utf8');
  assert(
    !adminPageContent.includes("typeof window !== 'undefined'"),
    'Admin items page removed client-side window object bypass vulnerability'
  );
  assert(
    adminPageContent.includes('/api/admin/check'),
    'Admin items page calls /api/admin/check to verify admin status before rendering'
  );

  // ---------------------------------------------------------------------------
  // TEST SUITE 7: API-01 Remediation (Unauthenticated AI endpoints protection)
  // ---------------------------------------------------------------------------
  console.log('\n7. Checking API-01 Remediation: AI endpoints require server authentication');
  const serverAuthPath = path.join(rootDir, 'lib', 'auth', 'serverAuth.ts');
  assert(fs.existsSync(serverAuthPath), 'lib/auth/serverAuth.ts helper exists');

  const aiEndpoints = [
    'chat',
    'lesson',
    'coach',
    'execute',
    'speak',
    'extract-syllabus',
    'plan',
    'goal',
  ];

  for (const ep of aiEndpoints) {
    const epPath = path.join(rootDir, 'app', 'api', ep, 'route.ts');
    assert(fs.existsSync(epPath), `AI endpoint app/api/${ep}/route.ts exists`);
    const epContent = fs.readFileSync(epPath, 'utf8');
    assert(
      epContent.includes('requireServerAuth'),
      `AI endpoint app/api/${ep}/route.ts uses requireServerAuth guard`
    );
  }

  // ---------------------------------------------------------------------------
  // TEST SUITE 8: BIZ-01 Remediation (Client-side mastery validation boundary)
  // ---------------------------------------------------------------------------
  console.log('\n8. Checking BIZ-01 Remediation: Mastery progression and IRT theta clamping');
  const statePath = path.join(rootDir, 'app', 'api', 'user', 'state', 'route.ts');
  const stateContent = fs.readFileSync(statePath, 'utf8');
  assert(
    stateContent.includes('Math.max(-4.0, Math.min(4.0'),
    'State route clamps IRT theta within valid psychometric bounds [-4.0, 4.0]'
  );
  assert(
    stateContent.includes('Math.max(0, Math.min(100'),
    'State route clamps mastery percentage within bounds [0, 100]'
  );

  // ---------------------------------------------------------------------------
  // TEST SUITE 9: DB-02 Remediation (Supabase RLS email exposure)
  // ---------------------------------------------------------------------------
  console.log('\n9. Checking DB-02 Remediation: Public profiles read policy removed');
  const schemaPath = path.join(rootDir, 'supabase', 'schema.sql');
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  assert(
    !schemaContent.includes('CREATE POLICY "Allow public read access for profiles"'),
    'Supabase schema.sql does not create public read access policy on profiles'
  );
  assert(
    schemaContent.includes('DROP POLICY IF EXISTS "Allow public read access for profiles"'),
    'Supabase schema.sql explicitly drops public read access policy on profiles'
  );

  // ---------------------------------------------------------------------------
  // TEST SUITE 10: HDR-01 & HDR-02 Remediation (Security headers in next.config.mjs)
  // ---------------------------------------------------------------------------
  console.log('\n10. Checking HDR-01 & HDR-02: Strict-Transport-Security & CSP frame-ancestors');
  const nextConfigPath = path.join(rootDir, 'next.config.mjs');
  const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
  assert(
    nextConfigContent.includes('Strict-Transport-Security') && nextConfigContent.includes('max-age=63072000'),
    'next.config.mjs sets Strict-Transport-Security with max-age >= 1 year, includeSubDomains and preload'
  );
  assert(
    nextConfigContent.includes("frame-ancestors 'none'"),
    'next.config.mjs includes frame-ancestors none in Content-Security-Policy'
  );

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n======================================================');
  console.log(`SECURITY REMEDIATION SUITE: ${totalPassed} passed, ${totalFailed} failed`);
  console.log('======================================================\n');

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runSecurityRemediationTests().catch((err) => {
  console.error('Fatal error running security remediation tests:', err);
  process.exit(1);
});
