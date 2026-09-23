import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ClipboardCopy,
  Database,
  Loader2,
  PlugZap,
  Trash2,
  XCircle,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { PageHeader } from "../../components/app-shell";
import { useWorkspaceSettings } from "../../hooks/use-workspace-settings";
import {
  INTEGRATIONS,
  getIntegrationValues,
  isIntegrationConfigured,
  removeIntegrationValues,
  saveIntegrationValues,
  testHttpEndpoint,
  type IntegrationDefinition,
} from "../../lib/connections";
import {
  clearStoredSupabaseConfig,
  getStoredSupabaseConfig,
  saveStoredSupabaseConfig,
  testSupabaseConnection,
} from "../../lib/supabase";
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
        </div>
      </form>

      <div className="mt-6 rounded-lg border border-dashed border-border bg-background p-4">
        <p className="text-sm font-medium text-foreground">First-time database setup</p>
        <p className="mt-1 text-sm text-muted-foreground">
          After connecting, create the tables once: open your Supabase dashboard → SQL Editor →
          New query → paste the setup script → Run. It creates every table, role and security
          policy the CRM needs.
        </p>
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
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {configured ? "Edit keys" : "Add keys"}
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

const SETTINGS_TABS = [
  { id: "connections", label: "Connections" },
  { id: "appearance", label: "Appearance" },
  { id: "workspace", label: "Workspace" },
  { id: "rules", label: "Business rules" },
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
      {tab === "appearance" ? <AppearanceTab /> : null}
      {tab === "workspace" ? <WorkspaceTab /> : null}
      {tab === "rules" ? <BusinessRulesTab /> : null}
    </div>
  );
}
