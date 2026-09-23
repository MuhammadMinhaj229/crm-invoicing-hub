import { createFileRoute, Link } from "@tanstack/react-router";
import { PublishedOr } from "../components/page-builder/published-page";

import { PageShell } from "../components/layout/page-shell";
import { PageIntro } from "../components/layout/page-intro";
import { Reveal } from "../components/motion/primitives";
import { site } from "../content/site";
import { breadcrumbSchema } from "../lib/seo/json-ld";
import castArt from "../assets/safar-cast.png";

const TITLE = "Why we started, and how we work";
const DESCRIPTION =
  "SAFAR N MANZIL exists so that a son or daughter in the Gulf never has to depend on luck when their parents in India need help.";

const PRINCIPLES = [
  {
    title: "We tell you the price first",
    description:
      "Before anything is bought or repaired, you know what it will cost. The final bill matches what we said.",
  },
  {
    title: "Nobody is left alone in your parents' home",
    description:
      "When an outside worker visits, our own coordinator stays for the whole visit.",
  },
  {
    title: "Every job comes back with proof",
    description:
      "Photos, the bill and a short message. You see what happened even though you are far away.",
  },
  {
    title: "We say no when we should",
    description:
      "If we cannot do something well, or we do not cover that area, we tell you instead of promising.",
  },
  {
    title: "Your parents are treated gently",
    description:
      "We explain everything to them calmly, in their language, before anything happens.",
  },
  {
    title: "Your information stays yours",
    description: "We do not sell or share your family's details with anyone.",
  },
];

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: `${TITLE} — ${site.brand.name}` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/about" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbSchema([
            { name: "Home", url: "/" },
            { name: "About", url: "/about" },
          ]),
        ),
      },
    ],
  }),
  component: AboutPageRoute,
});

function AboutPage() {
  return (
    <PageShell pageName="about">
      <PageIntro
        eyebrow="Our story"
        title={TITLE}
        lead={DESCRIPTION}
        trail={[
          { label: "Home", href: "/" },
          { label: "How it works", href: "/about" },
        ]}
      />

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 lg:grid-cols-2">
        <Reveal>
          <h2 className="font-display text-2xl font-bold">The problem we kept seeing</h2>
          <p className="mt-4 text-muted-foreground">
            Someone works hard in Dubai, Doha or Riyadh. Back home, a tap breaks, a hospital
            appointment comes up, or the monthly ration has to be carried up two floors. The
            son or daughter cannot be there. So they call a neighbour, a cousin, a stranger
            from the market — and hope it goes well.
          </p>
          <p className="mt-4 text-muted-foreground">
            We built SAFAR N MANZIL so that hope is not the plan. One message to us, and a
            checked person handles it, at a price we tell you first, with photos coming back
            to your phone.
          </p>
          <p className="mt-6 font-display text-lg font-bold text-primary">{site.brand.motto}</p>
        </Reveal>
        <Reveal delay={80}>
          <img
            src={castArt}
            alt="An illustration of a son abroad, his sister, and their parents at home in India"
            width={1280}
            height={768}
            loading="lazy"
            className="w-full rounded-3xl"
          />
        </Reveal>
      </section>

      <section className="border-y border-border bg-card py-14">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="font-display text-2xl font-bold">How we work</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PRINCIPLES.map((principle, index) => (
              <Reveal as="li" key={principle.title} delay={index * 60}>
                <div className="h-full rounded-2xl border border-border bg-background p-6">
                  <h3 className="font-display font-bold">{principle.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{principle.description}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-14 text-center">
        <Reveal>
          <h2 className="font-display text-2xl font-bold">Ready when you are</h2>
          <p className="mt-2 text-muted-foreground">
            Tell us what your family needs. We will reply with the plan, the person and the cost.
          </p>
          <Link
            to="/contact"
            className="mt-6 inline-flex min-h-[48px] items-center rounded-full bg-primary px-6 font-semibold text-primary-foreground"
          >
            {site.cta.primary}
          </Link>
        </Reveal>
      </section>
    </PageShell>
  );
}

function AboutPageRoute() {
  return (
    <PublishedOr page="about" pageName="about">
      <AboutPage />
    </PublishedOr>
  );
}
