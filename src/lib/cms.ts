/**
 * Website CMS: structured sections for the public site.
 * No arbitrary HTML/CSS/JS — every section is a typed, validated content block
 * with draft / published states and full revision history.
 */
import { getSupabase } from "./supabase";

export type FieldType = "text" | "textarea" | "tags" | "list";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  itemFields?: FieldDef[];
  itemLabel?: string;
}

export interface SectionDef {
  key: string;
  label: string;
  description: string;
  fields: FieldDef[];
  defaults: Record<string, unknown>;
}

export type SectionContent = Record<string, unknown>;

const cta = (label: string, href: string) => ({ label, href });

export const SECTION_DEFS: SectionDef[] = [
  {
    key: "hero",
    label: "Hero banner",
    description: "The first thing a family sees — promise, proof and the primary action.",
    fields: [
      { key: "eyebrow", label: "Small line above the headline", type: "text" },
      { key: "title", label: "Headline", type: "text" },
      { key: "subtitle", label: "Supporting paragraph", type: "textarea" },
      { key: "primaryCtaLabel", label: "Main button label", type: "text" },
      { key: "primaryCtaHref", label: "Main button link", type: "text" },
      { key: "secondaryCtaLabel", label: "Secondary button label", type: "text" },
      { key: "secondaryCtaHref", label: "Secondary button link", type: "text" },
      { key: "imageUrl", label: "Hero image URL", type: "text" },
      { key: "imageAlt", label: "Hero image description", type: "text" },
      { key: "highlights", label: "Quick highlights", type: "tags" },
    ],
    defaults: {
      eyebrow: "Gulf Assistance & Coordination",
      title: "We do. We assist. We connect.",
      subtitle:
        "You are in the Gulf. Your family is in India. SAFAR N MANZIL stands in for you on the ground — groceries, parcels, home repairs, hospital visits, paperwork — handled by verified people and reported back to you.",
      primaryCtaLabel: "Request assistance",
      primaryCtaHref: "#contact",
      secondaryCtaLabel: "See how it works",
      secondaryCtaHref: "#how-it-works",
      imageUrl: "",
      imageAlt: "A Gulf-based family member coordinating trusted help for parents in India",
      highlights: ["Verified local partners", "One point of contact", "Updates on WhatsApp"],
    },
  },
  {
    key: "services",
    label: "Service grid",
    description: "The deliberate list of what SAFAR does. Keep it specific — never 'anything'.",
    fields: [
      { key: "title", label: "Section title", type: "text" },
      { key: "subtitle", label: "Section subtitle", type: "textarea" },
      { key: "groceriesImageUrl", label: "Groceries story image URL", type: "text" },
      { key: "repairsImageUrl", label: "Home services story image URL", type: "text" },
      { key: "healthcareImageUrl", label: "Healthcare story image URL", type: "text" },
      {
        key: "items",
        label: "Services",
        type: "list",
        itemLabel: "Service",
        itemFields: [
          { key: "title", label: "Service name", type: "text" },
          { key: "description", label: "What we actually do", type: "textarea" },
        ],
      },
    ],
    defaults: {
      title: "What we handle for your family",
      subtitle:
        "A deliberate set of services, each with a vetted partner behind it and a clear price before we start.",
      groceriesImageUrl: "",
      repairsImageUrl: "",
      healthcareImageUrl: "",
      items: [
        {
          title: "Groceries & essentials",
          description:
            "Monthly rations and everyday essentials delivered to your family's door, with a bill you can see.",
        },
        {
          title: "Parcel & logistics",
          description:
            "Documents and packages collected, couriered and tracked between cities — and to you in the Gulf.",
        },
        {
          title: "Home services",
          description:
            "Electricians, plumbers, AC servicing and repairs arranged with verified technicians and agreed rates.",
        },
        {
          title: "Healthcare assistance",
          description:
            "Appointments, hospital accompaniment, medicine delivery and follow-up updates for elderly parents.",
        },
        {
          title: "Documentation & legal",
          description:
            "Certificates, attestations, bank and government paperwork followed up locally until it is done.",
        },
        {
          title: "Property & coordination",
          description:
            "Site visits, rent collection support, maintenance checks and photo-verified reporting.",
        },
      ],
    },
  },
  {
    key: "trust",
    label: "Trust strip",
    description: "Why a family far away should hand this to you.",
    fields: [
      { key: "title", label: "Section title", type: "text" },
      {
        key: "items",
        label: "Trust points",
        type: "list",
        itemLabel: "Trust point",
        itemFields: [
          { key: "title", label: "Title", type: "text" },
          { key: "description", label: "Description", type: "textarea" },
        ],
      },
    ],
    defaults: {
      title: "Built on accountability, not promises",
      items: [
        {
          title: "Verified partners only",
          description:
            "Every serviceman and vendor in our network is identity-checked and rated after each job.",
        },
        {
          title: "Clear pricing before work starts",
          description:
            "You approve the cost first. Third-party cost and our coordination fee are shown separately.",
        },
        {
          title: "Proof of every job",
          description:
            "Photos, bills and status updates for each request, kept in one place you can refer back to.",
        },
      ],
    },
  },
  {
    key: "how_it_works",
    label: "How it works",
    description: "The four steps from a message to a completed job.",
    fields: [
      { key: "title", label: "Section title", type: "text" },
      { key: "subtitle", label: "Section subtitle", type: "textarea" },
      {
        key: "steps",
        label: "Steps",
        type: "list",
        itemLabel: "Step",
        itemFields: [
          { key: "title", label: "Step title", type: "text" },
          { key: "description", label: "Step description", type: "textarea" },
        ],
      },
    ],
    defaults: {
      title: "How it works",
      subtitle: "One message from you. One coordinator. One clear outcome.",
      steps: [
        { title: "Tell us what is needed", description: "Send the request on WhatsApp or through this page." },
        { title: "We confirm scope and cost", description: "You get the plan, the partner and the price before anything starts." },
        { title: "We get it done locally", description: "Our verified partner carries out the work while we supervise." },
        { title: "You get proof and the invoice", description: "Photos, bills and a clear invoice close the loop." },
      ],
    },
  },
  {
    key: "testimonials",
    label: "Testimonials",
    description: "Only real, consented words from real families. Leave empty until you have them.",
    fields: [
      { key: "title", label: "Section title", type: "text" },
      {
        key: "items",
        label: "Testimonials",
        type: "list",
        itemLabel: "Testimonial",
        itemFields: [
          { key: "quote", label: "What they said", type: "textarea" },
          { key: "author", label: "Name", type: "text" },
          { key: "location", label: "Location", type: "text" },
        ],
      },
    ],
    defaults: {
      title: "Families we look after",
      items: [],
    },
  },
  {
    key: "cta",
    label: "Call to action",
    description: "The closing nudge before the contact block.",
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
      { key: "buttonLabel", label: "Button label", type: "text" },
      { key: "buttonHref", label: "Button link", type: "text" },
    ],
    defaults: {
      title: "Something needs doing back home?",
      subtitle: "Tell us once. We take it from there and keep you updated at every step.",
      buttonLabel: "Talk to us on WhatsApp",
      buttonHref: "#contact",
    },
  },
  {
    key: "faq",
    label: "FAQ",
    description: "The questions families actually ask before trusting you.",
    fields: [
      { key: "title", label: "Section title", type: "text" },
      {
        key: "items",
        label: "Questions",
        type: "list",
        itemLabel: "Question",
        itemFields: [
          { key: "question", label: "Question", type: "text" },
          { key: "answer", label: "Answer", type: "textarea" },
        ],
      },
    ],
    defaults: {
      title: "Questions before you start",
      items: [
        {
          question: "Which cities do you cover?",
          answer: "Tell us the city and we will confirm coverage before accepting the request.",
        },
        {
          question: "How do I pay?",
          answer:
            "You approve the cost first and receive a proper invoice showing the third-party cost and our coordination fee separately.",
        },
        {
          question: "How will I know the work is done?",
          answer: "Every completed job comes with photos, the bill and a status update on WhatsApp.",
        },
      ],
    },
  },
  {
    key: "contact",
    label: "Contact",
    description: "How families reach you, and where the enquiry lands.",
    fields: [
      { key: "title", label: "Section title", type: "text" },
      { key: "subtitle", label: "Section subtitle", type: "textarea" },
      { key: "whatsapp", label: "WhatsApp number (digits only)", type: "text" },
      { key: "phone", label: "Phone number", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "location", label: "Location line", type: "text" },
    ],
    defaults: {
      title: "Talk to a coordinator",
      subtitle: "Send the details and we will reply with the plan, the partner and the cost.",
      whatsapp: "",
      phone: "",
      email: "",
      location: "",
    },
  },
  {
    key: "footer",
    label: "Footer",
    description: "Closing band, quick links and the private CRM entry point.",
    fields: [
      { key: "tagline", label: "Tagline", type: "textarea" },
      {
        key: "links",
        label: "Quick links",
        type: "list",
        itemLabel: "Link",
        itemFields: [
          { key: "label", label: "Label", type: "text" },
          { key: "href", label: "Link", type: "text" },
        ],
      },
      { key: "legal", label: "Legal line", type: "text" },
      { key: "crmLabel", label: "CRM entry label", type: "text" },
    ],
    defaults: {
      tagline: "Gulf Assistance & Coordination for families back home in India.",
      links: [
        cta("Services", "#services"),
        cta("How it works", "#how-it-works"),
        cta("FAQ", "#faq"),
        cta("Contact", "#contact"),
      ],
      legal: "© SAFAR N MANZIL. All rights reserved.",
      crmLabel: "Team login",
    },
  },
];

