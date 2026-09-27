/**
 * Playwright global setup for the authenticated browser run: starts the local
 * GoTrue/PostgREST stub (test/support/stubSupabase.ts) that the app build was
 * pointed at via NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54400.
 */
import { startStubSupabase } from './stubSupabase';
import { STUB_PORT, LEARNER_A, LEARNER_B } from './stubIdentities';

export default async function globalSetup() {
  const stub = await startStubSupabase(STUB_PORT, [LEARNER_A, LEARNER_B]);
  return async () => {
    await stub.close();
  };
}
