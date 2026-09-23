import { createFileRoute } from "@tanstack/react-router";

import { PageShell } from "../components/layout/page-shell";
import { PageIntro } from "../components/layout/page-intro";
import { site } from "../content/site";

const TITLE = "Our terms, in plain words";
const DESCRIPTION =
  "What we promise, what you agree to, how prices work and what we are not responsible for.";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: `${TITLE} — ${site.brand.name}` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/terms" },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <PageShell pageName="terms">
      <PageIntro
        title={TITLE}
        lead={DESCRIPTION}
        trail={[
          { label: "Home", href: "/" },
          { label: "Terms", href: "/terms" },
        ]}
      />
      <article className="mx-auto max-w-3xl space-y-6 px-5 py-14 text-muted-foreground">
        <section>
          <h2 className="font-display text-xl font-bold text-foreground">What we do</h2>
          <p className="mt-2">
            We act on your behalf for the task you ask for, in the area we agree. We are not a
            medical, legal or financial service, and we do not give advice in those matters.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-bold text-foreground">Prices</h2>
          <p className="mt-2">
            We tell you the expected cost before we start. If something changes during the work,
            we stop and tell you before spending more.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-bold text-foreground">Outside workers</h2>
          <p className="mt-2">
            For repairs we use workers we have checked, and our coordinator stays during the
            visit. Any warranty on parts or work comes from the supplier or the worker.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-bold text-foreground">Cancelling</h2>
          <p className="mt-2">
            You can cancel before the work starts at no cost. If we have already travelled or
            bought something, we will ask only for that actual expense.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-bold text-foreground">Limits</h2>
          <p className="mt-2">
            We take care, but we cannot be responsible for delays caused by hospitals, government
            offices, couriers or suppliers.
          </p>
        </section>
      </article>
    </PageShell>
  );
}
