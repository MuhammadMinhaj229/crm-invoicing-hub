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
      const config = {
        url: url.trim(),
        anonKey: anonKey.trim(),
        serviceRoleKey: serviceRoleKey.trim() || undefined,
      };
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

function SettingsPage() {
  const otherIntegrations = INTEGRATIONS.filter((i) => i.id !== "supabase");
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Settings"
        description="Connect the database and every tool from one place. Keys you paste here stay on your devices — never in the code, never in the repos."
      />
      <DatabaseCard />
      <h2 className="mb-4 mt-10 font-display text-lg font-semibold text-foreground">
        Tools & integrations
      </h2>
      <div className="space-y-4">
        {otherIntegrations.map((definition) => (
          <IntegrationCard key={definition.id} definition={definition} />
        ))}
      </div>
    </div>
  );
}
