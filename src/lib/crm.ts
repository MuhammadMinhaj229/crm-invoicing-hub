/**
 * CRM domain helpers — one canonical place for identity rules, lead
 * conversion and the reads behind the Customers workspace.
 *
 * Identity rule: a person is identified by their normalised phone
 * (digits only, E.164-ish) or lower-cased email. Every write goes
 * through these helpers so duplicates cannot creep in.
 */
import { getSupabase } from "./supabase";
import type { WorkspaceSettings } from "./workspace-settings";

export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d+]/g, "").replace(/^00/, "+");
  if (!digits) return null;
  return digits.startsWith("+") ? digits : `+${digits}`;
}

export function normalizeEmail(raw: string | null | undefined): string | null {
  const value = raw?.trim().toLowerCase();
  return value ? value : null;
}

export interface LeadRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  source: string;
  source_detail: string | null;
  campaign: string | null;
  service_interest: string | null;
  location: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  visitor_key?: string | null;
  score?: number | null;
}

export interface ContactRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  gulf_country: string | null;
  gulf_city: string | null;
  india_address: string | null;
  lifecycle_status: string;
  tags: string[];
  notes: string | null;
  created_at: string;
}

export interface RequestRow {
  id: string;
  contact_id: string;
  title: string;
  service_category: string | null;
  status: string;
  created_at: string;
  completed_at: string | null;
}

export interface InvoiceRow {
  id: string;
  contact_id: string;
  invoice_number: string;
  status: string;
  total: number;
  amount_paid: number;
  outstanding: number;
  issued_at: string | null;
}

export interface NewLeadInput {
  name: string;
  phone: string;
  email: string;
  source: string;
  source_detail: string;
  service_interest: string;
  location: string;
  notes: string;
}

async function must() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Connect your database in Settings first.");
  return supabase;
}

export async function fetchLeads(): Promise<LeadRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("leads")
    .select(
      "id, name, phone, email, source, source_detail, campaign, service_interest, location, status, notes, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return (data ?? []) as LeadRow[];
}

export async function fetchContacts(): Promise<ContactRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("contacts")
    .select(
      "id, name, phone, email, whatsapp, gulf_country, gulf_city, india_address, lifecycle_status, tags, notes, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return (data ?? []) as ContactRow[];
}

export async function fetchRequests(): Promise<RequestRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("service_requests")
    .select("id, contact_id, title, service_category, status, created_at, completed_at")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw new Error(error.message);
  return (data ?? []) as RequestRow[];
}

export async function fetchInvoices(): Promise<InvoiceRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("invoices")
    .select("id, contact_id, invoice_number, status, total, amount_paid, outstanding, issued_at")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw new Error(error.message);
  return (data ?? []) as InvoiceRow[];
}

export async function createLead(input: NewLeadInput): Promise<void> {
  const supabase = await must();
  const { error } = await supabase.from("leads").insert({
    name: input.name.trim(),
    phone: normalizePhone(input.phone),
    email: normalizeEmail(input.email),
    source: input.source,
    source_detail: input.source_detail.trim() || null,
    service_interest: input.service_interest || null,
    location: input.location.trim() || null,
    notes: input.notes.trim() || null,
    status: "new",
  });
  if (error) throw new Error(error.message);
}

