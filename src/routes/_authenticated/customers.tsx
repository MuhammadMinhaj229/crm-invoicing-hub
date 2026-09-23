import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { HeartHandshake, UserPlus, Users } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "../../components/app-shell";
import { EmptyState } from "../../components/empty-state";
import { getSupabase } from "../../lib/supabase";

export const Route = createFileRoute("/_authenticated/customers")({
  head: () => ({
    meta: [
      { title: "Customers — SAFAR N MANZIL" },
      { name: "description", content: "Leads, customer contacts and churn & retention intelligence." },
      { property: "og:title", content: "Customers — SAFAR N MANZIL" },
      { property: "og:description", content: "Leads, customer contacts and retention intelligence." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CustomersPage,
});

type Tab = "leads" | "contacts" | "churn";

const TABS: { id: Tab; label: string }[] = [
  { id: "leads", label: "Leads" },
  { id: "contacts", label: "Contacts" },
  { id: "churn", label: "Churn & Retention" },
];

interface LeadRow {
  id: string;
  name: string;
  source: string;
  service_interest: string | null;
  status: string;
  created_at: string;
}

interface ContactRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  lifecycle_status: string;
}

async function fetchLeads(): Promise<LeadRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("leads")
    .select("id, name, source, service_interest, status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return [];
  return (data ?? []) as LeadRow[];
}

async function fetchContacts(): Promise<ContactRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("contacts")
    .select("id, name, phone, email, lifecycle_status")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return [];
  return (data ?? []) as ContactRow[];
}

function LeadsTab() {
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: fetchLeads,
  });

  if (isLoading) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Loading leads…</p>;
  }
  if (leads.length === 0) {
    return (
      <EmptyState
        icon={UserPlus}
        title="No leads yet"
        description="Leads arrive here from the website form, WhatsApp, social media, referrals and manual entry — each tagged with where it came from."
      />
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Came from</th>
            <th className="px-4 py-3 font-medium">Service interest</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Added</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className="border-b border-border/60 last:border-0">
              <td className="px-4 py-3 font-medium text-foreground">{lead.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{lead.source}</td>
              <td className="px-4 py-3 text-muted-foreground">{lead.service_interest ?? "—"}</td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
                  {lead.status}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(lead.created_at).toLocaleDateString("en-IN")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ContactsTab() {
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["contacts"],
    queryFn: fetchContacts,
  });

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
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Phone</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Stage</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <tr key={contact.id} className="border-b border-border/60 last:border-0">
              <td className="px-4 py-3 font-medium text-foreground">{contact.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{contact.phone ?? "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">{contact.email ?? "—"}</td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
                  {contact.lifecycle_status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChurnTab() {
  return (
    <EmptyState
      icon={HeartHandshake}
      title="Retention intelligence activates with your first customers"
      description="For every customer: how many days since their last order, what they repeatedly need, and a follow-up prompt when they go quiet. Default inactivity threshold is 7 days — configurable per service type."
    />
  );
}

function CustomersPage() {
  const [tab, setTab] = useState<Tab>("leads");

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Leads, trusted customer contacts, and churn & retention — the full lifecycle in one place."
      />
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
    </div>
  );
}
