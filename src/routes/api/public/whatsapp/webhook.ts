import { createFileRoute } from "@tanstack/react-router";

/**
 * Incoming WhatsApp messages.
 *
 * - Meta Cloud verifies the endpoint with a GET challenge.
 * - Every POST is checked against a shared secret before anything is saved.
 * - Each provider event id is stored once, so a repeated delivery never
 *   creates a second message or a second lead.
 */

type Incoming = {
  provider: string;
  eventId: string;
  from: string;
  name?: string;
  body: string;
  sentAt: string;
};

function digitsOnly(value: string): string {
  return value.replace(/[^\d]/g, "");
}

function parseMeta(payload: unknown): Incoming[] {
  const root = payload as {
    entry?: Array<{ changes?: Array<{ value?: { contacts?: Array<{ profile?: { name?: string } }>; messages?: Array<{ id?: string; from?: string; timestamp?: string; text?: { body?: string } }> } }> }>;
  };
  const out: Incoming[] = [];
  for (const entry of root.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const name = change.value?.contacts?.[0]?.profile?.name;
      for (const message of change.value?.messages ?? []) {
        if (!message.id || !message.from) continue;
        out.push({
          provider: "whatsapp_meta",
          eventId: message.id,
          from: message.from,
          ...(name ? { name } : {}),
          body: message.text?.body ?? "",
          sentAt: message.timestamp
            ? new Date(Number(message.timestamp) * 1000).toISOString()
            : new Date().toISOString(),
        });
      }
    }
  }
  return out;
}

function parseEvolution(payload: unknown): Incoming[] {
  const root = payload as {
    event?: string;
    data?: {
      key?: { id?: string; remoteJid?: string; fromMe?: boolean };
      pushName?: string;
      message?: { conversation?: string; extendedTextMessage?: { text?: string } };
      messageTimestamp?: number;
    };
  };
  const data = root.data;
  if (!data?.key?.id || data.key.fromMe) return [];
  const from = digitsOnly(data.key.remoteJid ?? "");
  if (!from) return [];
  return [
    {
      provider: "whatsapp_evolution",
      eventId: data.key.id,
      from,
      ...(data.pushName ? { name: data.pushName } : {}),
      body: data.message?.conversation ?? data.message?.extendedTextMessage?.text ?? "",
      sentAt: data.messageTimestamp
        ? new Date(data.messageTimestamp * 1000).toISOString()
        : new Date().toISOString(),
    },
  ];
}

export const Route = createFileRoute("/api/public/whatsapp/webhook")({
  server: {
    handlers: {
      // Meta Cloud verification handshake.
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const verifyToken = process.env["WHATSAPP_VERIFY_TOKEN"] ?? "";
        if (
          verifyToken &&
          url.searchParams.get("hub.mode") === "subscribe" &&
          url.searchParams.get("hub.verify_token") === verifyToken
        ) {
          return new Response(url.searchParams.get("hub.challenge") ?? "", { status: 200 });
        }
        return new Response("Forbidden", { status: 403 });
      },

      POST: async ({ request }) => {
        const secret = process.env["WHATSAPP_WEBHOOK_SECRET"] ?? "";
        const raw = await request.text();

        if (secret) {
          const provided =
            request.headers.get("x-webhook-secret") ??
            new URL(request.url).searchParams.get("secret") ??
            "";
          const a = new TextEncoder().encode(provided);
          const b = new TextEncoder().encode(secret);
          const same = a.length === b.length && a.every((value, index) => value === b[index]);
          if (!same) return new Response("Invalid signature", { status: 401 });
        }

        let payload: unknown;
        try {
          payload = JSON.parse(raw);
        } catch {
          return new Response("Bad payload", { status: 400 });
        }

        const url = process.env["SUPABASE_URL"] ?? "";
        const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? "";
        if (!url || !serviceKey) {
          return Response.json({ ok: false, error: "Database is not set up on the server" }, { status: 503 });
        }

        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

        const incoming = [...parseMeta(payload), ...parseEvolution(payload)];
        let stored = 0;

        for (const item of incoming) {
          // Idempotency: one row per provider event id.
          const { error: seen } = await supabase.from("webhook_events").insert({
            provider: item.provider,
            event_id: item.eventId,
            event_type: "message.received",
            payload: payload as Record<string, unknown>,
            processing_status: "processing",
          });
          if (seen) continue; // already handled

          const phone = `+${digitsOnly(item.from)}`;
          const { data: contact } = await supabase
            .from("contacts")
            .select("id")
            .eq("phone", phone)
            .maybeSingle();

          const { data: conversation } = await supabase
            .from("conversations")
            .upsert(
              {
                channel: "whatsapp",
                external_id: phone,
                phone,
                display_name: item.name ?? phone,
                contact_id: contact?.id ?? null,
                status: "open",
                last_message_at: item.sentAt,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "channel,external_id" },
            )
            .select("id, unread_count")
            .single();

          if (!conversation) continue;

          await supabase.from("messages").insert({
            conversation_id: conversation.id,
            direction: "in",
            channel: "whatsapp",
            external_id: item.eventId,
            body: item.body,
            status: "delivered",
            sent_at: item.sentAt,
          });

          await supabase
            .from("conversations")
            .update({ unread_count: (conversation.unread_count ?? 0) + 1 })
            .eq("id", conversation.id);

          await supabase
            .from("webhook_events")
            .update({ processing_status: "done" })
            .eq("provider", item.provider)
            .eq("event_id", item.eventId);

          stored += 1;
        }

        return Response.json({ ok: true, stored });
      },
    },
  },
});
