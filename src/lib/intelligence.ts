/**
 * Website intelligence reads for the CRM.
 * Every number here traces back to real rows — nothing is estimated.
 */
import { getSupabase } from "@/lib/supabase";

export interface EventRow {
  id: string;
  name: string;
  visitor_key: string;
  session_key: string | null;
  route: string | null;
  page_title: string | null;
  properties: Record<string, unknown>;
  occurred_at: string;
}

export interface SessionRow {
  id: string;
  session_key: string;
  visitor_key: string;
  started_at: string;
  landing_page: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  device: string | null;
  browser: string | null;
  country: string | null;
}

export interface IntelligenceSummary {
  connected: boolean;
  visitors: number;
  sessions: number;
  events: number;
  enquiries: number;
  sources: Array<{ label: string; count: number }>;
  topEvents: Array<{ label: string; count: number }>;
  recentSessions: SessionRow[];
}

export const RANGE_OPTIONS = [
  { id: "today", label: "Today", days: 1 },
  { id: "7d", label: "Last 7 days", days: 7 },
  { id: "30d", label: "Last 30 days", days: 30 },
  { id: "90d", label: "Last 90 days", days: 90 },
] as const;

export type RangeId = (typeof RANGE_OPTIONS)[number]["id"];

function sinceIso(days: number): string {
  if (days === 1) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return start.toISOString();
  }
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function tally(values: Array<string | null | undefined>): Array<{ label: string; count: number }> {
  const counts = new Map<string, number>();
  for (const value of values) {
    const key = value && value.trim() ? value.trim() : "direct";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function sourceOf(session: SessionRow): string {
  if (session.utm_source) return session.utm_source;
  if (!session.referrer) return "direct";
  try {
    const host = new URL(session.referrer).hostname.replace(/^www\./, "");
    if (host.includes("google")) return "google";
    if (host.includes("instagram")) return "instagram";
    if (host.includes("facebook")) return "facebook";
    return host;
  } catch {
    return "direct";
  }
}

export async function fetchIntelligence(range: RangeId): Promise<IntelligenceSummary> {
  const empty: IntelligenceSummary = {
    connected: false,
    visitors: 0,
    sessions: 0,
    events: 0,
    enquiries: 0,
    sources: [],
    topEvents: [],
    recentSessions: [],
  };
  const supabase = getSupabase();
  if (!supabase) return empty;

  const days = RANGE_OPTIONS.find((option) => option.id === range)?.days ?? 7;
  const since = sinceIso(days);

  const [sessionsRes, eventsRes, enquiriesRes] = await Promise.all([
    supabase
      .from("visitor_sessions")
      .select(
        "id, session_key, visitor_key, started_at, landing_page, referrer, utm_source, utm_medium, utm_campaign, device, browser, country",
      )
      .gte("started_at", since)
      .order("started_at", { ascending: false })
      .limit(500),
    supabase
      .from("events")
      .select("name, visitor_key")
      .gte("occurred_at", since)
      .limit(5000),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("source", "website")
      .gte("created_at", since),
  ]);

  if (sessionsRes.error && eventsRes.error) return empty;

  const sessions = (sessionsRes.data ?? []) as SessionRow[];
  const events = (eventsRes.data ?? []) as Array<{ name: string; visitor_key: string }>;

  return {
    connected: true,
    visitors: new Set(sessions.map((session) => session.visitor_key)).size,
    sessions: sessions.length,
    events: events.length,
    enquiries: enquiriesRes.count ?? 0,
    sources: tally(sessions.map(sourceOf)).slice(0, 8),
    topEvents: tally(events.map((event) => event.name)).slice(0, 10),
    recentSessions: sessions.slice(0, 25),
  };
}

/** Everything one anonymous device did, newest first. */
export async function fetchVisitorJourney(visitorKey: string): Promise<EventRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("events")
    .select("id, name, visitor_key, session_key, route, page_title, properties, occurred_at")
    .eq("visitor_key", visitorKey)
    .order("occurred_at", { ascending: false })
    .limit(200);
  if (error) return [];
  return (data ?? []) as EventRow[];
}

export const EVENT_LABELS: Record<string, string> = {
  "page.viewed": "Opened a page",
  "session.started": "Started a visit",
  "service.viewed": "Looked at a service",
  "pricing.viewed": "Looked at prices",
  "faq.viewed": "Read the questions",
  "search.performed": "Searched",
  "cta.clicked": "Clicked a button",
  "form.started": "Started the form",
  "form.submitted": "Sent the form",
  "whatsapp.clicked": "Clicked WhatsApp",
  "phone.clicked": "Clicked the phone number",
  "email.clicked": "Clicked the email",
  "feedback.submitted": "Left feedback",
};

export function labelEvent(name: string): string {
  return EVENT_LABELS[name] ?? name;
}
