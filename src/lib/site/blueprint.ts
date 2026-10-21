/**
 * Business blueprint — the ONE place the codebase reads `src/content/seed.json`.
 *
 * Every business-specific fact (name, contact, navigation, wording, services,
 * questions, pages) comes from the seed. Components and routes consume the
 * typed helpers below and never hold brand copy of their own, so a new
 * business only needs a new seed file.
 */
import seedFile from "../../content/seed.json";
import type { Block, PageDocument } from "../page-builder/model";
import { prepareCmsSeed } from "../page-builder/seed";

type JsonRecord = Record<string, unknown>;

const rec = (value: unknown): JsonRecord =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {};
const str = (value: unknown, fallback = ""): string =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;
const strList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === "string" && v.trim() !== "") : [];
const links = (value: unknown): BlueprintLink[] =>
  Array.isArray(value)
    ? value.flatMap((item) => {
        const r = rec(item);
        const label = str(r["label"]);
        const href = str(r["href"]);
        return label && href ? [{ label, href, ...(str(r["hint"]) ? { hint: str(r["hint"]) } : {}) }] : [];
      })
    : [];

export interface BlueprintLink {
  label: string;
  href: string;
  hint?: string;
}

/** Validated once at module load; an invalid seed fails the build/tests loudly. */
export const preparedSeed = prepareCmsSeed(seedFile as unknown);

const rawSite = rec((seedFile as JsonRecord)["site"]);
const brand = rec(rawSite["brand"]);
const contact = rec(rawSite["contact"]);
const location = rec(rawSite["location"]);
const cta = rec(rawSite["cta"]);
const messages = rec(rawSite["messages"]);
const header = rec(rawSite["header"]);
const footer = rec(rawSite["footer"]);
const forms = rec(rawSite["forms"]);
const seo = rec(rawSite["seo"]);

const brandName = str(brand["name"], "Your business");

/** Business facts with neutral fallbacks — never invented contact details. */
export const blueprint = {
  brand: {
    name: brandName,
    tagline: str(brand["tagline"]),
    description: str(brand["description"]),
    motto: str(brand["motto"]),
    logoUrl: str(brand["logoUrl"]),
  },
  contact: {
    whatsapp: str(contact["whatsapp"]).replace(/[^\d]/g, ""),
    phone: str(contact["phone"]),
    email: str(contact["email"]),
    location: str(contact["location"]) || str(location["city"]),
  },
  location: {
    city: str(location["city"]),
    region: str(location["region"]),
    country: str(location["country"]),
  },
  serviceAreas: strList(rawSite["serviceAreas"]),
  hours: str(rawSite["hours"]),
  navigation: links(rawSite["navigation"]),
  legalLinks: links(rawSite["legalLinks"]),
  cta: {
    primary: str(cta["primary"], "Get in touch"),
    whatsapp: str(cta["whatsapp"], "Message us on WhatsApp"),
    call: str(cta["call"], "Call us"),
  },
  messages: {
    enquiry: strList(messages["enquiry"]).length
      ? strList(messages["enquiry"])
      : ["I would like to know more about your services."],
    service: str(messages["service"], "Please share the details and the price."),
    emailSubject: str(messages["emailSubject"], "Enquiry"),
  },
  header: { rotatingMessages: strList(header["rotatingMessages"]) },
  footer: {
    legal: str(footer["legal"], `© ${brandName}. All rights reserved.`),
    teamLoginLabel: str(footer["teamLoginLabel"], "Team login"),
    exploreLabel: str(footer["exploreLabel"], "Explore"),
    contactLabel: str(footer["contactLabel"], "Contact"),
  },
  forms: {
    namePlaceholder: str(forms["namePlaceholder"], "Your name"),
    phonePlaceholder: str(forms["phonePlaceholder"], "Your phone number"),
    cityPlaceholder: str(forms["cityPlaceholder"], "Your city"),
    needPlaceholder: str(forms["needPlaceholder"], "How can we help?"),
    successMessage: str(forms["successMessage"], "Thank you — we will be in touch soon."),
    errorMessage: str(forms["errorMessage"], "We could not send this right now. Please contact us directly."),
  },
  seo: {
    siteName: str(seo["siteName"], brandName),
    defaultTitle: str(seo["defaultTitle"], brandName),
    defaultDescription: str(seo["defaultDescription"], str(brand["description"])),
  },
} as const;

export type Blueprint = typeof blueprint;

/* ---------------- pages ---------------- */

export interface BlueprintPage {
  id: string;
  label: string;
  path: string;
  document: PageDocument;
}

export const blueprintPages: BlueprintPage[] = preparedSeed.pages.map(({ page, document }) => ({
  id: page,
  label: document.metadata?.label ?? page,
  path: document.metadata?.path ?? "/",
  document,
}));

const byId = new Map(blueprintPages.map((p) => [p.id, p]));

/** Pages reachable by URL (the shared "global" chrome document is excluded). */
export const routablePages = blueprintPages.filter((p) => p.id !== "global");

export function seedDocument(page: string): PageDocument | null {
  return byId.get(page)?.document ?? null;
}

export function normalizePath(path: string): string {
  const clean = "/" + path.split(/[?#]/)[0]!.split("/").filter(Boolean).join("/");
  return clean.toLowerCase();
}

/** Resolve a public URL to its page id using the seed's declared paths. */
export function pageIdForPath(path: string): string | null {
  const target = normalizePath(path);
  return routablePages.find((p) => normalizePath(p.path) === target)?.id ?? null;
}

/* ---------------- derived catalogues ---------------- */

function firstOfType<T extends Block["type"]>(blocks: Block[], type: T) {
  return blocks.find((b) => b.type === type) as Extract<Block, { type: T }> | undefined;
}

export interface ServiceSummary {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  path: string;
}

/** Services are the seed pages whose id starts with "service:". */
export const services: ServiceSummary[] = blueprintPages
  .filter((p) => p.id.startsWith("service:"))
  .map((p) => {
    const heading = firstOfType(p.document.blocks, "heading");
    const text = firstOfType(p.document.blocks, "text");
    const slug = p.id.slice("service:".length);
    return {
      id: slug,
      slug,
      title: heading?.props.text || p.label.replace(/^Service\s*·\s*/i, ""),
      shortDescription: p.document.metadata?.seo.description ?? "",
      description: text?.props.text ?? p.document.metadata?.seo.description ?? "",
      path: p.path,
    };
  });

export interface FaqSummary {
  id: string;
  question: string;
  answer: string;
}

/** Questions from every FAQ block on a page (defaults to the "faq" page). */
export function faqsForDocument(document: PageDocument | null): FaqSummary[] {
  if (!document) return [];
  return document.blocks.flatMap((b) =>
    b.type === "faq" && !b.hidden ? b.props.items.filter((i) => i.question && i.answer) : [],
  );
}

export const faqs: FaqSummary[] = faqsForDocument(seedDocument("faq") ?? seedDocument("home"));
