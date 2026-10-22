import type { ServiceDefinition } from "../types/service";

/**
 * Canonical service catalogue. The homepage, the services pages, the WhatsApp
 * templates and the JSON-LD schema all read from here — there is no second
 * copy of a service name or description anywhere in the UI.
 */
export const services: ServiceDefinition[] = [
  {
    id: "groceries",
    slug: "groceries-and-gifts",
    title: "Groceries & gifts",
    shortDescription:
      "Weekly shopping, medicines and surprise gifts delivered to your parents' door.",
    description:
      "Your parents should not be carrying heavy bags or standing in queues. Tell us what they need — the monthly ration, fresh vegetables, medicines, or a gift for a birthday — and our person buys it and takes it to their home.",
    icon: "ShoppingBasket",
    features: [
      "Weekly or monthly grocery runs",
      "Medicines picked up from the pharmacy",
      "Gifts, sweets and flowers for special days",
      "Bill photo sent to you every time",
    ],
    deliverables: [
      "Shopping list confirmed with you on WhatsApp",
      "Photo of the items before delivery",
      "Original bill shared with you",
      "Delivery confirmation from your parents",
    ],
    process: [
      { step: 1, title: "You send the list", description: "A message with what is needed is enough." },
      { step: 2, title: "We confirm the cost", description: "We tell you the price before we buy." },
      { step: 3, title: "We shop and deliver", description: "Our person buys it and hands it over at home." },
      { step: 4, title: "You get the proof", description: "Photos and the bill come back to your phone." },
    ],
    pricingNote:
      "You pay the actual bill plus a service charge we agree with you before we start. Nothing is added later.",
    seo: {
      title: "Groceries & gifts for your parents in India",
      description:
        "Weekly groceries, medicines and gifts delivered to your parents in India, with the bill and photos sent to you in the Gulf.",
    },
  },
  {
    id: "repairs",
    slug: "home-repairs",
    title: "Trusted home repairs",
    shortDescription:
      "Plumbing, electrical, appliance and AC work done by people we have checked.",
    description:
      "The worry is not the broken tap. It is who walks into your parents' house. We send workers we have checked ourselves, we stay while the work happens, and we make sure your family is not overcharged.",
    icon: "Home",
    features: [
      "Plumbing, electrical and carpentry",
      "AC, fridge and washing machine repair",
      "Painting and small renovation work",
      "Our coordinator stays during the visit",
    ],
    deliverables: [
      "Problem understood over a call or photo",
      "Estimate shared with you before work starts",
      "Photos during and after the work",
      "Final bill with no hidden additions",
    ],
    process: [
      { step: 1, title: "You describe the problem", description: "A photo or voice note works." },
      { step: 2, title: "We inspect", description: "Our person visits and sends you an honest estimate." },
      { step: 3, title: "We supervise the work", description: "Nobody is left alone with your parents." },
      { step: 4, title: "We show you the result", description: "Photos of the finished work reach you." },
    ],
    pricingNote:
      "Material cost plus the worker's charge, both shown to you before the work begins.",
    seo: {
      title: "Trusted home repairs for your family's house in India",
      description:
        "Checked plumbers, electricians and technicians for your parents' home in India, supervised and priced honestly.",
    },
  },
  {
    id: "medical",
    slug: "medical-and-errands",
    title: "Medical visits & errands",
    shortDescription:
      "Safe transport, hospital company and the small errands nobody should do alone.",
    description:
      "Hospital days are long and confusing. Our person picks your parents up, stays with them through the queue, helps with the forms, collects the reports and sends you an update the same day.",
    icon: "Stethoscope",
    features: [
      "Transport to and from the hospital",
      "Someone with them during the appointment",
      "Reports and prescriptions collected",
      "Bank, post office and local errands",
    ],
    deliverables: [
      "Appointment day and time confirmed with you",
      "Update message while they are at the hospital",
      "Photos of reports and prescriptions",
      "A short summary of what the doctor said",
    ],
    process: [
      { step: 1, title: "You tell us the appointment", description: "Or ask us to arrange one." },
      { step: 2, title: "We arrange safe transport", description: "Pick-up from home, drop back home." },
      { step: 3, title: "We stay with them", description: "Through the queue, the forms and the doctor." },
      { step: 4, title: "You get the update", description: "Reports and what happened, same day." },
    ],
    pricingNote:
      "Transport cost plus a companion charge for the hours used, agreed before the day.",
    seo: {
      title: "Hospital visits and errands for elderly parents in India",
      description:
        "Safe transport, hospital company and daily errands for elderly parents in India, with same-day updates for families in the Gulf.",
    },
  },
  {
    id: "parcels",
    slug: "parcels-and-deliveries",
    title: "Parcels & deliveries",
    shortDescription: "Sending something home, or collecting something for you.",
    description:
      "Documents, medicines, a package waiting at a courier office, or something that needs to reach a relative in another city. We pick it up, pack it, send it and track it until it arrives.",
    icon: "PackageCheck",
    features: [
      "Pick-up from home or a courier office",
      "Packing and dispatch",
      "Tracking shared with you",
      "Delivery confirmation with a photo",
    ],
    deliverables: [
      "Pick-up confirmation",
      "Tracking number shared on WhatsApp",
      "Delivery photo",
    ],
    process: [
      { step: 1, title: "Tell us what and where", description: "Address and contact are enough." },
      { step: 2, title: "We collect and pack", description: "Carefully, with a photo before dispatch." },
      { step: 3, title: "We track it", description: "You get the tracking and the delivery proof." },
    ],
    pricingNote: "Courier charges plus a small handling charge, told to you upfront.",
    seo: {
      title: "Parcel pick-up and delivery help in India",
      description:
        "We collect, pack, send and track parcels for families living in the Gulf, with delivery proof sent back to you.",
    },
  },
  {
    id: "paperwork",
    slug: "paperwork-and-documents",
    title: "Paperwork & documents",
    shortDescription: "Government offices, bills, renewals and the queues that go with them.",
    description:
      "Certificates, pension paperwork, bill payments, document collection, attestation runs — the tasks that take a full day of standing in line. We do the running so your parents do not have to.",
    icon: "FileCheck2",
    features: [
      "Office visits and queue standing",
      "Bill and tax payments",
      "Document collection and submission",
      "Copies of everything sent to you",
    ],
    deliverables: [
      "List of what is required, confirmed first",
      "Receipts and acknowledgements photographed",
      "Final document handed over or couriered",
    ],
    process: [
      { step: 1, title: "You tell us the task", description: "We check what documents are needed." },
      { step: 2, title: "We do the running", description: "Office visits, queues, submissions." },
      { step: 3, title: "You get every receipt", description: "Photographed and sent to you." },
    ],
    pricingNote:
      "Official fees at actual cost plus a charge for the time used, agreed beforehand.",
    seo: {
      title: "Document and government paperwork help in India",
      description:
        "We handle office visits, bill payments, renewals and document collection in India for families living abroad.",
    },
  },
  {
    id: "property",
    slug: "property-checks",
    title: "Property checks",
    shortDescription: "Someone to look in on the house, land or flat you left behind.",
    description:
      "An empty house needs eyes on it. We visit, check the locks, water and condition, meet the caretaker or tenant if needed, and send you a photo record of every visit.",
    icon: "ShieldCheck",
    features: [
      "Scheduled visits to your property",
      "Photo record of each visit",
      "Meeting caretakers or tenants",
      "Small maintenance arranged when needed",
    ],
    deliverables: [
      "Visit date agreed with you",
      "Photo set from every room or corner",
      "A short written note on the condition",
    ],
    process: [
      { step: 1, title: "You share the address", description: "And what you want checked." },
      { step: 2, title: "We visit", description: "On the schedule you choose." },
      { step: 3, title: "You get the record", description: "Photos and a short honest note." },
    ],
    pricingNote: "A per-visit charge based on distance, agreed before the first visit.",
    seo: {
      title: "Property and house checks in India for NRI owners",
      description:
        "Scheduled visits to your house, flat or land in India with a photo record sent to you after every visit.",
    },
  },
];

export function findService(slug: string): ServiceDefinition | undefined {
  return services.find((service) => service.slug === slug);
}
