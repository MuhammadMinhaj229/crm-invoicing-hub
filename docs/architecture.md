# How the system is put together

One business system, not separate tools. The same database, the same
customer record, the same timeline everywhere.

## Parts

| Part | Where it lives | What it does |
| --- | --- | --- |
| Public website | `src/routes/index.tsx` | Everything on it comes from the Website content editor. No text is fixed in the code. |
| Website content | `src/lib/cms.ts`, `cms_sections`, `cms_revisions` | Draft, publish, history, restore. |
| Visitor tracking | `src/lib/analytics.ts`, `visitors`, `visitor_sessions`, `events` | First-party only. No outside tracker, no private identity. |
| Lead capture | `src/lib/website-capture.ts`, `leads`, `attribution_touches` | A form or a WhatsApp click creates a real lead with where it came from. |
| Customers | `src/lib/crm.ts`, `contacts`, `identity_links` | One person, one record. Phone and email are cleaned before matching. |
| Messages | `src/lib/messaging.ts`, `conversations`, `messages` | WhatsApp and social chats in one inbox, tied to the customer. |
| Money | `src/lib/finance.ts`, `invoices`, `invoice_items`, `payments`, `expenses`, `provider_payables` | Every amount comes from a record, never from a note. |
| Knowledge | `src/lib/knowledge.ts`, `knowledge_entries` | Services, prices, areas, hours, questions — written once. |
| Automations | `src/lib/automation.ts`, `automations`, `automation_runs` | When this happens, do that. Every run is saved. |
| Settings | `src/lib/workspace-settings.ts`, `app_settings` | Look, menu, currency, stages, retention rules, lead points. |

## The journey

```text
visit -> session -> events -> form or WhatsApp click -> lead
      -> conversation -> customer -> service request -> invoice
      -> payment -> feedback -> returning customer
```

Anonymous activity and known people stay apart until the person gives a
real signal: a form, a phone number, an email, a WhatsApp message or a
booking. Nothing is joined on a guess.

## Secrets

Keys for outside services live only on the server, in environment
variables. The browser never sees them. Database keys are pasted by the
owner in Settings and stay in that browser.
