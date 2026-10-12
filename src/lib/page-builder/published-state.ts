/**
 * Publication-state boundary shared by SSR routes and the visual website engine.
 * PostgreSQL is authoritative after bootstrap; the seed is a recovery snapshot,
 * never a way to revive a page explicitly reported as unpublished.
 */
import seedBlueprint from "../../content/seed.json";
import type { PageDocument } from "./model";
import { prepareCmsSeed } from "./seed";
import {
  fetchCmsSiteConfiguration,
  readPublishedDocumentState,
  type PublishedDocumentRead,
} from "./store";

export type PublishedPageStatus = "published" | "unpublished" | "seed-fallback" | "unavailable";

export interface PublishedPageLoad {
  publishedDocument: PageDocument | null;
  publishedDocumentStatus: PublishedPageStatus;
  siteConfigContent: Record<string, unknown>;
  globalDocument: PageDocument | null;
  usesSeedFallback: boolean;
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
  if (database.status === "published") return { status: "published", document: database.document };
  if (database.status === "unpublished") return { status: "unpublished", document: null };
  if (fallback) return { status: "seed-fallback", document: fallback };
  return { status: "unavailable", document: null };
}

function seedSiteConfiguration(): Record<string, unknown> {
  return {
    schemaVersion: seed.siteConfig.schemaVersion,
    seedVersion: seed.siteConfig.seedVersion,
    site: seed.siteConfig.site,
    theme: seed.siteConfig.theme,
  };
}

function logUnavailable(area: string, reason: string): void {
  console.error("[cms] " + area + " could not be loaded.", { reason });
}

/**
 * Load the body, global navigation and site configuration together so the
 * initial SSR response is internally consistent. Partial failures are explicit.
 */
export async function loadPublishedPage(page: string): Promise<PublishedPageLoad> {
  const [database, globalState, siteConfigResult] = await Promise.all([
    readPublishedDocumentState(page),
    readPublishedDocumentState("global"),
    fetchCmsSiteConfiguration()
      .then((configuration) => ({ ok: true as const, content: configuration.content }))
      .catch((error: unknown) => ({
        ok: false as const,
        reason: error instanceof Error ? error.message : "Unknown configuration read failure.",
      })),
  ]);

  if (database.status === "unavailable") logUnavailable("published page " + page, database.reason);
  if (globalState.status === "unavailable") logUnavailable("global navigation", globalState.reason);
  if (!siteConfigResult.ok) logUnavailable("site configuration", siteConfigResult.reason);

  const resolution = resolvePublicDocument(database, bundledDocuments.get(page) ?? null);
  const globalDocument =
    globalState.status === "published"
      ? globalState.document
      : globalState.status === "unavailable"
        ? bundledDocuments.get("global") ?? null
        : null;
  const siteConfigContent = siteConfigResult.ok ? siteConfigResult.content : seedSiteConfiguration();

  return {
    publishedDocument: resolution.document,
    publishedDocumentStatus: resolution.status,
    siteConfigContent,
    globalDocument,
    usesSeedFallback:
      resolution.status === "seed-fallback" ||
      globalState.status === "unavailable" ||
      !siteConfigResult.ok,
  };
}
