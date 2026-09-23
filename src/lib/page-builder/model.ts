/**
 * Visual page builder — document model.
 *
 * Every public page is a list of structured blocks. Blocks carry typed props
 * and a shared layout object. No raw HTML/CSS/JS can be stored, so an edit
 * can never break the site.
 */
import { site } from "../../content/site";
import { services } from "../../content/services";
import { faqs } from "../../content/faqs";
import { defaultSections } from "../cms";
import heroFamily from "../../assets/safar-hero-family.png";
import groceriesStory from "../../assets/safar-story-groceries.png";
import repairsStory from "../../assets/safar-story-repairs.png";
import healthcareStory from "../../assets/safar-story-health.png";
import castArt from "../../assets/safar-cast.png";
import updatesArt from "../../assets/safar-updates.png";

export interface ButtonItem {
  id: string;
  label: string;
  /** "/page", "#section", "whatsapp", "phone", "email" or "https://…" */
  href: string;
  style: "solid" | "outline" | "text";
  size: "sm" | "md" | "lg";
}

export interface CardItem {
  id: string;
  title: string;
  text: string;
  image?: string;
  href?: string;
}

export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
}

export interface LinkItem {
  id: string;
  label: string;
  href: string;
}

export type Background = "none" | "muted" | "card" | "primary" | "accent";

export interface BlockLayout {
  align: "left" | "center" | "right";
  width: "narrow" | "normal" | "full";
  spaceTop: number; // 0-6
  spaceBottom: number; // 0-6
  background: Background;
  hideMobile: boolean;
  hideDesktop: boolean;
}

interface BaseBlock<T extends string, P> {
  id: string;
  type: T;
  props: P;
  layout: BlockLayout;
  hidden?: boolean;
  locked?: boolean;
  anchor?: string;
}

export type Block =
  | BaseBlock<"hero", { eyebrow: string; title: string; text: string; image: string; imageAlt: string; imageSide: "left" | "right"; buttons: ButtonItem[] }>
  | BaseBlock<"heading", { eyebrow: string; text: string; level: "h1" | "h2" | "h3" }>
  | BaseBlock<"text", { text: string }>
  | BaseBlock<"image", { src: string; alt: string; caption: string }>
  | BaseBlock<"buttons", { items: ButtonItem[] }>
  | BaseBlock<"imageText", { eyebrow: string; title: string; text: string; image: string; imageAlt: string; imageSide: "left" | "right"; buttons: ButtonItem[] }>
  | BaseBlock<"cards", { title: string; subtitle: string; columns: 1 | 2 | 3 | 4; items: CardItem[] }>
  | BaseBlock<"faq", { title: string; items: FaqEntry[] }>
  | BaseBlock<"contactStrip", { title: string; text: string; buttons: ButtonItem[] }>
  | BaseBlock<"enquiryForm", { title: string; text: string; submitLabel: string }>
  | BaseBlock<"video", { url: string; caption: string }>
  | BaseBlock<"spacer", { size: number }>
  | BaseBlock<"divider", Record<string, never>>
  | BaseBlock<"navigation", { links: LinkItem[] }>;

export type BlockType = Block["type"];

export interface PageDocument {
  page: string;
  blocks: Block[];
  updatedAt?: string;
}

export const uid = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);

export const defaultLayout = (patch: Partial<BlockLayout> = {}): BlockLayout => ({
  align: "left",
  width: "normal",
  spaceTop: 3,
  spaceBottom: 3,
  background: "none",
  hideMobile: false,
  hideDesktop: false,
  ...patch,
});

export const btn = (label: string, href: string, style: ButtonItem["style"] = "solid"): ButtonItem => ({
  id: uid(),
  label,
  href,
  style,
  size: "md",
});

/** Block library shown in the editor's "Add block" menu. */
export const BLOCK_LIBRARY: { type: BlockType; label: string; description: string }[] = [
  { type: "hero", label: "Big banner", description: "Headline, text, picture and buttons" },
  { type: "heading", label: "Heading", description: "A title for a new part of the page" },
  { type: "text", label: "Paragraph", description: "Plain text" },
  { type: "image", label: "Picture", description: "One picture with a caption" },
  { type: "buttons", label: "Buttons", description: "One or more buttons in a row" },
  { type: "imageText", label: "Picture + text", description: "Side-by-side story" },
  { type: "cards", label: "Card grid", description: "Services, steps or features" },
  { type: "faq", label: "Questions", description: "Question and answer list" },
  { type: "contactStrip", label: "Contact strip", description: "WhatsApp / call band" },
  { type: "enquiryForm", label: "Enquiry form", description: "Name, phone and request" },
  { type: "video", label: "Video", description: "YouTube or Vimeo link" },
  { type: "spacer", label: "Space", description: "Empty space" },
  { type: "divider", label: "Line", description: "Thin dividing line" },
];

