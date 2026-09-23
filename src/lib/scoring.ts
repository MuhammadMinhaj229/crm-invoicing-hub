/**
 * Lead scoring — a simple, editable points system.
 *
 * Score means "how much interest has this person shown", not "how sure
 * we are who they are". Rules are saved in `app_settings` under the key
 * `lead_scoring`, so the team can change them without any code change.
 */
import { getSupabase } from "./supabase";

export interface ScoringRule {
  id: string;
  label: string;
  /** Event name from the website tracker, or a lead field check. */
  match: string;
  points: number;
  enabled: boolean;
}

export interface ScoringConfig {
  rules: ScoringRule[];
  hotFrom: number;
  warmFrom: number;
}

export const DEFAULT_SCORING: ScoringConfig = {
  hotFrom: 60,
  warmFrom: 30,
  rules: [
    { id: "page", label: "Looked at a page", match: "page.viewed", points: 1, enabled: true },
    { id: "service", label: "Opened a service", match: "service.viewed", points: 5, enabled: true },
    { id: "price", label: "Looked at prices", match: "pricing.viewed", points: 8, enabled: true },
    { id: "faq", label: "Read the FAQ", match: "faq.opened", points: 3, enabled: true },
    { id: "cta", label: "Clicked a button", match: "cta.clicked", points: 5, enabled: true },
    { id: "form_start", label: "Started the form", match: "form.started", points: 8, enabled: true },
    { id: "form", label: "Sent the form", match: "form.submitted", points: 25, enabled: true },
    { id: "whatsapp", label: "Clicked WhatsApp", match: "whatsapp.clicked", points: 25, enabled: true },
    { id: "call", label: "Clicked the phone number", match: "phone.clicked", points: 20, enabled: true },
    { id: "email", label: "Clicked the email", match: "email.clicked", points: 12, enabled: true },
    { id: "repeat", label: "Came back another day", match: "session.returning", points: 10, enabled: true },
  ],
};

export function mergeScoring(value: unknown): ScoringConfig {
  if (!value || typeof value !== "object") return DEFAULT_SCORING;
  const raw = value as Partial<ScoringConfig>;
  return {
    hotFrom: typeof raw.hotFrom === "number" ? raw.hotFrom : DEFAULT_SCORING.hotFrom,
    warmFrom: typeof raw.warmFrom === "number" ? raw.warmFrom : DEFAULT_SCORING.warmFrom,
    rules: Array.isArray(raw.rules) && raw.rules.length ? (raw.rules as ScoringRule[]) : DEFAULT_SCORING.rules,
  };
}

export async function loadScoring(): Promise<ScoringConfig> {
  const supabase = getSupabase();
  if (!supabase) return DEFAULT_SCORING;
  const { data } = await supabase.from("app_settings").select("value").eq("key", "lead_scoring").maybeSingle();
  return mergeScoring((data as { value?: unknown } | null)?.value);
}

export async function saveScoring(config: ScoringConfig): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Connect your database in Settings first.");
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: "lead_scoring", value: config, updated_by: userData.user?.id ?? null }, { onConflict: "key" });
  if (error) throw new Error(error.message);
}

export interface ScoreResult {
  score: number;
  band: "hot" | "warm" | "cold";
  reasons: Array<{ label: string; points: number; times: number }>;
}

/** Counts the events of one visitor against the rules. */
export function scoreEvents(events: Array<{ name: string }>, config: ScoringConfig): ScoreResult {
  const counts = new Map<string, number>();
  for (const event of events) counts.set(event.name, (counts.get(event.name) ?? 0) + 1);

  const reasons: ScoreResult["reasons"] = [];
  let score = 0;
  for (const rule of config.rules) {
    if (!rule.enabled) continue;
    const times = counts.get(rule.match) ?? 0;
    if (!times) continue;
    const points = rule.points * times;
    score += points;
    reasons.push({ label: rule.label, points, times });
  }
  const band: ScoreResult["band"] = score >= config.hotFrom ? "hot" : score >= config.warmFrom ? "warm" : "cold";
  return { score, band, reasons };
}

/** Recalculates and stores the score of one lead from its real website activity. */
export async function rescoreLead(leadId: string, visitorKey: string | null, config: ScoringConfig) {
  const supabase = getSupabase();
  if (!supabase) return null;
  let events: Array<{ name: string }> = [];
  if (visitorKey) {
    const { data } = await supabase.from("events").select("name").eq("visitor_key", visitorKey).limit(1000);
    events = (data ?? []) as Array<{ name: string }>;
  }
  const result = scoreEvents(events, config);
  await supabase
    .from("leads")
    .update({ score: result.score, score_reasons: result.reasons, last_scored_at: new Date().toISOString() })
    .eq("id", leadId);
  return result;
}
