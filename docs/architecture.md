# Safar Studio architecture

Safar Studio is the public SAFAR N MANZIL website and the authenticated visual page editor. The platform is a modular monolith: one deployed application, one reviewed component registry and one shared CMS database. Do not split it into services unless observed traffic or operational boundaries justify that complexity.

## Runtime responsibilities

| Layer | Responsibility |
| --- | --- |
| TanStack Start routes | Resolve public pages and render published documents on the server. |
| Page document model | Stable block IDs, ordered components, layout metadata and format version. |
| Zod schema | Validate imported, browser-stored and database content against a bounded contract. |
| Puck studio | Compose supported blocks using the same registry and renderers as the public site. |
| Supabase Auth | Establish identity and provide a server-controlled CMS editor role. |
| PostgreSQL CMS | Store shared page documents, drafts, publication state and revision snapshots. |
| Publishing RPC | Validate the publish envelope, compare expected versions and atomically write a publication and revision. |
| Vercel | Build and host server-rendered public routes and the editor UI. |

## Data flow

```text
Public visitor -> route loader -> published CMS document -> server-rendered page
                                                    |
Approved editor -> Supabase Auth -> Puck Studio -> Zod validation
                                                    |
                                                    v
                                  publish_page_document(page, content, version)
                                                    |
                                                    v
                                PostgreSQL transaction + revision snapshot
```

## Security boundaries

- Public loaders query only records whose status is `published`.
- Browser-local drafts are never used as authoritative public content.
- The studio gate checks `app_metadata.cms_role`; PostgreSQL RLS remains the final data boundary.
- Public visitors may select published CMS content but cannot read drafts or revisions.
- Content documents do not execute arbitrary HTML, JavaScript or CSS.
- The database publisher runs as invoker, requires authentication, validates a bounded envelope and rejects stale versions.
- The browser receives only the Supabase URL and anon key.

## Scale and reliability

Page documents are limited by schema version, block count, array sizes, field lengths and serialized size. Queries use stable natural keys and revisions are indexed by page section/version. Publication serializes per-page changes through a transaction and returns a version the editor can reconcile.

Avoid overbuilding infrastructure before it is justified. The next scale steps are observed-query indexes, route performance budgets, publish-event/cache invalidation, managed media storage, browser smoke tests and measured load tests.

## Current scope and limitations

This repository currently ships the public website and Puck visual studio. CRM, invoicing, finance, inbox, social publishing and automation workspaces from earlier plans are not present in the current route tree.

The tracked CMS migration tests run against a disposable PostgreSQL fixture. The production Supabase project's schema, grants and RLS policies must still be verified before applying migrations. Revision data is persisted, but a dedicated revision-restore workflow, managed media pipeline and publish-triggered cache invalidation remain follow-up work.
