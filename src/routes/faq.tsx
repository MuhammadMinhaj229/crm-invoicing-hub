import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";

import { PageShell } from "../components/layout/page-shell";
import { PageIntro } from "../components/layout/page-intro";
import { Reveal } from "../components/motion/primitives";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import { faqs } from "../content/faqs";
import { site } from "../content/site";
import { track } from "../lib/analytics";
import { breadcrumbSchema, faqSchema } from "../lib/seo/json-ld";

const TITLE = "Questions families ask us";
const DESCRIPTION =
  "Straight answers about price, who visits your parents, how you see proof of the work, and how to start.";

const GROUPS: { key: string; label: string }[] = [
  { key: "pricing", label: "Money" },
  { key: "trust", label: "Trust" },
  { key: "process", label: "Getting started" },
  { key: "coverage", label: "Where we work" },
];

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: `${TITLE} — ${site.brand.name}` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/faq" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/faq" }],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(faqSchema()) },
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbSchema([
            { name: "Home", url: "/" },
            { name: "Questions", url: "/faq" },
          ]),
        ),
      },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  useEffect(() => {
    track("faq.viewed", { page: "faq" });
  }, []);

  return (
    <PageShell pageName="faq">
      <PageIntro
        eyebrow="Answers"
        title={TITLE}
        lead={DESCRIPTION}
        trail={[
          { label: "Home", href: "/" },
          { label: "Questions", href: "/faq" },
        ]}
      />

      <section className="mx-auto max-w-3xl px-5 py-14">
        {GROUPS.map((group) => {
          const items = faqs.filter((item) => item.category === group.key);
          if (!items.length) return null;
          return (
            <Reveal key={group.key} className="mb-10">
              <h2 className="font-display text-xl font-bold">{group.label}</h2>
              <Accordion type="single" collapsible className="mt-3">
                {items.map((item) => (
                  <AccordionItem key={item.id} value={item.id}>
                    <AccordionTrigger className="text-left text-base font-semibold">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Reveal>
          );
        })}

        <Reveal className="rounded-2xl border border-border bg-accent/40 p-7 text-center">
          <h2 className="font-display text-xl font-bold">Still unsure?</h2>
          <p className="mt-2 text-muted-foreground">
            Ask us directly. If we cannot help, we will say so.
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
