# SAFAR N MANZIL — Build Roadmap

Approved plan: .lovable/plan/safar-n-manzil-business-operating-system-build-plan-2026-09-23.md

## Phase 1 — Foundation (in progress)
- [x] SAFAR design tokens + typography
- [x] Supabase client (BYO project, env-driven)
- [x] Auth gate + sign-in page
- [x] Admin shell with sidebar: Dashboard / Website / Customers / Vendors / Tools / Settings
- [x] All six sections scaffolded with real empty states
- [x] Foundation SQL migration (schema + RLS + roles + audit log) for user's Supabase
- [ ] User adds SAFAR_SUPABASE_URL / SAFAR_SUPABASE_ANON_KEY / SAFAR_SUPABASE_SERVICE_ROLE_KEY secrets (form was declined; ask again at cutover)

## Phase 2 — Settings: integrations & API key hub
## Phase 3 — Customers: Leads / Contacts / 360 profile
## Phase 4 — Churn & Retention intelligence (threshold: open question, default 7 days)
## Phase 5 — Vendors & Partners directory wired to work orders
## Phase 6 — Service Requests desk
## Phase 7 — Finance: invoices, payments, expenses, payables, profit; Invoify entry point
## Phase 8 — Website CMS: section editor, draft/publish/rollback; public site from CMS
## Phase 9 — WhatsApp via Evolution API (QR session, inbox, broadcasts)
## Phase 10 — Tools: BI charts, social scheduler
## Phase 11 — Legacy data migration + hardening + docs
## Phase 12 — Package & push to GitHub repos (safar, safar-crm, invofy), go-live

## Open questions for user
1. Churn threshold: fixed 7 days or per service type?
2. Finance: specific investment heads / provider payout schemes?
3. GitHub: ready-to-push folders vs connecting GitHub sync in the editor?
