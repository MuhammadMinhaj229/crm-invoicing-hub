import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchPublishedDocument } from "../../lib/page-builder/store";
import { PageShell } from "../layout/page-shell";
import { BlockRenderer } from "./block-renderer";

export const publishedDocQuery = (page: string) => ({
  queryKey: ["published-document", page],
  queryFn: () => fetchPublishedDocument(page),
  staleTime: 60 * 1000,
});

/**
 * Shows the page built in the CRM builder when one is published; otherwise
 * the built-in page (children) renders unchanged.
 */
export function PublishedOr({ page, pageName, children }: { page: string; pageName: string; children: ReactNode }) {
  const { data } = useQuery(publishedDocQuery(page));
  if (!data) return <>{children}</>;
  return (
    <PageShell pageName={pageName}>
      <BlockRenderer blocks={data.blocks} />
    </PageShell>
  );
}
