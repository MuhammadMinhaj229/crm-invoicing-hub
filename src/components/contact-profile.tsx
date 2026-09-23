import { X } from "lucide-react";

import { useWorkspaceSettings } from "../hooks/use-workspace-settings";
import { formatMoney } from "../lib/workspace-settings";
import type { ContactRow, InvoiceRow, RequestRow } from "../lib/crm";

/** Slide-over 360° view of a single customer. */
export function ContactProfile({
  contact,
  requests,
  invoices,
  onClose,
}: {
  contact: ContactRow;
  requests: RequestRow[];
  invoices: InvoiceRow[];
  onClose: () => void;
}) {
  const { settings } = useWorkspaceSettings();
  const outstanding = invoices.reduce((sum, invoice) => sum + Number(invoice.outstanding ?? 0), 0);
  const lifetime = invoices.reduce((sum, invoice) => sum + Number(invoice.amount_paid ?? 0), 0);

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-foreground/30" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col bg-card shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-foreground">{contact.name}</h2>
            <p className="text-sm text-muted-foreground">
              {contact.lifecycle_status} · customer since{" "}
              {new Date(contact.created_at).toLocaleDateString(settings.locale)}
            </p>
          </div>
          <button aria-label="Close" onClick={onClose} className="rounded-lg p-2 hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Lifetime paid" value={formatMoney(lifetime, settings)} />
            <Stat label="Outstanding" value={formatMoney(outstanding, settings)} />
            <Stat label="Service requests" value={String(requests.length)} />
            <Stat label="Invoices" value={String(invoices.length)} />
          </div>

          <Section title="Contact details">
            <Detail label="Phone" value={contact.phone} />
            <Detail label="WhatsApp" value={contact.whatsapp} />
            <Detail label="Email" value={contact.email} />
            <Detail
              label="Gulf residence"
              value={[contact.gulf_city, contact.gulf_country].filter(Boolean).join(", ") || null}
            />
            <Detail label="India coordination address" value={contact.india_address} />
          </Section>

          <Section title="Service history">
            {requests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No service requests yet.</p>
            ) : (
              <ul className="space-y-2">
                {requests.map((request) => (
                  <li
                    key={request.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{request.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {request.service_category ?? "Uncategorised"} ·{" "}
                        {new Date(request.created_at).toLocaleDateString(settings.locale)}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
                      {request.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Invoices & payments">
            {invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No invoices yet.</p>
            ) : (
              <ul className="space-y-2">
                {invoices.map((invoice) => (
                  <li
                    key={invoice.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {invoice.invoice_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {invoice.issued_at
                          ? new Date(invoice.issued_at).toLocaleDateString(settings.locale)
                          : "Not issued"}{" "}
                        · {invoice.status}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {formatMoney(Number(invoice.total ?? 0), settings)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Full story">
            <Timeline contactId={contact.id} />
          </Section>

          {contact.notes ? (
            <Section title="Notes">
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{contact.notes}</p>
            </Section>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-display text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-3 border-b border-border/60 py-1.5 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium text-foreground">{value ?? "—"}</span>
    </div>
  );
}
