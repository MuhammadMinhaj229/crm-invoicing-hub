import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";

import type { SectionContent } from "../../lib/cms";
import { BrandMark } from "../brand-mark";

function str(content: SectionContent, key: string, fallback = ""): string {
  const value = content[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

export function SiteFooter({
  footer,
  contact,
  brandName,
  logoStyle = "lockup",
}: {
  footer: SectionContent;
  contact: SectionContent;
  brandName: string;
  logoStyle?: "lockup" | "image";
}) {
  const links = Array.isArray(footer['links'])
    ? (footer['links'] as { label?: string; href?: string }[])
    : [];
  const whatsapp = str(contact, "whatsapp");
  const email = str(contact, "email");
  const phone = str(contact, "phone");

  return (
    <footer className="border-t border-foreground/10 bg-foreground text-background">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <BrandMark name={brandName} style={logoStyle} inverse />
          <p className="mt-4 max-w-sm text-sm text-background/70">
            {str(footer, "tagline", "We help Gulf families take care of their people back home in India.")}
          </p>
          <p className="mt-4 text-sm font-bold uppercase text-primary">
            We do. We assist. We connect.
          </p>
        </div>

        <nav aria-label="Footer">
          <p className="font-display text-sm font-semibold uppercase text-background/60">
            Explore
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {links.map((link) => (
              <li key={`${link.label}-${link.href}`}>
                <a href={link.href ?? "#"} className="text-background hover:text-primary">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="font-display text-sm font-semibold uppercase text-background/60">
            Reach us
          </p>
          <ul className="mt-3 space-y-2 text-sm text-background">
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
               <li className="text-background/60">
                Add your contact details in the CRM under Website.
              </li>
            ) : null}
          </ul>
        </div>
      </div>

       <div className="border-t border-background/15">
         <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-5 text-sm text-background/60 sm:flex-row sm:items-center sm:justify-between">
          <p>{str(footer, "legal", "© SAFAR N MANZIL. All rights reserved.")}</p>
          <Link
            to="/auth"
             className="inline-flex items-center gap-2 rounded-lg border border-background/25 px-3 py-2 font-medium text-background transition hover:border-primary hover:text-primary"
          >
            <Lock className="h-3.5 w-3.5" />
            {str(footer, "crmLabel", "Team login")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
