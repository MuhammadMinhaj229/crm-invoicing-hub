import { site } from "../../content/site";

export interface EnquiryFields {
  name?: string | undefined;
  livingIn?: string | undefined;
  service?: string | undefined;
  familyCity?: string | undefined;
  urgency?: string | undefined;
  message?: string | undefined;
}

function lines(parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join("\n");
}

/** A short opener used by header, hero and floating buttons. */
export function generalEnquiryMessage(): string {
  return lines([
    `Hello ${site.brand.name},`,
    "",
    "I live in the Gulf and I need help for my family in India.",
    "Please tell me how you can help and what it costs.",
  ]);
}

/** Opener for a specific service page. */
export function serviceEnquiryMessage(serviceTitle: string): string {
  return lines([
    `Hello ${site.brand.name},`,
    "",
    `I need help with: ${serviceTitle}`,
    "Please tell me what you need from me and what it will cost.",
  ]);
}

/** Full structured message composed from the contact form. */
export function detailedEnquiryMessage(fields: EnquiryFields): string {
  return lines([
    `Hello ${site.brand.name},`,
    "",
    fields.name && `Name: ${fields.name}`,
    fields.livingIn && `I live in: ${fields.livingIn}`,
    fields.familyCity && `My family is in: ${fields.familyCity}`,
    fields.service && `Help needed: ${fields.service}`,
    fields.urgency && `How soon: ${fields.urgency}`,
    "",
    fields.message ? `Details: ${fields.message}` : "Please tell me how you can help.",
  ]);
}
