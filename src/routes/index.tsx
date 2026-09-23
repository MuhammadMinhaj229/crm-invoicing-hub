import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Lock,
  MessageCircle,
  Quote,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";

import { SiteFooter } from "../components/site/site-footer";
import { useThemeSync, useWorkspaceSettings } from "../hooks/use-workspace-settings";
import { defaultSections, fetchPublishedContent, type SectionContent } from "../lib/cms";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SAFAR N MANZIL — Gulf Assistance & Coordination for your family in India" },
      {
        name: "description",
        content:
          "You are in the Gulf, your family is in India. SAFAR N MANZIL handles groceries, parcels, home repairs, hospital visits and paperwork through verified local partners — with proof and clear pricing.",
      },
      { property: "og:title", content: "SAFAR N MANZIL — We do. We assist. We connect." },
      {
        property: "og:description",
        content:
          "Verified local partners handling groceries, parcels, repairs, healthcare and paperwork for your family back home.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

function str(content: SectionContent, key: string, fallback = ""): string {
  const value = content[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

function list<T>(content: SectionContent, key: string): T[] {
  const value = content[key];
  return Array.isArray(value) ? (value as T[]) : [];
}

function SiteHeader({ brandName, logoUrl }: { brandName: string; logoUrl?: string }) {
  const [open, setOpen] = useState(false);
  const links = [
    { label: "Services", href: "#services" },
    { label: "How it works", href: "#how-it-works" },
    { label: "FAQ", href: "#faq" },
    { label: "Contact", href: "#contact" },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-4">
        <a href="#top" className="flex items-center gap-2.5">
          {logoUrl ? (
            <img src={logoUrl} alt={brandName} className="h-9 w-9 rounded-xl object-cover" />
          ) : (
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary font-display text-sm font-bold text-primary-foreground">
              {brandName.charAt(0)}
            </span>
          )}
          <span className="font-display text-base font-semibold tracking-tight text-foreground">
            {brandName}
          </span>
        </a>

        <nav className="ml-auto hidden items-center gap-7 md:flex" aria-label="Main">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a
          href="#contact"
          className="ml-auto hidden rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 md:ml-0 md:inline-block"
        >
          Request assistance
        </a>

        <button
          onClick={() => setOpen((value) => !value)}
          className="ml-auto rounded-lg border border-border px-3 py-2 text-sm font-medium md:hidden"
          aria-expanded={open}
        >
          Menu
        </button>
      </div>

      {open ? (
        <div className="border-t border-border bg-background px-5 py-3 md:hidden">
          <ul className="space-y-1">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-2 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#contact"
                onClick={() => setOpen(false)}
                className="mt-1 block rounded-lg bg-primary px-3 py-2.5 text-center text-sm font-semibold text-primary-foreground"
              >
                Request assistance
              </a>
            </li>
          </ul>
        </div>
      ) : null}
    </header>
  );
}

function ContactForm({ whatsapp, email }: { whatsapp: string; email: string }) {
  const [form, setForm] = useState({ name: "", phone: "", city: "", need: "" });
  const digits = whatsapp.replace(/[^\d]/g, "");

  const message = `Hello SAFAR N MANZIL,%0A%0AName: ${encodeURIComponent(form.name)}%0APhone: ${encodeURIComponent(
    form.phone,
  )}%0ACity in India: ${encodeURIComponent(form.city)}%0AWhat is needed: ${encodeURIComponent(form.need)}`;

  const target = digits
    ? `https://wa.me/${digits}?text=${message}`
    : email
      ? `mailto:${email}?subject=${encodeURIComponent("Assistance request")}&body=${message}`
      : "";

  const fieldClass =
    "w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25";

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (target) window.open(target, "_blank", "noopener");
      }}
      className="rounded-2xl border border-border bg-card p-6 shadow-sm"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-foreground">
          Your name
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={`mt-1.5 ${fieldClass}`}
          />
        </label>
        <label className="text-sm font-medium text-foreground">
          Your number
          <input
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+971…"
            className={`mt-1.5 ${fieldClass}`}
          />
        </label>
        <label className="text-sm font-medium text-foreground sm:col-span-2">
          City in India
          <input
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className={`mt-1.5 ${fieldClass}`}
          />
        </label>
        <label className="text-sm font-medium text-foreground sm:col-span-2">
          What do you need done?
          <textarea
            required
            rows={4}
            value={form.need}
            onChange={(e) => setForm({ ...form, need: e.target.value })}
            placeholder="Monthly groceries for my parents in Hyderabad, first week of every month…"
            className={`mt-1.5 ${fieldClass}`}
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={!target}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50 sm:w-auto"
      >
        <MessageCircle className="h-4 w-4" />
        Send the request
      </button>
      {!target ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Add a WhatsApp number or email in the CRM under Website → Contact to activate this form.
        </p>
      ) : null}
    </form>
  );
}

