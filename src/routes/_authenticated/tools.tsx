import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  CalendarClock,
  ExternalLink,
  FileText,
  MessageCircle,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { PageHeader } from "../../components/app-shell";
import { getToolUrl } from "../../lib/connections";

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
  /** Matches the connection id in Settings → Connections, when the tool is an external link. */
  connectionId?: string;
  /** Section inside the console, when the tool lives here. */
  internalPath?: "/intelligence";
  name: string;
  description: string;
  icon: LucideIcon;
}

const TOOLS: ToolCard[] = [
  {
    id: "invoify",
    connectionId: "invoify",
    name: "Safar Invoify",
    description:
      "Generate professional invoices with the customer and service request pre-filled.",
    icon: FileText,
  },
  {
    id: "social",
    connectionId: "social",
    name: "Social Media Scheduler",
    description:
      "Buffer-style calendar for scheduled posting across Instagram, Facebook, LinkedIn and X.",
    icon: CalendarClock,
  },
  {
    id: "bi",
    internalPath: "/intelligence",
    name: "Business Intelligence",
    description:
      "Every number in the CRM as simple, readable charts — demand, repeats, revenue curves.",
    icon: BarChart3,
  },
  {
    id: "finance",
    connectionId: "finance",
    name: "Finance & Investments",
    description:
      "Cash flow, operating expenses, capital investments and provider payouts in one ledger.",
    icon: Wallet,
  },
  {
    id: "whatsapp",
    connectionId: "whatsapp",
    name: "WhatsApp Toolbox",
    description:
      "QR session pairing, quick-reply macros and paced broadcast queues — no Meta API needed.",
    icon: MessageCircle,
  },
];

function ToolAction({ tool }: { tool: ToolCard }) {
  if (tool.internalPath) {
    return (
      <Link
        to={tool.internalPath}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        Open
      </Link>
    );
  }

  const url = tool.connectionId ? getToolUrl(tool.connectionId) : "";
  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        Open tool <ExternalLink className="h-3.5 w-3.5" />
      </a>
    );
  }

  return (
    <Link
      to="/settings"
      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
    >
      Add the link in Settings
    </Link>
  );
}

function ToolsPage() {
  return (
    <div>
      <PageHeader
        title="Tools"
        description="Paste each tool's web address once in Settings → Connections, and the Open button here takes you straight to it."
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
            <div className="mt-4">
              <ToolAction tool={tool} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
