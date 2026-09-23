/**
 * Integration registry for Settings → Connections.
 *
 * Every external system the business uses is described here once:
 * which fields it needs, where the values are stored, and how to test
 * the connection. Values live in this browser's local storage (never
 * in the codebase) and, once the database is connected, are mirrored
 * into the `integrations` table so the whole team shares them.
 *
 * Secret field values are used only by server-side jobs; the browser
 * never calls external APIs with them.
 */

export interface IntegrationField {
  key: string;
  label: string;
  placeholder: string;
  secret: boolean;
  optional?: boolean;
}

export interface IntegrationDefinition {
  id: string;
  name: string;
  description: string;
  fields: IntegrationField[];
}

export const INTEGRATIONS: IntegrationDefinition[] = [
  {
    id: "supabase",
    name: "Database (Supabase)",
    description: "The single source of truth for customers, invoices, vendors and the website.",
    fields: [
      {
        key: "url",
        label: "Project URL",
        placeholder: "https://yourproject.supabase.co",
        secret: false,
      },
      {
        key: "anonKey",
        label: "Anon (public) key",
        placeholder: "eyJhbGciOi…",
        secret: true,
      },
      {
        key: "serviceRoleKey",
        label: "Service-role key (server jobs only)",
        placeholder: "eyJhbGciOi…",
        secret: true,
        optional: true,
      },
    ],
  },
  {
    id: "whatsapp",
    name: "WhatsApp (Evolution API)",
    description: "Self-hosted WhatsApp Web engine: QR pairing, inbox, quick replies, broadcasts.",
    fields: [
      {
        key: "baseUrl",
        label: "Server URL",
        placeholder: "https://wa.yourdomain.com",
        secret: false,
      },
      {
        key: "apiKey",
        label: "API key",
        placeholder: "Global or instance API key",
        secret: true,
      },
      {
        key: "instance",
        label: "Instance name",
        placeholder: "safar",
        secret: false,
        optional: true,
      },
    ],
  },
  {
    id: "invoify",
    name: "Safar Invoify",
    description: "Professional invoice generator, linked to customers and service requests.",
    fields: [
      {
        key: "baseUrl",
        label: "Invoify URL",
        placeholder: "https://invoice.yourdomain.com",
        secret: false,
      },
      {
        key: "syncKey",
        label: "Sync key",
        placeholder: "Shared secret for invoice sync",
        secret: true,
        optional: true,
      },
    ],
  },
  {
    id: "social",
    name: "Social Media Scheduler",
    description: "Buffer-style scheduled posting across Instagram, Facebook, LinkedIn and X.",
    fields: [
      {
        key: "baseUrl",
        label: "Scheduler URL",
        placeholder: "https://social.yourdomain.com",
        secret: false,
      },
      {
        key: "apiKey",
        label: "API key",
        placeholder: "Scheduler API key",
        secret: true,
        optional: true,
      },
    ],
  },
  {
    id: "finance",
    name: "Finance & Investments",
    description: "Cash flow, expenses, capital investments and provider payouts ledger.",
    fields: [
      {
        key: "baseUrl",
        label: "Finance URL (optional external ledger)",
        placeholder: "https://finance.yourdomain.com",
        secret: false,
        optional: true,
      },
      {
        key: "apiKey",
        label: "API key",
        placeholder: "Ledger API key",
        secret: true,
        optional: true,
      },
    ],
  },
];

const STORAGE_KEY = "safar.integrations.config";

type IntegrationValues = Record<string, string>;

function readAll(): Record<string, IntegrationValues> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<
      string,
      IntegrationValues
    >;
  } catch {
    return {};
  }
}

export function getIntegrationValues(id: string): IntegrationValues {
  return readAll()[id] ?? {};
}

export function saveIntegrationValues(id: string, values: IntegrationValues): void {
  const all = readAll();
  all[id] = values;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function removeIntegrationValues(id: string): void {
  const all = readAll();
  delete all[id];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function isIntegrationConfigured(definition: IntegrationDefinition): boolean {
  const values = getIntegrationValues(definition.id);
  const required = definition.fields.filter((field) => !field.optional);
  const requiredOk = required.every((field) => Boolean(values[field.key]?.trim()));
  // An integration whose fields are all optional (e.g. finance) still
  // needs at least one value filled before it counts as configured.
  const anyFilled = definition.fields.some((field) => Boolean(values[field.key]?.trim()));
  return requiredOk && anyFilled;
}

/** Generic reachability probe for non-database integrations. */
export async function testHttpEndpoint(
  url: string,
  apiKey?: string,
): Promise<{ ok: boolean; latencyMs: number; message: string }> {
  const started = performance.now();
  try {
    const response = await fetch(url.replace(/\/+$/, ""), {
      method: "GET",
      headers: apiKey ? { apikey: apiKey, Authorization: `Bearer ${apiKey}` } : {},
      mode: "cors",
    });
    const latencyMs = Math.round(performance.now() - started);
    return {
      ok: response.status < 500,
      latencyMs,
      message:
        response.status < 500
          ? `Reachable (${response.status}) in ${latencyMs} ms`
          : `Server error ${response.status}`,
    };
  } catch {
    return {
      ok: false,
      latencyMs: Math.round(performance.now() - started),
      message: "Unreachable — check the URL and that the service is running",
    };
  }
}
