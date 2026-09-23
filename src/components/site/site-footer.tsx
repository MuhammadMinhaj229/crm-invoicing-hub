import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Linkedin, Lock, Youtube, Globe2 } from "lucide-react";

import type { SectionContent } from "../../lib/cms";
import { BrandMark } from "../brand-mark";
import { useWorkspaceSettings } from "../../hooks/use-workspace-settings";

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
  const { settings } = useWorkspaceSettings();
  const SocialIcon = ({ platform }: { platform: string }) => platform === "instagram" ? <Instagram className="h-4 w-4" /> : platform === "facebook" ? <Facebook className="h-4 w-4" /> : platform === "linkedin" ? <Linkedin className="h-4 w-4" /> : platform === "youtube" ? <Youtube className="h-4 w-4" /> : <Globe2 className="h-4 w-4" />;
  const links = Array.isArray(footer['links'])
    ? (footer['links'] as { label?: string; href?: string }[])
    : [];
  const whatsapp = str(contact, "whatsapp");
  const email = str(contact, "email");
  const phone = str(contact, "phone");

  return (
    <footer className="bg-legacy-deep text-legacy-light">
      <div className="mx-auto grid max-w-[1280px] gap-12 px-6 py-16 sm:px-10 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <BrandMark name={brandName} style={logoStyle} inverse />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-legacy-light/60">
            {str(footer, "tagline", "We help Gulf families take care of their people back home in India.")}
          </p>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-primary">
            We do. We assist. We connect.
          </p>
        </div>

        <nav aria-label="Footer">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-legacy-light/40">
            Explore
          </p>
          <ul className="mt-4 space-y-3 text-sm">
            {links.map((link) => (
              <li key={`${link.label}-${link.href}`}>
                <a href={link.href ?? "#"} className="text-legacy-light/80 transition-colors hover:text-primary">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-legacy-light/40">
            Reach us
          </p>
          <ul className="mt-4 space-y-3 text-sm text-legacy-light/80">
            {whatsapp ? (
              <li>
                <a
                  href={`https://wa.me/${whatsapp.replace(/[^\d]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-primary"
                >
                  WhatsApp
                </a>
              </li>
            ) : null}
            {phone ? (
              <li>
                <a href={`tel:${phone}`} className="transition-colors hover:text-primary">
                  {phone}
                </a>
              </li>
            ) : null}
            {email ? (
              <li>
                <a href={`mailto:${email}`} className="transition-colors hover:text-primary">
                  {email}
                </a>
              </li>
            ) : null}
            {!whatsapp && !phone && !email ? (
               <li className="text-legacy-light/45">
                Add your contact details in the CRM under Website.
              </li>
            ) : null}
          </ul>
          {settings.socialLinks.some((item) => item.enabled && /^https:\/\//.test(item.url)) ? (
            <div className="mt-6 flex flex-wrap gap-2" aria-label="Social profiles">
              {settings.socialLinks.filter((item) => item.enabled && /^https:\/\//.test(item.url)).map((item) => (
                <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" aria-label={item.label} className="grid h-11 w-11 place-items-center rounded-full border border-legacy-light/15 text-legacy-light/75 transition hover:border-primary hover:text-primary"><SocialIcon platform={item.platform} /></a>
              ))}
            </div>
          ) : null}
        </div>
      </div>

       <div className="border-t border-legacy-light/10">
         <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-6 py-6 text-sm text-legacy-light/45 sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <p>{str(footer, "legal", "© SAFAR N MANZIL. All rights reserved.")}</p>
          <Link
            to="/auth"
             className="inline-flex items-center gap-2 rounded-full border border-legacy-light/15 px-4 py-2 font-medium text-legacy-light/75 transition hover:border-primary hover:text-primary"
          >
            <Lock className="h-3.5 w-3.5" />
            {str(footer, "crmLabel", "Team login")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
