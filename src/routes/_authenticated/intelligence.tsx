import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Activity, MousePointerClick, Users, Send } from "lucide-react";

import { PageHeader } from "../../components/app-shell";
import { EmptyState } from "../../components/empty-state";
import {
  RANGE_OPTIONS,
  fetchIntelligence,
  fetchVisitorJourney,
  labelEvent,
  type RangeId,
} from "../../lib/intelligence";

export const Route = createFileRoute("/_authenticated/intelligence")({
  head: () => ({
    meta: [
      { title: "Website intelligence — SAFAR N MANZIL" },
      {
        name: "description",
        content: "Who visited the website, where they came from and what they looked at.",
      },
      { property: "og:title", content: "Website intelligence — SAFAR N MANZIL" },
      { property: "og:description", content: "Visitors, sources and actions on the website." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: IntelligencePage,
});

function timeAgo(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

function IntelligencePage() {
  const [range, setRange] = useState<RangeId>("7d");
  const [openVisitor, setOpenVisitor] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["intelligence", range],
    queryFn: () => fetchIntelligence(range),
  });

  const { data: journey = [] } = useQuery({
    queryKey: ["visitor-journey", openVisitor],
    queryFn: () => fetchVisitorJourney(openVisitor as string),
    enabled: Boolean(openVisitor),
  });

  const cards = [
    { label: "People who visited", value: data?.visitors ?? 0, icon: Users },
    { label: "Visits", value: data?.sessions ?? 0, icon: Activity },
    { label: "Actions recorded", value: data?.events ?? 0, icon: MousePointerClick },
    { label: "Enquiries sent", value: data?.enquiries ?? 0, icon: Send },
  ];

  return (
    <div>
      <PageHeader
        title="Website intelligence"
        description="Who came to the website, where they came from, and what they did."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {RANGE_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setRange(option.id)}
            className={`rounded-lg border px-3 py-1.5 text-sm transition ${
              range === option.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
              <card.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-3 font-display text-3xl font-bold text-foreground">{card.value}</p>
          </div>
        ))}
      </div>

      {!isLoading && (data?.sessions ?? 0) === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Activity}
            title="No website visits recorded yet"
            description="Once the website is live with the database details in place, every visit, click and enquiry will show here."
          />
        </div>
      ) : null}

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold">Where they came from</h2>
          <ul className="mt-4 space-y-2">
            {(data?.sources ?? []).map((row) => (
              <li key={row.label} className="flex items-center justify-between text-sm">
                <span className="capitalize text-muted-foreground">{row.label}</span>
                <span className="font-semibold">{row.count}</span>
              </li>
            ))}
            {(data?.sources ?? []).length === 0 ? (
              <li className="text-sm text-muted-foreground">Nothing yet.</li>
            ) : null}
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold">What they did most</h2>
          <ul className="mt-4 space-y-2">
            {(data?.topEvents ?? []).map((row) => (
              <li key={row.label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{labelEvent(row.label)}</span>
                <span className="font-semibold">{row.count}</span>
              </li>
            ))}
            {(data?.topEvents ?? []).length === 0 ? (
              <li className="text-sm text-muted-foreground">Nothing yet.</li>
            ) : null}
          </ul>
        </div>
      </div>

      {(data?.recentSessions ?? []).length > 0 ? (
        <div className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold">Recent visits</h2>
          <div className="mt-4 space-y-2">
            {(data?.recentSessions ?? []).map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() =>
                  setOpenVisitor(openVisitor === session.visitor_key ? null : session.visitor_key)
                }
                className="flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 px-4 py-3 text-left text-sm transition hover:border-primary/60"
              >
                <span className="font-medium">{session.landing_page ?? "/"}</span>
                <span className="text-muted-foreground">
                  {session.utm_campaign ?? session.utm_source ?? "direct"} · {session.device ?? "—"} ·{" "}
                  {timeAgo(session.started_at)}
                </span>
              </button>
            ))}
          </div>

          {openVisitor ? (
            <div className="mt-5 rounded-lg border border-primary/30 bg-secondary/20 p-4">
              <h3 className="text-sm font-semibold">What this person did</h3>
              <ol className="mt-3 space-y-2">
                {journey.map((event) => (
                  <li key={event.id} className="flex justify-between gap-3 text-sm">
                    <span>
                      {labelEvent(event.name)}
                      {event.route ? (
                        <span className="text-muted-foreground"> · {event.route}</span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-muted-foreground">{timeAgo(event.occurred_at)}</span>
                  </li>
                ))}
                {journey.length === 0 ? (
                  <li className="text-sm text-muted-foreground">No actions recorded for this visit.</li>
                ) : null}
              </ol>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
