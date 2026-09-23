import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { PageShell } from "../components/layout/page-shell";
import { PageIntro } from "../components/layout/page-intro";
import { Reveal } from "../components/motion/primitives";
import { services } from "../content/services";
import { site } from "../content/site";
import { track } from "../lib/analytics";
import { breadcrumbSchema, serviceListSchema } from "../lib/seo/json-ld";

const TITLE = "What we can do for your family in India";
const DESCRIPTION =
  "Shopping, home repairs, hospital visits, parcels, paperwork and property checks — done by people we have checked, with photos and a price agreed first.";

export const Route = createFileRoute("/services/")({
  head: () => ({
    meta: [
      { title: `${TITLE} — ${site.brand.name}` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/services" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/services" }],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(serviceListSchema()) },
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbSchema([
            { name: "Home", url: "/" },
            { name: "Services", url: "/services" },
          ]),
        ),
      },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  return (
    <PageShell pageName="services">
      <PageIntro
        eyebrow="Our help"
        title={TITLE}
        lead={DESCRIPTION}
        trail={[
          { label: "Home", href: "/" },
          { label: "Services", href: "/services" },
        ]}
      />

      <section className="mx-auto max-w-6xl px-5 py-14">
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <Reveal as="li" key={service.id} delay={index * 60}>
              <Link
                to="/services/$slug"
                params={{ slug: service.slug }}
                onClick={() => track("service.viewed", { service: service.slug, from: "services" })}
                className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <h2 className="font-display text-xl font-bold">{service.title}</h2>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">
                  {service.shortDescription}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  See how it works <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>

        <Reveal className="mt-12 rounded-2xl border border-border bg-accent/40 p-7 text-center">
          <h2 className="font-display text-2xl font-bold">Not sure which one you need?</h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            Tell us what is happening at home and we will tell you honestly whether we can help.
          </p>
          <Link
            to="/contact"
            className="mt-5 inline-flex min-h-[48px] items-center rounded-full bg-primary px-6 font-semibold text-primary-foreground"
          >
            {site.cta.primary}
          </Link>
        </Reveal>
      </section>
    </PageShell>
  );
}
