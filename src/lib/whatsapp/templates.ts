import { blueprint } from "../site/blueprint";

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

/** A short opener used by header, hero and floating buttons (wording from seed). */
export function generalEnquiryMessage(): string {
  return lines([`Hello ${blueprint.brand.name},`, "", ...blueprint.messages.enquiry]);
}

/** Opener for a specific service page. */
export function serviceEnquiryMessage(serviceTitle: string): string {
  return lines([`Hello ${blueprint.brand.name},`, "", `I need help with: ${serviceTitle}`, blueprint.messages.service]);
}

/** Full structured message composed from a contact form. */
export function detailedEnquiryMessage(fields: EnquiryFields): string {
  return lines([
    `Hello ${blueprint.brand.name},`,
    "",
    fields.name && `Name: ${fields.name}`,
    fields.livingIn && `Location: ${fields.livingIn}`,
    fields.familyCity && `City: ${fields.familyCity}`,
    fields.service && `Service: ${fields.service}`,
    fields.urgency && `How soon: ${fields.urgency}`,
    "",
    fields.message ? `Details: ${fields.message}` : blueprint.messages.enquiry.at(-1),
  ]);
}
