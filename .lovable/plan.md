# Website showcase with our own characters, then the remaining phases

## What I checked first

On a phone (393px) the site already fits — nothing spills sideways. What is weak is the *showing*: the page is mostly blocks of text, the artwork appears once at the top and once per service, and the people in the pictures are not the same people from picture to picture. In the hero our helper wears a navy polo with a lanyard; in the grocery picture he wears a cap and a different uniform, and the parents look different too. So the brand has no recognisable face yet.

## Part 1 — Make the characters permanent

Lock a small, fixed cast taken from the picture you gave and from the hero artwork, and use them everywhere — website, printed material later, and the CRM login screen.

**The cast**

| Character | Who | Fixed look |
|---|---|---|
| Imran | The son working in the Gulf | Light blue shirt, trimmed beard, phone in hand, Gulf skyline behind |
| Amma and Abba | His parents in India | Abba: white kurta, glasses, silver hair. Amma: coral saree, warm smile |
| Rehan | The SAFAR helper | Navy polo, SAFAR lanyard, clipboard, always the one doing the job |
| Fatima | The daughter/daughter-in-law abroad | Coral headscarf, phone, checking updates |

A written character sheet goes into the project so every future picture matches: same faces, same clothes, same colours, same flat illustrated style on cream and coral.

**New artwork (all with the same cast)**

- A wide "cast" picture: Imran and Fatima on one side, Amma and Abba at home on the other, Rehan in the middle connecting them
- Rehan delivering the grocery box to Amma and Abba (replaces the current mismatched one)
- Rehan taking Abba to the doctor
- Rehan fixing something at the house while Amma watches
- Rehan sending a photo update, Imran smiling at it on his phone
- A small square portrait of each character for the smaller cards

## Part 2 — Show the story properly on the page

New and upgraded sections on the home page, all driven by the CMS so you can edit every word:

1. **Hero** — bigger artwork on phones, headline first, then picture, then buttons; a soft coral shape behind the art so it feels designed, not pasted.
2. **"Who we help"** — three character cards (Imran, Fatima, Amma & Abba) saying in one line what each of them gets from us.
3. **Services as picture stories** — each service keeps its own scene with the same cast, image and words side by side on desktop, stacked on phones with the picture first.
4. **"How one job goes"** — a simple five-step strip with Rehan in each step: you ask → we confirm the price → Rehan does it → photos come to you → you pay. Horizontal on desktop, a clean vertical line on phones.
5. **"You always see what happened"** — a phone-shaped panel showing the kind of update message a family gets, drawn, not faked as a real chat log.
6. **Closing invite** — the cast picture with the WhatsApp and call buttons.

Nothing invented: no fake reviews, no invented numbers, no made-up names of real customers.

## Part 3 — Phone-first polish

- Bigger tap targets, text that never drops under 16px in body copy
- Pictures given proper width and height so the page does not jump while loading
- Artwork loaded only as it comes into view, small versions served to phones
- Menu drawer covering the full screen with large links and the "Ask for help" button pinned
- A sticky WhatsApp button at the bottom on phones only, so help is one thumb away
- Section spacing tightened on small screens so there is less endless scrolling
- Checked at 360px, 393px, 768px and desktop with real screenshots

## Part 4 — Continue the remaining phases

After the website work, in this order:

- **WhatsApp**: one messaging layer with two plug-ins — self-hosted first, official Meta later — connect, health check, send, receive, webhook handling, all keys entered by you in Settings
- **Unified inbox**: website enquiries, WhatsApp and later social in one list, each tied to the customer, with assignment, status and tags
- **Lead scoring**: a formula you can edit in Settings (service viewed, price viewed, came back, clicked WhatsApp, sent the form), score visible on every lead
- **Social connections**: a connector screen ready for Instagram, Facebook and Google Business, each showing honestly what it can and cannot do
- **Automation**: when this happens → check this → do this, with a run history
- **Business knowledge**: services, prices, areas, hours, FAQs in one place, read by the website and later by the assistant
- **Command centre**: one dashboard of visitors, leads, jobs, money and anything that failed
- **Hardening**: roles, audit log, consent, webhook signatures and repeat protection, health panel, failure tests
- **Documents and handover**: setup, database, integrations, security, deployment, operations, troubleshooting, plus the end-to-end test report and the three GitHub packages

## Technical notes

- Character sheet at `docs/characters.md`; artwork generated into `src/assets/` and imported directly so it is bundled and served fast.
- New CMS section types (`cast`, `journey`, `updates`) added to `src/lib/cms.ts` with safe defaults and matching editor controls; the home route renders them from CMS content, never hardcoded.
- Responsive work stays in the presentation layer — Tailwind classes, `srcset`/sizes, `loading="lazy"`, explicit intrinsic sizes. No change to data flow.
- The existing tracking already records service views, price views, button clicks and form sends; new sections get the same tracking so the new CTAs appear in Website Intelligence.
- Everything stays editable in Settings → Appearance (show/hide each section, layout, colours).

## What I need from you

- Run the latest setup script in your database (Settings → Connections) so the tracking and finance tables exist.
- Later, for WhatsApp and social: the connection details, entered by you in Settings. Never send keys to me in chat.
