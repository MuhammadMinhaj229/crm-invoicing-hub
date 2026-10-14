# Troubleshooting

## Studio redirects me to sign in

Confirm the production deployment has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Then verify the account exists in the same Supabase Auth project and its server-controlled `app_metadata.cms_role` is `owner`, `admin` or `editor`. Sign out and back in after changing roles so the token refreshes.

## Published content does not show

Verify the route's page identifier, the `cms_sections` row's `section_key = '__document'` and `status = 'published'`. The public website reads through `get_published_page_document(text)`; it should not query `cms_sections` directly. Inspect Vercel runtime logs for PostgREST or schema errors. A local browser draft is never public content.

## Publish reports a missing function

Apply `supabase/migrations/20261014030938_cms_foundation.sql`, `supabase/migrations/20261014030941_atomic_page_publish.sql`, `supabase/migrations/20261014030945_lock_down_cms_access.sql` and `supabase/migrations/20261014030947_seed_bootstrap_and_handshake.sql` in order, after reviewing the intended database project and RLS policies. Then run the one-time bootstrap command from a trusted server environment: `bun run cms:bootstrap`. Do not work around a missing RPC with direct writes or by disabling RLS.

## Database handshake says seed required

Check that all four migrations have been applied to the same Supabase project used by the public site and editor. Confirm that the project reference in `SUPABASE_URL` matches `SUPABASE_PROJECT_REF`, then run `bun run cms:bootstrap` from the trusted repository environment. The bootstrap uses `src/content/seed.json` only for first initialization and never overwrites live edits. If CMS records already exist but the seed marker is missing, the bootstrap refuses to proceed; inspect and reconcile those records rather than deleting them or force-seeding.

## Realtime says reconnecting

A successful handshake proves the database RPC responded; it does not prove Realtime is subscribed. Check the Supabase Realtime service, the `supabase_realtime` publication membership for `cms_sections` and `cms_site_config`, and the editor's approved `app_metadata.cms_role`. A remote-change indicator asks the editor to review/reload current state; it does not replace unsaved edits automatically.

## Draft saves are denied

Check the current auth token's `app_metadata.cms_role`, the draft-only column grants and every policy on `cms_sections`. Public reads use a narrow RPC; editors cannot write `content`, `status` or `version` directly. Being signed in alone does not grant editor access.

## Build or CI fails

Reproduce from a clean checkout:

```bash
bun install
bun run lint:architecture
bun run typecheck
bun run test
bun run build
```

Read the first compiler/parser error in GitHub Actions or Vercel logs, not only the final generic build failure.

## WhatsApp webhook is unavailable

The webhook adapter is optional and expects pre-existing `webhook_events`, `conversations`, `contacts` and `messages` tables. It requires server-only `DATABASE_URL`; Meta additionally requires `WHATSAPP_VERIFY_TOKEN` and `META_APP_SECRET`, while Evolution requires `WHATSAPP_WEBHOOK_SECRET` delivered in `x-webhook-secret`. Missing signatures, credentials or payload prerequisites fail closed. The CMS migration does not create those business tables.