function LandingPage() {
  const { settings } = useWorkspaceSettings();
  useThemeSync(settings);

  const fallback = useMemo(() => defaultSections(), []);
  const { data: sections = fallback } = useQuery({
    queryKey: ["cms-published"],
    queryFn: fetchPublishedContent,
    initialData: fallback,
  });

  const hero = sections['hero'] ?? {};
  const services = sections['services'] ?? {};
  const trust = sections['trust'] ?? {};
  const how = sections['how_it_works'] ?? {};
  const testimonials = sections['testimonials'] ?? {};
  const ctaSection = sections['cta'] ?? {};
  const faq = sections['faq'] ?? {};
  const contact = sections['contact'] ?? {};
  const footer = sections['footer'] ?? {};

  const brandName = settings.branding.name || "SAFAR N MANZIL";
  const testimonialItems = list<{ quote?: string; author?: string; location?: string }>(
    testimonials,
    "items",
  );

  return (
    <div id="top" className="min-h-screen bg-background text-foreground">
      <SiteHeader brandName={brandName} logoUrl={settings.branding.logoUrl} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-40 h-[420px] bg-[radial-gradient(60%_60%_at_50%_50%,var(--color-primary)_0%,transparent_70%)] opacity-25"
        />
        <div className="relative mx-auto max-w-6xl px-5 py-20 md:py-28">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {str(hero, "eyebrow", "Gulf Assistance & Coordination")}
          </p>
          <h1 className="mt-6 max-w-3xl font-display text-4xl font-bold leading-[1.08] tracking-tight text-foreground md:text-6xl">
            {str(hero, "title", "We do. We assist. We connect.")}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {str(hero, "subtitle")}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={str(hero, "primaryCtaHref", "#contact")}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              {str(hero, "primaryCtaLabel", "Request assistance")}
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href={str(hero, "secondaryCtaHref", "#how-it-works")}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3.5 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
            >
              {str(hero, "secondaryCtaLabel", "See how it works")}
            </a>
          </div>

          <ul className="mt-10 flex flex-wrap gap-x-7 gap-y-3">
            {list<string>(hero, "highlights").map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm font-medium text-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="border-t border-border bg-card/60 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            {str(services, "title", "What we handle")}
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">{str(services, "subtitle")}</p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list<{ title?: string; description?: string }>(services, "items").map((item) => (
              <article
                key={item.title}
                className="group rounded-2xl border border-border bg-background p-6 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <BadgeCheck className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            {str(trust, "title", "Built on accountability")}
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {list<{ title?: string; description?: string }>(trust, "items").map((item) => (
              <article key={item.title} className="rounded-2xl border border-border bg-card p-6">
                <ShieldCheck className="h-6 w-6 text-primary" />
                <h3 className="mt-4 font-display text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-y border-border bg-card/60 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            {str(how, "title", "How it works")}
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">{str(how, "subtitle")}</p>
          <ol className="mt-10 grid gap-4 md:grid-cols-4">
            {list<{ title?: string; description?: string }>(how, "steps").map((step, index) => (
              <li key={step.title} className="rounded-2xl border border-border bg-background p-6">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground">
                  {index + 1}
                </span>
                <h3 className="mt-4 font-display text-base font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Testimonials — only real ones, never placeholders */}
      {testimonialItems.length > 0 ? (
        <section className="py-20">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              {str(testimonials, "title", "Families we look after")}
            </h2>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {testimonialItems.map((item) => (
                <figure key={item.quote} className="rounded-2xl border border-border bg-card p-6">
                  <Quote className="h-5 w-5 text-primary" />
                  <blockquote className="mt-3 text-sm leading-relaxed text-foreground">
                    {item.quote}
                  </blockquote>
                  <figcaption className="mt-4 text-xs font-medium text-muted-foreground">
                    {item.author}
                    {item.location ? ` · ${item.location}` : ""}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* CTA */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-5">
          <div className="rounded-3xl bg-primary px-8 py-12 text-primary-foreground md:px-12">
            <h2 className="max-w-2xl font-display text-3xl font-bold tracking-tight md:text-4xl">
              {str(ctaSection, "title", "Something needs doing back home?")}
            </h2>
            <p className="mt-3 max-w-2xl text-primary-foreground/90">
              {str(ctaSection, "subtitle")}
            </p>
            <a
              href={str(ctaSection, "buttonHref", "#contact")}
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-background px-6 py-3.5 text-sm font-semibold text-foreground transition hover:opacity-90"
            >
              {str(ctaSection, "buttonLabel", "Talk to us")}
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20">
        <div className="mx-auto max-w-3xl px-5">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            {str(faq, "title", "Questions before you start")}
          </h2>
          <div className="mt-8 space-y-3">
            {list<{ question?: string; answer?: string }>(faq, "items").map((item) => (
              <details
                key={item.question}
                className="group rounded-2xl border border-border bg-card p-5 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-display text-base font-semibold">
                  {item.question}
                  <span className="text-primary transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="border-t border-border bg-card/60 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              {str(contact, "title", "Talk to a coordinator")}
            </h2>
            <p className="mt-3 text-muted-foreground">{str(contact, "subtitle")}</p>
            <ul className="mt-7 space-y-2.5 text-sm">
              {str(contact, "phone") ? (
                <li>
                  <a href={`tel:${str(contact, "phone")}`} className="font-medium hover:text-primary">
                    {str(contact, "phone")}
                  </a>
                </li>
              ) : null}
              {str(contact, "email") ? (
                <li>
                  <a href={`mailto:${str(contact, "email")}`} className="font-medium hover:text-primary">
                    {str(contact, "email")}
                  </a>
                </li>
              ) : null}
              {str(contact, "location") ? (
                <li className="text-muted-foreground">{str(contact, "location")}</li>
              ) : null}
            </ul>
            <Link
              to="/auth"
              className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
            >
              <Lock className="h-3.5 w-3.5" /> Team member? Open the CRM
            </Link>
          </div>
          <ContactForm whatsapp={str(contact, "whatsapp")} email={str(contact, "email")} />
        </div>
      </section>

      <SiteFooter footer={footer} contact={contact} brandName={brandName} />
    </div>
  );
}
