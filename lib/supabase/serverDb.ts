/**
 * Server-only registration of the request-scoped Supabase client.
 *
 * Import this module (for its side effect) from any API route that reads or
 * writes learner tables through shared persistence code. The client is created
 * per call from the incoming request's auth cookies with the ANON key, so all
 * database access is authorized by RLS as the authenticated learner. There is
 * no service-role key anywhere in this code path.
 */

import { registerServerDbProvider } from './dbContext';
import { createClient } from './server';

registerServerDbProvider(() => createClient());

export { getLearnerDb } from './dbContext';
