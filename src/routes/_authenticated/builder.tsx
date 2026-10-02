import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Puck, type Data } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { BUILDER_PAGES, defaultDocument } from "../../lib/page-builder/model";
import { documentToPuck, puckToDocument, safarPuckConfig } from "../../lib/page-builder/puck-config";
import { fetchDocumentState, publishDocument, saveDocumentDraft } from "../../lib/page-builder/store";

export const Route = createFileRoute("/_authenticated/builder")({
  head: () => ({
    meta: [
      { title: "Website studio — SAFAR N MANZIL" },
      { name: "description", content: "Drag, drop, edit and publish every section of the SAFAR website." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StudioPage,
});

function StudioPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState("home");
  const [data, setData] = useState<Data | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let alive = true;
    setData(null);
    fetchDocumentState(page)
      .then((s) => {
        if (!alive) return;
        const doc = s.draft && s.draft.blocks.length ? s.draft : s.published ?? defaultDocument(page);
        setVersion(s.version);
        setData(documentToPuck(doc));
      })
      .catch((e: Error) => {
        toast.error(`Could not load this page: ${e.message}`);
        if (alive) setData(documentToPuck(defaultDocument(page)));
      });
    return () => {
      alive = false;
    };
  }, [page]);

  const path = BUILDER_PAGES.find((p) => p.id === page)?.path ?? "/";

  const publish = async (next: Data) => {
    try {
      const v = await publishDocument(puckToDocument(page, next));
      setVersion(v);
      await qc.invalidateQueries({ queryKey: ["published-document", page] });
      toast.success(`Published version ${v}`);
    } catch (e) {
      toast.error(`Publish failed: ${(e as Error).message}`);
    }
  };

  const saveDraft = async (next: Data) => {
    try {
      const where = await saveDocumentDraft(puckToDocument(page, next));
      toast.success(where === "cloud" ? "Draft saved" : "Draft saved on this device");
    } catch (e) {
      toast.error(`Save failed: ${(e as Error).message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-card px-4 py-2 text-sm">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <select
          aria-label="Page to edit"
          value={page}
          onChange={(e) => setPage(e.target.value)}
          className="rounded-md border border-input bg-background px-2 py-1"
        >
          {BUILDER_PAGES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <span className="text-muted-foreground">Live version {version || "—"}</span>
        <a href={path} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
          Open live page <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <Link to="/builder-classic" className="text-muted-foreground hover:text-foreground">
          Classic builder
        </Link>
      </div>
      <div className="min-h-0 flex-1">
        {data ? (
          <Puck
            key={page}
            config={safarPuckConfig}
            data={data}
            onPublish={publish}
            headerTitle={BUILDER_PAGES.find((p) => p.id === page)?.label}
            overrides={{
              headerActions: ({ children }) => (
                <>
                  <SaveDraftButton onSave={saveDraft} />
                  {children}
                </>
              ),
            }}
          />
        ) : (
          <div className="grid h-full place-items-center text-muted-foreground">Loading page…</div>
        )}
      </div>
    </div>
  );
}

function SaveDraftButton({ onSave }: { onSave: (d: Data) => void }) {
  // Lazily read Puck's current data via its hook to avoid stale copies.
  const { usePuck } = PuckHooks;
  const appState = usePuck((s) => s.appState);
  return (
    <button
      type="button"
      onClick={() => onSave(appState.data)}
      className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted"
    >
      Save draft
    </button>
  );
}

import { createUsePuck } from "@puckeditor/core";
const PuckHooks = { usePuck: createUsePuck() };
