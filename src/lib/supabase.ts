import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * SAFAR N MANZIL connects to the business's OWN Supabase project
 * (external, unmanaged). Connection details are entered by the owner
 * in Settings → Connections and stored in this browser; environment
 * variables act as an optional fallback. The service-role key is kept
 * for server-side privileged jobs only and is never used by the
 * browser client — all browser queries run under RLS as the
 * signed-in team member.
 */
export interface SupabaseConnectionConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

const STORAGE_KEY = "safar.supabase.config";
const listeners = new Set<() => void>();

export function getStoredSupabaseConfig(): SupabaseConnectionConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SupabaseConnectionConfig>;
    if (!parsed.url || !parsed.anonKey) return null;
    return {
      url: parsed.url.replace(/\/+$/, ""),
      anonKey: parsed.anonKey,
      serviceRoleKey: parsed.serviceRoleKey || undefined,
    };
  } catch {
    return null;
  }
}

export function saveStoredSupabaseConfig(config: SupabaseConnectionConfig): void {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      url: config.url.replace(/\/+$/, ""),
      anonKey: config.anonKey,
      serviceRoleKey: config.serviceRoleKey || undefined,
    }),
  );
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
  const url = import.meta.env["VITE_SAFAR_SUPABASE_URL"] ?? "";
  const anonKey = import.meta.env["VITE_SAFAR_SUPABASE_ANON_KEY"] ?? "";
  return url && anonKey ? { url, anonKey } : null;
}

let client: SupabaseClient | null = null;
let clientFingerprint = "";

export function getSupabase(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config) return null;
  const fingerprint = `${config.url}|${config.anonKey}`;
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
 * health endpoint with the anon key; it answers without a session and
 * proves both URL and key are valid.
 */
export async function testSupabaseConnection(
  config: SupabaseConnectionConfig,
): Promise<{ ok: boolean; latencyMs: number; message: string }> {
  const started = performance.now();
  try {
    const response = await fetch(`${config.url.replace(/\/+$/, "")}/auth/v1/health`, {
      headers: { apikey: config.anonKey },
    });
    const latencyMs = Math.round(performance.now() - started);
    if (response.ok) {
      return { ok: true, latencyMs, message: `Connected in ${latencyMs} ms` };
    }
    return {
      ok: false,
      latencyMs,
      message: `Supabase answered with status ${response.status} — check the anon key`,
    };
  } catch {
    return {
      ok: false,
      latencyMs: Math.round(performance.now() - started),
      message: "Could not reach this Supabase URL — check the project URL",
    };
  }
}
