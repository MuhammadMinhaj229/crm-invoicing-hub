/**
 * Publication-state boundary shared by SSR routes and the visual website engine.
 *
 * PostgreSQL remains authoritative after the one-time seed bootstrap. The
 * bundled seed is a recovery snapshot only: it is used when the database cannot
 * be reached, never when PostgreSQL confirms that a page is unpublished.
 */
import seedBlueprint from "../../content/seed.json";
import type { PageDocument } from "./model";
import { prepareCmsSeed } from "./seed";
import { readPublishedDocumentState, type PublishedDocumentRead } from "./store";

export type PublishedPageStatus =
  | "published"
  | "unpublished"
  | "seed-fallback"
  | "unavailable";

export interface PublishedPageLoad {
  publishedDocument: PageDocument | null;
  publishedDocumentStatus: PublishedPageStatus;
}

export type PublicDocumentResolution =
  | { status: "published"; document: PageDocument }
  | { status: "seed-fallback"; document: PageDocument }
  | { status: "unpublished"; document: null }
  | { status: "unavailable"; document: null };

const seed = prepareCmsSeed(seedBlueprint as unknown);
const bundledDocuments = new Map<string, PageDocument>(
  seed.pages.map(({ page, document }) => [page, document] as const),
);

export function resolvePublicDocument(
  database: PublishedDocumentRead,
  fallback: PageDocument | null,
): PublicDocumentResolution {
  if (database.status === "published") {
    return { status: "published", document: database.document };
  }
  if (database.status === "unpublished") {
    // Do not re-publish an intentionally unpublished page from the build-time seed.
    return { status: "unpublished", document: null };
  }
  if (fallback) {
    return { status: "seed-fallback", document: fallback };
  }
  return { status: "unavailable", document: null };
}

/**
 * Return a route-loader payload that can render safely even if Supabase is
 * temporarily unreachable. A valid no-row response remains an unpublished page.
 */
export async function loadPublishedPage(page: string): Promise<PublishedPageLoad> {
  const database = await readPublishedDocumentState(page);
  if (database.status === "unavailable") {
    // Keep diagnostics in server/browser logs; never serialize raw backend errors
    // into public HTML or reveal them in a customer-facing error message.
    console.error("[cms] Published content could not be loaded.", {
      page,
      reason: database.reason,
    });
  }

  const resolution = resolvePublicDocument(database, bundledDocuments.get(page) ?? null);
  return {
    publishedDocument: resolution.document,
    publishedDocumentStatus: resolution.status,
  };
}
