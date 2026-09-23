# The database

Your own Supabase project holds everything. Nothing is stored anywhere else.

## Setting it up

1. Open the team console, go to **Settings → Connections**.
2. Paste your project URL and public (anon) key. Press **Test**.
3. Press **Copy setup script** and run the whole script in the Supabase
   SQL editor.
4. Run the script again after any update here — it only adds, never drops.

The script is `src/lib/foundation.sql`.

5. Sign up at `/auth`, then make yourself the owner:
   `insert into public.user_roles (user_id, role) select id, 'super_admin' from auth.users where email = 'YOUR@EMAIL.COM' on conflict do nothing;`

## Faster direct link

Server jobs can use the Supabase **Transaction pooler** string (Connect →
Transaction pooler, port 6543) set as `DATABASE_URL` in the hosting
environment. It skips row security, so it is server-only and never pasted in
the browser. The browser keeps using the project URL and public key.

## Main tables

- People and access: `profiles`, `user_roles`, `organizations`
- Sales: `leads`, `contacts`, `identity_links`, `identity_review_queue`, `tasks`
- Work: `service_requests`, `providers`, `provider_categories`, `provider_payables`
- Money: `invoices`, `invoice_items`, `payments`, `expenses`
- Website: `cms_sections`, `cms_revisions`, `app_settings`
- Visits: `visitors`, `visitor_sessions`, `events`, `campaigns`, `attribution_touches`, `lead_events`
- Messages: `conversations`, `messages`, `message_templates`
- Outside services: `integrations`, `social_accounts`, `social_posts`, `webhook_events`
- Other: `automations`, `automation_runs`, `knowledge_entries`, `feedback`, `notifications`, `audit_logs`

## Rules kept in the database

- Row level security is on for every table. Only signed-in team members read
  business data.
- The public can insert a website lead and feedback, and read published
  website content and public knowledge entries. Nothing else.
- Money is stored as `numeric(14,2)`. Never a float, never inside a note.
- Notes are never the source of truth for a fact that has its own column.
