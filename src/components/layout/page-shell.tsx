import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Menu, X } from "lucide-react";

import { site } from "../../content/site";
import { track, trackPageView } from "../../lib/analytics";
import { defaultSections, fetchPublishedContent } from "../../lib/cms";
import { buildWhatsAppUrl } from "../../lib/whatsapp/url-builder";
import { generalEnquiryMessage } from "../../lib/whatsapp/templates";
import { useSiteContact } from "../../hooks/use-site-contact";
import { useThemeSync, useWorkspaceSettings } from "../../hooks/use-workspace-settings";
import { BrandMark } from "../brand-mark";
import { SiteFooter } from "../site/site-footer";
import { AmbientBackground } from "../motion/primitives";
import { FloatingActions } from "./floating-actions";

function SiteHeader({
  brandName,
  logoUrl,
  logoStyle,
}: {
  brandName: string;
  logoUrl?: string;
  logoStyle: "lockup" | "image";
}) {
  const [open, setOpen] = useState(false);
  const contact = useSiteContact();
  const whatsappUrl = buildWhatsAppUrl(contact.whatsapp, generalEnquiryMessage());

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-4">
        <Link to="/" className="min-w-0" aria-label={`${brandName} home`}>
          <BrandMark name={brandName} logoUrl={logoUrl} style={logoStyle} compact />
        </Link>

        <nav className="ml-auto hidden items-center gap-7 md:flex" aria-label="Main">
          {site.navigation.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              activeProps={{ className: "text-primary" }}
              className="text-sm font-semibold text-foreground/80 transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("whatsapp.clicked", { placement: "header" })}
              className="hidden min-h-[44px] items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground sm:inline-flex"
            >
              {site.cta.primary}
            </a>
          ) : (
            <Link
              to="/contact"
              className="hidden min-h-[44px] items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground sm:inline-flex"
            >
              {site.cta.primary}
            </Link>
          )}

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border text-foreground md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <nav className="border-t border-border bg-background px-5 py-3 md:hidden" aria-label="Mobile">
          <ul className="space-y-1">
            {site.navigation.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-3 py-3 text-base font-semibold text-foreground hover:bg-muted"
                >
                  {item.label}
                  {item.hint ? (
                    <span className="block text-sm font-normal text-muted-foreground">
                      {item.hint}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}

/**
 * Shared frame for every public page: brand header, ambient background,
 * CMS-driven footer and the persistent contact actions.
 */
export function PageShell({
  children,
  pageName,
}: {
  children: ReactNode;
  pageName: string;
}) {
  const { settings } = useWorkspaceSettings();
  useThemeSync(settings);

  const { data } = useQuery({
    queryKey: ["published-content"],
    queryFn: fetchPublishedContent,
    staleTime: 5 * 60 * 1000,
  });
  const sections = data ?? defaultSections();

  useEffect(() => {
    trackPageView({ page: pageName });
  }, [pageName]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AmbientBackground />
      <SiteHeader
        brandName={settings.branding.name}
        logoUrl={settings.branding.logoUrl}
        logoStyle={settings.branding.logoStyle}
      />
      <main id="main">{children}</main>
      <SiteFooter
        footer={sections['footer'] ?? {}}
        contact={sections['contact'] ?? {}}
        brandName={settings.branding.name}
        logoStyle={settings.branding.logoStyle}
      />
      <FloatingActions context={pageName} />
    </div>
  );
}
