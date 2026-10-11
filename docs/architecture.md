# Website Platform Architecture

## Product scope

The current application is a dynamic public website and an authenticated visual website builder at `/builder`. It is not currently the full CRM/business operating system described by some older documentation. The near-term goal is to make customer-facing content, composition, themes, assets, navigation, metadata and approved interactions editable without requiring a code deployment for each content change.

## Architecture principles

1. **Structured content, trusted rendering.** Persist typed JSON documents. Render only registered, application-owned components; never execute arbitrary HTML, CSS, JavaScript or expressions from content.
2. **One component contract.** The editor and public renderer use the same component registry, defaults and validation rules.
3. **Draft and published state are separate.** Draft writes must not change public output. Publishing creates an immutable version and changes the current published pointer only after validation.
4. **Database is the shared source of truth.** Browser storage is a draft/recovery aid only; it is not a production publishing mechanism.
5. **Progressive modularity.** Keep a modular monolith while the product is one website. Add services or infrastructure only when measurable constraints justify them.
6. **Security at the boundary.** Validate and authorize every mutation server-side. Use Supabase Row Level Security as defense in depth. Privileged credentials never enter browser storage or bundles.
7. **Recoverability by design.** Version schemas, preserve publication history, audit changes, and provide a tested rollback path.

## Current implementation

| Concern | Current implementation | Next hardening step |
| --- | --- | --- |
| Application | React, TypeScript, TanStack Start/Router | Keep route loaders and mutations thin; move domain rules into page-builder modules |
| Visual editing | Puck at `src/routes/_authenticated/builder.tsx` | Explicit field/schema definitions rather than inferring every field from sample values |
| Component registry | `src/lib/page-builder/puck-config.tsx` | Make registry metadata and schema versioning authoritative |
| Document model | `src/lib/page-builder/model.ts` | Add component-specific validation and explicit migrations |
| Rendering | Shared `RenderBlock` in `src/components/page-builder/block-renderer.tsx` | Keep public rendering deterministic and reject unknown component types |
| Persistence | `src/lib/page-builder/store.ts`, `cms_sections`, `cms_revisions` | Move privileged writes into server-side transactional publish operations |
| Local fallback | Browser local storage for drafts and offline recovery | Never treat local-only state as published production content |
| Database | Supabase PostgreSQL and Auth | Verify the correct project, RLS, schema migrations and server-only credentials |
| Hosting | Vercel | Cache only published output; invalidate affected routes after successful publish |
| Assets | Some defaults imported from source assets; image fields also accept strings | Add a managed asset library and stable asset IDs |

## Logical architecture

```text
Puck editor / Public website / Preview
                 |
                 v
      TanStack Start application
   Auth + authorization + validation
                 |
                 v
          Content domain layer
  Registry / schemas / repository / publish
                 |
        +--------+---------+
        |                  |
        v                  v
 Supabase Postgres    Supabase Storage
 drafts, versions,    media objects and
 permissions, audit   asset metadata
        |
        v
Validated published snapshot
        |
        v
Shared renderer -> cacheable public response -> Vercel CDN
```

This is a target design, not a claim that all listed layers are implemented today.

## Document contract

A page document has a stable page identifier, a schema version, and an ordered array/tree of registered blocks. Each block has a stable ID, registered type, typed props, and constrained layout data. Assets and reusable content should be referenced by stable IDs rather than copied into every page. Existing documents need explicit migrations whenever persisted shapes change.

Structural validation is an initial safety boundary. It is not a substitute for component-specific schemas. Each registry entry should ultimately provide:
- stable type identifier and component schema version;
- default props and validation schema;
- editor field definitions;
- allowed child blocks and nesting rules;
- rendering component and accessibility expectations;
- migration functions for supported prior versions.

## Publishing lifecycle

1. Load the current draft and published version independently.
2. Save drafts with optimistic concurrency or a revision token so concurrent editors cannot silently overwrite one another.
3. Validate the full document, all component props, asset references, links, and page metadata.
4. In one server-side database transaction, create an immutable page version, update the published-version pointer, and record an audit/publish event.
5. After commit, invalidate the page and any shared-content dependencies in the delivery cache.
6. If a step before commit fails, keep the prior published version active. If cache invalidation fails after commit, retry it from a durable event/outbox.
7. Rollback by pointing to a prior immutable version, not by reconstructing content from browser state.

The current client-side store still performs separate writes for page content and revision history. Transactional server-side publishing is a required follow-up before treating the workflow as enterprise-grade.

## Content storage boundaries

Use JSON/JSONB for page composition and relational records for independently managed entities. Do not create a database row for every heading or button. Keep service catalogues, reusable FAQs, navigation, themes and media metadata in reusable records where independent reuse and querying are valuable.

`seed.json` should be a versioned bootstrap/baseline import, not a runtime override of owner-edited content. Seed import must be explicit, idempotent, schema-validated and must not overwrite existing published content implicitly.

## Security and operations

- Keep service-role and database credentials server-only.
- Require authorization on every draft, publish, unpublish, restore, upload and settings mutation.
- Apply least-privilege RLS policies to exposed tables and storage buckets.
- Restrict URLs to approved protocols and sanitize any supported rich text.
- Limit document size, block count, nesting depth and field lengths.
- Record actor, timestamp, page, version and outcome for mutations.
- Keep preview private and non-indexable; never serve drafts from public shared caches.
- Maintain database migrations, backups, environment separation and release checks.
- Test document validation, editor round-trips, authorization, publish atomicity, cache invalidation and rollback.

## Non-goals for the first enterprise iteration

Do not introduce microservices, a separate CMS service, Redis, or a custom renderer framework merely for architectural appearance. Start with a modular monolith, Postgres, managed object storage and CDN caching. Add complexity only when usage and measurements demonstrate the need.
