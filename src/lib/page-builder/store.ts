/**
 * Persistence for page documents. Reuses the existing CMS tables:
 * one `cms_sections` row per page (section_key "__document") with draft and
 * published content, plus `cms_revisions` for history. No new tables.
 */
import { getSupabase } from "../supabase";
import { isPageDocument, type PageDocument } from "./model";

const KEY = "__document";
const LOCAL = (page: string) => `safar.builder.draft.${page}`;

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

/** Published document for the public site, or null to use the built-in page. */
export async function fetchPublishedDocument(page: string): Promise<PageDocument | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("cms_sections")
    .select("content, status")
    .eq("page", page)
    .eq("section_key", KEY)
    .eq("status", "published")
    .maybeSingle();
  if (error || !data) return null;
  const content = (data as { content: unknown }).content;
  return isPageDocument(content) && content.blocks.length > 0 ? content : null;
}

export async function fetchDocumentState(page: string): Promise<DocumentState> {
  const localRaw = typeof window !== "undefined" ? window.localStorage.getItem(LOCAL(page)) : null;
  const local = localRaw ? (JSON.parse(localRaw) as PageDocument) : null;
  const supabase = getSupabase();
  if (!supabase) return { id: null, draft: local, published: null, status: "none", version: 0 };
  const { data, error } = await supabase
    .from("cms_sections")
    .select("id, content, draft_content, status, version")
    .eq("page", page)
    .eq("section_key", KEY)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return { id: null, draft: local, published: null, status: "none", version: 0 };
  const row = data as { id: string; content: unknown; draft_content: unknown; status: string; version: number };
  const published = isPageDocument(row.content) && row.content.blocks.length ? row.content : null;
  const draft = isPageDocument(row.draft_content) ? row.draft_content : local;
  return { id: row.id, draft, published, status: row.status === "published" ? "published" : "draft", version: row.version ?? 0 };
}

export async function saveDocumentDraft(doc: PageDocument): Promise<"cloud" | "local"> {
  const stamped = { ...doc, updatedAt: new Date().toISOString() };
  if (typeof window !== "undefined") window.localStorage.setItem(LOCAL(doc.page), JSON.stringify(stamped));
  const supabase = getSupabase();
  if (!supabase) return "local";
  const { error } = await supabase
    .from("cms_sections")
    .upsert(
      { page: doc.page, section_key: KEY, draft_content: stamped, updated_at: stamped.updatedAt },
      { onConflict: "page,section_key" },
    );
  if (error) throw new Error(error.message);
  return "cloud";
}

export async function publishDocument(doc: PageDocument): Promise<number> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Connect your database in Settings → Connections before publishing.");
  const stamped = { ...doc, updatedAt: new Date().toISOString() };
  const { data: existing } = await supabase
    .from("cms_sections")
    .select("version")
    .eq("page", doc.page)
    .eq("section_key", KEY)
    .maybeSingle();
  const version = ((existing as { version?: number } | null)?.version ?? 0) + 1;
  const { data: saved, error } = await supabase
    .from("cms_sections")
    .upsert(
      { page: doc.page, section_key: KEY, content: stamped, draft_content: stamped, status: "published", version, updated_at: stamped.updatedAt },
      { onConflict: "page,section_key" },
    )
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  const { error: revError } = await supabase
    .from("cms_revisions")
    .insert({ section_id: (saved as { id: string }).id, content: stamped, version });
  if (revError) throw new Error(revError.message);
  return version;
}

/** Take the page off the builder; the built-in page shows again. */
export async function unpublishDocument(page: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Connect your database first.");
  const { error } = await supabase
    .from("cms_sections")
    .update({ status: "draft", updated_at: new Date().toISOString() })
    .eq("page", page)
    .eq("section_key", KEY);
  if (error) throw new Error(error.message);
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
  return ((data ?? []) as DocumentRevision[]).filter((r) => isPageDocument(r.content));
}
