import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Search, Send, UserPlus } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { PageHeader } from "../../components/app-shell";
import { EmptyState } from "../../components/empty-state";
import {
  CHANNELS,
  fetchConversations,
  fetchMessages,
  linkConversationToContact,
  sendMessage,
  type ConversationRow,
} from "../../lib/messaging";
import { fetchContacts } from "../../lib/crm";
import { isSupabaseConfigured } from "../../lib/supabase";

export const Route = createFileRoute("/_authenticated/inbox")({
  head: () => ({
    meta: [
      { title: "Inbox — SAFAR N MANZIL" },
      { name: "description", content: "One place for every WhatsApp and social message from families." },
      { property: "og:title", content: "Inbox — SAFAR N MANZIL" },
      { property: "og:description", content: "Every conversation with one customer, in one thread." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InboxPage,
});

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  facebook: "Facebook",
  email: "Email",
  web: "Website",
};

function channelLabel(value: string): string {
  return CHANNEL_LABELS[value] ?? value;
}

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";

function InboxPage() {
  const connected = isSupabaseConfigured();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const conversations = useQuery({
    queryKey: ["conversations"],
    queryFn: () => fetchConversations(),
    enabled: connected,
    refetchInterval: 20000,
  });

  const contacts = useQuery({ queryKey: ["contacts"], queryFn: () => fetchContacts(), enabled: connected });

  const list = useMemo(() => {
    const rows = conversations.data ?? [];
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (channel !== "all" && row.channel !== channel) return false;
      if (!term) return true;
      return `${row.display_name ?? ""} ${row.phone ?? ""}`.toLowerCase().includes(term);
    });
  }, [conversations.data, search, channel]);

  const active: ConversationRow | null = useMemo(
    () => list.find((row) => row.id === activeId) ?? list[0] ?? null,
    [list, activeId],
  );

  const messages = useQuery({
    queryKey: ["messages", active?.id],
    queryFn: () => fetchMessages(active!.id),
    enabled: connected && Boolean(active?.id),
    refetchInterval: 15000,
  });

  const send = useMutation({
    mutationFn: async () => {
      if (!active) throw new Error("Pick a conversation first.");
      return sendMessage({ conversation: active, body: draft, author: "team" });
    },
    onSuccess: async (result) => {
      setDraft("");
      if (result.delivered) toast.success("Message sent");
      else toast.warning(result.error ?? "Saved, but the messaging service is not connected yet.");
      await queryClient.invalidateQueries({ queryKey: ["messages", active?.id] });
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not send"),
  });

  const link = useMutation({
    mutationFn: (contactId: string) => linkConversationToContact(active!.id, contactId),
    onSuccess: async () => {
      toast.success("Linked to the customer");
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not link"),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim()) return;
    send.mutate();
  }

  if (!connected) {
    return (
      <div className="space-y-6">
        <PageHeader title="Inbox" description="Every message from families, in one place." />
        <EmptyState
          icon={MessageSquare}
          title="Connect your database first"
          description="Open Settings and add your database keys. Then your WhatsApp and social messages will land here."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Inbox" description="Every message from families, in one place." />

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name or number"
              className={`${inputClass} pl-9`}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setChannel("all")}
              className={`rounded-full border px-3 py-1 text-xs ${channel === "all" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
            >
              All
            </button>
            {CHANNELS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setChannel(item)}
                className={`rounded-full border px-3 py-1 text-xs ${channel === item ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
              >
                {channelLabel(item)}
              </button>
            ))}
          </div>

          <div className="max-h-[60vh] space-y-2 overflow-y-auto rounded-xl border border-border bg-card p-2">
            {conversations.isLoading ? (
              <p className="p-4 text-sm text-muted-foreground">Loading…</p>
            ) : list.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                No conversations yet. They appear here as soon as someone writes to you.
              </p>
            ) : (
              list.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => setActiveId(row.id)}
                  className={`w-full rounded-lg px-3 py-2.5 text-left ${active?.id === row.id ? "bg-accent" : "hover:bg-muted"}`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-foreground">
                      {row.display_name || row.phone || "Unknown"}
                    </span>
                    {row.unread_count > 0 ? (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                        {row.unread_count}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {channelLabel(row.channel)}
                    {row.contact_id ? " · linked" : " · not linked"}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex min-h-[60vh] flex-col rounded-xl border border-border bg-card">
          {!active ? (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">
              Pick a conversation on the left.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    {active.display_name || active.phone || "Unknown"}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {channelLabel(active.channel)} · {active.status}
                  </p>
                </div>
                {!active.contact_id && (contacts.data ?? []).length > 0 ? (
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <UserPlus className="h-4 w-4" />
                    <select
                      className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs"
                      defaultValue=""
                      onChange={(event) => event.target.value && link.mutate(event.target.value)}
                    >
                      <option value="">Link to a customer…</option>
                      {(contacts.data ?? []).map((contact) => (
                        <option key={contact.id} value={contact.id}>
                          {contact.name || contact.phone || contact.email}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                ) : (messages.data ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No messages in this chat yet.</p>
                ) : (
                  (messages.data ?? []).map((message) => (
                    <div
                      key={message.id}
                      className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                        message.direction === "out"
                          ? "ml-auto bg-primary/10 text-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{message.body}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {new Date(message.sent_at).toLocaleString()}
                        {message.direction === "out" ? ` · ${message.status}` : ""}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={submit} className="flex items-end gap-2 border-t border-border p-3">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  rows={2}
                  placeholder="Write a reply…"
                  className={inputClass}
                />
                <button
                  type="submit"
                  disabled={send.isPending || !draft.trim()}
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  <Send className="h-4 w-4" /> Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
