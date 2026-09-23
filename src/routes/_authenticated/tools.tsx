import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart3,
  CalendarClock,
  FileText,
  MessageCircle,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { PageHeader } from "../../components/app-shell";

export const Route = createFileRoute("/_authenticated/tools")({
  head: () => ({
    meta: [
      { title: "Tools — SAFAR N MANZIL" },
      { name: "description", content: "Professional tools: invoicing, social scheduling, business intelligence, finance and WhatsApp." },
      { property: "og:title", content: "Tools — SAFAR N MANZIL" },
      { property: "og:description", content: "Invoicing, scheduling, BI, finance and WhatsApp tools." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ToolsPage,
});

interface ToolCard {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  status: string;
}

const TOOLS: ToolCard[] = [
  {
    id: "invoify",
    name: "Safar Invoify",
    description:
      "Generate professional invoices with the customer and service request pre-filled.",
    icon: FileText,
    status: "Connect in Settings",
  },
  {
    id: "social",
    name: "Social Media Scheduler",
    description:
      "Buffer-style calendar for scheduled posting across Instagram, Facebook, LinkedIn and X.",
    icon: CalendarClock,
    status: "Connect in Settings",
  },
  {
    id: "bi",
    name: "Business Intelligence",
    description:
      "Every number in the CRM as simple, readable charts — demand, repeats, revenue curves.",
    icon: BarChart3,
    status: "Activates with your data",
  },
  {
    id: "finance",
    name: "Finance & Investments",
    description:
      "Cash flow, operating expenses, capital investments and provider payouts in one ledger.",
    icon: Wallet,
    status: "Connect in Settings",
  },
  {
    id: "whatsapp",
    name: "WhatsApp Toolbox",
    description:
      "QR session pairing, quick-reply macros and paced broadcast queues — no Meta API needed.",
    icon: MessageCircle,
    status: "Connect in Settings",
  },
];

function ToolsPage() {
  return (
    <div>
      <PageHeader
        title="Tools"
        description="The professional toolkit. Connect each tool once in Settings → Connections and it lights up here."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {TOOLS.map((tool) => (
          <div
            key={tool.id}
            className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                <tool.icon className="h-5 w-5 text-accent-foreground" />
              </div>
              <h3 className="font-display text-base font-semibold text-foreground">
                {tool.name}
              </h3>
            </div>
            <p className="mt-3 flex-1 text-sm text-muted-foreground">{tool.description}</p>
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {tool.status}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
