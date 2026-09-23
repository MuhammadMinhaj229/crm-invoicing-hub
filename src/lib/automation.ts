/**
 * Automation engine — EVENT → CONDITION → ACTION → LOG.
 *
 * Rules are stored in the `automations` table. Runs are written to
 * `automation_runs` so every automatic action can be checked later.
 * Nothing runs silently: each run records what happened and why.
 */
import { getSupabase } from "./supabase";

export const TRIGGERS = [
  { id: "lead.created", label: "A new lead comes in" },
  { id: "lead.hot", label: "A lead becomes hot" },
  { id: "message.received", label: "A WhatsApp message arrives" },
  { id: "request.completed", label: "A job is finished" },
  { id: "invoice.paid", label: "An invoice is paid" },
  { id: "customer.quiet", label: "A customer goes quiet" },
] as const;

export const ACTIONS = [
  { id: "notify", label: "Tell the team" },
  { id: "task", label: "Create a follow-up task" },
  { id: "whatsapp", label: "Send a WhatsApp message" },
  { id: "tag", label: "Add a tag" },
] as const;

export interface AutomationRow {
  id: string;
  name: string;
  trigger: string;
  condition: Record<string, unknown>;
  action: string;
  action_config: Record<string, unknown>;
  enabled: boolean;
  created_at: string;
  last_run_at: string | null;
}

export interface AutomationRunRow {
  id: string;
  automation_id: string;
  status: string;
  detail: string | null;
  created_at: string;
}

async function db() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Connect your database in Settings first.");
  return supabase;
}

export async function fetchAutomations(): Promise<AutomationRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.from("automations").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AutomationRow[];
}

export async function fetchAutomationRuns(limit = 50): Promise<AutomationRunRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("automation_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as AutomationRunRow[];
}

export async function saveAutomation(input: {
  id?: string;
  name: string;
  trigger: string;
  action: string;
  action_config?: Record<string, unknown>;
  condition?: Record<string, unknown>;
  enabled?: boolean;
}) {
  const supabase = await db();
  const row = {
    name: input.name,
    trigger: input.trigger,
    action: input.action,
    action_config: input.action_config ?? {},
    condition: input.condition ?? {},
    enabled: input.enabled ?? true,
  };
  const { error } = input.id
    ? await supabase.from("automations").update(row).eq("id", input.id)
    : await supabase.from("automations").insert(row);
  if (error) throw error;
}

export async function setAutomationEnabled(id: string, enabled: boolean) {
  const { error } = await (await db()).from("automations").update({ enabled }).eq("id", id);
  if (error) throw error;
}

export async function deleteAutomation(id: string) {
  const { error } = await (await db()).from("automations").delete().eq("id", id);
  if (error) throw error;
}

export async function logRun(automationId: string, status: string, detail: string) {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("automation_runs").insert({ automation_id: automationId, status, detail });
  await supabase.from("automations").update({ last_run_at: new Date().toISOString() }).eq("id", automationId);
}

/**
 * Runs every enabled rule that listens to this trigger.
 * Actions that need an outside service are recorded and skipped when
 * that service is not connected — they are never pretended to be sent.
 */
export async function runTrigger(
  trigger: string,
  payload: Record<string, unknown>,
): Promise<Array<{ automation: string; status: string; detail: string }>> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase.from("automations").select("*").eq("trigger", trigger).eq("enabled", true);
  const rules = (data ?? []) as AutomationRow[];
  const results: Array<{ automation: string; status: string; detail: string }> = [];

  for (const rule of rules) {
    try {
      if (!conditionPasses(rule.condition, payload)) {
        results.push({ automation: rule.name, status: "skipped", detail: "Condition not met" });
        continue;
      }
      const detail = await performAction(rule, payload);
      await logRun(rule.id, "done", detail);
      results.push({ automation: rule.name, status: "done", detail });
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : "Failed";
      await logRun(rule.id, "failed", detail);
      results.push({ automation: rule.name, status: "failed", detail });
    }
  }
  return results;
}

function conditionPasses(condition: Record<string, unknown>, payload: Record<string, unknown>): boolean {
  return Object.entries(condition ?? {}).every(([key, value]) => {
    if (value === "" || value === null || value === undefined) return true;
    return String(payload[key] ?? "").toLowerCase() === String(value).toLowerCase();
  });
}

async function performAction(rule: AutomationRow, payload: Record<string, unknown>): Promise<string> {
  const supabase = await db();
  const config = rule.action_config ?? {};
  const text = String(config["message"] ?? rule.name);

  if (rule.action === "notify") {
    await supabase.from("notifications").insert({
      title: rule.name,
      body: text,
      kind: "automation",
      entity_id: (payload["id"] as string) ?? null,
    });
    return "Team notified";
  }

  if (rule.action === "task") {
    await supabase.from("tasks").insert({
      title: text,
      contact_id: (payload["contact_id"] as string) ?? null,
      due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: "open",
    });
    return "Follow-up task created";
  }

  if (rule.action === "whatsapp") {
    const phone = String(payload["phone"] ?? "");
    if (!phone) return "No phone number on this record — nothing sent";
    const { openConversation, sendMessage } = await import("./messaging");
    const conversation = await openConversation({ channel: "whatsapp", phone });
    const outcome = await sendMessage({ conversation, body: text, author: "automation" });
    return outcome.delivered ? "WhatsApp message sent" : `Saved but not delivered: ${outcome.error ?? "not connected"}`;
  }

  if (rule.action === "tag") {
    const contactId = payload["contact_id"] as string | undefined;
    if (!contactId) return "No customer on this record";
    const { data } = await supabase.from("contacts").select("tags").eq("id", contactId).maybeSingle();
    const tags = new Set<string>(((data as { tags?: string[] } | null)?.tags ?? []).concat(text));
    await supabase.from("contacts").update({ tags: Array.from(tags) }).eq("id", contactId);
    return `Tag added: ${text}`;
  }

  return "Nothing to do";
}
