import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AppShell } from "../../components/app-shell";
import { getSupabase } from "../../lib/supabase";

/**
 * Auth gate for the whole CRM subtree. When the owner has not connected
 * the database yet, the shell still renders (with a setup banner) so the
 * Settings → Connections screen stays reachable.
 */
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const supabase = getSupabase();
    if (!supabase) return { user: null };
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
