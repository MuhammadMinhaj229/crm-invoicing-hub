/**
 * Business knowledge base — one place for services, prices, areas,
 * hours, FAQs, policies and offers. The website, the CRM and any future
 * assistant read from here, so a price is never written twice.
 */
import { getSupabase } from "./supabase";

export const KNOWLEDGE_CATEGORIES = [
  { id: "service", label: "Service" },
  { id: "price", label: "Price" },
  { id: "area", label: "Area we cover" },
  { id: "hours", label: "Working hours" },
  { id: "faq", label: "Question and answer" },
  { id: "policy", label: "Policy" },
  { id: "offer", label: "Offer" },
  { id: "brand", label: "Brand note" },
] as const;

export interface KnowledgeRow {
  id: string;
  category: string;
  code: string | null;
  title: string;
  body: string | null;
  amount: number | null;
  currency: string;
  is_public: boolean;
  sort_order: number;
  updated_at: string;
}

export interface KnowledgeInput {
  category: string;
  code: string;
  title: string;
  body: string;
  amount: string;
  is_public: boolean;
}

export const EMPTY_KNOWLEDGE: KnowledgeInput = {
  category: "service",
  code: "",
  title: "",
  body: "",
  amount: "",
  is_public: true,
};

async function db() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Connect your database in Settings first.");
  return supabase;
}

export async function fetchKnowledge(category?: string): Promise<KnowledgeRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  let query = supabase.from("knowledge_entries").select("*").order("category").order("sort_order");
  if (category) query = query.eq("category", category);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as KnowledgeRow[];
}

export async function saveKnowledge(input: KnowledgeInput, id?: string) {
  const supabase = await db();
  const amount = input.amount.trim() ? Number(input.amount) : null;
  if (amount !== null && (!Number.isFinite(amount) || amount < 0)) {
    throw new Error("Price must be a number.");
  }
  const row = {
    category: input.category,
    code: input.code.trim() || null,
    title: input.title.trim(),
    body: input.body.trim() || null,
    amount,
    is_public: input.is_public,
    updated_at: new Date().toISOString(),
  };
  if (!row.title) throw new Error("A title is needed.");
  const { error } = id
    ? await supabase.from("knowledge_entries").update(row).eq("id", id)
    : await supabase.from("knowledge_entries").insert(row);
  if (error) throw error;
}

export async function deleteKnowledge(id: string) {
  const { error } = await (await db()).from("knowledge_entries").delete().eq("id", id);
  if (error) throw error;
}

export function formatAmount(amount: number | null, currency = "INR", locale = "en-IN"): string {
  if (amount === null) return "—";
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
}
