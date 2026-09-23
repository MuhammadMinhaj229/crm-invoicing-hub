import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { CheckCircle2, MessageCircle } from "lucide-react";

import { PageShell } from "../components/layout/page-shell";
import { PageIntro } from "../components/layout/page-intro";
import { Reveal } from "../components/motion/primitives";
import { findService, services } from "../content/services";
import { site } from "../content/site";
import { track } from "../lib/analytics";
import { breadcrumbSchema, serviceSchema } from "../lib/seo/json-ld";
import { buildWhatsAppUrl } from "../lib/whatsapp/url-builder";
import { serviceEnquiryMessage } from "../lib/whatsapp/templates";
import { useSiteContact } from "../hooks/use-site-contact";

export const Route = createFileRoute("/services/$slug")({
  loader: ({ params }) => {
    const service = findService(params.slug);
    if (!service) throw notFound();
    return { service };
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Service not found" }, { name: "robots", content: "noindex" }] };
    }
    const { service } = loaderData;
    return {
      meta: [
        { title: `${service.seo.title} — ${site.brand.name}` },
        { name: "description", content: service.seo.description },
        { property: "og:title", content: service.seo.title },
        { property: "og:description", content: service.seo.description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `/services/${params.slug}` },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: `/services/${params.slug}` }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(serviceSchema(service)) },
        {
          type: "application/ld+json",
          children: JSON.stringify(
            breadcrumbSchema([
              { name: "Home", url: "/" },
              { name: "Services", url: "/services" },
              { name: service.title, url: `/services/${params.slug}` },
            ]),
          ),
        },
      ],
    };
  },
  notFoundComponent: ServiceNotFound,
  component: ServiceDetail,
});

function ServiceNotFound() {
  return (
    <PageShell pageName="service-not-found">
      <PageIntro
        title="We could not find that page"
        lead="The help you were looking for may have moved. Here is everything we do."
      />
      <div className="mx-auto max-w-4xl px-5 py-12">
        <Link
          to="/services"
          className="inline-flex min-h-[48px] items-center rounded-full bg-primary px-6 font-semibold text-primary-foreground"
        >
          See all our help
        </Link>
      </div>
    </PageShell>
  );
}

function ServiceDetail() {
  const { service } = Route.useLoaderData();
  const contact = useSiteContact();
  const whatsappUrl = buildWhatsAppUrl(contact.whatsapp, serviceEnquiryMessage(service.title));
  const others = services.filter((item) => item.id !== service.id).slice(0, 3);

  return (
    <PageShell pageName={`service:${service.slug}`}>
      <PageIntro
        eyebrow="Our help"
        title={service.title}
        lead={service.description}
        trail={[
          { label: "Home", href: "/" },
          { label: "Services", href: "/services" },
          { label: service.title, href: "/services" },
        ]}
      >
        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              track("whatsapp.clicked", { placement: "service-hero", service: service.slug })
            }
            className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-primary px-6 font-semibold text-primary-foreground"
          >
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
            {site.cta.whatsapp}
          </a>
        ) : (
          <Link
            to="/contact"
            className="inline-flex min-h-[48px] items-center rounded-full bg-primary px-6 font-semibold text-primary-foreground"
          >
            {site.cta.primary}
          </Link>
        )}
      </PageIntro>

      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-14 lg:grid-cols-2">
        <Reveal>
          <h2 className="font-display text-2xl font-bold">What is included</h2>
          <ul className="mt-4 space-y-3">
            {service.features.map((feature) => (
              <li key={feature} className="flex gap-3 text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={80}>
          <h2 className="font-display text-2xl font-bold">What comes back to you</h2>
          <ul className="mt-4 space-y-3">
            {service.deliverables.map((item) => (
              <li key={item} className="flex gap-3 text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      <section className="border-y border-border bg-card py-14">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="font-display text-2xl font-bold">How one job goes</h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {service.process.map((step, index) => (
              <Reveal as="li" key={step.step} delay={index * 70}>
                <div className="h-full rounded-2xl border border-border bg-background p-5">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                    {step.step}
                  </span>
                  <h3 className="mt-3 font-display font-bold">{step.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <Reveal className="rounded-2xl border border-border bg-accent/40 p-7">
          <h2 className="font-display text-xl font-bold">What it costs</h2>
          <p className="mt-2 text-muted-foreground">{service.pricingNote}</p>
        </Reveal>

        <h2 className="mt-12 font-display text-2xl font-bold">We also help with</h2>
        <ul className="mt-5 grid gap-4 sm:grid-cols-3">
          {others.map((item) => (
            <li key={item.id}>
              <Link
                to="/services/$slug"
                params={{ slug: item.slug }}
                className="block h-full rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary"
              >
                <span className="font-display font-bold">{item.title}</span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {item.shortDescription}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}
