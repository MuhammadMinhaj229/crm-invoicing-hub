import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { BlockRenderer } from "../../src/components/page-builder/block-renderer";
import type { PageDocument, PageMetadata } from "../../src/lib/page-builder/model";
import {
  fetchCmsHandshake,
  fetchCmsPublishedManifest,
  fetchCmsSiteConfiguration,
  fetchPublishedDocument,
  subscribeToPublicCmsChanges,
  type CmsHandshake,
  type CmsPublishedPage,
} from "../../src/lib/page-builder/store";
import { isSafeHref } from "../../src/lib/page-builder/safe-url";
import { buildWhatsAppUrl } from "../../src/lib/whatsapp/url-builder";
import { generalEnquiryMessage } from "../../src/lib/whatsapp/templates";
import "../../src/styles.css";

type JsonRecord = Record<string, unknown>;
type PublicNavigationLink = { label: string; href: string };

type RuntimeState = "loading" | "unavailable" | "not-found" | "ready";

interface RuntimeContent {
  document: PageDocument;
  route: CmsPublishedPage;
  site: JsonRecord;
  theme: JsonRecord;
  globalDocument: PageDocument | null;
  handshake: CmsHandshake;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 15_000,
      refetchOnWindowFocus: true,
    },
  },
});

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as JsonRecord
    : {};
}

function readString(source: JsonRecord, key: string, fallback = ""): string {
  const value = source[key];
  return typeof value === "string" ? value : fallback;
}

function normalizePath(path: string): string {
  if (!path || path === "/") return "/";
  return path.replace(/\/+$/, "") || "/";
}

function isLocalHref(value: string): boolean {
  return value.startsWith("/") && !value.startsWith("//") && isSafeHref(value);
}

function getNavigation(
  globalDocument: PageDocument | null,
  site: JsonRecord,
): PublicNavigationLink[] {
  const navBlock = globalDocument?.blocks.find((block) => block.type === "navigation");
  if (navBlock?.type === "navigation") {
    const edited = navBlock.props.links
      .filter((link) => link.label.trim() && isLocalHref(link.href))
      .map((link) => ({ label: link.label, href: link.href }));
    if (edited.length) return edited;
  }

  const configured = site["navigation"];
  if (!Array.isArray(configured)) return [];
  return configured.flatMap((item) => {
    const link = asRecord(item);
    const label = readString(link, "label").trim();
    const href = readString(link, "href").trim();
    return label && isLocalHref(href) ? [{ label, href }] : [];
  });
}

function applyRuntimeTheme(theme: JsonRecord): void {
  if (typeof document === "undefined") return;
  const allowed = new Set([
    "radius", "background", "foreground", "card", "card-foreground",
    "popover", "popover-foreground", "primary", "primary-foreground",
    "secondary", "secondary-foreground", "muted", "muted-foreground",
    "accent", "accent-foreground", "destructive", "destructive-foreground",
    "border", "input", "ring", "legacy-coral", "legacy-peach", "legacy-warm",
    "legacy-light", "legacy-teal", "legacy-deep", "legacy-ink", "shadow-soft",
    "shadow-lift", "chart-1", "chart-2", "chart-3", "chart-4", "chart-5",
    "sidebar", "sidebar-foreground", "sidebar-primary", "sidebar-primary-foreground",
    "sidebar-accent", "sidebar-accent-foreground", "sidebar-border", "sidebar-ring",
  ]);
  for (const [key, value] of Object.entries(theme)) {
    if (!allowed.has(key) || typeof value !== "string" || value.length > 600) continue;
    if (/[\u0000-\u001f\u007f]/.test(value)) continue;
    document.documentElement.style.setProperty("--" + key, value);
  }
}

function updateDescription(description: string): void {
  let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "description";
    document.head.appendChild(meta);
  }
  meta.content = description;
}

