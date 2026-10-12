import { useQuery } from "@tanstack/react-query";

import { site } from "../content/site";
import { loadHomeSections } from "../content/home-sections";
import { fetchCmsSiteConfiguration } from "../lib/page-builder/store";
import type { ContactChannels } from "../types/site";
import { useWorkspaceSettings } from "./use-workspace-settings";

function str(source: Record<string, unknown> | undefined, key: string, fallback: string): string {
  const value = source?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

/**
 * Live contact details. Defaults live in the content layer; the team can
 * override them from the console, and nothing is rendered when a channel is
 * still empty.
 */
export function useSiteContact(options: { enabled?: boolean } = {}): ContactChannels {
  const enabled = options.enabled ?? true;
  const { settings } = useWorkspaceSettings({ loadShared: enabled });
  const { data } = useQuery({
    queryKey: ["published-content"],
    queryFn: loadHomeSections,
    staleTime: 5 * 60 * 1000,
    enabled,
  });

  const contact = data?.['contact'];
  const configured = settings.publicContact;
  const { data: cmsConfiguration } = useQuery({
    queryKey: ["cms-site-config"],
    queryFn: fetchCmsSiteConfiguration,
    staleTime: 15_000,
    refetchInterval: enabled ? 15_000 : false,
    enabled,
  });
  const cmsSite = cmsConfiguration?.content["site"];
  const cmsContact = cmsSite && typeof cmsSite === "object" && !Array.isArray(cmsSite)
    ? (cmsSite as Record<string, unknown>)["contact"]
    : undefined;
  const cmsLocation = cmsSite && typeof cmsSite === "object" && !Array.isArray(cmsSite)
    ? (cmsSite as Record<string, unknown>)["location"]
    : undefined;
  const hasCmsConfiguration = Boolean(cmsConfiguration);
  const cmsValue = (source: unknown, key: string): string => {
    if (!source || typeof source !== "object" || Array.isArray(source)) return "";
    const value = (source as Record<string, unknown>)[key];
    return typeof value === "string" ? value.trim() : "";
  };

  // Once the canonical CMS config exists, its explicit empty values are
  // respected too. Legacy app_settings/content are only a pre-bootstrap fallback.
  return {
    whatsapp: hasCmsConfiguration
      ? cmsValue(cmsContact, "whatsapp")
      : configured.whatsapp || str(contact, "whatsapp", site.contact.whatsapp),
    phone: hasCmsConfiguration
      ? cmsValue(cmsContact, "phone")
      : configured.phone || str(contact, "phone", site.contact.phone),
    email: hasCmsConfiguration
      ? cmsValue(cmsContact, "email")
      : configured.email || str(contact, "email", site.contact.email),
    location: hasCmsConfiguration
      ? cmsValue(cmsContact, "location") || cmsValue(cmsLocation, "city")
      : configured.location || str(contact, "location", site.contact.location),
  };
}
