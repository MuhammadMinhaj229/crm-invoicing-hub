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

## Phase 4 — Churn automation (done)
- [x] One-click follow-up task per at-risk/churned customer (no duplicate open tasks)
- [x] Open follow-ups list with complete action; mark-reactivated; WhatsApp shortcut

## Phase 5 — Vendors & Partners directory (done)
- [x] Search, category/availability filters, add/edit/remove, rate card, rating, verification, WhatsApp link

## Phase 6 — Service Requests desk (done)
- [x] Create request for a customer, assign provider, priority/status tracking, completion timestamps

## Phase 7 — Finance (done)
- [x] Invoices with line items, exact two-decimal money, SNM-YYYY-#### numbering
- [x] Payments recorded against invoices, totals and status kept in step
- [x] Expenses and investments, partner payouts with settle action
- [x] Billed / received / outstanding / spent / invested / owed / profit summary

## Phase A — Visitor identity and event backbone (done)
- [x] visitors, visitor_sessions, events, identity_links, identity_review_queue
- [x] campaigns, attribution_touches, lead_events, feedback, notifications
- [x] social_accounts, automations, automation_runs, webhook_events, knowledge_entries
- [x] anon insert-only grants and policies for website tracking and enquiries

## Phase B — Website intelligence (done)
- [x] First-party tracker: visitor + session keys, UTM capture, queued non-blocking sends
- [x] Page views, CTA / phone / email clicks, form started and submitted
- [x] Website enquiry form writes a real lead with attribution touches

## Phase C — Customer 360 timeline (done)
- [x] Converting a lead attaches the anonymous browsing history to the person
- [x] Customer profile shows one timeline: website, requests, invoices, payments, tasks
- [x] CRM Website Intelligence screen: visitors, sources, top actions, visit journeys
## Phase 8 — DONE: Website CMS section editor (draft/publish/rollback/history) + public landing page rendered from CMS with footer team-login link
## Website and product design system — DONE
- [x] Original SAFAR brand mark, favicon and family-assistance artwork
- [x] Coral/navy story-led public website with responsive zigzag services
- [x] Shared website/CRM palette, type, controls and navigation language
- [x] Appearance controls for brand assets, palette, type scale, control shape, layout and section visibility
- [x] Shared database-backed appearance settings with local setup fallback
## Phase 9 — Messaging (done)
- [x] Adapter layer: own server (Evolution) and official Meta Cloud behind one interface
- [x] Send endpoint with clear failure states; messages never shown as sent when they are not
- [x] Incoming webhook with shared secret, idempotency and webhook_events log
- [x] Unified Inbox page: channels, search, thread, reply, link to a customer

## Phase 10 — Knowledge, automations, social, scoring (done)
- [x] Business Knowledge page (services, prices, areas, hours, questions, policies)
- [x] Automation engine and page: trigger, condition, action, run log
- [x] Social page: honest per-platform capabilities, connection state, post planner
- [x] Editable lead scoring in Settings, with warm/hot thresholds
- [x] Dashboard: visits, unread messages, hot leads, connection warnings

## Phase 11 — Docs and hardening (done)
- [x] README, architecture, database, integrations, security, deployment, operations, troubleshooting
- [x] .env.example with every server setting
- [x] Setup script upgrades older installs (additive only)
- [ ] Legacy data migration from the old invofy records (waiting on an export)

## Phase 12 — Package & push to GitHub repos (safar, safar-crm, invofy), go-live
- [ ] Waiting on the user: push method (GitHub sync in the editor, or ready-to-push folders)
- [ ] Waiting on the user: rotate the leaked service-role key in the invofy repository

## Open questions for user
1. Churn threshold: fixed 7 days or per service type?
2. Finance: specific investment heads / provider payout schemes?
3. GitHub: ready-to-push folders vs connecting GitHub sync in the editor?

## Public website architecture (done)
- `src/content/` — single source of truth: `site.ts` (brand, navigation, CTA labels), `services.ts` (catalogue), `faqs.ts`.
- `src/types/` — typed models for site, services and content.
- `src/lib/whatsapp/` — `url-builder.ts` (E.164 + encoding, null when unconfigured) and `templates.ts` (message builders).
- `src/lib/seo/json-ld.ts` — Organization, Service, ItemList, FAQPage and BreadcrumbList schemas generated from the content layer.
- `src/components/motion/primitives.tsx` — Reveal + AmbientBackground, CSS-only, reduced-motion aware.
- `src/components/layout/` — `page-shell.tsx` (header, footer, floating actions) and `page-intro.tsx` (breadcrumbs + page header).
- Routes: `/services`, `/services/$slug`, `/about`, `/faq`, `/contact`, `/privacy`, `/terms`, `/sitemap.xml`.
- Contact form: React Hook Form + Zod, honeypot field, lead recorded before WhatsApp handover.
- Contact channels stay empty until entered in the console; unconfigured channels are not rendered.

## Visual page builder (done)
- [x] Block model, shared renderer, every page + header menu editable, drag & drop sections and items
- [x] Inline text editing, settings panel, phone/tablet/desktop preview, undo/redo, autosave, publish/take down, version history
- [ ] Publishing live needs the database connected in Settings → Connections (waiting on the user)

## Homepage presentation header (done)
- [x] Framed top presentation, rotating promise bar, responsive navigation and slide-in mobile drawer
- [x] WhatsApp actions use the supplied +91 72070 71874 number
- Team access checklist, URL-only tool links, builder save button (done)

- Owner account + password change, one-tap device setup link (done)

## Emotional legacy website redesign (in progress)
- [x] Brand-first cinematic homepage, continuous care journey, interactive service stories
- [x] Trust dossier, price-before-work sheet, proof-return sequence, guided request
- [x] Outfit/Figtree and coral–teal visual foundation; exact deployed logo preserved
- [ ] New emotional-story blocks available in the visual page builder
- [ ] Supporting pages aligned to the new public visual system
- [ ] Desktop, mobile, keyboard and reduced-motion verification
