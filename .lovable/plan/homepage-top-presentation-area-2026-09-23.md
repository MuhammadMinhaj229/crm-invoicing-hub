# Homepage top presentation area

## What will change
- Add the slim rotating message bar above the homepage navigation, including the supplied WhatsApp number.
- Restyle the homepage top as the framed presentation shown in the reference, using the existing SAFAR logo, coral brand colour, and current typography.
- Replace the current mobile menu with a proper slide-in drawer, backdrop, close control, and matching contact action.
- Keep navigation reliable by sending items to the existing Services, How it works, Questions, and Contact pages rather than adding broken links.
- Preserve the existing homepage content, visual page builder, CMS publishing, tracking, and contact form below this new top area.

## Technical details
- Build the interaction in the existing homepage route using React state and accessible controls.
- Use semantic theme colours and responsive Tailwind styles; add only the carousel animation to the shared stylesheet and disable it for reduced motion.
- Use the provided number through the existing WhatsApp URL helper rather than duplicating URL formatting logic.
- Verify desktop and mobile layouts, menu open/close behaviour, and browser console output.
