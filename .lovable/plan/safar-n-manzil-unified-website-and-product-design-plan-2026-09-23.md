# SAFAR N MANZIL Unified Website and Product Design Plan

## Goal
Elevate the existing SAFAR website into a professional, story-led family-assistance experience inspired by the referenced site, while preserving SAFAR’s current content, deliberate service scope, and business identity. Extend the same design language across the CRM and integrated tools, with all approved visual and content controls managed from CRM Settings.

## Locked design direction
- **Palette:** Reference Coral — `#FF9B70`, `#FFC2A3`, `#FFF8F3`, `#18294A`.
- **Typography:** Sora for headings and Manrope for body and interface text.
- **Structure:** Zigzag, story-led sections with meaningful family-assistance imagery.
- **Character:** Warm, human and reassuring like the reference, but more structured, credible and operationally professional.
- **Content rule:** Keep SAFAR’s current positioning and service categories. Do not invent reviews, ratings, customer counts, revenue, or other proof.
- **Shared system:** The website may be expressive and illustrated; CRM screens remain efficient and data-focused while sharing colour, typography, icons, controls and brand details.

## Phase 1 — Unified design foundation
- Consolidate public-site and CRM styling into one semantic design-token system.
- Add configurable tokens for brand colours, typography, spacing density, corner radius, buttons, fields, borders, shadows and navigation treatment.
- Preserve contrast, keyboard focus, reduced-motion support and mobile readability.
- Replace one-off visual styling with reusable branded primitives so every tool stays consistent.

## Phase 2 — Brand and visual assets
- Recreate the reference site’s expressive SAFAR identity as an original, production-ready logo lockup rather than copying source assets.
- Produce a cohesive set of relevant illustrations showing Gulf-based customers coordinating groceries, repairs, healthcare, documents and family support in India.
- Add CRM controls for logo, favicon, section imagery, image alt text and image replacement.
- Store assets through a deployment-safe project asset flow; no hotlinked or fragile external images.

## Phase 3 — Public website redesign
- Build a first viewport with the SAFAR identity, “We do. We assist. We connect.” positioning, a meaningful family-assistance visual and clear request action.
- Keep a visible hint of the next section on desktop and mobile.
- Recompose current content into alternating story sections:
  1. The Gulf-to-India coordination promise.
  2. Services for families back home.
  3. Verified local partners, clear pricing and proof of work.
  4. The request-to-completion process.
  5. Real testimonials only when published through the CRM.
  6. FAQ, contact request and WhatsApp action.
- Finish with a professional footer containing contact details, navigation, legal text and **Team login** linking to the CRM sign-in page.
- Avoid fabricated claims and remove any reference-site language that does not match SAFAR’s actual business.

## Phase 4 — Professional Website control desk
- Expand the existing editor from text-only fields into a visual content desk with desktop/mobile preview.
- Make section order, visibility, copy, calls to action, links, imagery, service entries, trust items, FAQs, contact details and footer content editable.
- Add draft, preview, publish, unpublish and revision restore states with clear status indicators.
- Add safe validation for links, phone numbers, required fields and image metadata.
- Keep structured content only; no arbitrary production HTML, CSS or scripts.

## Phase 5 — CRM and tools visual alignment
- Apply the same coral/navy identity, Sora/Manrope typography, branded logo treatment and interaction patterns to the CRM shell.
- Redesign navigation, page headings, filters, forms, data tables, empty states, status indicators, drawers and dialogs as a consistent operational system.
- Keep dashboards compact and scannable rather than copying the marketing layout.
- Apply the same system to Customers, Service Requests, Vendors, Finance, Invoify, WhatsApp, Social Scheduler and Business Intelligence as each tool is completed.
- Preserve true empty states and source-backed metrics only.

## Phase 6 — Settings-driven customization
- Extend **Settings → Appearance** with:
  - brand name, tagline, logo, favicon and monogram;
  - approved palette controls and accessible colour validation;
  - typography selection and scale;
  - corner radius, density, navigation and control styling;
  - website section layout and visibility controls;
  - reusable button, card and status styles;
  - live preview and restore-default actions.
- Persist shared settings centrally so all team members and deployments see the same approved configuration; browser storage may only be a temporary fallback.
- Separate public presentation settings from operational density settings so visual customization cannot harm CRM usability.

## Phase 7 — Production and deployment readiness
- Verify the website, login and CRM at desktop, tablet and mobile sizes.
- Check all actions, CMS publication states, links, forms, image loading and accessibility.
- Ensure environment-based connection settings, no exposed privileged keys, and Vercel-compatible assets and server behavior.
- Remove unrelated template content and unused visual code.
- Document the exact GitHub-to-Vercel deployment workflow and required environment variables for each repository.

## Acceptance criteria
- The public site is recognizably inspired by the referenced coral, illustrated SAFAR experience without being a direct copy.
- Existing SAFAR content and deliberate business scope remain authoritative.
- No fabricated proof or business data appears anywhere.
- Every public section can be managed professionally from the CRM.
- CRM and tools share one brand system while remaining efficient operational interfaces.
- The footer’s Team login opens the CRM authentication flow.
- The result works cleanly on mobile and desktop and is ready for GitHub/Vercel deployment.

## Technical notes
- Continue with the existing TanStack Start, React, TypeScript and Tailwind v4 stack in this workspace.
- Use semantic tokens in `src/styles.css`; never hardcode presentation colours in feature screens.
- Keep CMS content typed and revisioned in the existing structured section model.
- Move shared workspace appearance settings from local-only storage to the user’s connected database with role-controlled writes and read-safe public publication.
- Use original generated/commissioned imagery rather than copying protected assets from the referenced deployment.
