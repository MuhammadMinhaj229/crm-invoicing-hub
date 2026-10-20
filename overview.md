# Safar Studio Repository Overview

## 1. High-Level Summary
**Safar Studio** is a modular monolith that serves as the visual website publishing platform for **SAFAR N MANZIL**. It elegantly combines two main responsibilities into a single deployable application:
1. **Public Website:** A server-rendered, highly performant marketing site.
2. **Visual CMS (Studio):** An authenticated, drag-and-drop page builder for editors.

Instead of relying on a third-party headless CMS, the project builds its own schema-driven content engine backed by Supabase. It strictly separates **content** (stored as structured JSON) from **behavior/rendering** (version-controlled React code), ensuring editors cannot inject arbitrary HTML or JavaScript.

## 2. Architecture & Design Principles
The repository strictly adheres to a set of robust engineering principles:
- **Modular Monolith:** Everything lives in one repository and deploys as one application (Vercel). It explicitly avoids microservices.
- **Strict Data Contracts:** Content is stored as bounded, validated documents. `src/lib/page-builder/schema.ts` uses **Zod** to enforce strict data shapes (e.g., maximum blocks, 2MB size limits, URL allow-lists) before anything hits the database or the browser.
- **Atomic Publishing:** Writing a draft and publishing it are separate. Supabase RPCs handle transactional publishing with expected-version checks to prevent editors from overwriting each other's work (stale-version conflict handling).
- **Database-Level Security:** Supabase Row Level Security (RLS) is the ultimate source of truth. Public visitors can only read `published` rows. Editors are verified via server-controlled `app_metadata.cms_role`, not client-side metadata.

## 3. Tech Stack
- **Framework:** React 19 + TanStack Start (SSR) + TanStack Router
- **Visual Editing:** Puck (`@puckeditor/core`)
- **Styling:** Tailwind CSS (v4) + Radix UI Primitives
- **Validation:** Zod (Runtime document validation)
- **Database & Auth:** Supabase (PostgreSQL, Supabase Auth)
- **Build / Tooling:** Vite, Bun (Package Manager & Test Runner), TypeScript
- **Deployment:** Vercel

## 4. Codebase Structure
- **`src/`** — The core application code.
  - **`routes/`**: File-based routing via TanStack Router. You'll find public routes (`index.tsx`, `about.tsx`, `contact.tsx`) and authenticated studio routes (`_authenticated/builder.tsx`).
  - **`lib/page-builder/`**: The heart of the CMS engine.
    - `schema.ts`: Zod schemas for every single block type.
    - `model.ts`: Default content models for blocks.
    - `seed.ts`: Logic for bootstrapping the initial database state.
  - **`components/page-builder/`**: Contains `block-renderer.tsx` which maps the structured JSON blocks from the database to actual React components.
- **`apps/public/`**: Contains the main entry point (`main.tsx`) and HTML shell for the public-facing site. It fetches data from Supabase and orchestrates the `BlockRenderer`.
- **`supabase/migrations/`**: Critical SQL files defining the CMS foundation, atomic page publish RPCs, locking down CMS access using RLS, and handling legacy schema cleanup.
- **`tests/`**: High-coverage test suite run via Bun (`bun test`), focusing heavily on critical paths like page document schema, access control, and webhook authentication.
- **`scripts/`**: Contains `bootstrap-cms.ts`, a one-time server script used to seed the Supabase database with initial content securely via a checksum verification.

## 5. Notable Engineering Highlights
- **Lovable Integration:** The project is tied to Lovable (noted in `AGENTS.md`). There is a strict rule against rewriting Git history (force pushes, rebases) to prevent breaking the Lovable project history synchronization.
- **Single Component Registry:** The Puck visual editor and the public website use the exact same component registry. This ensures 1:1 parity between what the editor sees in the builder and what the user sees on the live site.
- **WhatsApp Webhook:** Traces of an optional inbound WhatsApp webhook integration (`src/routes/api/public/whatsapp/webhook.ts`) guarded by verification tokens and Meta app secrets.