export async function updateLeadStatus(id: string, status: string): Promise<void> {
  const supabase = await must();
  const { error } = await supabase
    .from("leads")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Converts a lead into a customer contact. If someone with the same
 * normalised phone or email already exists, the lead is linked to that
 * person instead of creating a duplicate.
 */
export async function convertLeadToContact(lead: LeadRow): Promise<string> {
  const supabase = await must();
  const phone = normalizePhone(lead.phone);
  const email = normalizeEmail(lead.email);

  let existingId: string | null = null;
  if (phone || email) {
    const filters: string[] = [];
    if (phone) filters.push(`phone_normalized.eq.${phone}`);
    if (email) filters.push(`email_normalized.eq.${email}`);
    const { data } = await supabase
      .from("contacts")
      .select("id")
      .or(filters.join(","))
      .limit(1)
      .maybeSingle();
    existingId = (data as { id: string } | null)?.id ?? null;
  }

  let contactId = existingId;
  if (!contactId) {
    const { data, error } = await supabase
      .from("contacts")
      .insert({
        lead_id: lead.id,
        name: lead.name,
        phone: lead.phone,
        phone_normalized: phone,
        email: lead.email,
        email_normalized: email,
        whatsapp: lead.phone,
        lifecycle_status: "customer",
        notes: lead.notes,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    contactId = (data as { id: string }).id;
  }

  const { error: leadError } = await supabase
    .from("leads")
    .update({ status: "converted", contact_id: contactId, updated_at: new Date().toISOString() })
    .eq("id", lead.id);
  if (leadError) throw new Error(leadError.message);

  await attachVisitorHistory(lead.visitor_key ?? null, contactId, "form");

  void supabase.from("lead_events").insert({
    lead_id: lead.id,
    kind: "status_changed",
    to_value: "converted",
    detail: "Lead became a customer",
  });

  return contactId;
}

/**
 * Connects an anonymous device to a known person, and stamps that person's
 * name onto everything the device did before. Only called when the person
 * identified themselves — never guessed.
 */
export async function attachVisitorHistory(
  visitorKey: string | null,
  contactId: string,
  signal: "form" | "whatsapp" | "phone" | "email" | "manual",
): Promise<void> {
  if (!visitorKey) return;
  const supabase = getSupabase();
  if (!supabase) return;

  await supabase
    .from("identity_links")
    .upsert(
      { visitor_key: visitorKey, contact_id: contactId, signal, confidence: "confirmed" },
      { onConflict: "visitor_key,contact_id" },
    );
  await supabase.from("visitors").update({ contact_id: contactId }).eq("visitor_key", visitorKey);
  await supabase
    .from("events")
    .update({ contact_id: contactId })
    .eq("visitor_key", visitorKey)
    .is("contact_id", null);
}

/** Everything one customer has done, newest first, across website and CRM. */
export interface TimelineEntry {
  id: string;
  at: string;
  label: string;
  detail?: string;
  kind: "website" | "request" | "invoice" | "payment" | "task" | "lead";
}

export async function fetchCustomerTimeline(contactId: string): Promise<TimelineEntry[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const [events, requests, invoices, payments, tasks] = await Promise.all([
    supabase
      .from("events")
      .select("id, name, route, occurred_at")
      .eq("contact_id", contactId)
      .order("occurred_at", { ascending: false })
      .limit(100),
    supabase
      .from("service_requests")
      .select("id, title, status, created_at")
      .eq("contact_id", contactId),
    supabase.from("invoices").select("id, number, total_amount, status, created_at").eq("contact_id", contactId),
    supabase.from("payments").select("id, amount, paid_at, invoice_id").eq("contact_id", contactId),
    supabase.from("tasks").select("id, title, status, created_at").eq("contact_id", contactId),
  ]);

  const entries: TimelineEntry[] = [];
  const push = (entry: TimelineEntry) => entries.push(entry);

  for (const row of (events.data ?? []) as Array<Record<string, string>>) {
    push({
      id: `e-${row["id"]}`,
      at: row["occurred_at"] as string,
      label: WEBSITE_LABELS[row["name"] as string] ?? (row["name"] as string),
      ...(row["route"] ? { detail: row["route"] } : {}),
      kind: "website",
    });
  }
  for (const row of (requests.data ?? []) as Array<Record<string, string>>) {
    push({
      id: `r-${row["id"]}`,
      at: row["created_at"] as string,
      label: `Service request: ${row["title"] ?? "Untitled"}`,
      detail: row["status"] as string,
      kind: "request",
    });
  }
  for (const row of (invoices.data ?? []) as Array<Record<string, string | number>>) {
    push({
      id: `i-${row["id"]}`,
      at: row["created_at"] as string,
      label: `Invoice ${row["number"] ?? ""}`.trim(),
      detail: `₹${Number(row["total_amount"] ?? 0).toLocaleString("en-IN")} · ${row["status"]}`,
      kind: "invoice",
    });
  }
  for (const row of (payments.data ?? []) as Array<Record<string, string | number>>) {
    push({
      id: `p-${row["id"]}`,
      at: (row["paid_at"] as string) ?? new Date().toISOString(),
      label: "Payment received",
      detail: `₹${Number(row["amount"] ?? 0).toLocaleString("en-IN")}`,
      kind: "payment",
    });
  }
  for (const row of (tasks.data ?? []) as Array<Record<string, string>>) {
    push({
      id: `t-${row["id"]}`,
      at: row["created_at"] as string,
      label: row["title"] as string,
      detail: row["status"] as string,
      kind: "task",
    });
  }

  return entries
    .filter((entry) => Boolean(entry.at))
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

const WEBSITE_LABELS: Record<string, string> = {
  "page.viewed": "Opened a page on the website",
  "service.viewed": "Looked at a service",
  "pricing.viewed": "Looked at prices",
  "cta.clicked": "Clicked a button",
  "form.started": "Started the enquiry form",
  "form.submitted": "Sent an enquiry",
  "whatsapp.clicked": "Clicked WhatsApp",
  "phone.clicked": "Clicked the phone number",
  "email.clicked": "Clicked the email",
};

/* ---------------- Retention intelligence ---------------- */

export interface RetentionRow {
  contact: ContactRow;
  lastOrderAt: string | null;
  daysQuiet: number | null;
  orderCount: number;
  topCategory: string | null;
  categoryCounts: { category: string; count: number }[];
  thresholdDays: number;
  state: "healthy" | "at_risk" | "churned" | "never_ordered";
}

export function buildRetention(
  contacts: ContactRow[],
  requests: RequestRow[],
  settings: WorkspaceSettings,
): RetentionRow[] {
  const byContact = new Map<string, RequestRow[]>();
  for (const request of requests) {
    const list = byContact.get(request.contact_id) ?? [];
    list.push(request);
    byContact.set(request.contact_id, list);
  }

  const overrides = new Map(
    settings.retention.categoryOverrides.map((o) => [o.category, o.days] as const),
  );

  return contacts
    .map<RetentionRow>((contact) => {
      const history = byContact.get(contact.id) ?? [];
      const counts = new Map<string, number>();
      for (const request of history) {
        const key = request.service_category ?? "Uncategorised";
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      const categoryCounts = [...counts.entries()]
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);
      const topCategory = categoryCounts[0]?.category ?? null;
      const lastOrderAt = history[0]?.created_at ?? null;
      const daysQuiet = lastOrderAt
        ? Math.floor((Date.now() - new Date(lastOrderAt).getTime()) / 86_400_000)
        : null;
      const thresholdDays =
        (topCategory ? overrides.get(topCategory) : undefined) ??
        settings.retention.defaultInactivityDays;

      let state: RetentionRow["state"] = "healthy";
      if (daysQuiet === null) state = "never_ordered";
      else if (daysQuiet >= settings.retention.churnedAfterDays) state = "churned";
      else if (daysQuiet >= thresholdDays) state = "at_risk";

      return {
        contact,
        lastOrderAt,
        daysQuiet,
        orderCount: history.length,
        topCategory,
        categoryCounts,
        thresholdDays,
        state,
      };
    })
    .sort((a, b) => (b.daysQuiet ?? -1) - (a.daysQuiet ?? -1));
}

/* ---------------- Follow-up tasks ---------------- */

export interface TaskRow {
  id: string;
  title: string;
  kind: string;
  status: string;
  priority: string;
  contact_id: string | null;
  due_at: string | null;
  created_at: string;
}

export async function fetchTasks(): Promise<TaskRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, kind, status, priority, contact_id, due_at, created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return (data ?? []) as TaskRow[];
}

export async function createFollowUpTask(
  contactId: string,
  title: string,
  dueInDays = 1,
): Promise<void> {
  const supabase = await must();
  const dueAt = new Date(Date.now() + dueInDays * 86_400_000).toISOString();
  const { error } = await supabase.from("tasks").insert({
    title,
    kind: "follow_up",
    priority: "high",
    status: "open",
    contact_id: contactId,
    due_at: dueAt,
  });
  if (error) throw new Error(error.message);
}

export async function completeTask(id: string): Promise<void> {
  const supabase = await must();
  const { error } = await supabase.from("tasks").update({ status: "done" }).eq("id", id);
  if (error) throw new Error(error.message);
}

/** Records a reactivation / re-engagement outcome against the customer. */
export async function markReactivated(contactId: string): Promise<void> {
  const supabase = await must();
  const { error } = await supabase
    .from("contacts")
    .update({ lifecycle_status: "reactivated", updated_at: new Date().toISOString() })
    .eq("id", contactId);
  if (error) throw new Error(error.message);
}

