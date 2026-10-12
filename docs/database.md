# Supabase database and access control

Safar Studio uses Supabase Auth and PostgreSQL for shared website drafts, publication state and revision history. The browser receives only the project URL and public anon key. PostgreSQL row-level security (RLS), not the UI, is the authorization boundary.

## CMS migrations

Apply the tracked SQL files in chronological order to the **intended** Supabase project:

1. `supabase/migrations/20261010000000_cms_foundation.sql` creates or validates the CMS tables, indexes, initial grants and RLS boundaries.
2. `supabase/migrations/20261011000000_atomic_page_publish.sql` installs the validated transactional publisher.
3. `supabase/migrations/20261012000000_lock_down_cms_access.sql` removes direct public table reads, limits editor table writes to draft fields, and exposes narrow RPCs for published reads, publish and unpublish.

The third migration intentionally moves the validated publisher implementation into the non-exposed `app_private` schema. The public publishing wrapper checks `auth.uid()` and server-controlled `app_metadata.cms_role` before calling it with elevated privileges. The public read RPC returns only the published `content` JSON—not draft fields, internal IDs or revision history.

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

- Anonymous visitors cannot query CMS storage tables directly. They can call `get_published_page_document`, which returns only the published document body.
- Base-table reads are restricted to approved editors; row-level security is paired with least-privilege column grants.
- Editors can directly write only `page`, `section_key`, `draft_content` and `updated_at`. They cannot directly change `content`, `status` or `version`.
- Revision history is read-only to editors. Revision inserts happen only inside the controlled publication/unpublication transactions.
- Publish and unpublish operations validate `auth.uid()` and the server-controlled `app_metadata.cms_role`, use optimistic version checks, and append revisions transactionally.
- A missing migration or missing editor role is a blocked operation—not a reason to write around RLS.
- CI runs migration tests against disposable PostgreSQL. The test setup is not a production schema.
