import type { ReactNode } from "react";

import type { PageDocument } from "../../lib/page-builder/model";
import { PageShell } from "../layout/page-shell";
import { BlockRenderer } from "./block-renderer";

/**
 * Render a published page document supplied by the route loader. This keeps
 * public content in the initial server-rendered response and avoids a browser
 * query replacing hardcoded fallback markup after hydration.
 */
export function PublishedOr({
  page,
  pageName,
  initialDocument,
  children,
}: {
  page: string;
  pageName: string;
  initialDocument: PageDocument | null;
  children: ReactNode;
}) {
  if (!initialDocument) return <>{children}</>;

  return (
    <PageShell pageName={pageName}>
      <BlockRenderer blocks={initialDocument.blocks} />
    </PageShell>
  );
}
