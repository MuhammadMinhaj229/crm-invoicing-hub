import { describe, expect, test } from "bun:test";

import type { PageDocument } from "../src/lib/page-builder/model";
import { resolvePublicDocument } from "../src/lib/page-builder/published-state";
import type { PublishedDocumentRead } from "../src/lib/page-builder/store";

function document(page: string, title: string): PageDocument {
  return {
    schemaVersion: 1,
    page,
    metadata: {
      label: page,
      path: page === "home" ? "/" : "/" + page,
      seo: { title, description: "test" },
    },
    blocks: [],
  };
}

describe("public content source selection", () => {
  const seed = document("home", "Bundled seed");
  const live = document("home", "Published from database");

  test("published database content always wins over the build-time seed", () => {
    const state: PublishedDocumentRead = { status: "published", document: live };
    expect(resolvePublicDocument(state, seed)).toEqual({
      status: "published",
      document: live,
    });
  });

  test("a confirmed unpublished page is never resurrected from the seed", () => {
    const state: PublishedDocumentRead = { status: "unpublished" };
    expect(resolvePublicDocument(state, seed)).toEqual({
      status: "unpublished",
      document: null,
    });
  });

  test("a database outage uses only the validated bundled seed as a labelled recovery", () => {
    const state: PublishedDocumentRead = {
      status: "unavailable",
      reason: "network timeout",
    };
    expect(resolvePublicDocument(state, seed)).toEqual({
      status: "seed-fallback",
      document: seed,
    });
  });

  test("a database outage with no matching seed page fails visibly", () => {
    const state: PublishedDocumentRead = {
      status: "unavailable",
      reason: "network timeout",
    };
    expect(resolvePublicDocument(state, null)).toEqual({
      status: "unavailable",
      document: null,
    });
  });
});
