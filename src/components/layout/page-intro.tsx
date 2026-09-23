import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import { Reveal } from "../motion/primitives";

export function Breadcrumbs({ trail }: { trail: { label: string; href: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {trail.map((item, index) => (
          <li key={`${item.href}-${index}`} className="flex items-center gap-1">
            {index > 0 ? <ChevronRight className="h-4 w-4" aria-hidden="true" /> : null}
            {index === trail.length - 1 ? (
              <span aria-current="page" className="text-foreground">
                {item.label}
              </span>
            ) : (
              <Link to={item.href} className="hover:text-primary">
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
    <section className="legacy-grid relative overflow-hidden border-b border-legacy-light/10 bg-legacy-deep text-legacy-light">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
        {trail ? <Breadcrumbs trail={trail} /> : null}
        <Reveal>
          {eyebrow ? (
            <p className="text-xs font-bold uppercase tracking-widest text-legacy-peach">{eyebrow}</p>
          ) : null}
          <h1 className="mt-4 max-w-4xl font-display text-4xl font-semibold leading-tight sm:text-6xl">
            {title}
          </h1>
          {lead ? (
            <p className="mt-5 max-w-2xl text-lg leading-8 text-legacy-light/65">{lead}</p>
          ) : null}
          {children ? <div className="mt-6">{children}</div> : null}
        </Reveal>
      </div>
    </section>
  );
}
