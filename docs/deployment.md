# Putting it live

## Before you deploy

1. `bun install`
2. Type check: `bunx tsgo --noEmit`
3. Build: `bun run build`
4. Run the setup script (`src/lib/foundation.sql`) in your Supabase SQL
   editor. It only adds, so running it again is safe.
5. Set every environment variable your connected services need — see
   `.env.example`.

## Deploying

The project is a TanStack Start app and builds to a standard Node/edge
output. On Vercel: import the repository, framework preset "Other" (Vite),
build command `bun run build`, and add the environment variables. Nothing
else is required.

## After you deploy

Check each of these once:

- The home page opens and shows your content.
- `/auth` lets a team member sign in.
- `/dashboard` loads and the Connections panel lists the true state.
- A test enquiry from the website creates a lead in Customers.
- The WhatsApp webhook URL answers (Meta verification returns the challenge).

## Going back

Every database change in the setup script is additive, so rolling back the
website code never loses data. To roll back, redeploy the previous
deployment from your hosting dashboard.

## Backups

Turn on daily backups in your Supabase project. Before any large change,
take a manual snapshot there as well.


## Direct database link

Add `DATABASE_URL` (Supabase Transaction pooler string, port 6543, with your database password) to the Vercel environment variables for faster server jobs.
