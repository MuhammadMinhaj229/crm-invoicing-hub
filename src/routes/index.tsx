import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  FileText,
  HeartHandshake,
  Image as ImageIcon,
  Lock,
  MessageCircle,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import heroFamily from "../assets/safar-hero-family.png";
import groceriesStory from "../assets/safar-story-groceries.png";
import healthcareStory from "../assets/safar-story-health.png";
import repairsStory from "../assets/safar-story-repairs.png";
import updatesArt from "../assets/safar-updates.png";
import { BrandMark } from "../components/brand-mark";
import { SiteHeader } from "../components/layout/site-header";
import { PublishedOr } from "../components/page-builder/published-page";
import { SiteFooter } from "../components/site/site-footer";
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
    <p className={`flex items-center gap-3 text-xs font-bold uppercase tracking-widest ${light ? "text-legacy-peach" : "text-legacy-teal"}`}>
      <span className="h-px w-8 bg-primary" />
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
    "min-h-12 w-full border-0 border-b border-legacy-ink/20 bg-transparent px-0 py-3 text-sm text-legacy-ink outline-none transition placeholder:text-legacy-ink/45 focus:border-primary";

  return (
    <form
      className="grid gap-x-8 gap-y-3 md:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        setSending(true);
        void submitWebsiteEnquiry(form).finally(() => {
          setSending(false);
          if (target) window.open(target, "_blank", "noopener");
        });
      }}
    >
      <label className="text-xs font-bold uppercase tracking-wide text-legacy-ink/65">
        Your name
        <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={fieldClass} />
      </label>
      <label className="text-xs font-bold uppercase tracking-wide text-legacy-ink/65">
        Your WhatsApp number
        <input required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className={fieldClass} placeholder="Include country code" />
      </label>
      <label className="text-xs font-bold uppercase tracking-wide text-legacy-ink/65">
        Family's city in India
        <input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} className={fieldClass} />
      </label>
      <label className="text-xs font-bold uppercase tracking-wide text-legacy-ink/65">
        What do they need?
        <input required value={form.need} onChange={(event) => setForm({ ...form, need: event.target.value })} className={fieldClass} placeholder="Tell us in your own words" />
      </label>
      <button
        type="submit"
        disabled={!target || sending}
        className="brand-button mt-5 inline-flex min-h-13 items-center justify-center gap-2 bg-primary px-6 font-bold text-primary-foreground transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 md:col-span-2 md:justify-self-start"
      >
        <MessageCircle className="h-5 w-5" />
        {sending ? "Sending…" : "Send my request"}
      </button>
      {!target ? <p className="text-sm text-legacy-ink/60 md:col-span-2">Add your WhatsApp number or email in the CRM to activate requests.</p> : null}
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

  return (
    <div className="min-h-screen overflow-x-clip bg-legacy-warm text-legacy-ink">
      <main>
        <section className="legacy-hero relative min-h-[calc(100svh-2rem)] overflow-hidden bg-legacy-deep text-legacy-light sm:m-4 sm:min-h-[calc(100svh-2rem)] sm:rounded-lg">
          <SiteHeader brandName={brandName} logoUrl={settings.branding.logoUrl} logoStyle={settings.branding.logoStyle} />
          <div className="legacy-grid absolute inset-0 opacity-20" aria-hidden />
          <div className="relative mx-auto grid min-h-[calc(100svh-7.25rem)] max-w-[1480px] items-end px-5 pb-10 pt-12 md:grid-cols-[0.88fr_1.12fr] md:items-center md:px-10 md:pb-16 lg:px-16">
            <div className="relative z-10 pb-4 md:py-12">
              <Eyebrow light>{str(hero, "eyebrow", "From the Gulf to your family in India")}</Eyebrow>
              <h1 className="mt-6 max-w-3xl font-display text-5xl font-semibold leading-[0.98] sm:text-6xl lg:text-8xl">
                Your care,
                <span className="block text-primary">carried home.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-legacy-light/72 md:text-lg">
                {str(hero, "subtitle", "Tell us what your family needs in India. We coordinate it while you live in the Gulf, and keep the plan, price and result clear.")}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#contact"
                  onClick={() => track("cta.clicked", { place: "hero", label: "Tell us what they need" })}
                  className="brand-button inline-flex min-h-14 items-center justify-center gap-3 bg-primary px-7 font-bold text-primary-foreground transition hover:-translate-y-1"
                >
                  Tell us what they need <ArrowRight className="h-5 w-5" />
                </a>
                <a href="#journey" className="brand-button inline-flex min-h-14 items-center justify-center border border-legacy-light/25 px-7 font-semibold text-legacy-light transition hover:border-primary hover:text-primary">
                  See the care journey
                </a>
              </div>
            </div>

            <div className="relative -mx-5 min-h-[40vh] self-end md:mx-0 md:min-h-[70vh]">
              <div className="absolute inset-x-[7%] bottom-[8%] top-[10%] rounded-full border border-legacy-light/10" aria-hidden />
              <div className="absolute inset-x-[14%] bottom-[2%] top-[18%] rounded-full border border-primary/35" aria-hidden />
              <img
                src={str(hero, "imageUrl") || heroFamily}
                alt={str(hero, "imageAlt", "A family member in the Gulf arranging trusted help for parents in India")}
                width={1280}
                height={960}
                fetchPriority="high"
                className="legacy-float absolute inset-x-0 bottom-0 h-full w-full object-contain object-bottom drop-shadow-2xl"
              />
              <div className="absolute bottom-4 left-1/2 flex w-[min(92%,28rem)] -translate-x-1/2 items-center gap-4 border border-legacy-light/15 bg-legacy-deep/85 p-4 backdrop-blur-xl">
                <span className="grid h-10 w-10 shrink-0 place-items-center bg-primary text-primary-foreground"><HeartHandshake className="h-5 w-5" /></span>
                <p className="text-sm leading-5 text-legacy-light/75"><strong className="block text-legacy-light">One person stays accountable</strong>From your first message to the update that comes back.</p>
              </div>
            </div>
          </div>
          <a href="#recognition" className="absolute bottom-3 left-5 z-20 hidden items-center gap-2 text-xs font-bold uppercase tracking-widest text-legacy-light/60 md:flex">
            Begin the story <span className="h-px w-10 bg-primary" />
          </a>
        </section>

        <section id="recognition" className="relative border-b border-legacy-ink/10 bg-legacy-warm py-20 md:py-32">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 md:grid-cols-[0.8fr_1.2fr] md:px-10">
            <div className="md:sticky md:top-28 md:self-start">
              <Eyebrow>{str(promise, "eyebrow", "A moment you know")}</Eyebrow>
              <h2 className="mt-5 max-w-xl font-display text-4xl font-semibold leading-tight md:text-6xl">
                They call you first. <span className="text-primary">Even when you are far away.</span>
              </h2>
            </div>
            <div className="space-y-12 md:space-y-24">
              <p className="max-w-2xl text-xl leading-9 text-legacy-ink/72 md:text-2xl md:leading-10">{str(promise, "body")}</p>
              {[
                ["The need", "A repair, a hospital visit, groceries or paperwork cannot wait for your next trip."],
                ["The worry", "You need somebody who will treat your family’s time, home and money with care."],
                ["The relief", "Safar N manzil becomes the accountable person between your message and the result."],
              ].map(([title, text], index) => (
                <article key={title} className="grid grid-cols-[3rem_1fr] gap-5 border-t border-legacy-ink/15 pt-6">
                  <span className="font-display text-sm font-bold text-primary">0{index + 1}</span>
                  <div><h3 className="font-display text-2xl font-semibold">{title}</h3><p className="mt-3 max-w-xl leading-7 text-legacy-ink/65">{text}</p></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="journey" className="relative overflow-hidden bg-legacy-deep py-20 text-legacy-light md:py-32">
          <div className="legacy-grid absolute inset-0 opacity-15" aria-hidden />
          <div className="relative mx-auto max-w-7xl px-5 md:px-10">
            <Eyebrow light>One request. One clear journey.</Eyebrow>
            <div className="mt-5 grid gap-8 md:grid-cols-[0.8fr_1.2fr]">
              <h2 className="font-display text-4xl font-semibold leading-tight md:text-6xl">You never have to wonder what happens next.</h2>
              <p className="max-w-xl self-end text-lg leading-8 text-legacy-light/65">A visible handover from your phone in the Gulf to the work in India—and back to you with proof.</p>
            </div>
            <ol className="care-thread mt-16 grid gap-0 md:grid-cols-5">
              {[
                { title: journey[0]?.title || "You tell us", text: journey[0]?.description || "Send the need in your own words." },
                { title: "We understand it", text: "We confirm the place, timing and exact task." },
                { title: journey[1]?.title || "You approve", text: journey[1]?.description || "See the plan and cost before work." },
                { title: journey[2]?.title || "We coordinate", text: journey[2]?.description || "One person stays responsible." },
                { title: journey[3]?.title || "Proof returns", text: journey[3]?.description || "Receive the update and bill." },
              ].map((step, index) => (
                <li key={step.title} className="relative border-l border-legacy-light/15 py-7 pl-8 md:border-l-0 md:border-t md:px-5 md:pt-10">
                  <span className="absolute -left-2 top-8 grid h-4 w-4 place-items-center rounded-full bg-primary ring-8 ring-legacy-deep md:-top-2 md:left-5"><span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" /></span>
                  <span className="text-xs font-bold text-primary">0{index + 1}</span>
                  <h3 className="mt-3 font-display text-xl font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-legacy-light/60">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="services" className="bg-legacy-light py-20 md:py-32">
          <div className="mx-auto max-w-7xl px-5 md:px-10">
            <div className="grid gap-7 md:grid-cols-2">
              <div><Eyebrow>Help shaped around real life</Eyebrow><h2 className="mt-5 font-display text-4xl font-semibold leading-tight md:text-6xl">What needs doing back home?</h2></div>
              <p className="max-w-xl self-end text-lg leading-8 text-legacy-ink/65">{str(services, "subtitle")}</p>
            </div>
            <div className="mt-12 grid overflow-hidden border border-legacy-ink/15 lg:grid-cols-[0.42fr_0.58fr]">
              <div className="bg-legacy-warm p-3 sm:p-5">
                {serviceItems.map((item, index) => (
                  <button
                    key={item.title ?? index}
                    type="button"
                    onClick={() => setActiveService(index)}
                    className={`group flex w-full items-center justify-between border-b border-legacy-ink/10 px-3 py-4 text-left font-display text-base font-semibold transition sm:px-5 sm:text-lg ${activeService === index ? "bg-primary text-primary-foreground" : "text-legacy-ink hover:bg-legacy-peach/45"}`}
                    aria-pressed={activeService === index}
                  >
                    <span>{item.title}</span><ChevronRight className="h-5 w-5 transition group-hover:translate-x-1" />
                  </button>
                ))}
              </div>
              <article className="relative min-h-[34rem] overflow-hidden bg-legacy-deep text-legacy-light">
                <img src={SERVICE_ART[activeService] ?? groceriesStory} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45 mix-blend-luminosity" />
                <div className="absolute inset-0 bg-legacy-deep/55" />
                <div className="relative flex min-h-[34rem] flex-col justify-end p-7 md:p-12">
                  <span className="mb-auto grid h-12 w-12 place-items-center border border-legacy-light/20 bg-legacy-deep/70"><HeartHandshake className="h-6 w-6 text-primary" /></span>
                  <p className="text-xs font-bold uppercase tracking-widest text-primary">A real need, clearly handled</p>
                  <h3 className="mt-3 font-display text-3xl font-semibold md:text-5xl">{service?.title}</h3>
                  <p className="mt-4 max-w-xl text-base leading-7 text-legacy-light/75">{service?.description}</p>
                  <Link to="/services" className="mt-7 inline-flex items-center gap-2 font-bold text-primary">Explore this service <ArrowRight className="h-4 w-4" /></Link>
                </div>
              </article>
            </div>
          </div>
        </section>

        {settings.websiteAppearance.showTrustSection ? (
          <section className="border-y border-legacy-ink/10 bg-legacy-warm py-20 md:py-32">
            <div className="mx-auto max-w-7xl px-5 md:px-10">
              <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr]">
                <div>
                  <Eyebrow>Trust is not a slogan</Eyebrow>
                  <h2 className="mt-5 font-display text-4xl font-semibold leading-tight md:text-6xl">See what stays under your control.</h2>
                  <p className="mt-5 max-w-lg text-lg leading-8 text-legacy-ink/65">From the first instruction to the final proof, you know what is agreed and what comes next.</p>
                </div>
                <div className="border border-legacy-ink/15 bg-legacy-light">
                  <div className="flex items-center justify-between border-b border-legacy-ink/10 px-6 py-5"><span className="text-xs font-bold uppercase tracking-widest text-legacy-teal">Care dossier</span><ShieldCheck className="h-6 w-6 text-primary" /></div>
                  {trustItems.map((item, index) => (
                    <article key={item.title ?? index} className="grid gap-3 border-b border-legacy-ink/10 px-6 py-6 last:border-b-0 sm:grid-cols-[3rem_1fr]">
                      <span className="font-display text-sm font-bold text-primary">0{index + 1}</span>
                      <div><h3 className="font-display text-xl font-semibold">{item.title}</h3><p className="mt-2 leading-7 text-legacy-ink/65">{item.description}</p></div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="bg-legacy-light py-20 md:py-32">
          <div className="mx-auto grid max-w-7xl gap-14 px-5 md:grid-cols-2 md:px-10">
            <div className="self-center">
              <Eyebrow>Nothing begins in the dark</Eyebrow>
              <h2 className="mt-5 font-display text-4xl font-semibold leading-tight md:text-6xl">The price comes before the work.</h2>
              <p className="mt-5 max-w-xl text-lg leading-8 text-legacy-ink/65">You see the task, outside costs and our fee before giving approval. If the plan changes, we ask again.</p>
            </div>
            <div className="approval-sheet relative border border-legacy-ink/15 bg-legacy-warm p-6 shadow-xl sm:p-9">
              <div className="flex items-start justify-between border-b border-legacy-ink/15 pb-6"><div><p className="text-xs font-bold uppercase tracking-widest text-legacy-teal">Approval sheet</p><p className="mt-2 font-display text-2xl font-semibold">Your request plan</p></div><CircleDollarSign className="h-8 w-8 text-primary" /></div>
              {["What will be done", "Shop, worker or material cost", "Safar N manzil service fee", "Total before work starts"].map((label, index) => (
                <div key={label} className="flex items-center justify-between gap-4 border-b border-legacy-ink/10 py-4 text-sm"><span>{label}</span><span className={index === 3 ? "font-bold text-legacy-teal" : "text-legacy-ink/45"}>{index === 3 ? "Shown clearly" : "Confirmed first"}</span></div>
              ))}
              <div className="mt-7 flex items-center gap-3 bg-legacy-teal p-4 text-legacy-light"><Check className="h-5 w-5 text-primary" /><span className="font-semibold">You decide when the work can begin.</span></div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-legacy-deep py-20 text-legacy-light md:py-32">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 md:grid-cols-[1.05fr_0.95fr] md:px-10">
            <div className="relative min-h-[32rem]">
              <img src={str(updates, "imageUrl") || updatesArt} alt="A completed task update returning to a family member in the Gulf" className="absolute inset-0 h-full w-full object-contain" />
              <div className="absolute bottom-6 right-0 w-[72%] border border-legacy-light/15 bg-legacy-deep/90 p-5 shadow-2xl backdrop-blur-xl sm:w-[58%]">
                <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center bg-primary text-primary-foreground"><CheckCircle2 className="h-5 w-5" /></span><div><p className="text-xs text-legacy-light/50">Request update</p><p className="font-semibold">Work completed</p></div></div>
              </div>
            </div>
            <div>
              <Eyebrow light>{str(updates, "eyebrow", "Proof returns home")}</Eyebrow>
              <h2 className="mt-5 font-display text-4xl font-semibold leading-tight md:text-6xl">{str(updates, "title", "You see how it ended.")}</h2>
              <p className="mt-5 text-lg leading-8 text-legacy-light/65">{str(updates, "subtitle")}</p>
              <div className="mt-8 divide-y divide-legacy-light/15 border-y border-legacy-light/15">
                {proofPoints.map((point, index) => {
                  const Icon = index === 0 ? ImageIcon : index === 1 ? ReceiptText : FileText;
                  return <div key={point} className="flex items-center gap-4 py-4"><Icon className="h-5 w-5 text-primary" /><span>{point}</span></div>;
                })}
              </div>
            </div>
          </div>
        </section>

        {settings.websiteAppearance.showFaqSection ? (
          <section id="faq" className="bg-legacy-warm py-20 md:py-28">
            <div className="mx-auto grid max-w-7xl gap-10 px-5 md:grid-cols-[0.65fr_1.35fr] md:px-10">
              <div><Eyebrow>Before you trust us</Eyebrow><h2 className="mt-5 font-display text-4xl font-semibold leading-tight md:text-5xl">Questions deserve clear answers.</h2></div>
              <div className="border-t border-legacy-ink/15">
                {list<{ question?: string; answer?: string }>(faq, "items").map((item) => (
                  <details key={item.question} className="group border-b border-legacy-ink/15 py-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-display text-lg font-semibold [&::-webkit-details-marker]:hidden">{item.question}<span className="text-2xl font-light text-primary transition group-open:rotate-45">+</span></summary>
                    <p className="max-w-2xl pb-2 pt-4 leading-7 text-legacy-ink/65">{item.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section id="contact" className="bg-primary py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-5 md:px-10">
            <div className="grid gap-10 md:grid-cols-[0.72fr_1.28fr]">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary-foreground/65">Start with one message</p>
                <h2 className="mt-5 font-display text-4xl font-semibold leading-tight text-primary-foreground md:text-6xl">{str(contact, "title", "Tell us what your family needs.")}</h2>
                <p className="mt-5 max-w-md leading-7 text-primary-foreground/70">{str(contact, "subtitle")}</p>
              </div>
              <div className="bg-legacy-light p-6 sm:p-10"><ContactForm whatsapp={str(contact, "whatsapp")} email={str(contact, "email")} /></div>
            </div>
            <Link to="/auth" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary-foreground/65 hover:text-primary-foreground"><Lock className="h-4 w-4" /> Team login</Link>
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