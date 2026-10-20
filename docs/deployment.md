# Production deployment runbook

Safar Studio runs on Vercel and uses Supabase for shared content. Deploy code and apply database migrations as separate reviewed operations; a Vercel build must never mutate the production schema.

## 1. Preflight

- Confirm the GitHub repository, Vercel project and production Supabase project reference.
- Verify the production owner account and its recovery path.
- Take a recoverable database backup before any schema change. The reset migration is destructive to legacy public app objects; retain its restricted row snapshot until editor/public sync smoke tests pass.
- Review the tracked migration diff and current database state.
- Check GitHub Actions for the exact commit that will be released.

## 2. Local release gate

Use Bun 1.3.14, matching CI:

```bash
bun install --frozen-lockfile
bun run lint:architecture
bun run typecheck
bun run test
bun run build
bun run build:public
```

The PostgreSQL publication integration test runs on an isolated CI database. Never run its fixture setup against production.

## 3. Vercel configuration

Connect the GitHub repository and deploy `main` using the detected TanStack Start configuration and `bun run build`. The current production deployment uses Node.js 24.

Required public build-time settings:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

These identify the same shared project for server rendering and browser editing. The anon key is public; it is not an authorization boundary.

Only if the optional inbound WhatsApp adapter is enabled, configure server-only `DATABASE_URL` and the relevant `WHATSAPP_VERIFY_TOKEN`, `META_APP_SECRET` or `WHATSAPP_WEBHOOK_SECRET`. Keep these values out of all `VITE_*` variables. The adapter depends on the separately provisioned legacy business tables described in [integrations](integrations.md).

## 4. Apply the CMS migrations

On a new or verified CMS schema, apply in filename order:

1. `supabase/migrations/20261014030938_cms_foundation.sql`
2. `supabase/migrations/20261014030941_atomic_page_publish.sql`
3. `supabase/migrations/20261014030945_lock_down_cms_access.sql`
4. `supabase/migrations/20261014030947_seed_bootstrap_and_handshake.sql`
5. `supabase/migrations/20261014030950_reset_legacy_public_schema.sql` — archives legacy table rows in the restricted `safar_private` schema and removes the previous public CRM/business schema. It must run after the four CMS migrations and before the first seed bootstrap.

Review the SQL, confirm the target project reference, inspect old CMS policies/uniqueness and take a backup. If the old schema differs or contains duplicate keys, stop and reconcile it instead of disabling RLS or deleting rows opportunistically.

Before applying, verify the project reference used by both deployments, inspect the existing schema, grants, RLS and migration history, and take a recoverable backup. The migration integration tests use a disposable PostgreSQL database and do not establish production readiness. Stop and reconcile if existing CMS objects or migration history differ from the expected state. The fifth migration is intentionally destructive to legacy public app objects; before rollout it takes a private row/column snapshot in `safar_private.legacy_reset_archive_20261014`, while preserving Supabase-managed schemas, extension-owned objects and the six CMS tables. Retain that snapshot until publication and recovery tests pass.

After all five migrations are installed, run `bun run cms:bootstrap` from a trusted environment with `SUPABASE_URL`, `SUPABASE_PROJECT_REF` and `SUPABASE_SERVICE_ROLE_KEY`. The bootstrap is one-time and refuses to overwrite live edits. Never put the service-role key in a browser bundle or either Vercel project's `VITE_*` environment.

Provision one owner in Supabase Auth via [database.md](database.md); test with a fresh sign-in token. Disable public sign-up in the production Auth settings unless open registration is intentional.

## 5. Smoke tests

- Public routes `/`, `/about`, `/services`, `/faq` and `/contact` load expected content.
- Unknown routes return the accessible 404 page.
- Anonymous visitors can read published content but cannot read drafts or call the publishing RPC.
- An ordinary signed-in user cannot open the studio or write CMS data.
- The provisioned owner can load, edit, save a draft, publish and reload that page from another browser.
- A stale expected version is rejected, and each publication creates a revision.
- Browser responses contain no database credentials or webhook secrets.
- The deployed alias and intended domain are reachable.
- If webhooks are enabled, valid signatures are accepted; invalid/missing signatures and oversized payloads are rejected; duplicate events are idempotent.

## 6. Rollback and recovery

For an application regression, redeploy the last known-good Vercel deployment. Database changes require a reviewed forward fix or a rehearsed restore—rolling back frontend code does not reverse a SQL migration. Keep backups enabled and regularly practice restoration before relying on CMS revisions for recovery.