export const SECTION_MAP = new Map(SECTION_DEFS.map((def) => [def.key, def]));

export function defaultContent(key: string): SectionContent {
  return structuredClone(SECTION_MAP.get(key)?.defaults ?? {}) as SectionContent;
}

export function defaultSections(): Record<string, SectionContent> {
  return Object.fromEntries(SECTION_DEFS.map((def) => [def.key, defaultContent(def.key)]));
}

export interface CmsSectionRow {
  id: string;
  page: string;
  section_key: string;
  content: SectionContent;
  draft_content: SectionContent | null;
  status: string;
  version: number;
  updated_at: string;
}

export interface CmsRevisionRow {
  id: string;
  section_id: string;
  content: SectionContent;
  version: number;
  saved_at: string;
}

function client() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Connect your database in Settings first.");
  return supabase;
}

/** Published content for the public site, merged over code defaults. */
export async function fetchPublishedContent(): Promise<Record<string, SectionContent>> {
  const merged = defaultSections();
  const supabase = getSupabase();
  if (!supabase) return merged;
  const { data, error } = await supabase
    .from("cms_sections")
    .select("section_key, content, status")
    .eq("page", "home")
    .eq("status", "published");
  if (error) return merged;
  for (const row of data ?? []) {
    const key = (row as { section_key: string }).section_key;
    const content = (row as { content: SectionContent }).content;
    if (SECTION_MAP.has(key) && content && Object.keys(content).length > 0) {
      merged[key] = { ...merged[key], ...content };
    }
  }
  return merged;
}

