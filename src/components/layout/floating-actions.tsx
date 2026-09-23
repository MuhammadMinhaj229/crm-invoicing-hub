import { MessageCircle, Phone } from "lucide-react";

import { track } from "../../lib/analytics";
import { buildTelUrl, buildWhatsAppUrl } from "../../lib/whatsapp/url-builder";
import { generalEnquiryMessage } from "../../lib/whatsapp/templates";
import { useSiteContact } from "../../hooks/use-site-contact";
import { site } from "../../content/site";

/**
 * Persistent conversion actions. Each pill is a real link with a 44px+ target
 * and only renders when that channel is actually configured.
 */
export function FloatingActions({ context }: { context: string }) {
  const contact = useSiteContact();
  const whatsappUrl = buildWhatsAppUrl(contact.whatsapp, generalEnquiryMessage());
  const telUrl = buildTelUrl(contact.phone);

  if (!whatsappUrl && !telUrl) return null;

  return (
    <aside
      aria-label="Quick contact"
      className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 sm:bottom-6 sm:right-6"
    >
      {whatsappUrl ? (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track("whatsapp.clicked", { placement: "floating", context })}
          className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95"
        >
          <MessageCircle className="h-5 w-5" aria-hidden="true" />
          {site.cta.whatsapp}
        </a>
      ) : null}
      {telUrl ? (
        <a
          href={telUrl}
          onClick={() => track("phone.clicked", { placement: "floating", context })}
          className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-foreground/15 bg-card px-5 text-sm font-semibold text-foreground shadow-md transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95"
        >
          <Phone className="h-5 w-5" aria-hidden="true" />
          {site.cta.call}
        </a>
      ) : null}
    </aside>
  );
}
