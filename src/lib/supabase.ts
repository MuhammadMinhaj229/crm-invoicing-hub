import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser-safe Supabase configuration.
 *
 * Only a project URL and public/anon key belong here. Service-role keys and
 * database connection strings bypass normal client-side row security and must
 * stay in server-only environment variables; they are never accepted, returned
 * or persisted by this module.
 */
export interface SupabaseConnectionConfig {
  url: string;
  anonKey: string;
}

const STORAGE_KEY = "safar.supabase.config";
const listeners = new Set<() => void>();

export function getStoredSupabaseConfig(): SupabaseConnectionConfig | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const url = typeof parsed.url === "string" ? parsed.url.replace(/\/+$/, "") : "";
    const anonKey = typeof parsed.anonKey === "string" ? parsed.anonKey : "";

    // Remove legacy fields from prior builds, including any accidentally stored
    // serviceRoleKey. This is a one-time in-browser cleanup on the next read.
    if ("serviceRoleKey" in parsed || parsed.url !== url) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ url, anonKey }));
    }

    if (!url || !anonKey) return null;
    return { url, anonKey };
  } catch {
    return null;
  }
}

export function saveStoredSupabaseConfig(config: SupabaseConnectionConfig): void {
  const safeConfig = {
    url: config.url.replace(/\/+$/, ""),
    anonKey: config.anonKey,
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safeConfig));
  resetSupabaseClient();
  listeners.forEach((listener) => listener());
}

export function clearStoredSupabaseConfig(): void {
  window.localStorage.removeItem(STORAGE_KEY);
  resetSupabaseClient();
  listeners.forEach((listener) => listener());
}

export function onSupabaseConfigChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSupabaseConfig(): SupabaseConnectionConfig | null {
  const stored = getStoredSupabaseConfig();
  if (stored) return stored;

  // Support both the original SAFAR-prefixed variables and the names in
  // .env.example/Vercel. The values here must always be public browser keys.
  const url =
    import.meta.env["VITE_SAFAR_SUPABASE_URL"] ||
    import.meta.env["VITE_SUPABASE_URL"] ||
    "";
  const anonKey =
    import.meta.env["VITE_SAFAR_SUPABASE_ANON_KEY"] ||
    import.meta.env["VITE_SUPABASE_ANON_KEY"] ||
    "";
  return url && anonKey ? { url, anonKey } : null;
}

let client: SupabaseClient | null = null;
let clientFingerprint = "";

export function getSupabase(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config) return null;
  const fingerprint = config.url + "|" + config.anonKey;
  if (!client || clientFingerprint !== fingerprint) {
    client = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    clientFingerprint = fingerprint;
  }
  return client;
}

export function resetSupabaseClient(): void {
  client = null;
  clientFingerprint = "";
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}

/**
 * Health check used by Settings → Connections. Hits the Supabase Auth
 * health endpoint with the anon key; it verifies reachability and basic
 * project/key validity, not database table permissions or RLS policies.
 */
export async function testSupabaseConnection(
  config: SupabaseConnectionConfig,
): Promise<{ ok: boolean; latencyMs: number; message: string }> {
  const started = performance.now();
  try {
    const response = await fetch(config.url.replace(/\/+$/, "") + "/auth/v1/health", {
      headers: { apikey: config.anonKey },
    });
    const latencyMs = Math.round(performance.now() - started);
    if (response.ok) {
      return { ok: true, latencyMs, message: "Connected in " + latencyMs + " ms" };
    }
    return {
      ok: false,
      latencyMs,
      message: "Supabase answered with status " + response.status + " — check the public key",
    };
  } catch {
    return {
      ok: false,
      latencyMs: Math.round(performance.now() - started),
      message: "Could not reach this Supabase URL — check the project URL",
    };
  }
}
