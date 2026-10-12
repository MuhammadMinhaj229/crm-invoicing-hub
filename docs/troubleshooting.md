# Troubleshooting

## Studio redirects me to sign in

Confirm the production deployment has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Then verify the account exists in the same Supabase Auth project and its server-controlled `app_metadata.cms_role` is `owner`, `admin` or `editor`. Sign out and back in after changing roles so the token refreshes.

## Published content does not show

Verify the route's page identifier, the `cms_sections` row's `section_key = '__document'` and `status = 'published'`. Inspect Vercel runtime logs for PostgREST or schema errors. A local browser draft is never public content.

## Publish reports a missing function

Apply `supabase/migrations/20261010000000_cms_foundation.sql` first and `supabase/migrations/20261011000000_atomic_page_publish.sql` second, after reviewing the intended database project and RLS policies. Do not work around the missing RPC by direct writes or by disabling RLS.

## Draft saves are denied

Check the current auth token's `app_metadata.cms_role`, table grants and every policy on `cms_sections`. The restrictive policies intentionally prevent an old broad permissive rule from exposing drafts. Being signed in alone does not grant editor access.

## Build or CI fails

Reproduce from a clean checkout:

```bash
bun install --frozen-lockfile
bun run lint
bun run typecheck
bun run test
bun run build
```

Read the first compiler/parser error in GitHub Actions or Vercel logs, not only the final generic build failure.

## WhatsApp webhook is unavailable

The webhook adapter is optional and expects pre-existing `webhook_events`, `conversations`, `contacts` and `messages` tables. It requires server-only `DATABASE_URL`; Meta additionally requires `WHATSAPP_VERIFY_TOKEN` and `META_APP_SECRET`, while Evolution requires `WHATSAPP_WEBHOOK_SECRET` delivered in `x-webhook-secret`. Missing signatures, credentials or payload prerequisites fail closed. The CMS migration does not create those business tables.
