import { createFileRoute } from "@tanstack/react-router";
import { PublishedOr } from "../components/page-builder/published-page";

import { PageShell } from "../components/layout/page-shell";
import { PageIntro } from "../components/layout/page-intro";
import { site } from "../content/site";

const TITLE = "How we handle your information";
const DESCRIPTION =
  "What we collect when you use this website, why we keep it, and how to ask us to remove it.";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: `${TITLE} — ${site.brand.name}` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/privacy" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: PrivacyPageRoute,
});

function PrivacyPage() {
  return (
    <PageShell pageName="privacy">
      <PageIntro
        title={TITLE}
        lead={DESCRIPTION}
        trail={[
          { label: "Home", href: "/" },
          { label: "Privacy", href: "/privacy" },
        ]}
      />
      <article className="mx-auto max-w-3xl space-y-6 px-5 py-14 text-muted-foreground">
        <section>
          <h2 className="font-display text-xl font-bold text-foreground">What we collect</h2>
          <p className="mt-2">
            When you send us a request, we keep the details you give us: your name, the number
            or email you want us to reply on, where your family lives and what you need. We use
            this only to do the work you asked for and to stay in touch about it.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-bold text-foreground">What the website records</h2>
          <p className="mt-2">
            This website counts visits and clicks using our own records. We do not use outside
            advertising trackers. We do not try to find out who you are before you tell us.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-bold text-foreground">Who else sees it</h2>
          <p className="mt-2">
            Nobody, except the person doing your job who needs to know the address and the task.
            We do not sell or rent your details.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-bold text-foreground">Removing your details</h2>
          <p className="mt-2">
            Ask us and we will delete your records, except anything we must keep for a bill that
            has already been paid.
          </p>
        </section>
      </article>
    </PageShell>
  );
}

function PrivacyPageRoute() {
  return (
    <PublishedOr page="privacy" pageName="privacy">
      <PrivacyPage />
    </PublishedOr>
  );
}
