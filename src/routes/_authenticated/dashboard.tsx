import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, IndianRupee, MessageSquareWarning, Timer } from "lucide-react";

import { PageHeader } from "../../components/app-shell";
import { getSupabase } from "../../lib/supabase";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — SAFAR N MANZIL" },
      { name: "description", content: "Daily operational pulse: tasks, handoffs, revenue and inquiries." },
      { property: "og:title", content: "Dashboard — SAFAR N MANZIL" },
      { property: "og:description", content: "Daily operational pulse of the business." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardPage,
});

interface DashboardStats {
  activeRequests: number;
  pendingInquiries: number;
  todayRevenue: number;
  urgentHandoffs: number;
}

async function fetchStats(): Promise<DashboardStats> {
  const supabase = getSupabase();
  if (!supabase) {
    return { activeRequests: 0, pendingInquiries: 0, todayRevenue: 0, urgentHandoffs: 0 };
  }
  const empty = { count: 0 };
  const [requests, inquiries, handoffs] = await Promise.all([
    supabase
      .from("service_requests")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "in_progress"])
      .then((r) => (r.error ? empty : r)),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("status", "new")
      .then((r) => (r.error ? empty : r)),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("priority", "urgent")
      .eq("status", "open")
      .then((r) => (r.error ? empty : r)),
  ]);
  const today = new Date().toISOString().slice(0, 10);
  const { data: payments } = await supabase
    .from("payments")
    .select("amount")
    .gte("paid_at", `${today}T00:00:00Z`);
  const todayRevenue = (payments ?? []).reduce(
    (sum, row) => sum + Number((row as { amount: number }).amount),
    0,
  );
  return {
    activeRequests: requests.count ?? 0,
    pendingInquiries: inquiries.count ?? 0,
    todayRevenue,
    urgentHandoffs: handoffs.count ?? 0,
  };
}

const CARDS = [
  {
    key: "activeRequests",
    label: "Active service requests",
    icon: ClipboardList,
    hint: "Open and in-progress work orders",
  },
  {
    key: "pendingInquiries",
    label: "Pending inquiries",
    icon: MessageSquareWarning,
    hint: "New leads waiting for a first reply",
  },
  {
    key: "todayRevenue",
    label: "Today's revenue",
    icon: IndianRupee,
    hint: "Payments received today",
  },
  {
    key: "urgentHandoffs",
    label: "Urgent handoffs",
    icon: Timer,
    hint: "Tasks marked urgent and still open",
  },
] as const;

function DashboardPage() {
  const { data } = useQuery({ queryKey: ["dashboard-stats"], queryFn: fetchStats });

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="The daily pulse — nothing more, nothing less."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CARDS.map((card) => {
          const value = data?.[card.key] ?? 0;
          return (
            <div
              key={card.key}
              className="rounded-xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                <card.icon className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-3 font-display text-3xl font-bold text-foreground">
                {card.key === "todayRevenue" ? `₹${value.toLocaleString("en-IN")}` : value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {value === 0 ? "Nothing right now" : card.hint}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
