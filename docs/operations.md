# Operating Safar Studio

## Routine publishing workflow

1. Sign in with an explicitly provisioned CMS editor account.
2. Select the page and load its shared draft or published document.
3. Edit the page and save a draft.
4. Review the public page separately.
5. Publish only after validation succeeds.
6. Verify the resulting public page and publication version; record any issue before editing further.

The publishing RPC checks the expected version and writes the published document and a revision in one transaction. A stale version is a conflict requiring a reload/review, not a reason to force a write.

## Releases and maintenance

- Confirm the GitHub Actions run for the exact commit and check the matching Vercel deployment.
- Apply Supabase migrations independently after schema/RLS review and backup.
- Keep server-only variables in Vercel's server environment. Never expose a database password or webhook secret in a `VITE_*` variable.
- Inspect Vercel runtime/build logs and Supabase Auth/database logs after substantial changes.
- Verify backups and rehearse restoration before relying on production data for recovery.

## Supported product scope

This repository currently ships a public website and its visual publishing studio. Older docs may refer to CRM, finance, inbox, social publishing and automations; those workspaces are not present in the current route tree. The inbound WhatsApp endpoint is an optional adapter that requires separately provisioned legacy business tables and explicit server-side authentication.
