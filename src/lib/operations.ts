/** Service request (work order) data access. */
import { getSupabase } from "./supabase";

export const REQUEST_STATUSES = [
  "open",
  "in_progress",
  "waiting",
  "completed",
  "cancelled",
] as const;
export const REQUEST_PRIORITIES = ["low", "normal", "high", "urgent"] as const;

export interface ServiceRequestRow {
  id: string;
  contact_id: string | null;
  title: string;
  description: string | null;
  service_category: string | null;
  status: string;
  priority: string;
  assigned_provider_id: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface NewRequestInput {
  contact_id: string;
  title: string;
  description: string;
  service_category: string;
  priority: string;
  assigned_provider_id: string;
}

export const EMPTY_REQUEST: NewRequestInput = {
  contact_id: "",
  title: "",
  description: "",
  service_category: "",
  priority: "normal",
  assigned_provider_id: "",
};

function client() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Connect your database in Settings first.");
  return supabase;
}

export async function fetchServiceRequests(): Promise<ServiceRequestRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("service_requests")
    .select(
      "id, contact_id, title, description, service_category, status, priority, assigned_provider_id, created_at, completed_at",
    )
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return (data ?? []) as ServiceRequestRow[];
}

export async function createServiceRequest(input: NewRequestInput): Promise<void> {
  const supabase = client();
  const { error } = await supabase.from("service_requests").insert({
    contact_id: input.contact_id || null,
    title: input.title.trim(),
    description: input.description.trim() || null,
    service_category: input.service_category || null,
    priority: input.priority,
    assigned_provider_id: input.assigned_provider_id || null,
    status: "open",
  });
  if (error) throw new Error(error.message);
}

export async function updateServiceRequest(
  id: string,
  patch: Partial<{ status: string; priority: string; assigned_provider_id: string | null }>,
): Promise<void> {
  const supabase = client();
  const payload: Record<string, unknown> = { ...patch, updated_at: new Date().toISOString() };
  if (patch.status === "completed") payload['completed_at'] = new Date().toISOString();
  if (patch.status && patch.status !== "completed") payload['completed_at'] = null;
  const { error } = await supabase.from("service_requests").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
}
