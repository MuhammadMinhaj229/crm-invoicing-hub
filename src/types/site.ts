/**
 * Site-level contracts.
 *
 * WHY: every UI component reads business facts through these types so that
 * contact details, navigation and legal copy exist in exactly one place
 * (`src/content/site.ts`) and can later be swapped for a CMS row without
 * touching presentation code.
 */

import type { LinkProps } from "@tanstack/react-router";

export interface NavigationItem {
  label: string;
  /** Typed against the generated route tree so dead links fail at build time. */
  href: NonNullable<LinkProps["to"]>;
  /** Short line used in the mobile drawer. */
  hint?: string;
}

export interface BusinessLocation {
  city: string;
  region: string;
  country: string;
}

export interface ContactChannels {
  /** Digits only, international format, no "+". Empty when not configured. */
  whatsapp: string;
  /** Free-form display number. Empty when not configured. */
  phone: string;
  email: string;
  location: string;
}

export interface SiteConfig {
  brand: {
    name: string;
    tagline: string;
    description: string;
    motto: string;
  };
  /** Defaults only. Live values come from the published contact section. */
  contact: ContactChannels;
  location: BusinessLocation;
  serviceAreas: string[];
  hours: string;
  navigation: NavigationItem[];
  legalLinks: NavigationItem[];
  cta: {
    primary: string;
    whatsapp: string;
    call: string;
  };
}
