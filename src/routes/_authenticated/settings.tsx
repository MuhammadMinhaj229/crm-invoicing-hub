import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ClipboardCopy,
  Database,
  ExternalLink,
  Loader2,
  PlugZap,
  Trash2,
  UserPlus,
  XCircle,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { PageHeader } from "../../components/app-shell";
import { useWorkspaceSettings } from "../../hooks/use-workspace-settings";
import {
  INTEGRATIONS,
  getIntegrationValues,
  getToolUrl,
  isIntegrationConfigured,
  removeIntegrationValues,
  saveIntegrationValues,
  testHttpEndpoint,
  type IntegrationDefinition,
} from "../../lib/connections";
import {
  ACCESS_SECTIONS,
  getTeam,
  loadSharedTeam,
  saveSharedTeam,
  type TeamMember,
} from "../../lib/team";
import { buildDeviceLink } from "../../lib/connect-link";
import { OWNER_EMAIL } from "../../lib/admin";
import { getSupabase } from "../../lib/supabase";
import {
  clearStoredSupabaseConfig,
  getStoredSupabaseConfig,
  isSupabaseConfigured,
  saveStoredSupabaseConfig,
  testSupabaseConnection,
} from "../../lib/supabase";
import { DEFAULT_SCORING, loadScoring, saveScoring, type ScoringConfig } from "../../lib/scoring";
import { toast } from "sonner";
import foundationSql from "../../lib/foundation.sql?raw";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — SAFAR N MANZIL" },
      { name: "description", content: "Connections, API keys and access control for the business console." },
      { property: "og:title", content: "Settings — SAFAR N MANZIL" },
      { property: "og:description", content: "Connections, API keys and access control." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

type TestResult = { ok: boolean; message: string } | null;

function StatusBadge({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-foreground">
      <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Connected
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
      <XCircle className="h-3.5 w-3.5" /> Not connected
    </span>
  );
}

function DatabaseCard() {
  const queryClient = useQueryClient();
  const stored = getStoredSupabaseConfig();
  const [url, setUrl] = useState(stored?.url ?? "");
  const [anonKey, setAnonKey] = useState(stored?.anonKey ?? "");
  const [serviceRoleKey, setServiceRoleKey] = useState(stored?.serviceRoleKey ?? "");
  const [result, setResult] = useState<TestResult>(null);
  const [copied, setCopied] = useState(false);
  const [showSql, setShowSql] = useState(false);

  const connect = useMutation({
    mutationFn: async () => {
      const config: { url: string; anonKey: string; serviceRoleKey?: string } = {
        url: url.trim(),
        anonKey: anonKey.trim(),
      };
      if (serviceRoleKey.trim()) config.serviceRoleKey = serviceRoleKey.trim();
      const test = await testSupabaseConnection(config);
      if (!test.ok) throw new Error(test.message);
      saveStoredSupabaseConfig(config);
      return test;
    },
    onSuccess: (test) => {
      setResult({ ok: true, message: test.message });
      queryClient.clear();
    },
    onError: (err) => {
      setResult({ ok: false, message: err instanceof Error ? err.message : "Connection failed" });
    },
  });

  function handleConnect(event: FormEvent) {
    event.preventDefault();
    setResult(null);
    connect.mutate();
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
            <Database className="h-5 w-5 text-accent-foreground" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              Database (Supabase)
            </h2>
            <p className="text-sm text-muted-foreground">
              The source of truth for customers, invoices, vendors and the website.
            </p>
          </div>
        </div>
        <StatusBadge ok={Boolean(stored)} />
      </div>

      <form onSubmit={handleConnect} className="mt-5 grid grid-cols-1 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Project URL</label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            placeholder="https://yourproject.supabase.co"
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Anon (public) key
          </label>
          <input
            value={anonKey}
            onChange={(e) => setAnonKey(e.target.value)}
            required
            type="password"
            placeholder="eyJhbGciOi…"
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Service-role key <span className="font-normal text-muted-foreground">(optional — server jobs only)</span>
          </label>
          <input
            value={serviceRoleKey}
            onChange={(e) => setServiceRoleKey(e.target.value)}
            type="password"
            placeholder="eyJhbGciOi…"
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Never used by the browser. Reserved for privileged background jobs.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background p-3 text-sm">
          <p className="font-medium text-foreground">Faster direct link (Transaction pooler)</p>
          <p className="mt-1 text-muted-foreground">
            In Supabase press <b>Connect</b> → <b>Transaction pooler</b> and copy the string
            (it ends in <code>:6543/postgres</code>). Put your database password in it and add it as{" "}
            <code>DATABASE_URL</code> in your hosting settings (Vercel → Environment Variables).
            It is never typed here: anyone holding it can read every table. Server jobs like
            incoming WhatsApp messages then save directly and faster. Check it under Server keys below.
          </p>
        </div>

        {result ? (
          <p
            className={`rounded-lg px-3 py-2 text-sm ${
              result.ok
                ? "bg-primary/15 text-foreground"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {result.message}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={connect.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {connect.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PlugZap className="h-4 w-4" />
            )}
            Save & test connection
          </button>
          {stored ? (
            <button
              type="button"
              onClick={() => {
                clearStoredSupabaseConfig();
                setUrl("");
                setAnonKey("");
                setServiceRoleKey("");
                setResult(null);
                queryClient.clear();
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
            >
              <Trash2 className="h-4 w-4" /> Disconnect
            </button>
          ) : null}
          {stored ? (
            <button
              type="button"
              onClick={async () => {
                const link = buildDeviceLink(stored, window.location.origin);
                try {
                  await navigator.clipboard.writeText(link);
                  toast.success("Setup link copied — open it once on your phone");
                } catch {
                  window.prompt("Copy this link and open it on the other device", link);
                }
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              <ClipboardCopy className="h-4 w-4" /> Copy setup link for another device
            </button>
          ) : null}
        </div>
        {stored ? (
          <p className="text-xs text-muted-foreground">
            These details are kept on this device only. Open that link once on your phone or
            second computer and it connects there too — no re-typing. Share it only with your
            own team.
          </p>
        ) : null}
      </form>

      <div className="mt-6 rounded-lg border border-dashed border-border bg-background p-4">
        <p className="text-sm font-medium text-foreground">First-time database setup</p>
        <p className="mt-1 text-sm text-muted-foreground">
          After connecting, create the tables once: open your Supabase dashboard → SQL Editor →
          New query → paste the setup script → Run. It creates every table, role and security
          policy the CRM needs.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Then sign up once at /auth and make yourself the owner with this query (use your email):
        </p>
        <pre className="mt-2 overflow-auto rounded-lg bg-muted p-3 text-xs text-foreground">{`insert into public.user_roles (user_id, role)
select id, 'super_admin' from auth.users where email = 'YOUR@EMAIL.COM'
on conflict do nothing;`}</pre>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(foundationSql);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <ClipboardCopy className="h-4 w-4" />
            {copied ? "Copied!" : "Copy setup SQL"}
          </button>
          <button
            onClick={() => setShowSql(!showSql)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {showSql ? "Hide script" : "Preview script"}
          </button>
        </div>
        {showSql ? (
          <pre className="mt-3 max-h-72 overflow-auto rounded-lg bg-foreground p-4 text-xs text-background">
            {foundationSql}
          </pre>
        ) : null}
      </div>
    </section>
  );
}

function IntegrationCard({ definition }: { definition: IntegrationDefinition }) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>(() =>
    getIntegrationValues(definition.id),
  );
  const [result, setResult] = useState<TestResult>(null);
  const [testing, setTesting] = useState(false);
  const configured = isIntegrationConfigured(definition);

  useEffect(() => {
    setValues(getIntegrationValues(definition.id));
  }, [definition.id]);

  function handleSave(event: FormEvent) {
    event.preventDefault();
    saveIntegrationValues(definition.id, values);
    setOpen(false);
    setResult({ ok: true, message: "Saved." });
  }

  async function handleTest() {
    const baseUrl = values["baseUrl"] ?? values["url"] ?? "";
    if (!baseUrl) return;
    setTesting(true);
    const test = await testHttpEndpoint(baseUrl, values["apiKey"]);
    setResult({ ok: test.ok, message: test.message });
    setTesting(false);
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-semibold text-foreground">
            {definition.name}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{definition.description}</p>
        </div>
        <StatusBadge ok={configured} />
      </div>

      {result ? (
        <p
          className={`mt-3 rounded-lg px-3 py-2 text-sm ${
            result.ok ? "bg-primary/15 text-foreground" : "bg-destructive/10 text-destructive"
          }`}
        >
          {result.message}
        </p>
      ) : null}

      {open ? (
        <form onSubmit={handleSave} className="mt-4 space-y-3">
          {definition.fields.map((field) => (
            <div key={field.key}>
              <label className="mb-1 block text-sm font-medium text-foreground">
                {field.label}
                {field.optional ? (
                  <span className="font-normal text-muted-foreground"> (optional)</span>
                ) : null}
              </label>
              <input
                type={field.secret ? "password" : "text"}
                required={!field.optional}
                placeholder={field.placeholder}
                value={values[field.key] ?? ""}
                onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </div>
          ))}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {getToolUrl(definition.id) && definition.id !== "supabase" ? (
            <a
              href={getToolUrl(definition.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Open tool <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {configured ? "Edit link" : "Add link"}
          </button>
          {configured ? (
            <>
              <button
                onClick={handleTest}
                disabled={testing}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
              >
                {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Test
              </button>
              <button
                onClick={() => {
                  removeIntegrationValues(definition.id);
                  setValues({});
                  setResult(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            </>
          ) : null}
        </div>
      )}
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Shared little editors                                             */
/* ---------------------------------------------------------------- */

const fieldClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      {children}
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded-lg border border-input bg-background p-1"
          aria-label={label}
        />
        <input value={value} onChange={(e) => onChange(e.target.value)} className={fieldClass} />
      </div>
    </Field>
  );
}

function ListEditor({
  label,
  hint,
  items,
  onChange,
}: {
  label: string;
  hint: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  return (
    <Field label={label} hint={hint}>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground"
          >
            {item}
            <button
              type="button"
              aria-label={`Remove ${item}`}
              onClick={() => onChange(items.filter((value) => value !== item))}
              className="opacity-60 hover:opacity-100"
            >
              <XCircle className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add an option…"
          className={fieldClass}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const value = draft.trim();
              if (value && !items.includes(value)) onChange([...items, value]);
              setDraft("");
            }
          }}
        />
        <button
          type="button"
          onClick={() => {
            const value = draft.trim();
            if (value && !items.includes(value)) onChange([...items, value]);
            setDraft("");
          }}
          className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
        >
          Add
        </button>
      </div>
    </Field>
  );
}

/* ---------------------------------------------------------------- */
/* Tabs                                                              */
/* ---------------------------------------------------------------- */

function ConnectionsTab() {
  const otherIntegrations = INTEGRATIONS.filter((i) => i.id !== "supabase");
  return (
    <div className="space-y-4">
      <DatabaseCard />
      <h2 className="pt-4 font-display text-lg font-semibold text-foreground">
        Tools & integrations
      </h2>
      {otherIntegrations.map((definition) => (
        <IntegrationCard key={definition.id} definition={definition} />
      ))}
    </div>
  );
}

function AppearanceTab() {
  const { settings, update, reset } = useWorkspaceSettings();
  const { theme, branding } = settings;

  return (
    <div className="space-y-4">
      <Panel
        title="Brand identity"
        description="Shown in the sidebar, sign-in screen and every page header."
      >
        <Field label="Business name">
          <input
            value={branding.name}
            onChange={(e) => update({ branding: { ...branding, name: e.target.value } })}
            className={fieldClass}
          />
        </Field>
        <Field label="Tagline">
          <input
            value={branding.tagline}
            onChange={(e) => update({ branding: { ...branding, tagline: e.target.value } })}
            className={fieldClass}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Logo style"
            hint="Drawn mark stays sharp at any size and animates on hover."
          >
            <select
              value={branding.logoStyle}
              onChange={(e) =>
                update({
                  branding: {
                    ...branding,
                    logoStyle: e.target.value as "lockup" | "image",
                  },
                })
              }
              className={fieldClass}
            >
              <option value="lockup">Drawn mark (plane + script name + circled N)</option>
              <option value="image">Logo picture</option>
            </select>
          </Field>
          <Field label="Monogram letter" hint="Used when no logo image is set.">

            <input
              value={branding.initial}
              maxLength={2}
              onChange={(e) => update({ branding: { ...branding, initial: e.target.value } })}
              className={fieldClass}
            />
          </Field>
          <Field label="Logo image URL" hint="Optional — overrides the monogram.">
            <input
              value={branding.logoUrl}
              placeholder="https://…"
              onChange={(e) => update({ branding: { ...branding, logoUrl: e.target.value } })}
              className={fieldClass}
            />
          </Field>
          <Field label="Favicon image URL" hint="Optional browser-tab icon for your deployed website.">
            <input
              value={branding.faviconUrl}
              placeholder="https://…"
              onChange={(e) => update({ branding: { ...branding, faviconUrl: e.target.value } })}
              className={fieldClass}
            />
          </Field>
        </div>
      </Panel>

      <Panel
        title="Colour palette"
        description="Every colour in the console updates live as you change these."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <ColorField
            label="Primary"
            value={theme.primary}
            onChange={(primary) => update({ theme: { ...theme, primary } })}
          />
          <ColorField
            label="Secondary"
            value={theme.secondary}
            onChange={(secondary) => update({ theme: { ...theme, secondary } })}
          />
          <ColorField
            label="Accent"
            value={theme.accent}
            onChange={(accent) => update({ theme: { ...theme, accent } })}
          />
          <ColorField
            label="Canvas background"
            value={theme.background}
            onChange={(background) => update({ theme: { ...theme, background } })}
          />
          <ColorField
            label="Text colour"
            value={theme.foreground}
            onChange={(foreground) => update({ theme: { ...theme, foreground } })}
          />
        </div>
      </Panel>

      <Panel title="Layout feel" description="Corner softness, spacing and sidebar tone.">
        <Field label={`Corner radius — ${theme.radius}px`}>
          <input
            type="range"
            min={0}
            max={24}
            value={theme.radius}
            onChange={(e) => update({ theme: { ...theme, radius: Number(e.target.value) } })}
            className="w-full accent-[var(--primary)]"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Density">
            <select
              value={theme.density}
              onChange={(e) =>
                update({ theme: { ...theme, density: e.target.value as "comfortable" | "compact" } })
              }
              className={fieldClass}
            >
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </select>
          </Field>
          <Field label="Sidebar tone">
            <select
              value={theme.sidebarStyle}
              onChange={(e) =>
                update({ theme: { ...theme, sidebarStyle: e.target.value as "warm" | "plain" } })
              }
              className={fieldClass}
            >
              <option value="warm">Warm</option>
              <option value="plain">Plain white</option>
            </select>
          </Field>
          <Field label="Button style">
            <select
              value={theme.buttonStyle}
              onChange={(e) =>
                update({ theme: { ...theme, buttonStyle: e.target.value as "soft" | "square" } })
              }
              className={fieldClass}
            >
              <option value="soft">Soft corners</option>
              <option value="square">Crisp corners</option>
            </select>
          </Field>
        </div>
        <Field label={`Heading scale — ${theme.headingScale}%`}>
          <input
            type="range"
            min={90}
            max={110}
            value={theme.headingScale}
            onChange={(e) => update({ theme: { ...theme, headingScale: Number(e.target.value) } })}
            className="w-full accent-[var(--primary)]"
          />
        </Field>
        <div className="rounded-lg border border-border bg-background p-5">
          <p className="text-xs font-bold uppercase text-primary">Live preview</p>
          <p className="site-display mt-2 font-display text-2xl font-bold text-foreground">We do. We assist. We connect.</p>
          <p className="mt-2 text-sm text-muted-foreground">Sora headings, Manrope body copy, and your approved palette.</p>
          <button type="button" className="brand-button mt-4 bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Primary action</button>
        </div>
        <div className="border-t border-border pt-5">
          <h3 className="font-display text-base font-semibold text-foreground">Website presentation</h3>
          <p className="mt-1 text-sm text-muted-foreground">Choose how published website sections are presented.</p>
          <div className="mt-4 space-y-3">
          <Field label="Service section layout">
            <select
              value={settings.websiteAppearance.sectionStyle}
              onChange={(e) => update({ websiteAppearance: { ...settings.websiteAppearance, sectionStyle: e.target.value as "zigzag" | "grid" } })}
              className={fieldClass}
            >
              <option value="zigzag">Story-led alternating sections</option>
              <option value="grid">Compact service grid</option>
            </select>
          </Field>
          {([
            ["showHeroHighlights", "Hero trust highlights"],
            ["showTrustSection", "Accountability section"],
            ["showProcessSection", "How it works"],
            ["showFaqSection", "Frequently asked questions"],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground">
              {label}
              <input
                type="checkbox"
                checked={settings.websiteAppearance[key]}
                onChange={(e) => update({ websiteAppearance: { ...settings.websiteAppearance, [key]: e.target.checked } })}
                className="h-4 w-4 accent-[var(--primary)]"
              />
            </label>
          ))}
          </div>
        </div>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
        >
          Restore SAFAR defaults
        </button>
      </Panel>
    </div>
  );
}

function WorkspaceTab() {
  const { settings, update } = useWorkspaceSettings();
  return (
    <div className="space-y-4">
      <Panel
        title="Menu"
        description="Rename any section or hide the ones you do not use. Settings always stays visible."
      >
        {settings.nav.map((item, index) => (
          <div key={item.id} className="flex items-center gap-3">
            <input
              value={item.label}
              onChange={(e) => {
                const nav = [...settings.nav];
                nav[index] = { ...item, label: e.target.value };
                update({ nav });
              }}
              className={fieldClass}
            />
            <label className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={item.enabled}
                disabled={item.id === "/settings"}
                onChange={(e) => {
                  const nav = [...settings.nav];
                  nav[index] = { ...item, enabled: e.target.checked };
                  update({ nav });
                }}
                className="h-4 w-4 accent-[var(--primary)]"
              />
              Show
            </label>
          </div>
        ))}
      </Panel>

      <Panel title="Money & language" description="Used for every amount shown in the console.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Currency code" hint="INR, AED, SAR, QAR, KWD, OMR, BHD, USD…">
            <input
              value={settings.currency}
              onChange={(e) => update({ currency: e.target.value.toUpperCase() })}
              className={fieldClass}
            />
          </Field>
          <Field label="Number & date format" hint="e.g. en-IN, en-AE, ar-SA">
            <input
              value={settings.locale}
              onChange={(e) => update({ locale: e.target.value })}
              className={fieldClass}
            />
          </Field>
        </div>
      </Panel>
    </div>
  );
}

function BusinessRulesTab() {
  const { settings, update } = useWorkspaceSettings();
  const { retention } = settings;

  return (
    <div className="space-y-4">
      <Panel
        title="Lead & customer vocabulary"
        description="These options drive the dropdowns across Customers, Vendors and Requests."
      >
        <ListEditor
          label="Where leads come from"
          hint="Each lead records exactly one of these as its origin."
          items={settings.leadSources}
          onChange={(leadSources) => update({ leadSources })}
        />
        <ListEditor
          label="Lead statuses"
          hint="The pipeline a lead moves through before conversion."
          items={settings.leadStatuses}
          onChange={(leadStatuses) => update({ leadStatuses })}
        />
        <ListEditor
          label="Customer lifecycle stages"
          hint="Stage shown on every customer profile."
          items={settings.lifecycleStages}
          onChange={(lifecycleStages) => update({ lifecycleStages })}
        />
        <ListEditor
          label="Service categories"
          hint="Used for service interest, provider trades and demand reporting."
          items={settings.serviceCategories}
          onChange={(serviceCategories) => update({ serviceCategories })}
        />
      </Panel>

      <Panel
        title="Retention & churn rules"
        description="How long a customer can stay quiet before the team is prompted to reach out."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="At risk after (days of silence)">
            <input
              type="number"
              min={1}
              value={retention.defaultInactivityDays}
              onChange={(e) =>
                update({
                  retention: { ...retention, defaultInactivityDays: Number(e.target.value) },
                })
              }
              className={fieldClass}
            />
          </Field>
          <Field label="Treat as churned after (days)">
            <input
              type="number"
              min={1}
              value={retention.churnedAfterDays}
              onChange={(e) =>
                update({ retention: { ...retention, churnedAfterDays: Number(e.target.value) } })
              }
              className={fieldClass}
            />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={retention.autoFollowUpTask}
            onChange={(e) =>
              update({ retention: { ...retention, autoFollowUpTask: e.target.checked } })
            }
            className="h-4 w-4 accent-[var(--primary)]"
          />
          Create a follow-up task automatically when a customer goes quiet
        </label>

        <div>
          <p className="mb-2 text-sm font-medium text-foreground">
            Per-category exceptions
            <span className="ml-1 font-normal text-muted-foreground">
              (groceries go quiet faster than legal work)
            </span>
          </p>
          <div className="space-y-2">
            {retention.categoryOverrides.map((override, index) => (
              <div key={`${override.category}-${index}`} className="flex gap-2">
                <select
                  value={override.category}
                  onChange={(e) => {
                    const categoryOverrides = [...retention.categoryOverrides];
                    categoryOverrides[index] = { ...override, category: e.target.value };
                    update({ retention: { ...retention, categoryOverrides } });
                  }}
                  className={fieldClass}
                >
                  {settings.serviceCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={override.days}
                  onChange={(e) => {
                    const categoryOverrides = [...retention.categoryOverrides];
                    categoryOverrides[index] = { ...override, days: Number(e.target.value) };
                    update({ retention: { ...retention, categoryOverrides } });
                  }}
                  className="w-28 rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                />
                <button
                  type="button"
                  aria-label="Remove exception"
                  onClick={() =>
                    update({
                      retention: {
                        ...retention,
                        categoryOverrides: retention.categoryOverrides.filter(
                          (_, i) => i !== index,
                        ),
                      },
                    })
                  }
                  className="shrink-0 rounded-lg border border-border px-3 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              update({
                retention: {
                  ...retention,
                  categoryOverrides: [
                    ...retention.categoryOverrides,
                    {
                      category: settings.serviceCategories[0] ?? "",
                      days: retention.defaultInactivityDays,
                    },
                  ],
                },
              })
            }
            className="mt-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            Add exception
          </button>
        </div>
      </Panel>
    </div>
  );
}

function ScoringTab() {
  const connected = isSupabaseConfigured();
  const [config, setConfig] = useState<ScoringConfig>(DEFAULT_SCORING);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!connected || loaded) return;
    loadScoring()
      .then((value) => {
        setConfig(value);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [connected, loaded]);

  async function save() {
    setSaving(true);
    try {
      await saveScoring(config);
      toast.success("Scoring saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Panel
        title="Lead scoring"
        description="Points show how much interest someone has shown on the website. They do not say how sure we are about who the person is."
      >
        <div className="space-y-2">
          {config.rules.map((rule, index) => (
            <div key={rule.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3">
              <label className="flex flex-1 items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={rule.enabled}
                  onChange={(event) => {
                    const rules = [...config.rules];
                    rules[index] = { ...rule, enabled: event.target.checked };
                    setConfig({ ...config, rules });
                  }}
                />
                {rule.label}
              </label>
              <input
                type="number"
                value={rule.points}
                onChange={(event) => {
                  const rules = [...config.rules];
                  rules[index] = { ...rule, points: Number(event.target.value) || 0 };
                  setConfig({ ...config, rules });
                }}
                className="w-24 rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Warm from" hint="Points needed before a lead counts as warm.">
            <input
              type="number"
              value={config.warmFrom}
              onChange={(event) => setConfig({ ...config, warmFrom: Number(event.target.value) || 0 })}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
            />
          </Field>
          <Field label="Hot from" hint="Points needed before a lead counts as hot.">
            <input
              type="number"
              value={config.hotFrom}
              onChange={(event) => setConfig({ ...config, hotFrom: Number(event.target.value) || 0 })}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
            />
          </Field>
        </div>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={save}
            disabled={!connected || saving}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            Save scoring
          </button>
          <button
            type="button"
            onClick={() => setConfig(DEFAULT_SCORING)}
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground"
          >
            Back to defaults
          </button>
        </div>
        {!connected ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Connect your database first to save these points for the whole team.
          </p>
        ) : null}
      </Panel>
    </div>
  );
}

function TeamTab() {
  const [members, setMembers] = useState<TeamMember[]>(() => getTeam());
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadSharedTeam()
      .then((shared) => {
        if (shared) setMembers(shared);
      })
      .catch(() => undefined);
  }, []);

  async function persist(next: TeamMember[]) {
    setMembers(next);
    setSaving(true);
    try {
      const where = await saveSharedTeam(next);
      toast.success(where === "cloud" ? "Access saved for the team" : "Saved on this device");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  function addMember(event: FormEvent) {
    event.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!clean) return;
    if (members.some((member) => member.email === clean)) {
      toast.error("That email is already on the list");
      return;
    }
    void persist([
      ...members,
      {
        id: crypto.randomUUID(),
        name: name.trim() || clean,
        email: clean,
        role: "member",
        sections: ["/dashboard"],
      },
    ]);
    setName("");
    setEmail("");
  }

  function patch(id: string, change: Partial<TeamMember>) {
    void persist(members.map((member) => (member.id === id ? { ...member, ...change } : member)));
  }

  function toggleSection(member: TeamMember, section: string, on: boolean) {
    const sections = on
      ? [...new Set([...member.sections, section])]
      : member.sections.filter((value) => value !== section);
    patch(member.id, { sections });
  }

  return (
    <div className="space-y-4">
      <Panel
        title="Team & access"
        description="Anyone can create a sign-in on the sign-in page, but they see nothing until you add their email here and tick the sections they may open. Owners always see everything."
      >
        <form onSubmit={addMember} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className={fieldClass}
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            placeholder="name@example.com"
            className={fieldClass}
          />
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            <UserPlus className="h-4 w-4" /> Add
          </button>
        </form>

        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No one added yet. While this list is empty, every signed-in account sees everything.
          </p>
        ) : null}

        <div className="space-y-4">
          {members.map((member) => (
            <div key={member.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={member.role}
                    onChange={(e) =>
                      patch(member.id, { role: e.target.value as TeamMember["role"] })
                    }
                    className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="member">Team member</option>
                    <option value="admin">Owner (full access)</option>
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      void persist(members.filter((row) => row.id !== member.id))
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </div>

              {member.role === "admin" ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Owners can open every section, including Settings.
                </p>
              ) : (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {ACCESS_SECTIONS.map((section) => (
                    <label
                      key={section.id}
                      className="flex items-start gap-3 rounded-lg border border-border px-3 py-2.5 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={member.sections.includes(section.id)}
                        onChange={(e) => toggleSection(member, section.id, e.target.checked)}
                        className="mt-0.5 h-4 w-4 accent-[var(--primary)]"
                      />
                      <span>
                        <span className="font-medium text-foreground">{section.label}</span>
                        <span className="block text-xs text-muted-foreground">
                          {section.description}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function AccountTab() {
  const [email, setEmail] = useState<string | null>(null);
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    void supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    const supabase = getSupabase();
    if (!supabase) {
      toast.error("Connect the database first");
      return;
    }
    if (next.length < 8) {
      toast.error("Use at least 8 characters");
      return;
    }
    if (next !== confirm) {
      toast.error("The two passwords do not match");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: next });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setNext("");
    setConfirm("");
    toast.success("Password changed. Use it the next time you sign in.");
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-foreground">Your account</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Signed in as {email ?? "—"}. The owner account is{" "}
        <b className="text-foreground">{OWNER_EMAIL}</b>; it always sees every section.
      </p>
      <form onSubmit={changePassword} className="mt-5 grid gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">New password</label>
          <input
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            minLength={8}
            required
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Repeat new password
          </label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={8}
            required
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <div>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Change password"}
          </button>
        </div>
      </form>
    </section>
  );
}

const SETTINGS_TABS = [
  { id: "connections", label: "Connections" },
  { id: "account", label: "Account" },
  { id: "team", label: "Team & access" },
  { id: "appearance", label: "Appearance" },
  { id: "workspace", label: "Workspace" },
  { id: "rules", label: "Business rules" },
  { id: "scoring", label: "Lead scoring" },
] as const;

type SettingsTab = (typeof SETTINGS_TABS)[number]["id"];

function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>("connections");

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Settings"
        description="Connect the database and every tool, and shape how the whole console looks and behaves. Keys you paste here stay on your devices — never in the code, never in the repos."
      />
      <div className="mb-5 flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1">
        {SETTINGS_TABS.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === item.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {tab === "connections" ? <ConnectionsTab /> : null}
      {tab === "team" ? <TeamTab /> : null}
      {tab === "appearance" ? <AppearanceTab /> : null}
      {tab === "workspace" ? <WorkspaceTab /> : null}
      {tab === "rules" ? <BusinessRulesTab /> : null}
      {tab === "scoring" ? <ScoringTab /> : null}
    </div>
  );
}