/** Every section row for the editor (draft + published state). */
export async function fetchSectionRows(): Promise<CmsSectionRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("cms_sections")
    .select("id, page, section_key, content, draft_content, status, version, updated_at")
    .eq("page", "home");
  if (error) throw new Error(error.message);
  return (data ?? []) as CmsSectionRow[];
}

export async function saveDraft(sectionKey: string, content: SectionContent): Promise<void> {
  const supabase = client();
  const { error } = await supabase
    .from("cms_sections")
    .upsert(
      { page: "home", section_key: sectionKey, draft_content: content, updated_at: new Date().toISOString() },
      { onConflict: "page,section_key" },
    );
  if (error) throw new Error(error.message);
}

export async function publishSection(sectionKey: string, content: SectionContent): Promise<void> {
  const supabase = client();
  const { data: existing } = await supabase
    .from("cms_sections")
    .select("id, version")
    .eq("page", "home")
    .eq("section_key", sectionKey)
    .maybeSingle();

  const version = ((existing as { version?: number } | null)?.version ?? 0) + 1;
  const { data: saved, error } = await supabase
    .from("cms_sections")
    .upsert(
      {
        page: "home",
        section_key: sectionKey,
        content,
        draft_content: content,
        status: "published",
        version,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "page,section_key" },
    )
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const sectionId = (saved as { id: string }).id;
  const { error: revisionError } = await supabase
    .from("cms_revisions")
    .insert({ section_id: sectionId, content, version });
  if (revisionError) throw new Error(revisionError.message);
}

export async function unpublishSection(sectionKey: string): Promise<void> {
  const supabase = client();
  const { error } = await supabase
    .from("cms_sections")
    .update({ status: "draft", updated_at: new Date().toISOString() })
    .eq("page", "home")
    .eq("section_key", sectionKey);
  if (error) throw new Error(error.message);
}

export async function fetchRevisions(sectionId: string): Promise<CmsRevisionRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("cms_revisions")
    .select("id, section_id, content, version, saved_at")
    .eq("section_id", sectionId)
    .order("version", { ascending: false })
    .limit(20);
  if (error) throw new Error(error.message);
  return (data ?? []) as CmsRevisionRow[];
}
