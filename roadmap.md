# Safar Studio roadmap

## Core capabilities delivered

- Public SAFAR N MANZIL website, service routes and supporting content pages.
- Puck visual studio with a shared block registry and renderer.
- Structured, versioned page documents with strict runtime validation and URL allow-lists.
- Shared Supabase configuration and server-rendered published-page loading.
- Transactional publishing with expected-version conflict detection and immutable revision snapshots.
- Provisioned CMS editor role checks in the studio and restrictive database policy foundations.
- Signed, bounded inbound webhook adapter for deployments that separately provide the legacy business schema.
- GitHub Actions quality checks and Vercel production deployment.

## Production launch validation

- [ ] Apply the two CMS migrations to the intended Supabase project after schema review and backup.
- [ ] Provision the owner using server-controlled `app_metadata.cms_role`.
- [ ] Verify anonymous users can only read published content.
- [ ] Verify ordinary authenticated users cannot read drafts or write CMS rows.
- [ ] Complete a browser test of draft save, publish, second-browser reload and stale-version conflict handling.
- [ ] Confirm the release commit has passing CI and a READY Vercel deployment.
- [ ] Enable database backups and rehearse recovery.

## Next engineering increments

- [ ] Revision history and one-click restore UX.
- [ ] Managed media uploads with type/size validation, ownership metadata and versioned URLs.
- [ ] Publication event delivery and cache invalidation when caching is introduced.
- [ ] Explicit component field schemas instead of indefinite inference from sample values.
- [ ] Browser smoke tests, accessibility automation and route performance budgets.
- [ ] Request/error monitoring, production alerts and load tests based on observed traffic.

## Out of current scope

The older CRM/finance/inbox/social/automation plan does not describe the current route tree. Do not advertise these modules as shipped until routes, schema migrations, authorization, tests, integration handling and production operations are restored as a coherent release.
