import { createFileRoute } from "@tanstack/react-router";
import { Globe } from "lucide-react";

import { PageHeader } from "../../components/app-shell";
import { EmptyState } from "../../components/empty-state";

export const Route = createFileRoute("/_authenticated/website")({
  head: () => ({
    meta: [
      { title: "Website — SAFAR N MANZIL" },
      { name: "description", content: "Website control desk: edit every section, draft, publish, roll back." },
      { property: "og:title", content: "Website — SAFAR N MANZIL" },
      { property: "og:description", content: "Website control desk with draft, publish and rollback." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WebsitePage,
});

const PLANNED_SECTIONS = [
  "Hero banner",
  "Service grid",
  "Trust badges",
  "How it works",
  "Testimonials",
  "Call to action",
  "FAQ",
  "Contact",
  "Footer",
];

function WebsitePage() {
  return (
    <div>
      <PageHeader
        title="Website"
        description="The control desk for the public website. Every section becomes editable here — draft, preview, publish and roll back — replacing the static pages."
      />
      <EmptyState
        icon={Globe}
        title="The section editor arrives with the database connection"
        description="Once the database is connected, the CMS tables are created and every section of the site becomes a structured, editable block — no code edits, no arbitrary HTML, full revision history."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            {PLANNED_SECTIONS.map((section) => (
              <span
                key={section}
                className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground"
              >
                {section}
              </span>
            ))}
          </div>
        }
      />
    </div>
  );
}
