/**
 * First-party website intelligence.
 *
 * Every visitor gets an anonymous key stored in their own browser. Nothing
 * personal is collected until the person identifies themselves through the
 * enquiry form or a message. Events are queued and sent in the background so
 * the website never waits for tracking, and the site keeps working normally
 * if the database is unreachable.
 */
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

const VISITOR_KEY = "safar.visitor";
const SESSION_KEY = "safar.session";
const SESSION_STARTED = "safar.session.started";
const FIRST_TOUCH_KEY = "safar.first_touch";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

export type EventName =
  | "page.viewed"
  | "session.started"
  | "service.viewed"
  | "pricing.viewed"
  | "faq.viewed"
  | "search.performed"
  | "cta.clicked"
  | "form.started"
  | "form.submitted"
  | "whatsapp.clicked"
  | "phone.clicked"
  | "email.clicked"
  | "feedback.submitted";

export interface TouchContext {
  landing_page: string;
  referrer: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
}

interface QueuedEvent {
  event_key: string;
  name: string;
  visitor_key: string;
  session_key: string;
  route: string;
  page_title: string;
  properties: Record<string, unknown>;
  occurred_at: string;
}

function browserId(prefix: string): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${random}`;
}

function readStore(store: Storage | undefined, key: string): string | null {
  try {
    return store?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function writeStore(store: Storage | undefined, key: string, value: string): void {
  try {
    store?.setItem(key, value);
  } catch {
    /* private mode — tracking simply stops, the site keeps working */
  }
}

export function getVisitorKey(): string | null {
  if (typeof window === "undefined") return null;
  let key = readStore(window.localStorage, VISITOR_KEY);
  if (!key) {
    key = browserId("vis");
    writeStore(window.localStorage, VISITOR_KEY, key);
  }
  return key;
}

function currentTouch(): TouchContext {
  const params = new URLSearchParams(window.location.search);
  const pick = (name: string) => params.get(name) || null;
  return {
    landing_page: window.location.pathname + window.location.search,
    referrer: document.referrer || "",
    utm_source: pick("utm_source"),
    utm_medium: pick("utm_medium"),
    utm_campaign: pick("utm_campaign"),
    utm_term: pick("utm_term"),
    utm_content: pick("utm_content"),
  };
}

export function getFirstTouch(): TouchContext | null {
  if (typeof window === "undefined") return null;
  const raw = readStore(window.localStorage, FIRST_TOUCH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TouchContext;
  } catch {
    return null;
  }
}

function describeDevice() {
  const ua = navigator.userAgent;
  const device = /Mobi|Android|iPhone/i.test(ua)
    ? "mobile"
    : /iPad|Tablet/i.test(ua)
      ? "tablet"
      : "desktop";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /Chrome\//.test(ua)
      ? "Chrome"
      : /Safari\//.test(ua)
        ? "Safari"
        : /Firefox\//.test(ua)
          ? "Firefox"
          : "Other";
  const os = /Windows/.test(ua)
    ? "Windows"
    : /Android/.test(ua)
      ? "Android"
      : /iPhone|iPad|iOS/.test(ua)
        ? "iOS"
        : /Mac OS/.test(ua)
          ? "macOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "Other";
  return { device, browser, os };
}

let sessionEnsured: Promise<string | null> | null = null;

async function ensureSession(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const visitorKey = getVisitorKey();
  if (!visitorKey) return null;

  const existing = readStore(window.sessionStorage, SESSION_KEY);
  const startedAt = Number(readStore(window.sessionStorage, SESSION_STARTED) ?? 0);
  const fresh = existing && Date.now() - startedAt < SESSION_TIMEOUT_MS;
  if (fresh && existing) return existing;

  const sessionKey = browserId("ses");
  writeStore(window.sessionStorage, SESSION_KEY, sessionKey);
  writeStore(window.sessionStorage, SESSION_STARTED, String(Date.now()));

  const touch = currentTouch();
  if (!getFirstTouch()) {
    writeStore(window.localStorage, FIRST_TOUCH_KEY, JSON.stringify(touch));
  }

  const supabase = getSupabase();
  if (!supabase) return sessionKey;

  const firstTouch = getFirstTouch() ?? touch;
  const { device, browser, os } = describeDevice();

  // Fire and forget: a failure here must never block the page.
  void supabase
    .from("visitors")
    .insert({
      visitor_key: visitorKey,
      first_landing_page: firstTouch.landing_page,
      first_referrer: firstTouch.referrer,
      first_utm_source: firstTouch.utm_source,
      first_utm_medium: firstTouch.utm_medium,
      first_utm_campaign: firstTouch.utm_campaign,
    })
    .then(() => undefined);

  void supabase
    .from("visitor_sessions")
    .insert({
      session_key: sessionKey,
      visitor_key: visitorKey,
      landing_page: touch.landing_page,
      referrer: touch.referrer,
      utm_source: touch.utm_source,
      utm_medium: touch.utm_medium,
      utm_campaign: touch.utm_campaign,
      utm_term: touch.utm_term,
      utm_content: touch.utm_content,
      device,
      browser,
      os,
      language: navigator.language,
    })
    .then(() => undefined);

  return sessionKey;
}

const queue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

async function flush(): Promise<void> {
  flushTimer = null;
  if (queue.length === 0) return;
  const supabase = getSupabase();
  if (!supabase) {
    queue.length = 0;
    return;
  }
  const batch = queue.splice(0, queue.length);
  try {
    await supabase.from("events").insert(batch);
  } catch {
    /* tracking is best effort */
  }
}

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(() => void flush(), 800);
}

/** Record a website action. Safe to call anywhere; never throws. */
export function track(
  name: EventName | string,
  properties: Record<string, unknown> = {},
): void {
  if (typeof window === "undefined" || !isSupabaseConfigured()) return;
  const visitorKey = getVisitorKey();
  if (!visitorKey) return;

  if (!sessionEnsured) sessionEnsured = ensureSession();
  void sessionEnsured.then((sessionKey) => {
    if (!sessionKey) return;
    queue.push({
      event_key: browserId("evt"),
      name,
      visitor_key: visitorKey,
      session_key: sessionKey,
      route: window.location.pathname,
      page_title: document.title,
      properties,
      occurred_at: new Date().toISOString(),
    });
    scheduleFlush();
  });
}

/** Call once when a public page mounts. */
export function trackPageView(extra: Record<string, unknown> = {}): void {
  track("page.viewed", { ...extra, search: window.location.search || undefined });
}

if (typeof window !== "undefined") {
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void flush();
  });
  window.addEventListener("pagehide", () => void flush());
}
