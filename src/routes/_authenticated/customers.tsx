import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, HeartHandshake, Plus, Search, UserPlus, Users } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { PageHeader } from "../../components/app-shell";
import { ContactProfile } from "../../components/contact-profile";
import { EmptyState } from "../../components/empty-state";
import { useWorkspaceSettings } from "../../hooks/use-workspace-settings";
import {
  buildRetention,
  convertLeadToContact,
  createLead,
  fetchContacts,
  fetchInvoices,
  fetchLeads,
  fetchRequests,
  updateLeadStatus,
  type ContactRow,
  type LeadRow,
  type NewLeadInput,
} from "../../lib/crm";
import { isSupabaseConfigured } from "../../lib/supabase";

export const Route = createFileRoute("/_authenticated/customers")({
  head: () => ({
    meta: [
      { title: "Customers — SAFAR N MANZIL" },
      {
        name: "description",
        content: "Leads with source tracking, 360° customer contacts and retention intelligence.",
      },
      { property: "og:title", content: "Customers — SAFAR N MANZIL" },
      { property: "og:description", content: "Leads, customer contacts and retention intelligence." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CustomersPage,
});

type Tab = "leads" | "contacts" | "churn";

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";

function Tag({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "warn" | "danger" | "good" }) {
  const tones = {
    neutral: "bg-accent text-accent-foreground",
    good: "bg-primary/15 text-foreground",
    warn: "bg-secondary/40 text-foreground",
    danger: "bg-destructive/10 text-destructive",
  } as const;
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>{children}</span>
  );
}

/* ----------------------------- Leads ----------------------------- */

const EMPTY_LEAD: NewLeadInput = {
  name: "",
  phone: "",
  email: "",
  source: "",
  source_detail: "",
  service_interest: "",
  location: "",
  notes: "",
};

function LeadForm({ onDone }: { onDone: () => void }) {
  const { settings } = useWorkspaceSettings();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<NewLeadInput>({
    ...EMPTY_LEAD,
    source: settings.leadSources[0] ?? "Manual entry",
  });

  const save = useMutation({
    mutationFn: () => createLead(form),
    onSuccess: async () => {
      toast.success("Lead added");
      await queryClient.invalidateQueries({ queryKey: ["leads"] });
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
      <label className="text-sm font-medium text-foreground">
        Name
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className={`mt-1.5 ${inputClass}`}
        />
      </label>
      <label className="text-sm font-medium text-foreground">
        Phone / WhatsApp
        <input
          value={form.phone}
          placeholder="+91…"
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className={`mt-1.5 ${inputClass}`}
        />
      </label>
      <label className="text-sm font-medium text-foreground">
        Email
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className={`mt-1.5 ${inputClass}`}
        />
      </label>
      <label className="text-sm font-medium text-foreground">
        Came from
        <select
          value={form.source}
          onChange={(e) => setForm({ ...form, source: e.target.value })}
          className={`mt-1.5 ${inputClass}`}
        >
          {settings.leadSources.map((source) => (
            <option key={source} value={source}>
              {source}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium text-foreground">
        Source detail
        <input
          value={form.source_detail}
          placeholder="Instagram reel, referral name, campaign…"
          onChange={(e) => setForm({ ...form, source_detail: e.target.value })}
          className={`mt-1.5 ${inputClass}`}
        />
      </label>
      <label className="text-sm font-medium text-foreground">
        Service interest
        <select
          value={form.service_interest}
          onChange={(e) => setForm({ ...form, service_interest: e.target.value })}
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
        Location
        <input
          value={form.location}
          placeholder="Family location in India / Gulf city"
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          className={`mt-1.5 ${inputClass}`}
        />
      </label>
      <label className="text-sm font-medium text-foreground sm:col-span-2">
        Notes
        <textarea
          rows={2}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className={`mt-1.5 ${inputClass}`}
        />
      </label>
      <div className="flex gap-2 sm:col-span-2">
        <button
          type="submit"
          disabled={save.isPending}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {save.isPending ? "Saving…" : "Save lead"}
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

function LeadsTab() {
  const { settings } = useWorkspaceSettings();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");

  const { data: leads = [], isLoading } = useQuery({ queryKey: ["leads"], queryFn: fetchLeads });

  const convert = useMutation({
    mutationFn: (lead: LeadRow) => convertLeadToContact(lead),
    onSuccess: async () => {
      toast.success("Lead converted to a customer contact");
      await queryClient.invalidateQueries({ queryKey: ["leads"] });
      await queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Conversion failed"),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateLeadStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
    onError: (error) => toast.error(error instanceof Error ? error.message : "Update failed"),
  });

  const filtered = useMemo(
    () =>
      leads.filter((lead) => {
        const matchesQuery = query
          ? `${lead.name} ${lead.phone ?? ""} ${lead.email ?? ""}`
              .toLowerCase()
              .includes(query.toLowerCase())
          : true;
        const matchesSource = sourceFilter ? lead.source === sourceFilter : true;
        return matchesQuery && matchesSource;
      }),
    [leads, query, sourceFilter],
  );

  const bySource = useMemo(() => {
    const counts = new Map<string, number>();
    for (const lead of leads) counts.set(lead.source, (counts.get(lead.source) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [leads]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search leads by name, phone or email"
            className={`${inputClass} pl-9`}
          />
        </div>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="w-auto rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
        >
          <option value="">All sources</option>
          {settings.leadSources.map((source) => (
            <option key={source} value={source}>
              {source}
            </option>
          ))}
        </select>
        <button
          onClick={() => setAdding((value) => !value)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add lead
        </button>
      </div>

      {adding ? <LeadForm onDone={() => setAdding(false)} /> : null}

      {bySource.length > 0 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {bySource.map(([source, count]) => (
            <span
              key={source}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground"
            >
              {source} · {count}
            </span>
          ))}
        </div>
      ) : null}

      {isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading leads…</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title={leads.length === 0 ? "No leads yet" : "No leads match this filter"}
          description="Leads arrive from the website form, WhatsApp, social media, referrals and manual entry — each tagged with exactly where it came from."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Came from</th>
                <th className="px-4 py-3 font-medium">Interest</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Added</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr key={lead.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{lead.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {lead.phone ?? lead.email ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Tag>{lead.source}</Tag>
                    {lead.source_detail ? (
                      <p className="mt-1 text-xs text-muted-foreground">{lead.source_detail}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {lead.service_interest ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={lead.status}
                      onChange={(e) => setStatus.mutate({ id: lead.id, status: e.target.value })}
                      className="rounded-lg border border-input bg-background px-2 py-1 text-xs"
                    >
                      {settings.leadStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(lead.created_at).toLocaleDateString(settings.locale)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {lead.status === "converted" ? (
                      <Tag tone="good">Converted</Tag>
                    ) : (
                      <button
                        onClick={() => convert.mutate(lead)}
                        disabled={convert.isPending}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent disabled:opacity-50"
                      >
                        Convert <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---------------------------- Contacts --------------------------- */

function ContactsTab() {
  const { settings } = useWorkspaceSettings();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ContactRow | null>(null);

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["contacts"],
    queryFn: fetchContacts,
  });
  const { data: requests = [] } = useQuery({ queryKey: ["requests"], queryFn: fetchRequests });
  const { data: invoices = [] } = useQuery({ queryKey: ["invoices"], queryFn: fetchInvoices });

  const filtered = contacts.filter((contact) =>
    query
      ? `${contact.name} ${contact.phone ?? ""} ${contact.email ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase())
      : true,
  );

  if (isLoading) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Loading contacts…</p>;
  }
  if (contacts.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No customer contacts yet"
        description="When a lead becomes a trusted customer it converts into a contact — with the full 360° profile: addresses, requests, invoices, payments and conversations."
      />
    );
  }

  return (
    <div>
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search customers"
          className={`${inputClass} pl-9`}
        />
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Gulf base</th>
              <th className="px-4 py-3 font-medium">Stage</th>
              <th className="px-4 py-3 font-medium">Since</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((contact) => (
              <tr
                key={contact.id}
                onClick={() => setSelected(contact)}
                className="cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-accent/40"
              >
                <td className="px-4 py-3 font-medium text-foreground">{contact.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{contact.phone ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {[contact.gulf_city, contact.gulf_country].filter(Boolean).join(", ") || "—"}
                </td>
                <td className="px-4 py-3">
                  <Tag>{contact.lifecycle_status}</Tag>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(contact.created_at).toLocaleDateString(settings.locale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected ? (
        <ContactProfile
          contact={selected}
          requests={requests.filter((request) => request.contact_id === selected.id)}
          invoices={invoices.filter((invoice) => invoice.contact_id === selected.id)}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </div>
  );
}

/* ----------------------------- Churn ----------------------------- */

function ChurnTab() {
  const { settings } = useWorkspaceSettings();
  const { data: contacts = [] } = useQuery({ queryKey: ["contacts"], queryFn: fetchContacts });
  const { data: requests = [] } = useQuery({ queryKey: ["requests"], queryFn: fetchRequests });

  const rows = useMemo(
    () => buildRetention(contacts, requests, settings),
    [contacts, requests, settings],
  );
  const needsAttention = rows.filter(
    (row) => row.state === "at_risk" || row.state === "churned",
  );

  if (contacts.length === 0) {
    return (
      <EmptyState
        icon={HeartHandshake}
        title="Retention intelligence activates with your first customers"
        description={`For every customer: days since their last order, what they repeatedly need, and a follow-up prompt when they go quiet. Currently at risk after ${settings.retention.defaultInactivityDays} days, churned after ${settings.retention.churnedAfterDays} — change this in Settings → Business rules.`}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Summary label="Customers" value={rows.length} />
        <Summary
          label={`At risk (${settings.retention.defaultInactivityDays}+ days quiet)`}
          value={rows.filter((row) => row.state === "at_risk").length}
        />
        <Summary
          label={`Churn follow-up (${settings.retention.churnedAfterDays}+ days)`}
          value={rows.filter((row) => row.state === "churned").length}
        />
      </div>

      {needsAttention.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
          Everyone is active — nobody has gone quiet past your thresholds.
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((row) => (
          <article key={row.contact.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-foreground">{row.contact.name}</p>
                <p className="text-xs text-muted-foreground">
                  {row.lastOrderAt
                    ? `Last order ${new Date(row.lastOrderAt).toLocaleDateString(settings.locale)} · ${row.daysQuiet} days ago`
                    : "Never placed an order"}
                </p>
              </div>
              {row.state === "churned" ? (
                <Tag tone="danger">Churn follow-up</Tag>
              ) : row.state === "at_risk" ? (
                <Tag tone="warn">At risk</Tag>
              ) : row.state === "never_ordered" ? (
                <Tag>No orders</Tag>
              ) : (
                <Tag tone="good">Active</Tag>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {row.categoryCounts.slice(0, 4).map((entry) => (
                <span
                  key={entry.category}
                  className="rounded-full bg-accent px-2.5 py-1 text-xs text-accent-foreground"
                >
                  {entry.category} ×{entry.count}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {row.orderCount} order{row.orderCount === 1 ? "" : "s"} · usually needs{" "}
              {row.topCategory ?? "—"} · threshold {row.thresholdDays} days
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

/* ------------------------------ Page ----------------------------- */

const TABS: { id: Tab; label: string }[] = [
  { id: "leads", label: "Leads" },
  { id: "contacts", label: "Contacts" },
  { id: "churn", label: "Churn & Retention" },
];

function CustomersPage() {
  const [tab, setTab] = useState<Tab>("leads");
  const connected = isSupabaseConfigured();

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Leads with their true origin, trusted customer contacts, and retention intelligence — the full lifecycle in one place."
      />
      {!connected ? (
        <EmptyState
          icon={Users}
          title="Connect your database to start"
          description="Open Settings → Connections, paste your Supabase project URL and keys, and run the one-time setup script. Leads and customers appear here immediately after."
        />
      ) : (
        <>
          <div className="mb-5 flex gap-1 rounded-lg border border-border bg-card p-1">
            {TABS.map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors sm:flex-none sm:px-4 ${
                  tab === item.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          {tab === "leads" ? <LeadsTab /> : null}
          {tab === "contacts" ? <ContactsTab /> : null}
          {tab === "churn" ? <ChurnTab /> : null}
        </>
      )}
    </div>
  );
}
