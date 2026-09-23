# Safar N manzil — Brand Story, CRM Contact Controls, Social Links and Invoice Proof Plan

## Goal
Rebuild the public experience around the supplied Safar N manzil campaign language: warm editorial illustrations, large navy-and-coral typography, hand-written emotional notes, Gulf-to-India visual continuity, and one clear WhatsApp-led journey.

The work will preserve the current TanStack Start application, CRM, CMS, page builder, analytics, service routes, and database model. It will not introduce invented claims, public contact details, testimonials, prices, locations, or social accounts.

## Aligned architecture

```text
CRM SETTINGS / WEBSITE BUILDER
  Brand identity
  Contact channels
  Social profile links
  Story slides and captions
  Invoice proof presentation
  Draft → Preview → Publish
             │
             ▼
SHARED, TYPED CONTENT
  Workspace settings + published CMS/page documents
  Validation for URLs, phone numbers, image alt text and visibility
  Empty values remain hidden on the public site
             │
             ▼
PUBLIC EXPERIENCE
  One branded floating navigation
  Emotional opening
  We understand
  Shape-based story slider
  One request, one clear journey
  Services → trust → price approval → sample invoice → proof
  Contact, floating WhatsApp/call actions, social footer
             │
             ▼
MEASUREMENT AND SAFETY
  Existing first-party CTA analytics
  Reduced-motion and keyboard support
  No sensitive invoice data or unsupported trust claims
```

## 1. Rebuild the visual system around the supplied brand theme
- Use the uploaded campaign pieces as the visual reference for composition: warm ivory canvas, deep navy/ink typography, vivid coral emphasis, restrained peach shapes, hand-written annotations, simple line icons, and clean editorial illustration.
- Keep the exact brand casing: `Safar N manzil`.
- Use the existing official logo asset as the primary mark; refine its sizing and background treatment so it sits naturally in both the navigation and footer.
- Retain one navigation only. Make it a polished floating glass bar on desktop and a clean sheet on mobile.
- Replace the current small supporting copy with a more readable type scale: large display statements, 18–20px primary body copy where space allows, and no tiny low-contrast content.
- Keep coral as the action/emphasis colour, navy/ink for authority, ivory for breathing room, and green only for the familiar WhatsApp action—not as a competing page colour.
- Remove visual noise: no unrelated gradients, excessive dark/light switching, generic SaaS cards, or repeated pill treatments.

## 2. Restructure the homepage into one continuous emotional story
The authored homepage and the builder’s default homepage will use the same sequence and visual components:

1. **Opening frame** — brand-led Gulf-to-India promise, strong headline, one primary WhatsApp/request action, and one secondary journey action.
2. **We understand** — the emotional reality of supporting family from abroad, expressed without guilt manipulation.
3. **Campaign story slider** — inserted exactly between “We understand” and “One request. One clear journey.”
4. **One request, one clear journey** — message, understand, coordinate, approve, complete, and update.
5. **Service stories** — groceries, home repairs, medical support, documentation, transport, family assistance, gifts, and other genuine supported needs.
6. **Control and trust** — what is confirmed, priced, approved, handled, and returned as proof.
7. **Example invoice** — a clearly labelled, privacy-safe visual example of itemised costs and the Safar assistance fee.
8. **Proof returned** — photos, bills, status and completion update.
9. **Questions and contact** — clear answers followed by the guided enquiry form.

## 3. Add the shape-based campaign slider
- Build a dedicated `storyCarousel`/campaign-story block shared by the authored homepage and visual builder.
- Use layered organic/circular image masks inspired by the uploaded creatives rather than plain rectangular slides.
- Provide swipe, drag, previous/next controls, pagination, keyboard navigation, pause on interaction, and accessible slide labels.
- Autoplay slowly only when motion is allowed; pause when off-screen, hovered, focused, or when the browser requests reduced motion.
- Use only suitable supplied artwork. The testimonial creative will not publish unless the quote is verified and consented. Artwork containing religious markings will not be used unchanged, respecting the established brand constraint.
- Keep text live and editable instead of baking important headings into images. Uploaded images remain illustrative support.
- Make each slide independently editable, reorderable, hideable, and previewable in the CRM builder.

## 4. Make contact CTAs CRM-controlled
- Add a clear **Public contact channels** panel in CRM Settings with fields for:
  - WhatsApp number
  - Calling number
  - Public email
  - Location/service-area line
  - Optional availability text
