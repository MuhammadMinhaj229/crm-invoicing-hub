import { useEffect, useState, type CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";

import { track } from "../../lib/analytics";
import { buildWhatsAppUrl } from "../../lib/whatsapp/url-builder";
import { generalEnquiryMessage } from "../../lib/whatsapp/templates";
import { BrandMark } from "../brand-mark";

/** The one site-wide header: a floating frosted navigation bar. */
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Our Process", href: "/about" },
    { label: "Services", href: "/services" },
    { label: "Questions", href: "/faq" },
    { label: "Contact", href: "/contact" },
  ];
  const whatsappNumber = "917207071874";
  const whatsappUrl = buildWhatsAppUrl(whatsappNumber, generalEnquiryMessage());
  const messages = ["We do...", "We assist...", "We provide...", "We are always here...", "We are always with you..."];

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
      <div className="mx-auto w-full max-w-[1280px] px-4 pt-3 sm:px-6 sm:pt-4">
        <div
          className={`glass-nav pointer-events-auto flex min-h-16 items-center gap-4 rounded-full px-3 pr-3 transition-all duration-300 sm:px-4 ${
            scrolled ? "shadow-lift" : ""
          }`}
        >
          <Link to="/" className="min-w-0 shrink-0 pl-1" aria-label={`${brandName} home`}>
            <BrandMark name={brandName} logoUrl={logoUrl} style={logoUrl ? logoStyle : "image"} compact />
          </Link>

          <div className="utility-carousel relative hidden h-6 w-44 shrink-0 xl:block" aria-hidden>
            {messages.map((message, index) => (
              <span
                key={message}
                className="utility-message !justify-start !px-0 !text-[0.68rem] !font-semibold uppercase tracking-[0.16em] text-legacy-ink/40"
                style={{ "--message-index": index } as CSSProperties}
              >
                {message}
              </span>
            ))}
          </div>

          <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            {links.map((link) => (
              <Link
                key={`${link.href}-${link.label}`}
                to={link.href}
                className="rounded-full px-4 py-2 text-sm font-semibold text-legacy-ink/70 transition-colors hover:bg-legacy-ink/5 hover:text-legacy-ink"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 lg:ml-2">
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("whatsapp.clicked", { placement: "header" })}
                className="hidden min-h-11 items-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground shadow-soft transition hover:-translate-y-0.5 sm:inline-flex"
              >
                WhatsApp Us
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-legacy-ink/10 bg-legacy-light/70 text-legacy-ink transition-colors hover:bg-legacy-ink/5 lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-navigation"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {open ? (
        <div id="mobile-navigation" className="pointer-events-auto fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            className="absolute inset-0 bg-legacy-deep/45 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 flex w-[min(88vw,22rem)] animate-slide-in-right flex-col bg-legacy-light p-6 shadow-lift">
            <div className="flex items-center justify-between border-b border-legacy-ink/10 pb-5">
              <BrandMark name={brandName} logoUrl={logoUrl} style={logoUrl ? logoStyle : "image"} compact />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation menu"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-legacy-ink/10 text-legacy-ink hover:bg-legacy-ink/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="mt-6 flex flex-col" aria-label="Mobile navigation">
              {links.map((link) => (
                <Link
                  key={`${link.href}-${link.label}`}
                  to={link.href}
                  onClick={() => setOpen(false)}
                  className="border-b border-legacy-ink/8 py-4 text-base font-semibold text-legacy-ink transition-colors hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground"
                >
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