export function createBlock(type: BlockType): Block {
  const id = uid();
  const layout = defaultLayout();
  switch (type) {
    case "hero":
      return { id, type, layout, props: { eyebrow: "Small line", title: "Your headline", text: "A short supporting sentence.", image: "", imageAlt: "", imageSide: "right", buttons: [btn("Ask for help now", "/contact")] } };
    case "heading":
      return { id, type, layout, props: { eyebrow: "", text: "New heading", level: "h2" } };
    case "text":
      return { id, type, layout, props: { text: "Write your paragraph here." } };
    case "image":
      return { id, type, layout, props: { src: "", alt: "", caption: "" } };
    case "buttons":
      return { id, type, layout, props: { items: [btn("Button", "/contact")] } };
    case "imageText":
      return { id, type, layout, props: { eyebrow: "", title: "A short title", text: "Tell the story here.", image: "", imageAlt: "", imageSide: "left", buttons: [] } };
    case "cards":
      return { id, type, layout, props: { title: "Section title", subtitle: "", columns: 3, items: [1, 2, 3].map((n) => ({ id: uid(), title: `Card ${n}`, text: "Short description." })) } };
    case "faq":
      return { id, type, layout, props: { title: "Questions", items: [{ id: uid(), question: "Your question?", answer: "Your answer." }] } };
    case "contactStrip":
      return { id, type, layout: defaultLayout({ background: "primary", align: "center" }), props: { title: "Need help for your family?", text: "Send us a message and we reply the same day.", buttons: [btn(site.cta.whatsapp, "whatsapp", "outline")] } };
    case "enquiryForm":
      return { id, type, layout, props: { title: "Tell us what you need", text: "We reply on WhatsApp.", submitLabel: "Send request" } };
    case "video":
      return { id, type, layout, props: { url: "", caption: "" } };
    case "spacer":
      return { id, type, layout: defaultLayout({ spaceTop: 0, spaceBottom: 0 }), props: { size: 3 } };
    case "divider":
      return { id, type, layout, props: {} };
    case "navigation":
      return { id, type, layout, props: { links: site.navigation.map((n) => ({ id: uid(), label: n.label, href: n.href })) } };
  }
}

/** Every page the team can edit. */
export const BUILDER_PAGES: { id: string; label: string; path: string }[] = [
  { id: "home", label: "Home", path: "/" },
  { id: "services", label: "Services", path: "/services" },
  ...services.map((s) => ({ id: `service:${s.slug}`, label: `Service · ${s.title}`, path: `/services/${s.slug}` })),
  { id: "about", label: "How it works", path: "/about" },
  { id: "faq", label: "Questions", path: "/faq" },
  { id: "contact", label: "Talk to us", path: "/contact" },
  { id: "privacy", label: "Privacy", path: "/privacy" },
  { id: "terms", label: "Terms", path: "/terms" },
  { id: "global", label: "Header menu", path: "/" },
];

const s = (v: unknown, fallback = ""): string => (typeof v === "string" && v.trim() ? v : fallback);

