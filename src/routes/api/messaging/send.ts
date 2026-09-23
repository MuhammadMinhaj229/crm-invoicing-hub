import { createFileRoute } from "@tanstack/react-router";

/** Sends one message through the configured provider. Secrets stay on the server. */
export const Route = createFileRoute("/api/messaging/send")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: { channel?: string; to?: string; body?: string };
        try {
          payload = (await request.json()) as typeof payload;
        } catch {
          return Response.json({ ok: false, error: "Bad request body" }, { status: 400 });
        }

        const channel = String(payload.channel ?? "").trim();
        const to = String(payload.to ?? "").trim();
        const body = String(payload.body ?? "").trim();

        if (!channel || !to || !body) {
          return Response.json({ ok: false, error: "channel, to and body are required" }, { status: 400 });
        }
        if (body.length > 4000) {
          return Response.json({ ok: false, error: "Message is too long" }, { status: 400 });
        }

        const { adapterFor } = await import("../../../lib/messaging.server");
        const adapter = adapterFor(channel);
        if (!adapter) {
          return Response.json(
            { ok: false, error: `Sending on ${channel} is not connected yet.` },
            { status: 501 },
          );
        }
        if (!adapter.configured()) {
          return Response.json(
            { ok: false, error: `${adapter.label} is not set up. Add its keys in the server settings.` },
            { status: 503 },
          );
        }

        const outcome = await adapter.send({ to, body });
        if (!outcome.ok) return Response.json({ ok: false, error: outcome.error }, { status: 502 });
        return Response.json({ ok: true, externalId: outcome.externalId ?? null });
      },
    },
  },
});