- Inputs will show examples as placeholders only. Placeholder numbers will never become public links or saved business facts.
- Normalize WhatsApp/call values for links while preserving readable display values.
- Drive the header WhatsApp action, enquiry handoff, floating WhatsApp/call actions, contact page and footer from the same published values.
- Hide unconfigured actions instead of linking to a dummy number.
- Show a compact CRM preview of exactly how each public action will appear before publishing.

## 5. Add public social links to CRM Settings
- Add a separate **Social profile links** editor for Instagram, Facebook, LinkedIn, YouTube, X, and Google Business Profile, plus a safe custom-link option.
- Each row supports platform, public URL, accessible label, enabled state, and ordering.
- Validate allowed HTTPS URLs and render only configured/enabled profiles.
- Show social icons in the footer and, where appropriate, the mobile navigation—without crowding the primary conversion path.
- Keep these public profile links separate from social API credentials and scheduling connections. No password, token, or secret will be stored in a public setting.
- Mirror the settings through the existing shared workspace configuration so approved values follow the team across devices once the user’s database is connected.

## 6. Add a privacy-safe invoice example
- Use the uploaded invoice only as a layout/content reference.
- Do not expose its customer name, address, email, phone, bank account, UPI ID, QR code, signature, invoice number, or exact transaction.
- Create a responsive “Example cost breakdown” presentation with clearly fictional labels and neutral placeholders—not a downloadable financial document and not a fabricated completed job.
- Show the intended information hierarchy: task, outside cost, service/inspection cost, Safar assistance fee, total, approval state, and proof/bill status.
- Link the example to the existing price-before-work and proof-return story so it demonstrates transparency rather than acting as a claim.
- Keep all example labels and rows editable in the builder.

## 7. Extend the visual builder and publishing model
- Add editable blocks for the story carousel and invoice example.
- Support text, image URL, alt text, slide/item ordering, visibility, CTA label/link, and section spacing using the existing structured block system.
- Update default homepage documents without overwriting an already-published customer document automatically.
- Keep explicit **Save draft**, responsive preview, **Publish**, revision history and rollback behaviour.
- Ensure the authored fallback and builder-rendered page share the same final components and design tokens so publishing does not switch to an older visual language.

## 8. Navigation, footer and supporting pages
- Refine the shared header, footer, page introductions, floating actions, service pages, About, FAQ and Contact to the same ivory/navy/coral system.
- Navigation and footer will use the same official logo treatment and the exact brand casing.
- Footer groups: brand promise, useful links, configured contact channels, configured social profiles, legal links and team login.
- Preserve separate routes and route-specific metadata; do not add unrequested Work/Blog routes or fake case studies from the generic blueprint.

## 9. SEO, accessibility and performance
- Keep unique metadata on every existing public route, valid canonical paths, semantic landmarks, sitemap and robots handling.
- Do not add `LocalBusiness` geo, service areas, phone numbers or addresses until genuine CRM values exist.
- Add JSON-LD only from verified published fields and omit empty properties.
- Use meaningful alt text, visible focus states, 44px minimum targets, proper carousel semantics and full keyboard operation.
- Maintain responsive image dimensions to prevent layout shifts.
- Use the existing lightweight CSS/IntersectionObserver motion layer rather than adding a heavy animation dependency.
- Remove manually written browser prefixes from backdrop effects so production rendering remains consistent.

## 10. Verification
- Verify the authored and builder-published homepage at mobile, tablet and desktop widths.
- Test carousel swipe, arrows, pagination, keyboard controls, autoplay pause and reduced-motion behaviour.
- Test empty, partially configured and fully configured contact/social states.
- Confirm no placeholder phone or social URL appears publicly.
- Confirm one header, readable type, no clipped text, no overlapping floating actions and no horizontal scrolling.
- Test Save draft → Preview → Publish → public refresh, plus revision rollback when the user’s database is available.
- Run targeted type checks, production build checks, route checks, and browser console/network validation.

## Important content safeguards
- The supplied testimonial artwork is a reference only until the quote and attribution are confirmed as genuine and consented.
- Religious symbols/markings remain excluded from published Safar artwork.
- The uploaded invoice’s private customer and payment details will never be copied into the public website.
- CRM placeholders are guidance only; public contact and social actions appear only after real values are saved and published.
