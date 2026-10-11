# ADR 0001: Schema-driven website content and publishing

- Status: Accepted direction; implementation is incremental
- Date: 2026-10-11

## Context

The product is a public website with a visual editor. The long-term requirement is to make website elements configurable and publishable without making arbitrary executable code part of stored content. The current code already has a typed block union, a Puck registry, a shared renderer, and a database/local-storage persistence adapter. The current document guard only checks that a value has a `blocks` array, and local-only publishing can look like a successful publication even though it is visible only in that browser.

## Decision

1. Keep React components and interaction logic in trusted, versioned application code.
2. Store page composition as versioned structured documents and validate all data at persistence boundaries.
3. Treat local storage as a draft/recovery cache only. Cloud publication requires a connected database.
4. Use one registry to define block types, schemas, editor controls, defaults and migrations.
5. Use immutable published versions and a transactional server-side publication operation as the target persistence model.
6. Use stable IDs for assets and reusable content instead of coupling persisted documents to imported asset paths.
7. Keep the first implementation as a modular monolith using TanStack Start, Supabase/PostgreSQL, Supabase Storage and Vercel.

## Consequences

- Content changes can be made without application deployments for supported block types.
- Unknown or malformed documents can be rejected instead of being trusted as renderable content.
- A browser-local draft cannot be mistaken for a live production publish.
- New component versions require explicit migration and compatibility handling.
- The current client-side publication path must be replaced by a server-side transaction before the platform is considered enterprise-ready.
- Database project identity, RLS policies and production environment configuration must be verified before enabling production editing.

## Implementation sequence

1. Add structural validation at document boundaries and prohibit false-success local publishing.
2. Add explicit component schemas and schema-version migrations.
3. Move mutations behind authorized server functions.
4. Add transactional publication, immutable revisions, optimistic concurrency and audit events.
5. Add a managed media library and stable asset references.
6. Add published-output caching with reliable invalidation and rollback.
7. Add automated integration tests for authorization, save/load round-trips, publication atomicity and rollback.
