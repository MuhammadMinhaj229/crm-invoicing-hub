# SAFAR N MANZIL — Build Roadmap

Approved plan: .lovable/plan/safar-n-manzil-business-operating-system-build-plan-2026-09-23.md

## Phase 1 — Foundation (in progress)
- [x] SAFAR design tokens + typography
- [x] Supabase client (BYO project, env-driven)
- [x] Auth gate + sign-in page
- [x] Admin shell with sidebar: Dashboard / Website / Customers / Vendors / Tools / Settings
- [x] All six sections scaffolded with real empty states
- [x] Foundation SQL migration (schema + RLS + roles + audit log) for user's Supabase
- [x] Foundation SQL shipped inside app as copyable setup script (src/lib/foundation.sql)
- [x] Settings → Connections hub: Supabase card (save/test/disconnect + copy setup SQL) + WhatsApp/Invoify/Social/Finance integration cards
- [ ] User pastes Supabase keys in Settings → Connections, runs setup SQL in their Supabase SQL editor

## Phase 2 — Workspace settings core (done)
- [x] Settings model: branding, theme, nav, currency/locale, lead sources, lifecycle stages, service categories, retention rules
- [x] Live theme application + settings-driven sidebar and page chrome

## Phase 3 — Customers: Leads / Contacts / 360 profile (done)
- [x] Leads tab: add lead, source attribution + detail, search/filter, status change, one-click convert (dedup by normalised phone/email)
- [x] Contacts tab: searchable list, click-through 360° profile (residence, requests, invoices, payments, notes, lifetime value)
- [x] Churn & Retention tab: days quiet, repeat-demand profile, per-category thresholds from Settings

## Phase 4 — Churn automation: follow-up tasks + reactivation logging

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
