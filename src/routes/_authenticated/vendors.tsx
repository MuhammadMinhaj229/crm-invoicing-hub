import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Handshake } from "lucide-react";

import { PageHeader } from "../../components/app-shell";
import { EmptyState } from "../../components/empty-state";
import { getSupabase } from "../../lib/supabase";

export const Route = createFileRoute("/_authenticated/vendors")({
  head: () => ({
    meta: [
      { title: "Vendors & Partners — SAFAR N MANZIL" },
      { name: "description", content: "Directory of verified servicemen, contractors and partners." },
      { property: "og:title", content: "Vendors & Partners — SAFAR N MANZIL" },
      { property: "og:description", content: "Directory of verified servicemen and partners." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VendorsPage,
});

interface ProviderRow {
  id: string;
  name: string;
  business_name: string | null;
  phone: string | null;
  city: string | null;
  verification_status: string;
  availability: string;
}

async function fetchProviders(): Promise<ProviderRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("providers")
    .select("id, name, business_name, phone, city, verification_status, availability")
    .order("name")
    .limit(200);
  if (error) return [];
  return (data ?? []) as ProviderRow[];
}

function VendorsPage() {
  const { data: providers = [], isLoading } = useQuery({
    queryKey: ["providers"],
    queryFn: fetchProviders,
  });

  return (
    <div>
      <PageHeader
        title="Vendors & Partners"
        description="Every serviceman, contractor and partner — verified, rated and ready to assign to work orders."
      />
      {isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading directory…</p>
      ) : providers.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title="The directory is empty"
          description="Add your first serviceman or partner — AC repair, legal, healthcare, parcel, grocery — with rate card, availability and verification status. They become one-click assignable to customer work orders."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Business</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">City</th>
                <th className="px-4 py-3 font-medium">Verification</th>
                <th className="px-4 py-3 font-medium">Availability</th>
              </tr>
            </thead>
            <tbody>
              {providers.map((provider) => (
                <tr key={provider.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{provider.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {provider.business_name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{provider.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{provider.city ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
                      {provider.verification_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{provider.availability}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