function RuntimeApp() {
  const [phase, setPhase] = useState<RuntimeState>("loading");
  const [content, setContent] = useState<RuntimeContent | null>(null);
  const [error, setError] = useState("");
  const [syncStatus, setSyncStatus] = useState("CHECKING");
  const hasRenderedPage = useRef(false);

  useEffect(() => {
    let active = true;
    let refreshSequence = 0;

    const refresh = async (showLoading: boolean) => {
      const sequence = ++refreshSequence;
      if (showLoading && !hasRenderedPage.current) setPhase("loading");
      setError("");

      try {
        const handshake = await fetchCmsHandshake();
        if (!handshake.ok) {
          const messages: Record<string, string> = {
            seed_required: "The database is connected, but the initial website seed has not been installed.",
            no_published_pages: "The CMS has no published pages yet.",
            protocol_mismatch: "The website and database use incompatible CMS protocol versions.",
          };
          throw new Error(messages[handshake.status] ?? "The website CMS is not ready.");
        }

        const [configuration, manifest, globalDocument] = await Promise.all([
          fetchCmsSiteConfiguration(),
          fetchCmsPublishedManifest(),
          fetchPublishedDocument("global"),
        ]);

        if (!active || sequence !== refreshSequence) return;

        const path = normalizePath(window.location.pathname);
        const route = manifest.find((candidate) => normalizePath(candidate.metadata.path) === path);
        const site = asRecord(configuration.content["site"]);
        const theme = asRecord(asRecord(configuration.content["theme"])["light"]);

        if (!route) {
          setContent(null);
          setPhase("not-found");
          hasRenderedPage.current = false;
          document.title = "Page not found | " + readString(asRecord(site["brand"]), "name", "SAFAR N MANZIL");
          applyRuntimeTheme(theme);
          return;
        }

        const published = await fetchPublishedDocument(route.page);
        if (!published || published.page !== route.page) {
          throw new Error("The route exists in the published manifest, but its page document could not be loaded.");
        }
        if (!active || sequence !== refreshSequence) return;

        const metadata: PageMetadata = published.metadata ?? route.metadata;
        applyRuntimeTheme(theme);
        document.title = metadata.seo.title;
        updateDescription(metadata.seo.description);

        setContent({
          document: published,
          route: { ...route, metadata },
          site,
          theme,
          globalDocument,
          handshake,
        });
        setPhase("ready");
        hasRenderedPage.current = true;
      } catch (caught) {
        if (!active || sequence !== refreshSequence) return;
        const message = caught instanceof Error ? caught.message : "The website could not synchronize with Supabase.";
        setError(message);
        if (!hasRenderedPage.current) setPhase("unavailable");
      }
    };

    void refresh(true);

    const unsubscribe = subscribeToPublicCmsChanges(
      (status) => {
        if (active) setSyncStatus(status);
      },
      () => {
        // A publication/config event triggers a fresh database read. The
        // published-only projection contains no drafts, so public Realtime is safe.
        void refresh(false);
      },
    );

    const onNavigation = () => void refresh(true);
    window.addEventListener("popstate", onNavigation);

    return () => {
      active = false;
      refreshSequence += 1;
      unsubscribe();
      window.removeEventListener("popstate", onNavigation);
    };
  }, []);

  if (phase === "loading" && !content) {
    return <StatusPage title="Connecting to SAFAR N MANZIL" detail="Verifying the shared database and loading the published page." />;
  }

  if (phase === "unavailable" && !content) {
    return (
      <StatusPage
        title="Website synchronization unavailable"
        detail={error || "The website could not complete its database handshake."}
        retry={() => window.location.reload()}
      />
    );
  }

  if (phase === "not-found" || (!content && phase !== "ready")) {
    return <StatusPage title="Page not found" detail="This route is not present in the published website manifest." />;
  }

  if (!content) return null;

  const brand = asRecord(content.site["brand"]);
  const contact = asRecord(content.site["contact"]);
  const name = readString(brand, "name", "SAFAR N MANZIL");
  const tagline = readString(brand, "tagline", "We do. We assist. We connect.");
  const logoUrl = readString(brand, "logoUrl", "/media/safar-logo.png");
  const links = getNavigation(content.globalDocument, content.site);
  const whatsapp = readString(contact, "whatsapp");
  const whatsappUrl = buildWhatsAppUrl(whatsapp, generalEnquiryMessage());
  const legalLinks = Array.isArray(content.site["legalLinks"])
    ? content.site["legalLinks"].flatMap((item) => {
        const link = asRecord(item);
        const label = readString(link, "label").trim();
        const href = readString(link, "href").trim();
        return label && isLocalHref(href) ? [{ label, href }] : [];
      })
    : [];

  return (
    <div className="min-h-screen bg-legacy-warm text-legacy-ink">
      {error ? (
        <div role="status" className="fixed inset-x-0 top-0 z-[100] bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-950 shadow-sm">
          Showing the last successfully published page. Sync retry: {error}
        </div>
      ) : null}
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[110] focus:rounded-lg focus:bg-background focus:p-3">
        Skip to content
      </a>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
        <div className="mx-auto w-full max-w-[1280px] px-4 pt-3 sm:px-6 sm:pt-4">
          <div className="pointer-events-auto flex items-center justify-between gap-4 rounded-2xl border border-foreground/10 bg-background/85 px-4 py-3 shadow-soft backdrop-blur-xl sm:rounded-full sm:px-6">
            <a href="/" className="flex min-w-0 items-center gap-3" aria-label={name + " home"}>
              {logoUrl ? <img src={logoUrl} alt="" className="h-9 w-9 rounded-full object-contain" /> : null}
              <span className="min-w-0">
                <span className="block truncate font-display text-sm font-bold tracking-tight sm:text-base">{name}</span>
                <span className="hidden truncate text-xs text-foreground/55 sm:block">{tagline}</span>
              </span>
            </a>
            <nav aria-label="Main navigation" className="hidden items-center gap-5 md:flex">
              {links.map((link) => (
                <a key={link.href + link.label} href={link.href} className="text-sm font-semibold text-foreground/70 transition hover:text-primary">
                  {link.label}
                </a>
              ))}
            </nav>
            {whatsappUrl ? (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground transition hover:opacity-90 sm:text-sm">
                Message us
              </a>
            ) : null}
          </div>
        </div>
      </header>

      <main id="main" data-cms-page={content.document.page}>
        <BlockRenderer blocks={content.document.blocks} />
      </main>

      <footer className="bg-legacy-deep text-legacy-light">
        <div className="mx-auto grid max-w-[1280px] gap-8 px-6 py-12 sm:px-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              {logoUrl ? <img src={logoUrl} alt="" className="h-10 w-10 rounded-full object-contain" /> : null}
              <span className="font-display text-lg font-bold">{name}</span>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-legacy-light/65">{readString(brand, "description")}</p>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-primary">{readString(brand, "motto", "We do. We assist. We connect.")}</p>
          </div>
          <div>
            <p className="font-semibold">Explore</p>
            <nav aria-label="Footer navigation" className="mt-4 flex flex-col items-start gap-3 text-sm text-legacy-light/65">
              {links.map((link) => <a key={link.href + link.label} href={link.href} className="hover:text-legacy-light">{link.label}</a>)}
            </nav>
          </div>
          <div>
            <p className="font-semibold">Information</p>
            <nav aria-label="Legal" className="mt-4 flex flex-col items-start gap-3 text-sm text-legacy-light/65">
              {legalLinks.map((link) => <a key={link.href + link.label} href={link.href} className="hover:text-legacy-light">{link.label}</a>)}
            </nav>
            <p className="mt-5 text-xs text-legacy-light/45">Database version {content.handshake.site_version} · Published pages {content.handshake.published_page_count}</p>
            <p className="mt-1 text-[11px] text-legacy-light/40" title={"Realtime status: " + syncStatus}>Content sync: {syncStatus === "SUBSCRIBED" ? "Live" : "Connected by database"}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatusPage({ title, detail, retry }: { title: string; detail: string; retry?: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-legacy-warm px-5 text-legacy-ink">
      <div className="max-w-xl rounded-3xl border border-foreground/10 bg-background p-8 text-center shadow-soft">
        <img src="/media/safar-logo.png" alt="" className="mx-auto h-14 w-14 rounded-full object-contain" />
        <h1 className="mt-5 font-display text-2xl font-semibold">{title}</h1>
        <p role="status" className="mt-3 text-sm leading-6 text-foreground/60">{detail}</p>
        {retry ? (
          <button type="button" onClick={retry} className="mt-6 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
            Retry connection
          </button>
        ) : null}
      </div>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <RuntimeApp />
  </QueryClientProvider>,
);
