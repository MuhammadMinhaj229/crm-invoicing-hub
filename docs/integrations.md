# Integration boundaries

Safar Studio's current release is the public website and the Puck visual page builder. Old plans and environment variable names may mention other capabilities; do not treat CRM, finance, outbound messaging, social publishing or automation consoles as shipped in this route tree.

## Supabase

Supabase Auth and PostgreSQL support editor access, shared page documents, drafts, published content and revisions. Follow [database setup](database.md) for the migration order and server-controlled editor-role provisioning.

## Optional inbound WhatsApp webhook

The repository contains `/api/public/whatsapp/webhook` as an optional adapter for an existing business database schema. The CMS migrations here do **not** create `webhook_events`, `conversations`, `contacts` or `messages`. Do not enable this endpoint unless those tables, their unique constraints and the intended least-privilege access model already exist.

### Meta WhatsApp Cloud API

Configure `WHATSAPP_VERIFY_TOKEN` for the GET verification challenge and `META_APP_SECRET` to verify POST `X-Hub-Signature-256` HMAC signatures on the exact raw body.

### Evolution API

Configure `WHATSAPP_WEBHOOK_SECRET` and ensure the provider sends it in the `x-webhook-secret` header. Query-string secrets are not accepted.

Both inbound paths use a server-only `DATABASE_URL` and transactionally persist event idempotency, the conversation and the message. Prefer a dedicated database role restricted to the tables and operations it needs. If server credentials or legacy tables are missing, the endpoint intentionally fails rather than accepting unauthenticated writes.

## Not included in this release

- Legacy CRM, invoices, finance or service-request workspaces.
- Outbound WhatsApp sending and a multi-channel inbox.
- Social-platform publishing.
- Business automation execution.
