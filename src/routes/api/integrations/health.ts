import { createFileRoute } from "@tanstack/react-router";

/** Tells the console which outside services really have their keys set. No secret values are returned. */
export const Route = createFileRoute("/api/integrations/health")({
  server: {
    handlers: {
      GET: async () => {
        const { probeDirectDatabase } = await import("@/lib/db.server");
        const direct = await probeDirectDatabase();
        const has = (name: string) => Boolean(process.env[name]);
        const checks = [
          { key: "database_direct", label: "Database direct link (Transaction pooler)", ok: direct.ok, detail: direct.detail },
          {
            key: "whatsapp_meta",
            label: "WhatsApp (official Meta Cloud API)",
            ok: has("WHATSAPP_CLOUD_TOKEN") && has("WHATSAPP_CLOUD_PHONE_ID"),
            detail: "Needs WHATSAPP_CLOUD_TOKEN and WHATSAPP_CLOUD_PHONE_ID",
          },
          {
            key: "whatsapp_evolution",
            label: "WhatsApp (own server)",
            ok: has("EVOLUTION_API_URL") && has("EVOLUTION_API_KEY") && has("EVOLUTION_INSTANCE"),
            detail: "Needs EVOLUTION_API_URL, EVOLUTION_API_KEY and EVOLUTION_INSTANCE",
          },
          {
            key: "whatsapp_webhook",
            label: "WhatsApp incoming messages",
            ok: (has("DATABASE_URL") || (has("SUPABASE_URL") && has("SUPABASE_SERVICE_ROLE_KEY"))) && has("WHATSAPP_WEBHOOK_SECRET"),
            detail: "Needs WHATSAPP_WEBHOOK_SECRET plus DATABASE_URL (or SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)",
          },
          {
            key: "instagram",
            label: "Instagram (Business)",
            ok: has("INSTAGRAM_TOKEN") && has("INSTAGRAM_ACCOUNT_ID"),
            detail: "Needs INSTAGRAM_TOKEN and INSTAGRAM_ACCOUNT_ID",
          },
          {
            key: "facebook",
            label: "Facebook Page",
            ok: has("FACEBOOK_PAGE_TOKEN") && has("FACEBOOK_PAGE_ID"),
            detail: "Needs FACEBOOK_PAGE_TOKEN and FACEBOOK_PAGE_ID",
          },
          {
            key: "gbp",
            label: "Google Business Profile",
            ok: has("GBP_TOKEN") && has("GBP_ACCOUNT_ID"),
            detail: "Needs GBP_TOKEN and GBP_ACCOUNT_ID",
          },
          {
            key: "linkedin",
            label: "LinkedIn Page",
            ok: has("LINKEDIN_TOKEN") && has("LINKEDIN_ORG_ID"),
            detail: "Needs LINKEDIN_TOKEN and LINKEDIN_ORG_ID",
          },
          {
            key: "youtube",
            label: "YouTube channel",
            ok: has("YOUTUBE_TOKEN") && has("YOUTUBE_CHANNEL_ID"),
            detail: "Needs YOUTUBE_TOKEN and YOUTUBE_CHANNEL_ID",
          },
        ];
        return Response.json({ checks });
      },
    },
  },
});
