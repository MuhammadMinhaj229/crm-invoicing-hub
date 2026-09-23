import type { SiteConfig } from "../types/site";

/**
 * SINGLE SOURCE OF TRUTH for business facts used by the public website.
 *
 * WHY contact fields are empty: we never publish an invented phone number or
 * email. The live values are entered by the team in the console (contact
 * section) and merged at runtime by `useSiteContact()`. Anything still empty
 * is simply not rendered.
 */
export const site: SiteConfig = {
  brand: {
    name: "SAFAR N MANZIL",
    tagline: "Help for your family in India, while you work in the Gulf",
    description:
      "We do the shopping, parcels, home repairs, hospital visits and paperwork for your family back home in India — with photos, updates and a clear price agreed before we start.",
    motto: "We do. We assist. We connect.",
  },
  contact: {
    whatsapp: "",
    phone: "",
    email: "",
    location: "",
  },
  location: {
    city: "",
    region: "",
    country: "India",
  },
  serviceAreas: [],
  hours: "We reply every day. Urgent family needs come first.",
  navigation: [
    { label: "Home", href: "/" },
    { label: "Services", href: "/services", hint: "What we can do for your family" },
    { label: "How it works", href: "/about", hint: "Who we are and how we work" },
    { label: "Questions", href: "/faq", hint: "Price, trust and timing" },
    { label: "Talk to us", href: "/contact", hint: "Send your request" },
  ],
  legalLinks: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ],
  cta: {
    primary: "Ask for help now",
    whatsapp: "Message us on WhatsApp",
    call: "Call us",
  },
};
