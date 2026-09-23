# SAFAR N MANZIL — Business Operating System: Build Plan

## Stack decision (settled by your latest message)

- **Your own Supabase project is the database** — not Lovable's built-in one. The new code connects to your existing Supabase project (the one already shared by the CRM and Invoify) via environment keys you control.
- **Important first:** the service-role key currently in your Supabase project was leaked publicly inside the Invoify repo. Before anything goes live we generate a new one in your Supabase dashboard and revoke the old. I'll ask for the fresh keys once at setup through Lovable's secure secrets form — they never touch code or chat again.
- **Code lives in your GitHub repos.** I build and verify everything here first, then package the finished code for each repo (`safar` website, `safar-crm`, `invofy`) so it can be pushed to GitHub. Pushing itself needs your GitHub authorization — I can hand you clean, ready-to-commit folders, or you connect GitHub sync in the editor.

## Cleanup rule: nothing unrelated survives

Every leftover from the templates the CRM and Invoify were built on gets removed and documented: unused dashboard pages, demo features, extra language packs, unrelated AI utilities, marketing boilerplate. If a file, page, table or feature doesn't serve SAFAR N MANZIL, SAFA FRESH or SAFA FOODS, it's gone. No "extra mess" in the final system.

## What we build

### Navigation (exact structure you asked for)
```text
1. Dashboard        minimal: active tasks, urgent handoffs, today's revenue, pending inquiries
2. Website          CMS control desk (section editor, draft/publish/rollback)
3. Customers        Leads | Contacts | Churn & Retention
4. Vendors          service-man / partner directory, linked to work orders
5. Tools            Invoify | Social Scheduler | Business Intelligence | Finance | WhatsApp
6. Settings         integrations, API keys & access control  ← NEW
```

### Settings → Integrations & Access hub (new, per your request)
One professional screen where every external connection the business uses is managed:
- Supabase database connection (URL + keys)
- WhatsApp engine (Evolution API server address + key)
- Invoify connection, social scheduler, finance tool, BI tool
- Each integration shows: connected/paused/failed health, last successful call, and actions: **test connection, rotate key, reconnect, revoke**
- Keys are stored encrypted, server-side only — never in the browser, never in the repos
- Every credential change is recorded in the audit log (who, what, when)

### Data foundation (source of truth, no notes-as-data)
- `organizations` (SAFAR N MANZIL, SAFA FRESH, SAFA FOODS kept separate; every record carries `business_id`)
- `leads` (source, source_detail, campaign, assigned_to, status, service interest, location)
- `contacts` and `customers` (lifecycle LEAD → QUALIFIED → CONVERTED → CUSTOMER → ACTIVE → INACTIVE → CHURN_RISK → REACTIVATED)
- `service_requests`, `request_assignments`, `providers`, `provider_categories`
- `invoices`, `invoice_items`, `payments`, `expenses`, `provider_payables`, `transactions` — all money as `numeric(14,2)`, never floats, never JSON blobs
- `conversations`, `messages` (WhatsApp), `cms_pages`, `cms_sections`, `cms_revisions`
- `roles`, `permissions`, `integrations`, `audit_logs`
- Phone/email normalized to E.164 + lowercase on write, unique canonical index for dedup

### Security baked in from day one
Row-level security on every table, role-based access (Super Admin, Admin, Ops Manager, Sales, Finance, Viewer), server-side-only secrets, signed webhooks, rate-limited public lead/feedback endpoints, audit log on every destructive or financial action.

## Phases

| Phase | Deliverable |
|---|---|
| 1 | Foundation: connect your Supabase, new schema, row-level security, roles, audit log, admin shell + secure login, design tokens, **cleanup of all unrelated template leftovers** |
| 2 | Settings hub: integrations & API key management with health checks, test/reconnect/rotate |
| 3 | Customers: Leads with attribution, one-click convert, 360 contact profile |
| 4 | Churn & Retention: inactivity tracker, repeat-demand profile, auto follow-up tasks |
| 5 | Vendors & Partners: directory, rate cards, ratings, assignment history, wired to work orders |
| 6 | Service Requests / work orders desk: create → assign provider → track → complete |
| 7 | Finance: invoices, line items, payments, expenses, payables, profit; Invoify entry point with customer + request auto-fill |
| 8 | Website CMS: structured section editor (Hero, Services, Trust, How It Works, Testimonials, CTA, FAQ, Contact, Footer), draft/publish/rollback; public site reads from CMS |
| 9 | WhatsApp: Evolution API session, QR pairing, inbox, quick replies, paced broadcasts, idempotent webhooks |
| 10 | Tools: Business Intelligence charts, social scheduler integration |
| 11 | Data migration from the old CRM, security hardening, docs |
| 12 | Package & push finished code to your three GitHub repos, go-live |

Each phase ships working, reviewable software. No fabricated customers, leads, invoices or revenue at any point — empty states are real empty states.

## Migration of existing data
Read-only export from your current Supabase project → normalize phones → dedupe contacts → extract invoice facts out of `contact_notes` into structured invoice rows → anything ambiguous lands in a review queue instead of being guessed. The old system stays live until you accept the cutover.

## Answers I still need (not blockers for starting)
1. Churn threshold: fixed 7 days, or per service type (grocery 7 days, legal/property 30 days)?
2. Finance: any specific investment heads or provider payout schemes beyond operating expenses and capital investment?
3. GitHub: do you want me to prepare ready-to-push code folders for each repo, or will you connect GitHub sync from the editor?

## What you need to do before Phase 1 starts
1. In your Supabase dashboard: generate a **new** service-role key and anon key, and revoke the old leaked ones.
2. When I ask, paste the new keys into Lovable's secure secrets form (it opens when I trigger it — never paste keys in chat).
3. Confirm the churn and GitHub answers above.
