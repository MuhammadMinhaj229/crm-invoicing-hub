# SAFAR N MANZIL — One connected business system

Goal: keep everything already built, and connect it end to end so that one person
visiting the website can be followed all the way to a paid, happy, returning customer —
visible on a single customer page.

## Where we are today

Already working (keep, do not rebuild):

- Public website, plain-English copy, your coral logo, editable section by section in the CRM
- CRM shell with Dashboard, Website, Customers (Leads / Contacts / Churn), Vendors,
  Service Requests, Tools, Settings
- Settings: you paste your own database and tool keys, appearance and business rules
- Database setup script covering people, requests, invoices, messages, website content,
  tasks, integrations and an action history

Missing: website visitor tracking, the finance side, real WhatsApp messaging, social
connections, automatic follow-ups, reports, and the single customer timeline that ties
it all together.

## Decisions from you

- WhatsApp: one messaging layer with two swappable connections — start with the
  self-hosted one (QR login, your own number), official Meta route addable later with no rework
- Website tracking: full — visitors, sessions, pages, clicks, campaign source
- AI assistant: not in this round
- Social: a simple "Connect" screen; you add accounts when ready

## What gets built, in order

**A. Identity and event backbone**
Every website visitor gets an anonymous ID. Every action is stored as an event. The
moment someone gives a phone, email or sends a WhatsApp message, their earlier history
is attached to their customer record. If it is not certain who they are, nothing is merged —
it goes to a review list instead. Duplicate people are prevented by a single cleaned
phone/email key.

**B. Website intelligence**
Page views, service views, pricing views, FAQ, search, every WhatsApp / call / email /
form click, plus where they arrived from (Google, Instagram, a campaign link).
Collected in the background so the site stays fast; the site works fine if tracking fails.

**C. Customer 360 and timeline**
One page per customer: contact details, where they came from, everything they looked at,
every message, every request, invoices, payments, feedback, tasks, staff assigned —
in time order.

**D. Leads, scoring and follow-up**
Lead stages New → Qualified → Contacted → Interested → Quote → Negotiation → Converted,
plus Lost / Not interested / Spam / Duplicate. A scoring formula you can edit in Settings
(visit, service view, pricing view, WhatsApp click, repeat visit, form sent).

**E. Finance**
Invoices with line items, payments, expenses, partner payouts, profit — all tied to the
customer and the job, never to a note. Money stored exactly, never rounded. Invoify opens
with the customer and job already filled in.

**F. WhatsApp and unified inbox**
Connect your number, send and receive, full history, attachments, tags, assignment,
handover to a person. One inbox showing WhatsApp, website enquiries and social messages
side by side, each linked to the customer.

**G. Social connections**
A connector screen where each account is added, checked and reconnected in one place.
Only what each platform genuinely allows — nothing faked.

**H. Automation**
Rules you can edit: new enquiry → create person, lead, assign, notify, set follow-up;
job done → ask for feedback; lead untouched too long → escalate; connection broken → alert you.
Every run is logged, success or failure.

**I. Business knowledge**
Services, codes, prices, areas, hours, FAQs, policies, offers — stored once and read by
the website and the CRM, so a price is never written in two places.

**J. Command centre, reports and alerts**
Dashboard with today's visitors, new leads, open leads, conversions, money in, follow-ups
due, conversations, and where traffic came from. Reports for today / 7 / 30 days / custom.
Alerts for high-priority leads, SLA breaches, failed automations and broken connections.
Global search across people, phone, email, lead, service, job, message.

**K. Hardening and go-live**
Roles and permissions, action history, consent and data deletion, rate limits, signed and
repeat-proof webhooks, health panel, failure testing (expired token, provider down,
duplicate submission), then packaging for your three GitHub repos with deployment notes.

## Rules kept throughout

- Your own database only; you paste every key yourself in Settings
- No invented customers, leads, revenue, reviews or charts — true empty states
- SAFAR N MANZIL, SAFA FRESH and SAFA FOODS stay separate, with referrals allowed
- Notes are never the source of truth; invoices and requests are real records
- Nothing existing is deleted or rewritten without reason; changes are additive

## Technical notes

- Stack unchanged: TanStack Start, React, TypeScript, Tailwind, your Supabase. A later
  Laravel move would reuse the same PostgreSQL schema.
- New tables (added to the setup script, additive only): `visitors`, `visitor_sessions`,
  `events`, `identity_links`, `identity_review_queue`, `campaigns`, `attribution_touches`,
  `lead_events`, `lead_scores`, `social_accounts`, `social_interactions`, `automations`,
  `automation_runs`, `webhook_events`, `notifications`, `feedback`, `knowledge_entries`,
  `permissions`. Existing tables gain foreign keys, not replacements.
- Event ingestion: one public endpoint under `src/routes/api/public/`, signed, repeat-proof,
  batched and non-blocking; browser side uses `sendBeacon` with a queue.
- Messaging: a channel adapter interface (`connect / health / send / receive / handleWebhook`)
  with `evolution` and `meta-cloud` implementations behind it.
- Secrets stay server-side or in your Settings store; `.env.example` with placeholders only.
- Docs produced: `architecture.md`, `database.md`, `integrations.md`, `security.md`,
  `deployment.md`, `operations.md`, `troubleshooting.md`, plus an end-to-end acceptance report
  walking a real visitor through to feedback with evidence at each step.

## Things I will need from you along the way

1. Run the updated setup script in your database (I cannot run it for you)
2. Your WhatsApp number and, later, the self-hosted messaging server address
3. Social account connections, when you are ready
4. How you want the code delivered to GitHub: ready-to-push folders, or editor sync
