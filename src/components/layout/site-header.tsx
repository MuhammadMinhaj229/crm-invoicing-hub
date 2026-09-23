import { useState, type CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, MessageCircle, X } from "lucide-react";

import { track } from "../../lib/analytics";
import { buildWhatsAppUrl } from "../../lib/whatsapp/url-builder";
import { generalEnquiryMessage } from "../../lib/whatsapp/templates";
import { BrandMark } from "../brand-mark";

/** The one site-wide header: rotating message bar + navigation. */
export function SiteHeader({
  brandName,
  logoUrl,
  logoStyle,
}: {
  brandName: string;
  logoUrl?: string;
  logoStyle: "lockup" | "image";
}) {
  const [open, setOpen] = useState(false);
  const links = [
    { label: "Our Process", href: "/about" },
    { label: "Going to Gulf", href: "/services" },
    { label: "Living in Gulf", href: "/services" },
    { label: "Reviews", href: "/faq" },
  ];
  const whatsappNumber = "917207071874";
  const whatsappUrl = buildWhatsAppUrl(whatsappNumber, generalEnquiryMessage());

  return (
    <header className="relative z-40 bg-card">
      <div className="relative h-9 overflow-hidden bg-foreground text-background" aria-label="SAFAR promises">
        <div className="utility-carousel">
          {["We do...", "We assist...", "We provide...", "We are always here...", "We are always with you..."].map((message, index) => (
            <span key={message} className="utility-message" style={{ "--message-index": index } as CSSProperties}>
              {message}
            </span>
          ))}
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="utility-message inline-flex items-center justify-center gap-2 font-bold text-background"
              style={{ "--message-index": 5 } as CSSProperties}
              onClick={() => track("whatsapp.clicked", { placement: "utility_bar" })}
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp Us: +91 72070 71874
            </a>
          ) : null}
        </div>
      </div>

      <div className="flex min-h-20 items-center gap-4 border-b border-border px-5 sm:px-8 lg:px-10">
        <Link to="/" className="min-w-0" aria-label={`${brandName} home`}>
          <BrandMark name={brandName} logoUrl={logoUrl} style={logoStyle} compact />
        </Link>

        <nav className="ml-auto hidden items-center gap-7 lg:flex" aria-label="Main navigation">
          {links.map((link) => (
            <Link key={`${link.href}-${link.label}`} to={link.href} className="text-sm font-semibold text-foreground/75 transition-colors hover:text-primary">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3 lg:ml-0">
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("whatsapp.clicked", { placement: "header" })}
              className="brand-button hidden min-h-11 items-center rounded-full bg-primary px-6 text-sm font-extrabold text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-md sm:inline-flex"
            >
              WhatsApp Us
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-primary text-primary transition-colors hover:bg-accent lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {open ? (
        <div id="mobile-navigation" className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close navigation menu" className="absolute inset-0 bg-foreground/35 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[min(88vw,22rem)] animate-slide-in-right flex-col bg-background p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-5">
              <BrandMark name={brandName} logoUrl={logoUrl} style={logoStyle} compact />
              <button type="button" onClick={() => setOpen(false)} aria-label="Close navigation menu" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border text-foreground hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="mt-7 flex flex-col" aria-label="Mobile navigation">
              {links.map((link) => (
                <Link key={`${link.href}-${link.label}`} to={link.href} onClick={() => setOpen(false)} className="border-b border-border py-4 text-base font-bold text-foreground hover:text-primary">
                  {link.label}
                </Link>
              ))}
              {whatsappUrl ? (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full border-2 border-primary px-5 text-sm font-extrabold text-primary">
                  WhatsApp Us
                </a>
              ) : null}
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  );
}
