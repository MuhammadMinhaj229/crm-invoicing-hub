import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { readDeviceLink } from "../lib/connect-link";
import { saveStoredSupabaseConfig, testSupabaseConnection } from "../lib/supabase";

export const Route = createFileRoute("/connect")({
  head: () => ({
    meta: [
      { title: "Connect this device — SAFAR N MANZIL" },
      {
        name: "description",
        content: "Set up the SAFAR N MANZIL console on a new phone or computer in one tap.",
      },
      { property: "og:title", content: "Connect this device — SAFAR N MANZIL" },
      { property: "og:description", content: "One-tap console setup for a new device." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ConnectDevicePage,
});

function ConnectDevicePage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Setting up this device…");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const config = readDeviceLink(window.location.hash);
      if (!config) {
        setFailed(true);
        setMessage("This setup link is incomplete. Copy it again from Settings → Connections.");
        return;
      }
      const test = await testSupabaseConnection(config);
      if (cancelled) return;
      if (!test.ok) {
        setFailed(true);
        setMessage(test.message);
        return;
      }
      saveStoredSupabaseConfig(config);
      window.location.hash = "";
      setMessage("This device is connected. Taking you to sign in…");
      setTimeout(() => navigate({ to: "/auth", replace: true }), 900);
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <h1 className="font-display text-xl font-bold text-foreground">Connect this device</h1>
        <p className={`mt-3 text-sm ${failed ? "text-destructive" : "text-muted-foreground"}`}>
          {message}
        </p>
      </div>
    </div>
  );
}
