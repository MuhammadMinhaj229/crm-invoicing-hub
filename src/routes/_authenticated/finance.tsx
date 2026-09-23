import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { IndianRupee, Plus, Receipt, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "../../components/app-shell";
import { EmptyState } from "../../components/empty-state";
import { fetchContacts, fetchRequests } from "../../lib/crm";
import { fetchProviders } from "../../lib/providers";
import {
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  addExpense,
  addPayable,
  createInvoice,
  fetchExpenses,
  fetchInvoiceRecords,
  fetchPayables,
  recordPayment,
  settlePayable,
  summarise,
  type InvoiceLine,
} from "../../lib/finance";

export const Route = createFileRoute("/_authenticated/finance")({
  head: () => ({
    meta: [
      { title: "Finance — SAFAR N MANZIL" },
      {
        name: "description",
        content: "Money billed, money received, money spent, money invested and what partners are owed.",
      },
      { property: "og:title", content: "Finance — SAFAR N MANZIL" },
      { property: "og:description", content: "Invoices, payments, expenses, partner payouts and profit." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FinancePage,
});

const rupees = (value: number) => `₹${Number(value ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const fieldClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/25";

const TABS = [
  { id: "invoices", label: "Invoices" },
  { id: "expenses", label: "Money spent" },
  { id: "payables", label: "Partner payouts" },
] as const;

function FinancePage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("invoices");
  const queryClient = useQueryClient();

  const { data: invoices = [] } = useQuery({ queryKey: ["finance-invoices"], queryFn: fetchInvoiceRecords });
  const { data: expenses = [] } = useQuery({ queryKey: ["finance-expenses"], queryFn: fetchExpenses });
  const { data: payables = [] } = useQuery({ queryKey: ["finance-payables"], queryFn: fetchPayables });
  const { data: contacts = [] } = useQuery({ queryKey: ["contacts"], queryFn: fetchContacts });
  const { data: requests = [] } = useQuery({ queryKey: ["requests"], queryFn: fetchRequests });
  const { data: providers = [] } = useQuery({ queryKey: ["providers"], queryFn: fetchProviders });

  const totals = summarise(invoices, expenses, payables);
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["finance-invoices"] });
    void queryClient.invalidateQueries({ queryKey: ["finance-expenses"] });
    void queryClient.invalidateQueries({ queryKey: ["finance-payables"] });
  };

  const cards = [
    { label: "Billed", value: totals.billed, icon: Receipt },
    { label: "Received", value: totals.received, icon: IndianRupee },
    { label: "Still to collect", value: totals.outstanding, icon: Wallet },
    { label: "Profit", value: totals.profit, icon: IndianRupee },
  ];

  return (
    <div>
      <PageHeader
        title="Finance"
        description="Money in, money out, money invested — and what is still owed, both ways."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
              <card.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-3 font-display text-2xl font-bold text-foreground">{rupees(card.value)}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MiniStat label="Running costs" value={rupees(totals.spent)} />
        <MiniStat label="Invested in the business" value={rupees(totals.invested)} />
        <MiniStat label="Owed to partners" value={rupees(totals.owedToPartners)} />
      </div>

      <div className="mt-6 mb-5 flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition ${
              tab === item.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "invoices" ? (
        <InvoicesTab
          invoices={invoices}
          contacts={contacts}
          requests={requests}
          onChanged={refresh}
        />
      ) : null}
      {tab === "expenses" ? <ExpensesTab expenses={expenses} onChanged={refresh} /> : null}
      {tab === "payables" ? (
        <PayablesTab payables={payables} providers={providers} requests={requests} onChanged={refresh} />
      ) : null}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-display text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}

type ContactLike = { id: string; name: string };
type RequestLike = { id: string; title: string; contact_id: string };

function InvoicesTab({
  invoices,
  contacts,
  requests,
  onChanged,
}: {
  invoices: Awaited<ReturnType<typeof fetchInvoiceRecords>>;
  contacts: ContactLike[];
  requests: RequestLike[];
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [contactId, setContactId] = useState("");
  const [requestId, setRequestId] = useState("");
  const [lines, setLines] = useState<InvoiceLine[]>([{ description: "", quantity: 1, unit_price: 0 }]);
  const [thirdParty, setThirdParty] = useState("0");
  const [tax, setTax] = useState("0");
  const [discount, setDiscount] = useState("0");

  const contactName = (id: string) => contacts.find((c) => c.id === id)?.name ?? "Customer";

  const create = useMutation({
    mutationFn: () =>
      createInvoice({
        contactId,
        serviceRequestId: requestId || null,
        lines,
        thirdPartyCost: Number(thirdParty),
        tax: Number(tax),
        discount: Number(discount),
        issueNow: true,
      }),
    onSuccess: () => {
      toast.success("Invoice created");
      setOpen(false);
      setLines([{ description: "", quantity: 1, unit_price: 0 }]);
      setContactId("");
      setRequestId("");
      onChanged();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const pay = useMutation({
    mutationFn: (vars: { id: string; amount: number; method: string }) =>
      recordPayment(vars.id, vars.amount, vars.method),
    onSuccess: () => {
      toast.success("Payment recorded");
      onChanged();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.unit_price, 0);
  const total = subtotal + Number(tax || 0) - Number(discount || 0);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!contactId) {
      toast.error("Choose the customer this invoice is for.");
      return;
    }
    create.mutate();
  }

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="brand-button inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
      >
        <Plus className="h-4 w-4" />
        New invoice
      </button>

      {open ? (
        <form onSubmit={submit} className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Customer
              <select
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                className={`mt-1.5 ${fieldClass}`}
              >
                <option value="">Choose a customer</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              Job it belongs to (optional)
              <select
                value={requestId}
                onChange={(e) => setRequestId(e.target.value)}
                className={`mt-1.5 ${fieldClass}`}
              >
                <option value="">Not linked to a job</option>
                {requests
                  .filter((request) => !contactId || request.contact_id === contactId)
                  .map((request) => (
                    <option key={request.id} value={request.id}>
                      {request.title}
                    </option>
                  ))}
              </select>
            </label>
          </div>

          <div className="mt-5 space-y-2">
            {lines.map((line, index) => (
              <div key={index} className="grid gap-2 sm:grid-cols-[1fr_90px_120px_40px]">
                <input
                  value={line.description}
                  placeholder="What was done"
                  onChange={(e) => {
                    const next = [...lines];
                    next[index] = { ...line, description: e.target.value };
                    setLines(next);
                  }}
                  className={fieldClass}
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.quantity}
                  onChange={(e) => {
                    const next = [...lines];
                    next[index] = { ...line, quantity: Number(e.target.value) };
                    setLines(next);
                  }}
                  className={fieldClass}
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.unit_price}
                  onChange={(e) => {
                    const next = [...lines];
                    next[index] = { ...line, unit_price: Number(e.target.value) };
                    setLines(next);
                  }}
                  className={fieldClass}
                />
                <button
                  type="button"
                  onClick={() => setLines(lines.filter((_, i) => i !== index))}
                  className="rounded-lg border border-border text-muted-foreground hover:text-destructive"
                  aria-label="Remove line"
                >
                  <Trash2 className="mx-auto h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setLines([...lines, { description: "", quantity: 1, unit_price: 0 }])}
              className="text-sm font-medium text-primary"
            >
              + Add another line
            </button>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <label className="text-sm font-medium">
              Paid to others (cost)
              <input value={thirdParty} onChange={(e) => setThirdParty(e.target.value)} className={`mt-1.5 ${fieldClass}`} />
            </label>
            <label className="text-sm font-medium">
              Tax
              <input value={tax} onChange={(e) => setTax(e.target.value)} className={`mt-1.5 ${fieldClass}`} />
            </label>
            <label className="text-sm font-medium">
              Discount
              <input value={discount} onChange={(e) => setDiscount(e.target.value)} className={`mt-1.5 ${fieldClass}`} />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <p className="text-sm text-muted-foreground">
              Total <span className="font-display text-lg font-bold text-foreground">{rupees(total)}</span>
            </p>
            <button
              type="submit"
              disabled={create.isPending}
              className="brand-button rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {create.isPending ? "Saving…" : "Create invoice"}
            </button>
          </div>
        </form>
      ) : null}

      {invoices.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No invoices yet"
          description="Create the first invoice for a customer and every payment against it will be tracked here."
        />
      ) : (
        <div className="space-y-2">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold">
                  {invoice.invoice_number} · {contactName(invoice.contact_id)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {rupees(invoice.total)} · paid {rupees(invoice.amount_paid)} · left{" "}
                  {rupees(invoice.outstanding)} · {invoice.status.replace("_", " ")}
                </p>
              </div>
              {invoice.outstanding > 0 && invoice.status !== "cancelled" ? (
                <button
                  type="button"
                  onClick={() =>
                    pay.mutate({ id: invoice.id, amount: invoice.outstanding, method: PAYMENT_METHODS[0] })
                  }
                  className="rounded-lg border border-primary px-3 py-1.5 text-xs font-semibold text-primary"
                >
                  Mark fully paid
                </button>
              ) : (
                <span className="text-xs font-semibold text-primary">Settled</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ExpensesTab({
  expenses,
  onChanged,
}: {
  expenses: Awaited<ReturnType<typeof fetchExpenses>>;
  onChanged: () => void;
}) {
  const [form, setForm] = useState({
    category: EXPENSE_CATEGORIES[0] as string,
    description: "",
    amount: "",
    spentAt: new Date().toISOString().slice(0, 10),
  });

  const add = useMutation({
    mutationFn: () =>
      addExpense({
        category: form.category,
        description: form.description,
        amount: Number(form.amount),
        spentAt: form.spentAt,
      }),
    onSuccess: () => {
      toast.success("Saved");
      setForm({ ...form, description: "", amount: "" });
      onChanged();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-5">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!form.description.trim() || !Number(form.amount)) {
            toast.error("Add what it was for and how much.");
            return;
          }
          add.mutate();
        }}
        className="grid gap-3 rounded-xl border border-border bg-card p-5 shadow-sm sm:grid-cols-[1fr_170px_140px_130px_auto]"
      >
        <input
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="What was the money for?"
          className={fieldClass}
        />
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className={fieldClass}
        >
          {EXPENSE_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category === "capital_investment" ? "investment" : category}
            </option>
          ))}
        </select>
        <input
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          placeholder="Amount"
          className={fieldClass}
        />
        <input
          type="date"
          value={form.spentAt}
          onChange={(e) => setForm({ ...form, spentAt: e.target.value })}
          className={fieldClass}
        />
        <button
          type="submit"
          className="brand-button rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Add
        </button>
      </form>

      {expenses.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Nothing recorded yet"
          description="Every rupee spent or invested goes here, so profit is always a real number."
        />
      ) : (
        <div className="space-y-2">
          {expenses.map((expense) => (
            <div
              key={expense.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm"
            >
              <span className="font-medium">{expense.description}</span>
              <span className="text-muted-foreground">
                {expense.category === "capital_investment" ? "investment" : expense.category} ·{" "}
                {expense.spent_at} · {rupees(expense.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PayablesTab({
  payables,
  providers,
  requests,
  onChanged,
}: {
  payables: Awaited<ReturnType<typeof fetchPayables>>;
  providers: Array<{ id: string; name: string }>;
  requests: RequestLike[];
  onChanged: () => void;
}) {
  const [providerId, setProviderId] = useState("");
  const [requestId, setRequestId] = useState("");
  const [amount, setAmount] = useState("");

  const add = useMutation({
    mutationFn: () =>
      addPayable({ providerId, serviceRequestId: requestId || null, amount: Number(amount) }),
    onSuccess: () => {
      toast.success("Recorded");
      setAmount("");
      onChanged();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const settle = useMutation({
    mutationFn: (id: string) => settlePayable(id),
    onSuccess: () => {
      toast.success("Marked as paid");
      onChanged();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const providerName = (id: string) => providers.find((p) => p.id === id)?.name ?? "Partner";

  return (
    <div className="space-y-5">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!providerId || !Number(amount)) {
            toast.error("Choose a partner and an amount.");
            return;
          }
          add.mutate();
        }}
        className="grid gap-3 rounded-xl border border-border bg-card p-5 shadow-sm sm:grid-cols-[1fr_1fr_140px_auto]"
      >
        <select value={providerId} onChange={(e) => setProviderId(e.target.value)} className={fieldClass}>
          <option value="">Choose a partner</option>
          {providers.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.name}
            </option>
          ))}
        </select>
        <select value={requestId} onChange={(e) => setRequestId(e.target.value)} className={fieldClass}>
          <option value="">Not linked to a job</option>
          {requests.map((request) => (
            <option key={request.id} value={request.id}>
              {request.title}
            </option>
          ))}
        </select>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          className={fieldClass}
        />
        <button
          type="submit"
          className="brand-button rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Add
        </button>
      </form>

      {payables.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No partner payouts yet"
          description="Record what each service partner is owed for a job, and mark it paid when you settle."
        />
      ) : (
        <div className="space-y-2">
          {payables.map((payable) => (
            <div
              key={payable.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm"
            >
              <span className="font-medium">{providerName(payable.provider_id)}</span>
              <span className="flex items-center gap-3 text-muted-foreground">
                {rupees(payable.amount)} · {payable.status}
                {payable.status === "owed" ? (
                  <button
                    type="button"
                    onClick={() => settle.mutate(payable.id)}
                    className="rounded-lg border border-primary px-3 py-1 text-xs font-semibold text-primary"
                  >
                    Mark paid
                  </button>
                ) : null}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
