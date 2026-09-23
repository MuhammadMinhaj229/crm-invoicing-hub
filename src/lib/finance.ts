/**
 * Money. Every figure here comes from a real row — invoices, payments,
 * expenses and partner payouts. Nothing is stored inside notes, and amounts
 * are kept to exact two-decimal values, never rounded floats on the way in.
 */
import { getSupabase } from "@/lib/supabase";

export interface InvoiceLine {
  description: string;
  quantity: number;
  unit_price: number;
}

export interface InvoiceRecord {
  id: string;
  contact_id: string;
  service_request_id: string | null;
  invoice_number: string;
  status: string;
  currency: string;
  subtotal: number;
  third_party_cost: number;
  safar_fee: number;
  tax: number;
  discount: number;
  total: number;
  amount_paid: number;
  outstanding: number;
  issued_at: string | null;
  due_at: string | null;
  created_at: string;
}

export interface ExpenseRecord {
  id: string;
  category: string;
  description: string;
  amount: number;
  spent_at: string;
}

export interface PayableRecord {
  id: string;
  provider_id: string;
  service_request_id: string | null;
  amount: number;
  status: string;
  paid_at: string | null;
}

export const INVOICE_STATUSES = [
  "draft",
  "sent",
  "partially_paid",
  "paid",
  "cancelled",
  "refunded",
] as const;

export const EXPENSE_CATEGORIES = [
  "operating",
  "capital_investment",
  "marketing",
  "salary",
  "other",
] as const;

export const PAYMENT_METHODS = ["upi", "bank_transfer", "cash", "card"] as const;

function money(value: number): number {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
}

async function must() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Connect your database in Settings first.");
  return supabase;
}

export async function fetchInvoiceRecords(): Promise<InvoiceRecord[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id, contact_id, service_request_id, invoice_number, status, currency, subtotal, third_party_cost, safar_fee, tax, discount, total, amount_paid, outstanding, issued_at, due_at, created_at",
    )
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as InvoiceRecord[];
}

