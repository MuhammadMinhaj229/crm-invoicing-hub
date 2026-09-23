import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Handshake, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { PageHeader } from "../../components/app-shell";
import { EmptyState } from "../../components/empty-state";
import { useWorkspaceSettings } from "../../hooks/use-workspace-settings";
import { formatMoney } from "../../lib/workspace-settings";
import {
  AVAILABILITY_STATES,
  EMPTY_PROVIDER,
  VERIFICATION_STATES,
  deleteProvider,
  fetchProviderCategories,
  fetchProviders,
  providerToInput,
  saveProvider,
  type ProviderInput,
  type ProviderRow,
} from "../../lib/providers";
import { isSupabaseConfigured } from "../../lib/supabase";

export const Route = createFileRoute("/_authenticated/vendors")({
  head: () => ({
    meta: [
      { title: "Vendors & Partners — SAFAR N MANZIL" },
      {
        name: "description",
        content:
          "Directory of verified servicemen, contractors and partners with rate cards, availability and ratings.",
      },
      { property: "og:title", content: "Vendors & Partners — SAFAR N MANZIL" },
      { property: "og:description", content: "Verified servicemen and partners, ready to assign." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VendorsPage,
});

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";

function ProviderForm({
  initial,
  categories,
  onDone,
}: {
  initial: ProviderInput;
  categories: { id: string; name: string }[];
  onDone: () => void;
}) {
  const [form, setForm] = useState<ProviderInput>(initial);
  const queryClient = useQueryClient();

  const save = useMutation({
    mutationFn: () => saveProvider(form),
    onSuccess: async () => {
      toast.success(form.id ? "Partner updated" : "Partner added");
      await queryClient.invalidateQueries({ queryKey: ["providers"] });
      onDone();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not save"),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    save.mutate();
  }

  const set = (patch: Partial<ProviderInput>) => setForm({ ...form, ...patch });

  return (
    <form
      onSubmit={submit}
      className="mb-5 grid gap-4 rounded-xl border border-border bg-card p-5 shadow-sm sm:grid-cols-2"
    >
      <label className="text-sm font-medium text-foreground">
        Name
        <input
          required
          value={form.name}
          onChange={(e) => set({ name: e.target.value })}
          className={`mt-1.5 ${inputClass}`}
        />
      </label>
      <label className="text-sm font-medium text-foreground">
        Business name
        <input
          value={form.business_name}
          onChange={(e) => set({ business_name: e.target.value })}
          className={`mt-1.5 ${inputClass}`}
        />
      </label>
      <label className="text-sm font-medium text-foreground">
        Phone
        <input
          value={form.phone}
          onChange={(e) => set({ phone: e.target.value })}
          className={`mt-1.5 ${inputClass}`}
        />
      </label>
      <label className="text-sm font-medium text-foreground">
        WhatsApp
        <input
          value={form.whatsapp}
          placeholder="Same as phone if left blank"
          onChange={(e) => set({ whatsapp: e.target.value })}
          className={`mt-1.5 ${inputClass}`}
        />
      </label>
      <label className="text-sm font-medium text-foreground">
        Email
        <input
          type="email"
          value={form.email}
          onChange={(e) => set({ email: e.target.value })}
          className={`mt-1.5 ${inputClass}`}
        />
      </label>
      <label className="text-sm font-medium text-foreground">
        Trade / category
        <select
          value={form.category_id}
          onChange={(e) => set({ category_id: e.target.value })}
          className={`mt-1.5 ${inputClass}`}
        >
          <option value="">Not categorised</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium text-foreground">
        City
        <input
          value={form.city}
          onChange={(e) => set({ city: e.target.value })}
          className={`mt-1.5 ${inputClass}`}
        />
      </label>
      <label className="text-sm font-medium text-foreground">
        Service areas
        <input
          value={form.service_areas}
          placeholder="Comma separated — Hyderabad, Secunderabad"
          onChange={(e) => set({ service_areas: e.target.value })}
          className={`mt-1.5 ${inputClass}`}
        />
      </label>
      <label className="text-sm font-medium text-foreground">
        Verification
        <select
          value={form.verification_status}
          onChange={(e) => set({ verification_status: e.target.value })}
          className={`mt-1.5 ${inputClass}`}
        >
          {VERIFICATION_STATES.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium text-foreground">
        Availability
        <select
          value={form.availability}
          onChange={(e) => set({ availability: e.target.value })}
          className={`mt-1.5 ${inputClass}`}
        >
          {AVAILABILITY_STATES.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium text-foreground">
        Rate card label
        <input
          value={form.rate_card_label}
          placeholder="Visit charge / per hour / per delivery"
          onChange={(e) => set({ rate_card_label: e.target.value })}
          className={`mt-1.5 ${inputClass}`}
        />
      </label>
      <label className="text-sm font-medium text-foreground">
        Rate amount
        <input
          type="number"
          step="0.01"
          value={form.rate_card_amount}
          onChange={(e) => set({ rate_card_amount: e.target.value })}
          className={`mt-1.5 ${inputClass}`}
        />
      </label>
      <label className="text-sm font-medium text-foreground">
        Rating (0–5)
        <input
          type="number"
          step="0.1"
          min="0"
          max="5"
          value={form.rating}
          onChange={(e) => set({ rating: e.target.value })}
          className={`mt-1.5 ${inputClass}`}
        />
      </label>
      <label className="flex items-center gap-2 self-end text-sm font-medium text-foreground">
        <input
          type="checkbox"
          checked={form.is_primary}
          onChange={(e) => set({ is_primary: e.target.checked })}
          className="h-4 w-4 rounded border-input"
        />
        Primary partner for this trade
      </label>
      <label className="text-sm font-medium text-foreground sm:col-span-2">
        Notes
        <textarea
          rows={2}
          value={form.notes}
          onChange={(e) => set({ notes: e.target.value })}
          className={`mt-1.5 ${inputClass}`}
        />
      </label>
      <div className="flex gap-2 sm:col-span-2">
        <button
          type="submit"
          disabled={save.isPending}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {save.isPending ? "Saving…" : form.id ? "Save changes" : "Add partner"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function VendorsPage() {
  const { settings } = useWorkspaceSettings();
  const queryClient = useQueryClient();
  const connected = isSupabaseConfigured();
  const [editing, setEditing] = useState<ProviderInput | null>(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("");

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ["providers"],
    queryFn: fetchProviders,
    enabled: connected,
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["provider-categories"],
    queryFn: fetchProviderCategories,
    enabled: connected,
  });

  const categoryName = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  const remove = useMutation({
    mutationFn: (id: string) => deleteProvider(id),
    onSuccess: async () => {
      toast.success("Partner removed");
      await queryClient.invalidateQueries({ queryKey: ["providers"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not remove"),
  });

  const filtered = providers.filter((provider) => {
    const haystack =
      `${provider.name} ${provider.business_name ?? ""} ${provider.phone ?? ""} ${provider.city ?? ""} ${(provider.service_areas ?? []).join(" ")}`.toLowerCase();
    if (query && !haystack.includes(query.toLowerCase())) return false;
    if (categoryFilter && provider.category_id !== categoryFilter) return false;
    if (availabilityFilter && provider.availability !== availabilityFilter) return false;
    return true;
  });

  if (!connected) {
    return (
      <div>
        <PageHeader
          title="Vendors & Partners"
          description="Every serviceman, contractor and partner — verified, rated and ready to assign to work orders."
        />
        <EmptyState
          icon={Handshake}
          title="Connect your database to start"
          description="Open Settings → Connections, paste your project URL and keys, and run the one-time setup script."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Vendors & Partners"
        description="Every serviceman, contractor and partner — verified, rated and ready to assign to work orders."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, business, phone, city or area"
            className={`${inputClass} pl-9`}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
        >
          <option value="">All trades</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          value={availabilityFilter}
          onChange={(e) => setAvailabilityFilter(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
        >
          <option value="">Any availability</option>
          {AVAILABILITY_STATES.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
        <button
          onClick={() => setEditing(editing ? null : { ...EMPTY_PROVIDER })}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add partner
        </button>
      </div>

      {editing ? (
        <ProviderForm
          key={editing.id ?? "new"}
          initial={editing}
          categories={categories}
          onDone={() => setEditing(null)}
        />
      ) : null}

      {isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading directory…</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title={providers.length === 0 ? "The directory is empty" : "No partners match this filter"}
          description="Add your servicemen and partners — trade, service areas, rate card, availability, verification and rating. They become one-click assignable to customer work orders."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              categoryLabel={
                provider.category_id ? (categoryName.get(provider.category_id) ?? null) : null
              }
              money={(value) => formatMoney(value, settings)}
              onEdit={() => setEditing(providerToInput(provider))}
              onDelete={() => {
                if (confirm(`Remove ${provider.name} from the directory?`)) remove.mutate(provider.id);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProviderCard({
  provider,
  categoryLabel,
  money,
  onEdit,
  onDelete,
}: {
  provider: ProviderRow;
  categoryLabel: string | null;
  money: (value: number) => string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const rate = Object.entries(provider.rate_card ?? {})[0];
  return (
    <article className="flex flex-col rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">
            {provider.name}
            {provider.is_primary ? (
              <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium">
                Primary
              </span>
            ) : null}
          </p>
          <p className="text-xs text-muted-foreground">
            {provider.business_name ?? categoryLabel ?? "Independent"}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            provider.verification_status === "verified"
              ? "bg-primary/15 text-foreground"
              : provider.verification_status === "suspended"
                ? "bg-destructive/10 text-destructive"
                : "bg-accent text-accent-foreground"
          }`}
        >
          {provider.verification_status}
        </span>
      </div>

      <dl className="mt-3 space-y-1 text-sm">
        <Row label="Trade" value={categoryLabel} />
        <Row label="Phone" value={provider.phone} />
        <Row label="City" value={provider.city} />
        <Row
          label="Areas"
          value={provider.service_areas?.length ? provider.service_areas.join(", ") : null}
        />
        <Row
          label="Rate"
          value={rate ? `${rate[0]} · ${money(Number(rate[1]))}` : null}
        />
        <Row label="Rating" value={provider.rating !== null ? `${provider.rating} / 5` : null} />
        <Row label="Availability" value={provider.availability} />
      </dl>

      {provider.notes ? (
        <p className="mt-3 line-clamp-3 text-xs text-muted-foreground">{provider.notes}</p>
      ) : null}

      <div className="mt-4 flex gap-2">
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
        >
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
        {provider.whatsapp || provider.phone ? (
          <a
            href={`https://wa.me/${(provider.whatsapp ?? provider.phone ?? "").replace(/[^\d]/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
          >
            WhatsApp
          </a>
        ) : null}
        <button
          onClick={onDelete}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-3.5 w-3.5" /> Remove
        </button>
      </div>
    </article>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}
