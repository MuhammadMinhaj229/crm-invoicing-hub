/**
 * Team members and section access.
 *
 * Anyone can create a sign-in account, but a new account sees nothing
 * until the workspace owner adds that email here and ticks the sections
 * it may open. Owners (role "admin") always see everything.
 *
 * Stored in this browser and, once the database is connected, mirrored
 * into `app_settings` under the key "team" so the whole team shares it.
 */
import { isOwnerEmail } from "./admin";
import { getSupabase } from "./supabase";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member";
  /** Route ids this member may open, e.g. "/dashboard". Ignored for admins. */
  sections: string[];
}

/** Every part of the console that access can be granted to. */
export const ACCESS_SECTIONS: { id: string; label: string; description: string }[] = [
  { id: "/dashboard", label: "Dashboard", description: "Daily overview numbers" },
  { id: "/website", label: "Website", description: "Pages, content and enquiries" },
  { id: "/builder", label: "Page builder", description: "Edit and publish the website" },
  { id: "/customers", label: "Customers", description: "Leads, contacts and history" },
  { id: "/inbox", label: "Inbox", description: "WhatsApp and website messages" },
  { id: "/operations", label: "Service Requests", description: "Jobs, tasks and delivery" },
  { id: "/intelligence", label: "Website Intelligence", description: "Visitors and behaviour" },
  { id: "/finance", label: "Finance", description: "Money in, money out, payouts" },
  { id: "/vendors", label: "Vendors & Partners", description: "Suppliers and partners" },
  { id: "/knowledge", label: "Business Knowledge", description: "Notes and answers" },
  { id: "/automations", label: "Automations", description: "Automatic follow-ups" },
  { id: "/social", label: "Social", description: "Posts and scheduling" },
  { id: "/tools", label: "Tools", description: "Invoicing and connected tools" },
  { id: "/settings", label: "Settings", description: "Connections, team and rules" },
];

const STORAGE_KEY = "safar.team.members";
const listeners = new Set<() => void>();

let cache: TeamMember[] | null = null;

function normalize(value: unknown): TeamMember[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object")
    .map((row) => ({
      id: String(row["id"] ?? crypto.randomUUID()),
      name: String(row["name"] ?? ""),
      email: String(row["email"] ?? "").trim().toLowerCase(),
      role: (row["role"] === "admin" ? "admin" : "member") as TeamMember["role"],
      sections: Array.isArray(row["sections"]) ? (row["sections"] as string[]).map(String) : [],
    }))
    .filter((member) => member.email.length > 0);
}

export function getTeam(): TeamMember[] {
  if (cache) return cache;
  if (typeof window === "undefined") return [];
  try {
    cache = normalize(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]"));
  } catch {
    cache = [];
  }
  return cache;
}

export function saveTeamLocal(members: TeamMember[]): void {
  cache = members;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
  }
  listeners.forEach((listener) => listener());
}

export function onTeamChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Loads the shared team list when the database is connected. */
export async function loadSharedTeam(): Promise<TeamMember[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "team")
    .maybeSingle();
  if (error || !data) return null;
  const members = normalize((data as { value?: unknown }).value);
  saveTeamLocal(members);
  return members;
}

/** Saves the team list for everyone. Falls back to this device when offline. */
export async function saveSharedTeam(members: TeamMember[]): Promise<"cloud" | "local"> {
  saveTeamLocal(members);
  const supabase = getSupabase();
  if (!supabase) return "local";
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return "local";
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: "team", value: members, updated_by: userData.user.id }, { onConflict: "key" });
  if (error) throw new Error(error.message);
  return "cloud";
}

/**
 * Which sections this email may open.
 * `null` means full access (owner, or nobody has been restricted yet).
 */
export function allowedSectionsFor(
  email: string | null | undefined,
  members: TeamMember[],
): string[] | null {
  if (!email) return null;
  if (isOwnerEmail(email)) return null;
  const member = members.find((row) => row.email === email.trim().toLowerCase());
  if (!member) return members.length ? [] : null;
  if (member.role === "admin") return null;
  return member.sections;
}
