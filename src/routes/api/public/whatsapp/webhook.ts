import { createFileRoute } from "@tanstack/react-router";

import { constantTimeStringEqual, identifyIncomingWebhookProvider, verifyMetaWebhookSignature } from "@/lib/whatsapp/webhook-auth";

/**
 * Incoming WhatsApp messages.
 *
 * - Meta Cloud verifies the endpoint with a GET challenge.
 * - Every POST is checked against a shared secret before anything is saved.
 * - Each provider event id is stored once, so a repeated delivery never
 *   creates a second message or a second lead.
 */

const MAX_WEBHOOK_BODY_BYTES = 1_000_000;
const MAX_MESSAGE_LENGTH = 5_000;

async function readBoundedBody(request: Request, limit: number): Promise<string | null> {
  const reader = request.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > limit) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

function timestampFromUnixSeconds(value: string | number | undefined): string {
  const numeric = value === undefined ? Number.NaN : Number(value);
  const date = Number.isFinite(numeric) && numeric > 0 ? new Date(numeric * 1000) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

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
  const root = (payload && typeof payload === "object" ? payload : {}) as {
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
          ...(name ? { name: name.slice(0, 100) } : {}),
          body: (message.text?.body ?? "").slice(0, MAX_MESSAGE_LENGTH),
          sentAt: timestampFromUnixSeconds(message.timestamp),
        });
      }
    }
  }
  return out;
}

function parseEvolution(payload: unknown): Incoming[] {
  const root = (payload && typeof payload === "object" ? payload : {}) as {
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
      ...(data.pushName ? { name: data.pushName.slice(0, 100) } : {}),
      body: (data.message?.conversation ?? data.message?.extendedTextMessage?.text ?? "").slice(0, MAX_MESSAGE_LENGTH),
      sentAt: timestampFromUnixSeconds(data.messageTimestamp),
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
        const declaredLength = Number(request.headers.get("content-length") ?? 0);
        if (Number.isFinite(declaredLength) && declaredLength > MAX_WEBHOOK_BODY_BYTES) {
          return Response.json({ ok: false, error: "Payload too large" }, { status: 413 });
        }

        const raw = await readBoundedBody(request, MAX_WEBHOOK_BODY_BYTES);
        if (raw === null) return Response.json({ ok: false, error: "Payload too large" }, { status: 413 });

        let payload: unknown;
        try {
          payload = JSON.parse(raw);
        } catch {
          return Response.json({ ok: false, error: "Bad payload" }, { status: 400 });
        }

        const provider = identifyIncomingWebhookProvider(payload);
        if (provider === "unknown") {
          return Response.json({ ok: false, error: "Unsupported webhook payload" }, { status: 400 });
        }

        if (provider === "meta") {
          const appSecret = process.env["META_APP_SECRET"] ?? "";
          if (!appSecret) {
            return Response.json({ ok: false, error: "Meta webhook verification is not configured" }, { status: 503 });
          }
          if (!(await verifyMetaWebhookSignature(raw, request.headers.get("x-hub-signature-256"), appSecret))) {
            return Response.json({ ok: false, error: "Invalid Meta signature" }, { status: 401 });
          }
        } else {
          const sharedSecret = process.env["WHATSAPP_WEBHOOK_SECRET"] ?? "";
          if (!sharedSecret) {
            return Response.json({ ok: false, error: "Evolution webhook verification is not configured" }, { status: 503 });
          }
          if (!constantTimeStringEqual(request.headers.get("x-webhook-secret") ?? "", sharedSecret)) {
            return Response.json({ ok: false, error: "Invalid webhook secret" }, { status: 401 });
          }
        }

        const incoming = provider === "meta" ? parseMeta(payload) : parseEvolution(payload);
        if (incoming.length === 0) return Response.json({ ok: true, stored: 0 });

        // Atomic deduplication and persistence require the server-only database
        // path. Do not fall back to non-transactional service-role REST writes.
        const { getSql } = await import("@/lib/db.server");
        const sql = await getSql();
        if (!sql) {
          return Response.json({ ok: false, error: "The server database connection is not configured" }, { status: 503 });
        }

        let stored = 0;
        for (const item of incoming) {
          const digits = digitsOnly(item.from);
          if (digits.length < 6 || digits.length > 20) continue;
          const phone = "+" + digits;

          const done = await sql.begin(async (tx) => {
            const seen = await tx`
              insert into public.webhook_events (provider, external_id, event_type, payload, processing_status)
              values (${item.provider}, ${item.eventId}, 'message.received', ${tx.json(payload as never)}, 'processing')
              on conflict (provider, external_id) do nothing
              returning id`;
            if (seen.length === 0) return false;

            const [conversation] = await tx`
              insert into public.conversations
                (channel, external_id, phone, display_name, contact_id, status, last_message_at, unread_count, updated_at)
              values ('whatsapp', ${phone}, ${phone}, ${item.name ?? phone},
                (select id from public.contacts where phone = ${phone} limit 1),
                'open', ${item.sentAt}, 1, now())
              on conflict (channel, external_id) do update set
                display_name = excluded.display_name, status = 'open',
                last_message_at = excluded.last_message_at,
                unread_count = public.conversations.unread_count + 1, updated_at = now()
              returning id`;
            if (!conversation) throw new Error("Could not persist the WhatsApp conversation.");

            await tx`
              insert into public.messages (conversation_id, direction, channel, external_id, body, status, sent_at)
              values (${conversation["id"]}, 'in', 'whatsapp', ${item.eventId}, ${item.body}, 'delivered', ${item.sentAt})`;
            await tx`
              update public.webhook_events set processing_status = 'processed'
              where provider = ${item.provider} and external_id = ${item.eventId}`;
            return true;
          });
          if (done) stored += 1;
        }

        return Response.json({ ok: true, stored });
      },
      },
    },
  },
});
