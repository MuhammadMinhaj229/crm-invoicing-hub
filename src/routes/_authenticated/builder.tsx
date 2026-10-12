import { createFileRoute, Link } from "@tanstack/react-router";
import { Puck, createUsePuck, type Data } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { BUILDER_PAGES, defaultDocument } from "../../lib/page-builder/model";
import { documentToPuck, puckToDocument, safarPuckConfig } from "../../lib/page-builder/puck-config";
import { fetchDocumentState, publishDocument, saveDocumentDraft } from "../../lib/page-builder/store";

const usePuck = createUsePuck();

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
  const [page, setPage] = useState("home");
  const [data, setData] = useState<Data | null>(null);
  const [version, setVersion] = useState(0);
  const [pageMetadata, setPageMetadata] = useState<ReturnType<typeof defaultDocument>["metadata"]>();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let alive = true;
    setData(null);
    setLoadError(null);
    setVersion(0);
    setPageMetadata(undefined);
    fetchDocumentState(page)
      .then((s) => {
        if (!alive) return;
        const doc = s.draft ?? s.published ?? defaultDocument(page);
        setVersion(s.version);
        setPageMetadata(doc.metadata);
        setData(documentToPuck(doc));
      })
      .catch((e: Error) => {
        if (!alive) return;
        const message = `Could not load this page safely: ${e.message}`;
        setLoadError(message);
        toast.error(message);
      });
    return () => {
      alive = false;
    };
  }, [page, reloadToken]);

  const path = BUILDER_PAGES.find((p) => p.id === page)?.path ?? "/";

  const publish = async (next: Data) => {
    try {
      const v = await publishDocument(puckToDocument(page, next, pageMetadata), version);
      setVersion(v);
      toast.success(`Published version ${v}`);
    } catch (e) {
      toast.error(`Publish failed: ${(e as Error).message}`);
    }
  };

  const saveDraft = async (next: Data) => {
    try {
      const where = await saveDocumentDraft(puckToDocument(page, next, pageMetadata));
      toast.success(where === "cloud" ? "Draft saved" : "Draft saved on this device");
    } catch (e) {
      toast.error(`Save failed: ${(e as Error).message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-card px-4 py-2 text-sm">
        <Link to="/" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
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
      </div>
      <div className="min-h-0 flex-1">
        {loadError ? (
          <div className="grid h-full place-items-center p-6">
            <div className="max-w-lg rounded-xl border border-destructive/30 bg-card p-6 text-center">
              <h2 className="font-display text-lg font-bold text-foreground">Page not loaded</h2>
              <p role="alert" className="mt-2 text-sm text-muted-foreground">{loadError}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Editing is disabled until the saved page state can be read. This prevents a fallback document from overwriting published work.
              </p>
              <button
                type="button"
                onClick={() => setReloadToken((value) => value + 1)}
                className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Retry loading
              </button>
            </div>
          </div>
        ) : data ? (
          <Puck
            key={page}
            config={safarPuckConfig}
            data={data}
            onPublish={publish}
            headerTitle={BUILDER_PAGES.find((p) => p.id === page)?.label ?? "Page"}
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
