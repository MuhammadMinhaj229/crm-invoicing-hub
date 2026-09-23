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
import { SiteHeader } from "./site-header";
import { SiteFooter } from "../site/site-footer";
import { AmbientBackground } from "../motion/primitives";
import { FloatingActions } from "./floating-actions";
import { fetchPublishedDocument } from "../../lib/page-builder/store";

/**
 * Shared frame for every public page: brand header, ambient background,
 * CMS-driven footer and the persistent contact actions.
 */
export function PageShell({ children, pageName }: { children: ReactNode; pageName: string }) {
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
        footer={sections["footer"] ?? {}}
        contact={sections["contact"] ?? {}}
        brandName={settings.branding.name}
        logoStyle={settings.branding.logoStyle}
      />
      <FloatingActions context={pageName} />
    </div>
  );
}
