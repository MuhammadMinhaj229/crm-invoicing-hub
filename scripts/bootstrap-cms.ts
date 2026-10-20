/**
 * One-time, server-side bootstrap for the versioned website seed.
 *
 * Required environment variables:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (server-only; never use a VITE_ prefix)
 *   SUPABASE_PROJECT_REF      (safety check to prevent seeding the wrong project)
 *
 * This script cannot overwrite published edits. The database RPC is atomic and
 * refuses a changed seed or a non-empty CMS. Use a reviewed data migration for
 * deliberate content updates after the first bootstrap.
 */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

import { prepareCmsSeed } from "../src/lib/page-builder/seed";

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(stableJson).join(",") + "]";
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return "{" + Object.keys(record).sort().map((key) =>
      JSON.stringify(key) + ":" + stableJson(record[key])
    ).join(",") + "}";
  }
  return JSON.stringify(value) ?? "null";
}

async function main(): Promise<void> {
  const url = process.env["SUPABASE_URL"]?.trim() ?? "";
  const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"]?.trim() ?? "";
  const expectedProjectRef = process.env["SUPABASE_PROJECT_REF"]?.trim() ?? "";

  if (!url || !serviceKey || !expectedProjectRef) {
    throw new Error(
      "Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SUPABASE_PROJECT_REF. " +
      "Run this script only in a trusted server/CI environment.",
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("SUPABASE_URL is not a valid URL.");
  }

  if (parsedUrl.protocol !== "https:" || parsedUrl.hostname.split(".")[0] !== expectedProjectRef) {
    throw new Error(
      "Refusing to seed: SUPABASE_URL does not match SUPABASE_PROJECT_REF. " +
      "Expected a Supabase HTTPS project endpoint for " + expectedProjectRef + ".",
    );
  }

  const seedPath = resolve(process.cwd(), "src/content/seed.json");
  const rawSeed = await readFile(seedPath, "utf8");
  let parsedSeed: unknown;
  try {
    parsedSeed = JSON.parse(rawSeed) as unknown;
  } catch {
    throw new Error("src/content/seed.json is not valid JSON.");
  }

  const payload = prepareCmsSeed(parsedSeed);
  const checksum = createHash("sha256").update(stableJson(parsedSeed)).digest("hex");
  const supabase = createClient(url.replace(/\/+$/, ""), serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "x-client-info": "safar-cms-bootstrap/1" } },
  });

  const { data, error } = await supabase.rpc("bootstrap_cms_seed", {
    p_seed_version: payload.seedVersion,
    p_seed_checksum: checksum,
    p_site_config: payload.siteConfig,
    p_pages: payload.pages,
  });

  if (error) {
    throw new Error(
      "CMS bootstrap was refused by the database: " + error.message +
      ". No partial seed is committed by the bootstrap transaction.",
    );
  }

  const result = data as { status?: unknown; published_pages?: unknown } | null;
  const status = typeof result?.status === "string" ? result.status : "unknown";
  const count = typeof result?.published_pages === "number" ? result.published_pages : null;

  if (status === "initialized") {
    console.log("CMS bootstrap completed. Published pages:", count ?? payload.pages.length);
    console.log("Seed version:", payload.seedVersion);
    console.log("Project:", expectedProjectRef);
    return;
  }

  if (status === "already_initialized") {
    console.log("CMS is already bootstrapped with this seed. No content was overwritten.");
    console.log("Project:", expectedProjectRef);
    return;
  }

  throw new Error("Unexpected bootstrap response status: " + status);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown CMS bootstrap failure.";
  console.error(message);
  process.exitCode = 1;
});
