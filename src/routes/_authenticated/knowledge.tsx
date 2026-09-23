import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { PageHeader } from "../../components/app-shell";
import { EmptyState } from "../../components/empty-state";
import { useWorkspaceSettings } from "../../hooks/use-workspace-settings";
import {
  EMPTY_KNOWLEDGE,
  KNOWLEDGE_CATEGORIES,
  deleteKnowledge,
  fetchKnowledge,
  formatAmount,
  saveKnowledge,
  type KnowledgeInput,
  type KnowledgeRow,
} from "../../lib/knowledge";
import { isSupabaseConfigured } from "../../lib/supabase";

export const Route = createFileRoute("/_authenticated/knowledge")({
  head: () => ({
    meta: [
      { title: "Business Knowledge — SAFAR N MANZIL" },
      {
        name: "description",
        content: "One place for services, prices, areas covered, working hours, questions and policies.",
      },
      { property: "og:title", content: "Business Knowledge — SAFAR N MANZIL" },
      { property: "og:description", content: "Your services and prices written down once, used everywhere." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: KnowledgePage,
});

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";

function rowToInput(row: KnowledgeRow): KnowledgeInput {
  return {
    category: row.category,
    code: row.code ?? "",
    title: row.title,
    body: row.body ?? "",
    amount: row.amount === null ? "" : String(row.amount),
    is_public: row.is_public,
  };
}

function KnowledgePage() {
  const connected = isSupabaseConfigured();
  const queryClient = useQueryClient();
  const { settings } = useWorkspaceSettings();
  const [editing, setEditing] = useState<{ id?: string; form: KnowledgeInput } | null>(null);
  const [filter, setFilter] = useState("all");

  const entries = useQuery({ queryKey: ["knowledge"], queryFn: () => fetchKnowledge(), enabled: connected });

  const save = useMutation({
    mutationFn: () => saveKnowledge(editing!.form, editing!.id),
    onSuccess: async () => {
      toast.success("Saved");
      setEditing(null);
      await queryClient.invalidateQueries({ queryKey: ["knowledge"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not save"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteKnowledge(id),
    onSuccess: async () => {
      toast.success("Removed");
      await queryClient.invalidateQueries({ queryKey: ["knowledge"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not remove"),
  });

  const rows = (entries.data ?? []).filter((row) => filter === "all" || row.category === filter);

  function submit(event: FormEvent) {
    event.preventDefault();
    save.mutate();
  }

  if (!connected) {
    return (
      <div className="space-y-6">
        <PageHeader title="Business Knowledge" description="Your services, prices and answers in one place." />
        <EmptyState
          icon={BookOpen}
          title="Connect your database first"
          description="Open Settings and add your database keys to start writing down your services and prices."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Business Knowledge"
        description="Write a service or a price once here. The website and the team always read the same thing."
        actions={
          <button
            type="button"
            onClick={() => setEditing({ form: EMPTY_KNOWLEDGE })}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Add entry
          </button>
        }
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-full border px-3 py-1 text-xs ${filter === "all" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
        >
          All
        </button>
        {KNOWLEDGE_CATEGORIES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`rounded-full border px-3 py-1 text-xs ${filter === item.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {editing ? (
        <form onSubmit={submit} className="space-y-4 rounded-xl border border-border bg-card p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-foreground">Type</span>
              <select
                className={inputClass}
                value={editing.form.category}
                onChange={(event) =>
                  setEditing({ ...editing, form: { ...editing.form, category: event.target.value } })
                }
              >
                {KNOWLEDGE_CATEGORIES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-foreground">Short code (optional)</span>
              <input
                className={inputClass}
                value={editing.form.code}
                onChange={(event) => setEditing({ ...editing, form: { ...editing.form, code: event.target.value } })}
              />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="mb-1 block font-medium text-foreground">Title</span>
              <input
                className={inputClass}
                value={editing.form.title}
                onChange={(event) => setEditing({ ...editing, form: { ...editing.form, title: event.target.value } })}
                required
              />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="mb-1 block font-medium text-foreground">Details</span>
              <textarea
                rows={3}
                className={inputClass}
                value={editing.form.body}
                onChange={(event) => setEditing({ ...editing, form: { ...editing.form, body: event.target.value } })}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-foreground">Price (leave empty if none)</span>
              <input
                className={inputClass}
                inputMode="decimal"
                value={editing.form.amount}
                onChange={(event) => setEditing({ ...editing, form: { ...editing.form, amount: event.target.value } })}
              />
            </label>
            <label className="flex items-center gap-2 self-end text-sm">
              <input
                type="checkbox"
                checked={editing.form.is_public}
                onChange={(event) =>
                  setEditing({ ...editing, form: { ...editing.form, is_public: event.target.checked } })
                }
              />
              <span className="text-foreground">Show on the website</span>
            </label>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={save.isPending}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {entries.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Nothing written down yet"
          description="Add your first service, price or common question. Everyone in the team will then see the same answer."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((row) => (
            <article key={row.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {KNOWLEDGE_CATEGORIES.find((item) => item.id === row.category)?.label ?? row.category}
                    {row.code ? ` · ${row.code}` : ""}
                  </p>
                  <h3 className="mt-1 text-sm font-semibold text-foreground">{row.title}</h3>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    aria-label="Edit"
                    onClick={() => setEditing({ id: row.id, form: rowToInput(row) })}
                    className="rounded-lg border border-border p-2 text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Delete"
                    onClick={() => remove.mutate(row.id)}
                    className="rounded-lg border border-border p-2 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {row.body ? <p className="mt-2 text-sm text-muted-foreground">{row.body}</p> : null}
              <p className="mt-3 text-sm font-medium text-foreground">
                {formatAmount(row.amount, settings.currency, settings.locale)}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {row.is_public ? "Shown on the website" : "Team only"}
                </span>
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
