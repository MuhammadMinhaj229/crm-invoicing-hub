import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Workflow } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { PageHeader } from "../../components/app-shell";
import { EmptyState } from "../../components/empty-state";
import {
  ACTIONS,
  TRIGGERS,
  deleteAutomation,
  fetchAutomationRuns,
  fetchAutomations,
  saveAutomation,
  setAutomationEnabled,
} from "../../lib/automation";
import { isSupabaseConfigured } from "../../lib/supabase";

export const Route = createFileRoute("/_authenticated/automations")({
  head: () => ({
    meta: [
      { title: "Automations — SAFAR N MANZIL" },
      { name: "description", content: "Rules that do the small jobs for you when something happens." },
      { property: "og:title", content: "Automations — SAFAR N MANZIL" },
      { property: "og:description", content: "When this happens, do that — and keep a record of it." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AutomationsPage,
});

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";

const EMPTY_FORM = { name: "", trigger: TRIGGERS[0].id as string, action: ACTIONS[0].id as string, message: "" };

function AutomationsPage() {
  const connected = isSupabaseConfigured();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);

  const rules = useQuery({ queryKey: ["automations"], queryFn: fetchAutomations, enabled: connected });
  const runs = useQuery({ queryKey: ["automation-runs"], queryFn: () => fetchAutomationRuns(), enabled: connected });

  const save = useMutation({
    mutationFn: () =>
      saveAutomation({
        name: form.name,
        trigger: form.trigger,
        action: form.action,
        action_config: { message: form.message },
      }),
    onSuccess: async () => {
      toast.success("Rule saved");
      setForm(EMPTY_FORM);
      setShowForm(false);
      await queryClient.invalidateQueries({ queryKey: ["automations"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not save"),
  });

  const toggle = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => setAutomationEnabled(id, enabled),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["automations"] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteAutomation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["automations"] }),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error("Give the rule a name.");
      return;
    }
    save.mutate();
  }

  if (!connected) {
    return (
      <div className="space-y-6">
        <PageHeader title="Automations" description="Small jobs that happen on their own." />
        <EmptyState
          icon={Workflow}
          title="Connect your database first"
          description="Open Settings and add your database keys to start making rules."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Automations"
        description="When something happens, do this. Every run is written down so you can check it."
        actions={
          <button
            type="button"
            onClick={() => setShowForm((value) => !value)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> New rule
          </button>
        }
      />

      {showForm ? (
        <form onSubmit={submit} className="grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-foreground">Rule name</span>
            <input
              className={inputClass}
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-foreground">When this happens</span>
            <select
              className={inputClass}
              value={form.trigger}
              onChange={(event) => setForm({ ...form, trigger: event.target.value })}
            >
              {TRIGGERS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-foreground">Do this</span>
            <select
              className={inputClass}
              value={form.action}
              onChange={(event) => setForm({ ...form, action: event.target.value })}
            >
              {ACTIONS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-foreground">Message or note</span>
            <textarea
              rows={2}
              className={inputClass}
              value={form.message}
              onChange={(event) => setForm({ ...form, message: event.target.value })}
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={save.isPending}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              Save rule
            </button>
          </div>
        </form>
      ) : null}

      {rules.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (rules.data ?? []).length === 0 ? (
        <EmptyState
          icon={Workflow}
          title="No rules yet"
          description="Make your first rule, for example: when a new lead comes in, tell the team."
        />
      ) : (
        <div className="space-y-3">
          {(rules.data ?? []).map((rule) => (
            <div
              key={rule.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div>
                <h3 className="text-sm font-semibold text-foreground">{rule.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {TRIGGERS.find((item) => item.id === rule.trigger)?.label ?? rule.trigger} →{" "}
                  {ACTIONS.find((item) => item.id === rule.action)?.label ?? rule.action}
                  {rule.last_run_at ? ` · last run ${new Date(rule.last_run_at).toLocaleString()}` : " · never run"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={(event) => toggle.mutate({ id: rule.id, enabled: event.target.checked })}
                  />
                  On
                </label>
                <button
                  type="button"
                  aria-label="Delete rule"
                  onClick={() => remove.mutate(rule.id)}
                  className="rounded-lg border border-border p-2 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Recent runs</h2>
        {(runs.data ?? []).length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nothing has run yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {(runs.data ?? []).map((run) => (
              <li key={run.id} className="flex flex-wrap justify-between gap-2 text-sm">
                <span className="text-foreground">{run.detail ?? run.status}</span>
                <span className="text-xs text-muted-foreground">
                  {run.status} · {new Date(run.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