export async function fetchExpenses(): Promise<ExpenseRecord[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("expenses")
    .select("id, category, description, amount, spent_at")
    .order("spent_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as ExpenseRecord[];
}

export async function fetchPayables(): Promise<PayableRecord[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("provider_payables")
    .select("id, provider_id, service_request_id, amount, status, paid_at")
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as PayableRecord[];
}

/** Next invoice number in the SNM-YYYY-#### series, based on existing rows. */
export async function nextInvoiceNumber(): Promise<string> {
  const supabase = getSupabase();
  const year = new Date().getFullYear();
  const prefix = `SNM-${year}-`;
  if (!supabase) return `${prefix}0001`;
  const { data } = await supabase
    .from("invoices")
    .select("invoice_number")
    .like("invoice_number", `${prefix}%`)
    .order("invoice_number", { ascending: false })
    .limit(1);
  const last = (data ?? [])[0] as { invoice_number?: string } | undefined;
  const seq = last?.invoice_number ? Number(last.invoice_number.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

export interface NewInvoiceInput {
  contactId: string;
  serviceRequestId?: string | null;
  lines: InvoiceLine[];
  thirdPartyCost?: number;
  safarFee?: number;
  tax?: number;
  discount?: number;
  dueAt?: string | null;
  issueNow?: boolean;
}

export async function createInvoice(input: NewInvoiceInput): Promise<string> {
  const supabase = await must();
  const lines = input.lines.filter((line) => line.description.trim());
  if (lines.length === 0) throw new Error("Add at least one line to the invoice.");

  const subtotal = money(lines.reduce((sum, line) => sum + line.quantity * line.unit_price, 0));
  const tax = money(input.tax ?? 0);
  const discount = money(input.discount ?? 0);
  const total = money(subtotal + tax - discount);

  const { data, error } = await supabase
    .from("invoices")
    .insert({
      contact_id: input.contactId,
      service_request_id: input.serviceRequestId ?? null,
      invoice_number: await nextInvoiceNumber(),
      status: input.issueNow ? "sent" : "draft",
      subtotal,
      third_party_cost: money(input.thirdPartyCost ?? 0),
      safar_fee: money(input.safarFee ?? 0),
      tax,
      discount,
      total,
      amount_paid: 0,
      outstanding: total,
      issued_at: input.issueNow ? new Date().toISOString() : null,
      due_at: input.dueAt ?? null,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not create the invoice.");

  const invoiceId = (data as { id: string }).id;
  const { error: lineError } = await supabase.from("invoice_items").insert(
    lines.map((line) => ({
      invoice_id: invoiceId,
      description: line.description.trim(),
      quantity: money(line.quantity),
      unit_price: money(line.unit_price),
      line_total: money(line.quantity * line.unit_price),
    })),
  );
  if (lineError) throw new Error(lineError.message);

  return invoiceId;
}

export async function fetchInvoiceLines(invoiceId: string): Promise<
  Array<{ id: string; description: string; quantity: number; unit_price: number; line_total: number }>
> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("invoice_items")
    .select("id, description, quantity, unit_price, line_total")
    .eq("invoice_id", invoiceId);
  return (data ?? []) as Array<{
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  }>;
}

/** Records a payment and keeps the invoice totals in step with it. */
export async function recordPayment(
  invoiceId: string,
  amount: number,
  method: string,
  reference?: string,
): Promise<void> {
  const supabase = await must();
  const value = money(amount);
  if (value <= 0) throw new Error("Enter an amount greater than zero.");

  const { data: invoice, error: readError } = await supabase
    .from("invoices")
    .select("total, amount_paid")
    .eq("id", invoiceId)
    .single();
  if (readError || !invoice) throw new Error(readError?.message ?? "Invoice not found.");

  const row = invoice as { total: number; amount_paid: number };
  const paid = money(Number(row.amount_paid) + value);
  const outstanding = money(Number(row.total) - paid);

  const { error: payError } = await supabase.from("payments").insert({
    invoice_id: invoiceId,
    amount: value,
    method,
    reference: reference?.trim() || null,
  });
  if (payError) throw new Error(payError.message);

  const { error: updateError } = await supabase
    .from("invoices")
    .update({
      amount_paid: paid,
      outstanding: outstanding > 0 ? outstanding : 0,
      status: outstanding <= 0 ? "paid" : "partially_paid",
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoiceId);
  if (updateError) throw new Error(updateError.message);
}

export async function addExpense(input: {
  category: string;
  description: string;
  amount: number;
  spentAt: string;
}): Promise<void> {
  const supabase = await must();
  const { error } = await supabase.from("expenses").insert({
    category: input.category,
    description: input.description.trim(),
    amount: money(input.amount),
    spent_at: input.spentAt,
  });
  if (error) throw new Error(error.message);
}

export async function addPayable(input: {
  providerId: string;
  serviceRequestId?: string | null;
  amount: number;
}): Promise<void> {
  const supabase = await must();
  const { error } = await supabase.from("provider_payables").insert({
    provider_id: input.providerId,
    service_request_id: input.serviceRequestId ?? null,
    amount: money(input.amount),
  });
  if (error) throw new Error(error.message);
}

export async function settlePayable(id: string): Promise<void> {
  const supabase = await must();
  const { error } = await supabase
    .from("provider_payables")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export interface FinanceSummary {
  billed: number;
  received: number;
  outstanding: number;
  spent: number;
  invested: number;
  owedToPartners: number;
  profit: number;
}

export function summarise(
  invoices: InvoiceRecord[],
  expenses: ExpenseRecord[],
  payables: PayableRecord[],
): FinanceSummary {
  const live = invoices.filter((invoice) => invoice.status !== "cancelled");
  const billed = money(live.reduce((sum, invoice) => sum + Number(invoice.total), 0));
  const received = money(live.reduce((sum, invoice) => sum + Number(invoice.amount_paid), 0));
  const outstanding = money(live.reduce((sum, invoice) => sum + Number(invoice.outstanding), 0));
  const invested = money(
    expenses
      .filter((expense) => expense.category === "capital_investment")
      .reduce((sum, expense) => sum + Number(expense.amount), 0),
  );
  const spent = money(
    expenses
      .filter((expense) => expense.category !== "capital_investment")
      .reduce((sum, expense) => sum + Number(expense.amount), 0),
  );
  const owedToPartners = money(
    payables
      .filter((payable) => payable.status === "owed")
      .reduce((sum, payable) => sum + Number(payable.amount), 0),
  );
  const thirdParty = money(live.reduce((sum, invoice) => sum + Number(invoice.third_party_cost), 0));

  return {
    billed,
    received,
    outstanding,
    spent,
    invested,
    owedToPartners,
    profit: money(received - thirdParty - spent),
  };
}
