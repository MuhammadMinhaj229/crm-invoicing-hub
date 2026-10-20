# Safar Studio — schema-driven website platform

Status: architecture and release baseline for the public website and visual page studio.

## Product goal

Enable routine page composition and content changes through a visual editor without allowing content to define executable behavior. Keep rendering, forms and integration handlers in reviewed TypeScript code.

The stack is TanStack Start, React, Puck, Zod, Supabase/PostgreSQL and Vercel. It remains a modular monolith until measured operational needs justify further decomposition.

## Document contract

A page is a bounded JSON document with a schema version, page identifier and ordered block list. Every block has a stable ID, supported type, validated properties and shared responsive/layout settings. The runtime schema enforces a block allow-list, property-specific contracts, safe URL rules, maximum array/string/document sizes and JSON serializability.

When a block changes shape, provide a deliberate schema migration and test older stored fixtures. Never silently discard authored content on load/resave. Content is data; arbitrary HTML/JavaScript is not a supported document feature.

## Editor and renderers

Puck edits supported block definitions. The public route loader resolves the shared published document and passes it to the same controlled renderer, preserving server rendering. Drafts and revisions are private; a local browser draft is a recovery convenience, not a publication.

The registry should gradually move from fields inferred from sample values to explicit typed definitions, so text, URLs, assets, references and tokens retain their semantic types.

## Database and authorization

The shared Supabase project is the source of truth across visitors and editors. Vercel's public `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` configure the browser-safe client. Server-only database credentials never enter a browser bundle.

The editor requires Supabase Auth `app_metadata.cms_role` of `owner`, `admin` or `editor`. The PostgreSQL RLS policies enforce the same role allow-list. User-editable metadata is not trusted. The publishing RPC uses invoker security and relies on the table policies; do not bypass RLS to resolve deployment failures.

## Publication protocol

1. Load the shared document and current published version.
2. Edit a private draft and validate the complete document.
3. Save the draft to shared storage when the database is available.
4. Publish with the expected current version.
5. In one transaction, verify the version, update the publication and insert a revision snapshot.
6. Reject stale edits instead of silently overwriting another editor's work.
7. Verify the public route after publication.

Production migrations are applied separately from Vercel builds. Take a backup and verify the existing CMS table shapes, keys and RLS policies before applying the CMS foundation and atomic publisher migrations.

## Release gates

Before enabling production editing, demonstrate that anonymous users can read published documents but not drafts/revisions, unapproved users cannot edit, an owner can load/save/publish/reload from a second browser, stale writes are rejected, revisions are written transactionally and the public site never serves a local draft.

Follow-up capabilities include revision restoration UI, managed asset uploads, cache invalidation events, scheduled publishing if needed, browser-level testing, observability and performance budgets.
