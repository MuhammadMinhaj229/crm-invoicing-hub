# Supabase database and access control

Safar Studio uses Supabase Auth and PostgreSQL for shared website drafts, publication state and revision history. The browser receives only the project URL and public anon key. PostgreSQL row-level security (RLS), not the UI, is the authorization boundary.

## CMS migrations

Apply the tracked SQL files in chronological order to the **intended** Supabase project:

1. `supabase/migrations/20261010000000_cms_foundation.sql` creates or validates the CMS tables, indexes, grants and editor RLS boundaries.
2. `supabase/migrations/20261011000000_atomic_page_publish.sql` installs the transactional publisher. It advances the page version and appends a revision in one transaction.

Before applying to an existing project:

1. Verify its Supabase project URL/reference matches Vercel's production configuration.
2. Take a recoverable backup.
3. Inspect `cms_sections` and `cms_revisions`, including duplicates on `(page, section_key)` and `(section_id, version)`.
4. Review the existing RLS policies and grants. The foundation adds restrictive gates so old permissive policies cannot reveal drafts. Schema mismatches or duplicate rows are release blockers; do not solve them by disabling RLS.

The migrations cover the website CMS only. They do **not** provision the legacy CRM schema or the optional WhatsApp adapter's business tables (`webhook_events`, `conversations`, `contacts`, `messages`).

## Provision the owner and editors

The studio admits only users with a server-controlled Supabase Auth `app_metadata.cms_role` set to `owner`, `admin` or `editor`. Do not use `user_metadata`, which is user-editable.

Once the intended user account exists in Supabase Auth, run the following in the SQL editor as a database administrator, replacing the example email:

```sql
update auth.users
set raw_app_meta_data =
  coalesce(raw_app_meta_data, '{}'::jsonb) || '{"cms_role":"owner"}'::jsonb
where lower(email) = lower('owner@example.com');

select email, raw_app_meta_data ->> 'cms_role' as cms_role
from auth.users
where lower(email) = lower('owner@example.com');
```

Confirm the query updates exactly one intended account and the role is `owner`. Provision other trusted users with `editor` or `admin` as appropriate. Sign out and back in after a role change so the new token contains the updated claim. In production, disable public self-service sign-up unless it is a deliberate requirement.

## Environment variables

- `VITE_SUPABASE_URL`: public Supabase project URL.
- `VITE_SUPABASE_ANON_KEY`: public/anon client key. This is visible in the browser and is safe only with correct RLS policies.
- `DATABASE_URL`: optional server-only direct PostgreSQL connection for the inbound webhook adapter. Prefer a dedicated least-privilege database role and the Supabase transaction pooler; a direct connection bypasses RLS.
- `WHATSAPP_VERIFY_TOKEN`, `META_APP_SECRET`: optional Meta webhook challenge and signature verification.
- `WHATSAPP_WEBHOOK_SECRET`: optional Evolution webhook header secret.

Never define database passwords, service-role keys or webhook secrets with a `VITE_` prefix. See [.env.example](../.env.example).

## Operational guarantees

- Anonymous visitors may read published CMS documents only; drafts and revisions are editor-restricted.
- Publishing requires the atomic RPC migration and rejects stale expected versions.
- Page writes and revision inserts run in the same transaction.
- A missing migration or missing editor role is a blocked publish—not a reason to write around RLS.
- CI runs migration tests against disposable PostgreSQL. The test setup is not a production schema.
