import { createContext, useContext, useState, type CSSProperties, type ElementType, type ReactNode } from "react";
import { ChevronDown, ImageIcon } from "lucide-react";

import { useSiteContact } from "../../hooks/use-site-contact";
import { buildMailUrl, buildTelUrl, buildWhatsAppUrl } from "../../lib/whatsapp/url-builder";
import { generalEnquiryMessage } from "../../lib/whatsapp/templates";
import { submitWebsiteEnquiry } from "../../lib/website-capture";
import { track } from "../../lib/analytics";
import type { Block, BlockLayout, ButtonItem } from "../../lib/page-builder/model";
import { cn } from "../../lib/utils";
import { StoryCarousel } from "../site/story-carousel";
import { InvoiceExample } from "../site/invoice-example";

/* ---------- editing context ---------- */

interface EditApi {
  editing: boolean;
  /** Patch a single prop path on a block, e.g. ("title", "x") or ("items.2.title", "x"). */
  setProp: (blockId: string, path: string, value: string) => void;
}
const EditCtx = createContext<EditApi>({ editing: false, setProp: () => undefined });
export const EditProvider = EditCtx.Provider;
const BlockIdCtx = createContext<string>("");

/** Text that is plain on the live site and click-to-type in the editor. */
export function Editable({
  path,
  value,
  as: Tag = "span",
  className,
  placeholder = "Type here…",
  multiline = false,
}: {
  path: string;
  value: string;
  as?: ElementType;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
}) {
  const { editing, setProp } = useContext(EditCtx);
  const blockId = useContext(BlockIdCtx);
  if (!editing) {
    if (!value) return null;
    return <Tag className={cn(multiline && "whitespace-pre-line", className)}>{value}</Tag>;
  }
  return (
    <Tag
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !multiline) {
          e.preventDefault();
          (e.target as HTMLElement).blur();
        }
      }}
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        const next = e.currentTarget.innerText.replace(/\u00a0/g, " ").trimEnd();
        if (next !== value) setProp(blockId, path, next);
      }}
      className={cn(
        "builder-editable cursor-text rounded outline-none ring-primary/40 hover:ring-2 focus:ring-2",
        multiline && "whitespace-pre-line",
        className,
      )}
    >
      {value}
    </Tag>
  );
}

/* ---------- links & buttons ---------- */

