/**
 * Website enquiry capture.
 *
 * Turns a form submission on the public site into a real lead row in the
 * business database, carrying the visitor's earlier browsing history and the
 * campaign they arrived from. If the database is not reachable the form still
 * works — the person is handed over to WhatsApp and nothing is lost on screen.
 */
import { getSupabase } from "@/lib/supabase";
import { getFirstTouch, getVisitorKey, track } from "@/lib/analytics";

export interface EnquiryInput {
  name: string;
  phone: string;
  city?: string;
  need: string;
  serviceInterest?: string;
}

export interface EnquiryResult {
  saved: boolean;
  leadId?: string;
  reason?: string;
}

export async function submitWebsiteEnquiry(input: EnquiryInput): Promise<EnquiryResult> {
  track("form.submitted", {
    service_interest: input.serviceInterest ?? null,
    has_city: Boolean(input.city),
  });

  const supabase = getSupabase();
  if (!supabase) return { saved: false, reason: "not_connected" };

  const firstTouch = getFirstTouch();
  const visitorKey = getVisitorKey();

  const { data, error } = await supabase
    .from("leads")
    .insert({
      name: input.name.trim(),
      phone: input.phone.trim(),
      source: "website",
      source_detail: firstTouch?.landing_page ?? "/",
      campaign: firstTouch?.utm_campaign ?? null,
      service_interest: input.serviceInterest ?? null,
      location: input.city?.trim() || null,
      notes: input.need.trim(),
      visitor_key: visitorKey,
      status: "new",
    })
    .select("id")
    .single();

  if (error || !data) return { saved: false, reason: error?.message };

  // Record where this lead came from, first touch and the converting touch.
  const touches: Array<Record<string, unknown>> = [];
  if (firstTouch) {
    touches.push({
      visitor_key: visitorKey,
      lead_id: data.id as string,
      touch_type: "first",
      source: firstTouch.utm_source ?? referrerSource(firstTouch.referrer),
      medium: firstTouch.utm_medium,
      campaign: firstTouch.utm_campaign,
      landing_page: firstTouch.landing_page,
    });
  }
  touches.push({
    visitor_key: visitorKey,
    lead_id: data.id as string,
    touch_type: "conversion",
    source: "website",
    medium: "form",
    campaign: firstTouch?.utm_campaign ?? null,
    landing_page: typeof window !== "undefined" ? window.location.pathname : null,
  });

  void supabase.from("attribution_touches").insert(touches);
  void supabase
    .from("lead_events")
    .insert({ lead_id: data.id as string, kind: "note", detail: "Created from the website enquiry form" });

  return { saved: true, leadId: data.id as string };
}

function referrerSource(referrer: string): string {
  if (!referrer) return "direct";
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (host.includes("google")) return "google";
    if (host.includes("instagram")) return "instagram";
    if (host.includes("facebook")) return "facebook";
    if (host.includes("whatsapp")) return "whatsapp";
    return host;
  } catch {
    return "direct";
  }
}
