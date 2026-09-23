import { createFileRoute, Link } from "@tanstack/react-router";
import { PublishedOr } from "../components/page-builder/published-page";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  FileCheck2,
  HeartHandshake,
  Home,
  Lock,
  Menu,
  MessageCircle,
  PackageCheck,
  Quote,
  ShieldCheck,
  ShoppingBasket,
  Stethoscope,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { track, trackPageView } from "../lib/analytics";
import { submitWebsiteEnquiry } from "../lib/website-capture";
import { buildWhatsAppUrl } from "../lib/whatsapp/url-builder";
import { generalEnquiryMessage } from "../lib/whatsapp/templates";

import { SiteFooter } from "../components/site/site-footer";
import { BrandMark } from "../components/brand-mark";
import { useThemeSync, useWorkspaceSettings } from "../hooks/use-workspace-settings";
import { defaultSections, fetchPublishedContent, type SectionContent } from "../lib/cms";
import heroFamily from "../assets/safar-hero-family.png";
import groceriesStory from "../assets/safar-story-groceries.png";
import repairsStory from "../assets/safar-story-repairs.png";
import healthcareStory from "../assets/safar-story-health.png";
import castArt from "../assets/safar-cast.png";
import updatesArt from "../assets/safar-updates.png";
import faceSon from "../assets/safar-face-son.png";
import faceDaughter from "../assets/safar-face-daughter.png";
import faceParents from "../assets/safar-face-parents.png";

const CAST_FACES = [faceSon, faceDaughter, faceParents];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SAFAR N MANZIL — Help for your family in India, while you work in the Gulf" },
      {
        name: "description",
        content:
          "You live in the Gulf, your family lives in India. We do the shopping, parcels, home repairs, hospital visits and paperwork for them, with photos and a clear price.",
      },
      { property: "og:title", content: "SAFAR N MANZIL — We do. We assist. We connect." },
      {
        property: "og:description",
        content:
          "People you can trust doing the shopping, parcels, repairs, hospital visits and paperwork for your family back home.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPageRoute,
});

