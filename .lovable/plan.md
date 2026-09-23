# SAFAR N MANZIL — Where we are, and what is left

This is the running status of everything we agreed from the start of the conversation, plus the sequence for the remaining work.

## One decision you should know about

Your brief names Laravel + PHP as the target platform. This workspace builds and runs TypeScript web applications only — a Laravel/PHP application cannot be built, run or previewed here. What we have been building instead is the same Business Operating System, same modules, same rules, same database (your own Supabase/PostgreSQL project), on the stack this environment supports.

Two honest options:

- **Continue as we are.** One system, working software you can see and use at every step, code packaged for your GitHub repos. PostgreSQL stays the source of truth, so a later move to Laravel would reuse the same database untouched.
- **Switch to Laravel.** Then this workspace can only produce written specifications, SQL schema and documentation — you or a PHP developer would write and run the application elsewhere.

Everything below assumes option one unless you say otherwise.

## Done so far

**Audit (Phase 0) — complete.** All three repositories cloned and reviewed line by line, and the full 34-section audit and target architecture report delivered, including these findings:

- The service-role key sits in the public Invoify repository — it bypasses all database protection. It must be regenerated and revoked in your Supabase dashboard.
- The website reads your database directly from the browser using a key embedded in the page.
- Invoify pushes invoices into the CRM through an unauthenticated endpoint and stores invoice facts inside contact notes — invoices were never real records.
- Invoices, providers and service categories are each defined twice in conflicting ways across 54 migration files.
- The public lead and feedback endpoints have no spam or abuse protection.

**Phase 1 — foundation.** Brand design system, application shell with your exact menu, sign-in, six sections with true empty states, and Settings → Connections: the in-CRM place where you paste your database and tool keys yourself, with save/test/disconnect and a one-click copy of the complete setup script (all tables, roles, security policies, three separate businesses, money as exact decimals, audit log).

**Phase 2 — everything configurable.** Business name, tagline, logo, full colour palette, corner radius, density, sidebar style, menu items, currency, language, lead sources, lead statuses, lifecycle stages, service categories and retention rules are all editable in Settings, applied live.

**Phase 3 — customers.** Leads with true origin and source detail, search and filter, status changes, one-click conversion that matches existing people by phone or email instead of duplicating them. Customer list with a click-through 360° profile: residence, India coordination address, service history, invoices, payments, lifetime value, outstanding, notes. Retention view: days since last order, what each customer repeatedly needs, at-risk and churn follow-up flags. Confirmed rule: quiet after 7 days for everyone.

## What is left

**Phase 4 — retention automation.** Automatic follow-up tasks when a customer goes quiet, reactivation logging, and the reason they didn't come back.

**Phase 5 — vendors and partners.** Full directory: trade category, service areas, verification, availability, rate card, ratings, documents, primary/backup, assignment history.

**Phase 6 — service requests desk.** Create a request, assign a verified serviceman, track through to completion, with handoffs and escalation.

**Phase 7 — finance.** Invoices as real records with line items, payments, expenses, provider payouts, refunds and profit — every figure exact, never from notes. Invoify opens with the customer and request already filled in. Per your answer, finance tracks everything money-related: money in, money out, money invested, money owed.

**Phase 8 — website control desk.** Editor for every section of the public site (Hero, Services, Trust, How It Works, Testimonials, CTA, FAQ, Contact, Footer) with draft, preview, publish and rollback, plus who published what. The public website then reads its content from here instead of being hand-edited HTML.

**Phase 9 — WhatsApp.** QR-based session (no Meta approval process), inbox tied to leads and customers, quick replies, paced broadcasts, duplicate-safe incoming messages.

**Phase 10 — tools.** Business intelligence charts, social media scheduler, tools health.

**Phase 11 — data migration and hardening.** Pull the real data out of the old system, extract invoice facts out of notes into proper invoices, normalise phone numbers, merge duplicates, send anything doubtful to a review list instead of guessing. Backups and a rollback path first; nothing in the old system is touched until you accept the switch.

**Phase 12 — delivery.** Clean the three repositories of everything unrelated to the business, package the finished code and hand it over for GitHub.

## Still waiting on you

1. Regenerate the leaked key in your Supabase dashboard and revoke the old one.
2. Paste your project URL and keys into Settings → Connections, then run the setup script once in your Supabase SQL editor.
3. Confirm the platform decision above.
