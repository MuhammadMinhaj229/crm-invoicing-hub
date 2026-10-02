/**
 * Puck registry for the SAFAR website.
 *
 * Every block type from the document model becomes a Puck component. Fields
 * are inferred from each block's starting props, so adding a block to the
 * model makes it draggable and editable here with no extra form code.
 * Rendering reuses the same RenderBlock the public site uses.
 */
import type React from "react";
import type { ComponentConfig, Config, Data, Field, Fields } from "@puckeditor/core";

import { RenderBlock } from "../../components/page-builder/block-renderer";
import {
  BLOCK_LIBRARY,
  createBlock,
  defaultLayout,
  uid,
  type Block,
  type BlockLayout,
  type BlockType,
  type PageDocument,
} from "./model";

const ENUMS: Record<string, string[]> = {
  imageSide: ["left", "right"],
  level: ["h1", "h2", "h3"],
  style: ["solid", "outline", "text"],
  size: ["sm", "md", "lg"],
};

const LABELS: Record<string, string> = {
  href: "Link (/page, whatsapp, phone, email or https://…)",
  imageAlt: "Picture description",
  src: "Picture",
  image: "Picture",
};

const human = (key: string) =>
  LABELS[key] ?? key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

function inferField(key: string, value: unknown): Field | null {
  if (key === "id") return null;
  if (key === "columns") {
    return { type: "select", label: "Columns", options: [1, 2, 3, 4].map((n) => ({ label: String(n), value: n })) };
  }
  if (ENUMS[key]) {
    return { type: "select", label: human(key), options: ENUMS[key].map((v) => ({ label: v, value: v })) };
  }
  if (typeof value === "number") return { type: "number", label: human(key), min: 0 };
  if (typeof value === "boolean") {
    return { type: "radio", label: human(key), options: [{ label: "Yes", value: true }, { label: "No", value: false }] };
  }
  if (typeof value === "string") {
    return value.length > 60 || key === "text" || key === "answer"
      ? { type: "textarea", label: human(key) }
      : { type: "text", label: human(key) };
  }
  if (Array.isArray(value)) {
    const sample = (value[0] ?? {}) as Record<string, unknown>;
    const arrayFields: Fields = {};
    for (const [k, v] of Object.entries(sample)) {
      const f = inferField(k, v);
      if (f) arrayFields[k] = f;
    }
    // Optional keys that some items carry but the first may not.
    if (key === "items" && !("image" in sample) && !("question" in sample)) {
      arrayFields["image"] = { type: "text", label: "Picture" };
    }
    const titleKey = ["title", "label", "question"].find((k) => k in sample);
    return {
      type: "array",
      label: human(key),
      arrayFields,
      defaultItemProps: Object.fromEntries(Object.keys(arrayFields).map((k) => [k, typeof sample[k] === "number" ? 0 : ""])),
      getItemSummary: (item: Record<string, unknown>, i?: number) =>
        String((titleKey && item[titleKey]) || `Item ${(i ?? 0) + 1}`),
    } as Field;
  }
  return null;
}

const layoutField: Field = {
  type: "object",
  label: "Layout",
  objectFields: {
    align: { type: "select", label: "Align", options: ["left", "center", "right"].map((v) => ({ label: v, value: v })) },
    width: { type: "select", label: "Width", options: ["narrow", "normal", "full"].map((v) => ({ label: v, value: v })) },
    background: {
      type: "select",
      label: "Background",
      options: ["none", "muted", "card", "primary", "accent"].map((v) => ({ label: v, value: v })),
    },
    spaceTop: { type: "number", label: "Space above (0–6)", min: 0, max: 6 },
    spaceBottom: { type: "number", label: "Space below (0–6)", min: 0, max: 6 },
    hideMobile: { type: "radio", label: "Hide on phones", options: [{ label: "Yes", value: true }, { label: "No", value: false }] },
    hideDesktop: { type: "radio", label: "Hide on computers", options: [{ label: "Yes", value: true }, { label: "No", value: false }] },
  },
};

type PuckProps = Record<string, unknown> & { id: string; layout?: BlockLayout; anchor?: string };

/** Puck props → document block. */
export function propsToBlock(type: BlockType, raw: Record<string, unknown>): Block {
  const { id, layout, anchor, puck: _puck, editMode: _e, ...props } = raw as PuckProps & {
    puck?: unknown;
    editMode?: unknown;
  };
  const items = (v: unknown) =>
    Array.isArray(v) ? v.map((it) => (it && typeof it === "object" && !("id" in it) ? { id: uid(), ...it } : it)) : v;
  const withIds = Object.fromEntries(Object.entries(props).map(([k, v]) => [k, items(v)]));
  return {
    id: String(id ?? uid()),
    type,
    props: withIds,
    layout: { ...defaultLayout(), ...(layout ?? {}) },
    ...(anchor ? { anchor: String(anchor) } : {}),
  } as Block;
}

function componentFor(type: BlockType, label: string): ComponentConfig<PuckProps> {
  const sample = createBlock(type);
  const fields: Fields = {};
  for (const [k, v] of Object.entries(sample.props)) {
    const f = inferField(k, v);
    if (f) fields[k] = f;
  }
  fields["anchor"] = { type: "text", label: "Section link name (optional)" };
  fields["layout"] = layoutField;
  return {
    label,
    fields: fields as NonNullable<ComponentConfig<PuckProps>["fields"]>,
    defaultProps: { ...(sample.props as Record<string, unknown>), layout: sample.layout } as PuckProps,
    render: (props) => <RenderBlock block={propsToBlock(type, props as Record<string, unknown>)} />,
  };
}

const LIBRARY = [...BLOCK_LIBRARY, { type: "navigation" as BlockType, label: "Header menu", description: "" }];

export const safarPuckConfig: Config = {
  components: Object.fromEntries(LIBRARY.map((b) => [b.type, componentFor(b.type, b.label)])),
  categories: {
    story: { title: "Story sections", components: ["cinematicHero", "serviceFilm", "careJourney", "serviceStory", "trustDossier", "proofReturn", "storyCarousel", "invoiceExample"] },
    content: { title: "Content", components: ["hero", "heading", "text", "image", "imageText", "cards", "faq", "video", "buttons"] },
    action: { title: "Actions", components: ["contactStrip", "enquiryForm"] },
    layout: { title: "Layout", components: ["spacer", "divider", "navigation"] },
  },
  root: { render: ({ children }: { children?: React.ReactNode }) => <div className="@container bg-background text-foreground">{children}</div> },
} as Config;

export function documentToPuck(doc: PageDocument): Data {
  return {
    root: { props: {} },
    content: doc.blocks
      .filter((b) => !b.hidden)
      .map((b) => ({
        type: b.type,
        props: { id: b.id, ...(b.props as Record<string, unknown>), layout: b.layout, ...(b.anchor ? { anchor: b.anchor } : {}) },
      })),
  } as Data;
}

export function puckToDocument(page: string, data: Data): PageDocument {
  return {
    page,
    blocks: data.content.map((c) => propsToBlock(c.type as BlockType, c.props as Record<string, unknown>)),
  };
}
