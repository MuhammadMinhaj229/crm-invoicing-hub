/**
 * Runtime contract for persisted page documents.
 *
 * TypeScript types protect authored code; this module protects data read from
 * local storage, Supabase, imported seed files and the visual editor. Keep
 * these schemas aligned with the block model and bump PAGE_DOCUMENT_VERSION
 * whenever a persisted shape needs an explicit migration.
 */
import { z } from "zod";

import type { BlockType, PageDocument } from "./model";
import { isSafeAssetReference, isSafeHref } from "./safe-url";

export const PAGE_DOCUMENT_VERSION = 1;
const MAX_DOCUMENT_BYTES = 2_000_000;
const MAX_BLOCKS = 150;

const idSchema = z.string().trim().min(1).max(128);
const textSchema = z.string().max(20_000);
const shortTextSchema = z.string().max(4_000);

const hrefSchema = z.string().trim().max(2_048).refine(isSafeHref, {
  message: "Use a site path, a section anchor, a supported contact action, or an HTTP(S) URL.",
});
const assetSchema = z.string().trim().max(2_048).refine(isSafeAssetReference, {
  message: "Use a relative asset path or an HTTP(S) media URL.",
});

const buttonSchema = z.object({
  id: idSchema,
  label: shortTextSchema,
  href: hrefSchema,
  style: z.enum(["solid", "outline", "text"]),
  size: z.enum(["sm", "md", "lg"]),
}).strict();

const cardSchema = z.object({
  id: idSchema,
  title: shortTextSchema,
  text: textSchema,
  image: assetSchema.optional(),
  href: hrefSchema.optional(),
}).strict();

const faqItemSchema = z.object({
  id: idSchema,
  question: shortTextSchema,
  answer: textSchema,
}).strict();

const storySlideSchema = z.object({
  id: idSchema,
  title: shortTextSchema,
  accent: shortTextSchema,
  text: textSchema,
  image: assetSchema,
  imageAlt: shortTextSchema,
}).strict();

const invoiceExampleRowSchema = z.object({
  id: idSchema,
  title: shortTextSchema,
  text: textSchema,
}).strict();

const navigationLinkSchema = z.object({
  id: idSchema,
  label: shortTextSchema,
  href: hrefSchema,
}).strict();

const sharedLayoutSchema = z.object({
  align: z.enum(["left", "center", "right"]),
  width: z.enum(["narrow", "normal", "full"]),
  spaceTop: z.number().finite().min(0).max(6),
  spaceBottom: z.number().finite().min(0).max(6),
  background: z.enum(["none", "muted", "card", "primary", "accent"]),
  hideMobile: z.boolean(),
  hideDesktop: z.boolean(),
}).strict();

const buttonList = z.array(buttonSchema).max(12);
const cardList = z.array(cardSchema).max(40);

const propsSchemas: Record<BlockType, z.ZodTypeAny> = {
  hero: z.object({
    eyebrow: shortTextSchema,
    title: shortTextSchema,
    text: textSchema,
    image: assetSchema,
    imageAlt: shortTextSchema,
    imageSide: z.enum(["left", "right"]),
    buttons: buttonList,
  }).strict(),
  cinematicHero: z.object({
    eyebrow: shortTextSchema,
    title: shortTextSchema,
    accent: shortTextSchema,
    text: textSchema,
    image: assetSchema,
    imageAlt: shortTextSchema,
    buttons: buttonList,
  }).strict(),
  careJourney: z.object({
    eyebrow: shortTextSchema,
    title: shortTextSchema,
    text: textSchema,
    items: cardList,
  }).strict(),
  serviceStory: z.object({
    eyebrow: shortTextSchema,
    title: shortTextSchema,
    text: textSchema,
    items: cardList,
  }).strict(),
  trustDossier: z.object({
    eyebrow: shortTextSchema,
    title: shortTextSchema,
    text: textSchema,
    items: cardList,
  }).strict(),
  proofReturn: z.object({
    eyebrow: shortTextSchema,
    title: shortTextSchema,
    text: textSchema,
    image: assetSchema,
    imageAlt: shortTextSchema,
    items: cardList,
  }).strict(),
  serviceFilm: z.object({
    eyebrow: shortTextSchema,
    title: shortTextSchema,
    text: textSchema,
    items: cardList,
  }).strict(),
  storyCarousel: z.object({
    title: shortTextSchema,
    text: textSchema,
    items: z.array(storySlideSchema).max(24),
  }).strict(),
  invoiceExample: z.object({
    title: shortTextSchema,
    text: textSchema,
    items: z.array(invoiceExampleRowSchema).max(40),
  }).strict(),
  heading: z.object({
    eyebrow: shortTextSchema,
    text: textSchema,
    level: z.enum(["h1", "h2", "h3"]),
  }).strict(),
  text: z.object({ text: textSchema }).strict(),
  image: z.object({
    src: assetSchema,
    alt: shortTextSchema,
    caption: textSchema,
  }).strict(),
  buttons: z.object({ items: buttonList }).strict(),
  imageText: z.object({
    eyebrow: shortTextSchema,
    title: shortTextSchema,
    text: textSchema,
    image: assetSchema,
    imageAlt: shortTextSchema,
    imageSide: z.enum(["left", "right"]),
    buttons: buttonList,
  }).strict(),
  cards: z.object({
    title: shortTextSchema,
    subtitle: textSchema,
    columns: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
    items: cardList,
  }).strict(),
  faq: z.object({
    title: shortTextSchema,
    items: z.array(faqItemSchema).max(60),
  }).strict(),
  contactStrip: z.object({
    title: shortTextSchema,
    text: textSchema,
    buttons: buttonList,
  }).strict(),
  enquiryForm: z.object({
    title: shortTextSchema,
    text: textSchema,
    submitLabel: shortTextSchema,
  }).strict(),
  video: z.object({
    url: assetSchema,
    caption: textSchema,
  }).strict(),
  spacer: z.object({ size: z.number().finite().min(0).max(40) }).strict(),
  divider: z.object({}).strict(),
  navigation: z.object({ links: z.array(navigationLinkSchema).max(60) }).strict(),
};

