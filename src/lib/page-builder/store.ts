/**
 * Persistence boundary for page documents.
 *
 * Drafts may be kept locally while disconnected, but only the shared database
 * can publish. Published versions are validated by the runtime schema and are
 * advanced by a transactional RPC using optimistic concurrency.
 */
import { getSupabase } from "../supabase";
import type { PageDocument } from "./model";
import { PAGE_DOCUMENT_VERSION, parsePageDocument, validatePageDocument } from "./schema";

const KEY = "__document";
const LOCAL = (page: string) => "safar.builder.draft." + page;

function readLocal(key: string): PageDocument | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? parsePageDocument(JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

export interface DocumentState {
  id: string | null;
  draft: PageDocument | null;
  published: PageDocument | null;
  status: "published" | "draft" | "none";
  version: number;
}

export interface DocumentRevision {
  id: string;
  version: number;
  saved_at: string;
  content: PageDocument;
}

/**
 * Return only shared, published content. A local draft or old local-only
 * publication must never be mistaken for the website seen by other visitors.
 */
export async function fetchPublishedDocument(page: string): Promise<PageDocument | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  // Public reads go through a narrow RPC because RLS filters rows, not
  // columns. Querying cms_sections directly could expose draft_content on a
  // row that also contains the published version.
  const { data, error } = await supabase.rpc("get_published_page_document", {
    p_page: page,
  });

  if (error || !data) return null;
  return parsePageDocument(data);
}

export async function fetchDocumentState(page: string): Promise<DocumentState> {
  const local = readLocal(LOCAL(page));
  const supabase = getSupabase();

  // Local drafts help an editor work offline. They are deliberately not live
  // and are never returned as published content.
  if (!supabase) {
    return {
      id: null,
      draft: local,
      published: null,
      status: local ? "draft" : "none",
      version: 0,
    };
  }

  const { data, error } = await supabase
    .from("cms_sections")
    .select("id, content, draft_content, status, version")
    .eq("page", page)
    .eq("section_key", KEY)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) {
    return {
      id: null,
      draft: local,
      published: null,
      status: local ? "draft" : "none",
      version: 0,
    };
  }

  const row = data as {
    id: string;
    content: unknown;
    draft_content: unknown;
    status: string;
    version: number | null;
  };
  const storedPublished = parsePageDocument(row.content);
  if (row.status === "published" && row.content != null && !storedPublished) {
    throw new Error("The published page document is invalid or uses an unsupported schema. Restore a compatible revision before editing.");
  }
  const storedDraft = parsePageDocument(row.draft_content);
  if (row.draft_content != null && !storedDraft) {
    throw new Error("The saved draft is invalid or uses an unsupported schema. Restore or migrate it before editing.");
  }
  const published = row.status === "published" ? storedPublished : null;
  const draft = storedDraft ?? local;
  const version = Number.isSafeInteger(row.version) && Number(row.version) >= 0
    ? Number(row.version)
    : 0;

  return {
    id: row.id,
    draft,
    published,
    status: published ? "published" : draft ? "draft" : "none",
    version,
  };
}

export async function saveDocumentDraft(doc: PageDocument): Promise<"cloud" | "local"> {
  const validation = validatePageDocument(doc);
  if (!validation.ok) {
    throw new Error("Cannot save invalid page document:\n" + validation.issues.slice(0, 8).join("\n"));
  }

  const stamped: PageDocument = {
    ...validation.document,
    schemaVersion: PAGE_DOCUMENT_VERSION,
    updatedAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(LOCAL(doc.page), JSON.stringify(stamped));
    } catch {
      // Browser storage is only a convenience; shared persistence is attempted below.
    }
  }

  const supabase = getSupabase();
  if (!supabase) return "local";

  // Draft creation and draft updates use separate least-privilege writes:
  // editors must not need UPDATE privileges on a page's identity columns.
  const state = await fetchDocumentState(stamped.page);
  const { error } = state.id
    ? await supabase
        .from("cms_sections")
        .update({
          draft_content: stamped,
          updated_at: stamped.updatedAt,
        })
        .eq("id", state.id)
    : await supabase
        .from("cms_sections")
        .insert({
          page: stamped.page,
          section_key: KEY,
          draft_content: stamped,
          updated_at: stamped.updatedAt,
        });

  if (error) {
    if (error.code === "23505") {
      throw new Error("Another editor created this page while you were saving. Reload the page and retry.");
    }
    throw new Error(error.message);
  }
  return "cloud";
}

/**
 * Publish through a single PostgreSQL transaction. The expected version stops
 * a stale editor from silently replacing a newer published page.
 *
 * Requires supabase/migrations/20261011000000_atomic_page_publish.sql to be
 * applied to the connected Supabase project. It intentionally fails closed if
 * the database connection or migration is missing.
 */
