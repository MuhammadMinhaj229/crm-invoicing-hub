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
      eyebrow: "Help for your family back home",
      title: "We do. We assist. We connect.",
      subtitle:
        "You live in the Gulf. Your family lives in India. We do the running around for them — shopping, parcels, repairs, hospital visits and paperwork — and we send you photos and updates.",
      primaryCtaLabel: "Ask for help",
      primaryCtaHref: "#contact",
      secondaryCtaLabel: "See how it works",
      secondaryCtaHref: "#how-it-works",
      imageUrl: "",
      imageAlt: "A son in the Gulf arranging help for his parents in India",
      highlights: ["People we know and check", "One person to talk to", "Updates on WhatsApp"],
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
      title: "What we do for your family",
      subtitle:
        "A short, clear list of jobs we do. We tell you the price before we start.",
      groceriesImageUrl: "",
      repairsImageUrl: "",
      healthcareImageUrl: "",
      items: [
        {
          title: "Groceries & essentials",
          description:
            "Monthly ration and daily items brought to your family's door. You see the bill.",
        },
        {
          title: "Parcel & logistics",
          description:
            "We pick up papers and parcels, send them and tell you where they are.",
        },
        {
          title: "Home services",
          description:
            "Electrician, plumber, AC service and repairs. Known workers, price fixed first.",
        },
        {
          title: "Healthcare assistance",
          description:
            "We book the doctor, go with your parents, bring medicines and tell you how it went.",
        },
        {
          title: "Documentation & legal",
          description:
            "Certificates, bank and government work. We keep going until the paper is in hand.",
        },
        {
          title: "Property & coordination",
          description:
            "We visit your house or land, help with rent, check repairs and send photos.",
        },
      ],
    },
  },
  {
    key: "cast",
    label: "Who we help",
    description: "The three kinds of people in every SAFAR story, shown with our own characters.",
    fields: [
      { key: "eyebrow", label: "Small line above the title", type: "text" },
      { key: "title", label: "Section title", type: "text" },
      { key: "subtitle", label: "Section subtitle", type: "textarea" },
      {
        key: "items",
        label: "People",
        type: "list",
        itemLabel: "Person",
        itemFields: [
          { key: "name", label: "Who they are", type: "text" },
          { key: "description", label: "What we do for them", type: "textarea" },
        ],
      },
    ],
    defaults: {
      eyebrow: "Who we help",
      title: "One family, two countries",
      subtitle: "You are far away. They are at home. We stand in the middle and do the running around.",
      items: [
        {
          name: "The son working in the Gulf",
          description: "You send one message. We handle it and send you photos when it is done.",
        },
        {
          name: "The daughter abroad",
          description: "You can check what happened any time, without calling ten people.",
        },
        {
          name: "Parents at home in India",
          description: "The same known person comes to the door, with an ID card and a fixed price.",
        },
      ],
    },
  },
  {
    key: "updates",
    label: "Photo updates",
    description: "Shows families that every job comes back with proof.",
    fields: [
      { key: "eyebrow", label: "Small line above the title", type: "text" },
      { key: "title", label: "Section title", type: "text" },
      { key: "subtitle", label: "Section subtitle", type: "textarea" },
      { key: "imageUrl", label: "Picture URL", type: "text" },
      { key: "points", label: "What you get back", type: "tags" },
    ],
    defaults: {
      eyebrow: "You always know",
      title: "Every job comes back with proof",
      subtitle:
        "When the work is finished, our person sends a photo, the bill and a short message. You see it on your phone, wherever you are.",
      imageUrl: "",
      points: ["A photo of the work", "The shop or worker bill", "Our fee shown separately", "A short message on WhatsApp"],
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
      title: "Why families trust us",
      items: [
        {
          title: "We know our workers",
          description:
            "We check the ID of every worker we send, and we rate them after each job.",
        },
        {
          title: "Price told before work",
          description:
            "You say yes to the cost first. We show the shop or worker cost and our fee separately.",
        },
        {
          title: "Proof for every job",
          description:
            "Photos, bills and updates for every job, saved in one place you can check any time.",
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
      subtitle: "One message from you. One person handles it. One clear result.",
      steps: [
        { title: "Tell us what you need", description: "Send us a message on WhatsApp or fill the form on this page." },
        { title: "We tell you the cost", description: "We tell you the plan, who will do it and the price before we start." },
        { title: "We get the work done", description: "Our person does the work while we keep an eye on it." },
        { title: "You get photos and a bill", description: "We send photos, bills and a simple invoice when it is finished." },
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
      title: "Families we help",
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
      title: "Something to be done back home?",
      subtitle: "Tell us once. We handle it and keep you updated at every step.",
      buttonLabel: "Message us on WhatsApp",
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
      title: "Common questions",
      items: [
        {
          question: "Which cities do you cover?",
          answer: "Tell us the city. We will say yes or no before we take the job.",
        },
        {
          question: "How do I pay?",
          answer:
            "You agree the cost first. Then you get a bill that shows the shop or worker cost and our fee separately.",
        },
        {
          question: "How will I know the work is done?",
          answer: "When a job is finished we send photos, the bill and a message on WhatsApp.",
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
      title: "Talk to us",
      subtitle: "Send us the details. We will reply with the plan, the person and the cost.",
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
      tagline: "We help Gulf families take care of their people back home in India.",
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
