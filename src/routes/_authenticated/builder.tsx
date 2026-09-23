import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  History,
  Lock,
  Monitor,
  Pencil,
  Plus,
  Redo2,
  RotateCcw,
  Smartphone,
  Tablet,
  Trash2,
  Undo2,
  Unlock,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

import { EditProvider, RenderBlock } from "../../components/page-builder/block-renderer";
import {
  BLOCK_LIBRARY,
  BUILDER_PAGES,
  btn,
  createBlock,
  defaultDocument,
  uid,
  type Block,
  type BlockLayout,
  type PageDocument,
} from "../../lib/page-builder/model";
import {
  fetchDocumentRevisions,
  fetchDocumentState,
  publishDocument,
  saveDocumentDraft,
  unpublishDocument,
  type DocumentRevision,
} from "../../lib/page-builder/store";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "../../lib/utils";

export const Route = createFileRoute("/_authenticated/builder")({
  head: () => ({
    meta: [
      { title: "Website builder — SAFAR N MANZIL" },
      { name: "description", content: "Edit, arrange and publish every page of the SAFAR website visually." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BuilderPage,
});

/* ---------- history reducer ---------- */

interface HistoryState {
  doc: PageDocument;
  past: PageDocument[];
  future: PageDocument[];
}
type Action =
  | { type: "load"; doc: PageDocument }
  | { type: "change"; doc: PageDocument }
  | { type: "undo" }
  | { type: "redo" };

function reducer(s: HistoryState, a: Action): HistoryState {
  switch (a.type) {
    case "load":
      return { doc: a.doc, past: [], future: [] };
    case "change":
      return { doc: a.doc, past: [...s.past.slice(-60), s.doc], future: [] };
    case "undo": {
      const prev = s.past[s.past.length - 1];
      return prev ? { doc: prev, past: s.past.slice(0, -1), future: [s.doc, ...s.future] } : s;
    }
    case "redo": {
      const next = s.future[0];
      return next ? { doc: next, past: [...s.past, s.doc], future: s.future.slice(1) } : s;
    }
  }
}

function setPath<T>(obj: T, path: string, value: unknown): T {
  const clone = structuredClone(obj) as Record<string, unknown>;
  const keys = path.split(".");
  let cur: Record<string, unknown> = clone;
  keys.slice(0, -1).forEach((k) => {
    cur = cur[k] as Record<string, unknown>;
  });
  cur[keys[keys.length - 1]!] = value;
  return clone as T;
}

const DEVICES = { desktop: "100%", tablet: "820px", phone: "393px" } as const;

/* ---------- page ---------- */

function BuilderPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState("home");
  const [state, dispatch] = useReducer(reducer, { doc: defaultDocument("home"), past: [], future: [] });
  const [selected, setSelected] = useState<string | null>(null);
  const [device, setDevice] = useState<keyof typeof DEVICES>("desktop");
  const [preview, setPreview] = useState(false);
  const [meta, setMeta] = useState<{ id: string | null; status: string; version: number }>({ id: null, status: "none", version: 0 });
  const [saveState, setSaveState] = useState<"saved" | "saving" | "unsaved" | "local" | "error">("saved");
  const [insertAt, setInsertAt] = useState<number | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const loaded = useRef(false);

  const doc = state.doc;
  const change = useCallback((next: PageDocument) => dispatch({ type: "change", doc: next }), []);

  // Load page
  useEffect(() => {
    loaded.current = false;
    setSelected(null);
    fetchDocumentState(page)
      .then((st) => {
        dispatch({ type: "load", doc: st.draft ?? st.published ?? defaultDocument(page) });
        setMeta({ id: st.id, status: st.status, version: st.version });
        setSaveState("saved");
      })
      .catch((e: Error) => {
        dispatch({ type: "load", doc: defaultDocument(page) });
        toast.error(e.message);
      })
      .finally(() => {
        loaded.current = true;
      });
  }, [page]);

  // Autosave draft
  useEffect(() => {
    if (!loaded.current || state.past.length === 0) return;
    setSaveState("unsaved");
    const t = setTimeout(() => {
      setSaveState("saving");
      saveDocumentDraft(doc)
        .then((where) => setSaveState(where === "local" ? "local" : "saved"))
        .catch(() => setSaveState("error"));
    }, 1200);
    return () => clearTimeout(t);
  }, [doc, state.past.length]);

  // Keyboard undo/redo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || (e.target as HTMLElement).isContentEditable) return;
      if (e.key.toLowerCase() === "z") {
        e.preventDefault();
        dispatch({ type: e.shiftKey ? "redo" : "undo" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const updateBlock = useCallback(
    (id: string, fn: (b: Block) => Block) => change({ ...doc, blocks: doc.blocks.map((b) => (b.id === id ? fn(b) : b)) }),
    [doc, change],
  );

  const editApi = useMemo(
    () => ({
      editing: !preview,
      setProp: (blockId: string, path: string, value: string) =>
        updateBlock(blockId, (b) => ({ ...b, props: setPath(b.props, path, value) }) as Block),
    }),
    [preview, updateBlock],
  );

  const move = (id: string, dir: -1 | 1) => {
    const i = doc.blocks.findIndex((b) => b.id === id);
    const j = i + dir;
    if (j < 0 || j >= doc.blocks.length) return;
    change({ ...doc, blocks: arrayMove(doc.blocks, i, j) });
  };
  const duplicate = (id: string) => {
    const i = doc.blocks.findIndex((b) => b.id === id);
    const copy = { ...structuredClone(doc.blocks[i]!), id: uid() };
    const blocks = [...doc.blocks];
    blocks.splice(i + 1, 0, copy);
    change({ ...doc, blocks });
    setSelected(copy.id);
  };
  const remove = (id: string) => {
    change({ ...doc, blocks: doc.blocks.filter((b) => b.id !== id) });
    if (selected === id) setSelected(null);
  };
  const insert = (type: Block["type"], at: number) => {
    const block = createBlock(type);
    const blocks = [...doc.blocks];
    blocks.splice(at, 0, block);
    change({ ...doc, blocks });
    setSelected(block.id);
    setInsertAt(null);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = doc.blocks.findIndex((b) => b.id === e.active.id);
    const to = doc.blocks.findIndex((b) => b.id === e.over!.id);
    if (from < 0 || to < 0 || doc.blocks[from]?.locked) return;
    change({ ...doc, blocks: arrayMove(doc.blocks, from, to) });
  };

  const publish = async () => {
    try {
      const v = await publishDocument(doc);
      setMeta((m) => ({ ...m, status: "published", version: v }));
      await qc.invalidateQueries({ queryKey: ["published-document", page] });
      toast.success("Published — the live website is updated.");
      const st = await fetchDocumentState(page);
      setMeta({ id: st.id, status: st.status, version: st.version });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  const unpublish = async () => {
    try {
      await unpublishDocument(page);
      setMeta((m) => ({ ...m, status: "draft" }));
      await qc.invalidateQueries({ queryKey: ["published-document", page] });
      toast.success("Taken down — the original page shows again.");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const selectedBlock = doc.blocks.find((b) => b.id === selected) ?? null;
  const pageInfo = BUILDER_PAGES.find((p) => p.id === page);

  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-[600px] flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-card px-3 py-2">
        <select
          value={page}
          onChange={(e) => setPage(e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-2 text-sm font-semibold"
          aria-label="Page"
        >
          {BUILDER_PAGES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", meta.status === "published" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>
          {meta.status === "published" ? `Live · v${meta.version}` : meta.status === "draft" ? "Not live" : "Built-in page"}
        </span>
        <div className="mx-2 flex rounded-lg border border-border p-0.5">
          {(
            [
              ["desktop", Monitor],
              ["tablet", Tablet],
              ["phone", Smartphone],
            ] as const
          ).map(([d, Icon]) => (
            <button key={d} type="button" onClick={() => setDevice(d)} aria-label={d} className={cn("rounded-md p-1.5", device === d && "bg-muted")}>
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
        <ToolBtn label="Undo" disabled={!state.past.length} onClick={() => dispatch({ type: "undo" })}>
          <Undo2 className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn label="Redo" disabled={!state.future.length} onClick={() => dispatch({ type: "redo" })}>
          <Redo2 className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn label={preview ? "Back to editing" : "Preview"} onClick={() => setPreview((v) => !v)}>
          {preview ? <Pencil className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </ToolBtn>
        <ToolBtn label="History" disabled={!meta.id} onClick={() => setHistoryOpen(true)}>
          <History className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn
          label="Start again from the original page"
          onClick={() => {
            if (confirm("Replace this draft with the original page content?")) change(defaultDocument(page));
          }}
        >
          <RotateCcw className="h-4 w-4" />
        </ToolBtn>
        {pageInfo && page !== "global" ? (
          <a href={pageInfo.path} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm hover:bg-muted">
            <ExternalLink className="h-4 w-4" /> Live page
          </a>
        ) : null}
        <span className="ml-auto text-xs text-muted-foreground">
          {{ saved: "Draft saved", saving: "Saving…", unsaved: "Unsaved changes", local: "Saved on this device only", error: "Could not save" }[saveState]}
        </span>
        {meta.status === "published" ? (
          <button type="button" onClick={unpublish} className="h-9 rounded-full border border-border px-4 text-sm font-semibold">
            Take down
          </button>
        ) : null}
        <button type="button" onClick={publish} className="h-9 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground">
          Publish live
        </button>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Layers */}
        {!preview && (
          <aside className="hidden w-60 shrink-0 overflow-y-auto border-r border-border bg-card p-3 lg:block">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Sections (drag to reorder)</p>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={doc.blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                <ul className="space-y-1">
                  {doc.blocks.map((b) => (
                    <LayerRow key={b.id} block={b} active={b.id === selected} onSelect={() => setSelected(b.id)} />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
            <button type="button" onClick={() => setInsertAt(doc.blocks.length)} className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-border py-2 text-sm font-semibold">
              <Plus className="h-4 w-4" /> Add section
            </button>
          </aside>
        )}

        {/* Canvas */}
        <div className="min-w-0 flex-1 overflow-y-auto bg-muted/60 p-4" onClick={() => setSelected(null)}>
          <div className="mx-auto overflow-hidden rounded-xl bg-background shadow-lg transition-[width]" style={{ width: DEVICES[device], maxWidth: "100%" }}>
            <EditProvider value={editApi}>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={doc.blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                  {doc.blocks.map((b, i) =>
                    preview ? (
                      b.hidden ? null : <RenderBlock key={b.id} block={b} />
                    ) : (
                      <CanvasBlock
                        key={b.id}
                        block={b}
                        selected={b.id === selected}
                        onSelect={() => setSelected(b.id)}
                        onUp={() => move(b.id, -1)}
                        onDown={() => move(b.id, 1)}
                        onDuplicate={() => duplicate(b.id)}
                        onRemove={() => remove(b.id)}
                        onToggleHidden={() => updateBlock(b.id, (x) => ({ ...x, hidden: !x.hidden }))}
                        onToggleLock={() => updateBlock(b.id, (x) => ({ ...x, locked: !x.locked }))}
                        onInsertBelow={() => setInsertAt(i + 1)}
                      />
                    ),
                  )}
                </SortableContext>
              </DndContext>
            </EditProvider>
            {!preview && doc.blocks.length === 0 ? (
              <div className="p-16 text-center">
                <button type="button" onClick={() => setInsertAt(0)} className="rounded-full bg-primary px-5 py-2 font-semibold text-primary-foreground">
                  Add the first section
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Settings */}
        {!preview && (
          <aside className="hidden w-80 shrink-0 overflow-y-auto border-l border-border bg-card p-4 md:block">
            {selectedBlock ? (
              <BlockSettings block={selectedBlock} onChange={(nb) => updateBlock(nb.id, () => nb)} />
            ) : (
              <div className="text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">How to edit</p>
                <ul className="mt-2 list-disc space-y-1 pl-4">
                  <li>Click any text on the page and type.</li>
                  <li>Drag the handle to move a section.</li>
                  <li>Click a section to change its buttons, pictures and layout here.</li>
                  <li>Changes save as a draft. Press Publish live when ready.</li>
                </ul>
              </div>
            )}
          </aside>
        )}
      </div>

      {insertAt !== null && (
        <Modal title="Add a section" onClose={() => setInsertAt(null)}>
          <div className="grid grid-cols-2 gap-2">
            {BLOCK_LIBRARY.map((b) => (
              <button key={b.type} type="button" onClick={() => insert(b.type, insertAt)} className="rounded-xl border border-border p-3 text-left hover:border-primary">
                <span className="block font-semibold">{b.label}</span>
                <span className="block text-xs text-muted-foreground">{b.description}</span>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {historyOpen && meta.id && (
        <HistoryDialog
          sectionId={meta.id}
          onClose={() => setHistoryOpen(false)}
          onRestore={(d) => {
            change({ ...d, page });
            setHistoryOpen(false);
            toast.success("Version restored as your draft. Publish to make it live.");
          }}
        />
      )}
    </div>
  );
}

/* ---------- pieces ---------- */

function ToolBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick} disabled={disabled} className="rounded-lg p-2 hover:bg-muted disabled:opacity-40">
      {children}
    </button>
  );
}

const typeLabel = (t: Block["type"]) => BLOCK_LIBRARY.find((b) => b.type === t)?.label ?? (t === "navigation" ? "Menu links" : t);

function blockTitle(b: Block): string {
  const p = b.props as Record<string, unknown>;
  const t = (p["title"] ?? p["text"] ?? "") as string;
  return typeof t === "string" && t ? t.slice(0, 32) : typeLabel(b.type);
}

function LayerRow({ block, active, onSelect }: { block: Block; active: boolean; onSelect: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: block.id, disabled: block.locked });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("flex items-center gap-1 rounded-lg px-1 py-1.5 text-sm", active ? "bg-primary/10 text-primary" : "hover:bg-muted", block.hidden && "opacity-50")}
    >
      <button type="button" {...attributes} {...listeners} className="cursor-grab p-1 text-muted-foreground" aria-label="Drag">
        <GripVertical className="h-4 w-4" />
      </button>
      <button type="button" onClick={onSelect} className="min-w-0 flex-1 truncate text-left">
        <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">{typeLabel(block.type)}</span>
        {blockTitle(block)}
      </button>
      {block.locked && <Lock className="h-3 w-3" />}
    </li>
  );
}

function CanvasBlock(props: {
  block: Block;
  selected: boolean;
  onSelect: () => void;
  onUp: () => void;
  onDown: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onToggleHidden: () => void;
  onToggleLock: () => void;
  onInsertBelow: () => void;
}) {
  const { block, selected } = props;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id, disabled: block.locked });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={(e) => {
        e.stopPropagation();
        props.onSelect();
      }}
      className={cn(
        "group relative outline-offset-[-2px]",
        selected ? "outline outline-2 outline-primary" : "hover:outline hover:outline-1 hover:outline-primary/50",
        block.hidden && "opacity-40",
        isDragging && "z-20 opacity-80 shadow-2xl",
      )}
    >
      <div className={cn("absolute left-2 top-2 z-10 flex items-center gap-0.5 rounded-lg bg-foreground p-0.5 text-background shadow", selected ? "flex" : "hidden group-hover:flex")}>
        <button type="button" {...attributes} {...listeners} className="cursor-grab rounded p-1 hover:bg-background/20" aria-label="Drag to move">
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="px-1 text-xs font-semibold">{typeLabel(block.type)}</span>
        {(
          [
            ["Move up", ArrowUp, props.onUp],
            ["Move down", ArrowDown, props.onDown],
            ["Duplicate", Copy, props.onDuplicate],
            [block.hidden ? "Show" : "Hide", block.hidden ? Eye : EyeOff, props.onToggleHidden],
            [block.locked ? "Unlock" : "Lock", block.locked ? Unlock : Lock, props.onToggleLock],
          ] as const
        ).map(([label, Icon, fn]) => (
          <button key={label} type="button" title={label} aria-label={label} onClick={(e) => { e.stopPropagation(); fn(); }} className="rounded p-1 hover:bg-background/20">
            <Icon className="h-4 w-4" />
          </button>
        ))}
        {!block.locked && (
          <button type="button" title="Delete" aria-label="Delete" onClick={(e) => { e.stopPropagation(); props.onRemove(); }} className="rounded p-1 hover:bg-destructive">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className={cn(block.locked && "pointer-events-none")}>
        <RenderBlock block={block} />
      </div>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); props.onInsertBelow(); }}
        className="absolute -bottom-3 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow group-hover:flex"
      >
        <Plus className="h-3 w-3" /> Add here
      </button>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="text-sm text-muted-foreground">Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function HistoryDialog({ sectionId, onClose, onRestore }: { sectionId: string; onClose: () => void; onRestore: (d: PageDocument) => void }) {
  const [rows, setRows] = useState<DocumentRevision[] | null>(null);
  useEffect(() => {
    fetchDocumentRevisions(sectionId).then(setRows).catch(() => setRows([]));
  }, [sectionId]);
  return (
    <Modal title="Published versions" onClose={onClose}>
      {!rows ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No published versions yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between py-2 text-sm">
              <span>
                Version {r.version} · {new Date(r.saved_at).toLocaleString()}
              </span>
              <button type="button" onClick={() => onRestore(r.content)} className="font-semibold text-primary">
                Restore
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

/* ---------- settings panel ---------- */

const ENUMS: Record<string, readonly (string | number)[]> = {
  imageSide: ["left", "right"],
  level: ["h1", "h2", "h3"],
  style: ["solid", "outline", "text"],
  size: ["sm", "md", "lg"],
  columns: [1, 2, 3, 4],
};
const LABELS: Record<string, string> = {
  eyebrow: "Small line above",
  title: "Title",
  text: "Text",
  subtitle: "Subtitle",
  image: "Picture",
  src: "Picture",
  imageAlt: "Picture description (for blind visitors)",
  alt: "Picture description",
  caption: "Caption",
  imageSide: "Picture side",
  level: "Heading size",
  columns: "Columns",
  url: "Video link",
  submitLabel: "Button text",
  size: "Height",
  buttons: "Buttons",
  items: "Items",
  links: "Menu links",
  label: "Label",
  href: "Link",
  style: "Style",
  question: "Question",
  answer: "Answer",
};
const LONG = new Set(["text", "subtitle", "answer"]);
const IMAGE = new Set(["image", "src"]);

function newItem(block: Block, key: string): Record<string, unknown> {
  if (key === "buttons" || (key === "items" && block.type === "buttons")) return { ...btn("New button", "/contact") };
  if (key === "links") return { id: uid(), label: "New link", href: "/" };
  if (block.type === "faq") return { id: uid(), question: "New question?", answer: "Answer." };
  return { id: uid(), title: "New card", text: "", image: "", href: "" };
}

function Field({ name, value, onChange }: { name: string; value: unknown; onChange: (v: unknown) => void }) {
  const label = LABELS[name] ?? name;
  const base = "mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm";
  if (ENUMS[name]) {
    return (
      <label className="block text-xs font-semibold">
        {label}
        <select className={base} value={String(value)} onChange={(e) => onChange(typeof ENUMS[name]![0] === "number" ? Number(e.target.value) : e.target.value)}>
          {ENUMS[name]!.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </label>
    );
  }
  if (typeof value === "number") {
    return (
      <label className="block text-xs font-semibold">
        {label}: {value}
        <input type="range" min={0} max={12} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 w-full" />
      </label>
    );
  }
  if (IMAGE.has(name)) {
    return (
      <div className="block text-xs font-semibold">
        {label}
        {typeof value === "string" && value ? <img src={value} alt="" className="mt-1 max-h-28 rounded-lg object-cover" /> : null}
        <input className={base} placeholder="https://… picture link" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
        <input
          type="file"
          accept="image/*"
          className="mt-1 text-xs"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            if (f.size > 900_000) {
              toast.error("Please use a picture under 900 KB, or paste a picture link.");
              return;
            }
            const r = new FileReader();
            r.onload = () => onChange(String(r.result));
            r.readAsDataURL(f);
          }}
        />
      </div>
    );
  }
  if (name === "href") {
    return (
      <label className="block text-xs font-semibold">
        {label}
        <input className={base} list="builder-links" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
        <datalist id="builder-links">
          {["whatsapp", "phone", "email", ...BUILDER_PAGES.filter((p) => p.id !== "global").map((p) => p.path)].map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
      </label>
    );
  }
  return (
    <label className="block text-xs font-semibold">
      {label}
      {LONG.has(name) ? (
        <textarea rows={4} className={base} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={base} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

function SortableItem({ id, children }: { id: string; children: (handle: ReactNode) => ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const handle = (
    <button type="button" {...attributes} {...listeners} className="cursor-grab p-1 text-muted-foreground" aria-label="Drag">
      <GripVertical className="h-4 w-4" />
    </button>
  );
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}>
      {children(handle)}
    </div>
  );
}

function ListField({ block, name, items, onChange }: { block: Block; name: string; items: Record<string, unknown>[]; onChange: (v: unknown) => void }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div>
      <p className="text-xs font-semibold">{LABELS[name] ?? name} <span className="font-normal text-muted-foreground">(drag to reorder)</span></p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={(e) => {
          if (!e.over || e.active.id === e.over.id) return;
          const from = items.findIndex((x) => x["id"] === e.active.id);
          const to = items.findIndex((x) => x["id"] === e.over!.id);
          onChange(arrayMove(items, from, to));
        }}
      >
        <SortableContext items={items.map((x) => String(x["id"]))} strategy={verticalListSortingStrategy}>
          <div className="mt-1 space-y-1">
            {items.map((item, i) => {
              const id = String(item["id"]);
              return (
                <SortableItem key={id} id={id}>
                  {(handle) => (
                    <div className="rounded-lg border border-border">
                      <div className="flex items-center gap-1 px-1 py-1">
                        {handle}
                        <button type="button" className="min-w-0 flex-1 truncate text-left text-sm" onClick={() => setOpen(open === id ? null : id)}>
                          {String(item["label"] ?? item["title"] ?? item["question"] ?? "Item")}
                        </button>
                        <button type="button" aria-label="Remove" onClick={() => onChange(items.filter((_, j) => j !== i))} className="p-1 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {open === id && (
                        <div className="space-y-2 border-t border-border p-2">
                          {Object.entries(item)
                            .filter(([k]) => k !== "id")
                            .map(([k, v]) => (
                              <Field key={k} name={k} value={v} onChange={(nv) => onChange(items.map((x, j) => (j === i ? { ...x, [k]: nv } : x)))} />
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </SortableItem>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
      <button type="button" onClick={() => onChange([...items, newItem(block, name)])} className="mt-2 flex items-center gap-1 text-sm font-semibold text-primary">
        <Plus className="h-4 w-4" /> Add
      </button>
    </div>
  );
}

function BlockSettings({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  const props = block.props as Record<string, unknown>;
  const setProp = (k: string, v: unknown) => onChange({ ...block, props: { ...props, [k]: v } } as Block);
  const setLayout = (patch: Partial<BlockLayout>) => onChange({ ...block, layout: { ...block.layout, ...patch } });
  const l = block.layout;
  const seg = "flex rounded-lg border border-border p-0.5 text-xs";
  const segBtn = (on: boolean) => cn("flex-1 rounded-md px-2 py-1 capitalize", on && "bg-primary text-primary-foreground");
  return (
    <div className="space-y-4">
      <p className="text-sm font-bold">{typeLabel(block.type)}</p>
      <div className="space-y-3">
        {Object.entries(props).map(([k, v]) =>
          Array.isArray(v) ? (
            <ListField key={k} block={block} name={k} items={v as Record<string, unknown>[]} onChange={(nv) => setProp(k, nv)} />
          ) : (
            <Field key={k} name={k} value={v} onChange={(nv) => setProp(k, nv)} />
          ),
        )}
      </div>
      <div className="space-y-3 border-t border-border pt-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Layout</p>
        <div className={seg}>
          {(["left", "center", "right"] as const).map((a) => (
            <button key={a} type="button" className={segBtn(l.align === a)} onClick={() => setLayout({ align: a })}>{a}</button>
          ))}
        </div>
        <div className={seg}>
          {(["narrow", "normal", "full"] as const).map((w) => (
            <button key={w} type="button" className={segBtn(l.width === w)} onClick={() => setLayout({ width: w })}>{w}</button>
          ))}
        </div>
        <label className="block text-xs font-semibold">
          Background
          <select className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={l.background} onChange={(e) => setLayout({ background: e.target.value as BlockLayout["background"] })}>
            <option value="none">None</option>
            <option value="muted">Soft</option>
            <option value="card">Card</option>
            <option value="primary">Brand colour</option>
            <option value="accent">Accent</option>
          </select>
        </label>
        <label className="block text-xs font-semibold">
          Space above: {l.spaceTop}
          <input type="range" min={0} max={8} value={l.spaceTop} onChange={(e) => setLayout({ spaceTop: Number(e.target.value) })} className="w-full" />
        </label>
        <label className="block text-xs font-semibold">
          Space below: {l.spaceBottom}
          <input type="range" min={0} max={8} value={l.spaceBottom} onChange={(e) => setLayout({ spaceBottom: Number(e.target.value) })} className="w-full" />
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold">
          <input type="checkbox" checked={l.hideMobile} onChange={(e) => setLayout({ hideMobile: e.target.checked })} /> Hide on phones
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold">
          <input type="checkbox" checked={l.hideDesktop} onChange={(e) => setLayout({ hideDesktop: e.target.checked })} /> Hide on computers
        </label>
        <label className="block text-xs font-semibold">
          Jump-link name (optional)
          <input className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="e.g. services" value={block.anchor ?? ""} onChange={(e) => onChange({ ...block, anchor: e.target.value.replace(/[^a-z0-9-]/gi, "").toLowerCase() })} />
        </label>
      </div>
    </div>
  );
}
