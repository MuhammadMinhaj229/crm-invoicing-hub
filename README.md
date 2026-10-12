# Safar Studio

**The visual website publishing platform for SAFAR N MANZIL.**

[![Architecture checks](https://github.com/MuhammadMinhaj229/crm-invoicing-hub/actions/workflows/architecture-checks.yml/badge.svg?branch=main)](https://github.com/MuhammadMinhaj229/crm-invoicing-hub/actions/workflows/architecture-checks.yml)
[![Production hosting](https://img.shields.io/badge/hosting-Vercel-black)](https://vercel.com/mohammed-minhajs-projects-8071d846/safar-studio)

**Live site:** [safar-studio-snm.vercel.app](https://safar-studio-snm.vercel.app)  
**Repository:** [GitHub source](https://github.com/MuhammadMinhaj229/crm-invoicing-hub)

Safar Studio combines the public SAFAR N MANZIL website with an authenticated visual page studio. Website content is saved as bounded, validated documents; rendering and interactive behavior remain in reviewed application code. That lets editors manage page structure without making arbitrary HTML or JavaScript part of the content database.

> **Current release scope:** public marketing pages and the Puck-based website studio. The former CRM, finance, inbox, social-publishing and automation workspaces are not part of the current route tree and should not be treated as shipped modules.

## Capabilities

- Server-rendered public pages powered by TanStack Start and TanStack Router.
- Drag-and-drop content editing with Puck and the same block renderer used by the public website.
- Runtime document validation using Zod, strict per-block properties, schema versioning and size limits.
- Link and asset allow-lists that reject unsafe schemes and credential-bearing URLs.
- Supabase-backed drafts, published documents and revision history.
- Transactional publishing with expected-version checks to reject stale editor writes.
- RLS-enforced separation between anonymous public readers and provisioned CMS editors.
- Vercel deployment with GitHub Actions quality gates.

## Architecture

```text
Public visitor ──> TanStack Start route loader ──> Published page renderer
                              │
                              ▼
                       Supabase/Postgres
                              ▲
                              │
Approved editor ──> Supabase Auth ──> Puck Studio
                                           │
                                           ▼
                                   Validate document
                                           │
                                           ▼
                                   Atomic publish RPC
                                           │
                                           ▼
                                 Revision + page version
```

The application is a modular monolith. Keep content as structured data and behavior as version-controlled code; introduce new infrastructure only when measured scaling requirements justify it.

## Technology

| Layer | Technology |
| --- | --- |
| Web application | React, TypeScript, TanStack Start and TanStack Router |
| Visual authoring | Puck |
| Content validation | Zod |
| Styling | Tailwind CSS |
| Identity and database | Supabase Auth and PostgreSQL |
| Deployment | Vercel |
| Package manager | Bun |

## Local development

### Requirements

- Bun 1.3.14 (the CI version)
- Node.js 22 or newer; production currently uses Node.js 24
- A Supabase project for shared editing and publication

### Install and run

```bash
bun install
cp .env.example .env
# Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for shared content.
bun run dev
```

The public site can render its fallback content without a database. Shared drafts and publishing require the CMS migrations and a provisioned editor account.

### Quality checks

```bash
bun run lint
bun run typecheck
bun run test
bun run build
```

For the full release gate, run `bun run check`. GitHub Actions also tests publication against an isolated PostgreSQL service; never point that test fixture at a production database.

## Supabase setup

The CMS migrations are version-controlled and must be applied in this order, after verifying the target project and taking a recoverable backup:

1. `supabase/migrations/20261010000000_cms_foundation.sql` — CMS tables, indexes, grants and restrictive RLS policy guards.
2. `supabase/migrations/20261011000000_atomic_page_publish.sql` — transactional publication and revision creation.

These migrations are **only for the website CMS**. They do not recreate the old CRM business schema or the optional inbound WhatsApp adapter's tables. See [Database setup](docs/database.md) and [Integration boundaries](docs/integrations.md) before enabling those paths.

### Provision an editor

After the account exists in Supabase Auth, grant its server-controlled `app_metadata.cms_role` using the owner procedure in [Database setup](docs/database.md). Supported roles are `owner`, `admin` and `editor`. Sign out and back in after changing the role to refresh the token. The public studio no longer exposes self-service sign-up.

## Vercel configuration

Connect the repository to Vercel, deploy `main`, and use the detected TanStack Start build configuration with `bun run build`. Production uses Node.js 24.

Required public project settings:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

The Supabase anon key is public by design; it is not authorization. Row-level security remains mandatory. `DATABASE_URL`, `META_APP_SECRET` and `WHATSAPP_WEBHOOK_SECRET` are server-only and should only be configured if the optional inbound webhook is deliberately enabled. Never prefix secrets with `VITE_`.

Follow the [Production deployment runbook](docs/deployment.md) for migration order, environment separation, smoke tests, backup and rollback.

## Security principles

- Only published documents are readable by anonymous visitors; drafts and revisions require a CMS editor role.
- Editor access uses Supabase Auth's server-controlled `app_metadata`, not user-editable metadata.
- RLS and the publication RPC protect database operations even if the UI is bypassed.
- Content is schema-validated and cannot execute arbitrary HTML or JavaScript.
- Inbound webhooks fail closed when credentials are missing and verify signatures/secrets before writing messages.
- Code deployment and database migrations are separate release operations.

## Production status

The existing Vercel production project is connected to `main`. A successful Vercel build is not proof that the target Supabase database has the expected schema, migrations or an owner account. Complete the production smoke tests in the deployment runbook before enabling shared publishing.

## Documentation

- [Architecture overview](docs/architecture.md)
- [Website engine specification](docs/architecture/website-engine.md)
- [Database and access control](docs/database.md)
- [Security model](docs/security.md)
- [Deployment runbook](docs/deployment.md)
- [Integration boundaries](docs/integrations.md)
- [Day-to-day operations](docs/operations.md)
- [Troubleshooting](docs/troubleshooting.md)

## License

No open-source license is currently declared. All rights remain with the repository owner unless a license is added.
