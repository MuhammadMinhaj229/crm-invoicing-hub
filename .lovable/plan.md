# SAFAR N MANZIL — Business Operating System: Build Plan

## One decision to settle first

The audit proposed Laravel. This workspace runs a different stack (TanStack Start + React + Lovable Cloud/Postgres), and Laravel cannot be hosted here. Two honest options:

- **Option A — Build here (recommended to start now).** The CRM, website CMS, customer/lead/churn desk, vendor directory, finance ledger and tools area are built on this stack with Lovable Cloud as the database, auth, storage and server functions. WhatsApp runs as a separate self-hosted Evolution API container on your own VPS, talking to this app over signed webhooks. Everything below is buildable immediately and scales on managed Postgres.
- **Option B — Laravel elsewhere.** I can only produce specs, schema, migrations and documentation for it here; the running system would be built and deployed outside Lovable.

The plan below assumes **Option A**. Say the word and I rewrite for B.

## What we build

### Navigation (exact structure you asked for)
```text
1. Dashboard        minimal: active tasks, urgent handoffs, today's revenue, pending inquiries
2. Website          CMS control desk (section editor, draft/publish/rollback)
3. Customers        Leads | Contacts | Churn & Retention
4. Vendors          service-man / partner directory, linked to work orders
5. Tools            Invoify | Social Scheduler | Business Intelligence | Finance | WhatsApp
```

### Data foundation (source of truth, no notes-as-data)
- `organizations` (SAFAR N MANZIL, SAFA FRESH, SAFA FOODS kept separate; every record carries `business_id`)
- `leads` (source, source_detail, campaign, assigned_to, status, service interest, location)
- `contacts` and `customers` (lifecycle LEAD → QUALIFIED → CONVERTED → CUSTOMER → ACTIVE → INACTIVE → CHURN_RISK → REACTIVATED)
- `service_requests`, `request_assignments`, `providers`, `provider_categories`
- `invoices`, `invoice_items`, `payments`, `expenses`, `provider_payables`, `transactions` — all money as `numeric(14,2)`, never floats, never JSON blobs
- `conversations`, `messages` (WhatsApp), `cms_pages`, `cms_sections`, `cms_revisions`
- `roles`, `permissions`, `audit_logs`
- Phone/email normalized to E.164 + lowercase on write, unique canonical index for dedup

### Security baked in from day one
Row-level security on every table, role-based policies (Super Admin, Admin, Ops Manager, Sales, Finance, Viewer), server-side-only secrets, HMAC-verified webhooks, rate-limited public lead/feedback endpoints, audit log on every destructive or financial action. The leaked service-role key in the old Invoify repo gets rotated and the old key revoked before any cutover.

## Phases

| Phase | Deliverable |
|---|---|
| 1 | Foundation: schema, RLS, roles, audit log, admin shell + secure login, design tokens |
| 2 | Customers: Leads with attribution, one-click convert, 360 contact profile |
| 3 | Churn & Retention: inactivity tracker, repeat-demand profile, auto follow-up tasks |
| 4 | Vendors & Partners: directory, rate cards, ratings, assignment history, wired to work orders |
| 5 | Service Requests / work orders desk: create → assign provider → track → complete |
| 6 | Finance: invoices, line items, payments, expenses, payables, profit; Invoify entry point with customer + request auto-fill |
| 7 | Website CMS: structured section editor (Hero, Services, Trust, How It Works, Testimonials, CTA, FAQ, Contact, Footer), draft/publish/rollback, public site reads from CMS |
| 8 | WhatsApp: Evolution API session, QR pairing, inbox, quick replies, paced broadcasts, idempotent webhooks |
| 9 | Tools: Business Intelligence charts, social scheduler integration, integration health panel |
| 10 | Migration, hardening, docs, go-live |

Each phase ships working, reviewable software. No fabricated customers, leads, invoices or revenue at any point — empty states are real empty states.

## Migration of existing data
Read-only export from the current Supabase project → normalize phones → dedupe contacts → extract invoice facts out of `contact_notes` into structured invoice rows → anything ambiguous lands in a review queue instead of being guessed. Nothing in the legacy project is mutated; old system stays live until you accept the cutover.

## Two answers I still need
1. Churn threshold: fixed 7 days, or per service type (grocery 7 days, legal/property 30 days)?
2. Finance: any specific investment heads or provider payout schemes to model beyond operating expenses and capital investment?

I can start Phase 1 without these; they're needed by Phase 3 and Phase 6.
