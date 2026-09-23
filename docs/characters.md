# SAFAR N MANZIL character sheet

These characters are permanent. Every new picture for the website, CRM or social
posts must use the same people, clothes and colours so families recognise us.

## Style

- Flat vector illustration, soft rounded shapes, no photos, no 3D.
- Colours: coral `#FF9B70`, light coral `#FFC2A3`, cream `#FFF8F3`, navy `#18294A`.
- Warm, calm, everyday scenes. No logos of other brands, no fake certificates,
  no invented numbers or reviews inside the artwork.

## The cast

| Character | Who they are | Look |
| --- | --- | --- |
| Imran | The son working in the Gulf | Late 20s, short beard, light blue shirt, holding a phone |
| Fatima | The daughter living abroad | Late 20s, mustard headscarf, cream kurta, phone in hand |
| Amma | Mother at home in India | 60s, grey hair in a bun, teal saree, glasses |
| Abba | Father at home in India | 60s, white kurta, white cap, walking stick |
| Rehan | Our helper on the ground | 30s, navy polo shirt, ID card on a lanyard, cloth bag |

Rehan wears the navy polo and the ID lanyard in **every** scene. He is the face
of the service at the door.

## Scenes we already have (`src/assets/`)

- `safar-cast.png` — the whole family across two countries
- `safar-story-groceries.png` — Rehan handing groceries to Amma and Abba
- `safar-story-health.png` — Rehan taking a parent to the doctor
- `safar-story-repairs.png` — a repair at home with Rehan taking photos
- `safar-updates.png` — Imran seeing the photo update on his phone
- `safar-face-son.png`, `safar-face-daughter.png`, `safar-face-parents.png` — round portraits

## Rules for new pictures

1. Same cast, same clothes, same colours.
2. No text inside the picture (text belongs in the page, so it stays editable).
3. Save at `src/assets/safar-*.png`, import it, add `loading="lazy"` unless it
   is the first picture on the page, and always set `width` and `height`.
