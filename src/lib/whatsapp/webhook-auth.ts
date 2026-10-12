/**
 * Authentication helpers for incoming WhatsApp webhooks.
 * Meta signs the raw request body with HMAC-SHA256. Evolution uses a configured
 * shared-secret header. Missing configuration always fails closed.
 */
export type IncomingWebhookProvider = "meta" | "evolution" | "unknown";

export function constantTimeStringEqual(left: string, right: string): boolean {
  const encoder = new TextEncoder();
  const a = encoder.encode(left);
  const b = encoder.encode(right);
  let mismatch = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    mismatch |= (a[index] ?? 0) ^ (b[index] ?? 0);
  }
  return mismatch === 0;
}

export function identifyIncomingWebhookProvider(payload: unknown): IncomingWebhookProvider {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) return "unknown";
  const body = payload as Record<string, unknown>;
  if (body["object"] === "whatsapp_business_account" || Array.isArray(body["entry"])) return "meta";
  if (typeof body["event"] === "string" && body["data"] !== null && typeof body["data"] === "object") {
    return "evolution";
  }
  return "unknown";
}

export async function verifyMetaWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string,
): Promise<boolean> {
  if (!appSecret || !signatureHeader || !/^sha256=[a-f0-9]{64}$/i.test(signatureHeader)) return false;
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(appSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
    const digest = Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
    return constantTimeStringEqual("sha256=" + digest, signatureHeader.toLowerCase());
  } catch {
    return false;
  }
}
