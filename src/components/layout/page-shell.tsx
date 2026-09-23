import { useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import { trackPageView } from "../../lib/analytics";
import { defaultSections, fetchPublishedContent } from "../../lib/cms";
import { useThemeSync, useWorkspaceSettings } from "../../hooks/use-workspace-settings";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "../site/site-footer";
import { AmbientBackground } from "../motion/primitives";
import { FloatingActions } from "./floating-actions";

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
