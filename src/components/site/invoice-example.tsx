import { CheckCircle2, FileCheck2 } from "lucide-react";

export interface InvoiceExampleRow {
  id: string;
  title: string;
  text: string;
}

export function InvoiceExample({ title, text, rows }: { title: string; text: string; rows: InvoiceExampleRow[] }) {
  return (
    <section className="grid items-center gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
      <div>
        <p className="font-script text-2xl text-legacy-teal">Clear before work begins</p>
        <h2 className="mt-4 font-display text-4xl font-semibold leading-[1.06] text-legacy-ink sm:text-5xl">{title}</h2>
        <p className="mt-5 text-lg leading-8 text-legacy-ink/65">{text}</p>
        <div className="mt-7 flex items-center gap-3 text-sm font-semibold text-legacy-teal">
          <CheckCircle2 className="h-5 w-5 text-primary" /> You approve the total before work starts.
        </div>
      </div>
      <div className="overflow-hidden rounded-[1.5rem] border border-legacy-ink/10 bg-legacy-light shadow-lift">
        <div className="flex items-start justify-between border-b border-legacy-ink/8 bg-secondary/45 px-6 py-6 sm:px-8">
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Illustrative example only</p><p className="mt-2 font-display text-2xl font-semibold">Request cost breakdown</p></div>
          <FileCheck2 className="h-7 w-7 text-legacy-teal" />
        </div>
        <div className="px-6 sm:px-8">
          {rows.map((row) => (
            <div key={row.id} className="grid gap-1 border-b border-legacy-ink/8 py-5 last:border-0 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6">
              <p className="font-semibold text-legacy-ink">{row.title}</p>
              <p className="text-sm text-legacy-ink/55">{row.text}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between bg-legacy-deep px-6 py-5 text-legacy-light sm:px-8">
          <span className="font-semibold">Total</span><span className="text-sm text-legacy-light/70">Shown for your approval</span>
        </div>
      </div>
    </section>
  );
}