function str(content: SectionContent, key: string, fallback = ""): string {
  const value = content[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

function list<T>(content: SectionContent, key: string): T[] {
  const value = content[key];
  return Array.isArray(value) ? (value as T[]) : [];
}

function SiteHeader({
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
    { label: "Questions", href: "/faq" },
  ];
  const whatsappNumber = "917207071874";
  const whatsappUrl = buildWhatsAppUrl(whatsappNumber, generalEnquiryMessage());

  return (
    <header className="relative z-40 bg-card">
      <div className="relative h-9 overflow-hidden bg-foreground text-background" aria-label="SAFAR promises">
        <div className="utility-carousel">
          {["We do...", "We assist...", "We provide...", "We are always here...", "We are always with you..."].map((message, index) => (
            <span key={message} className="utility-message" style={{ "--message-index": index } as React.CSSProperties}>
              {message}
            </span>
          ))}
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="utility-message inline-flex items-center justify-center gap-2 font-bold text-background"
              style={{ "--message-index": 5 } as React.CSSProperties}
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

function ContactForm({ whatsapp, email }: { whatsapp: string; email: string }) {
  const [form, setForm] = useState({ name: "", phone: "", city: "", need: "" });
  const [started, setStarted] = useState(false);
  const [sending, setSending] = useState(false);
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

  function noteStart() {
    if (started) return;
    setStarted(true);
    track("form.started");
  }

  return (
    <form
      onFocus={noteStart}
      onSubmit={(event) => {
        event.preventDefault();
        setSending(true);
        void submitWebsiteEnquiry({
          name: form.name,
          phone: form.phone,
          city: form.city,
          need: form.need,
        }).finally(() => {
          setSending(false);
          if (target) window.open(target, "_blank", "noopener");
        });
      }}
      className="rounded-lg border border-border bg-card p-6 shadow-sm"
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
        disabled={!target || sending}
        className="brand-button mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 sm:w-auto"
      >
        <MessageCircle className="h-4 w-4" />
        {sending ? "Sending…" : "Send the request"}
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

  useEffect(() => {
    trackPageView({ page: "home" });
  }, []);


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
  const cast = sections['cast'] ?? {};
  const updates = sections['updates'] ?? {};
  const promise = sections['promise'] ?? {};

  const brandName = settings.branding.name || "SAFAR N MANZIL";
  const testimonialItems = list<{ quote?: string; author?: string; location?: string }>(
    testimonials,
    "items",
  );
  const serviceItems = list<{ title?: string; description?: string }>(services, "items");
  const storyGroups = [
    {
      items: serviceItems.slice(0, 2),
      image: str(services, "groceriesImageUrl") || groceriesStory,
      alt: "Groceries delivered to parents in India with an update sent to family in the Gulf",
      Icon: ShoppingBasket,
    },
    {
      items: serviceItems.slice(2, 3).concat(serviceItems.slice(5, 6)),
      image: str(services, "repairsImageUrl") || repairsStory,
      alt: "A trusted worker fixing something at home while our man takes photos",
      Icon: Home,
    },
    {
      items: serviceItems.slice(3, 5),
      image: str(services, "healthcareImageUrl") || healthcareStory,
      alt: "Our man taking an elderly parent to see the doctor",
      Icon: Stethoscope,
    },
  ];

  return (
    <div id="top" className="min-h-screen bg-background text-foreground">
      <main>
      <div className="bg-accent/45 px-0 py-0 sm:px-4 sm:py-4 lg:px-7 lg:py-7">
       <div className="mx-auto max-w-[1480px] overflow-hidden bg-card shadow-xl sm:rounded-lg sm:border sm:border-border/70">
        <SiteHeader
          brandName={brandName}
          logoUrl={settings.branding.logoUrl}
          logoStyle={settings.branding.logoStyle}
        />
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border">
        <div className="mx-auto grid max-w-7xl items-center gap-6 px-5 py-10 sm:py-14 md:min-h-[660px] md:grid-cols-[0.92fr_1.08fr] md:gap-8 md:py-16">
          <div className="relative z-10 order-1 md:col-start-1 md:row-start-1 md:self-end">
            <p className="text-xs font-extrabold uppercase tracking-wide text-primary">
              {str(hero, "eyebrow", "Help for your family back home")}
            </p>
            <h1 className="site-display mt-4 max-w-2xl font-display text-[2.1rem] font-extrabold leading-[1.08] text-foreground sm:text-5xl md:text-6xl">
              {str(hero, "title", "We do. We assist. We connect.")}
            </h1>
          </div>

          <div className="relative order-2 md:order-none md:col-start-2 md:row-span-2 md:row-start-1 md:-mr-16 md:self-center">
            <div
              aria-hidden
              className="absolute inset-x-4 top-6 bottom-6 -z-10 rounded-[2.5rem] bg-accent/60 blur-2xl"
            />
            <img
              src={str(hero, "imageUrl") || heroFamily}
              alt={str(hero, "imageAlt", "A Gulf-based family member coordinating trusted help for parents in India")}
              width={1600}
              height={1008}
              fetchPriority="high"
              className="w-full rounded-2xl object-cover object-center md:rounded-none"
            />
          </div>

          <div className="relative z-10 order-3 md:col-start-1 md:row-start-2 md:self-start">
            <p className="max-w-xl text-base leading-7 text-muted-foreground md:text-lg">
              {str(hero, "subtitle")}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href={str(hero, "primaryCtaHref", "#contact")}
                onClick={() => track("cta.clicked", { place: "hero", label: str(hero, "primaryCtaLabel", "Ask for help") })}
                className="brand-button inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-4 text-base font-bold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:py-3.5 sm:text-sm"
              >
                {str(hero, "primaryCtaLabel", "Ask for help")}
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href={str(hero, "secondaryCtaHref", "#how-it-works")}
                className="brand-button inline-flex items-center justify-center gap-2 rounded-lg border border-foreground/20 bg-background px-6 py-4 text-base font-bold text-foreground transition hover:border-primary hover:text-primary sm:py-3.5 sm:text-sm"
              >
                {str(hero, "secondaryCtaLabel", "See how it works")}
              </a>
            </div>

            {settings.websiteAppearance.showHeroHighlights ? <ul className="mt-8 grid gap-3 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">
            {list<string>(hero, "highlights").map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm font-medium text-foreground">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                {item}
              </li>
            ))}
            </ul> : null}
          </div>
        </div>
        <a href="#services" aria-label="Explore services" className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 text-muted-foreground md:block">
          <ChevronDown className="h-6 w-6 animate-bounce" />
        </a>
        </section>
       </div>
      </div>

      {/* The promise — the emotional hook for families in the Gulf */}
      <section className="border-b border-border bg-accent/40 py-14 md:py-20">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <p className="text-xs font-extrabold uppercase tracking-wide text-primary">
            {str(promise, "eyebrow", "We understand")}
          </p>
          <h2 className="site-display mt-3 font-display text-3xl font-extrabold leading-tight md:text-4xl">
            {str(promise, "title", "You can't always be there for your parents in India. But we can.")}
          </h2>
          <p className="mt-5 text-base leading-8 text-muted-foreground md:text-lg">
            {str(promise, "body")}
          </p>
          <a
            href="#contact"
            onClick={() => track("cta.clicked", { place: "promise", label: "Ask for help now" })}
            className="brand-button mt-8 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-7 py-4 text-base font-bold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:py-3.5 sm:text-sm"
          >
            Ask for help now
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* Who we help */}
      <section className="border-b border-border bg-card py-14 md:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-wide text-primary">
              {str(cast, "eyebrow", "Who we help")}
            </p>
            <h2 className="site-display mt-3 font-display text-3xl font-extrabold md:text-4xl">
              {str(cast, "title", "One family, two countries")}
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">{str(cast, "subtitle")}</p>
          </div>

          <img
            src={castArt}
            alt="A son and daughter in the Gulf, our helper in the middle, and parents at home in India"
            loading="lazy"
            width={1600}
            height={912}
            className="mt-8 aspect-[16/9] w-full rounded-2xl object-cover shadow-sm"
          />

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {list<{ name?: string; description?: string }>(cast, "items").map((item, index) => (
              <article key={item.name ?? index} className="rounded-xl border border-border bg-background p-5">
                <img
                  src={CAST_FACES[index % CAST_FACES.length]}
                  alt=""
                  aria-hidden
                  loading="lazy"
                  width={816}
                  height={816}
                  className="h-16 w-16 shrink-0 rounded-full object-cover"
                />
                <h3 className="mt-4 font-display text-lg font-semibold">{item.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-5">
          <div className="max-w-2xl">
          <p className="text-xs font-extrabold uppercase text-primary">Practical help, handled properly</p>
          <h2 className="site-display mt-3 font-display text-3xl font-extrabold md:text-5xl">
            {str(services, "title", "What we handle")}
          </h2>
          <p className="mt-4 leading-7 text-muted-foreground">{str(services, "subtitle")}</p>
          </div>

          {settings.websiteAppearance.sectionStyle === "grid" ? <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {serviceItems.map((item) => (
              <article
                key={item.title}
                className="group rounded-lg border border-border bg-card p-6 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
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
          </div> : <div className="mt-14 space-y-20 md:space-y-28">
            {storyGroups.map((group, groupIndex) => (
              <article key={groupIndex} className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
                <div className={groupIndex % 2 ? "md:order-2" : ""}>
                  <img src={group.image} alt={group.alt} loading="lazy" width={1200} height={912} className="aspect-[4/3] w-full rounded-lg object-cover shadow-sm" />
                </div>
                <div className={groupIndex % 2 ? "md:order-1" : ""}>
                  <group.Icon className="h-7 w-7 text-primary" />
                  <div className="mt-5 divide-y divide-border">
                    {group.items.map((item) => (
                      <div key={item.title} className="py-5 first:pt-0 last:pb-0">
                        <h3 className="site-display font-display text-2xl font-bold text-foreground">{item.title}</h3>
                        <p className="mt-3 leading-7 text-muted-foreground">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>}
        </div>
      </section>

      {/* Trust */}
      {settings.websiteAppearance.showTrustSection ? <section className="border-y border-border bg-card py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-5">
           <p className="text-xs font-extrabold uppercase text-primary">Trust is the service</p>
           <h2 className="site-display mt-3 font-display text-3xl font-extrabold md:text-4xl">
            {str(trust, "title", "Built on accountability")}
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {list<{ title?: string; description?: string }>(trust, "items").map((item) => (
               <article key={item.title} className="border-l-2 border-primary py-2 pl-5">
                <ShieldCheck className="h-6 w-6 text-primary" />
                <h3 className="mt-4 font-display text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section> : null}

      {/* Photo updates */}
      <section className="py-14 md:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 md:grid-cols-2 md:gap-14">
          <img
            src={str(updates, "imageUrl") || updatesArt}
            alt="A family member in the Gulf seeing a photo update of work finished at home in India"
            loading="lazy"
            width={1200}
            height={912}
            className="w-full rounded-2xl object-cover shadow-sm"
          />
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-primary">
              {str(updates, "eyebrow", "You always know")}
            </p>
            <h2 className="site-display mt-3 font-display text-3xl font-extrabold md:text-4xl">
              {str(updates, "title", "Every job comes back with proof")}
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">{str(updates, "subtitle")}</p>
            <ul className="mt-6 space-y-3">
              {list<string>(updates, "points").map((point) => (
                <li key={point} className="flex items-start gap-3 text-base text-foreground">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>


      {/* How it works */}
      {settings.websiteAppearance.showProcessSection ? <section id="how-it-works" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            {str(how, "title", "How it works")}
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">{str(how, "subtitle")}</p>
          <ol className="relative mt-12 grid gap-8 md:grid-cols-4 md:before:absolute md:before:left-[12.5%] md:before:right-[12.5%] md:before:top-[18px] md:before:h-px md:before:bg-border">
            {list<{ title?: string; description?: string }>(how, "steps").map((step, index) => (
              <li key={step.title} className="relative bg-background">
                <span className="relative z-10 grid h-9 w-9 place-items-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground">
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
      </section> : null}

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
          <div className="rounded-lg bg-foreground px-8 py-12 text-background md:px-12">
            <h2 className="max-w-2xl font-display text-3xl font-bold tracking-tight md:text-4xl">
              {str(ctaSection, "title", "Something needs doing back home?")}
            </h2>
             <p className="mt-3 max-w-2xl text-background/80">
              {str(ctaSection, "subtitle")}
            </p>
            <a
              href={str(ctaSection, "buttonHref", "#contact")}
              onClick={() => track("cta.clicked", { place: "closing", label: str(ctaSection, "buttonLabel", "Talk to us") })}
               className="brand-button mt-7 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition hover:-translate-y-0.5"
            >
              {str(ctaSection, "buttonLabel", "Talk to us")}
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      {settings.websiteAppearance.showFaqSection ? <section id="faq" className="py-20">
        <div className="mx-auto max-w-3xl px-5">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            {str(faq, "title", "Questions before you start")}
          </h2>
          <div className="mt-8 space-y-3">
            {list<{ question?: string; answer?: string }>(faq, "items").map((item) => (
              <details
                key={item.question}
                className="group rounded-lg border border-border bg-card p-5 [&_summary::-webkit-details-marker]:hidden"
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
      </section> : null}

      {/* Contact */}
      <section id="contact" className="border-t border-border bg-secondary/20 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              {str(contact, "title", "Talk to us")}
            </h2>
            <p className="mt-3 text-muted-foreground">{str(contact, "subtitle")}</p>
            <ul className="mt-7 space-y-2.5 text-sm">
              {str(contact, "phone") ? (
                <li>
                  <a
                    href={`tel:${str(contact, "phone")}`}
                    onClick={() => track("phone.clicked", { place: "contact" })}
                    className="font-medium hover:text-primary"
                  >
                    {str(contact, "phone")}
                  </a>
                </li>
              ) : null}
              {str(contact, "email") ? (
                <li>
                  <a
                    href={`mailto:${str(contact, "email")}`}
                    onClick={() => track("email.clicked", { place: "contact" })}
                    className="font-medium hover:text-primary"
                  >
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
      </main>

      <SiteFooter
        footer={footer}
        contact={contact}
        brandName={brandName}
        logoStyle={settings.branding.logoStyle}
      />

      {str(contact, "whatsapp") ? (
        <a
          href={`https://wa.me/${str(contact, "whatsapp").replace(/[^\d]/g, "")}`}
          target="_blank"
          rel="noopener"
          onClick={() => track("cta.clicked", { place: "sticky", label: "WhatsApp" })}
          className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-4 text-sm font-bold text-primary-foreground shadow-lg md:hidden"
        >
          <MessageCircle className="h-5 w-5" />
          WhatsApp us
        </a>
      ) : null}
    </div>
  );
}

function LandingPageRoute() {
  return (
    <PublishedOr page="home" pageName="home">
      <LandingPage />
    </PublishedOr>
  );
}
