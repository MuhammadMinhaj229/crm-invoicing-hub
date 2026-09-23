import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Globe,
  Handshake,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { isSupabaseConfigured, getSupabase } from "../lib/supabase";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/website", label: "Website", icon: Globe },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/vendors", label: "Vendors & Partners", icon: Handshake },
  { to: "/tools", label: "Tools", icon: Wrench },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-primary text-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent"
            }`}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-display text-sm font-bold text-primary-foreground">
        S
      </div>
      <div className="leading-tight">
        <p className="font-display text-sm font-bold text-foreground">SAFAR N MANZIL</p>
        <p className="text-[11px] text-muted-foreground">We do. We assist. We connect.</p>
      </div>
    </div>
  );
}

function SignOutButton() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  if (!isSupabaseConfigured()) return null;
  return (
    <button
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await getSupabase()?.auth.signOut();
        } finally {
          navigate({ to: "/auth", replace: true });
        }
      }}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground disabled:opacity-50"
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </button>
  );
}

function SetupBanner() {
  if (isSupabaseConfigured()) return null;
  return (
    <div className="border-b border-border bg-accent px-4 py-2.5 text-center text-sm text-accent-foreground">
      Database not connected yet.{" "}
      <Link to="/settings" className="font-semibold underline underline-offset-2">
        Open Settings → Connections
      </Link>{" "}
      to paste your Supabase keys and bring the CRM to life.
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="py-5">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto px-3">
          <NavLinks />
        </div>
        <div className="border-t border-sidebar-border p-3">
          <SignOutButton />
        </div>
      </aside>

      {/* Mobile top bar + drawer */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-sidebar px-4 py-3 lg:hidden">
          <Brand />
          <button
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 hover:bg-sidebar-accent"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>
        {mobileOpen ? (
          <div className="fixed inset-0 z-30 lg:hidden">
            <div
              className="absolute inset-0 bg-foreground/30"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-sidebar shadow-xl">
              <div className="flex items-center justify-between border-b border-sidebar-border px-3 py-4">
                <Brand />
                <button
                  aria-label="Close menu"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg p-2 hover:bg-sidebar-accent"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                <NavLinks onNavigate={() => setMobileOpen(false)} />
              </div>
              <div className="border-t border-sidebar-border p-3">
                <SignOutButton />
              </div>
            </div>
          </div>
        ) : null}

        <SetupBanner />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
