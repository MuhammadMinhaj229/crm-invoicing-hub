/**
 * Server-only direct database access.
 *
 * When DATABASE_URL is set (Supabase "Transaction pooler" string, port 6543)
 * server jobs talk to Postgres directly — one round trip per query, no REST hop.
 * The string bypasses row security, so it must only ever live in server
 * environment variables, never in the browser or the codebase.
 */
import type { Sql } from "postgres";

let cached: { url: string; sql: Sql } | null = null;

export function hasDirectDatabase(): boolean {
  return Boolean(process.env["DATABASE_URL"]);
}

export async function getSql(): Promise<Sql | null> {
  const url = process.env["DATABASE_URL"] ?? "";
  if (!url) return null;
  if (cached && cached.url === url) return cached.sql;
  const { default: postgres } = await import("postgres");
  // Transaction pooler: prepared statements are not supported; keep one connection per worker.
  const sql = postgres(url, { prepare: false, max: 1, idle_timeout: 20, connect_timeout: 10 });
  cached = { url, sql };
  return sql;
}

export async function probeDirectDatabase(): Promise<{ ok: boolean; detail: string }> {
  try {
    const sql = await getSql();
    if (!sql) return { ok: false, detail: "Needs DATABASE_URL (Transaction pooler string)" };
    const started = Date.now();
    await sql`select 1`;
    return { ok: true, detail: `Connected directly in ${Date.now() - started} ms` };
  } catch {
    return { ok: false, detail: "DATABASE_URL is set but the database did not answer — check the string and password" };
  }
}
