import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Plus } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { PageHeader } from "../../components/app-shell";
import { EmptyState } from "../../components/empty-state";
import { useWorkspaceSettings } from "../../hooks/use-workspace-settings";
import { fetchContacts } from "../../lib/crm";
import {
  EMPTY_REQUEST,
  REQUEST_PRIORITIES,
  REQUEST_STATUSES,
  createServiceRequest,
  fetchServiceRequests,
  updateServiceRequest,
  type NewRequestInput,
} from "../../lib/operations";
import { fetchProviders } from "../../lib/providers";
import { isSupabaseConfigured } from "../../lib/supabase";

export const Route = createFileRoute("/_authenticated/operations")({
  head: () => ({
    meta: [
      { title: "Service Requests — SAFAR N MANZIL" },
      {
        name: "description",
        content:
          "Work orders from request to completion: assign a verified serviceman, track status, close the loop.",
      },
      { property: "og:title", content: "Service Requests — SAFAR N MANZIL" },
      { property: "og:description", content: "Work orders from request to completion." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OperationsPage,
});

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";

function RequestForm({
  contacts,
  providers,
  onDone,
}: {
  contacts: { id: string; name: string }[];
  providers: { id: string; name: string }[];
  onDone: () => void;
}) {
  const { settings } = useWorkspaceSettings();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<NewRequestInput>(EMPTY_REQUEST);

  const save = useMutation({
    mutationFn: () => createServiceRequest(form),
    onSuccess: async () => {
      toast.success("Service request created");
      await queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      await queryClient.invalidateQueries({ queryKey: ["requests"] });
      onDone();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not save"),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    save.mutate();
  }

  return (
    <form
      onSubmit={submit}
      className="mb-5 grid gap-4 rounded-xl border border-border bg-card p-5 shadow-sm sm:grid-cols-2"
    >
      <label className="text-sm font-medium text-foreground sm:col-span-2">
        What needs to be done
        <input
          required
          value={form.title}
          placeholder="AC servicing at parents' home, Hyderabad"
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className={`mt-1.5 ${inputClass}`}
        />
      </label>
      <label className="text-sm font-medium text-foreground">
        Customer
        <select
          required
          value={form.contact_id}
          onChange={(e) => setForm({ ...form, contact_id: e.target.value })}
          className={`mt-1.5 ${inputClass}`}
        >
          <option value="">Select a customer</option>
          {contacts.map((contact) => (
            <option key={contact.id} value={contact.id}>
              {contact.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium text-foreground">
        Service category
        <select
          value={form.service_category}
          onChange={(e) => setForm({ ...form, service_category: e.target.value })}
          className={`mt-1.5 ${inputClass}`}
        >
          <option value="">Not specified</option>
          {settings.serviceCategories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium text-foreground">
        Assign serviceman / partner
        <select
          value={form.assigned_provider_id}
          onChange={(e) => setForm({ ...form, assigned_provider_id: e.target.value })}
          className={`mt-1.5 ${inputClass}`}
        >
          <option value="">Unassigned for now</option>
          {providers.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium text-foreground">
        Priority
        <select
          value={form.priority}
          onChange={(e) => setForm({ ...form, priority: e.target.value })}
          className={`mt-1.5 ${inputClass}`}
        >
          {REQUEST_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium text-foreground sm:col-span-2">
        Details
        <textarea
          rows={3}
          value={form.description}
          placeholder="Address, timing, who to contact locally, what the family expects…"
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className={`mt-1.5 ${inputClass}`}
        />
      </label>
      <div className="flex gap-2 sm:col-span-2">
        <button
          type="submit"
          disabled={save.isPending}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {save.isPending ? "Creating…" : "Create request"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function OperationsPage() {
  const { settings } = useWorkspaceSettings();
  const queryClient = useQueryClient();
  const connected = isSupabaseConfigured();
  const [adding, setAdding] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["service-requests"],
    queryFn: fetchServiceRequests,
    enabled: connected,
  });
  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts"],
    queryFn: fetchContacts,
    enabled: connected,
  });
  const { data: providers = [] } = useQuery({
    queryKey: ["providers"],
    queryFn: fetchProviders,
    enabled: connected,
  });

  const contactName = useMemo(
    () => new Map(contacts.map((contact) => [contact.id, contact.name])),
    [contacts],
  );
  const providerName = useMemo(
    () => new Map(providers.map((provider) => [provider.id, provider.name])),
    [providers],
  );

  const update = useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<{ status: string; priority: string; assigned_provider_id: string | null }>;
    }) => updateServiceRequest(id, patch),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      await queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not update"),
  });

  const filtered = statusFilter
    ? requests.filter((request) => request.status === statusFilter)
    : requests;

  if (!connected) {
    return (
      <div>
        <PageHeader
          title="Service Requests"
          description="Every job from request to completion — assigned to a verified serviceman and tracked to the end."
        />
        <EmptyState
          icon={ClipboardList}
          title="Connect your database to start"
          description="Open Settings → Connections, paste your project URL and keys, and run the one-time setup script."
        />
      </div>
    );
  }

  const openCount = requests.filter(
    (request) => request.status !== "completed" && request.status !== "cancelled",
  ).length;

  return (
    <div>
      <PageHeader
        title="Service Requests"
        description="Every job from request to completion — assigned to a verified serviceman and tracked to the end."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground">
          {openCount} open
        </span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
        >
          <option value="">All statuses</option>
          {REQUEST_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <button
          onClick={() => setAdding((value) => !value)}
          className="ml-auto inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New request
        </button>
      </div>

      {adding ? (
        <RequestForm contacts={contacts} providers={providers} onDone={() => setAdding(false)} />
      ) : null}

      {isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading requests…</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={requests.length === 0 ? "No service requests yet" : "Nothing matches this filter"}
          description="Create a request for a customer, assign the right serviceman from your directory, and track it through to completion."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((request) => (
            <article
              key={request.id}
              className="rounded-xl border border-border bg-card p-4 md:flex md:items-start md:justify-between md:gap-4"
            >
              <div className="min-w-0">
                <p className="font-medium text-foreground">{request.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {request.contact_id ? (contactName.get(request.contact_id) ?? "Unknown customer") : "No customer"}
                  {" · "}
                  {request.service_category ?? "Uncategorised"}
                  {" · raised "}
                  {new Date(request.created_at).toLocaleDateString(settings.locale)}
                  {request.completed_at
                    ? ` · completed ${new Date(request.completed_at).toLocaleDateString(settings.locale)}`
                    : ""}
                </p>
                {request.description ? (
                  <p className="mt-2 text-sm text-muted-foreground">{request.description}</p>
                ) : null}
                <p className="mt-2 text-xs text-muted-foreground">
                  Assigned to{" "}
                  <span className="font-medium text-foreground">
                    {request.assigned_provider_id
                      ? (providerName.get(request.assigned_provider_id) ?? "Removed partner")
                      : "nobody yet"}
                  </span>
                </p>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 md:mt-0 md:shrink-0">
                <select
                  value={request.assigned_provider_id ?? ""}
                  onChange={(e) =>
                    update.mutate({
                      id: request.id,
                      patch: { assigned_provider_id: e.target.value || null },
                    })
                  }
                  className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs"
                >
                  <option value="">Unassigned</option>
                  {providers.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
                <select
                  value={request.priority}
                  onChange={(e) =>
                    update.mutate({ id: request.id, patch: { priority: e.target.value } })
                  }
                  className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs"
                >
                  {REQUEST_PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
                <select
                  value={request.status}
                  onChange={(e) =>
                    update.mutate({ id: request.id, patch: { status: e.target.value } })
                  }
                  className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs font-medium"
                >
                  {REQUEST_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
