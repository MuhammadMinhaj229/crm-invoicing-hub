import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ChevronRight, HeartHandshake, Lock, MessageCircle, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import heroFamily from "../assets/safar-hero-family.png";
import groceriesStory from "../assets/safar-story-groceries.png";
import healthcareStory from "../assets/safar-story-health.png";
import repairsStory from "../assets/safar-story-repairs.png";
import campaignDreams from "../assets/safar-campaign-dreams.png.asset.json";
import campaignWorries from "../assets/safar-campaign-family-worries.png.asset.json";
import campaignJourney from "../assets/safar-campaign-how-it-works.png.asset.json";
import serviceFilm from "../assets/safar-services-cinematic.mp4.asset.json";
import { SiteHeader } from "../components/layout/site-header";
import { PublishedOr } from "../components/page-builder/published-page";
import { SiteFooter } from "../components/site/site-footer";
import { StoryCarousel, type StorySlide } from "../components/site/story-carousel";
import { InvoiceExample } from "../components/site/invoice-example";
import { ServiceFilm } from "../components/site/service-film";
import { useThemeSync, useWorkspaceSettings } from "../hooks/use-workspace-settings";
import { track, trackPageView } from "../lib/analytics";
import { defaultSections, fetchPublishedContent, type SectionContent } from "../lib/cms";
import { submitWebsiteEnquiry } from "../lib/website-capture";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Safar N manzil — Your care, carried home" },
      {
        name: "description",
        content:
          "Practical help for your family in India, coordinated while you live in the Gulf—with the plan, price and proof shared clearly.",
      },
      { property: "og:title", content: "Safar N manzil — Your care, carried home" },
      {
        property: "og:description",
        content: "One trusted point of contact for family needs in India, from the first request to the final update.",
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
  return Array.isArray(content[key]) ? (content[key] as T[]) : [];
}

const SERVICE_ART = [groceriesStory, groceriesStory, repairsStory, healthcareStory, healthcareStory, repairsStory];

function Eyebrow({ children, light = false }: { children: string; light?: boolean }) {
  return (
    <p
      className={`inline-flex items-center gap-2.5 rounded-full px-3.5 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] ${
        light ? "bg-legacy-light/10 text-legacy-light/80" : "bg-primary/10 text-primary"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${light ? "bg-primary" : "bg-primary"}`} />
      {children}
    </p>
  );
}

