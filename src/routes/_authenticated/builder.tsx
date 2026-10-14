import { createFileRoute, Link } from "@tanstack/react-router";
import { Puck, createUsePuck, type Data } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { AlertCircle, ArrowLeft, CheckCircle2, Cloud, CloudOff, ExternalLink, RefreshCw, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { BUILDER_PAGES, defaultDocument } from "../../lib/page-builder/model";
import { documentToPuck, puckToDocument, safarPuckConfig } from "../../lib/page-builder/puck-config";
import {
  fetchCmsHandshake,
  fetchCmsSiteConfiguration,
  fetchDocumentState,
  publishDocument,
  saveCmsSiteConfiguration,
  saveDocumentDraft,
  subscribeToCmsChanges,
  type CmsHandshake,
} from "../../lib/page-builder/store";

const usePuck = createUsePuck();

export const Route = createFileRoute("/_authenticated/builder")({
  head: () => ({
    meta: [
      { title: "Website studio — SAFAR N MANZIL" },
      { name: "description", content: "Drag, drop, edit and publish every section of the SAFAR website." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StudioPage,
});

function StudioPage() {
  const [page, setPage] = useState("home");
  const [studioView, setStudioView] = useState<"pages" | "settings">("pages");
  const [data, setData] = useState<Data | null>(null);
  const [version, setVersion] = useState(0);
  const [pageMetadata, setPageMetadata] = useState<ReturnType<typeof defaultDocument>["metadata"]>();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let alive = true;
    setData(null);
    setLoadError(null);
    setVersion(0);
    setPageMetadata(undefined);
    fetchDocumentState(page)
      .then((s) => {
        if (!alive) return;
        const doc = s.draft ?? s.published ?? defaultDocument(page);
        setVersion(s.version);
        setPageMetadata(doc.metadata);
        setData(documentToPuck(doc));
      })
      .catch((e: Error) => {
        if (!alive) return;
        const message = `Could not load this page safely: ${e.message}`;
        setLoadError(message);
        toast.error(message);
      });
    return () => {
      alive = false;
    };
  }, [page, reloadToken]);

  const path = BUILDER_PAGES.find((p) => p.id === page)?.path ?? "/";

  const publish = async (next: Data) => {
    try {
      const v = await publishDocument(puckToDocument(page, next, pageMetadata), version);
      setVersion(v);
      toast.success(`Published version ${v}`);
    } catch (e) {
      toast.error(`Publish failed: ${(e as Error).message}`);
    }
  };

  const saveDraft = async (next: Data) => {
    try {
      const where = await saveDocumentDraft(puckToDocument(page, next, pageMetadata));
      toast.success(where === "cloud" ? "Draft saved" : "Draft saved on this device");
    } catch (e) {
      toast.error(`Save failed: ${(e as Error).message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-card px-4 py-2 text-sm">
        <Link to="/" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <select
          aria-label="Page to edit"
          value={page}
          disabled={studioView === "settings"}
          onChange={(e) => setPage(e.target.value)}
          className="rounded-md border border-input bg-background px-2 py-1"
        >
          {BUILDER_PAGES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setStudioView((view) => view === "settings" ? "pages" : "settings")}
          className="inline-flex items-center gap-1.5 rounded-md border border-input px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
        >
          <Settings2 className="h-3.5 w-3.5" />
          {studioView === "settings" ? "Back to pages" : "Site settings"}
        </button>
        <CmsSyncStatus />
        {studioView === "pages" ? <span className="text-muted-foreground">Live version {version || "—"}</span> : null}
        {studioView === "pages" ? (
          <a href={path} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
            Open live page <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : null}
      </div>
      <div className="min-h-0 flex-1">
        {studioView === "settings" ? (
          <SiteSettingsEditor />
        ) : loadError ? (
          <div className="grid h-full place-items-center p-6">
            <div className="max-w-lg rounded-xl border border-destructive/30 bg-card p-6 text-center">
              <h2 className="font-display text-lg font-bold text-foreground">Page not loaded</h2>
              <p role="alert" className="mt-2 text-sm text-muted-foreground">{loadError}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Editing is disabled until the saved page state can be read. This prevents a fallback document from overwriting published work.
              </p>
              <button
                type="button"
                onClick={() => setReloadToken((value) => value + 1)}
                className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Retry loading
              </button>
            </div>
          </div>
        ) : data ? (
          <Puck
            key={page}
            config={safarPuckConfig}
            data={data}
            onPublish={publish}
            headerTitle={BUILDER_PAGES.find((p) => p.id === page)?.label ?? "Page"}
            overrides={{
              headerActions: ({ children }) => (
                <>
                  <SaveDraftButton onSave={saveDraft} />
                  {children}
                </>
              ),
            }}
          />
        ) : (
          <div className="grid h-full place-items-center text-muted-foreground">Loading page…</div>
        )}
      </div>
    </div>
  );
}

type SiteSettingsRecord = Record<string, unknown>;

function readSetting(root: SiteSettingsRecord, path: string[]): string {
  let value: unknown = root;
  for (const key of path) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return "";
    value = (value as SiteSettingsRecord)[key];
  }
  return typeof value === "string" ? value : "";
}

function updateSetting(root: SiteSettingsRecord, path: string[], value: string): SiteSettingsRecord {
  const next = structuredClone(root) as SiteSettingsRecord;
  let cursor = next;
  for (const key of path.slice(0, -1)) {
    const existing = cursor[key];
    const child = existing && typeof existing === "object" && !Array.isArray(existing)
      ? { ...(existing as SiteSettingsRecord) }
      : {};
    cursor[key] = child;
    cursor = child;
  }
  cursor[path[path.length - 1]!] = value;
  return next;
}

function isSafeThemeColor(value: string): boolean {
  const token = value.trim();
  return /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(token) ||
    /^oklch\(\s*[0-9.%+-]+\s+[0-9.%+-]+\s+[0-9.%+-]+(?:\s*\/\s*[0-9.%+-]+)?\s*\)$/i.test(token);
}

function SiteSettingsEditor() {
  const [settings, setSettings] = useState<SiteSettingsRecord | null>(null);
  const [version, setVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchCmsSiteConfiguration();
      setSettings(result.content);
      setVersion(result.version);
      setDirty(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load site settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const change = (path: string[], value: string) => {
    setSettings((current) => current ? updateSetting(current, path, value) : current);
    setDirty(true);
  };

  const colors = settings ? [
    readSetting(settings, ["theme", "light", "primary"]),
    readSetting(settings, ["theme", "light", "background"]),
    readSetting(settings, ["theme", "light", "foreground"]),
  ] : [];
  const colorsValid = colors.every(isSafeThemeColor);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!settings || saving) return;
    if (!colorsValid) {
      setError("Use a hex color or an OKLCH color token. Arbitrary CSS is not accepted.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const nextVersion = await saveCmsSiteConfiguration(settings, version);
      setVersion(nextVersion);
      setDirty(false);
      toast.success("Site settings saved to the shared database.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Site settings could not be saved.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20";
  const labelClass = "block text-sm font-medium text-foreground";

  return (
    <div className="h-full overflow-auto bg-background p-5 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">Site-wide settings</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Brand, contact details and visual theme are shared across deployments and stored in Supabase.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>Settings version {version || "—"}</span>
            <button type="button" onClick={() => void load()} disabled={loading || saving} className="rounded-md border border-input px-3 py-1.5 hover:bg-muted disabled:opacity-50">
              Reload
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">Loading site settings…</div>
        ) : error && !settings ? (
          <div className="rounded-xl border border-destructive/30 bg-card p-6">
            <p role="alert" className="text-sm text-destructive">{error}</p>
            <button type="button" onClick={() => void load()} className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Retry</button>
          </div>
        ) : settings ? (
          <form onSubmit={save} className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold text-foreground">Brand identity</h3>
              <div className="mt-4 space-y-4">
                <label className={labelClass}>
                  Brand name
                  <input className={inputClass} value={readSetting(settings, ["site", "brand", "name"])} onChange={(e) => change(["site", "brand", "name"], e.target.value)} required maxLength={200} />
                </label>
                <label className={labelClass}>
                  Tagline
                  <input className={inputClass} value={readSetting(settings, ["site", "brand", "tagline"])} onChange={(e) => change(["site", "brand", "tagline"], e.target.value)} maxLength={500} />
                </label>
                <label className={labelClass}>
                  Brand description
                  <textarea className={inputClass + " min-h-24 resize-y"} value={readSetting(settings, ["site", "brand", "description"])} onChange={(e) => change(["site", "brand", "description"], e.target.value)} maxLength={4000} />
                </label>
                <label className={labelClass}>
                  Brand motto
                  <input className={inputClass} value={readSetting(settings, ["site", "brand", "motto"])} onChange={(e) => change(["site", "brand", "motto"], e.target.value)} maxLength={500} />
                </label>
              </div>
            </section>

            <section className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold text-foreground">Contact and response</h3>
              <div className="mt-4 space-y-4">
                <label className={labelClass}>
                  WhatsApp number (international format)
                  <input className={inputClass} value={readSetting(settings, ["site", "contact", "whatsapp"])} onChange={(e) => change(["site", "contact", "whatsapp"], e.target.value)} maxLength={32} inputMode="tel" />
                </label>
                <label className={labelClass}>
                  Phone
                  <input className={inputClass} value={readSetting(settings, ["site", "contact", "phone"])} onChange={(e) => change(["site", "contact", "phone"], e.target.value)} maxLength={64} inputMode="tel" />
                </label>
                <label className={labelClass}>
                  Email
                  <input className={inputClass} type="email" value={readSetting(settings, ["site", "contact", "email"])} onChange={(e) => change(["site", "contact", "email"], e.target.value)} maxLength={254} />
                </label>
                <label className={labelClass}>
                  Business response hours
                  <textarea className={inputClass + " min-h-20 resize-y"} value={readSetting(settings, ["site", "hours"])} onChange={(e) => change(["site", "hours"], e.target.value)} maxLength={1000} />
                </label>
              </div>
            </section>

            <section className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
              <h3 className="font-semibold text-foreground">Visual theme</h3>
              <p className="mt-1 text-sm text-muted-foreground">Only safe color tokens are accepted; CSS, HTML and JavaScript cannot be injected here.</p>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <label className={labelClass}>
                  Primary color
                  <input className={inputClass} value={colors[0] ?? ""} onChange={(e) => change(["theme", "light", "primary"], e.target.value)} required />
                </label>
                <label className={labelClass}>
                  Page background
                  <input className={inputClass} value={colors[1] ?? ""} onChange={(e) => change(["theme", "light", "background"], e.target.value)} required />
                </label>
                <label className={labelClass}>
                  Main text color
                  <input className={inputClass} value={colors[2] ?? ""} onChange={(e) => change(["theme", "light", "foreground"], e.target.value)} required />
                </label>
              </div>
              {!colorsValid ? <p role="alert" className="mt-3 text-xs text-destructive">A theme color is invalid. Use hex (for example #f97316) or OKLCH (for example oklch(0.705 0.148 38)).</p> : null}
            </section>

            {error ? <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive lg:col-span-2">{error}</p> : null}
            <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
              <button type="submit" disabled={!dirty || saving || !colorsValid} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">
                {saving ? "Saving…" : "Save site settings"}
              </button>
              <span className="text-xs text-muted-foreground">Changes are version-checked; a newer editor save will never be silently overwritten.</span>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
}

type CmsSyncState = "checking" | "offline" | "connected" | "seed_required" | "no_published_pages" | "protocol_mismatch" | "reconnecting";

function CmsSyncStatus() {
  const [state, setState] = useState<CmsSyncState>("checking");
  const [handshake, setHandshake] = useState<CmsHandshake | null>(null);
  const [realtimeReady, setRealtimeReady] = useState(false);
  const [remoteChange, setRemoteChange] = useState(false);
  const [lastEventAt, setLastEventAt] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const refreshHandshake = async () => {
      try {
        const result = await fetchCmsHandshake();
        if (!active) return;
        setHandshake(result);
        setState(result.status === "ready" ? "connected" :
          result.status === "seed_required" ? "seed_required" :
          result.status === "no_published_pages" ? "no_published_pages" :
          result.status === "protocol_mismatch" ? "protocol_mismatch" : "offline");
      } catch {
        if (active) {
          setHandshake(null);
          setState("offline");
        }
      }
    };

    const unsubscribe = subscribeToCmsChanges((channelStatus) => {
      if (!active) return;
      if (channelStatus === "SUBSCRIBED") {
        setRealtimeReady(true);
        void refreshHandshake();
      } else if (channelStatus === "CHANNEL_ERROR" || channelStatus === "TIMED_OUT" || channelStatus === "CLOSED") {
        setRealtimeReady(false);
        setState((current) => current === "offline" ? "offline" : "reconnecting");
      } else if (channelStatus === "UNCONFIGURED") {
        setRealtimeReady(false);
        setState("offline");
      }
    }, () => {
      if (!active) return;
      // A remote event is deliberately surfaced instead of replacing the
      // current Puck state, which may contain unsaved edits.
      setRemoteChange(true);
      setLastEventAt(new Date().toLocaleTimeString());
    });

    void refreshHandshake();
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const label = remoteChange
    ? "Cloud connected · shared content changed"
    : state === "checking"
      ? "Checking database…"
      : state === "offline"
        ? "Database unavailable"
        : state === "reconnecting"
          ? "Database reachable · realtime reconnecting"
          : state === "seed_required"
            ? "Database connected · seed required"
            : state === "no_published_pages"
              ? "Database connected · no pages published"
              : state === "protocol_mismatch"
                ? "Editor/database protocol mismatch"
                : "Cloud connected" + (realtimeReady ? " · live sync on" : " · checking live sync");

  const title = [
    label,
    handshake ? "Schema v" + handshake.schema_version : "",
    handshake ? handshake.published_page_count + " published documents" : "",
    lastEventAt ? "Last shared change detected at " + lastEventAt : "",
  ].filter(Boolean).join(" — ");

  const tone = state === "connected" && realtimeReady && !remoteChange
    ? "border-emerald-600/25 text-emerald-700"
    : state === "checking" || state === "reconnecting" || remoteChange
      ? "border-amber-600/25 text-amber-700"
      : "border-destructive/30 text-destructive";

  return (
    <span
      role="status"
      aria-live="polite"
      title={title}
      className={"inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium " + tone}
    >
      {state === "connected" && realtimeReady && !remoteChange ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : state === "checking" || state === "reconnecting" ? (
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
      ) : state === "offline" ? (
        <CloudOff className="h-3.5 w-3.5" />
      ) : state === "seed_required" || state === "no_published_pages" || state === "protocol_mismatch" || remoteChange ? (
        <AlertCircle className="h-3.5 w-3.5" />
      ) : (
        <Cloud className="h-3.5 w-3.5" />
      )}
      <span>{label}</span>
    </span>
  );
}

function SaveDraftButton({ onSave }: { onSave: (d: Data) => void }) {
  const appState = usePuck((s) => s.appState);
  return (
    <button
      type="button"
      onClick={() => onSave(appState.data)}
      className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted"
    >
      Save draft
    </button>
  );
}
