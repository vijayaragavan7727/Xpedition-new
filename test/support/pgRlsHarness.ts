/**
 * Real-PostgreSQL RLS harness.
 *
 * Starts (or reuses) a local PostgreSQL 16 server, creates a fresh database,
 * loads the Supabase auth shim (test/support/supabase-auth-shim.sql) and the
 * app's real schema (supabase/schema.sql), then runs SQL AS a given learner the
 * same way PostgREST does: `SET LOCAL ROLE authenticated|anon` plus the JWT
 * claims in `request.jwt.claims`. This exercises the actual RLS policies in a
 * real database engine. It is not hosted Supabase (no GoTrue / PostgREST).
 */

import { execFileSync, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '..', '..');

export interface PgTarget {
  host: string; // socket dir
  port: string;
  db: string;
}

export type Actor = { kind: 'user'; id: string } | { kind: 'anon' } | { kind: 'superuser' };

export interface SqlResult {
  ok: boolean;
  rows: string[];
  error?: string;
  sqlstate?: string;
}

function findPgBin(): string | null {
  const candidates = ['/usr/lib/postgresql/16/bin', '/usr/lib/postgresql/17/bin', '/usr/lib/postgresql/15/bin'];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'pg_ctl')) && fs.existsSync(path.join(dir, 'initdb'))) return dir;
  }
  return null;
}

function hasPsql(): boolean {
  return spawnSync('psql', ['--version']).status === 0;
}

function asPostgres(cmd: string, args: string[]) {
  const isRoot = typeof process.getuid === 'function' && process.getuid() === 0;
  if (isRoot) return execFileSync('runuser', ['-u', 'postgres', '--', cmd, ...args], { stdio: 'pipe' });
  return execFileSync(cmd, args, { stdio: 'pipe' });
}

/** Returns a reason string when a real PostgreSQL cannot be used here. */
export function pgUnavailableReason(): string | null {
  if (process.env.XP_PG_SOCKET_DIR && process.env.XP_PG_PORT) return hasPsql() ? null : 'psql client not installed';
  if (!hasPsql()) return 'psql client not installed';
  if (!findPgBin()) return 'PostgreSQL server binaries (initdb/pg_ctl) not installed';
  return null;
}

export function ensureServer(): { host: string; port: string } {
  if (process.env.XP_PG_SOCKET_DIR && process.env.XP_PG_PORT) {
    return { host: process.env.XP_PG_SOCKET_DIR, port: process.env.XP_PG_PORT };
  }
  const bin = findPgBin()!;
  const base = process.env.XP_PG_BASE_DIR || '/var/tmp/xp-pg-test';
  const port = process.env.XP_PG_TEST_PORT || '54339';
  const dataDir = path.join(base, 'data');
  fs.mkdirSync(base, { recursive: true });
  try {
    execFileSync('chown', ['postgres', base], { stdio: 'pipe' });
  } catch {
    /* not root: the current user owns it */
  }
  if (!fs.existsSync(path.join(dataDir, 'PG_VERSION'))) {
    asPostgres(path.join(bin, 'initdb'), ['-D', dataDir, '-A', 'trust', '-U', 'postgres']);
  }
  const ready = spawnSync('psql', ['-h', base, '-p', port, '-U', 'postgres', '-Atc', 'select 1']);
  if (ready.status !== 0) {
    asPostgres(path.join(bin, 'pg_ctl'), [
      '-D', dataDir, '-o', `-p ${port} -k ${base} -c listen_addresses=''`, '-l', path.join(base, 'log'), '-w', 'start',
    ]);
  }
  return { host: base, port };
}

function psql(target: { host: string; port: string; db?: string }, sql: string): SqlResult {
  const res = spawnSync(
    'psql',
    ['-h', target.host, '-p', target.port, '-U', 'postgres', '-d', target.db || 'postgres', '-X', '-q', '-At',
      '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=verbose'],
    { input: `\\set VERBOSITY verbose\n${sql}`, encoding: 'utf8' }
  );
  const rows = (res.stdout || '').split('\n').filter((l) => l.length > 0);
  if (res.status === 0) return { ok: true, rows };
  const err = res.stderr || '';
  const m = err.match(/ERROR:\s+([0-9A-Z]{5}):/);
  return { ok: false, rows, error: err.trim().split('\n')[0], sqlstate: m?.[1] };
}

export function createDatabase(server: { host: string; port: string }, name: string): PgTarget {
  const safe = name.replace(/[^a-z0-9_]/g, '_');
  psql(server, `DROP DATABASE IF EXISTS ${safe};`);
  const created = psql(server, `CREATE DATABASE ${safe};`);
  if (!created.ok) throw new Error(`createdb failed: ${created.error}`);
  const target = { ...server, db: safe };
  for (const file of ['test/support/supabase-auth-shim.sql', 'supabase/schema.sql']) {
    const loaded = psql(target, fs.readFileSync(path.join(ROOT, file), 'utf8'));
    if (!loaded.ok) throw new Error(`loading ${file} failed: ${loaded.error}`);
  }
  return target;
}

export function dropDatabase(server: { host: string; port: string }, db: string): void {
  psql(server, `DROP DATABASE IF EXISTS ${db};`);
}

/**
 * Runs `sql` in one transaction as `actor`, exactly as PostgREST would:
 * the request role plus verified JWT claims. Superuser bypasses RLS (setup only).
 */
export function runAs(target: PgTarget, actor: Actor, sql: string): SqlResult {
  let prelude = '';
  if (actor.kind === 'user') {
    const claims = JSON.stringify({ sub: actor.id, role: 'authenticated' }).replace(/'/g, "''");
    prelude = `SET LOCAL ROLE authenticated;\nSELECT set_config('request.jwt.claims', '${claims}', true) \\g /dev/null\n`;
  } else if (actor.kind === 'anon') {
    prelude = `SET LOCAL ROLE anon;\nSELECT set_config('request.jwt.claims', '{"role":"anon"}', true) \\g /dev/null\n`;
  }
  return psql(target, `BEGIN;\n${prelude}${sql}\nCOMMIT;`);
}