export async function publishDocument(doc: PageDocument, expectedVersion: number): Promise<number> {
  const validation = validatePageDocument(doc);
  if (!validation.ok) {
    throw new Error("Cannot publish invalid page document:\n" + validation.issues.slice(0, 8).join("\n"));
  }
  if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 0) {
    throw new Error("The published version is invalid. Reload the page before publishing.");
  }

  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Connect this editor to the shared Supabase database before publishing. Local drafts are not visible to visitors.");
  }

  const stamped: PageDocument = {
    ...validation.document,
    schemaVersion: PAGE_DOCUMENT_VERSION,
    updatedAt: new Date().toISOString(),
  };

  const { data, error } = await supabase.rpc("publish_page_document", {
    p_page: stamped.page,
    p_content: stamped,
    p_expected_version: expectedVersion,
  });

  if (error) {
    if (/publish_page_document|schema cache|could not find the function/i.test(error.message)) {
      throw new Error("The atomic publishing migration is not installed on this Supabase project. Apply supabase/migrations/20261011000000_atomic_page_publish.sql, then retry.");
    }
    if (error.code === "40001") {
      throw new Error("This page changed in another editor. Reload the page to review the latest version before publishing.");
    }
    throw new Error("Publishing failed: " + error.message);
  }

  const version = typeof data === "number" ? data : Number(data);
  if (!Number.isSafeInteger(version) || version !== expectedVersion + 1) {
    throw new Error("The database returned an unexpected published version. Check the page status before retrying.");
  }

  // Keep the browser's draft aligned with the successful shared publication.
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(LOCAL(stamped.page), JSON.stringify(stamped));
    } catch {
      // A browser cache failure must not undo an already committed publication.
    }
  }
  return version;
}

/** Take a page out of public circulation; never fake this as a local operation. */
export async function unpublishDocument(page: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Connect to the shared Supabase database before unpublishing a page.");
  }

  const state = await fetchDocumentState(page);
  if (!state.id || !state.published) {
    throw new Error("This page has no published version to unpublish.");
  }

  const { data, error } = await supabase.rpc("unpublish_page_document", {
    p_page: page,
    p_expected_version: state.version,
  });

  if (error) {
    if (error.code === "40001") {
      throw new Error("This page changed in another editor. Reload the page before unpublishing.");
    }
    if (/unpublish_page_document|schema cache|could not find the function/i.test(error.message)) {
      throw new Error("The CMS security migration is not installed. Apply supabase/migrations/20261012000000_lock_down_cms_access.sql, then retry.");
    }
    throw new Error("Unpublishing failed: " + error.message);
  }

  const version = typeof data === "number" ? data : Number(data);
  if (!Number.isSafeInteger(version) || version !== state.version + 1) {
    throw new Error("The database returned an unexpected version after unpublishing. Check the page status before retrying.");
  }
}


export interface CmsHandshake {
  ok: boolean;
  status: "ready" | "seed_required" | "no_published_pages" | "protocol_mismatch" | string;
  protocol_version: number;
  schema_version: number;
  site_seeded: boolean;
  site_version: number;
  published_page_count: number;
  server_time: string;
  seed_version?: string | null;
}

/**
 * A real database round-trip used by the editor and the public renderer.
 * The /auth/v1/health endpoint only proves that Auth can answer; this RPC
 * validates that the CMS schema and initial seed exist as well.
 */
export async function fetchCmsHandshake(): Promise<CmsHandshake> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured for this deployment.");

  const { data, error } = await supabase.rpc("get_cms_handshake", {
    p_protocol_version: 1,
  });
  if (error) throw new Error("Database handshake failed: " + error.message);
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Database returned an invalid CMS handshake response.");
  }

  const result = data as Record<string, unknown>;
  if (
    typeof result["status"] !== "string" ||
    typeof result["ok"] !== "boolean" ||
    typeof result["schema_version"] !== "number" ||
    typeof result["protocol_version"] !== "number" ||
    typeof result["site_seeded"] !== "boolean" ||
    typeof result["published_page_count"] !== "number" ||
    typeof result["server_time"] !== "string"
  ) {
    throw new Error("Database handshake is missing required protocol fields.");
  }

  return {
    ok: result["ok"],
    status: result["status"],
    protocol_version: result["protocol_version"],
    schema_version: result["schema_version"],
    site_seeded: result["site_seeded"],
    site_version: typeof result["site_version"] === "number" ? result["site_version"] : 0,
    published_page_count: result["published_page_count"],
    server_time: result["server_time"],
    seed_version: typeof result["seed_version"] === "string" ? result["seed_version"] : null,
  };
}

/**
 * Realtime is a status signal, not an authorization mechanism. The table RLS
 * policies still restrict events to approved editors. A remote edit is surfaced
 * but never silently replaces the editor's unsaved draft.
 */
export function subscribeToCmsChanges(
  onStatus: (status: string) => void,
  onChange: (table: "cms_sections" | "cms_site_config") => void,
): () => void {
  const supabase = getSupabase();
  if (!supabase) {
    onStatus("UNCONFIGURED");
    return () => undefined;
  }

  const channel = supabase
    .channel("safar-cms-sync-status")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "cms_sections" },
      () => onChange("cms_sections"),
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "cms_site_config" },
      () => onChange("cms_site_config"),
    )
    .subscribe((status) => onStatus(status));

  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function fetchDocumentRevisions(sectionId: string): Promise<DocumentRevision[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("cms_revisions")
    .select("id, version, saved_at, content")
    .eq("section_id", sectionId)
    .order("version", { ascending: false })
    .limit(30);

  if (error) throw new Error(error.message);

  return ((data ?? []) as Array<{ id: string; version: number; saved_at: string; content: unknown }>)
    .flatMap((revision) => {
      const content = parsePageDocument(revision.content);
      return content ? [{ ...revision, content }] : [];
    });
}
