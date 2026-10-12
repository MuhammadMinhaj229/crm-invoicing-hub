import { useEffect, type CSSProperties, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import { trackPageView } from "../../lib/analytics";
import { defaultSections, loadHomeSections } from "../../content/home-sections";
import { useThemeSync, useWorkspaceSettings } from "../../hooks/use-workspace-settings";
import type { PageDocument } from "../../lib/page-builder/model";
import { isSafeHref } from "../../lib/page-builder/safe-url";
import type { ContactChannels } from "../../types/site";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "../site/site-footer";
import { AmbientBackground } from "../motion/primitives";
import { FloatingActions } from "./floating-actions";

type JsonRecord = Record<string, unknown>;
type PublicLink = { label: string; href: string };

function record(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as JsonRecord
    : {};
}

function stringValue(source: JsonRecord, key: string): string {
  const value = source[key];
  return typeof value === "string" ? value : "";
}

function publicLinks(value: unknown): PublicLink[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): PublicLink[] => {
    const link = record(item);
    const label = stringValue(link, "label").trim();
    const href = stringValue(link, "href").trim();
    if (!label || !href.startsWith("/") || href.startsWith("//") || !isSafeHref(href)) return [];
    return [{ label, href }];
  });
}

function safeThemeValue(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim() || value.length > 400) return false;
  if (/[\u0000-\u001f\u007f;{}<>]/.test(value)) return false;
  if (/url\s*\(|expression\s*\(|javascript\s*:/i.test(value)) return false;
  return /^[\w\s.%#(),/+-]+$/.test(value);
}

function themeVariables(content: JsonRecord | undefined): CSSProperties {
  const theme = record(record(content?.["theme"])["light"]);
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
  const styles: Record<string, string> = {};
  for (const [key, value] of Object.entries(theme)) {
    if (allowed.has(key) && safeThemeValue(value)) styles["--" + key] = value;
  }
  return styles as CSSProperties;
}

function siteContact(site: JsonRecord): ContactChannels {
  const contact = record(site["contact"]);
  const location = record(site["location"]);
  return {
    whatsapp: stringValue(contact, "whatsapp"),
    phone: stringValue(contact, "phone"),
    email: stringValue(contact, "email"),
    location: stringValue(contact, "location") || stringValue(location, "city"),
  };
}

/**
 * Shared public frame. With a CMS snapshot, visible chrome is resolved from the
 * same site/theme configuration as the page body. Legacy sections are dev-only
 * fallback inputs and cannot silently override a database publication.
 */
export function PageShell({
  children,
  pageName,
  siteConfigContent,
  initialGlobalDocument,
  usesSeedFallback = false,
}: {
  children: ReactNode;
  pageName: string;
  siteConfigContent?: JsonRecord;
  initialGlobalDocument?: PageDocument | null;
  usesSeedFallback?: boolean;
}) {
  const { settings } = useWorkspaceSettings();
  const hasCanonicalConfig = Boolean(siteConfigContent);
  useThemeSync(settings, !hasCanonicalConfig);

  const { data } = useQuery({
    queryKey: ["published-content"],
    queryFn: loadHomeSections,
    staleTime: 5 * 60 * 1000,
    enabled: !hasCanonicalConfig,
  });
  const sections = data ?? defaultSections();

  const site = record(siteConfigContent?.["site"]);
  const brand = record(site["brand"]);
  const canonicalNavigation = publicLinks(site["navigation"]);
  const canonicalLegalLinks = publicLinks(site["legalLinks"]);
  const canonicalContact = siteContact(site);
  const brandName = hasCanonicalConfig
    ? stringValue(brand, "name") || settings.branding.name
    : settings.branding.name;
  const tagline = stringValue(brand, "tagline");
  const description = stringValue(brand, "description");
  const motto = stringValue(brand, "motto");
  const logoUrl = hasCanonicalConfig
    ? stringValue(brand, "logoUrl") || undefined
    : settings.branding.logoUrl || undefined;
  const logoStyle = hasCanonicalConfig
    ? (logoUrl ? "image" : "lockup")
    : settings.branding.logoStyle;
  const cta = record(site["cta"]);
  const themeStyle = themeVariables(siteConfigContent);

  useEffect(() => {
    if (!hasCanonicalConfig || typeof document === "undefined") return;
    const styles = themeVariables(siteConfigContent);
    for (const [property, value] of Object.entries(styles)) {
      if (typeof value === "string") document.documentElement.style.setProperty(property, value);
    }
    delete document.documentElement.dataset["buttonStyle"];
    delete document.documentElement.dataset["density"];
  }, [hasCanonicalConfig, siteConfigContent]);

  useEffect(() => {
    trackPageView({ page: pageName });
  }, [pageName]);

  const footerConfig = hasCanonicalConfig
    ? {
        tagline: description || tagline,
        motto,
        navigation: canonicalNavigation,
        legalLinks: canonicalLegalLinks,
        contact: canonicalContact,
      }
    : undefined;

  return (
    <div
      className="min-h-screen bg-legacy-warm text-legacy-ink"
      style={themeStyle}
      data-cms-shell={hasCanonicalConfig ? "canonical" : "legacy-fallback"}
    >
      {usesSeedFallback ? (
        <div
          role="status"
          aria-live="polite"
          data-content-source="seed-fallback"
          className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-950"
        >
          Live content sync is temporarily unavailable. Showing the saved backup version; recent edits may not appear.
        </div>
      ) : null}
      <AmbientBackground />
      <SiteHeader
        brandName={brandName}
        logoUrl={logoUrl}
        logoStyle={logoStyle}
        initialGlobalDocument={initialGlobalDocument}
        fallbackNavigation={hasCanonicalConfig ? canonicalNavigation : undefined}
        canonicalContact={hasCanonicalConfig ? canonicalContact : undefined}
      />
      <main id="main">{children}</main>
      <SiteFooter
        footer={sections["footer"] ?? {}}
        contact={sections["contact"] ?? {}}
        brandName={brandName}
        logoUrl={logoUrl}
        logoStyle={logoStyle}
        canonicalSite={footerConfig}
      />
      <FloatingActions
        context={pageName}
        canonicalContact={hasCanonicalConfig ? canonicalContact : undefined}
        labels={hasCanonicalConfig ? {
          whatsapp: stringValue(cta, "whatsapp") || "Message us",
          call: stringValue(cta, "call") || "Call us",
        } : undefined}
      />
    </div>
  );
}
