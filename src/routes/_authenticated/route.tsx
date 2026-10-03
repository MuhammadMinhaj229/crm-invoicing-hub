import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { getSupabase } from "../../lib/supabase";

/** Sign-in gate for the website builder. */
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const supabase = getSupabase();
    if (!supabase) throw redirect({ to: "/auth" });
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: Outlet,
});
