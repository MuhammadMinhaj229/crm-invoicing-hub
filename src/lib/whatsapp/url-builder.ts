/**
 * WHY this file exists: WhatsApp links were previously built inline wherever a
 * button needed one. Every link now goes through here so encoding, the E.164
 * cleanup and the "no number configured" case are handled in one place.
 */

export function toDigits(raw: string): string {
  return (raw ?? "").replace(/[^\d]/g, "");
}

export function toE164(raw: string): string {
  const digits = toDigits(raw);
  return digits ? `+${digits}` : "";
}

/** Returns null when no WhatsApp number is configured, so callers can hide the action. */
export function buildWhatsAppUrl(number: string, message: string): string | null {
  const digits = toDigits(number);
  if (!digits) return null;
  const text = encodeURIComponent(message.trim());
  return text ? `https://wa.me/${digits}?text=${text}` : `https://wa.me/${digits}`;
}

export function buildTelUrl(number: string): string | null {
  const e164 = toE164(number);
  return e164 ? `tel:${e164}` : null;
}

export function buildMailUrl(email: string, subject: string, body?: string): string | null {
  if (!email.trim()) return null;
  const params = new URLSearchParams({ subject });
  if (body) params.set("body", body);
  return `mailto:${email}?${params.toString()}`;
}
