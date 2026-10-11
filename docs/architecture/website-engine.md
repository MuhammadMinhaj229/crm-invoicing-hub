# Schema-driven website engine

Status: architecture baseline for the website-plus-builder application  
Decision date: 11 October 2026

## Goal

Every customer-facing part of the site should be editable through the visual studio without requiring a code deployment for routine content changes. The platform must still be type-safe, secure, accessible, observable, versioned and fast to render.

The design is a **modular monolith** built on TanStack Start, React, Puck, Supabase/PostgreSQL and Vercel. Do not split it into microservices until measured operational constraints justify that complexity.

## Core decisions

### 1. Dynamic content is data; behaviour is trusted code

Persist page structure, text, asset references, design tokens, navigation, SEO fields, visibility and reusable-content references as structured data. Keep rendering, forms, interaction logic, external integrations and permitted actions in version-controlled React/server code.

Never evaluate arbitrary JavaScript or inject untrusted HTML/CSS from a page document. Add new behaviour by shipping a reviewed component or action handler, then make its supported options editable.

### 2. One component registry

The block registry is the contract between the editor, document validator, preview and public renderer. Each block type needs:
- A stable type name and versioned data schema.
- Explicit defaults and editor fields.
- A shared renderer.
- Accessibility and responsive-layout rules.
- Document migration behaviour.
- Unit and round-trip tests.

Avoid inferring all fields from sample values indefinitely. Explicit definitions preserve semantic differences between plain text, URLs, assets, references, rich text and numeric design tokens.

### 3. One page-document format

A page is a bounded JSON document with a schema version, stable page identifier and ordered block list. Each block has a stable ID, type, typed properties, layout and optional visibility/anchor settings.

Keep independently managed entities—media assets, service catalogue entries, FAQs, navigation models and reusable sections—separate from page documents. The document references their IDs instead of copying their data into many pages.

The seed.json direction is a reviewed bootstrap and development fixture. Import it explicitly and idempotently. It is not a runtime override of owner-edited database content and must never silently replace published content during deployment.

### 4. Drafts and publications have different lifecycles

- Drafts are mutable, private and editor-only.
- Published versions are immutable snapshots.
- Each publication records actor, time, page, version and document.
- Publishing is an atomic database transaction.
- Optimistic concurrency rejects a stale editor instead of overwriting another editor's publication.
- Rollback switches the published pointer to a prior valid snapshot or republishes its content as a new version.
- Local storage may preserve offline drafts, but must never claim to publish a shared website.

The first implementation uses the existing cms_sections and cms_revisions tables. The atomic publishing function in supabase/migrations/20261011000000_atomic_page_publish.sql must be applied to the connected Supabase project after confirming those tables and their RLS policies exist.

### 5. Database access and authorization

Browser code may receive only the project URL and public/anon key. Privileged service-role keys and direct PostgreSQL connection strings are server-only secrets; never place them in client state, local storage, seed files or VITE_* variables.

All mutation entry points require authentication and authorization. Existing row-level-security policies remain in force for the invoker-security publishing function. Confirm that the deployed RLS rules limit draft updates and publication to intended editor/publisher roles before production use.

### 6. Asset references are managed data

Uploads go through an authenticated media workflow. Persist an asset ID and metadata (MIME type, dimensions, alt text, ownership, variants), not a transient upload session. The renderer resolves the ID to a validated delivery URL. Immutable/versioned asset URLs can use long-lived CDN caching.

### 7. Fast public rendering

The public renderer resolves one published document plus the content and assets it references, then renders through the same block registry used by Puck. It must not issue one database request per block.

Cache only published, visitor-independent output. Editor routes and previews are private and uncacheable. Publish events invalidate the affected page and dependent reusable-content paths. A database failure must produce a clear fallback or error; it must not substitute a visitor's local draft as public content.

## Logical architecture

Puck Studio / Preview / Public routes
                 |
                 v
       TanStack Start boundary
 auth · permission checks · validation
                 |
                 v
 Page-document application services
 schema registry · migrations · drafts
 versioning · publish orchestration
          /                \
         v                  v
 Supabase/Postgres     Supabase Storage
 content + revisions  versioned media
         |
         v
 Published snapshot -> renderer -> Vercel cache/CDN

## Document contract

The runtime validator currently enforces:
- Supported document format version.
- Known block types and a bounded number of blocks.
- Stable, bounded IDs and a strict layout shape.
- A per-block property schema.
- Safe URL schemes for links and media.
- JSON serializability and a 2 MB document limit.
- Bounded arrays and text fields.

When a component shape changes, bump its schema/version and provide a migration from supported prior documents. Never silently discard properties while loading and resaving a document. Maintain fixtures for published pages so every release can prove legacy content still renders.

## Publication protocol

1. Load draft and current published version.
2. Edit locally; autosave the draft to the shared database when connected.
3. Validate the complete document before save/publish.
4. Call the transactional publish function with the expected version.
5. In one transaction, verify the expected version, write the published document, advance the version and append its revision.
6. Update the client state only after the database confirms success.
7. Invalidate caches and record a publish event.
8. If the expected version is stale, keep the draft and ask the editor to reload or reconcile changes.

A missing database or publishing migration is a blocked publication, not a local-only success.

## Recommended evolution

### Phase A — correctness and safety
- Validate every document read from local storage or the database.
- Prevent browser persistence of privileged credentials and remove old persisted secret fields.
- Reconcile environment-variable names.
- Stop treating local-only content as live.
- Make publication transactional and concurrency-aware.

### Phase B — content platform
- Add explicit typed registry definitions and migration fixtures.
- Introduce managed media assets and a reusable-content collection model.
- Add draft autosave status, dirty-state protection and stale-edit handling.
- Add a real preview mode that reads draft content without public cache exposure.

### Phase C — publication and delivery
- Make publication events and cache invalidation observable and retryable.
- Add rollback, scheduled publishing and approval workflows only when required.
- Add metadata-aware SSR/SEO and static generation for stable public pages.
- Add performance budgets and load tests before introducing extra infrastructure.

### Phase D — operating maturity
- Separate local, preview and production Supabase projects.
- Apply migrations through reviewed, repeatable deployment steps.
- Use least-privilege database roles and verified RLS policies.
- Enable backups and rehearse recovery.
- Add metrics for route latency, rendering errors, validation errors and failed publications.

## Release gates

A release is not ready until these are demonstrated:
- bun run build succeeds on a clean checkout.
- Valid current documents parse; malformed, oversized, unsafe-link and unknown-block documents are rejected.
- A page can be loaded from the database, edited, saved, reloaded and published without data loss.
- Concurrent publishers cannot silently overwrite each other.
- Published documents are visible to another browser; local-only drafts are not.
- An unauthenticated or unauthorized user cannot publish or edit content.
- RLS blocks unauthorized direct table operations.
- Rollback restores a known-good document.
- Public caching never leaks drafts or crosses site/page boundaries.
- All supported blocks render accessibly at mobile and desktop sizes.
