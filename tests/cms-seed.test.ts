import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { prepareCmsSeed } from "../src/lib/page-builder/seed";

const seedPath = fileURLToPath(new URL("../src/content/seed.json", import.meta.url));
const seed = JSON.parse(readFileSync(seedPath, "utf8")) as unknown;

describe("versioned CMS bootstrap seed", () => {
  test("validates and normalizes the full site, theme and page documents", () => {
    const prepared = prepareCmsSeed(seed);

    expect(prepared.seedVersion).toBe("schema-1/content-1");
    expect(prepared.siteConfig.site).toBeTruthy();
    expect(prepared.siteConfig.theme).toBeTruthy();
    expect(prepared.pages.length).toBe(14);

    const home = prepared.pages.find((page) => page.page === "home");
    expect(home).toBeTruthy();
    expect(home?.document.metadata?.path).toBe("/");
    expect(home?.document.metadata?.seo.title).toContain("SAFAR N MANZIL");
    expect(home?.document.blocks.length).toBe(9);

    const global = prepared.pages.find((page) => page.page === "global");
    expect(global?.document.blocks[0]?.type).toBe("navigation");
  });

  test("rejects unsupported schema versions instead of seeding incompatible content", () => {
    expect(() => prepareCmsSeed({ schemaVersion: 999 })).toThrow(
      "is not supported by the current editor schema",
    );
  });

  test("rejects malformed block props rather than storing a partial website", () => {
    const bad = {
      schemaVersion: 1,
      version: 99,
      site: {},
      theme: {},
      pages: {
        home: {
          label: "Home",
          path: "/",
          seo: { title: "Home", description: "Test" },
          blocks: [{
            id: "x",
            type: "unknown-script",
            props: {},
            layout: {
              align: "left",
              width: "normal",
              spaceTop: 1,
              spaceBottom: 1,
              background: "none",
              hideMobile: false,
              hideDesktop: false,
            },
          }],
        },
      },
    };

    expect(() => prepareCmsSeed(bad)).toThrow("Invalid website seed page home");
  });
});
