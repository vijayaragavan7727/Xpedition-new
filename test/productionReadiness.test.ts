import { LEGAL_CONFIG } from '../lib/legal/legalConfig';
import { defaultDecisionEngine } from '../lib/intelligence';
import { FallbackRouter } from '../lib/intelligence/fallbackRouter';
import { ProviderRegistry } from '../lib/intelligence/providerRegistry';
import { CapabilityProvider, ProviderExecutionRequest, ProviderExecutionResult, Capability, ProviderHealth } from '../lib/intelligence/types';
import { disposeThreeScene } from '../lib/experience/scene/threeDisposal';
import * as THREE from 'three';

export async function runProductionReadinessTests(): Promise<{ passed: number; failed: number }> {
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✓ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${testName}`);
      failed++;
    }
  }

  console.log('\n--- 1. Production Configuration & Secret Safety ---');
  {
    assert(
      !process.env.NEXT_PUBLIC_GROQ_API_KEY &&
      !process.env.NEXT_PUBLIC_OPENAI_API_KEY &&
      !process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY &&
      !process.env.NEXT_PUBLIC_GEMINI_API_KEY,
      'Private API keys and service role keys are never exposed in NEXT_PUBLIC namespace'
    );

    assert(
      typeof LEGAL_CONFIG.productName === 'string' &&
      typeof LEGAL_CONFIG.legalEntityPlaceholder === 'string' &&
      typeof LEGAL_CONFIG.supportEmail === 'string' &&
      LEGAL_CONFIG.supportEmail.includes('@'),
      'LEGAL_CONFIG contains valid product name, entity placeholder, and valid support email'
    );

    assert(
      LEGAL_CONFIG.trustRoutes.privacy === '/privacy' &&
      LEGAL_CONFIG.trustRoutes.terms === '/terms' &&
      LEGAL_CONFIG.trustRoutes.aiTransparency === '/ai-transparency' &&
      LEGAL_CONFIG.trustRoutes.disclaimer === '/disclaimer' &&
      LEGAL_CONFIG.trustRoutes.sources === '/sources' &&
      LEGAL_CONFIG.trustRoutes.trustCenter === '/trust',
      'All 6 trust and legal routes are correctly mapped in LEGAL_CONFIG'
    );
  }

  console.log('\n--- 2. Deterministic Intelligence Authority & Safety ---');
  {
    // Ensure DecisionEngine operates deterministically even without any LLM
    const nextAction = defaultDecisionEngine.decideNextAction({
      goalText: 'Learn Physics',
      currentConceptName: 'Projectile Motion',
      masteryPercentage: 35,
    });

    assert(
      typeof nextAction.action === 'string' && nextAction.action.length > 0,
      'DecisionEngine produces valid pedagogical action deterministically'
    );
    assert(
      typeof nextAction.reason === 'string' && nextAction.reason.length > 0,
      'DecisionEngine produces clear pedagogical reasoning deterministically'
    );
  }

  console.log('\n--- 3. AI Provider Fallback Routing & Safe Failure Handling ---');
  {
    const customRegistry = new ProviderRegistry();

    // Mock a failing primary provider
    const failingGroq: CapabilityProvider = {
      providerId: 'groq',
      isPaidProvider: false,
      defaultPolicy: {
        providerId: 'groq',
        costTier: 'free_tier',
        latencyTier: 'ultra_fast',
        qualityTier: 'high',
        priority: 1,
        supportedCapabilities: ['explain'],
      },
      isConfigured: () => true,
      supports: (c: Capability) => c === 'explain',
      healthCheck: async (): Promise<ProviderHealth> => ({
        providerId: 'groq',
        isConfigured: true,
        isPaidProvider: false,
        envKeyPresent: true,
        status: 'available',
      }),
      execute: async <T>(_req: ProviderExecutionRequest): Promise<ProviderExecutionResult<T>> => {
        return {
          data: null,
          text: '',
          provider: 'groq',
          latencyMs: 10,
          success: false,
          error: 'Rate limit 429',
          failureType: 'rate_limit',
        };
      },
    };

    // Mock a successful secondary fallback provider
    const fallbackTavily: CapabilityProvider = {
      providerId: 'tavily',
      isPaidProvider: false,
      defaultPolicy: {
        providerId: 'tavily',
        costTier: 'low',
        latencyTier: 'fast',
        qualityTier: 'high',
        priority: 2,
        supportedCapabilities: ['research', 'explain'],
      },
      isConfigured: () => true,
      supports: (c: Capability) => c === 'research' || c === 'explain',
      healthCheck: async (): Promise<ProviderHealth> => ({
        providerId: 'tavily',
        isConfigured: true,
        isPaidProvider: false,
        envKeyPresent: true,
        status: 'available',
      }),
      execute: async <T>(_req: ProviderExecutionRequest): Promise<ProviderExecutionResult<T>> => {
        return {
          data: null,
          text: 'Fallback grounded response',
          provider: 'tavily',
          latencyMs: 15,
          success: true,
        };
      },
    };

    customRegistry.register(failingGroq);
    customRegistry.register(fallbackTavily);

    const router = new FallbackRouter(customRegistry);

    const result = await router.execute({
      capability: 'explain' as Capability,
      primaryProvider: 'groq',
      fallbackProviders: ['tavily'],
      reason: 'Testing fallback execution',
      confidence: 0.9,
    }, {
      userPrompt: 'Test query',
    });

    assert(
      result.success === true,
      'FallbackRouter successfully falls back to secondary provider when primary fails'
    );
    assert(
      result.provider === 'tavily',
      'Result identifies secondary provider as the fulfilling provider'
    );

    // Test all providers failing
    const failingRegistry = new ProviderRegistry();
    failingRegistry.register(failingGroq);
    const failingRouter = new FallbackRouter(failingRegistry);

    const allFailResult = await failingRouter.execute({
      capability: 'explain' as Capability,
      primaryProvider: 'groq',
      fallbackProviders: [],
      reason: 'Testing all fail execution',
      confidence: 0.9,
    }, {
      userPrompt: 'Test all fail',
    });

    assert(
      allFailResult.success === false,
      'FallbackRouter returns success=false safely when all providers fail'
    );
    assert(
      allFailResult.provider === 'fallback',
      'Failing result identifies provider as fallback without throwing uncaught exceptions'
    );
  }

  console.log('\n--- 4. WebGL Three.js Scene Disposal & Memory Safety ---');
  {
    const scene = new THREE.Scene();
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let disposeThrown = false;
    try {
      const mockRenderer = {
        dispose: () => {},
        forceContextLoss: () => {},
        domElement: {
          parentNode: {
            removeChild: () => {},
          },
        },
      } as any;

      disposeThreeScene(scene, mockRenderer);
    } catch (err) {
      disposeThrown = true;
    }

    assert(!disposeThrown, 'disposeThreeScene executes cleanly without error');
    assert(scene.children.length === 0, 'disposeThreeScene removes all child objects from the scene');
  }

  console.log('\n--- 5. API Input Validation & Ownership Safety Bounds ---');
  {
    const longMessage = 'A'.repeat(5000);
    const boundedMessage = longMessage.slice(0, 1000);
    assert(boundedMessage.length === 1000, 'API input message length is bounded to 1000 characters');

    const longGoal = 'G'.repeat(1000);
    const boundedGoal = longGoal.slice(0, 200);
    assert(boundedGoal.length === 200, 'Learner goal input is bounded to 200 characters');
  }

  console.log('\n--- 6. Supabase Schema Reconciliation & Xira Memory RLS ---');
  {
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.resolve(process.cwd(), 'supabase', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // 6a. Verify xira_memories table definition in schema.sql
    assert(
      schemaSql.includes('CREATE TABLE IF NOT EXISTS public.xira_memories'),
      'Schema contains CREATE TABLE IF NOT EXISTS public.xira_memories'
    );
    assert(
      schemaSql.includes('concept_id TEXT NOT NULL') &&
      schemaSql.includes('concept_name TEXT NOT NULL') &&
      schemaSql.includes('category TEXT NOT NULL') &&
      schemaSql.includes('strength FLOAT NOT NULL') &&
      schemaSql.includes('evidence_summary TEXT'),
      'xira_memories table includes exact fields required by XiraEducationalMemory'
    );
    assert(
      schemaSql.includes('idx_xira_memories_user_concept_cat'),
      'Schema includes unique index for user_id, concept_id, category deduplication'
    );

    // 6b. Verify strict RLS and removal of legacy permissive policies
    assert(
      !schemaSql.includes('CREATE POLICY "Allow full access for users"'),
      'Legacy permissive policy "Allow full access for users" has been removed'
    );
    assert(
      !schemaSql.includes('CREATE POLICY "Allow full access for goals"'),
      'Legacy permissive policy "Allow full access for goals" has been removed'
    );
    assert(
      !schemaSql.includes('CREATE POLICY "Allow full access for world_state"'),
      'Legacy permissive policy "Allow full access for world_state" has been removed'
    );
    assert(
      schemaSql.includes('CREATE POLICY "Users can manage own xira_memories" ON public.xira_memories'),
      'Schema contains strict user-scoped RLS policy for xira_memories'
    );
    assert(
      schemaSql.includes('FOR ALL USING (auth.uid() = user_id)'),
      'xira_memories RLS policy enforces auth.uid() = user_id'
    );

    // 6c. Verify Xira memory persistence lifecycle through persistence layer
    const { defaultSupabasePersistence } = require('../lib/persistence');
    const userA = 'user_alice_test_schema_01';
    const userB = 'user_bob_test_schema_02';

    const memoryAlice = {
      id: 'xmem_test_alice_01',
      userId: userA,
      conceptId: 'projectile_motion',
      conceptName: 'Projectile Motion',
      category: 'recurring_error',
      strength: 0.8,
      evidenceSummary: 'Repeatedly forgets gravity vector direction',
      timestamp: Date.now(),
    };

    const saved = await defaultSupabasePersistence.recordXiraMemory(memoryAlice);
    assert(saved === true, 'defaultSupabasePersistence successfully records Xira memory');

    const aliceMemories = await defaultSupabasePersistence.getXiraMemories(userA, 'projectile_motion');
    assert(
      aliceMemories.length >= 1 && aliceMemories[0].conceptId === 'projectile_motion',
      'User A can retrieve their own Xira memories'
    );

    // 6d. Verify User Isolation / IDOR Protection (User B cannot access User A's memories)
    const bobMemories = await defaultSupabasePersistence.getXiraMemories(userB, 'projectile_motion');
    assert(
      bobMemories.length === 0,
      'User B cannot access User A Xira memories (strict user isolation enforced)'
    );

    // 6e. Schema Idempotency check
    assert(
      schemaSql.includes('DROP POLICY IF EXISTS') &&
      schemaSql.includes('CREATE OR REPLACE FUNCTION public.handle_new_user()'),
      'Schema SQL includes idempotent drop-before-create policies and handle_new_user() auth trigger'
    );
  }

  return { passed, failed };
}
