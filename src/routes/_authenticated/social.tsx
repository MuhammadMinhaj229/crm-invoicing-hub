import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Plus, Share2, Trash2, XCircle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { PageHeader } from "../../components/app-shell";
import { EmptyState } from "../../components/empty-state";
import {
  CONNECTORS,
  checkIntegrationHealth,
  deleteSocialPost,
  fetchSocialPosts,
  saveSocialPost,
} from "../../lib/social";
import { isSupabaseConfigured } from "../../lib/supabase";

export const Route = createFileRoute("/_authenticated/social")({
  head: () => ({
    meta: [
      { title: "Social — SAFAR N MANZIL" },
      { name: "description", content: "Connect your accounts and plan posts, with honest limits shown." },
      { property: "og:title", content: "Social — SAFAR N MANZIL" },
      { property: "og:description", content: "Plan posts and see exactly what each platform allows." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SocialPage,
});

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";

function SocialPage() {
  const connected = isSupabaseConfigured();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ channel: "instagram", body: "", scheduled_for: "", media_url: "" });
  const [showForm, setShowForm] = useState(false);

  const health = useQuery({ queryKey: ["integration-health"], queryFn: checkIntegrationHealth });
  const posts = useQuery({ queryKey: ["social-posts"], queryFn: fetchSocialPosts, enabled: connected });

  const save = useMutation({
    mutationFn: () => saveSocialPost(form),
    onSuccess: async () => {
      toast.success("Post saved");
      setForm({ channel: "instagram", body: "", scheduled_for: "", media_url: "" });
      setShowForm(false);
      await queryClient.invalidateQueries({ queryKey: ["social-posts"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not save"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteSocialPost(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["social-posts"] }),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    save.mutate();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Social"
        description="Connect your accounts and plan posts. Each platform shows what it really allows."
        actions={
          connected ? (
            <button
              type="button"
              onClick={() => setShowForm((value) => !value)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              <Plus className="h-4 w-4" /> Plan a post
            </button>
          ) : null
        }
      />

      <section className="grid gap-3 md:grid-cols-2">
        {CONNECTORS.map((connector) => {
          const status = (health.data ?? []).find((item) => item.key === connector.key);
          const ready = status?.ok ?? false;
          return (
            <article key={connector.key} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold text-foreground">{connector.label}</h3>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${
                    ready ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {ready ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                  {ready ? "Connected" : "Not connected"}
                </span>
              </div>
              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">What it can do</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-foreground">
                {connector.can.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                What it cannot do
              </p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">
                {connector.cannot.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="mt-3 rounded-lg bg-muted p-3 text-xs text-muted-foreground">{connector.setup}</p>
            </article>
          );
        })}
      </section>

      {!connected ? (
        <EmptyState
          icon={Share2}
          title="Connect your database to plan posts"
          description="Open Settings and add your database keys. Then you can write and plan posts here."
        />
      ) : (
        <>
          {showForm ? (
            <form onSubmit={submit} className="grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block font-medium text-foreground">Where</span>
                <select
                  className={inputClass}
                  value={form.channel}
                  onChange={(event) => setForm({ ...form, channel: event.target.value })}
                >
                  {CONNECTORS.map((connector) => (
                    <option key={connector.key} value={connector.key}>
                      {connector.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-foreground">When</span>
                <input
                  type="datetime-local"
                  className={inputClass}
                  value={form.scheduled_for}
                  onChange={(event) => setForm({ ...form, scheduled_for: event.target.value })}
                />
              </label>
              <label className="text-sm sm:col-span-2">
                <span className="mb-1 block font-medium text-foreground">Post text</span>
                <textarea
                  rows={3}
                  className={inputClass}
                  value={form.body}
                  onChange={(event) => setForm({ ...form, body: event.target.value })}
                />
              </label>
              <label className="text-sm sm:col-span-2">
                <span className="mb-1 block font-medium text-foreground">Picture link (optional)</span>
                <input
                  className={inputClass}
                  value={form.media_url}
                  onChange={(event) => setForm({ ...form, media_url: event.target.value })}
                />
              </label>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={save.isPending}
                  className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  Save post
                </button>
              </div>
            </form>
          ) : null}

          {posts.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (posts.data ?? []).length === 0 ? (
            <EmptyState
              icon={Share2}
              title="No posts planned"
              description="Write your first post. It will be kept here until the account is connected and it can go out."
            />
          ) : (
            <div className="space-y-3">
              {(posts.data ?? []).map((post) => (
                <div key={post.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {CONNECTORS.find((item) => item.key === post.channel)?.label ?? post.channel} · {post.status}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{post.body}</p>
                      {post.scheduled_for ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Planned for {new Date(post.scheduled_for).toLocaleString()}
                        </p>
                      ) : null}
                      {post.error ? <p className="mt-1 text-xs text-destructive">{post.error}</p> : null}
                    </div>
                    <button
                      type="button"
                      aria-label="Delete post"
                      onClick={() => remove.mutate(post.id)}
                      className="rounded-lg border border-border p-2 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
