import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * SAFAR N MANZIL connects to the business's OWN Supabase project
 * (external, unmanaged). Keys arrive as environment variables:
 *   VITE_SAFAR_SUPABASE_URL      — browser + server
 *   VITE_SAFAR_SUPABASE_ANON_KEY — browser (publishable, RLS applies)
 * Server-only privileged work uses SAFAR_SUPABASE_SERVICE_ROLE_KEY
 * via process.env inside server functions — never imported here.
 */
const url = import.meta.env.VITE_SAFAR_SUPABASE_URL ?? "";
const anonKey = import.meta.env.VITE_SAFAR_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(url && anonKey);

// Placeholder values keep the client constructible while unconfigured;
// every query path checks isSupabaseConfigured first and never fires.
export const supabase: SupabaseClient = createClient(
  url || "https://unconfigured.supabase.co",
  anonKey || "unconfigured",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
