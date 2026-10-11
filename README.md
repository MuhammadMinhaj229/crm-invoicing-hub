# SAFAR N MANZIL — Dynamic Website Engine

A schema-driven website and authenticated visual editing studio for SAFAR N MANZIL.

The product's current scope is the public website plus the Puck-based studio at /builder. The goal is to make page composition, copy, assets, navigation, themes and reusable content editable without a code deployment, while keeping interactive behaviour in trusted, version-controlled components.

## Stack

- TanStack Start, TanStack Router, React and TypeScript
- Puck visual editor and a shared page-block renderer
- Tailwind CSS
- Supabase Auth/PostgreSQL for shared editing and publication state
- Supabase Storage for the planned managed-asset layer
- Vercel for hosting and cacheable public delivery

## Local development

Requirements: Bun and a supported Node.js runtime.

- bun install
- bun run dev

Quality checks:
- bun run lint
- bun run build
- bunx tsgo --noEmit

## Content and publishing

Pages are structured documents rendered through a controlled block registry. The editor and the public site must share this registry; page data must never execute arbitrary JavaScript or HTML.

The seed.json direction is intended for bootstrap/default content and fixtures. After initialization, the shared database is the source of truth for drafts and publications. A local draft is a convenience, not a publication.

The runtime document contract lives in src/lib/page-builder/schema.ts. Architecture and migration decisions are documented in docs/architecture/website-engine.md.

### Database prerequisites

Connect the intended Supabase project using its project URL and public/anon key in Settings → Connections. Verify the CMS tables and row-level-security policies before migrating.

The atomic publisher migration is supabase/migrations/20261011000000_atomic_page_publish.sql. Apply it only after confirming that cms_sections and cms_revisions exist with the expected columns and policies. Do not run it against an unrelated Supabase project.

Environment names supported by the browser client include VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY and the legacy SAFAR-prefixed alternatives. These must be public project details only. Service-role keys and direct database connection strings belong exclusively in server-side environment configuration and must never be stored in browser local storage or any VITE_* variable.

## Deployment principle

Deploy code and migrations separately. Verify the preview build, apply reviewed database migrations, test authentication and publication against the intended Supabase project, then promote the deployment. Public pages may be cached; editor pages, drafts and previews must remain private and uncacheable.
