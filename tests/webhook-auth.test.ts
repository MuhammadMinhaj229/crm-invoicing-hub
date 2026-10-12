import { describe, expect, test } from "bun:test";
import {
  constantTimeStringEqual,
  identifyIncomingWebhookProvider,
  verifyMetaWebhookSignature,
} from "../src/lib/whatsapp/webhook-auth";

describe("incoming webhook authentication", () => {
  test("compares complete shared-secret strings", () => {
    expect(constantTimeStringEqual("same-secret", "same-secret")).toBe(true);
    expect(constantTimeStringEqual("same-secret", "same-secret-other")).toBe(false);
    expect(constantTimeStringEqual("", "")).toBe(true);
  });

  test("identifies known providers and rejects unknown payload shapes", () => {
    expect(identifyIncomingWebhookProvider({ object: "whatsapp_business_account", entry: [] })).toBe("meta");
    expect(identifyIncomingWebhookProvider({ event: "messages.upsert", data: {} })).toBe("evolution");
    expect(identifyIncomingWebhookProvider(null)).toBe("unknown");
    expect(identifyIncomingWebhookProvider({ arbitrary: true })).toBe("unknown");
  });

  test("validates Meta HMAC signatures against the raw request body", async () => {
    const secret = "test-only-meta-app-secret";
    const body = '{"object":"whatsapp_business_account","entry":[]}';
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
    const hex = Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
    const header = "sha256=" + hex;
    expect(await verifyMetaWebhookSignature(body, header, secret)).toBe(true);
    expect(await verifyMetaWebhookSignature(body + " ", header, secret)).toBe(false);
    expect(await verifyMetaWebhookSignature(body, header, "")).toBe(false);
    expect(await verifyMetaWebhookSignature(body, null, secret)).toBe(false);
  });
});
