/**
 * Server-only messaging adapters.
 *
 * Every provider implements the same small interface so the rest of the
 * app never changes when a provider is swapped or added. Secrets are
 * read from server environment variables inside the functions, never at
 * module scope and never in the browser.
 */
export interface OutgoingMessage {
  to: string;
  body: string;
  mediaUrl?: string;
}

export interface SendOutcome {
  ok: boolean;
  externalId?: string;
  error?: string;
}

export interface MessagingAdapter {
  key: string;
  label: string;
  configured(): boolean;
  send(message: OutgoingMessage): Promise<SendOutcome>;
  healthCheck(): Promise<{ ok: boolean; detail: string }>;
}

function env(name: string): string {
  return process.env[name] ?? "";
}

function digits(value: string): string {
  return value.replace(/[^\d]/g, "");
}

/** Self-hosted Evolution API (WhatsApp). Runs on the owner's own server. */
export function evolutionAdapter(): MessagingAdapter {
  const base = env("EVOLUTION_API_URL").replace(/\/+$/, "");
  const key = env("EVOLUTION_API_KEY");
  const instance = env("EVOLUTION_INSTANCE");

  return {
    key: "whatsapp_evolution",
    label: "WhatsApp (self-hosted)",
    configured: () => Boolean(base && key && instance),
    async send(message) {
      if (!base || !key || !instance) return { ok: false, error: "WhatsApp server is not set up yet." };
      try {
        const response = await fetch(`${base}/message/sendText/${instance}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: key },
          body: JSON.stringify({ number: digits(message.to), text: message.body }),
        });
        const text = await response.text();
        if (!response.ok) return { ok: false, error: `WhatsApp server said: ${response.status} ${text}` };
        let externalId: string | undefined;
        try {
          const parsed = JSON.parse(text) as { key?: { id?: string } };
          externalId = parsed.key?.id;
        } catch {
          externalId = undefined;
        }
        return externalId ? { ok: true, externalId } : { ok: true };
      } catch (cause) {
        return { ok: false, error: cause instanceof Error ? cause.message : "WhatsApp server unreachable" };
      }
    },
    async healthCheck() {
      if (!base || !key || !instance) return { ok: false, detail: "Not set up" };
      try {
        const response = await fetch(`${base}/instance/connectionState/${instance}`, {
          headers: { apikey: key },
        });
        const text = await response.text();
        return { ok: response.ok, detail: text.slice(0, 300) };
      } catch (cause) {
        return { ok: false, detail: cause instanceof Error ? cause.message : "unreachable" };
      }
    },
  };
}

/** Official WhatsApp Cloud API from Meta. Used when the business account is approved. */
export function metaCloudAdapter(): MessagingAdapter {
  const token = env("WHATSAPP_CLOUD_TOKEN");
  const phoneId = env("WHATSAPP_CLOUD_PHONE_ID");

  return {
    key: "whatsapp_meta",
    label: "WhatsApp (official Meta Cloud API)",
    configured: () => Boolean(token && phoneId),
    async send(message) {
      if (!token || !phoneId) return { ok: false, error: "Official WhatsApp is not set up yet." };
      try {
        const response = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: digits(message.to),
            type: "text",
            text: { body: message.body },
          }),
        });
        const text = await response.text();
        if (!response.ok) return { ok: false, error: `Meta said: ${response.status} ${text}` };
        let externalId: string | undefined;
        try {
          const parsed = JSON.parse(text) as { messages?: Array<{ id?: string }> };
          externalId = parsed.messages?.[0]?.id;
        } catch {
          externalId = undefined;
        }
        return externalId ? { ok: true, externalId } : { ok: true };
      } catch (cause) {
        return { ok: false, error: cause instanceof Error ? cause.message : "Meta API unreachable" };
      }
    },
    async healthCheck() {
      if (!token || !phoneId) return { ok: false, detail: "Not set up" };
      try {
        const response = await fetch(`https://graph.facebook.com/v21.0/${phoneId}?fields=display_phone_number`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return { ok: response.ok, detail: (await response.text()).slice(0, 300) };
      } catch (cause) {
        return { ok: false, detail: cause instanceof Error ? cause.message : "unreachable" };
      }
    },
  };
}

/** Picks the official Meta API first, then the self-hosted server. */
export function pickWhatsAppAdapter(): MessagingAdapter {
  const meta = metaCloudAdapter();
  if (meta.configured()) return meta;
  return evolutionAdapter();
}

export function adapterFor(channel: string): MessagingAdapter | null {
  if (channel === "whatsapp") return pickWhatsAppAdapter();
  return null;
}
