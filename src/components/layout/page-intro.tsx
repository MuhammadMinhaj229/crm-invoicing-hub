import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import { Reveal } from "../motion/primitives";

export function Breadcrumbs({ trail }: { trail: { label: string; href: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-7">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-legacy-light/50">
        {trail.map((item, index) => (
          <li key={`${item.href}-${index}`} className="flex items-center gap-1.5">
            {index > 0 ? <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" /> : null}
            {index === trail.length - 1 ? (
              <span aria-current="page" className="text-legacy-light/85">
                {item.label}
              </span>
            ) : (
              <Link to={item.href} className="transition-colors hover:text-primary">
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageIntro({
  eyebrow,
  title,
  lead,
  trail,
  children,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  trail?: { label: string; href: string }[];
  children?: ReactNode;
}) {
  return (
    <section className="bg-legacy-warm px-3 pt-3 sm:px-4 sm:pt-4">
      <div className="legacy-grid relative overflow-hidden rounded-[1.75rem] bg-legacy-deep text-legacy-light sm:rounded-[2.5rem]">
        <div
          className="absolute -right-24 top-0 h-[28rem] w-[28rem] rounded-full opacity-35 blur-3xl"
          style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--legacy-coral) 40%, transparent), transparent 70%)" }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-[1280px] px-6 pb-14 pt-28 sm:px-10 sm:pb-20 sm:pt-36">
          {trail ? <Breadcrumbs trail={trail} /> : null}
          <Reveal>
            {eyebrow ? (
              <p className="inline-flex items-center gap-2.5 rounded-full bg-legacy-light/10 px-3.5 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-legacy-light/80">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {eyebrow}
              </p>
            ) : null}
            <h1 className="mt-6 max-w-3xl font-display text-[2.5rem] font-semibold leading-[1.05] tracking-[-0.02em] sm:text-6xl">
              {title}
            </h1>
            {lead ? (
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-legacy-light/65 sm:text-lg">{lead}</p>
            ) : null}
            {children ? <div className="mt-7">{children}</div> : null}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