/** Starting document for a page, built from the current website content. */
export function defaultDocument(page: string): PageDocument {
  const cms = defaultSections();
  const hero = cms["hero"] ?? {};
  const b = (blocks: Block[]): PageDocument => ({ page, blocks });

  if (page === "global") return b([createBlock("navigation")]);

  if (page === "home") {
    const svc = cms["services"] ?? {};
    const promise = cms["promise"] ?? {};
    const items = Array.isArray(svc["items"]) ? (svc["items"] as { title?: string; description?: string }[]) : [];
    const art = [groceriesStory, repairsStory, healthcareStory];
    return b([
      { id: uid(), type: "hero", layout: defaultLayout({ spaceTop: 4, spaceBottom: 4 }), props: { eyebrow: s(hero["eyebrow"]), title: s(hero["title"]), text: s(hero["subtitle"]), image: heroFamily, imageAlt: s(hero["imageAlt"]), imageSide: "right", buttons: [btn(s(hero["primaryCtaLabel"], site.cta.primary), "/contact"), btn(s(hero["secondaryCtaLabel"], "See how it works"), "/about", "outline")] } },
      { id: uid(), type: "imageText", layout: defaultLayout({ background: "muted" }), props: { eyebrow: s(promise["eyebrow"]), title: s(promise["title"]), text: s(promise["body"]), image: updatesArt, imageAlt: "Photo updates sent on WhatsApp", imageSide: "left", buttons: [] } },
      { id: uid(), type: "cards", layout: defaultLayout(), anchor: "services", props: { title: s(svc["title"], "What we do"), subtitle: s(svc["subtitle"]), columns: 3, items: items.slice(0, 6).map((it, i) => ({ id: uid(), title: s(it.title), text: s(it.description), image: art[i] ?? "", href: "/services" })) } },
      { id: uid(), type: "faq", layout: defaultLayout({ width: "narrow" }), props: { title: "Questions families ask", items: faqs.slice(0, 5).map((f) => ({ id: uid(), question: f.question, answer: f.answer })) } },
      createBlock("contactStrip"),
    ]);
  }

  if (page === "services") {
    return b([
      { id: uid(), type: "heading", layout: defaultLayout({ spaceTop: 4 }), props: { eyebrow: "Services", text: "What we can do for your family", level: "h1" } },
      { id: uid(), type: "text", layout: defaultLayout({ spaceTop: 0 }), props: { text: site.brand.description } },
      { id: uid(), type: "cards", layout: defaultLayout(), props: { title: "", subtitle: "", columns: 3, items: services.map((sv) => ({ id: uid(), title: sv.title, text: sv.shortDescription, href: `/services/${sv.slug}` })) } },
      createBlock("contactStrip"),
    ]);
  }

  if (page.startsWith("service:")) {
    const sv = services.find((x) => `service:${x.slug}` === page);
    if (sv) {
      return b([
        { id: uid(), type: "heading", layout: defaultLayout({ spaceTop: 4 }), props: { eyebrow: "Service", text: sv.title, level: "h1" } },
        { id: uid(), type: "text", layout: defaultLayout({ spaceTop: 0 }), props: { text: sv.description } },
        { id: uid(), type: "cards", layout: defaultLayout(), props: { title: "How it works", subtitle: "", columns: 3, items: sv.process.map((p) => ({ id: uid(), title: `${p.step}. ${p.title}`, text: p.description })) } },
        { id: uid(), type: "cards", layout: defaultLayout({ background: "muted" }), props: { title: "What you get", subtitle: sv.pricingNote, columns: 2, items: sv.deliverables.map((d) => ({ id: uid(), title: d, text: "" })) } },
        createBlock("contactStrip"),
      ]);
    }
  }

  if (page === "about") {
    return b([
      { id: uid(), type: "heading", layout: defaultLayout({ spaceTop: 4 }), props: { eyebrow: "How it works", text: site.brand.motto, level: "h1" } },
      { id: uid(), type: "imageText", layout: defaultLayout(), props: { eyebrow: "", title: "Who we are", text: site.brand.description, image: castArt, imageAlt: "The SAFAR family characters", imageSide: "right", buttons: [btn(site.cta.primary, "/contact")] } },
      createBlock("contactStrip"),
    ]);
  }

  if (page === "faq") {
    return b([
      { id: uid(), type: "heading", layout: defaultLayout({ spaceTop: 4 }), props: { eyebrow: "Questions", text: "Price, trust and timing", level: "h1" } },
      { id: uid(), type: "faq", layout: defaultLayout({ width: "narrow" }), props: { title: "", items: faqs.map((f) => ({ id: uid(), question: f.question, answer: f.answer })) } },
    ]);
  }

  if (page === "contact") {
    return b([
      { id: uid(), type: "heading", layout: defaultLayout({ spaceTop: 4 }), props: { eyebrow: "Talk to us", text: "Tell us what your family needs", level: "h1" } },
      { id: uid(), type: "text", layout: defaultLayout({ spaceTop: 0 }), props: { text: site.hours } },
      createBlock("enquiryForm"),
    ]);
  }

  if (page === "privacy" || page === "terms") {
    return b([
      { id: uid(), type: "heading", layout: defaultLayout({ spaceTop: 4, width: "narrow" }), props: { eyebrow: "", text: page === "privacy" ? "Privacy" : "Terms", level: "h1" } },
      { id: uid(), type: "text", layout: defaultLayout({ width: "narrow" }), props: { text: "Write this page in the builder." } },
    ]);
  }

  return b([createBlock("heading")]);
}

export function isPageDocument(value: unknown): value is PageDocument {
  return !!value && typeof value === "object" && Array.isArray((value as PageDocument).blocks);
}