function ContactForm({ whatsapp, email }: { whatsapp: string; email: string }) {
  const [form, setForm] = useState({ name: "", phone: "", city: "", need: "" });
  const [sending, setSending] = useState(false);
  const digits = whatsapp.replace(/[^\d]/g, "");
  const message = `Hello Safar N manzil,%0A%0AName: ${encodeURIComponent(form.name)}%0APhone: ${encodeURIComponent(form.phone)}%0ACity in India: ${encodeURIComponent(form.city)}%0AWhat is needed: ${encodeURIComponent(form.need)}`;
  const target = digits
    ? `https://wa.me/${digits}?text=${message}`
    : email
      ? `mailto:${email}?subject=${encodeURIComponent("Family assistance request")}&body=${message}`
      : "";
  const fieldClass =
    "mt-2 min-h-12 w-full rounded-xl border border-legacy-ink/12 bg-legacy-warm px-4 py-3 text-sm font-medium text-legacy-ink outline-none transition placeholder:font-normal placeholder:text-legacy-ink/35 focus:border-primary focus:bg-legacy-light focus:ring-4 focus:ring-primary/12";
  const labelClass = "block text-xs font-bold uppercase tracking-[0.12em] text-legacy-ink/55";

  return (
    <form
      className="grid gap-5 md:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        setSending(true);
        void submitWebsiteEnquiry(form).finally(() => {
          setSending(false);
          if (target) window.open(target, "_blank", "noopener");
        });
      }}
    >
      <label className={labelClass}>
        Your name
        <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={fieldClass} />
      </label>
      <label className={labelClass}>
        Your WhatsApp number
        <input required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className={fieldClass} placeholder="Include country code" />
      </label>
      <label className={labelClass}>
        Family's city in India
        <input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} className={fieldClass} />
      </label>
      <label className={labelClass}>
        What do they need?
        <input required value={form.need} onChange={(event) => setForm({ ...form, need: event.target.value })} className={fieldClass} placeholder="Tell us in your own words" />
      </label>
      <button
        type="submit"
        disabled={!target || sending}
        className="mt-1 inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-primary px-7 font-bold text-primary-foreground shadow-soft transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 md:col-span-2 md:justify-self-start"
      >
        <MessageCircle className="h-5 w-5" />
        {sending ? "Sending…" : "Send my request"}
      </button>
      {!target ? <p className="text-sm font-normal normal-case tracking-normal text-legacy-ink/55 md:col-span-2">Add your WhatsApp number or email in the CRM to activate requests.</p> : null}
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
  const [activeService, setActiveService] = useState(0);

  useEffect(() => trackPageView({ page: "home" }), []);

  const hero = sections["hero"] ?? {};
  const promise = sections["promise"] ?? {};
  const services = sections["services"] ?? {};
  const trust = sections["trust"] ?? {};
  const how = sections["how_it_works"] ?? {};
  const updates = sections["updates"] ?? {};
  const faq = sections["faq"] ?? {};
  const contact = sections["contact"] ?? {};
  const footer = sections["footer"] ?? {};
  const serviceItems = list<{ title?: string; description?: string }>(services, "items");
  const service = serviceItems[activeService] ?? serviceItems[0];
  const journey = list<{ title?: string; description?: string }>(how, "steps");
  const trustItems = list<{ title?: string; description?: string }>(trust, "items");
  const proofPoints = list<string>(updates, "points");
  const brandName = "Safar N manzil";
  const publicContact = settings.publicContact;
  const storySlides: StorySlide[] = [
    { id: "dreams", title: "You carry the dream.", accent: "We help carry the responsibility.", text: "While you build a future in the Gulf, we help with the things that still need doing at home.", image: campaignDreams.url, imageAlt: "A Gulf resident thinking about family and responsibilities in India" },
    { id: "worries", title: "Your family’s needs", accent: "still reach you first.", text: "Groceries, appointments, repairs and paperwork can feel heavier when you have to solve them from another country.", image: campaignWorries.url, imageAlt: "A family in India sharing practical concerns with a relative in the Gulf" },
    { id: "journey", title: "One message starts", accent: "a clear journey.", text: "Tell us what is needed. We confirm the task, share the plan, wait for approval and return with an update.", image: campaignJourney.url, imageAlt: "A simple illustrated journey from request to completed help" },
  ];

  const journeySteps = [
    { title: journey[0]?.title || "You message us", text: journey[0]?.description || "Tell us the need in your own words." },
    { title: journey[1]?.title || "You approve", text: journey[1]?.description || "See the plan and the cost before work." },
    { title: journey[2]?.title || "Proof returns", text: journey[2]?.description || "Photos and a clear bill come back to you." },
  ];

  return (
    <div className="min-h-screen overflow-x-clip bg-legacy-warm text-legacy-ink antialiased">
      <SiteHeader brandName={brandName} logoUrl={settings.branding.logoUrl} logoStyle={settings.branding.logoStyle} />
      <main>
        {/* Hero — the single dark, cinematic moment */}
        <section className="relative overflow-hidden bg-legacy-warm px-3 pt-3 sm:px-4 sm:pt-4">
          <div className="relative overflow-hidden rounded-[1.75rem] bg-legacy-deep text-legacy-light sm:rounded-[2.5rem]">
            <div className="legacy-grid absolute inset-0 opacity-[0.12]" aria-hidden />
            <div
              className="absolute -right-24 top-0 h-[38rem] w-[38rem] rounded-full opacity-40 blur-3xl"
              style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--legacy-coral) 42%, transparent), transparent 70%)" }}
              aria-hidden
            />
            <div className="relative mx-auto grid max-w-[1280px] items-center gap-10 px-6 pb-14 pt-28 sm:px-10 md:grid-cols-[1fr_1fr] md:pb-20 md:pt-36 lg:gap-16">
              <div className="relative z-10">
                <Eyebrow light>{str(hero, "eyebrow", "From the Gulf to your family in India")}</Eyebrow>
                <h1 className="mt-6 max-w-2xl font-display text-[2.75rem] font-semibold leading-[1.02] tracking-[-0.02em] sm:text-6xl lg:text-7xl">
                  Your care,
                  <span className="block text-primary">carried home.</span>
                </h1>
                <p className="mt-6 max-w-lg text-base leading-relaxed text-legacy-light/65 md:text-lg">
                  {str(hero, "subtitle", "Tell us what your family needs in India. We coordinate it while you live in the Gulf, and keep the plan, price and result clear.")}
                </p>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="#contact"
                    onClick={() => track("cta.clicked", { place: "hero", label: "Tell us what they need" })}
                    className="inline-flex min-h-14 items-center justify-center gap-2.5 rounded-full bg-primary px-8 font-bold text-primary-foreground shadow-lift transition hover:-translate-y-0.5"
                  >
                    Tell us what they need <ArrowRight className="h-5 w-5" />
                  </a>
                  <a
                    href="#journey"
                    className="inline-flex min-h-14 items-center justify-center rounded-full border border-legacy-light/20 px-8 font-semibold text-legacy-light/85 transition hover:border-legacy-light/45 hover:bg-legacy-light/5"
                  >
                    See the care journey
                  </a>
                </div>
              </div>

              <div className="relative">
                <div className="relative overflow-hidden rounded-[1.5rem] border border-legacy-light/10 sm:rounded-[2rem]">
                  <img
                    src={str(hero, "imageUrl") || heroFamily}
                    alt={str(hero, "imageAlt", "A family member in the Gulf arranging trusted help for parents in India")}
                    width={1280}
                    height={960}
                    fetchPriority="high"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="glass-nav-dark mt-4 flex items-center gap-4 rounded-2xl p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                    <HeartHandshake className="h-5 w-5" />
                  </span>
                  <p className="text-sm leading-5 text-legacy-light/70">
                    <strong className="block font-semibold text-legacy-light">One person stays accountable</strong>
                    From your first message to the update that comes back.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Service film */}
        <section id="film" className="relative bg-legacy-light py-16 md:py-20">
          <div className="mx-auto max-w-[1280px] px-6 sm:px-10">
            <ServiceFilm
              src={serviceFilm.url}
              title={str(updates, "title", "See the care, not just the promise.")}
              text={str(updates, "subtitle", "Watch how a single message turns into real help at home — and the photo proof that comes back to you.")}
              {...(proofPoints.length ? { points: proofPoints } : {})}
            />
          </div>
        </section>


        {/* Recognition */}
        <section id="recognition" className="bg-legacy-warm py-16 md:py-24">
          <div className="mx-auto max-w-[1280px] px-6 sm:px-10">
            <div className="max-w-3xl">
              <Eyebrow>{str(promise, "eyebrow", "A moment you know")}</Eyebrow>
              <h2 className="mt-6 font-display text-3xl font-semibold leading-[1.08] tracking-[-0.02em] md:text-5xl">
                They call you first. <span className="text-primary">Even when you are far away.</span>
              </h2>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                ["The need", "Repairs, hospital visits, groceries, paperwork."],
                ["The worry", "Someone must treat their time and money with care."],
                ["The relief", "We become that person, and you stay informed."],
              ].map(([title, text]) => (
                <article key={title} className="soft-card p-6">
                  <h3 className="font-display text-xl font-semibold tracking-[-0.01em]">{title}</h3>
                  <p className="mt-2 text-base leading-relaxed text-legacy-ink/60">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>


        <section className="bg-legacy-warm pb-20 md:pb-28">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10">
            <StoryCarousel slides={storySlides} />
          </div>
        </section>

        {/* Journey */}
        <section id="journey" className="bg-legacy-light py-20 md:py-28">
          <div className="mx-auto max-w-[1280px] px-6 sm:px-10">
            <div className="max-w-3xl">
              <Eyebrow>One request. One clear journey.</Eyebrow>
              <h2 className="mt-6 font-display text-3xl font-semibold leading-[1.1] tracking-[-0.02em] md:text-5xl">
                You never have to wonder what happens next.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-legacy-ink/60 md:text-lg">
                A visible handover from your phone in the Gulf to the work in India—and back to you with proof.
              </p>
            </div>
            <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {journeySteps.map((step, index) => (
                <li key={step.title} className="soft-card relative p-6">
                  <span className="font-display text-xs font-bold text-primary">0{index + 1}</span>
                  <h3 className="mt-3 font-display text-lg font-semibold tracking-[-0.01em]">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-legacy-ink/58">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Services */}
        <section id="services" className="bg-legacy-warm py-20 md:py-28">
          <div className="mx-auto max-w-[1280px] px-6 sm:px-10">
            <div className="grid gap-6 md:grid-cols-2 md:items-end">
              <div>
                <Eyebrow>Help shaped around real life</Eyebrow>
                <h2 className="mt-6 font-display text-3xl font-semibold leading-[1.1] tracking-[-0.02em] md:text-5xl">
                  What needs doing back home?
                </h2>
              </div>
              <p className="max-w-xl text-base leading-relaxed text-legacy-ink/60 md:text-lg">{str(services, "subtitle")}</p>
            </div>

            <div className="mt-12 grid gap-4 lg:grid-cols-[0.42fr_0.58fr]">
              <div className="soft-card flex flex-col gap-1 p-3">
                {serviceItems.map((item, index) => (
                  <button
                    key={item.title ?? index}
                    type="button"
                    onClick={() => setActiveService(index)}
                    className={`group flex w-full items-center justify-between gap-3 rounded-xl px-4 py-4 text-left font-display text-base font-semibold transition sm:px-5 ${
                      activeService === index
                        ? "bg-primary text-primary-foreground shadow-soft"
                        : "text-legacy-ink/80 hover:bg-legacy-ink/4 hover:text-legacy-ink"
                    }`}
                    aria-pressed={activeService === index}
                  >
                    <span>{item.title}</span>
                    <ChevronRight className="h-4.5 w-4.5 shrink-0 transition group-hover:translate-x-1" />
                  </button>
                ))}
              </div>

              <article className="relative min-h-[26rem] overflow-hidden rounded-[1.25rem] bg-legacy-deep text-legacy-light">
                <img src={SERVICE_ART[activeService] ?? groceriesStory} alt="" className="absolute inset-0 h-full w-full object-cover opacity-55" />
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(180deg, color-mix(in oklab, var(--legacy-deep) 25%, transparent) 0%, color-mix(in oklab, var(--legacy-deep) 92%, transparent) 72%)" }}
                />
                <div className="relative flex min-h-[26rem] flex-col justify-end p-7 md:p-10">
                  <p className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-primary">A real need, clearly handled</p>
                  <h3 className="mt-3 font-display text-2xl font-semibold tracking-[-0.01em] md:text-4xl">{service?.title}</h3>
                  <p className="mt-3 max-w-lg text-base leading-relaxed text-legacy-light/70">{service?.description}</p>
                  <Link to="/services" className="mt-6 inline-flex items-center gap-2 font-semibold text-primary">
                    Explore this service <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* Trust */}
        {settings.websiteAppearance.showTrustSection ? (
          <section className="bg-legacy-light py-20 md:py-28">
            <div className="mx-auto max-w-[1280px] px-6 sm:px-10">
              <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
                <div className="lg:sticky lg:top-32 lg:self-start">
                  <Eyebrow>Trust is not a slogan</Eyebrow>
                  <h2 className="mt-6 font-display text-3xl font-semibold leading-[1.1] tracking-[-0.02em] md:text-5xl">
                    See what stays under your control.
                  </h2>
                  <p className="mt-5 max-w-md text-base leading-relaxed text-legacy-ink/60">
                    From the first instruction to the final proof, you know what is agreed and what comes next.
                  </p>
                </div>
                <div className="soft-card overflow-hidden">
                  <div className="flex items-center justify-between border-b border-legacy-ink/8 bg-legacy-warm px-6 py-5">
                    <span className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-legacy-teal">Care dossier</span>
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                  {trustItems.map((item, index) => (
                    <article key={item.title ?? index} className="grid gap-3 border-b border-legacy-ink/8 px-6 py-6 last:border-b-0 sm:grid-cols-[2.5rem_1fr]">
                      <span className="font-display text-xs font-bold text-primary">0{index + 1}</span>
                      <div>
                        <h3 className="font-display text-lg font-semibold tracking-[-0.01em]">{item.title}</h3>
                        <p className="mt-2 leading-relaxed text-legacy-ink/60">{item.description}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* Privacy-safe cost breakdown */}
        <section className="bg-legacy-warm py-20 md:py-28">
          <div className="mx-auto max-w-[1280px] px-6 sm:px-10">
            <InvoiceExample title="A clear breakdown, not a surprise bill." text="Every request is different. Before work begins, you see what will be done, the outside costs and our fee as separate lines." rows={[
              { id: "work", title: "The work requested", text: "Written in plain language" },
              { id: "outside", title: "Outside costs", text: "Shop, worker or materials" },
              { id: "fee", title: "Safar N manzil fee", text: "Shown separately" },
            ]} />
          </div>
        </section>



        {/* FAQ */}
        {settings.websiteAppearance.showFaqSection ? (
          <section id="faq" className="bg-legacy-warm py-20 md:py-28">
            <div className="mx-auto grid max-w-[1280px] gap-10 px-6 sm:px-10 md:grid-cols-[0.7fr_1.3fr] lg:gap-20">
              <div className="md:sticky md:top-32 md:self-start">
                <Eyebrow>Before you trust us</Eyebrow>
                <h2 className="mt-6 font-display text-3xl font-semibold leading-[1.1] tracking-[-0.02em] md:text-4xl">
                  Questions deserve clear answers.
                </h2>
              </div>
              <div className="grid gap-3">
                {list<{ question?: string; answer?: string }>(faq, "items").map((item) => (
                  <details key={item.question} className="soft-card group px-6 py-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-display text-base font-semibold [&::-webkit-details-marker]:hidden md:text-lg">
                      {item.question}
                      <span className="text-2xl font-light text-primary transition group-open:rotate-45">+</span>
                    </summary>
                    <p className="max-w-2xl pt-4 leading-relaxed text-legacy-ink/60">{item.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* Contact */}
        <section id="contact" className="bg-legacy-warm px-3 pb-16 sm:px-4 md:pb-24">
          <div className="relative mx-auto max-w-[1280px] overflow-hidden rounded-[1.75rem] bg-legacy-deep px-6 py-16 text-legacy-light sm:rounded-[2.5rem] sm:px-10 md:py-20">
            <div className="legacy-grid absolute inset-0 opacity-[0.1]" aria-hidden />
            <div
              className="absolute -left-20 bottom-0 h-[26rem] w-[26rem] rounded-full opacity-35 blur-3xl"
              style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--legacy-coral) 40%, transparent), transparent 70%)" }}
              aria-hidden
            />
            <div className="relative grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
              <div>
                <Eyebrow light>Start with one message</Eyebrow>
                <h2 className="mt-6 font-display text-3xl font-semibold leading-[1.1] tracking-[-0.02em] md:text-5xl">
                  {str(contact, "title", "Tell us what your family needs.")}
                </h2>
                <p className="mt-5 max-w-md leading-relaxed text-legacy-light/65">{str(contact, "subtitle")}</p>
                <Link to="/auth" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-legacy-light/50 transition hover:text-legacy-light">
                  <Lock className="h-4 w-4" /> Team login
                </Link>
              </div>
              <div className="rounded-[1.25rem] bg-legacy-light p-6 text-legacy-ink shadow-lift sm:p-9">
                <ContactForm whatsapp={publicContact.whatsapp || str(contact, "whatsapp")} email={publicContact.email || str(contact, "email")} />
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter footer={footer} contact={contact} brandName={brandName} logoStyle={settings.branding.logoStyle} />
    </div>
  );
}

function LandingPageRoute() {
  return <PublishedOr page="home" pageName="home"><LandingPage /></PublishedOr>;
}
