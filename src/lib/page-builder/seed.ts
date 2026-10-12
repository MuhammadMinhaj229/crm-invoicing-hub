/**
 * Converts the versioned website seed into the canonical CMS payload.
 *
 * The seed file is the initial bootstrap source. After bootstrap completes,
 * PostgreSQL owns live content; this function never performs database writes.
 */
import type { PageDocument } from "./model";
import { PAGE_DOCUMENT_VERSION, validatePageDocument } from "./schema";

export interface CmsSeedPage {
  page: string;
  document: PageDocument;
}

export interface CmsSeedPayload {
  seedVersion: string;
  siteConfig: {
    schemaVersion: number;
    seedVersion: string;
    site: Record<string, unknown>;
    theme: Record<string, unknown>;
  };
  pages: CmsSeedPage[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown, name: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Seed is missing a valid " + name + ".");
  }
  return value.trim();
}

export function prepareCmsSeed(value: unknown): CmsSeedPayload {
  if (!isRecord(value)) throw new Error("Website seed must be a JSON object.");

  const schemaVersion = value.schemaVersion;
  if (schemaVersion !== PAGE_DOCUMENT_VERSION) {
    throw new Error(
      "Website seed schema " + String(schemaVersion) +
      " is not supported by the current editor schema " + PAGE_DOCUMENT_VERSION + ".",
    );
  }

  const seedContentVersion = value.version;
  if (!(typeof seedContentVersion === "string" || typeof seedContentVersion === "number")) {
    throw new Error("Website seed is missing a version.");
  }
  const seedVersion = String(seedContentVersion).trim();
  if (!seedVersion || seedVersion.length > 100) {
    throw new Error("Website seed version is invalid.");
  }

  if (!isRecord(value.site) || !isRecord(value.theme)) {
    throw new Error("Website seed must include both site settings and theme tokens.");
  }
  if (!isRecord(value.pages) || Object.keys(value.pages).length === 0) {
    throw new Error("Website seed must contain at least one page.");
  }
  if (Object.keys(value.pages).length > 100) {
    throw new Error("Website seed exceeds the 100-page bootstrap limit.");
  }

  const pages: CmsSeedPage[] = [];
  for (const [page, rawPage] of Object.entries(value.pages)) {
    if (!/^[A-Za-z0-9:_-]{1,200}$/.test(page)) {
      throw new Error("Invalid CMS page identifier: " + page);
    }
    if (!isRecord(rawPage) || !Array.isArray(rawPage.blocks)) {
      throw new Error("Page " + page + " must have a blocks array.");
    }

    const seo = rawPage.seo;
    if (!isRecord(seo)) {
      throw new Error("Page " + page + " is missing SEO metadata.");
    }

    const metadata = {
      label: nonEmptyString(rawPage.label, page + ".label"),
      path: nonEmptyString(rawPage.path, page + ".path"),
      seo: {
        title: nonEmptyString(seo.title, page + ".seo.title"),
        description: typeof seo.description === "string" ? seo.description : "",
      },
    };

    const validation = validatePageDocument({
      schemaVersion: PAGE_DOCUMENT_VERSION,
      page,
      metadata,
      blocks: rawPage.blocks,
    });

    if (!validation.ok) {
      throw new Error(
        "Invalid website seed page " + page + ":\n" +
        validation.issues.slice(0, 8).join("\n"),
      );
    }

    pages.push({ page, document: validation.document });
  }

  return {
    seedVersion: "schema-" + schemaVersion + "/content-" + seedVersion,
    siteConfig: {
      schemaVersion,
      seedVersion,
      site: value.site,
      theme: value.theme,
    },
    pages,
  };
}
