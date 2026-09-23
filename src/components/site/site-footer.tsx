import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";

import type { SectionContent } from "../../lib/cms";

function str(content: SectionContent, key: string, fallback = ""): string {
  const value = content[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

export function SiteFooter({
  footer,
  contact,
  brandName,
}: {
  footer: SectionContent;
  contact: SectionContent;
  brandName: string;
}) {
  const links = Array.isArray(footer['links'])
    ? (footer['links'] as { label?: string; href?: string }[])
    : [];
  const whatsapp = str(contact, "whatsapp");
  const email = str(contact, "email");
  const phone = str(contact, "phone");

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-display text-lg font-semibold text-foreground">{brandName}</p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            {str(footer, "tagline", "Gulf Assistance & Coordination.")}
          </p>
          <p className="mt-4 text-sm font-medium uppercase tracking-[0.2em] text-primary">
            We do. We assist. We connect.
          </p>
        </div>

        <nav aria-label="Footer">
          <p className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Explore
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {links.map((link) => (
              <li key={`${link.label}-${link.href}`}>
                <a href={link.href ?? "#"} className="text-foreground hover:text-primary">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Reach us
          </p>
          <ul className="mt-3 space-y-2 text-sm text-foreground">
            {whatsapp ? (
              <li>
                <a
                  href={`https://wa.me/${whatsapp.replace(/[^\d]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary"
                >
                  WhatsApp
                </a>
              </li>
            ) : null}
            {phone ? (
              <li>
                <a href={`tel:${phone}`} className="hover:text-primary">
                  {phone}
                </a>
              </li>
            ) : null}
            {email ? (
              <li>
                <a href={`mailto:${email}`} className="hover:text-primary">
                  {email}
                </a>
              </li>
            ) : null}
            {!whatsapp && !phone && !email ? (
              <li className="text-muted-foreground">
                Add your contact details in the CRM under Website.
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>{str(footer, "legal", "© SAFAR N MANZIL. All rights reserved.")}</p>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 font-medium text-foreground transition hover:border-primary hover:text-primary"
          >
            <Lock className="h-3.5 w-3.5" />
            {str(footer, "crmLabel", "Team login")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
