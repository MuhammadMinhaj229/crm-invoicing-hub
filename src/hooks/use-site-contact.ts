import { useQuery } from "@tanstack/react-query";

import { site } from "../content/site";
import { fetchPublishedContent } from "../lib/cms";
import type { ContactChannels } from "../types/site";

function str(source: Record<string, unknown> | undefined, key: string, fallback: string): string {
  const value = source?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

/**
 * Live contact details. Defaults live in the content layer; the team can
 * override them from the console, and nothing is rendered when a channel is
 * still empty.
 */
export function useSiteContact(): ContactChannels {
  const { data } = useQuery({
    queryKey: ["published-content"],
    queryFn: fetchPublishedContent,
    staleTime: 5 * 60 * 1000,
  });

  const contact = data?.['contact'];
  return {
    whatsapp: str(contact, "whatsapp", site.contact.whatsapp),
    phone: str(contact, "phone", site.contact.phone),
    email: str(contact, "email", site.contact.email),
    location: str(contact, "location", site.contact.location),
  };
}
