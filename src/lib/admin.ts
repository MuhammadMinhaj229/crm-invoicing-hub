/**
 * Owner account.
 *
 * One email is always treated as the owner of this console and can open
 * every section, whatever the team list says. The starter password below is
 * only used the very first time, to create that account in your own
 * database. Change it in Settings → Account as soon as you are signed in.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export const OWNER_EMAIL = "minhajmuhammad229@gmail.com";

/** Starter password used only to create the owner account the first time. */
export const OWNER_STARTER_PASSWORD = "SafarManzil@2026";

export function isOwnerEmail(email: string | null | undefined): boolean {
  return (email ?? "").trim().toLowerCase() === OWNER_EMAIL;
}

/**
 * Signs the owner in. If the account does not exist yet in the connected
 * database, it is created with the given password and then signed in.
 */
export async function signInOrCreateOwner(
  supabase: SupabaseClient,
  password: string,
): Promise<void> {
  const email = OWNER_EMAIL;
  const first = await supabase.auth.signInWithPassword({ email, password });
  if (!first.error) return;

  const invalid = /invalid login credentials/i.test(first.error.message);
  if (!invalid) throw first.error;

  const created = await supabase.auth.signUp({ email, password });
  if (created.error) throw created.error;

  const second = await supabase.auth.signInWithPassword({ email, password });
  if (second.error) {
    throw new Error(
      "Owner account created. If your database asks for email confirmation, confirm it once and sign in again.",
    );
  }
}
