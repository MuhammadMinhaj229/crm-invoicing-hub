import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { hasCmsEditorAccess } from "../../lib/page-builder/access";
import { getSupabase } from "../../lib/supabase";

/**
 * UX gate for the website studio. PostgreSQL RLS is the actual data boundary;
 * a signed-in account without an approved server-controlled role cannot edit.
 */
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const supabase = getSupabase();
    if (!supabase) throw redirect({ to: "/auth" });

    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });

    const cmsRole = data.user.app_metadata?.["cms_role"];
    if (!hasCmsEditorAccess(cmsRole)) throw redirect({ to: "/auth" });

    return { user: data.user, cmsRole };
  },
  component: Outlet,
});
