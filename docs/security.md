# Security model

Safar Studio has two trust domains: anonymous readers of published website content and explicitly provisioned CMS editors. The browser can see a Supabase project URL and public anon key; it must never see a database password, service-role key or webhook secret.

## Authentication and authorization

- The studio sign-in flow is provisioning-based; it does not offer self-service account creation.
- A user must have server-controlled Supabase Auth `app_metadata.cms_role` of `owner`, `admin` or `editor`.
- User-editable `user_metadata` is not trusted.
- PostgreSQL RLS is the enforcement boundary. Anonymous visitors can select published content only; drafts, revisions and mutations require the editor role.
- Publishing is an invoker-security transaction. It relies on the existing grant/RLS rules rather than bypassing them.
- Restrictive policy guards keep an older permissive policy from making draft rows public.
- Never disable RLS to work around authentication or deployment issues.

## Secrets and configuration

- Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` belong in the browser bundle.
- `DATABASE_URL`, `META_APP_SECRET`, `WHATSAPP_WEBHOOK_SECRET` and other integration credentials are server-only.
- Local `.env` files are excluded from Git; only the empty `.env.example` is tracked.
- Prefer a dedicated least-privilege DB role for server-side direct SQL instead of default database-owner credentials.
- A privileged key that may have been committed to any previous repository/history must be treated as exposed: rotate it with the provider and follow the provider's history-cleanup procedure. Deleting a current file is not sufficient to revoke a leaked credential.

## Page document safety

- Persisted content is normalized and validated before saving or publishing.
- Supported block types and per-block properties are allow-listed.
- Link and media validation rejects unsafe schemes, protocol-relative links, backslashes and credential-bearing HTTP(S) URLs.
- The renderer repeats URL checks for card links.
- Page content never executes arbitrary HTML, JavaScript or CSS.
- Block-count, array, text and document-size limits bound input size.

## Inbound webhook safety

- Meta POSTs must include a valid `X-Hub-Signature-256` HMAC for the exact raw body using `META_APP_SECRET`.
- Evolution POSTs must carry `x-webhook-secret`; secrets in query strings are not accepted.
- Missing credentials fail closed; request bodies have a hard size limit.
- Event deduplication, conversation changes and message inserts share a transaction.
- The optional adapter requires pre-existing business tables; CMS migration alone does not provision them.

## Release discipline

- Separate preview and production Supabase projects where practical.
- Review migrations and verify the target project before execution.
- Take backups and test restoration.
- Use CI and Vercel build checks as release gates, but also validate real-world RLS, authentication and publication against the target Supabase project.
