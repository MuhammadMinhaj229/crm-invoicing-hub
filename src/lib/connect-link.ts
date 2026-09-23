/**
 * Device setup link.
 *
 * The database details are saved inside the browser you typed them in, so a
 * phone or a second laptop starts empty. This builds a one-tap link that
 * carries the project URL and the public key (the same key the website ships
 * with, safe to share with your own team) so any device connects instantly.
 *
 * The details sit after the "#", which browsers never send to any server.
 */
import type { SupabaseConnectionConfig } from "./supabase";

export function buildDeviceLink(config: SupabaseConnectionConfig, origin: string): string {
  const payload = btoa(JSON.stringify({ u: config.url, k: config.anonKey }));
  return `${origin.replace(/\/+$/, "")}/connect#${encodeURIComponent(payload)}`;
}

export function readDeviceLink(hash: string): SupabaseConnectionConfig | null {
  const raw = hash.replace(/^#/, "").trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(atob(decodeURIComponent(raw))) as { u?: string; k?: string };
    if (!parsed.u || !parsed.k) return null;
    return { url: parsed.u, anonKey: parsed.k };
  } catch {
    return null;
  }
}