export function useResolveHref() {
  const contact = useSiteContact();
  return (href: string): { url: string; external: boolean } => {
    const h = href.trim();
    if (h === "whatsapp") {
      const url = buildWhatsAppUrl(contact.whatsapp, generalEnquiryMessage());
      return url ? { url, external: true } : { url: "/contact", external: false };
    }
    if (h === "phone") return { url: buildTelUrl(contact.phone) ?? "/contact", external: false };
    if (h === "email") return { url: buildMailUrl(contact.email, "Help for my family") ?? "/contact", external: false };
    if (/^https?:\/\//.test(h)) return { url: h, external: true };
    return { url: h || "#", external: false };
  };
}

function Buttons({ items, basePath, align }: { items: ButtonItem[]; basePath: string; align: BlockLayout["align"] }) {
  const resolve = useResolveHref();
  const { editing } = useContext(EditCtx);
  if (!items.length) return null;
  return (
    <div
      className={cn(
        "mt-6 flex flex-wrap gap-3",
        align === "center" && "justify-center",
        align === "right" && "justify-end",
      )}
    >
      {items.map((b, i) => {
        const { url, external } = resolve(b.href);
        const cls = cn(
          "inline-flex items-center justify-center rounded-full font-semibold transition-colors",
          b.size === "sm" && "min-h-[36px] px-4 text-sm",
          b.size === "md" && "min-h-[44px] px-6 text-sm",
          b.size === "lg" && "min-h-[52px] px-8 text-base",
          b.style === "solid" && "bg-primary text-primary-foreground hover:opacity-90",
          b.style === "outline" && "border-2 border-current text-foreground hover:bg-foreground/5",
          b.style === "text" && "px-2 text-primary underline-offset-4 hover:underline",
        );
        const label = <Editable path={`${basePath}.${i}.label`} value={b.label} />;
        return editing ? (
          <span key={b.id} className={cls}>
            {label}
          </span>
        ) : (
          <a
            key={b.id}
            href={url}
            className={cls}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            onClick={() => track("cta.clicked", { label: b.label, href: b.href })}
          >
            {b.label}
          </a>
        );
      })}
    </div>
  );
}

function Picture({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const { editing } = useContext(EditCtx);
  if (!src) {
    return editing ? (
      <div className={cn("flex aspect-[4/3] items-center justify-center rounded-3xl border-2 border-dashed border-border text-muted-foreground", className)}>
        <ImageIcon className="h-8 w-8" />
      </div>
    ) : null;
  }
  return <img src={src} alt={alt} loading="lazy" className={cn("w-full rounded-3xl object-cover", className)} />;
}

/* ---------- layout wrapper ---------- */

const BG: Record<BlockLayout["background"], string> = {
  none: "",
  muted: "bg-muted",
  card: "bg-card",
  primary: "bg-primary text-primary-foreground",
  accent: "bg-accent text-accent-foreground",
};

function Frame({ block, children }: { block: Block; children: ReactNode }) {
  const l = block.layout;
  const style: CSSProperties = { paddingTop: `${l.spaceTop * 1}rem`, paddingBottom: `${l.spaceBottom * 1}rem` };
  return (
    <section
      id={block.anchor || undefined}
      style={style}
      className={cn(BG[l.background], l.hideMobile && "@max-3xl:hidden", l.hideDesktop && "@3xl:hidden")}
    >
      <div
        className={cn(
          "mx-auto px-5",
          l.width === "narrow" && "max-w-3xl",
          l.width === "normal" && "max-w-6xl",
          l.width === "full" && "max-w-none",
          l.align === "center" && "text-center",
          l.align === "right" && "text-right",
        )}
      >
        {children}
      </div>
    </section>
  );
}

/* ---------- blocks ---------- */

function FaqList({ items }: { items: { id: string; question: string; answer: string }[] }) {
  const { editing } = useContext(EditCtx);
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="mt-6 divide-y divide-border rounded-3xl border border-border bg-card text-left text-card-foreground">
      {items.map((f, i) => {
        const isOpen = editing || open === f.id;
        return (
          <div key={f.id} className="px-5 py-4">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 text-left font-semibold"
              onClick={() => !editing && setOpen(isOpen ? null : f.id)}
              aria-expanded={isOpen}
            >
              <Editable path={`items.${i}.question`} value={f.question} />
              {!editing && <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", isOpen && "rotate-180")} />}
            </button>
            {isOpen && <Editable as="p" multiline path={`items.${i}.answer`} value={f.answer} className="mt-2 block text-muted-foreground" />}
          </div>
        );
      })}
    </div>
  );
}

function EnquiryForm({ submitLabel }: { submitLabel: string }) {
  const { editing } = useContext(EditCtx);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  return (
    <form
      className="mx-auto mt-6 grid max-w-xl gap-3 text-left"
      onSubmit={async (e) => {
        e.preventDefault();
        if (editing) return;
        const fd = new FormData(e.currentTarget);
        const name = String(fd.get("name") ?? "").trim();
        const phone = String(fd.get("phone") ?? "").trim();
        const need = String(fd.get("need") ?? "").trim();
        if (!name || !phone || !need || fd.get("company")) return;
        setState("sending");
        const res = await submitWebsiteEnquiry({ name, phone, need, city: String(fd.get("city") ?? "") });
        setState(res.saved ? "done" : "error");
      }}
    >
      <input name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <input name="name" required maxLength={100} placeholder="Your name" className="min-h-[48px] rounded-xl border border-input bg-background px-4" />
      <input name="phone" required maxLength={20} placeholder="Your WhatsApp number" className="min-h-[48px] rounded-xl border border-input bg-background px-4" />
      <input name="city" maxLength={80} placeholder="Family's city in India" className="min-h-[48px] rounded-xl border border-input bg-background px-4" />
      <textarea name="need" required maxLength={1000} rows={4} placeholder="What does your family need?" className="rounded-xl border border-input bg-background px-4 py-3" />
      <button type="submit" disabled={state === "sending"} className="min-h-[48px] rounded-full bg-primary px-6 font-semibold text-primary-foreground">
        {state === "sending" ? "Sending…" : submitLabel}
      </button>
      {state === "done" && <p className="text-sm text-primary">Thank you — we will message you soon.</p>}
      {state === "error" && <p className="text-sm text-destructive">We could not save this right now. Please message us on WhatsApp.</p>}
    </form>
  );
}

function videoEmbed(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}

function BlockBody({ block }: { block: Block }) {
  const { editing } = useContext(EditCtx);
  const align = block.layout.align;
  switch (block.type) {
    case "cinematicHero": {
      const p = block.props;
      return (
        <div className="legacy-grid relative grid min-h-[38rem] items-end overflow-hidden bg-legacy-deep px-5 py-12 text-legacy-light @3xl:grid-cols-[0.88fr_1.12fr] @3xl:items-center @3xl:px-12">
          <div className="relative z-10">
            <Editable as="p" path="eyebrow" value={p.eyebrow} className="block text-xs font-bold uppercase tracking-widest text-legacy-peach" />
            <h1 className="mt-5 font-display text-5xl font-semibold leading-none @3xl:text-7xl"><Editable path="title" value={p.title} /><Editable as="span" path="accent" value={p.accent} className="block text-primary" /></h1>
            <Editable as="p" multiline path="text" value={p.text} className="mt-5 block max-w-xl text-lg leading-8 text-legacy-light/70" />
            <Buttons items={p.buttons} basePath="buttons" align="left" />
          </div>
          <Picture src={p.image} alt={p.imageAlt} className="relative z-0 mt-8 max-h-[36rem] rounded-none object-contain object-bottom @3xl:mt-0" />
        </div>
      );
    }
    case "careJourney": {
      const p = block.props;
      return (
        <div className="bg-legacy-deep px-5 py-16 text-legacy-light @3xl:px-12">
          <Editable as="p" path="eyebrow" value={p.eyebrow} className="block text-xs font-bold uppercase tracking-widest text-legacy-peach" />
          <Editable as="h2" path="title" value={p.title} className="mt-4 block max-w-3xl font-display text-4xl font-semibold @3xl:text-6xl" />
          <Editable as="p" multiline path="text" value={p.text} className="mt-4 block max-w-2xl text-legacy-light/65" />
          <div className="mt-12 grid @3xl:grid-cols-5">
            {p.items.map((item, index) => <article key={item.id} className="border-l border-legacy-light/15 py-6 pl-6 @3xl:border-l-0 @3xl:border-t @3xl:px-4"><span className="text-xs font-bold text-primary">0{index + 1}</span><Editable as="h3" path={`items.${index}.title`} value={item.title} className="mt-2 block font-display text-xl font-semibold" /><Editable as="p" multiline path={`items.${index}.text`} value={item.text} className="mt-2 block text-sm leading-6 text-legacy-light/60" /></article>)}
          </div>
        </div>
      );
    }
    case "serviceStory": {
      const p = block.props;
      return (
        <div className="px-5 py-16 @3xl:px-12">
          <Editable as="p" path="eyebrow" value={p.eyebrow} className="block text-xs font-bold uppercase tracking-widest text-legacy-teal" />
          <Editable as="h2" path="title" value={p.title} className="mt-4 block font-display text-4xl font-semibold @3xl:text-6xl" />
          <Editable as="p" multiline path="text" value={p.text} className="mt-4 block max-w-2xl text-lg text-legacy-ink/65" />
          <div className="mt-10 grid overflow-hidden border border-legacy-ink/15 @3xl:grid-cols-2">
            {p.items.map((item, index) => <article key={item.id} className="grid min-h-52 grid-cols-[1fr_0.8fr] border-b border-legacy-ink/10 bg-legacy-warm p-5 @3xl:odd:border-r"><div><span className="text-xs font-bold text-primary">0{index + 1}</span><Editable as="h3" path={`items.${index}.title`} value={item.title} className="mt-2 block font-display text-xl font-semibold" /><Editable as="p" multiline path={`items.${index}.text`} value={item.text} className="mt-2 block text-sm text-legacy-ink/65" /></div>{item.image ? <img src={item.image} alt="" className="h-full w-full object-contain" /> : null}</article>)}
          </div>
        </div>
      );
    }
    case "trustDossier": {
      const p = block.props;
      return <div className="grid gap-10 @3xl:grid-cols-[0.75fr_1.25fr]"><div><Editable as="p" path="eyebrow" value={p.eyebrow} className="block text-xs font-bold uppercase tracking-widest text-legacy-teal" /><Editable as="h2" path="title" value={p.title} className="mt-4 block font-display text-4xl font-semibold @3xl:text-5xl" /><Editable as="p" multiline path="text" value={p.text} className="mt-4 block text-legacy-ink/65" /></div><div className="border border-legacy-ink/15 bg-legacy-light">{p.items.map((item, index) => <article key={item.id} className="grid grid-cols-[3rem_1fr] border-b border-legacy-ink/10 p-5 last:border-0"><span className="text-xs font-bold text-primary">0{index + 1}</span><div><Editable as="h3" path={`items.${index}.title`} value={item.title} className="block font-display text-lg font-semibold" /><Editable as="p" multiline path={`items.${index}.text`} value={item.text} className="mt-2 block text-sm text-legacy-ink/65" /></div></article>)}</div></div>;
    }
    case "proofReturn": {
      const p = block.props;
      return <div className="grid items-center gap-10 bg-legacy-deep px-5 py-16 text-legacy-light @3xl:grid-cols-2 @3xl:px-12"><Picture src={p.image} alt={p.imageAlt} className="max-h-[34rem] rounded-none object-contain" /><div><Editable as="p" path="eyebrow" value={p.eyebrow} className="block text-xs font-bold uppercase tracking-widest text-legacy-peach" /><Editable as="h2" path="title" value={p.title} className="mt-4 block font-display text-4xl font-semibold @3xl:text-6xl" /><Editable as="p" multiline path="text" value={p.text} className="mt-4 block text-legacy-light/65" /><div className="mt-7 divide-y divide-legacy-light/15 border-y border-legacy-light/15">{p.items.map((item, index) => <Editable key={item.id} as="p" path={`items.${index}.title`} value={item.title} className="block py-4" />)}</div></div></div>;
    }
    case "storyCarousel": {
      const p = block.props;
      return <StoryCarousel slides={p.items} editing={editing} />;
    }
    case "invoiceExample": {
      const p = block.props;
      return <InvoiceExample title={p.title} text={p.text} rows={p.items} />;
    }
    case "hero":
    case "imageText": {
      const p = block.props;
      const Title = block.type === "hero" ? "h1" : "h2";
      return (
        <div className={cn("grid items-center gap-10 @3xl:grid-cols-2", p.imageSide === "left" && "@3xl:[&>*:first-child]:order-2")}>
          <div>
            <Editable as="p" path="eyebrow" value={p.eyebrow} className="mb-3 block text-sm font-bold uppercase tracking-wider text-primary" placeholder="Small line" />
            <Editable
              as={Title}
              path="title"
              value={p.title}
              className={cn("block font-display font-bold leading-tight", block.type === "hero" ? "text-4xl @3xl:text-6xl" : "text-3xl @3xl:text-4xl")}
            />
            <Editable as="p" multiline path="text" value={p.text} className="mt-4 block text-lg opacity-80" />
            <Buttons items={p.buttons} basePath="buttons" align={align} />
          </div>
          <Picture src={p.image} alt={p.imageAlt} />
        </div>
      );
    }
    case "heading": {
      const p = block.props;
      const size = p.level === "h1" ? "text-4xl @3xl:text-5xl" : p.level === "h2" ? "text-3xl @3xl:text-4xl" : "text-2xl";
      return (
        <div>
          <Editable as="p" path="eyebrow" value={p.eyebrow} className="mb-2 block text-sm font-bold uppercase tracking-wider text-primary" placeholder="Small line" />
          <Editable as={p.level} path="text" value={p.text} className={cn("block font-display font-bold leading-tight", size)} />
        </div>
      );
    }
    case "text":
      return <Editable as="p" multiline path="text" value={block.props.text} className="block max-w-3xl text-lg leading-relaxed opacity-85 [text-align:inherit] mx-[inherit]" />;
    case "image":
      return (
        <figure>
          <Picture src={block.props.src} alt={block.props.alt} />
          <Editable as="figcaption" path="caption" value={block.props.caption} className="mt-2 block text-sm text-muted-foreground" placeholder="Caption" />
        </figure>
      );
    case "buttons":
      return <Buttons items={block.props.items} basePath="items" align={align} />;
    case "cards": {
      const p = block.props;
      const cols = { 1: "@3xl:grid-cols-1", 2: "@3xl:grid-cols-2", 3: "@3xl:grid-cols-3", 4: "@3xl:grid-cols-4" }[p.columns];
      return (
        <div>
          <Editable as="h2" path="title" value={p.title} className="block font-display text-3xl font-bold @3xl:text-4xl" placeholder="Section title" />
          <Editable as="p" multiline path="subtitle" value={p.subtitle} className="mt-3 block max-w-2xl text-lg opacity-80" placeholder="Subtitle" />
          <div className={cn("mt-8 grid gap-5 text-left", cols)}>
            {p.items.map((c, i) => {
              const inner = (
                <>
                  {c.image ? <img src={c.image} alt="" loading="lazy" className="mb-4 aspect-[4/3] w-full rounded-2xl object-cover" /> : null}
                  <Editable as="h3" path={`items.${i}.title`} value={c.title} className="block text-lg font-bold" />
                  <Editable as="p" multiline path={`items.${i}.text`} value={c.text} className="mt-2 block text-muted-foreground" placeholder="Description" />
                </>
              );
              const cls = "block rounded-3xl border border-border bg-card p-5 text-card-foreground";
              return c.href && !editing ? (
                <a key={c.id} href={c.href} className={cn(cls, "transition-shadow hover:shadow-lg")}>
                  {inner}
                </a>
              ) : (
                <div key={c.id} className={cls}>
                  {inner}
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    case "faq":
      return (
        <div>
          <Editable as="h2" path="title" value={block.props.title} className="block font-display text-3xl font-bold" placeholder="Title" />
          <FaqList items={block.props.items} />
        </div>
      );
    case "contactStrip":
      return (
        <div className="py-4">
          <Editable as="h2" path="title" value={block.props.title} className="block font-display text-3xl font-bold" />
          <Editable as="p" multiline path="text" value={block.props.text} className="mt-3 block text-lg opacity-90" />
          <Buttons items={block.props.buttons} basePath="buttons" align={align} />
        </div>
      );
    case "enquiryForm":
      return (
        <div>
          <Editable as="h2" path="title" value={block.props.title} className="block font-display text-3xl font-bold" />
          <Editable as="p" multiline path="text" value={block.props.text} className="mt-2 block opacity-80" />
          <EnquiryForm submitLabel={block.props.submitLabel} />
        </div>
      );
    case "video": {
      const src = videoEmbed(block.props.url);
      return (
        <figure>
          {src ? (
            <div className="aspect-video overflow-hidden rounded-3xl">
              <iframe src={src} title={block.props.caption || "Video"} className="h-full w-full" allowFullScreen loading="lazy" />
            </div>
          ) : editing ? (
            <div className="flex aspect-video items-center justify-center rounded-3xl border-2 border-dashed border-border text-muted-foreground">Add a YouTube or Vimeo link in settings</div>
          ) : null}
          <Editable as="figcaption" path="caption" value={block.props.caption} className="mt-2 block text-sm text-muted-foreground" placeholder="Caption" />
        </figure>
      );
    }
    case "spacer":
      return <div style={{ height: `${block.props.size * 1}rem` }} aria-hidden />;
    case "divider":
      return <hr className="border-border" />;
    case "navigation":
      return (
        <nav className="flex flex-wrap gap-4 text-sm font-semibold">
          {block.props.links.map((l, i) => (
            <Editable key={l.id} path={`links.${i}.label`} value={l.label} />
          ))}
        </nav>
      );
  }
}

export function RenderBlock({ block }: { block: Block }) {
  return (
    <BlockIdCtx.Provider value={block.id}>
      <Frame block={block}>
        <BlockBody block={block} />
      </Frame>
    </BlockIdCtx.Provider>
  );
}

export function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <div className="@container">
      {blocks
        .filter((b) => !b.hidden && b.type !== "navigation")
        .map((b) => (
          <RenderBlock key={b.id} block={b} />
        ))}
    </div>
  );
}
