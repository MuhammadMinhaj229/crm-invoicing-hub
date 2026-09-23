/**
 * Messaging layer — one shape for every channel.
 *
 * The app never talks to WhatsApp directly from the browser. It writes
 * and reads conversations/messages in the business database, and asks
 * the server (`/api/messaging/send`) to actually deliver a message.
 * The server picks the provider adapter (Evolution self-hosted today,
 * Meta Cloud later) using server-only environment variables, so no
 * token ever reaches the browser.
 */
import { getSupabase } from "./supabase";
import { normalizePhone } from "./crm";

async function db() {
  const supabase = await db();
  if (!supabase) throw new Error("Connect your database in Settings first.");
  return supabase;
}

export const CHANNELS = ["whatsapp", "instagram", "facebook", "email", "web"] as const;
export type Channel = (typeof CHANNELS)[number];

export const CONVERSATION_STATUSES = ["open", "pending", "closed"] as const;

export interface ConversationRow {
  id: string;
  channel: string;
  account_id: string | null;
  external_id: string | null;
  contact_id: string | null;
  lead_id: string | null;
  display_name: string | null;
  phone: string | null;
  status: string;
  assigned_to: string | null;
  tags: string[];
  service_interest: string | null;
  unread_count: number;
  last_message_at: string | null;
  created_at: string;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  direction: "in" | "out";
  channel: string;
  body: string | null;
  media_url: string | null;
  media_type: string | null;
  status: string;
  error: string | null;
  author: string | null;
  sent_at: string;
}

export interface TemplateRow {
  id: string;
  name: string;
  channel: string;
  body: string;
}

export async function fetchConversations(filter?: {
  channel?: string;
  status?: string;
  search?: string;
}): Promise<ConversationRow[]> {
  const client = await db();
  let query = client
    .from("conversations")
    .select("*")
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(200);
  if (filter?.channel) query = query.eq("channel", filter.channel);
  if (filter?.status) query = query.eq("status", filter.status);
  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []) as ConversationRow[];
  const search = filter?.search?.trim().toLowerCase();
  if (!search) return rows;
  return rows.filter(
    (row) =>
      (row.display_name ?? "").toLowerCase().includes(search) ||
      (row.phone ?? "").toLowerCase().includes(search),
  );
}

export async function fetchMessages(conversationId: string): Promise<MessageRow[]> {
  const { data, error } = await (await db())
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("sent_at", { ascending: true })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as MessageRow[];
}

export async function fetchTemplates(): Promise<TemplateRow[]> {
  const { data, error } = await (await db())
    .from("message_templates")
    .select("*")
    .order("name");
  if (error) throw error;
  return (data ?? []) as TemplateRow[];
}

export async function saveTemplate(input: { name: string; body: string; channel?: string }) {
  const { error } = await (await db())
    .from("message_templates")
    .upsert(
      { name: input.name, body: input.body, channel: input.channel ?? "whatsapp", updated_at: new Date().toISOString() },
      { onConflict: "name" },
    );
  if (error) throw error;
}

export async function deleteTemplate(id: string) {
  const { error } = await (await db()).from("message_templates").delete().eq("id", id);
  if (error) throw error;
}

/** Start (or find) a conversation with a person on a channel. */
export async function openConversation(input: {
  channel: Channel;
  phone?: string;
  displayName?: string;
  contactId?: string | null;
  leadId?: string | null;
}): Promise<ConversationRow> {
  const supabase = await db();
  const phone = normalizePhone(input.phone);
  const externalId = phone ?? `${input.channel}:${input.displayName ?? "unknown"}`;

  const { data: existing } = await supabase
    .from("conversations")
    .select("*")
    .eq("channel", input.channel)
    .eq("external_id", externalId)
    .maybeSingle();
  if (existing) return existing as ConversationRow;

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      channel: input.channel,
      external_id: externalId,
      phone,
      display_name: input.displayName ?? phone ?? "Unknown",
      contact_id: input.contactId ?? null,
      lead_id: input.leadId ?? null,
      status: "open",
      last_message_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as ConversationRow;
}

export interface SendResult {
  ok: boolean;
  delivered: boolean;
  error?: string;
}

/**
 * Save the outgoing message, then ask the server to deliver it.
 * If no provider is configured the message stays as "queued" and the
 * team can still open WhatsApp by hand — nothing is lost or faked.
 */
export async function sendMessage(input: {
  conversation: ConversationRow;
  body: string;
  author?: string;
}): Promise<SendResult> {
  const supabase = await db();
  const now = new Date().toISOString();
  const { data: saved, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: input.conversation.id,
      direction: "out",
      channel: input.conversation.channel,
      body: input.body,
      status: "queued",
      author: input.author ?? null,
      sent_at: now,
    })
    .select("id")
    .single();
  if (error) throw error;

  await supabase
    .from("conversations")
    .update({ last_message_at: now, updated_at: now, status: "open" })
    .eq("id", input.conversation.id);

  try {
    const response = await fetch("/api/messaging/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: input.conversation.channel,
        to: input.conversation.phone ?? input.conversation.external_id,
        body: input.body,
      }),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      externalId?: string;
    };
    if (!response.ok || !payload.ok) {
      const message = payload.error || `Delivery failed (${response.status})`;
      await supabase.from("messages").update({ status: "failed", error: message }).eq("id", saved.id);
      return { ok: true, delivered: false, error: message };
    }
    await supabase
      .from("messages")
      .update({ status: "sent", external_id: payload.externalId ?? null })
      .eq("id", saved.id);
    return { ok: true, delivered: true };
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not reach the sender";
    await supabase.from("messages").update({ status: "failed", error: message }).eq("id", saved.id);
    return { ok: true, delivered: false, error: message };
  }
}

export async function setConversationStatus(id: string, status: string) {
  const { error } = await (await db())
    .from("conversations")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function linkConversationToContact(id: string, contactId: string) {
  const { error } = await (await db())
    .from("conversations")
    .update({ contact_id: contactId, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export function whatsappLink(phone: string | null | undefined, text?: string): string {
  const digits = (phone ?? "").replace(/[^\d]/g, "");
  if (!digits) return "";
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
