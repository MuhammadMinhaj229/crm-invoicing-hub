/**
 * Social connectors and the post planner.
 *
 * Only what the official platform APIs really allow is offered here.
 * Where a platform does not allow something (for example, posting to a
 * personal Instagram account, or reading private messages without an
 * approved app), the app says so plainly instead of pretending.
 */
import { getSupabase } from "./supabase";

export interface ConnectorInfo {
  key: string;
  label: string;
  /** What the official API allows today. */
  can: string[];
  /** What the official API does not allow. */
  cannot: string[];
  setup: string;
}

export const CONNECTORS: ConnectorInfo[] = [
  {
    key: "whatsapp_evolution",
    label: "WhatsApp — own server",
    can: ["Send and receive messages", "Photos and files", "Full chat history in the inbox"],
    cannot: ["Message templates approved by Meta", "Green tick business badge"],
    setup: "Run the messaging server, then set EVOLUTION_API_URL, EVOLUTION_API_KEY and EVOLUTION_INSTANCE on the host.",
  },
  {
    key: "whatsapp_meta",
    label: "WhatsApp — official Meta Cloud API",
    can: ["Send and receive messages", "Approved templates", "Delivery and read status"],
    cannot: ["Message people who never wrote to you outside a template window"],
    setup: "Get a WhatsApp Business account approved, then set WHATSAPP_CLOUD_TOKEN, WHATSAPP_CLOUD_PHONE_ID, WHATSAPP_VERIFY_TOKEN.",
  },
  {
    key: "instagram",
    label: "Instagram (Business account)",
    can: ["Publish photos and reels", "Read comments", "Read direct messages with an approved app"],
    cannot: ["Work with a personal account", "Publish stories with a link without approval"],
    setup: "Convert the account to Business, link it to a Facebook Page, then set INSTAGRAM_TOKEN and INSTAGRAM_ACCOUNT_ID.",
  },
  {
    key: "facebook",
    label: "Facebook Page",
    can: ["Publish posts", "Read comments and messages", "Read Page insights"],
    cannot: ["Post to personal profiles"],
    setup: "Create a Meta app with pages permissions, then set FACEBOOK_PAGE_ID and FACEBOOK_PAGE_TOKEN.",
  },
  {
    key: "gbp",
    label: "Google Business Profile",
    can: ["Publish updates", "Read and reply to reviews", "Read search and call stats"],
    cannot: ["Change reviews", "Remove honest reviews"],
    setup: "Ask Google for Business Profile API access, then set GBP_ACCOUNT_ID and GBP_TOKEN.",
  },
  {
    key: "linkedin",
    label: "LinkedIn Page",
    can: ["Publish posts on a company page", "Read simple page stats"],
    cannot: ["Read private messages", "Post as a person without their sign-in"],
    setup: "Create a LinkedIn app with w_organization_social, then set LINKEDIN_ORG_ID and LINKEDIN_TOKEN.",
  },
  {
    key: "youtube",
    label: "YouTube channel",
    can: ["Upload videos", "Read comments", "Read view stats"],
    cannot: ["Change view counts or other public numbers"],
    setup: "Create a Google Cloud project with the YouTube Data API, then set YOUTUBE_TOKEN and YOUTUBE_CHANNEL_ID.",
  },
];

export interface SocialAccountRow {
  id: string;
  platform: string;
  account_name: string | null;
  status: string;
  connected_at: string | null;
}

export interface SocialPostRow {
  id: string;
  channel: string;
  body: string;
  media_url: string | null;
  scheduled_for: string | null;
  status: string;
  error: string | null;
  created_at: string;
  published_at: string | null;
}

async function db() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Connect your database in Settings first.");
  return supabase;
}

export async function fetchSocialPosts(): Promise<SocialPostRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("social_posts")
    .select("*")
    .order("scheduled_for", { ascending: true, nullsFirst: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as SocialPostRow[];
}

export async function saveSocialPost(input: {
  channel: string;
  body: string;
  scheduled_for: string;
  media_url?: string;
}) {
  if (!input.body.trim()) throw new Error("Write something to post.");
  const { error } = await (await db()).from("social_posts").insert({
    channel: input.channel,
    body: input.body.trim(),
    media_url: input.media_url?.trim() || null,
    scheduled_for: input.scheduled_for ? new Date(input.scheduled_for).toISOString() : null,
    status: input.scheduled_for ? "scheduled" : "draft",
  });
  if (error) throw error;
}

export async function deleteSocialPost(id: string) {
  const { error } = await (await db()).from("social_posts").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchIntegrations() {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.from("integrations").select("*");
  if (error) throw error;
  return (data ?? []) as Array<{
    key: string;
    label: string;
    status: string;
    last_checked_at: string | null;
    last_error: string | null;
  }>;
}

/** Asks the server which providers really have their keys in place. */
export async function checkIntegrationHealth(): Promise<
  Array<{ key: string; label: string; ok: boolean; detail: string }>
> {
  try {
    const response = await fetch("/api/integrations/health");
    if (!response.ok) return [];
    const payload = (await response.json()) as {
      checks?: Array<{ key: string; label: string; ok: boolean; detail: string }>;
    };
    return payload.checks ?? [];
  } catch {
    return [];
  }
}
