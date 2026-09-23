# Faster database link + exact setup script

## The honest answer first
- A **connection string** (Transaction pooler, port 6543) is a direct line into Postgres. It only works from the server. It must never go into a browser, because anyone could read it and get full access to every table, with no security rules.
- The website and console in the browser still need the **Project URL + public (anon) key**. That path keeps your row security rules on, so each team member only sees what they are allowed to see.
- So we keep both: the project link for the browser, and the pooler string for server jobs (WhatsApp webhook, automations, imports). Those jobs become faster and skip the extra step.

## What gets built
1. **Settings → Connections → Database** gets a new optional field: "Transaction pooler connection string". It shows how to copy it from Supabase (Connect → Transaction pooler), and warns never to share it.
2. The string is **not** kept in the browser. The field tells the user to add it as `DATABASE_URL` in the hosting settings (Vercel → Environment Variables). The console only shows whether it is set (green/red), through the existing health check.
3. A small server-side database helper uses `DATABASE_URL` when it exists (pooler mode, no prepared statements), and falls back to the current service-role path when it does not.
4. The WhatsApp webhook and the server message sender use this helper, so incoming messages are saved faster.
5. `.env.example`, `docs/database.md` and `docs/deployment.md` get the new setting and plain steps.

## What to run in the SQL editor
One script for the whole project: `src/lib/foundation.sql` (also available from **Settings → Connections → Copy setup script**).
1. Supabase → **SQL Editor** → **New query**.
2. Paste the whole script, press **Run**. It creates every table, security rule, role function and website table. It only adds, never deletes, so it is safe to run again after updates.
3. Then make yourself the owner — run once, with your sign-in email:
```sql
insert into public.user_roles (user_id, role)
select id, 'super_admin' from auth.users where email = 'YOUR@EMAIL.COM'
on conflict do nothing;
```
4. Sign up first at `/auth` if that query adds 0 rows, then run it again.

The plan will also check the script runs cleanly start to finish and add that owner step inside the Settings screen.

## Technical details
- Driver: `postgres` (postgres.js), which runs on the edge runtime over TCP; options `{ prepare: false, max: 1 }` for the transaction pooler.
- New `src/lib/db.server.ts`; health route adds a `database_direct` check (`DATABASE_URL` present, plus a `select 1` probe).
- No changes to browser queries or RLS.