const blockTypes = new Set<string>(Object.keys(propsSchemas));

const blockEnvelopeSchema = z.object({
  id: idSchema,
  type: z.string().refine((value) => blockTypes.has(value), "Unknown block type."),
  props: z.record(z.string(), z.unknown()),
  layout: sharedLayoutSchema,
  hidden: z.boolean().optional(),
  locked: z.boolean().optional(),
  anchor: z.string().max(120).optional(),
}).strict();

const pageDocumentSchema = z.object({
  schemaVersion: z.literal(PAGE_DOCUMENT_VERSION).default(PAGE_DOCUMENT_VERSION),
  page: z.string().trim().min(1).max(200),
  blocks: z.array(blockEnvelopeSchema).max(MAX_BLOCKS),
  updatedAt: z.string().datetime({ offset: true }).optional(),
}).strict();

export type PageDocumentValidation =
  | { ok: true; document: PageDocument }
  | { ok: false; issues: string[] };

/**
 * Normalize through JSON before validating. This rejects circular structures,
 * BigInts and oversized documents while stripping undefined object properties,
 * matching what can actually be stored in PostgreSQL JSONB.
 */
export function validatePageDocument(value: unknown): PageDocumentValidation {
  let serialized: string | undefined;
  let normalized: unknown;

  try {
    serialized = JSON.stringify(value);
    if (!serialized) return { ok: false, issues: ["Document is not JSON serializable."] };
    if (new TextEncoder().encode(serialized).byteLength > MAX_DOCUMENT_BYTES) {
      return { ok: false, issues: ["Document exceeds the 2 MB limit."] };
    }
    normalized = JSON.parse(serialized) as unknown;
  } catch {
    return { ok: false, issues: ["Document is not valid JSON data."] };
  }

  const envelope = pageDocumentSchema.safeParse(normalized);
  if (!envelope.success) {
    return {
      ok: false,
      issues: envelope.error.issues.map((issue) => {
        const path = issue.path.length ? issue.path.join(".") : "document";
        return path + ": " + issue.message;
      }),
    };
  }

  for (const [index, block] of envelope.data.blocks.entries()) {
    const propsSchema = propsSchemas[block.type as BlockType];
    const result = propsSchema.safeParse(block.props);
    if (!result.success) {
      return {
        ok: false,
        issues: result.error.issues.map((issue) => {
          const suffix = issue.path.length ? "." + issue.path.join(".") : "";
          return "blocks." + index + ".props" + suffix + ": " + issue.message;
        }),
      };
    }
    // Use Zod's parsed output, not just its success flag, so trimming and
    // other canonical transformations actually reach the persisted document.
    envelope.data.blocks[index] = { ...block, props: result.data };
  }

  return { ok: true, document: envelope.data as unknown as PageDocument };
}

export function parsePageDocument(value: unknown): PageDocument | null {
  const result = validatePageDocument(value);
  return result.ok ? result.document : null;
}
