import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Globe, History, RotateCcw, Save, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "../../components/app-shell";
import { EmptyState } from "../../components/empty-state";
import {
  SECTION_DEFS,
  defaultContent,
  fetchRevisions,
  fetchSectionRows,
  publishSection,
  saveDraft,
  unpublishSection,
  type FieldDef,
  type SectionContent,
} from "../../lib/cms";
import { isSupabaseConfigured } from "../../lib/supabase";

export const Route = createFileRoute("/_authenticated/website")({
  head: () => ({
    meta: [
      { title: "Website — SAFAR N MANZIL" },
      {
        name: "description",
        content: "Website control desk: edit every section of the public site, draft, publish, roll back.",
      },
      { property: "og:title", content: "Website — SAFAR N MANZIL" },
      { property: "og:description", content: "Structured section editor with draft, publish and rollback." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WebsitePage,
});

const fieldClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";

function TagsField({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  return (
    <div className="mt-1.5">
      <div className="flex flex-wrap gap-1.5">
        {value.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs text-accent-foreground"
          >
            {item}
            <button
              type="button"
              onClick={() => onChange(value.filter((_, i) => i !== index))}
              className="text-muted-foreground hover:text-foreground"
              aria-label={`Remove ${item}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (draft.trim()) onChange([...value, draft.trim()]);
              setDraft("");
            }
          }}
          placeholder="Type and press Enter"
          className={fieldClass}
        />
      </div>
    </div>
  );
}

function ListField({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: Record<string, string>[];
  onChange: (next: Record<string, string>[]) => void;
}) {
  const itemFields = field.itemFields ?? [];
  const blank = Object.fromEntries(itemFields.map((item) => [item.key, ""]));

  return (
    <div className="mt-1.5 space-y-3">
      {value.map((item, index) => (
        <div key={index} className="rounded-xl border border-border bg-background p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {field.itemLabel ?? "Item"} {index + 1}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => {
                  const next = [...value];
                  const [row] = next.splice(index, 1);
                  next.splice(index - 1, 0, row!);
                  onChange(next);
                }}
                className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                disabled={index === value.length - 1}
                onClick={() => {
                  const next = [...value];
                  const [row] = next.splice(index, 1);
                  next.splice(index + 1, 0, row!);
                  onChange(next);
                }}
                className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent disabled:opacity-30"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                className="rounded px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
              >
                Remove
              </button>
            </div>
          </div>
          <div className="grid gap-3">
            {itemFields.map((itemField) => (
              <label key={itemField.key} className="text-xs font-medium text-muted-foreground">
                {itemField.label}
                {itemField.type === "textarea" ? (
                  <textarea
                    rows={2}
                    value={item[itemField.key] ?? ""}
                    onChange={(e) => {
                      const next = [...value];
                      next[index] = { ...item, [itemField.key]: e.target.value };
                      onChange(next);
                    }}
                    className={`mt-1 ${fieldClass}`}
                  />
                ) : (
                  <input
                    value={item[itemField.key] ?? ""}
                    onChange={(e) => {
                      const next = [...value];
                      next[index] = { ...item, [itemField.key]: e.target.value };
                      onChange(next);
                    }}
                    className={`mt-1 ${fieldClass}`}
                  />
                )}
              </label>
            ))}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, blank])}
        className="rounded-lg border border-dashed border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary"
      >
        + Add {field.itemLabel?.toLowerCase() ?? "item"}
      </button>
    </div>
  );
}

function SectionEditor({
  sectionKey,
  initial,
  sectionId,
  published,
  onSaved,
}: {
  sectionKey: string;
  initial: SectionContent;
  sectionId: string | null;
  published: boolean;
  onSaved: () => void;
}) {
  const def = SECTION_DEFS.find((item) => item.key === sectionKey)!;
  const [content, setContent] = useState<SectionContent>(initial);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    setContent(initial);
  }, [initial, sectionKey]);

  const { data: revisions = [] } = useQuery({
    queryKey: ["cms-revisions", sectionId],
    queryFn: () => fetchRevisions(sectionId!),
    enabled: Boolean(sectionId) && showHistory,
  });

  const save = useMutation({
    mutationFn: () => saveDraft(sectionKey, content),
    onSuccess: () => {
      toast.success("Draft saved");
      onSaved();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not save"),
  });

  const publish = useMutation({
    mutationFn: () => publishSection(sectionKey, content),
    onSuccess: () => {
      toast.success("Published to the live site");
      onSaved();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not publish"),
  });

  const takeDown = useMutation({
    mutationFn: () => unpublishSection(sectionKey),
    onSuccess: () => {
      toast.success("Section taken off the live site");
      onSaved();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not update"),
  });

  function set(key: string, value: unknown) {
    setContent((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">{def.label}</h2>
          <p className="text-sm text-muted-foreground">{def.description}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            published ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
          }`}
        >
          {published ? "Live" : "Draft only"}
        </span>
      </div>

      <div className="grid gap-4">
        {def.fields.map((field) => (
          <label key={field.key} className="text-sm font-medium text-foreground">
            {field.label}
            {field.type === "textarea" ? (
              <textarea
                rows={3}
                value={(content[field.key] as string) ?? ""}
                onChange={(e) => set(field.key, e.target.value)}
                className={`mt-1.5 ${fieldClass}`}
              />
            ) : field.type === "tags" ? (
              <TagsField
                value={(content[field.key] as string[]) ?? []}
                onChange={(next) => set(field.key, next)}
              />
            ) : field.type === "list" ? (
              <ListField
                field={field}
                value={(content[field.key] as Record<string, string>[]) ?? []}
                onChange={(next) => set(field.key, next)}
              />
            ) : (
              <input
                value={(content[field.key] as string) ?? ""}
                onChange={(e) => set(field.key, e.target.value)}
                className={`mt-1.5 ${fieldClass}`}
              />
            )}
          </label>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> Save draft
        </button>
        <button
          onClick={() => publish.mutate()}
          disabled={publish.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          <Upload className="h-4 w-4" /> Publish
        </button>
        <button
          onClick={() => setContent(defaultContent(sectionKey))}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent"
        >
          <RotateCcw className="h-4 w-4" /> Reset to default copy
        </button>
        {sectionId ? (
          <button
            onClick={() => setShowHistory((value) => !value)}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent"
          >
            <History className="h-4 w-4" /> History
          </button>
        ) : null}
        {published ? (
          <button
            onClick={() => takeDown.mutate()}
            className="ml-auto rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10"
          >
            Take off site
          </button>
        ) : null}
      </div>

      {showHistory ? (
        <div className="mt-4 rounded-xl border border-border bg-background p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Revision history
          </p>
          {revisions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No published revisions yet.</p>
          ) : (
            <ul className="space-y-2">
              {revisions.map((revision) => (
                <li
                  key={revision.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <span>
                    Version {revision.version} ·{" "}
                    <span className="text-muted-foreground">
                      {new Date(revision.saved_at).toLocaleString()}
                    </span>
                  </span>
                  <button
                    onClick={() => {
                      setContent(revision.content);
                      toast.success(`Version ${revision.version} loaded — publish to restore it`);
                    }}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
                  >
                    Restore
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

function WebsitePage() {
  const connected = isSupabaseConfigured();
  const queryClient = useQueryClient();
  const [active, setActive] = useState(SECTION_DEFS[0]!.key);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["cms-sections"],
    queryFn: fetchSectionRows,
    enabled: connected,
  });

  const rowByKey = useMemo(
    () => new Map(rows.map((row) => [row.section_key, row])),
    [rows],
  );

  if (!connected) {
    return (
      <div>
        <PageHeader
          title="Website"
          description="The control desk for the public website — every section is a structured, editable block with draft, publish and rollback."
        />
        <EmptyState
          icon={Globe}
          title="Connect your database to edit the site"
          description="Open Settings → Connections, paste your project URL and keys and run the setup script. Until then the public site shows the built-in default copy."
        />
      </div>
    );
  }

  const row = rowByKey.get(active);
  const initial = row?.draft_content ?? row?.content ?? defaultContent(active);

  return (
    <div>
      <PageHeader
        title="Website"
        description="Every section of the public site, edited as structured content. Save a draft, publish when ready, roll back any time."
      />

      <Link
        to="/builder"
        className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary/10 p-4 text-sm"
      >
        <span>
          <span className="block font-semibold text-foreground">Open the visual page builder</span>
          <span className="text-muted-foreground">Edit every page on screen, drag sections and buttons, preview on phone, then publish.</span>
        </span>
        <span className="rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground">Open builder</span>
      </Link>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {SECTION_DEFS.map((def) => {
          const sectionRow = rowByKey.get(def.key);
          const live = sectionRow?.status === "published";
          return (
            <button
              key={def.key}
              onClick={() => setActive(def.key)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                active === def.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {def.label}
              {live ? <span className="ml-1.5 text-xs opacity-80">•</span> : null}
            </button>
          );
        })}
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="ml-auto inline-flex items-center gap-2 rounded-lg border border-border px-3.5 py-2 text-sm font-medium hover:bg-accent"
        >
          <ExternalLink className="h-4 w-4" /> View live site
        </a>
      </div>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading sections…</p>
      ) : (
        <SectionEditor
          key={active}
          sectionKey={active}
          initial={initial as SectionContent}
          sectionId={row?.id ?? null}
          published={row?.status === "published"}
          onSaved={() => {
            void queryClient.invalidateQueries({ queryKey: ["cms-sections"] });
            void queryClient.invalidateQueries({ queryKey: ["cms-published"] });
          }}
        />
      )}
    </div>
  );
}
