# Visual Website Builder in the CRM

## Goal
Replace the current form-based Website editor with a visual, WordPress/Word-style builder. You edit the real website on screen, drag sections and buttons around, preview on phone and desktop, then publish live with one click.

## What you will be able to do
- **Edit on the page itself:** click any heading, paragraph, button label, image or link and change it in place, like typing in a Word document.
- **Drag and drop sections:** reorder whole sections (hero, services, how it works, questions, contact, footer) by dragging them up or down.
- **Drag and drop items inside a section:** move buttons, cards, service entries, questions and images within a section, or from one column to another.
- **Add from a block library:** insert new blocks anywhere: heading, text, image, button, button row, image + text (left/right), card grid, question list, spacer, divider, WhatsApp/call strip, video embed.
- **Adjust layout per block:** alignment, width (narrow/normal/full), columns (1–4), spacing above/below, background (from brand colours), image side, hide on phone / hide on desktop.
- **Button settings:** label, link (page, section, WhatsApp, phone, email, external), style (solid/outline/text), size.
- **Duplicate, hide, lock, delete** any block; undo/redo; autosave to draft.
- **Every page editable:** Home, Services, each service page, How it works, Questions, Talk to us, Privacy, Terms, plus header menu and footer.
- **Preview then publish:** switch between desktop / tablet / phone preview, open a full preview link, then Publish. Revision history with restore stays.

## Layout of the editor
```text
+-----------+-------------------------------+-------------+
| Pages &   |                               | Block       |
| Layers    |   Live page canvas            | settings    |
| (tree,    |   (click to edit, drag to     | (text, link,|
|  drag)    |    move, + to insert)         |  layout)    |
+-----------+-------------------------------+-------------+
  Toolbar: Page ▾ | Desktop Tablet Phone | Undo Redo | Preview | Publish
```

## Rules kept
- Structured blocks only; no raw code can be pasted, so the site cannot be broken.
- Brand colours and fonts come from Settings → Appearance; blocks pick from them.
- No invented content: empty contact details still stay hidden until you fill them.
- Current website content is converted into blocks automatically, so nothing is lost.

## Technical details
- New block document model per page: `{ page, blocks: Block[] }`, each block `{ id, type, props, children?, layout }`, validated with Zod; stored in the existing CMS content/revision tables (additive migration adding a `page_documents` jsonb column/table with draft + published versions and RLS: public read published, team write).
- Single `BlockRenderer` used by both the public routes and the editor canvas, so preview equals live.
- Drag and drop with `@dnd-kit/core` + `@dnd-kit/sortable` (nested sortable containers); inline text via contentEditable with plain-text sanitising.
- Migration adapter converts existing section content and `src/content/*` defaults into initial block documents; public routes fall back to these defaults when no published document exists.
- Editor state: reducer with undo/redo history, debounced draft autosave, publish writes a revision.
- Header navigation and footer become editable global documents.
- Verification: Playwright checks of drag reorder, inline edit, publish and live render at 393px and 1280px.

## Delivery order
1. Block model, renderer, conversion of current content (site looks identical).
2. Editor canvas with inline editing, settings panel, device preview.
3. Drag and drop for sections and inner items, block library, undo/redo.
4. All pages + header/footer, publish/revisions, database update script.
