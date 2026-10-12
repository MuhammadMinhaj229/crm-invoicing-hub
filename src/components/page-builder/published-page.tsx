import type { ReactNode } from "react";

import type { PageDocument } from "../../lib/page-builder/model";
import type { PublishedPageStatus } from "../../lib/page-builder/published-state";
import { fetchPublishedDocument } from "../../lib/page-builder/store";
import { PageShell } from "../layout/page-shell";
import { BlockRenderer } from "./block-renderer";

/**
 * Query descriptor for shared global content consumed by client-side chrome
 * (for example, the editable site navigation). Errors are kept distinct from
 * a confirmed missing publication so callers cannot silently hide sync failures.
 */
export const publishedDocQuery = (page: string) => ({
  queryKey: ["published-document", page],
  queryFn: () => fetchPublishedDocument(page),
  staleTime: 5 * 1000,
});

/**
 * Render the exact page state resolved by the server loader:
 * - published: use the authoritative database document;
 * - seed-fallback: temporarily use the validated bundled recovery snapshot;
 * - unpublished: never resurrect content from the seed or legacy components;
 * - unavailable: show a clear failure state rather than misleading hard-coded UI.
 */
export function PublishedOr({
  page,
  pageName,
  initialDocument,
  status,
  siteConfigContent,
  globalDocument,
  usesSeedFallback,
  children,
}: {
  page: string;
  pageName: string;
  initialDocument: PageDocument | null;
  status: PublishedPageStatus;
  siteConfigContent: Record<string, unknown>;
  globalDocument: PageDocument | null;
  usesSeedFallback: boolean;
  children: ReactNode;
}) {
  if ((status === "published" || status === "seed-fallback") && initialDocument) {
    return (
      <>
        <PageShell
          pageName={pageName}
          siteConfigContent={siteConfigContent}
          initialGlobalDocument={globalDocument}
          usesSeedFallback={usesSeedFallback || status === "seed-fallback"}
        >
          <BlockRenderer blocks={initialDocument.blocks} />
        </PageShell>
      </>
    );
  }

  if (import.meta.env.DEV && status === "unavailable") {
    // Keep the hand-authored design useful during local development only.
    return <>{children}</>;
  }

  const title = status === "unpublished" ? "This page is not published" : "Website content is temporarily unavailable";
  const detail = status === "unpublished"
    ? "This page is not currently available. Visit the homepage to continue."
    : "The published content could not be loaded, and no validated backup is available for this page.";

  return (
    <main className="grid min-h-[60vh] place-items-center bg-background px-5 py-16 text-foreground">
      <section className="max-w-xl rounded-2xl border border-border bg-card p-8 text-center">
        <h1 className="font-display text-2xl font-semibold">{title}</h1>
        <p role="status" className="mt-3 text-sm leading-6 text-muted-foreground">{detail}</p>
        <a href="/" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-primary px-5 font-semibold text-primary-foreground">
          Return home
        </a>
      </section>
    </main>
  );
}
